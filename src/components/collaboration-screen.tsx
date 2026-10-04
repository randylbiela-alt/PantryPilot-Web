"use client";
import { useCallback, useEffect, useState } from "react";
import { Activity, Clock3, RefreshCw, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { ActivityItem, CollaborationSnapshot, HouseholdRole } from "@/lib/collaboration-types";
import { Button } from "./ui";

const roles: HouseholdRole[] = ["OWNER", "ADMIN", "ADULT", "MEMBER", "READ_ONLY"];
const labels: Record<HouseholdRole, string> = { OWNER: "Owner", ADMIN: "Admin", ADULT: "Adult", MEMBER: "Member", READ_ONLY: "Read only" };
const activityLabels: Record<string, string> = {
  "household.created": "created the household",
  "household.updated": "updated household settings",
  "household.member.role_updated": "changed a member role",
  "household.member.removed": "removed a household member",
  "household.invite.revoked": "revoked an invitation",
  "household.invite.extended": "extended an invitation",
  "pantry.item.created": "added a pantry item",
  "pantry.item.updated": "updated a pantry item",
  "pantry.item.deleted": "removed a pantry item",
  "grocery.list.created": "created a grocery list",
  "grocery.list.updated": "updated a grocery list",
  "grocery.item.created": "added a grocery item",
  "grocery.item.updated": "updated a grocery item",
  "grocery.item.deleted": "removed a grocery item",
  "inventory.consumed": "recorded consumed inventory",
  "inventory.discarded": "recorded discarded inventory",
  "inventory.expired": "recorded expired inventory",
  "inventory.adjusted": "adjusted inventory",
  "intelligence.dashboard_viewed": "viewed household intelligence",
  "intelligence.recommendation_generated": "generated recommendations"
};

export function CollaborationScreen({ householdId }: { householdId: string }) {
  const [snapshot, setSnapshot] = useState<CollaborationSnapshot | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setMessage("");
    try {
      const [next, feed] = await Promise.all([api.collaboration(householdId), api.collaborationActivity(householdId)]);
      setSnapshot(next);
      setActivity(feed.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load household collaboration.");
    }
  }, [householdId]);

  useEffect(() => { void load(); }, [load]);

  async function changeRole(userId: string, role: HouseholdRole) {
    setBusy(`role:${userId}`);
    try { await api.updateMemberRole(householdId, userId, role); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to change role."); }
    finally { setBusy(""); }
  }

  async function remove(userId: string) {
    if (!window.confirm("Remove this member from the household?")) return;
    setBusy(`remove:${userId}`);
    try { await api.removeMember(householdId, userId); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to remove member."); }
    finally { setBusy(""); }
  }

  async function inviteAction(inviteId: string, action: "revoke" | "extend") {
    setBusy(`${action}:${inviteId}`);
    try {
      if (action === "revoke") await api.revokeInvite(householdId, inviteId);
      else await api.extendInvite(householdId, inviteId, 7);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update invitation."); }
    finally { setBusy(""); }
  }

  if (!snapshot) return <section className="mt-8 border-t pt-6"><p className="font-bold">Loading household collaboration...</p>{message && <p className="mt-3 text-sm text-[#9a4f36]">{message}</p>}</section>;

  return <section className="mt-8 border-t pt-6" aria-labelledby="collaboration-heading">
    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf5db] text-[#315b46]"><Users size={20}/></span><div><h2 id="collaboration-heading" className="text-xl font-black">Household collaboration</h2><p className="mt-1 text-sm text-[#6d7d74]">Members, server invitations, and recent household activity.</p></div></div><button type="button" onClick={() => void load()} className="grid h-11 w-11 place-items-center rounded-xl border bg-white" aria-label="Refresh collaboration"><RefreshCw size={17}/></button></div>
    {message && <p role="alert" className="mt-3 rounded-2xl bg-[#fff1e6] p-3 text-sm text-[#8b432e]">{message}</p>}

    <div className="mt-5 flex items-center justify-between"><h3 className="font-black">Members</h3><span className="rounded-full bg-[#edf5db] px-2 py-1 text-xs font-black text-[#315b46]">{snapshot.members.filter(member => member.status === "ACTIVE").length}</span></div>
    <ul className="mt-3 space-y-3">{snapshot.members.map(member => <li key={member.userId} className="rounded-3xl border bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f4f6f2]"><UserRound size={18}/></span><div className="min-w-0 flex-1"><p className="truncate font-black">{member.displayName ?? member.email ?? "PantryPilot member"}</p><p className="truncate text-xs text-[#6d7d74]">{member.email ?? "No email"} · {member.provider ?? "Unknown provider"}</p><p className="mt-1 text-xs text-[#718078]">{member.joinedAt ? `Joined ${new Date(member.joinedAt).toLocaleDateString()}` : "Membership active"}{member.lastLoginAt ? ` · Last active ${new Date(member.lastLoginAt).toLocaleDateString()}` : ""}</p></div><span className="rounded-full bg-[#edf5db] px-2 py-1 text-xs font-black text-[#315b46]">{labels[member.role]}</span></div>{snapshot.canManage && member.userId !== snapshot.currentUserId && member.status === "ACTIVE" && <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><select value={member.role} disabled={busy === `role:${member.userId}`} onChange={event => void changeRole(member.userId, event.target.value as HouseholdRole)} className="min-h-11 rounded-2xl border bg-white px-3 font-bold">{roles.map(role => <option key={role} value={role}>{labels[role]}</option>)}</select><button type="button" disabled={busy === `remove:${member.userId}`} onClick={() => void remove(member.userId)} className="grid h-11 w-11 place-items-center rounded-xl border text-[#9a4f36]" aria-label={`Remove ${member.displayName ?? member.email ?? "member"}`}><Trash2 size={17}/></button></div>}</li>)}</ul>

    {snapshot.canManage && <><div className="mt-6 flex items-center justify-between"><h3 className="font-black">Invitations</h3><span className="rounded-full bg-[#edf5db] px-2 py-1 text-xs font-black text-[#315b46]">{snapshot.invites.length}</span></div>{snapshot.invites.length ? <ul className="mt-3 space-y-3">{snapshot.invites.map(invite => <li key={invite.id} className="rounded-3xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black">{invite.email}</p><p className="mt-1 text-xs text-[#6d7d74]">{labels[invite.role]} · {invite.status} · Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>{invite.acceptedBy && <p className="mt-1 text-xs text-[#718078]">Accepted by {invite.acceptedBy}</p>}</div><ShieldCheck size={18} className="text-[#486957]"/></div>{invite.status === "PENDING" && <div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" disabled={busy === `extend:${invite.id}`} onClick={() => void inviteAction(invite.id, "extend")} className="!bg-white !text-[#315b46] border"><Clock3 className="mr-2 inline" size={16}/>Extend 7 days</Button><Button type="button" disabled={busy === `revoke:${invite.id}`} onClick={() => void inviteAction(invite.id, "revoke")} className="!bg-[#9a4f36]">Revoke</Button></div>}</li>)}</ul> : <p className="mt-3 rounded-3xl border border-dashed bg-white p-5 text-center text-sm text-[#6d7d74]">No server invitations yet.</p>}</>}

    <div className="mt-6 flex items-center gap-2"><Activity size={18} className="text-[#486957]"/><h3 className="font-black">Recent activity</h3></div>
    {activity.length ? <ul className="mt-3 space-y-2">{activity.map(item => <li key={item.id} className="rounded-2xl bg-[#f4f6f2] p-3"><p className="text-sm"><span className="font-black">{item.actorName}</span> {activityLabels[item.action] ?? item.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-[#718078]">{new Date(item.occurredAt).toLocaleString()}</p></li>)}</ul> : <p className="mt-3 rounded-3xl border border-dashed bg-white p-5 text-center text-sm text-[#6d7d74]">No household activity recorded yet.</p>}
  </section>;
}
