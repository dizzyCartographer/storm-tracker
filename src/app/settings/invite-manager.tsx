"use client";

import { useState } from "react";
import { createInvite, revokeInvite } from "@/lib/actions/invite-actions";
import { TenantRole } from "@/generated/prisma/client";

interface Invite {
  id: string;
  token: string;
  role: TenantRole;
  expiresAt: Date;
}

export function InviteManager({
  tenantId,
  tenantName,
  invites: initialInvites,
  isOwner,
}: {
  tenantId: string;
  tenantName: string;
  invites: Invite[];
  isOwner: boolean;
}) {
  const [invites, setInvites] = useState(initialInvites);
  const [role, setRole] = useState<TenantRole>("CAREGIVER");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOwner) return null;

  async function handleCreate() {
    setCreating(true);
    const result = await createInvite(tenantId, role);
    if ("token" in result && result.token) {
      const token = result.token;
      const link = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(link);
      const newInvite: Invite = {
        id: crypto.randomUUID(),
        token,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      setInvites((prev) => [newInvite, ...prev]);
      setCopiedId(newInvite.id);
      setTimeout(() => setCopiedId(null), 3000);
    }
    setCreating(false);
  }

  async function handleRevoke(inviteId: string) {
    await revokeInvite(inviteId);
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  function copyLink(token: string, id: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  }

  return (
    <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase">
        Invite to {tenantName}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TenantRole)}
          className="rounded border border-gray-200 px-2 py-1.5 text-sm"
        >
          <option value="CAREGIVER">Caregiver</option>
          <option value="TEEN_SELF">Teen (self-observation)</option>
        </select>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create invite link"}
        </button>
      </div>

      {invites.length > 0 && (
        <div className="mt-3 space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2"
            >
              <div className="text-xs">
                <span className="font-medium">
                  {inv.role === "CAREGIVER" ? "Caregiver" : "Teen"}
                </span>
                <span className="ml-2 text-gray-400">
                  expires{" "}
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(inv.token, inv.id)}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  {copiedId === inv.id ? "Copied!" : "Copy link"}
                </button>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
