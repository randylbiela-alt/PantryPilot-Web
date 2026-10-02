"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mealApi } from "@/lib/meal-api";
import type { MealPlan, MealType, PlannedMeal } from "@/lib/meal-types";
import type { Recipe } from "@/lib/recipe-types";
import { generateGroceryList, type GroceryGenerationResult } from "@/lib/grocery-generation-api";
import { RecipeSelectionDialog } from "./recipe-selection-dialog";
import { GroceryGenerationSummary } from "./grocery-generation-summary";
import { Button } from "./ui";
import { loadAutomationPreferences, saveAutomationPreferences } from "@/lib/automation-preferences";
const kinds: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const iso = (date: Date) => date.toISOString().slice(0, 10);
const add = (date: Date, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const monday = () => { const date = new Date(); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(0, 0, 0, 0); return date; };
export function MealPlannerScreen({ householdId }: { householdId: string }) {
  const [week, setWeek] = useState(monday);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [pick, setPick] = useState<{ date: string; type: MealType; meal?: PlannedMeal } | null>(null);
  const [summary, setSummary] = useState<GroceryGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(() => loadAutomationPreferences(householdId).autoGenerateAfterMealChange);
  const load = useCallback(() => mealApi.week(householdId, iso(week)).then(setPlan), [householdId, week]);
  useEffect(() => { void load(); }, [load]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => add(week, index)), [week]);
  async function choose(recipe: Recipe) { if (!pick) return; let active = plan; if (!active) { active = await mealApi.createPlan(householdId, iso(week)); setPlan(active); } const input = { mealDate: pick.date, mealType: pick.type, recipeId: recipe.id }; const meal = pick.meal ? await mealApi.update(householdId, active.id, pick.meal.id, { ...input, version: pick.meal.version }) : await mealApi.create(householdId, active.id, input); setPlan({ ...active, meals: pick.meal ? active.meals.map(value => value.id === meal.id ? meal : value) : [...active.meals, meal] }); setPick(null); if (autoGenerate) { setGenerating(true); try { setSummary(await generateGroceryList(householdId, iso(week))); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not automatically generate grocery items."); } finally { setGenerating(false); } } }
  async function generate() { setGenerating(true); setNotice(""); try { setSummary(await generateGroceryList(householdId, iso(week))); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not generate grocery items."); } finally { setGenerating(false); } }
  return <section><div className="flex justify-between"><div><p className="text-xs font-black">WEEKLY PLAN</p><h1 className="text-3xl font-black">Meals</h1></div><div><button aria-label="Previous week" onClick={() => setWeek(add(week, -7))}>←</button> <button aria-label="Next week" onClick={() => setWeek(add(week, 7))}>→</button></div></div>{notice && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{notice}</p>}<Button className="mt-4 w-full" disabled={generating || !plan?.meals.some(meal => meal.recipeId)} onClick={() => void generate()}>{generating ? "Generating..." : "Generate Grocery List"}</Button><label className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl border bg-white p-3"><input type="checkbox" checked={autoGenerate} onChange={event => { const value = event.target.checked; setAutoGenerate(value); saveAutomationPreferences(householdId, { autoGenerateAfterMealChange: value }); }} className="h-5 w-5 accent-[#315b46]" /><span><span className="block font-black">Auto-generate grocery list</span><span className="block text-xs text-[#6d7d74]">After a recipe is added or changed, refresh grocery needs for this week.</span></span></label><div className="mt-5 space-y-4">{days.map(day => <article key={iso(day)} className="rounded-3xl border bg-white p-4"><h2 className="font-black">{day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2><div className="mt-3 grid gap-2 sm:grid-cols-3">{kinds.map(type => { const linked = plan?.meals.find(value => value.mealDate === iso(day) && value.mealType === type); return <button key={type} onClick={() => setPick({ date: iso(day), type, meal: linked })} className="rounded-2xl bg-[#f4f6f2] p-3 text-left"><p className="text-xs font-black">{type}</p>{linked ? <><b>{linked.recipe?.name ?? linked.displayName}</b><p className="text-xs">{linked.recipe?.ingredients.length ?? 0} ingredients · {linked.servings} servings</p></> : <span>+ Select recipe</span>}</button>; })}</div></article>)}</div>{pick && <RecipeSelectionDialog householdId={householdId} onClose={() => setPick(null)} onSelect={recipe => void choose(recipe)} />}{summary && <GroceryGenerationSummary result={summary} onClose={() => { setSummary(null); window.location.reload(); }} />}</section>;
}


