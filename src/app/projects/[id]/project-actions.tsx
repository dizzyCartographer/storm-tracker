"use client";

import { useState } from "react";
import { setDefaultTenant, deleteTenant } from "@/lib/actions/tenant-actions";
import { useRouter } from "next/navigation";

export function ProjectActions({
  tenantId,
  isOwner,
  isDefault,
}: {
  tenantId: string;
  isOwner: boolean;
  isDefault: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSetDefault() {
    setBusy(true);
    await setDefaultTenant(isDefault ? null : tenantId);
    router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteTenant(tenantId);
    if (result.error) {
      alert(result.error);
      setBusy(false);
    } else {
      router.push("/projects");
    }
  }

  return (
    <div className="mt-10 border-t border-gray-200 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Default project</p>
          <p className="text-xs text-gray-500">
            {isDefault
              ? "This is your default project. Dashboard, log, and history will open to it."
              : "Set as default to open this project automatically."}
          </p>
        </div>
        <button
          onClick={handleSetDefault}
          disabled={busy}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            isDefault
              ? "border border-gray-300 hover:bg-gray-50"
              : "bg-gray-900 text-white hover:bg-gray-800"
          } disabled:opacity-50`}
        >
          {isDefault ? "Remove default" : "Set as default"}
        </button>
      </div>

      {isOwner && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">Delete project</p>
            <p className="text-xs text-gray-500">
              Permanently delete this project and all its data. This cannot be undone.
            </p>
          </div>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
