"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import type { GroceryItem, GroceryList } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { Button, Input } from "./ui";
import { InlineAlert } from "./status";

export type GroceryActions = {
  createItem(name: string): Promise<void>;
  updateItem(item: GroceryItem, input: { name?: string; checked?: boolean }): Promise<void>;
  deleteItem(item: GroceryItem): Promise<void>;
  refresh(): Promise<void>;
  completeList(): Promise<void>;
};

export function GroceryListScreen({ list, actions }: { list: GroceryList; actions: GroceryActions }) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; correlationId?: string } | null>(null);

  const filtered = useMemo(
    () => list.items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),
    [list.items, query]
  );
  const completed = list.items.filter(item => item.checked).length;
  const progress = list.items.length ? Math.round((completed / list.items.length) * 100) : 0;

  async function execute(operation: () => Promise<void>, conflictMessage: string) {
    setBusy(true);
    setNotice(null);
    try {
      await operation();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await actions.refresh();
        setNotice({ message: conflictMessage, correlationId: error.correlationId });
      } else {
        setNotice({
          message: error instanceof Error ? error.message : "The grocery operation failed.",
          correlationId: error instanceof ApiError ? error.correlationId : undefined
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await execute(async () => {
      await actions.createItem(name);
      setNewName("");
    }, "The grocery list changed. PantryPilot refreshed the latest server version.");
  }

  return (
    <section aria-labelledby="grocery-heading">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">Shopping trip</p>
          <h1 id="grocery-heading" className="mt-1 text-4xl font-black">{list.name}</h1>
          <p className="mt-2 text-sm text-[#6d7d74]">{completed} of {list.items.length} items complete</p>
        </div>
        <ShoppingCart size={30} />
      </header>

      {notice && <div className="mt-4"><InlineAlert message={notice.message} correlationId={notice.correlationId} onDismiss={() => setNotice(null)} /></div>}

      <div className="mt-5 rounded-2xl border bg-white p-4">
        <div className="flex justify-between text-sm font-bold"><span>Shopping progress</span><span>{progress}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e4e9e5]" aria-label={`Shopping progress ${progress}%`}>
          <div className="h-full rounded-full bg-[#7b9c63] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={addItem} className="mt-4 flex gap-2">
        <label className="flex-1"><span className="sr-only">New grocery item</span><Input value={newName} onChange={event => setNewName(event.target.value)} placeholder="Add grocery item" /></label>
        <Button disabled={busy || !newName.trim()} aria-label="Add grocery item"><Plus size={18} /></Button>
      </form>

      <label className="relative mt-3 block">
        <span className="sr-only">Search grocery list</span>
        <Search className="absolute left-3 top-3 text-[#6d7d74]" size={18} />
        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search grocery list" className="pl-10" />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-3xl border bg-white p-8 text-center">
          <ShoppingCart className="mx-auto text-[#486957]" size={38} />
          <h2 className="mt-3 text-xl font-black">{list.items.length ? "No matching items" : "Your grocery list is empty"}</h2>
        </div>
      ) : (
        <ul className="mt-5 space-y-3" aria-label="Grocery items">
          {filtered.map(item => (
            <li key={item.id} className="flex items-center gap-3 rounded-3xl border bg-white p-4">
              <button
                aria-label={`${item.checked ? "Uncheck" : "Check"} ${item.name}`}
                onClick={() => void execute(() => actions.updateItem(item, { checked: !item.checked }), "This item changed elsewhere. The list was refreshed.")}
                className={`grid h-9 w-9 place-items-center rounded-xl border-2 ${item.checked ? "border-[#315b46] bg-[#315b46] text-white" : "border-[#9bac9f]"}`}
              >
                {item.checked && <Check size={18} />}
              </button>
              <span className={`min-w-0 flex-1 font-bold ${item.checked ? "text-[#84918a] line-through" : ""}`}>{item.name}</span>
              <button aria-label={`Edit ${item.name}`} onClick={() => { setEditing(item); setEditName(item.name); }} className="rounded-xl border p-2"><Pencil size={17} /></button>
              <button aria-label={`Delete ${item.name}`} onClick={() => void execute(() => actions.deleteItem(item), "This item changed before deletion. The list was refreshed.")} className="rounded-xl border p-2 text-[#9a4f36]"><Trash2 size={17} /></button>
            </li>
          ))}
        </ul>
      )}

      {list.items.length > 0 && completed === list.items.length && (
        <Button onClick={() => void execute(actions.completeList, "The list changed. PantryPilot refreshed it.")} className="mt-5 w-full">Complete shopping trip</Button>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-3" role="dialog" aria-modal="true" aria-labelledby="edit-grocery-title">
          <form
            className="w-full max-w-md rounded-[2rem] bg-[#faf8f1] p-5"
            onSubmit={event => {
              event.preventDefault();
              const name = editName.trim();
              if (!name) return;
              void execute(async () => { await actions.updateItem(editing, { name }); setEditing(null); }, "This item changed elsewhere. The list was refreshed.");
            }}
          >
            <h2 id="edit-grocery-title" className="text-2xl font-black">Edit grocery item</h2>
            <label className="mt-4 block text-sm font-bold">Item name<Input autoFocus value={editName} onChange={event => setEditName(event.target.value)} className="mt-1" /></label>
            <div className="mt-5 grid grid-cols-2 gap-3"><Button type="button" onClick={() => setEditing(null)} className="border bg-white text-[#203a2e]">Cancel</Button><Button disabled={busy}>Save</Button></div>
          </form>
        </div>
      )}
    </section>
  );
}
