"use client";
import { useCallback, useEffect, useState } from "react";
import { Activity, Database, Eye, RefreshCw, Server, ShoppingBasket } from "lucide-react";
import { loadObservability, type ObservabilitySummary } from "@/lib/observability-api";
import { AlertCard, MetricCard, SectionHeader } from "./design-system";
import { Button } from "./ui";
import { ErrorState, Loading } from "./status";

function duration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function MonitoringScreen() {
  const [data, setData] = useState<ObservabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await loadObservability()); }
    catch (caught) { setError(caught); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  if (loading) return <Loading label="Loading monitoring data" />;
  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return null;
  const healthy = data.status === "healthy";
  return <section aria-label="Monitoring and observability">
    <SectionHeader eyebrow="Operations" title="Monitoring & Observability" description={`Checked ${new Date(data.checkedAt).toLocaleString()}`} action={<Button aria-label="Refresh monitoring" onClick={() => void load()}><RefreshCw size={17} /></Button>} />
    <div className="mt-5"><AlertCard tone={healthy ? "success" : "warning"} title={healthy ? "All core services are healthy" : "PantryPilot is degraded"} detail={healthy ? "API and database checks passed." : "One or more service checks need attention."} /></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><MetricCard label="API" value={data.checks.api.status} detail={data.application.environment} /><MetricCard label="Database" value={data.checks.database.status} detail={data.checks.database.latencyMs === null ? "latency unavailable" : `${data.checks.database.latencyMs} ms`} /><MetricCard label="Uptime" value={duration(data.application.uptimeSeconds)} detail={`started ${new Date(data.application.startedAt).toLocaleString()}`} /><MetricCard label="Heap" value={`${data.runtime.heapUsedMb} MB`} detail={`${data.runtime.heapTotalMb} MB allocated`} /></div>
    <section className="mt-7"><h2 className="text-xl font-black">Service checks</h2><div className="mt-3 space-y-3"><article className="flex items-center gap-3 rounded-2xl border bg-white p-4"><Server className="text-[#315b46]"/><div className="flex-1"><b>API runtime</b><p className="text-sm text-[#6d7d74]">Node {data.application.nodeVersion} · RSS {data.runtime.rssMb} MB</p></div><strong>{data.checks.api.status}</strong></article><article className="flex items-center gap-3 rounded-2xl border bg-white p-4"><Database className="text-[#315b46]"/><div className="flex-1"><b>PostgreSQL</b><p className="text-sm text-[#6d7d74]">Prisma readiness query</p></div><strong>{data.checks.database.status}</strong></article><article className="flex items-center gap-3 rounded-2xl border bg-white p-4"><Eye className="text-[#315b46]"/><div className="flex-1"><b>Receipt OCR</b><p className="text-sm text-[#6d7d74]">{data.checks.ocr.model}</p></div><strong>{data.checks.ocr.status}</strong></article><article className="flex items-center gap-3 rounded-2xl border bg-white p-4"><ShoppingBasket className="text-[#315b46]"/><div className="flex-1"><b>Product lookup</b><p className="text-sm text-[#6d7d74]">{data.checks.productLookup.provider}</p></div><strong>{data.checks.productLookup.status}</strong></article></div></section>
    <section className="mt-7 rounded-3xl border bg-white p-4"><div className="flex items-center gap-2"><Activity size={19}/><h2 className="font-black">Diagnostic context</h2></div><dl className="mt-3 grid gap-2 text-sm"><div className="flex justify-between gap-3"><dt>API version</dt><dd className="font-bold">{data.application.version}</dd></div><div className="flex justify-between gap-3"><dt>Environment</dt><dd className="font-bold">{data.application.environment}</dd></div><div className="flex justify-between gap-3"><dt>Correlation ID</dt><dd className="max-w-[65%] break-all text-right font-mono text-xs">{data.correlationId}</dd></div></dl></section>
    <p className="mt-5 text-xs leading-5 text-[#718078]">This screen exposes operational status only. Credentials, connection strings, cookies, tokens, and raw production stack traces are not returned.</p>
  </section>;
}
