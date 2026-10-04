export type HouseholdRole = "OWNER" | "ADMIN" | "ADULT" | "MEMBER" | "READ_ONLY";
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "REMOVED";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
export type CollaborationMember = {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: HouseholdRole;
  status: MemberStatus;
  joinedAt: string | null;
  lastLoginAt: string | null;
  provider: string | null;
};
export type CollaborationInvite = {
  id: string;
  email: string;
  role: Exclude<HouseholdRole, "OWNER">;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  acceptedBy: string | null;
};
export type CollaborationSnapshot = {
  currentUserId: string;
  currentRole: HouseholdRole;
  canManage: boolean;
  members: CollaborationMember[];
  invites: CollaborationInvite[];
};
export type ActivityItem = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: unknown;
  occurredAt: string;
  actorName: string;
};
