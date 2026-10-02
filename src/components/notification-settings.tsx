"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Send } from "lucide-react";
import { Button } from "./ui";

export type NotificationPreferences = {
  lowStock: boolean;
  expiring: boolean;
  recommendations: boolean;
};

const defaults: NotificationPreferences = {
  lowStock: true,
  expiring: true,
  recommendations: true
};

export function notificationPreferenceKey(householdId: string) {
  return `pantrypilot.notification-preferences.${householdId}`;
}

export function loadNotificationPreferences(householdId: string): NotificationPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(notificationPreferenceKey(householdId)) ?? "{}") };
  } catch {
    return defaults;
  }
}

export function NotificationSettings({ householdId }: { householdId: string }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaults);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPreferences(loadNotificationPreferences(householdId));
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, [householdId]);

  function save(next: NotificationPreferences) {
    setPreferences(next);
    localStorage.setItem(notificationPreferenceKey(householdId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("pantrypilot:notification-preferences", { detail: next }));
    setMessage("Notification preferences saved on this device.");
  }

  async function enable() {
    if (!("Notification" in window)) { setMessage("Browser notifications are not supported on this device."); return; }
    const next = await Notification.requestPermission();
    setPermission(next);
    setMessage(next === "granted" ? "Browser notifications enabled." : "Browser notification permission was not granted.");
  }

  function test() {
    if (!("Notification" in window) || Notification.permission !== "granted") { setMessage("Enable browser notifications first."); return; }
    new Notification("PantryPilot test", { body: "Notifications are enabled for this device." });
    setMessage("Test notification sent.");
  }

  const rows: Array<{ key: keyof NotificationPreferences; label: string; detail: string }> = [
    { key: "lowStock", label: "Low-stock alerts", detail: "Notify when pantry quantities need attention." },
    { key: "expiring", label: "Expiration alerts", detail: "Notify when dated pantry items are approaching expiration." },
    { key: "recommendations", label: "Recommendation alerts", detail: "Show meal and recipe recommendation notices." }
  ];

  return <section className="mt-8 border-t pt-6" aria-labelledby="notification-settings-heading">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf5db] text-[#315b46]"><BellRing size={20} aria-hidden="true" /></span><div><h2 id="notification-settings-heading" className="text-xl font-black">Notifications</h2><p className="mt-1 text-sm text-[#6d7d74]">Choose which local alerts PantryPilot shows on this device.</p></div></div>
    <div className="mt-4 space-y-2">{rows.map(row => <label key={row.key} className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#f4f6f2] p-3"><input type="checkbox" checked={preferences[row.key]} onChange={event => save({ ...preferences, [row.key]: event.target.checked })} className="h-5 w-5 accent-[#315b46]" /><span><span className="block text-sm font-black">{row.label}</span><span className="block text-xs text-[#6d7d74]">{row.detail}</span></span></label>)}</div>
    <div className="mt-4 grid grid-cols-2 gap-2"><Button type="button" onClick={() => void enable()}><Bell className="mr-2 inline" size={16} />{permission === "granted" ? "Enabled" : "Enable"}</Button><button type="button" onClick={test} className="min-h-11 rounded-2xl border bg-white px-3 font-bold text-[#315b46]"><Send className="mr-2 inline" size={16} />Test</button></div>
    {message && <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-[#edf5db] p-3 text-sm">{message}</p>}
  </section>;
}
