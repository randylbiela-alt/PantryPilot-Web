"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ChefHat, RefreshCw, Sparkles } from "lucide-react";
import { intelligenceApi, type IntelligenceDashboardResponse } from "@/lib/intelligence-api";
import { Button } from "./ui";
import { ErrorState, Loading } from "./status";
import { AiMealPlanner } from "./ai-meal-planner";

function tone(score: number) {
  if (score >= 90) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (score >= 70) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

function MetricCard({ label, value, detail, className = "" }: { label: string; value: string | number; detail: string; className?: string }) {
  return <article className={`rounded-3xl border bg-white p-4 shadow-sm ${className}`}><p className="text-xs font-black uppercase tracking-[.14em] text-[#607067]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-[#718078]">{detail}</p></article>;
}

export function IntelligenceScreen({ householdId }: { householdId: string }) {
  const [data, setData] = useState<IntelligenceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await intelligenceApi.dashboard(householdId)); }
    catch (caught) { setError(caught); }
    finally { setLoading(false); }
  }, [householdId]);

  useEffect(() => {
  queueMicrotask(() => {
    void load();
  });
}, [load]);

  if (loading) return <Loading label="Loading Pantry Intelligence" />;
  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return null;

  return <section aria-labelledby="intelligence-heading">
    <header className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">Pantry Intelligence</p><h1 id="intelligence-heading" className="mt-1 text-3xl font-black">Your weekly outlook</h1><p className="mt-2 text-sm text-[#68766f]">Week of {data.dashboard.weekStartDate}</p></div>
      <Button aria-label="Refresh intelligence" onClick={() => void load()}><RefreshCw size={17} /></Button>
    </header>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <MetricCard label="Readiness" value={`${data.dashboard.readinessScore}%`} detail={`${data.readiness.cookableMeals} of ${data.readiness.plannedMeals} meals cookable`} className={tone(data.dashboard.readinessScore)} />
      <MetricCard label="Low Stock" value={data.dashboard.lowStockCount} detail="items below threshold" />
      <MetricCard label="Expiring" value={data.dashboard.expiringCount} detail="within 7 days" />
      <MetricCard label="Recommended" value={data.dashboard.recommendedCount} detail="recipes at 80%+ match" />
    </div>

    <AiMealPlanner householdId={householdId} recommendations={data.recommendations} />
    <section className="mt-6"><div className="flex items-center gap-2"><Sparkles size={20} className="text-[#315b46]"/><h2 className="text-xl font-black">Recommended Recipes</h2></div><div className="mt-3 space-y-3">{data.recommendations.length ? data.recommendations.map(recipe => <article key={recipe.recipeId} className="rounded-3xl border bg-white p-4"><div className="flex justify-between gap-3"><div><h3 className="font-black">{recipe.recipeName}</h3><p className="text-sm text-[#68766f]">{recipe.availableIngredients} of {recipe.totalIngredients} ingredients ready</p></div><span className={`h-fit rounded-full border px-3 py-1 text-sm font-black ${tone(recipe.score)}`}>{recipe.score}%</span></div>{recipe.missingIngredients.length ? <p className="mt-3 text-sm"><b>Missing:</b> {recipe.missingIngredients.map(item => item.name).join(", ")}</p> : <p className="mt-3 text-sm font-bold text-emerald-700">Ready to cook</p>}</article>) : <p className="rounded-3xl border bg-white p-5 text-sm">Create recipes to see recommendations.</p>}</div></section>

    <section className="mt-6"><div className="flex items-center gap-2"><AlertTriangle size={20} className="text-amber-600"/><h2 className="text-xl font-black">Low Stock</h2></div><div className="mt-3 space-y-2">{data.lowStock.length ? data.lowStock.map(item => <div key={item.itemId ?? item.name} className="flex justify-between rounded-2xl border bg-white p-3"><span>{item.name}</span><span className="font-bold">{item.currentQuantity} {item.unit} <span className="text-xs font-normal text-[#718078]">of {item.threshold}</span></span></div>) : <p className="rounded-2xl border bg-white p-4 text-sm">No low-stock alerts.</p>}</div></section>

    <section className="mt-6"><div className="flex items-center gap-2"><CalendarClock size={20} className="text-red-600"/><h2 className="text-xl font-black">Expiring Soon</h2></div><div className="mt-3 space-y-2">{data.expiring.length ? data.expiring.map(item => <div key={item.itemId ?? `${item.name}-${item.expirationDate}`} className="flex justify-between rounded-2xl border bg-white p-3"><div><span className="font-bold">{item.name}</span><p className="text-xs text-[#718078]">Expires {item.expirationDate}</p></div><span className="text-sm font-black text-red-700">{item.daysRemaining === 0 ? "Today" : `${item.daysRemaining} day${item.daysRemaining === 1 ? "" : "s"}`}</span></div>) : <p className="rounded-2xl border bg-white p-4 text-sm">Nothing expires in the next 7 days.</p>}</div></section>

    {data.readiness.mealsMissingIngredients.length > 0 && <section className="mt-6"><div className="flex items-center gap-2"><ChefHat size={20}/><h2 className="text-xl font-black">Meals Needing Attention</h2></div><div className="mt-3 space-y-2">{data.readiness.mealsMissingIngredients.map(meal => <div key={meal.mealId} className="rounded-2xl border bg-white p-3"><b>{meal.recipeName ?? "Unavailable recipe"}</b><p className="text-sm text-[#68766f]">Missing: {meal.missingIngredients.join(", ")}</p></div>)}</div></section>}
  </section>;
}

