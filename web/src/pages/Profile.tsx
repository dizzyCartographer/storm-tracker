import { useEffect, useState } from "react";
import { authClient } from "../lib/auth";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setEmail(session.data.user.email);
        setName(session.data.user.name ?? "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await authClient.updateUser({ name: name.trim() });
      setMsg("Saved");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");

    if (newPassword.length < 8) {
      setPwMsg("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg("Passwords do not match");
      return;
    }

    setPwSaving(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.error) {
        setPwMsg(res.error.message ?? "Failed to change password");
      } else {
        setPwMsg("Password changed");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwMsg(""), 3000);
      }
    } catch {
      setPwMsg("Failed to change password");
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return <p className="text-[#475569] py-8 text-center">Loading...</p>;
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-[#D1E8E4] px-3 py-2 text-sm bg-white focus:border-[#0D9488] focus:outline-none focus:ring-1 focus:ring-[#0D9488]";

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-[#0F172A]">Profile</h1>

      {/* Display name */}
      <form onSubmit={handleSaveName} className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-[#E2F0ED] space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0F172A]">Email</label>
          <p className="mt-1 text-sm text-[#475569]">{email}</p>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#0F172A]">
            Display name
          </label>
          <input
            id="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {msg && <span className="text-sm text-[#059669]">{msg}</span>}
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-[#E2F0ED] space-y-4">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Change Password</h2>
        <div>
          <label htmlFor="currentPw" className="block text-sm font-medium text-[#0F172A]">
            Current password
          </label>
          <input
            id="currentPw"
            type="password"
            className={inputClass}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="newPw" className="block text-sm font-medium text-[#0F172A]">
            New password
          </label>
          <input
            id="newPw"
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmPw" className="block text-sm font-medium text-[#0F172A]">
            Confirm new password
          </label>
          <input
            id="confirmPw"
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {pwMsg && (
          <p className={`text-sm ${pwMsg === "Password changed" ? "text-[#059669]" : "text-[#DC2626]"}`}>
            {pwMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50 transition-colors"
        >
          {pwSaving ? "Changing..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
