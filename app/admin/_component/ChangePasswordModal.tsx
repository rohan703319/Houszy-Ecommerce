"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, X } from "lucide-react";
import { authService } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/admin/_component/CustomToast";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    backend?: string;
  }>({});

  if (!open) return null;

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors: typeof errors = {};

    if (!currentPassword.trim()) nextErrors.currentPassword = "Current password is required.";
    if (!newPassword.trim()) nextErrors.newPassword = "New password is required.";
    if (!confirmPassword.trim()) nextErrors.confirmPassword = "Confirm password is required.";
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Confirm password must match new password.";
    }
    if (newPassword && currentPassword && newPassword === currentPassword) {
      nextErrors.newPassword = "New password must be different from current password.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success(res.message || "Password changed successfully.", {
        position: "top-center",
        autoClose: 3000,
      });

      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to change password.";

      setErrors((prev) => ({ ...prev, backend: msg }));

      toast.error(msg, {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border bg-slate-900/60 border-slate-700 text-sm text-slate-100 px-3 py-2 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-violet-500/20">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg">
              <LockKeyhole className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Change Password</h2>
              <p className="text-xs text-slate-400">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {errors.backend && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
              {errors.backend}
            </div>
          )}

{/* Current password */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-slate-300">Current Password</label>

  <div className="relative">
    <input
      type={showCurrent ? "text" : "password"}
      className={cn(
        inputClass,
        errors.currentPassword && "border-red-500 focus:ring-red-500"
      )}
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      autoComplete="current-password"
      maxLength={64}    // ⭐ Max Length
    />

    <button
      type="button"
      onClick={() => setShowCurrent((p) => !p)}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-100"
      tabIndex={-1}
    >
      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>

  {errors.currentPassword && (
    <p className="text-xs text-red-400">{errors.currentPassword}</p>
  )}
</div>

{/* New password */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-slate-300">New Password</label>

  <div className="relative">
    <input
      type={showNew ? "text" : "password"}
      className={cn(
        inputClass,
        errors.newPassword && "border-red-500 focus:ring-red-500"
      )}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      autoComplete="new-password"
      maxLength={64}    // ⭐ Max Length
    />

    <button
      type="button"
      onClick={() => setShowNew((p) => !p)}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-100"
      tabIndex={-1}
    >
      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>

  {errors.newPassword && (
    <p className="text-xs text-red-400">{errors.newPassword}</p>
  )}
</div>

{/* Confirm password */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-slate-300">Confirm New Password</label>

  <div className="relative">
    <input
      type={showConfirm ? "text" : "password"}
      className={cn(
        inputClass,
        errors.confirmPassword && "border-red-500 focus:ring-red-500"
      )}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      autoComplete="new-password"
      maxLength={64}     // ⭐ Max Length
      onPaste={(e) => e.preventDefault()}   // ❌ Paste disabled only here
    />

    <button
      type="button"
      onClick={() => setShowConfirm((p) => !p)}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-100"
      tabIndex={-1}
    >
      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>

  {errors.confirmPassword && (
    <p className="text-xs text-red-400">{errors.confirmPassword}</p>
  )}
</div>


          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg text-white",
                "bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600",
                "shadow-lg shadow-violet-500/30 transition-all",
                loading && "opacity-70 cursor-not-allowed"
              )}
              disabled={loading}
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
