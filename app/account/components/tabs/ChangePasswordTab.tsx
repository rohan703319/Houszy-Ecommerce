"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function ChangePasswordTab() {
  const { accessToken, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  const isPasswordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.special;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async () => {
    setError(null); setSuccess(false);
    if (!currentPassword) { setError("Current password is required."); return; }
    if (!isPasswordValid) { setError("Please meet all password requirements."); return; }
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || "Current password is incorrect");
      setSuccess(true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { logout(); window.location.replace("/account"); }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="border-b border-gray-100 pb-4 flex flex-col items-start gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Security Settings</h1>
        <p className="text-[11px] font-medium text-gray-500">Update your password.</p>
      </div>

      <form autoComplete="off" className="space-y-4">
        <input type="text" name="username" autoComplete="username" className="hidden" />
        <input type="password" name="password" autoComplete="current-password" className="hidden" />

        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Current Password *</label>
          <input
            type={showCurrent ? "text" : "password"} value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} name="new-pass-field" autoComplete="new-password" data-lpignore="true" data-form-type="other" readOnly onFocus={(e) => e.target.removeAttribute("readonly")}
            className="w-full h-10 bg-gray-50 rounded-xl px-3 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all"
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[26px] text-gray-400 hover:text-[#f38918] transition-colors p-1">
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">New Password *</label>
          <input
            type={showNew ? "text" : "password"} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password"
            className="w-full h-10 bg-gray-50 rounded-xl px-3 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all"
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[26px] text-gray-400 hover:text-[#f38918] transition-colors p-1">
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <div className="mt-3 grid grid-cols-4 gap-0">
            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${passwordChecks.length ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 size={12} className={passwordChecks.length ? "opacity-100" : "opacity-30"} /> 8+ chars
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${passwordChecks.uppercase ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 size={12} className={passwordChecks.uppercase ? "opacity-100" : "opacity-30"} /> 1 Upper
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${passwordChecks.lowercase ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 size={12} className={passwordChecks.lowercase ? "opacity-100" : "opacity-30"} /> 1 Lower
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${passwordChecks.special ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 size={12} className={passwordChecks.special ? "opacity-100" : "opacity-30"} /> 1 Special
            </span>
          </div>
        </div>

        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Confirm Password *</label>
          <input
            type={showConfirm ? "text" : "password"} value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-10 bg-gray-50 rounded-xl px-3 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[26px] text-gray-400 hover:text-[#f38918] transition-colors p-1">
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {confirmPassword.length > 0 && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5 ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
              {passwordsMatch ? <><CheckCircle2 size={12} /> Match</> : "Does not match"}
            </p>
          )}
        </div>

        {error && <div className="text-[11px] font-bold text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
        {success && <div className="text-[11px] font-bold text-green-700 bg-green-50 p-3 rounded-xl flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Success. Redirecting…</div>}

        <div className="pt-2">
          <button
            type="button" onClick={handleSubmit} disabled={loading || !isPasswordValid || !passwordsMatch}
            className={`w-full sm:w-auto px-6 h-10 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${loading || !isPasswordValid || !passwordsMatch ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-900 shadow-sm"}`}
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
