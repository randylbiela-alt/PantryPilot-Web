"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, FileImage, Pencil, RefreshCw, ScanText, Trash2, X } from "lucide-react";
import { receiptApi, type OcrReceiptItem, type ReceiptImportResult } from "@/lib/receipt-api";
import { Button, Input } from "./ui";

type ReviewItem = OcrReceiptItem & { id: string; selected: boolean };
type Step = "upload" | "analyzing" | "review" | "importing" | "complete";
const mimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The receipt image could not be read."));
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes("base64,") ? value.slice(value.indexOf("base64,") + 7) : value);
    };
    reader.readAsDataURL(file);
  });
}

export function ReceiptImport({ onChooseItem: _onChooseItem, onClose }: {
  onChooseItem: (item: { name: string; quantity: number }) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [step, setStep] = useState<Step>("upload");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [message, setMessage] = useState("Choose or photograph a receipt to begin.");
  const [result, setResult] = useState<ReceiptImportResult | null>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  const selectedCount = useMemo(() => items.filter(item => item.selected).length, [items]);

  function chooseFile(next?: File) {
    if (!next) return;
    if (!mimeTypes.includes(next.type as typeof mimeTypes[number])) { setMessage("Choose a JPEG, PNG, or WebP receipt image."); return; }
    if (next.size > 8 * 1024 * 1024) { setMessage("Receipt images must be 8 MB or smaller."); return; }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(next); setImageUrl(URL.createObjectURL(next)); setItems([]); setResult(null); setStep("upload");
    setMessage("Receipt ready. Analyze it to detect purchased items.");
  }

  async function analyze() {
    if (!file) return;
    setStep("analyzing"); setMessage("PantryPilot is reading the receipt...");
    try {
      const analysis = await receiptApi.analyze(await fileToBase64(file), file.type as typeof mimeTypes[number]);
      setMerchantName(analysis.merchantName); setPurchaseDate(analysis.purchaseDate);
      setItems(analysis.items.map((item, index) => ({ ...item, id: `${index}-${item.name}`, selected: true })));
      setStep("review");
      setMessage(analysis.items.length ? `${analysis.items.length} item${analysis.items.length === 1 ? "" : "s"} detected. Review before importing.` : "No items were detected. Try a clearer photo.");
    } catch (error) { setStep("upload"); setMessage(error instanceof Error ? error.message : "The receipt could not be analyzed."); }
  }

  function updateItem(id: string, changes: Partial<ReviewItem>) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...changes } : item));
  }

  async function importSelected() {
    const selected = items.filter(item => item.selected && item.name.trim() && item.quantity > 0).map(({ id: _id, selected: _selected, ...item }) => ({
      ...item, name: item.name.trim(), unit: item.unit.trim() || "item", category: item.category?.trim() || null
    }));
    if (!selected.length) { setMessage("Select at least one valid item to import."); return; }
    setStep("importing"); setMessage("Importing selected items into your pantry...");
    try { const next = await receiptApi.confirm(selected); setResult(next); setStep("complete"); setMessage("Receipt import complete."); }
    catch (error) { setStep("review"); setMessage(error instanceof Error ? error.message : "The selected items could not be imported."); }
  }

  return <div className="fixed inset-0 z-[105] flex items-end bg-black/65 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="receipt-import-title">
    <section className="max-h-[94vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#faf8f1] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[2rem]">
      <header className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#486957]">Pantry automation</p><h2 id="receipt-import-title" className="mt-1 text-2xl font-black">Import receipt</h2></div><button type="button" onClick={onClose} aria-label="Close receipt import" className="grid h-11 w-11 place-items-center rounded-xl border bg-white"><X size={20}/></button></header>
      <div className="mt-4 grid grid-cols-4 gap-1" aria-label="Receipt import progress">{["Upload","Analyze","Review","Import"].map((label,index) => { const active=({upload:0,analyzing:1,review:2,importing:3,complete:3} as const)[step]>=index; return <div key={label}><div className={`h-2 rounded-full ${active?"bg-[#315b46]":"bg-[#dfe5e0]"}`}/><p className="mt-1 text-center text-[10px] font-bold">{label}</p></div>; })}</div>
      <p role="status" aria-live="polite" className="mt-4 rounded-2xl bg-[#f4f6f2] p-3 text-sm">{message}</p>
      {step === "complete" && result ? <div className="mt-5 rounded-3xl border bg-white p-6 text-center"><Check className="mx-auto text-emerald-700" size={38}/><h3 className="mt-3 text-2xl font-black">Import complete</h3><p className="mt-2 text-sm text-[#6d7d74]">{result.created} created · {result.updated} updated · {result.total} total</p><Button type="button" className="mt-5 w-full" onClick={() => window.location.reload()}>View refreshed pantry</Button></div> : <>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={event=>chooseFile(event.target.files?.[0])}/>
        {!imageUrl ? <button type="button" onClick={()=>inputRef.current?.click()} className="mt-5 grid min-h-48 w-full place-items-center rounded-3xl border-2 border-dashed border-[#9fb9a8] bg-white p-6 text-[#315b46]"><span><Camera className="mx-auto" size={36}/><span className="mt-3 block font-black">Take or choose receipt photo</span></span></button> : <div className="mt-5"><div className="overflow-hidden rounded-3xl bg-[#16231d]"><img src={imageUrl} alt="Selected receipt preview" className="max-h-64 w-full object-contain"/></div><div className="mt-2 flex items-center gap-2 text-sm text-[#6d7d74]"><FileImage size={16}/><span className="min-w-0 flex-1 truncate">{file?.name}</span><button type="button" disabled={step==="analyzing"||step==="importing"} onClick={()=>inputRef.current?.click()} className="rounded-xl border bg-white px-3 py-2 font-bold"><RefreshCw className="mr-1 inline" size={14}/>Replace</button></div></div>}
        {(step==="upload"||step==="analyzing")&&<Button type="button" className="mt-4 w-full" disabled={!file||step==="analyzing"} onClick={()=>void analyze()}><ScanText className="mr-2 inline" size={17}/>{step==="analyzing"?"Analyzing...":"Analyze receipt"}</Button>}
        {(step==="review"||step==="importing")&&<div className="mt-5"><div className="flex items-center justify-between"><div><h3 className="font-black">Review detected items</h3>{(merchantName||purchaseDate)&&<p className="text-xs text-[#6d7d74]">{merchantName}{merchantName&&purchaseDate?" · ":""}{purchaseDate}</p>}</div><button type="button" onClick={()=>setItems(current=>current.map(item=>({...item,selected:true})))} className="text-sm font-bold text-[#315b46]">Select all</button></div><ul className="mt-3 space-y-3">{items.map(item=><li key={item.id} className="rounded-2xl border bg-white p-3"><div className="flex gap-3"><input aria-label={`Select ${item.name}`} type="checkbox" checked={item.selected} onChange={event=>updateItem(item.id,{selected:event.target.checked})} className="mt-3 h-5 w-5 accent-[#315b46]"/><div className="grid min-w-0 flex-1 grid-cols-[1fr_5rem] gap-2"><label className="text-xs font-bold">Item<Input value={item.name} onChange={event=>updateItem(item.id,{name:event.target.value})} className="mt-1"/></label><label className="text-xs font-bold">Qty<Input inputMode="decimal" value={String(item.quantity)} onChange={event=>updateItem(item.id,{quantity:Number(event.target.value)||0})} className="mt-1"/></label><label className="text-xs font-bold">Unit<Input value={item.unit} onChange={event=>updateItem(item.id,{unit:event.target.value})} className="mt-1"/></label><label className="text-xs font-bold">Category<Input value={item.category??""} onChange={event=>updateItem(item.id,{category:event.target.value||null})} className="mt-1"/></label></div><button type="button" aria-label={`Remove ${item.name}`} onClick={()=>setItems(current=>current.filter(candidate=>candidate.id!==item.id))} className="grid h-11 w-11 place-items-center rounded-xl border text-[#9a4f36]"><Trash2 size={16}/></button></div></li>)}</ul><Button type="button" className="mt-5 w-full" disabled={!selectedCount||step==="importing"} onClick={()=>void importSelected()}>{step==="importing"?"Importing...":`Import selected (${selectedCount})`}</Button></div>}
      </>}
      <p className="mt-4 text-xs leading-5 text-[#718078]"><Pencil className="mr-1 inline" size={13}/>Review and correct OCR results before importing. PantryPilot does not store the receipt image.</p>
    </section>
  </div>;
}
