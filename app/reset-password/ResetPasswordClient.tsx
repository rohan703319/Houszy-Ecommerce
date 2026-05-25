"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/app/lib/api/auth";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.special;

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token || !email) {
      setError("Invalid reset link.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await resetPassword(email, token, newPassword);

      setSuccessMessage(
        data?.message || "Password has been reset successfully."
      );

      setTimeout(() => {
        router.replace("/account");
      }, 2000);

    } catch (err: any) {
      setError(err?.message || "Invalid or expired reset token.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 text-lg font-medium">
          Invalid reset link.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* New Password */}
          <div className="relative">
            <label className="text-sm font-medium">
              New Password
            </label>

            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 pr-10"
            />

            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-9 text-gray-500"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <div className="mt-3 text-xs flex flex-wrap gap-3">
              <span className={passwordChecks.length ? "text-green-600" : "text-gray-500"}>
                8+ chars
              </span>
              <span className={passwordChecks.uppercase ? "text-green-600" : "text-gray-500"}>
                1 Uppercase
              </span>
              <span className={passwordChecks.lowercase ? "text-green-600" : "text-gray-500"}>
                1 Lowercase
              </span>
              <span className={passwordChecks.special ? "text-green-600" : "text-gray-500"}>
                1 Special
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="text-sm font-medium">
              Confirm Password
            </label>

            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 pr-10"
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-9 text-gray-500"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            {confirmPassword.length > 0 && (
              <p className={passwordsMatch ? "text-green-600 text-xs mt-2" : "text-red-600 text-xs mt-2"}>
                {passwordsMatch
                  ? "Passwords match"
                  : "Passwords do not match"}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600">
              {successMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            className="w-full h-11 bg-[#f38918] hover:bg-black text-white"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
