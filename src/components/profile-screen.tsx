"use client";
import { useState } from "react";
import type { Diet, HouseholdSettings, ProfileSettings } from "@/lib/onboarding-types";
import { Button, Input } from "./ui";
import { NotificationSettings } from "./notification-settings";
import { AccessibilitySettings } from "./accessibility-settings";
import { HouseholdSharing } from "./household-sharing";
import { InfoBanner, SectionHeader } from "./design-system";
const diets:Diet[]=["No restrictions","Vegetarian","Vegan","Gluten-free","Dairy-free","Low carb"];
export function ProfileScreen({profile,household,onSave,onSignOutAllDevices}:{profile:ProfileSettings;household:HouseholdSettings;onSave:(v:{name:string;timeZone:string;householdSize:number;weeklyBudget:number|null;dietaryPreference:Diet;profileVersion:number;householdVersion:number})=>Promise<void>;onSignOutAllDevices:()=>Promise<void>}){
 const [name,setName]=useState(household.name);const [timeZone,setTimeZone]=useState(profile.timeZone);const [size,setSize]=useState(String(profile.householdSizeDefault));const [budget,setBudget]=useState(profile.weeklyBudget===null?"":String(profile.weeklyBudget));const [diet,setDiet]=useState<Diet>(profile.defaultDiet);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{await onSave({name,timeZone,householdSize:Number(size),weeklyBudget:budget?Number(budget):null,dietaryPreference:diet,profileVersion:profile.version,householdVersion:household.version});setMessage("Settings saved.")}catch(err){setMessage(err instanceof Error?err.message:"Unable to save settings.")}finally{setBusy(false)}}
 return <div><form onSubmit={submit}><SectionHeader eyebrow="Account" title="Profile" description="Manage household defaults, preferences, sharing, and sessions." />{message&&<div className="mt-4"><InfoBanner tone="success">{message}</InfoBanner></div>}<div className="mt-5 space-y-4"><label className="block font-bold">Household name<Input value={name} onChange={e=>setName(e.target.value)} className="mt-1"/></label><label className="block font-bold">Household size<Input type="number" min="1" max="50" value={size} onChange={e=>setSize(e.target.value)} className="mt-1"/></label><label className="block font-bold">Weekly budget<Input type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)} className="mt-1"/></label><label className="block font-bold">Diet<select className="mt-1 min-h-11 w-full rounded-2xl border bg-white px-3" value={diet} onChange={e=>setDiet(e.target.value as Diet)}>{diets.map(v=><option key={v}>{v}</option>)}</select></label><label className="block font-bold">Time zone<Input value={timeZone} onChange={e=>setTimeZone(e.target.value)} className="mt-1"/></label></div><Button disabled={busy} className="mt-6 w-full">{busy?"Saving...":"Save settings"}</Button></form><AccessibilitySettings />
<NotificationSettings householdId={household.id} /><HouseholdSharing householdId={household.id} householdName={household.name} /><section className="mt-8 border-t pt-6" aria-labelledby="session-heading"><h2 id="session-heading" className="text-xl font-black">Sessions</h2><p className="mt-2 text-sm text-[#6d7d74]">Revoke every active PantryPilot session for this account.</p><Button type="button" onClick={()=>void onSignOutAllDevices()} className="mt-4 w-full !bg-[#9a4f36]">Sign out all devices</Button></section></div>
}





