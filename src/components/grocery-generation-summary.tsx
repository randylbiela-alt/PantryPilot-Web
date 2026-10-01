"use client";
import type { GroceryGenerationResult } from "@/lib/grocery-generation-api";
import { Button } from "./ui";
export function GroceryGenerationSummary({ result, onClose }: { result: GroceryGenerationResult; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-3xl bg-[#faf8f1] p-5"><h2 className="text-2xl font-black">Grocery List Generated</h2><p className="mt-2">Added {result.generated} item{result.generated === 1 ? "" : "s"}.</p>{result.existingSkipped > 0 && <p className="text-sm text-[#68766f]">Skipped {result.existingSkipped} existing item{result.existingSkipped === 1 ? "" : "s"}.</p>}<ul className="mt-4 space-y-2">{result.items.map(item => <li key={item.id} className="flex justify-between rounded-xl bg-white p-3"><span>{item.name}</span><b>{item.quantity} {item.unit}</b></li>)}</ul><Button className="mt-5 w-full" onClick={onClose}>Done</Button></div></div>;
}
