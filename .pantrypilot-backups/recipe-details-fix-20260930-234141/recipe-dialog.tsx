"use client";

import { useState } from "react";
import type { Recipe, RecipeInput } from "@/lib/recipe-types";
import { Button, Input } from "./ui";

const emptyIngredient = { name: "", quantity: 1, unit: "item" };

export function RecipeDialog({ recipe, onClose, onSave }: { recipe?: Recipe; onClose: () => void; onSave: (value: RecipeInput) => Promise<void> }) {
  const [name, setName] = useState(recipe?.name ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings ?? 4);
  const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes ?? 0);
  const [cookMinutes, setCookMinutes] = useState(recipe?.cookMinutes ?? 0);
  const [favorite, setFavorite] = useState(recipe?.favorite ?? false);
  const [tags, setTags] = useState((recipe?.tags ?? []).join(", "));
  const [ingredients, setIngredients] = useState(recipe?.ingredients.map(value => ({ name: value.name, quantity: Number(value.quantity), unit: value.unit })) ?? [{ ...emptyIngredient }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || ingredients.length === 0 || ingredients.some(value => !value.name.trim() || !value.unit.trim() || value.quantity <= 0)) {
      setError("Enter a recipe name and at least one valid ingredient.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({ name: name.trim(), description: description.trim() || null, servings, prepMinutes, cookMinutes, favorite, tags: tags.split(",").map(value => value.trim()).filter(Boolean), ingredients });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save recipe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="recipe-dialog-title" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-[#faf8f1] p-5 shadow-xl">
        <h2 id="recipe-dialog-title" className="text-2xl font-black">{recipe ? "Edit recipe" : "Create recipe"}</h2>
        <label className="mt-4 block font-bold">Name<Input autoFocus value={name} onChange={event => setName(event.target.value)} /></label>
        <label className="mt-3 block font-bold">Description<Input value={description} onChange={event => setDescription(event.target.value)} /></label>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <label className="font-bold">Servings<Input type="number" min={1} max={50} value={servings} onChange={event => setServings(Number(event.target.value))} /></label>
          <label className="font-bold">Prep min<Input type="number" min={0} value={prepMinutes} onChange={event => setPrepMinutes(Number(event.target.value))} /></label>
          <label className="font-bold">Cook min<Input type="number" min={0} value={cookMinutes} onChange={event => setCookMinutes(Number(event.target.value))} /></label>
        </div>
        <label className="mt-3 block font-bold">Tags<Input value={tags} onChange={event => setTags(event.target.value)} placeholder="quick, dinner" /></label>
        <label className="mt-3 flex items-center gap-2 font-bold"><input type="checkbox" checked={favorite} onChange={event => setFavorite(event.target.checked)} /> Favorite</label>
        <fieldset className="mt-4"><legend className="font-black">Ingredients</legend>
          {ingredients.map((ingredient, index) => <div key={index} className="mt-2 grid grid-cols-[1fr_80px_90px_auto] gap-2">
            <Input aria-label={`Ingredient ${index + 1} name`} value={ingredient.name} onChange={event => setIngredients(values => values.map((value, position) => position === index ? { ...value, name: event.target.value } : value))} />
            <Input aria-label={`Ingredient ${index + 1} quantity`} type="number" min="0.001" step="0.001" value={ingredient.quantity} onChange={event => setIngredients(values => values.map((value, position) => position === index ? { ...value, quantity: Number(event.target.value) } : value))} />
            <Input aria-label={`Ingredient ${index + 1} unit`} value={ingredient.unit} onChange={event => setIngredients(values => values.map((value, position) => position === index ? { ...value, unit: event.target.value } : value))} />
            <button type="button" aria-label={`Remove ingredient ${index + 1}`} onClick={() => setIngredients(values => values.filter((_, position) => position !== index))}>×</button>
          </div>)}
          <button type="button" className="mt-3 font-bold text-[#315b46]" onClick={() => setIngredients(values => [...values, { ...emptyIngredient }])}>+ Add ingredient</button>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3"><Button type="button" onClick={onClose} className="border !bg-white !text-[#203a2e]">Cancel</Button><Button disabled={busy}>{busy ? "Saving..." : "Save recipe"}</Button></div>
      </form>
    </div>
  );
}
