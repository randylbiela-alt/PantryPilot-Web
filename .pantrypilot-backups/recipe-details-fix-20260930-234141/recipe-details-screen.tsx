"use client";

import { Clock, Heart, Pencil, Trash2, Users } from "lucide-react";
import type { Recipe } from "@/lib/recipe-types";
import { Button } from "./ui";

export function RecipeDetailsScreen({
  recipe,
  onBack,
  onEdit,
  onToggleFavorite,
  onDelete
}: {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return (
    <section aria-labelledby="recipe-heading">
      <button className="text-sm font-bold text-[#315b46]" onClick={onBack}>
        ← Back to recipes
      </button>

      <div className="mt-4 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">Recipe</p>
            <h1 id="recipe-heading" className="mt-1 text-3xl font-black">{recipe.name}</h1>
          </div>
          <button
            aria-label={recipe.favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => void onToggleFavorite()}
            className={`rounded-xl border p-3 ${recipe.favorite ? "bg-[#315b46] text-white" : "bg-white text-[#315b46]"}`}
          >
            <Heart size={20} fill={recipe.favorite ? "currentColor" : "none"} />
          </button>
        </div>

        {recipe.description && <p className="mt-3 text-sm text-[#5f6f66]">{recipe.description}</p>}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[#f0f3ed] p-3"><Users className="mx-auto" size={18} /><b>{recipe.servings}</b><p className="text-xs">Servings</p></div>
          <div className="rounded-2xl bg-[#f0f3ed] p-3"><Clock className="mx-auto" size={18} /><b>{recipe.prepMinutes}</b><p className="text-xs">Prep min</p></div>
          <div className="rounded-2xl bg-[#f0f3ed] p-3"><Clock className="mx-auto" size={18} /><b>{recipe.cookMinutes}</b><p className="text-xs">Cook min</p></div>
        </div>

        <h2 className="mt-5 text-xl font-black">Ingredients</h2>
        <ul className="mt-2 space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={ingredient.id ?? `${ingredient.name}-${index}`} className="flex justify-between rounded-xl bg-[#f7f7f2] p-3">
              <span>{ingredient.name}</span>
              <span className="font-bold">{String(ingredient.quantity)} {ingredient.unit}</span>
            </li>
          ))}
        </ul>

        {recipe.tags.length > 0 && <p className="mt-4 text-sm text-[#68766f]">{recipe.tags.join(" · ")}</p>}
        <p className="mt-2 text-xs text-[#84918a]">Version {recipe.version}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button onClick={onEdit}><Pencil size={17} /> Edit</Button>
          <Button onClick={() => void onDelete()} className="border !bg-white !text-red-700"><Trash2 size={17} /> Delete</Button>
        </div>
      </div>
    </section>
  );
}
