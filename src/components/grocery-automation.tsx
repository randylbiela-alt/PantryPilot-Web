"use client";

import { useMemo, useState } from "react";
import { ListPlus, Sparkles } from "lucide-react";
import { Button } from "./ui";

export function GroceryAutomation({ existingNames, disabled, onCreate }: {
  existingNames: string[];
  disabled: boolean;
  onCreate: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const candidates = useMemo(() => {
    const existing = new Set(existingNames.map(name => name.trim().toLowerCase()));
    const seen = new Set<string>();
    return text.split(/\r?\n|,/).map(value => value.trim()).filter(value => {
      const normalized = value.toLowerCase();
      if (!normalized || existing.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [existingNames, text]);

  async function addAll() {
    if (!candidates.length || busy) return;
    setBusy(true); setMessage("");
    let added = 0;
    try {
      for (const name of candidates) { await onCreate(name); added += 1; }
      setText("");
      setMessage(`${added} item${added === 1 ? "" : "s"} added. Existing and duplicate names were skipped.`);
    } catch (error) {
      setMessage(`${added} item${added === 1 ? "" : "s"} added before the automation stopped. ${error instanceof Error ? error.message : "The remaining items were not added."}`);
    } finally { setBusy(false); }
  }

  return <section className="mt-4 rounded-3xl border bg-[#f4f6f2] p-4" aria-labelledby="grocery-automation-heading">
    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#315b46] text-white"><Sparkles size={18} /></span><div><h2 id="grocery-automation-heading" className="font-black">Quick-add automation</h2><p className="mt-1 text-sm text-[#6d7d74]">Paste a comma-separated or line-separated list. PantryPilot removes duplicates before adding.</p></div></div><button type="button" onClick={() => setOpen(value => !value)} className="min-h-11 rounded-xl border bg-white px-3 text-sm font-bold">{open ? "Close" : "Open"}</button></div>
    {open && <div className="mt-4"><label className="block text-sm font-bold">Items<textarea value={text} onChange={event => setText(event.target.value)} placeholder={"Milk\nEggs\nCoffee"} className="mt-1 min-h-28 w-full rounded-2xl border bg-white p-3" /></label><p className="mt-2 text-xs text-[#6d7d74]">{candidates.length} new unique item{candidates.length === 1 ? "" : "s"} ready</p><Button type="button" disabled={disabled || busy || !candidates.length} onClick={() => void addAll()} className="mt-3 w-full"><ListPlus className="mr-2 inline" size={17} />{busy ? "Adding items..." : "Add unique items"}</Button></div>}
    {message && <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-white p-3 text-sm">{message}</p>}
  </section>;
}
