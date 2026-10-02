"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, RefreshCw, ShoppingCart, Sparkles, Utensils } from "lucide-react";
import { loadForecasting, type ForecastingSummary } from "@/lib/forecasting-api";
import { AlertCard, EmptyState, MetricCard, SectionHeader } from "./design-system";
import { Button } from "./ui";
import { ErrorState, Loading } from "./status";

function tone(level: "HIGH" | "MEDIUM" | "LOW") { return level === "HIGH" ? "danger" : level === "MEDIUM" ? "warning" : "success"; }

export function ForecastingScreen({ householdId }: { householdId: string }) {
  const [data, setData] = useState<ForecastingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await loadForecasting(householdId)); } catch (caught) { setError(caught); } finally { setLoading(false); } }, [householdId]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  if (loading) return <Loading label="Loading forecasts" />;
  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return null;
  return <section aria-label="Forecasting and predictive insights">
    <SectionHeader eyebrow="Forward outlook" title="Forecasting & Predictive Insights" description={`Generated ${new Date(data.generatedAt).toLocaleString()} · Horizon ${data.horizon.maximumDays} days`} action={<Button aria-label="Refresh forecasts" onClick={() => void load()}><RefreshCw size={17} /></Button>} />
    <div className="mt-5"><AlertCard tone={tone(data.confidence.level)} title={`${data.confidence.level} forecast confidence`} detail={`Data quality score ${data.confidence.score}%. Forecasts are rules-based and use current PantryPilot data.`} /></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><MetricCard label="3-day expiration" value={data.expirationRisk.within3Days} detail="items at immediate risk" /><MetricCard label="30-day expiration" value={data.expirationRisk.within30Days} detail="items in forecast horizon" /><MetricCard label="Meal coverage" value={`${data.mealCoverage.coveragePercent}%`} detail={`${data.mealCoverage.mealsAtRisk} meals at risk`} /><MetricCard label="Shopping pressure" value={data.shoppingPressure.level} detail={`score ${data.shoppingPressure.score}/100`} /><MetricCard label="Recipe coverage" value={`${data.pantryCoverage.averageRecipeMatch}%`} detail={`${data.pantryCoverage.recipesReady} recipes fully ready`} /><MetricCard label="Recipes 80%+" value={data.pantryCoverage.recipesAt80Plus} detail={`${data.pantryCoverage.recipesEvaluated} evaluated`} /></div>
    <section className="mt-7"><div className="flex items-center gap-2"><CalendarClock size={19}/><h2 className="text-xl font-black">Use-first forecast</h2></div>{data.expirationRisk.useFirst.length ? <div className="mt-3 space-y-2">{data.expirationRisk.useFirst.map(item => <article key={item.itemId ?? `${item.name}-${item.expirationDate}`} className="flex justify-between gap-3 rounded-2xl border bg-white p-3"><div><b>{item.name}</b><p className="text-xs text-[#718078]">Expires {item.expirationDate}</p></div><strong>{item.daysRemaining === 0 ? "Today" : `${item.daysRemaining} days`}</strong></article>)}</div> : <EmptyState icon={<CalendarClock size={28}/>} title="No dated expiration risk" detail="Add expiration dates to pantry items to improve this forecast." />}</section>
    <section className="mt-7"><div className="flex items-center gap-2"><Utensils size={19}/><h2 className="text-xl font-black">Meal outlook</h2></div><div className="mt-3 grid grid-cols-2 gap-3"><MetricCard label="Planned" value={data.mealCoverage.plannedMeals} detail="meals this week"/><MetricCard label="Cookable" value={data.mealCoverage.cookableMeals} detail="with current pantry"/></div>{data.mealCoverage.missingMeals.length > 0 && <div className="mt-3 space-y-2">{data.mealCoverage.missingMeals.map(meal => <AlertCard key={meal.mealId} tone="warning" title={meal.recipeName ?? "Unavailable recipe"} detail={`Missing: ${meal.missingIngredients.join(", ")}`} />)}</div>}</section>
    <section className="mt-7"><div className="flex items-center gap-2"><ShoppingCart size={19}/><h2 className="text-xl font-black">Shopping pressure</h2></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><article className="rounded-2xl border bg-white p-3"><b className="text-2xl">{data.shoppingPressure.lowStockItems}</b><p className="text-xs">low stock</p></article><article className="rounded-2xl border bg-white p-3"><b className="text-2xl">{data.shoppingPressure.missingIngredients}</b><p className="text-xs">missing</p></article><article className="rounded-2xl border bg-white p-3"><b className="text-2xl">{data.shoppingPressure.openGroceryItems}</b><p className="text-xs">open list</p></article></div></section>
    <section className="mt-7"><div className="flex items-center gap-2"><Sparkles size={19}/><h2 className="text-xl font-black">Category exposure</h2></div>{data.pantryCoverage.categoryRisks.length ? <div className="mt-3 space-y-2">{data.pantryCoverage.categoryRisks.map(item => <article key={item.category} className="rounded-2xl border bg-white p-3"><div className="flex justify-between gap-3"><b>{item.category}</b><span className="text-sm">{item.total} items</span></div><p className="mt-1 text-xs text-[#718078]">{item.lowStock} low stock · {item.expiring30} expiring within 30 days</p></article>)}</div> : <EmptyState title="No category exposure" detail="Categorize pantry items to improve coverage forecasts."/>}</section>
    <section className="mt-7 rounded-3xl border bg-white p-4"><h2 className="font-black">Confidence and limitations</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{data.confidence.reasons.map(reason => <li key={reason}>{reason}</li>)}{data.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul></section>
  </section>;
}
