"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, X } from "lucide-react";

export default function NewsletterModal({
  isOpen,
  onClose,
  onSubmit,
  error,
  success,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  error?: string | null;
  success?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setLocalError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    // 🔥 EXTRA CHECK (NO DOUBLE DOT)
    if (email.includes("..")) {
      setLocalError("Email cannot contain consecutive dots");
      return;
    }

    setLocalError(null);

    setLoading(true);
    await onSubmit(email);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="relative bg-white rounded-sm w-full max-w-[560px] p-8 md:p-10 shadow-2xl flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black border border-gray-100 shadow-md hover:bg-gray-100 hover:scale-105 transition-all cursor-pointer z-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <h2 className="text-[26px] md:text-[34px] font-medium text-black text-center tracking-tight mb-2 leading-tight">
          Join Our Family
        </h2>

        <p className="text-[12px] md:text-[14px] text-gray-500 text-center mb-6 max-w-[420px] leading-relaxed">
          Subscribe to our newsletter to get 5% off on your first purchase.
        </p>

        {/* Houszy Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo/logo.png?v=3"
            alt="Houszy Logo"
            width={120}
            height={45}
            className="object-contain"
            priority
          />
        </div>

        {/* Newsletter Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-[400px] flex flex-col items-center">
          {/* Email Input */}
          <div className="relative w-full mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-[18px] h-[18px]" />
            </span>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-[4px] text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError(null);
              }}
            />
          </div>

          {/* Error and Success Messages */}
          {(localError || error) && (
            <p className="text-sm text-red-600 mb-3 text-center w-full font-medium">
              {localError || error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600 mb-3 text-center w-full font-medium">
              {success}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-black text-white font-semibold py-3 rounded-[4px] hover:bg-black/90 transition-all text-sm disabled:opacity-60 cursor-pointer text-center"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
