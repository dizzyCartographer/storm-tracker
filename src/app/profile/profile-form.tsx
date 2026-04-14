"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSavingName(true);
    setNameMessage("");

    try {
      await authClient.updateUser({ name: trimmed });
      setNameMessage("Saved");
      router.refresh();
      setTimeout(() => setNameMessage(""), 2000);
    } catch {
      setNameMessage("Failed to update name");
    }

    setSavingName(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError(false);

    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters");
      setPasswordError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match");
      setPasswordError(true);
      return;
    }

    setSavingPassword(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (result.error) {
        setPasswordMessage(result.error.message ?? "Failed to change password");
        setPasswordError(true);
      } else {
        setPasswordMessage("Password changed");
        setPasswordError(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMessage(""), 3000);
      }
    } catch {
      setPasswordMessage("Failed to change password");
      setPasswordError(true);
    }

    setSavingPassword(false);
  }

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mt-6 space-y-8">
      {/* Display name */}
      <form onSubmit={handleNameSave} className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Display name
        </h2>
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savingName || !name.trim() || name.trim() === initialName}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Update name"}
          </button>
          {nameMessage && (
            <span className="text-sm text-green-600">{nameMessage}</span>
          )}
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Change password
        </h2>
        <div>
          <label className={labelClass}>Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Confirm new password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {savingPassword ? "Changing..." : "Change password"}
          </button>
          {passwordMessage && (
            <span className={`text-sm ${passwordError ? "text-red-600" : "text-green-600"}`}>
              {passwordMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
