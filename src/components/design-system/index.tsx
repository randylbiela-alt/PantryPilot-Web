"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

export function MetricCard({ label, value, detail, className = "" }: { label: string; value: ReactNode; detail?: ReactNode; className?: string }) {
  return <article className={`rounded-3xl border bg-white p-4 shadow-sm ${className}`}><p className="text-xs font-black uppercase tracking-[.14em] text-[#607067]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p>{detail ? <p className="mt-1 text-xs text-[#718078]">{detail}</p> : null}</article>;
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: ReactNode; action?: ReactNode }) {
  return <header className="flex items-start justify-between gap-3"><div>{eyebrow ? <p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">{eyebrow}</p> : null}<h1 className="mt-1 text-3xl font-black">{title}</h1>{description ? <div className="mt-2 text-sm text-[#68766f]">{description}</div> : null}</div>{action}</header>;
}

export function InfoBanner({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" }) {
  const classes = { info: "border-blue-200 bg-blue-50 text-blue-900", success: "border-emerald-200 bg-emerald-50 text-emerald-900", warning: "border-amber-200 bg-amber-50 text-amber-900", danger: "border-red-200 bg-red-50 text-red-900" };
  return <div role="status" className={`rounded-2xl border p-4 text-sm ${classes[tone]}`}>{children}</div>;
}

export function EmptyState({ icon, title, detail, action }: { icon?: ReactNode; title: string; detail?: ReactNode; action?: ReactNode }) {
  return <div className="rounded-3xl border border-dashed bg-white p-8 text-center">{icon ? <div className="mx-auto w-fit text-[#486957]">{icon}</div> : null}<h2 className="mt-3 text-xl font-black">{title}</h2>{detail ? <p className="mt-1 text-sm text-[#6d7d74]">{detail}</p> : null}{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function ActionCard({ title, detail, icon, children, className = "" }: { title: string; detail?: ReactNode; icon?: ReactNode; children?: ReactNode; className?: string }) {
  return <article className={`rounded-3xl border bg-white p-4 shadow-sm ${className}`}><div className="flex items-start gap-3">{icon ? <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf5db] text-[#315b46]">{icon}</span> : null}<div className="min-w-0 flex-1"><h3 className="font-black">{title}</h3>{detail ? <p className="mt-1 text-sm text-[#6d7d74]">{detail}</p> : null}</div></div>{children ? <div className="mt-4">{children}</div> : null}</article>;
}

export function AlertCard({ title, detail, tone = "warning", action }: { title: string; detail?: ReactNode; tone?: "warning" | "danger" | "success"; action?: ReactNode }) {
  const classes = { warning: "border-amber-200 bg-amber-50", danger: "border-red-200 bg-red-50", success: "border-emerald-200 bg-emerald-50" };
  return <article className={`rounded-2xl border p-4 ${classes[tone]}`}><h3 className="font-black">{title}</h3>{detail ? <div className="mt-1 text-sm">{detail}</div> : null}{action ? <div className="mt-3">{action}</div> : null}</article>;
}

export function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[130] flex items-end bg-black/60 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}><section className="max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#faf8f1] p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]"><header className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid h-11 w-11 place-items-center rounded-xl border bg-white"><X size={20} /></button></header><div className="mt-4">{children}</div></section></div>;
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button className={`min-h-11 rounded-2xl border border-[#cfd8d2] bg-white px-4 py-2 font-bold text-[#315b46] disabled:opacity-50 ${className}`} {...rest} />;
}
