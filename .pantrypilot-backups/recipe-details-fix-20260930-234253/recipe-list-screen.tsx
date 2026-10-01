"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Plus, Search } from "lucide-react";
import { recipeApi, RecipeApiError } from "@/lib/recipe-api";
import type { Recipe, RecipeInput } from "@/lib/recipe-types";
import { Button, Input } from "./ui";
import { InlineAlert, Loading } from "./status";
import { RecipeDialog } from "./recipe-dialog";
import { RecipeDetailsScreen } from "./recipe-details-screen";

export function RecipeListScreen({ householdId }: { householdId: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecipes(await recipeApi.list(householdId, query)); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "Could not load recipes."); }
    finally { setLoading(false); }
  }, [householdId, query]);

  useEffect(() => { const timer = setTimeout(() => void load(), 150); return () => clearTimeout(timer); }, [load]);

  async function save(input: RecipeInput) {
    try {
      if (editing) {
        const updated = await recipeApi.update(householdId, editing.id, { ...input, version: editing.version });
        setRecipes(values => values.map(value => value.id === updated.id ? updated : value));
        setSelected(updated);
      } else {
        const created = await recipeApi.create(householdId, input);
        setRecipes(values => [created, ...values]);
      }
      setEditing(undefined);
      setDialogOpen(false);
    } catch (caught) {
      if (caught instanceof RecipeApiError && caught.status === 409) {
        await load(); setSelected(null); setEditing(undefined); setDialogOpen(false); setNotice("This recipe changed elsewhere. Recipes were refreshed."); return;
      }
      throw caught;
    }
  }

  async function toggleFavorite(recipe: Recipe) {
    const input: RecipeInput = { name: recipe.name, description: recipe.description, servings: recipe.servings, prepMinutes: recipe.prepMinutes, cookMinutes: recipe.cookMinutes, favorite: !recipe.favorite, tags: recipe.tags, ingredients: recipe.ingredients.map(value => ({ name: value.name, quantity: Number(value.quantity), unit: value.unit })) };
    const updated = await recipeApi.update(householdId, recipe.id, { ...input, version: recipe.version });
    setRecipes(values => values.map(value => value.id === updated.id ? updated : value));
    setSelected(updated);
  }

  async function remove(recipe: Recipe) {
    if (!window.confirm(`Delete ${recipe.name}?`)) return;
    await recipeApi.delete(householdId, recipe.id, recipe.version);
    setRecipes(values => values.filter(value => value.id !== recipe.id));
    setSelected(null);
  }

  if (selected) return <><RecipeDetailsScreen recipe={selected} onBack={() => setSelected(null)} onEdit={() => { setEditing(selected); setDialogOpen(true); }} onToggleFavorite={() => toggleFavorite(selected)} onDelete={() => remove(selected)} />{dialogOpen && <RecipeDialog recipe={editing} onClose={() => { setEditing(undefined); setDialogOpen(false); }} onSave={save} />}</>;

  return <section aria-labelledby="recipes-heading"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">Cookbook</p><h1 id="recipes-heading" className="text-4xl font-black">Recipes</h1></div><Button aria-label="Create recipe" onClick={() => { setEditing(undefined); setDialogOpen(true); }}><Plus size={18} /></Button></div>{notice && <div className="mt-4"><InlineAlert message={notice} onDismiss={() => setNotice("")} /></div>}<label className="relative mt-5 block"><Search className="absolute left-3 top-3" size={18} /><span className="sr-only">Search recipes</span><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search recipes" className="pl-10" /></label>{loading ? <Loading label="Loading recipes" /> : <div className="mt-5 space-y-3">{recipes.length ? recipes.map(recipe => <button key={recipe.id} onClick={() => setSelected(recipe)} className="flex w-full items-center justify-between rounded-3xl border bg-white p-4 text-left"><div><h2 className="font-black">{recipe.name}</h2><p className="text-sm text-[#68766f]">{recipe.ingredients.length} ingredients · {recipe.servings} servings</p></div>{recipe.favorite && <Heart size={18} fill="currentColor" className="text-[#315b46]" />}</button>) : <div className="rounded-3xl border bg-white p-8 text-center"><h2 className="text-xl font-black">No recipes yet</h2></div>}</div>}{dialogOpen && <RecipeDialog recipe={editing} onClose={() => { setEditing(undefined); setDialogOpen(false); }} onSave={save} />}</section>;
}
