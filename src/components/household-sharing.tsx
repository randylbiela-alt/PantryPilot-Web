"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { Button, Input } from "./ui";

type InviteRole = "MEMBER" | "READ_ONLY";
type HouseholdInvite = {
  id: string;
  email: string;
  role: InviteRole;
  token: string;
  createdAt: string;
};

function storageKey(householdId: string) {
  return `pantrypilot.household-invites.${householdId}`;
}

function createToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadInvites(householdId: string): HouseholdInvite[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(householdId)) ?? "[]") as HouseholdInvite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function HouseholdSharing({ householdId, householdName }: { householdId: string; householdName: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
  const [invites, setInvites] = useState<HouseholdInvite[]>([]);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => setInvites(loadInvites(householdId)), [householdId]);

  function save(next: HouseholdInvite[]) {
    setInvites(next);
    localStorage.setItem(storageKey(householdId), JSON.stringify(next));
  }

  function invitationUrl(invite: HouseholdInvite) {
    const url = new URL(window.location.origin);
    url.searchParams.set("householdInvite", invite.token);
    return url.toString();
  }

  function createInvite(event: React.FormEvent) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (invites.some(invite => invite.email === normalized)) {
      setMessage("An invitation for this email already exists on this device.");
      return;
    }
    const next: HouseholdInvite = {
      id: createToken(),
      email: normalized,
      role,
      token: createToken(),
      createdAt: new Date().toISOString()
    };
    save([next, ...invites]);
    setEmail("");
    setMessage("Invitation prepared. Copy the link or open an email draft.");
  }

  async function copyInvite(invite: HouseholdInvite) {
    try {
      await navigator.clipboard.writeText(invitationUrl(invite));
      setCopiedId(invite.id);
      setMessage("Invitation link copied.");
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setMessage("The invitation link could not be copied. Use the email action instead.");
    }
  }

  const roleLabel = useMemo(() => ({ MEMBER: "Member", READ_ONLY: "Viewer" } as const), []);

  return <section className="mt-8 border-t pt-6" aria-labelledby="household-sharing-heading">
    <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf5db] text-[#315b46]"><Users size={20} aria-hidden="true" /></span><div><h2 id="household-sharing-heading" className="text-xl font-black">Household sharing</h2><p className="mt-1 text-sm text-[#6d7d74]">Prepare invitation links for {householdName}.</p></div></div>

    <form onSubmit={createInvite} className="mt-4 rounded-3xl border bg-white p-4">
      <label className="block text-sm font-bold">Email address<Input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="family@example.com" className="mt-1" /></label>
      <label className="mt-3 block text-sm font-bold">Access<select value={role} onChange={event => setRole(event.target.value as InviteRole)} className="mt-1 min-h-11 w-full rounded-2xl border bg-white px-3"><option value="MEMBER">Member</option><option value="READ_ONLY">Viewer</option></select></label>
      <Button className="mt-4 w-full"><UserPlus className="mr-2 inline" size={16} />Prepare invitation</Button>
    </form>

    {message && <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-[#edf5db] p-3 text-sm">{message}</p>}

    <div className="mt-5 flex items-center justify-between"><h3 className="font-black">Pending invitations</h3><span className="rounded-full bg-[#edf5db] px-2 py-1 text-xs font-black text-[#315b46]">{invites.length}</span></div>
    {invites.length ? <ul className="mt-3 space-y-3">{invites.map(invite => {
      const url = typeof window === "undefined" ? "" : invitationUrl(invite);
      const subject = encodeURIComponent(`Join ${householdName} on PantryPilot`);
      const body = encodeURIComponent(`You have been invited to join ${householdName} as a ${roleLabel[invite.role].toLowerCase()}.\n\n${url}`);
      return <li key={invite.id} className="rounded-3xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black">{invite.email}</p><p className="mt-1 text-xs text-[#6d7d74]">{roleLabel[invite.role]} · Prepared {new Date(invite.createdAt).toLocaleDateString()}</p></div><button type="button" onClick={() => save(invites.filter(candidate => candidate.id !== invite.id))} aria-label={`Remove invitation for ${invite.email}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-[#9a4f36]"><Trash2 size={16} /></button></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => void copyInvite(invite)} className="min-h-11 rounded-2xl border bg-white px-3 text-sm font-bold text-[#315b46]">{copiedId === invite.id ? <Check className="mr-2 inline" size={16} /> : <Clipboard className="mr-2 inline" size={16} />}Copy link</button><a href={`mailto:${encodeURIComponent(invite.email)}?subject=${subject}&body=${body}`} className="flex min-h-11 items-center justify-center rounded-2xl border bg-white px-3 text-sm font-bold text-[#315b46]"><Mail className="mr-2" size={16} />Email</a></div></li>;
    })}</ul> : <div className="mt-3 rounded-3xl border border-dashed bg-white p-6 text-center"><Users className="mx-auto text-[#486957]" size={28} /><p className="mt-2 font-black">No pending invitations</p><p className="mt-1 text-sm text-[#6d7d74]">Prepare an invitation when someone needs access.</p></div>}

    <p className="mt-4 text-xs leading-5 text-[#718078]">Invitation drafts are stored only on this device. Account provisioning and server-side membership acceptance require a future backend workflow.</p>
  </section>;
}
