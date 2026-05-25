"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Award, Gift } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoyaltyRedemptionBox({
  orderTotal,
  onApply,
  onRemove,
}: {
  orderTotal: number;
  onApply: (points: number, discount: number) => void;
  onRemove: () => void;
}) {
  const { accessToken, isAuthenticated } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [pointsInput, setPointsInput] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // ✅ FETCH BALANCE
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch(`${API_BASE_URL}/api/loyalty/balance`, { headers })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.hasAccount) {
          setBalance(res.data.currentBalance);
        }
      });
  }, [isAuthenticated, accessToken]);

  // ✅ CALCULATE (DRY RUN)
  useEffect(() => {
    if (!pointsInput || !accessToken) return;

    const t = setTimeout(async () => {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/api/loyalty/redeem/calculate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            pointsToRedeem: pointsInput,
            orderAmount: orderTotal,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPreview(data.data);
      }

      setLoading(false);
    }, 400);

    return () => clearTimeout(t);
  }, [pointsInput, orderTotal, accessToken]);

  const handleApply = () => {
    if (!preview?.canRedeem) return;

    setApplied(true);
    onApply(pointsInput, preview.discountAmount);
  };

  const handleRemove = () => {
    setApplied(false);
    setPointsInput(0);
    setPreview(null);
    onRemove();
  };

  if (!isAuthenticated || !balance || balance === 0) return null;

  return (
    <div className="mt-3 rounded border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-3 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-orange-100 text-orange-700 p-1.5 rounded">
          <Award size={14} />
        </div>
        <h3 className="font-semibold text-orange-800 text-sm">
          Redeem Loyalty Points
        </h3>
      </div>

      {/* BALANCE */}
      <p className="text-xs text-gray-600 mb-2">
        <span className="font-medium text-gray-800">
          {balance.toLocaleString()}
        </span>{" "}
        points available
      </p>

      {!applied ? (
        <>
          {/* INPUT */}
          <div className="relative mb-2">
            <input
              type="number"
              min={500}
              value={pointsInput || ""}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPointsInput(value);

                if (!value) setPreview(null); // ✅ empty pe reset
              }}
              placeholder="Enter points"
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs pr-12 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
              pts
            </span>
          </div>

          {/* PREVIEW */}
          {preview && (
            <div
              className={`text-xs mb-2 px-2 py-1.5 rounded ${preview.canRedeem
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "bg-red-50 text-red-600 border border-red-200"
                }`}
            >
              {preview.canRedeem
                ? `🎉 Save £${preview.discountAmount}`
                : preview.cannotRedeemReason}
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleApply}
            disabled={!preview?.canRedeem || loading}
            className={`w-full py-1.5 rounded text-xs font-medium transition-all
            ${!preview?.canRedeem || loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-700 hover:bg-orange-600 text-white"
              }`}
          >
            {loading ? "Redeeming..." : "Redeem"}
          </button>
        </>
      ) : (
        /* APPLIED */
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded px-2 py-1.5">
          <span className="text-orange-700 text-xs font-medium">
            ✓ {pointsInput} points applied
          </span>
          <button
            onClick={handleRemove}
            className="text-red-500 text-[10px] font-medium hover:underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}