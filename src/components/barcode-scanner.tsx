"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard, LoaderCircle, RefreshCw, ScanLine, X } from "lucide-react";
import { Button, Input } from "./ui";
import { lookupProduct, type ProductLookupResult } from "@/lib/product-lookup";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;
declare global { interface Window { BarcodeDetector?: BarcodeDetectorConstructor; } }

export function BarcodeScanner({ onDetected, onClose }: { onDetected: (product: ProductLookupResult) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const [status, setStatus] = useState<"starting"|"scanning"|"unsupported"|"blocked"|"manual"|"lookup">("starting");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  const stop = useCallback(() => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; }, []);

  const resolve = useCallback(async (code: string) => {
    stop(); setStatus("lookup"); setError("");
    try { onDetected(await lookupProduct(code)); }
    catch (caught) { detectedRef.current = false; setStatus("manual"); setManualCode(code); setError(caught instanceof Error ? caught.message : "Product lookup failed."); }
  }, [onDetected, stop]);

  const start = useCallback(async () => {
    stop(); detectedRef.current = false; setError(""); setStatus("starting");
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) { setStatus("unsupported"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream; const video = videoRef.current; if (!video) { stop(); return; }
      video.srcObject = stream; await video.play();
      const detector = new window.BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128"] });
      setStatus("scanning"); let lastScan = 0;
      const scan = async (time: number) => { if (detectedRef.current || !videoRef.current) return; if (time-lastScan >= 250 && video.readyState >= 2) { lastScan=time; try { const code=(await detector.detect(video))[0]?.rawValue?.trim(); if(code){detectedRef.current=true; await resolve(code); return;} } catch {} } frameRef.current=requestAnimationFrame(scan); };
      frameRef.current=requestAnimationFrame(scan);
    } catch { stop(); setStatus("blocked"); }
  }, [resolve, stop]);

  useEffect(() => { void start(); return stop; }, [start, stop]);
  async function submitManual(event: React.FormEvent) { event.preventDefault(); const code=manualCode.trim(); if(code) await resolve(code); }

  return <div className="fixed inset-0 z-[115] flex items-end bg-black/70 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="barcode-scanner-title"><section className="w-full max-w-md rounded-t-[2rem] bg-[#faf8f1] p-5 shadow-2xl sm:rounded-[2rem]"><header className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#486957]">Product lookup</p><h2 id="barcode-scanner-title" className="mt-1 text-2xl font-black">Scan barcode</h2></div><button type="button" onClick={()=>{stop();onClose();}} aria-label="Close barcode scanner" className="grid h-11 w-11 place-items-center rounded-xl border bg-white"><X size={20}/></button></header><div className="relative mt-5 overflow-hidden rounded-3xl bg-[#16231d]"><video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover"/><div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80"/></div><p role="status" className="mt-4 rounded-2xl bg-[#f4f6f2] p-3 text-sm text-[#315b46]">{status==="starting"&&<><Camera className="mr-2 inline" size={16}/>Requesting camera...</>}{status==="scanning"&&<><ScanLine className="mr-2 inline" size={16}/>Point the camera at a product barcode.</>}{status==="lookup"&&<><LoaderCircle className="mr-2 inline animate-spin" size={16}/>Looking up product...</>}{status==="unsupported"&&<><CameraOff className="mr-2 inline" size={16}/>Automatic scanning is unsupported. Enter the code below.</>}{status==="blocked"&&<><CameraOff className="mr-2 inline" size={16}/>Camera access is unavailable. Enter the code below.</>}{status==="manual"&&<><Keyboard className="mr-2 inline" size={16}/>Enter the printed barcode number.</>}</p>{error&&<p role="alert" className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" disabled={status==="lookup"} onClick={()=>void start()}><RefreshCw className="mr-2 inline" size={16}/>Retry camera</Button><button type="button" disabled={status==="lookup"} onClick={()=>{stop();setStatus("manual");}} className="min-h-11 rounded-2xl border bg-white px-3 font-bold text-[#315b46]"><Keyboard className="mr-2 inline" size={16}/>Enter code</button></div><form onSubmit={submitManual} className="mt-4"><label className="text-sm font-bold">Barcode number<Input value={manualCode} onChange={e=>setManualCode(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="012345678905" className="mt-1"/></label><Button disabled={!manualCode.trim()||status==="lookup"} className="mt-3 w-full">Look up product</Button></form><p className="mt-4 text-xs leading-5 text-[#718078]">Product data is supplied by Open Food Facts. Review the populated fields before saving.</p></section></div>;
}
