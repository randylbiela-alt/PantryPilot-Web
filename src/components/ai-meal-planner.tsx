"use client";

import { useMemo, useState } from "react";
import { Check, ChefHat, Clock3, Copy, Sparkles, WalletCards } from "lucide-react";
import { Button } from "./ui";

type PlannerRecommendation = {
  recipeId: string;
  recipeName: string;
  score: number;
  availableIngredients: number;
  totalIngredients: number;
  missingIngredients: Array<{ name: string }>;
};

type PlannerMode = "pantry" | "quick" | "budget";

function planKey(householdId: string) {
  return `pantrypilot.ai-meal-plan.${householdId}`;
}

export function AiMealPlanner({
  householdId,
  recommendations
}: {
  householdId: string;
  recommendations: PlannerRecommendation[];
}) {
  const [mode, setMode] = useState<PlannerMode>("pantry");
  const [plannedRecipeId, setPlannedRecipeId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return (JSON.parse(localStorage.getItem(planKey(householdId)) ?? "null") as { recipeId?: string } | null)?.recipeId ?? null;
    } catch {
      return null;
    }
  });
  const [message, setMessage] = useState("");

  const ranked = useMemo(() => {
    return [...recommendations]
      .sort((left, right) => {
        if (mode === "pantry") return right.score - left.score;
        if (mode === "quick") return left.missingIngredients.length - right.missingIngredients.length || right.score - left.score;
        return left.missingIngredients.length - right.missingIngredients.length || right.availableIngredients - left.availableIngredients;
      })
      .slice(0, 3);
  }, [mode, recommendations]);

  function planTonight(recipe: PlannerRecommendation) {
    localStorage.setItem(planKey(householdId), JSON.stringify({
      recipeId: recipe.recipeId,
      recipeName: recipe.recipeName,
      plannedAt: new Date().toISOString()
    }));
    setPlannedRecipeId(recipe.recipeId);
    setMessage(`${recipe.recipeName} is saved as tonight's meal on this device.`);
  }

  async function copyMissing(recipe: PlannerRecommendation) {
    if (!recipe.missingIngredients.length) {
      setMessage(`${recipe.recipeName} is ready to cook.`);
      return;
    }
    const text = recipe.missingIngredients.map(item => item.name).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Missing ingredients for ${recipe.recipeName} copied.`);
    } catch {
      setMessage(`Missing ingredients: ${recipe.missingIngredients.map(item => item.name).join(", ")}`);
    }
  }

  const modes: Array<{ id: PlannerMode; label: string; icon: typeof ChefHat }> = [
    { id: "pantry", label: "Pantry first", icon: ChefHat },
    { id: "quick", label: "Fewest missing", icon: Clock3 },
    { id: "budget", label: "Budget minded", icon: WalletCards }
  ];

  return <section className="mt-6 rounded-[2rem] border border-[#cfd8d2] bg-[#f4f6f2] p-4" aria-labelledby="ai-meal-planner-heading">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#315b46] text-white"><Sparkles size={20} aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#486957]">Meal assist</p><h2 id="ai-meal-planner-heading" className="mt-1 text-xl font-black">What should I cook tonight?</h2><p className="mt-1 text-sm text-[#68766f]">Rank current recipe matches around your preferred planning style.</p></div></div>

    <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Meal planning preference">{modes.map(option => { const Icon = option.icon; const active = option.id === mode; return <button key={option.id} type="button" aria-pressed={active} onClick={() => setMode(option.id)} className={`min-h-16 rounded-2xl border p-2 text-xs font-black ${active ? "border-[#315b46] bg-[#315b46] text-white" : "bg-white text-[#315b46]"}`}><Icon className="mx-auto mb-1" size={17} />{option.label}</button>; })}</div>

    {message && <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-white p-3 text-sm">{message}</p>}

    {ranked.length ? <div className="mt-4 space-y-3">{ranked.map((recipe, index) => {
      const planned = plannedRecipeId === recipe.recipeId;
      return <article key={recipe.recipeId} className="rounded-3xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#607067]">{index === 0 ? "Best match" : `Option ${index + 1}`}</p><h3 className="mt-1 text-lg font-black">{recipe.recipeName}</h3><p className="mt-1 text-sm text-[#68766f]">{recipe.availableIngredients} of {recipe.totalIngredients} ingredients ready</p></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">{recipe.score}%</span></div>{recipe.missingIngredients.length ? <p className="mt-3 text-sm"><b>Missing:</b> {recipe.missingIngredients.map(item => item.name).join(", ")}</p> : <p className="mt-3 text-sm font-bold text-emerald-700">Ready to cook</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => void copyMissing(recipe)} className="min-h-11 rounded-2xl border bg-white px-3 text-sm font-bold text-[#315b46]"><Copy className="mr-2 inline" size={16} />{recipe.missingIngredients.length ? "Copy missing" : "Ready"}</button><Button type="button" onClick={() => planTonight(recipe)}>{planned ? <Check className="mr-2 inline" size={16} /> : <ChefHat className="mr-2 inline" size={16} />}{planned ? "Planned" : "Plan tonight"}</Button></div></article>;
    })}</div> : <div className="mt-4 rounded-3xl border border-dashed bg-white p-6 text-center"><ChefHat className="mx-auto text-[#486957]" size={28} /><h3 className="mt-2 font-black">No recipe matches yet</h3><p className="mt-1 text-sm text-[#6d7d74]">Create recipes with ingredients to receive meal suggestions.</p></div>}

    <p className="mt-4 text-xs leading-5 text-[#718078]">This contained restoration ranks existing Pantry Intelligence recommendations. Tonight's selection is stored on this device and does not modify the weekly meal plan.</p>
  </section>;
}
