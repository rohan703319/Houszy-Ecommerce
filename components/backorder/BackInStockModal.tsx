"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  variantId?: string | null;
}

export default function BackInStockModal({
  open,
  onClose,
  productId,
  variantId,
}: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (!email) {
      setError("Please enter email");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/back-in-stock-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: email,
            productVariantId: variantId ?? null,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Subscription failed");
      }

      setMessage("You'll be notified when product is back in stock ✅");

      setTimeout(() => {
        onClose();
        setMessage(null);
        setEmail("");
      }, 1800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-center mb-2">
          Notify when available
        </h3>

        <p className="text-sm text-gray-600 text-center mb-4">
          Enter your email to get notified when this product is back in stock.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border rounded-md px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600 mb-2 text-center">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-600 mb-2 text-center">{message}</p>
        )}

        <Button
          onClick={submit}
          disabled={loading}
          className="w-full bg-[#f38918] text-white"
        >
          {loading ? "Submitting..." : "Notify Me"}
        </Button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
