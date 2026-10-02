"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, Lightbulb, X } from "lucide-react";
import type { PantryItem } from "@/lib/types";
import { loadNotificationPreferences, type NotificationPreferences } from "./notification-settings";

type NotificationItem = { id: string; kind: "low" | "expiring" | "recommendation"; title: string; detail: string };

function readKey(householdId: string) { return `pantrypilot.notifications.read.${householdId}`; }
function quantity(item: PantryItem) { return Number(item.quantity); }

export function NotificationCenter({ householdId, pantry }: { householdId: string; pantry: PantryItem[] }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadNotificationPreferences(householdId));

  useEffect(() => {
    try { setRead(JSON.parse(localStorage.getItem(readKey(householdId)) ?? "[]")); } catch { setRead([]); }
    setPreferences(loadNotificationPreferences(householdId));
    const refresh = () => setPreferences(loadNotificationPreferences(householdId));
    window.addEventListener("pantrypilot:notification-preferences", refresh);
    return () => window.removeEventListener("pantrypilot:notification-preferences", refresh);
  }, [householdId]);

  const items = useMemo(() => {
    const next: NotificationItem[] = [];
    if (preferences.lowStock) pantry.filter(item => quantity(item) <= 1).slice(0, 8).forEach(item => next.push({ id: `low:${item.id}:${item.version}`, kind: "low", title: `${item.name} is running low`, detail: `${String(item.quantity)} ${item.unit} remaining.` }));
    if (preferences.expiring) {
      const today = new Date();
      const cutoff = new Date(today); cutoff.setDate(today.getDate() + 7);
      pantry.filter(item => item.expirationDate && new Date(item.expirationDate) <= cutoff).slice(0, 8).forEach(item => next.push({ id: `expiring:${item.id}:${item.version}`, kind: "expiring", title: `${item.name} expires soon`, detail: `Expiration: ${item.expirationDate?.slice(0, 10)}` }));
    }
    if (preferences.recommendations && pantry.length >= 3) next.push({ id: `recommendation:${pantry.length}`, kind: "recommendation", title: "Pantry recommendations are ready", detail: "Open Intelligence to review recipe matches and pantry insights." });
    return next;
  }, [pantry, preferences]);

  const unread = items.filter(item => !read.includes(item.id)).length;
  function save(next: string[]) { setRead(next); localStorage.setItem(readKey(householdId), JSON.stringify(next)); }
  function markRead(id: string) { if (!read.includes(id)) save([...read, id]); }
  function markAllRead() { save(Array.from(new Set([...read, ...items.map(item => item.id)]))); }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid h-11 w-11 place-items-center rounded-xl border bg-white text-[#315b46]"><Bell size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#9a4f36] px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}</button>
    {open && <div className="fixed inset-0 z-[120] flex items-end bg-black/60 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="notification-center-title"><section className="max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#faf8f1] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[2rem]"><header className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#486957]">Updates</p><h2 id="notification-center-title" className="mt-1 text-2xl font-black">Notifications</h2><p className="mt-1 text-sm text-[#6d7d74]">{unread} unread</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-11 w-11 place-items-center rounded-xl border bg-white"><X size={20} /></button></header><div className="mt-4 flex justify-end"><button type="button" onClick={markAllRead} disabled={!unread} className="min-h-11 rounded-xl border bg-white px-3 text-sm font-bold text-[#315b46] disabled:opacity-50"><CheckCheck className="mr-2 inline" size={16} />Mark all read</button></div>{items.length ? <ul className="mt-3 space-y-3">{items.map(item => { const Icon = item.kind === "low" ? AlertTriangle : item.kind === "expiring" ? CalendarClock : Lightbulb; const done = read.includes(item.id); return <li key={item.id}><button type="button" onClick={() => markRead(item.id)} className={`flex min-h-20 w-full items-start gap-3 rounded-3xl border p-4 text-left ${done ? "bg-[#f4f6f2] opacity-70" : "bg-white shadow-sm"}`}><Icon className="mt-0.5 shrink-0 text-[#486957]" size={20} /><span className="min-w-0 flex-1"><span className="block font-black">{item.title}</span><span className="mt-1 block text-sm text-[#6d7d74]">{item.detail}</span></span>{!done && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#315b46]" />}</button></li>; })}</ul> : <div className="mt-5 rounded-3xl border border-dashed bg-white p-8 text-center"><Bell className="mx-auto text-[#486957]" size={30} /><h3 className="mt-3 font-black">You are all caught up</h3><p className="mt-1 text-sm text-[#6d7d74]">No active pantry notifications.</p></div>}</section></div>}
  </>;
}
