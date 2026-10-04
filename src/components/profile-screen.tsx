"use client";
import { useState } from "react";
import type { Diet, HouseholdSettings, ProfileSettings } from "@/lib/onboarding-types";
import { Button, Input } from "./ui";
import { NotificationSettings } from "./notification-settings";
import { AccessibilitySettings } from "./accessibility-settings";
import { InviteManager } from "./invite-manager";
import { CollaborationScreen } from "./collaboration-screen";
const diets: Diet[] = ["No restrictions", "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Low carb"];
export function ProfileScreen({ profile, household, onSave, onSignOutAllDevices }: { profile: ProfileSettings; household: HouseholdSettings; onSave: (value: { name: string; timeZone: string; householdSize: number; weeklyBudget: number | null; dietaryPreference: Diet; profileVersion: number; householdVersion: number }) => Promise<void>; onSignOutAllDevices: () => Promise<void> }) {
  const [name, setName] = useState(household.name);
  const [timeZone, setTimeZone] = useState(profile.timeZone);
  const [size, setSize] = useState(String(profile.householdSizeDefault));
  const [budget, setBudget] = useState(profile.weeklyBudget === null ? "" : String(profile.weeklyBudget));
  const [diet, setDiet] = useState<Diet>(profile.defaultDiet);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); try { await onSave({ name, timeZone, householdSize: Number(size), weeklyBudget: budget ? Number(budget) : null, dietaryPreference: diet, profileVersion: profile.version, householdVersion: household.version }); setMessage("Settings saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save settings."); } finally { setBusy(false); } }
  return <div><form onSubmit={submit}><p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">Account</p><h1 className="mt-2 text-3xl font-black">Profile</h1><p className="mt-2 text-sm text-[#6d7d74]">Manage household defaults, collaboration, preferences, and sessions.</p>{message && <p className="mt-4 rounded-2xl bg-[#edf5db] p-4 text-sm text-[#315b46]">{message}</p>}<div className="mt-5 space-y-4"><label className="block font-bold">Household name<Input value={name} onChange={event => setName(event.target.value)} className="mt-1"/></label><label className="block font-bold">Household size<Input type="number" min="1" max="50" value={size} onChange={event => setSize(event.target.value)} className="mt-1"/></label><label className="block font-bold">Weekly budget<Input type="number" min="0" value={budget} onChange={event => setBudget(event.target.value)} className="mt-1"/></label><label className="block font-bold">Diet<select className="mt-1 min-h-11 w-full rounded-2xl border bg-white px-3" value={diet} onChange={event => setDiet(event.target.value as Diet)}>{diets.map(value => <option key={value}>{value}</option>)}</select></label><label className="block font-bold">Time zone<Input value={timeZone} onChange={event => setTimeZone(event.target.value)} className="mt-1"/></label></div><Button disabled={busy} className="mt-6 w-full">{busy ? "Saving..." : "Save settings"}</Button></form><CollaborationScreen householdId={household.id}/><InviteManager householdId={household.id}/><AccessibilitySettings/><NotificationSettings householdId={household.id}/><section className="mt-8 border-t pt-6" aria-labelledby="session-heading"><h2 id="session-heading" className="text-xl font-black">Sessions</h2><p className="mt-2 text-sm text-[#6d7d74]">Revoke every active PantryPilot session for this account.</p><Button type="button" onClick={() => void onSignOutAllDevices()} className="mt-4 w-full !bg-[#9a4f36]">Sign out all devices</Button></section></div>;
}
