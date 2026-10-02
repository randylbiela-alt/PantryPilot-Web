"use client";

import { useEffect, useState } from "react";
import { Accessibility, Contrast, Hand, Waves } from "lucide-react";

type Preferences = {
  reduceMotion: boolean;
  highContrast: boolean;
  largeTargets: boolean;
};

const KEY = "pantrypilot.accessibility";
const defaults: Preferences = { reduceMotion: false, highContrast: false, largeTargets: true };

function apply(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.reduceMotion = String(preferences.reduceMotion);
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.largeTargets = String(preferences.largeTargets);
}

export function AccessibilitySettings() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let next = defaults;
    try { next = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { next = defaults; }
    setPreferences(next);
    apply(next);
  }, []);

  function save(next: Preferences) {
    setPreferences(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    apply(next);
    setMessage("Accessibility preferences saved on this device.");
  }

  const rows: Array<{ key: keyof Preferences; label: string; detail: string; icon: typeof Accessibility }> = [
    { key: "reduceMotion", label: "Reduce motion", detail: "Limit animations and smooth scrolling.", icon: Waves },
    { key: "highContrast", label: "High contrast", detail: "Strengthen text, border, and background contrast.", icon: Contrast },
    { key: "largeTargets", label: "Large touch targets", detail: "Keep interactive controls at least 44 pixels tall.", icon: Hand }
  ];

  return <section className="mt-8 border-t pt-6" aria-labelledby="accessibility-settings-heading">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf5db] text-[#315b46]"><Accessibility size={20} aria-hidden="true" /></span><div><h2 id="accessibility-settings-heading" className="text-xl font-black">Accessibility</h2><p className="mt-1 text-sm text-[#6d7d74]">Adjust visual and interaction preferences for this device.</p></div></div>
    <div className="mt-4 space-y-2">{rows.map(row => { const Icon = row.icon; return <label key={row.key} className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#f4f6f2] p-3"><Icon size={18} className="shrink-0 text-[#486957]" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-black">{row.label}</span><span className="block text-xs text-[#6d7d74]">{row.detail}</span></span><input type="checkbox" checked={preferences[row.key]} onChange={event => save({ ...preferences, [row.key]: event.target.checked })} className="h-5 w-5 shrink-0 accent-[#315b46]" /></label>; })}</div>
    {message && <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-[#edf5db] p-3 text-sm">{message}</p>}
  </section>;
}
