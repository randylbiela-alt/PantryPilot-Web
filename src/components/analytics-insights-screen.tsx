"use client";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import type { GroceryList, PantryItem } from "@/lib/types";
import type { MealPlan } from "@/lib/meal-types";
import { mealApi } from "@/lib/meal-api";
import { recipeApi } from "@/lib/recipe-api";
import { intelligenceApi } from "@/lib/intelligence-api";
import { buildAnalytics, type AnalyticsSnapshot } from "@/lib/analytics";
import { AlertCard, EmptyState, MetricCard, SectionHeader } from "./design-system";
import { Button } from "./ui";
import { ErrorState, Loading } from "./status";

const iso=(date:Date)=>date.toISOString().slice(0,10);
const monday=()=>{const date=new Date();const day=date.getDay();date.setDate(date.getDate()-(day===0?6:day-1));date.setHours(0,0,0,0);return date;};

export function AnalyticsInsightsScreen({householdId,pantry,groceryList}:{householdId:string;pantry:PantryItem[];groceryList:GroceryList}){
  const [snapshot,setSnapshot]=useState<AnalyticsSnapshot|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<unknown>(null);
  const load=useCallback(async()=>{setLoading(true);setError(null);try{const week=iso(monday());const[recipes,mealPlan,intelligence]=await Promise.all([recipeApi.list(householdId),mealApi.week(householdId,week),intelligenceApi.dashboard(householdId,week)]);setSnapshot(buildAnalytics({pantry,groceryList,recipes,mealPlan:mealPlan as MealPlan|null,intelligence}));}catch(caught){setError(caught);}finally{setLoading(false);}},[groceryList,householdId,pantry]);
  useEffect(()=>{queueMicrotask(()=>void load());},[load]);
  if(loading)return <Loading label="Loading analytics and insights"/>;if(error)return <ErrorState error={error} retry={load}/>;if(!snapshot)return null;
  return <section aria-label="Analytics and insights"><SectionHeader eyebrow="Pantry analytics" title="Analytics & Insights" description="A current-state view calculated from live pantry, grocery, recipe, meal-plan, and intelligence data." action={<Button aria-label="Refresh analytics" onClick={()=>void load()}><RefreshCw size={17}/></Button>}/>
    <div className="mt-5 grid grid-cols-2 gap-3"><MetricCard label="Pantry items" value={snapshot.inventory.items} detail={`${snapshot.inventory.categories} categories`}/><MetricCard label="Inventory units" value={snapshot.inventory.units} detail="sum of current quantities"/><MetricCard label="Shopping" value={`${snapshot.grocery.completionPercent}%`} detail={`${snapshot.grocery.open} items remaining`}/><MetricCard label="Meal readiness" value={`${snapshot.meals.coveragePercent}%`} detail={`${snapshot.meals.cookable} of ${snapshot.meals.planned} cookable`}/><MetricCard label="Recipes" value={snapshot.recipes.total} detail={`${snapshot.recipes.favorites} favorites`}/><MetricCard label="Recommended" value={snapshot.recipes.recommended} detail="recipes at 80%+ match"/></div>
    <section className="mt-7"><h2 className="text-xl font-black">Inventory mix</h2>{snapshot.categories.length?<div className="mt-3 space-y-3">{snapshot.categories.slice(0,8).map(category=><article key={category.name} className="rounded-2xl border bg-white p-3"><div className="flex justify-between gap-3 text-sm"><b>{category.name}</b><span>{category.count} · {category.percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e9e5]"><div className="h-full rounded-full bg-[#7b9c63]" style={{width:`${category.percent}%`}}/></div></article>)}</div>:<EmptyState icon={<BarChart3 size={30}/>} title="No inventory categories" detail="Add pantry items to build the category mix."/>}</section>
    <section className="mt-7"><h2 className="text-xl font-black">Operational metrics</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><MetricCard label="Low stock" value={snapshot.inventory.lowStock} detail="below threshold"/><MetricCard label="Expiring" value={snapshot.inventory.expiring} detail="within seven days"/><MetricCard label="Grocery complete" value={`${snapshot.grocery.completed}/${snapshot.grocery.total}`} detail="checked items"/><MetricCard label="Recipe depth" value={snapshot.recipes.averageIngredients} detail="average ingredients per recipe"/></div></section>
    <section className="mt-7"><h2 className="text-xl font-black">Actionable insights</h2><div className="mt-3 space-y-3">{snapshot.insights.length?snapshot.insights.map((insight,index)=><AlertCard key={`${insight.title}-${index}`} tone={insight.tone} title={insight.title} detail={insight.detail}/>):<EmptyState title="No insights yet" detail="Add pantry, grocery, recipe, or meal-plan data to generate insights."/>}</div></section>
    <p className="mt-6 text-xs leading-5 text-[#718078]">Metrics reflect current application data. Historical trends, costs, consumption, and waste are not estimated because those events are not present in the current data model.</p>
  </section>;
}
