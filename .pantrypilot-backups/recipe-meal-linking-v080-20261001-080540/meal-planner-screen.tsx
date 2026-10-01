"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { mealApi, MealApiError } from "@/lib/meal-api";
import type { MealPlan, MealType, PlannedMeal, CreateMealInput } from "@/lib/meal-types";
import { MealDialog } from "./meal-dialog";
const types: MealType[]=["BREAKFAST","LUNCH","DINNER"];
function monday(value=new Date()){const d=new Date(value);const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));d.setHours(0,0,0,0);return d}
function iso(d:Date){return d.toISOString().slice(0,10)}
function addDays(d:Date,n:number){const x=new Date(d);x.setDate(x.getDate()+n);return x}
export function MealPlannerScreen({ householdId }:{householdId:string}){
 const [week,setWeek]=useState(()=>monday());const [plan,setPlan]=useState<MealPlan|null>(null);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [dialog,setDialog]=useState<{date:string;type:MealType;item?:PlannedMeal}|null>(null);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const load = useCallback(async () => {setLoading(true);setMessage("");try{setPlan(await mealApi.week(householdId,iso(week)))}catch(e){setMessage(e instanceof Error?e.message:"Could not load meals.")}finally{setLoading(false)}}, [householdId, week]);
 useEffect(() => {
  queueMicrotask(() => {
    void load();
  });
}, [load]);
 async function ensurePlan(){if(plan)return plan;const created=await mealApi.createPlan(householdId,iso(week));setPlan(created);return created}
 async function save(input:CreateMealInput){try{const p=await ensurePlan();if(dialog?.item){const updated=await mealApi.updateMeal(householdId,p.id,dialog.item.id,{...input,version:dialog.item.version});setPlan({...p,meals:p.meals.map(m=>m.id===updated.id?updated:m)})}else{const created=await mealApi.createMeal(householdId,p.id,input);setPlan({...p,meals:[...p.meals,created]})}setDialog(null)}catch(e){if(e instanceof MealApiError&&e.status===409){await load();setDialog(null);setMessage(`This meal changed elsewhere. The week was refreshed.${e.correlationId?` Correlation ID: ${e.correlationId}`:""}`);return}throw e}}
 async function remove(item:PlannedMeal){if(!plan)return;if(!confirm(`Delete ${item.displayName}?`))return;try{await mealApi.deleteMeal(householdId,plan.id,item.id,item.version);setPlan({...plan,meals:plan.meals.filter(m=>m.id!==item.id)})}catch(e){if(e instanceof MealApiError&&e.status===409){await load();setMessage("This meal changed elsewhere. The week was refreshed.");return}setMessage(e instanceof Error?e.message:"Could not delete meal.")}}
 return <section aria-labelledby="meals-heading"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black tracking-[.2em] text-[#486957]">WEEKLY PLAN</p><h1 id="meals-heading" className="text-3xl font-black">Meals</h1></div><div className="flex gap-2"><button aria-label="Previous week" className="rounded-xl border p-2" onClick={()=>setWeek(addDays(week,-7))}><ChevronLeft/></button><button aria-label="Next week" className="rounded-xl border p-2" onClick={()=>setWeek(addDays(week,7))}><ChevronRight/></button></div></div><p className="mt-1 text-sm text-[#68766f]">Week of {iso(week)}</p>{message&&<p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{message}</p>}{loading?<p className="mt-6" role="status">Loading meal plan...</p>:<div className="mt-5 space-y-4">{days.map(day=><article key={iso(day)} className="rounded-3xl border bg-white p-4 shadow-sm"><h2 className="font-black">{day.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{types.map(type=>{const item=plan?.meals.find(m=>m.mealDate===iso(day)&&m.mealType===type);return <div key={type} className="rounded-2xl bg-[#f4f6f2] p-3"><p className="text-xs font-black tracking-wide text-[#486957]">{type}</p>{item?<><p className="mt-1 font-bold">{item.displayName}</p><p className="text-xs text-[#68766f]">{item.servings} servings Â· v{item.version}</p><div className="mt-2 flex gap-2"><button aria-label={`Edit ${item.displayName}`} className="rounded-lg border bg-white p-2" onClick={()=>setDialog({date:iso(day),type,item})}><Pencil size={15}/></button><button aria-label={`Delete ${item.displayName}`} className="rounded-lg border bg-white p-2 text-red-700" onClick={()=>void remove(item)}><Trash2 size={15}/></button></div></>:<button className="mt-2 flex items-center gap-1 text-sm font-bold text-[#315b46]" onClick={()=>setDialog({date:iso(day),type})}><Plus size={15}/> Add meal</button>}</div>})}</div></article>)}</div>}{dialog&&<MealDialog date={dialog.date} mealType={dialog.type} item={dialog.item} onClose={()=>setDialog(null)} onSave={save}/>}</section>
}






