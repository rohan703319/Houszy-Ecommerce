"use client";

import { useState, useEffect } from "react";
import { X, Tag, Sparkles, Loader2 } from "lucide-react";

interface Props {
  item: any;
  onClose: () => void;
  onApply: (couponData: any) => void;
  isDiscountActive: (d: any) => boolean;
}

export default function ProductOffersModal({
  item,
  onClose,
  onApply,
  isDiscountActive,
}: Props) {
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  const discounts =
    item?.productData?.assignedDiscounts?.filter(
      (d: any) => d.requiresCouponCode && isDiscountActive(d)
    ) ?? [];

  const handleApplyCoupon = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      const subtotal =
        (item.priceBeforeDiscount ?? item.price) *
        (item.quantity ?? 1);

      const productIds = [item.productId];

      const categoryIds =
        item.productData?.categories?.map(
          (c: any) => c.categoryId
        ) ?? [];

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Discounts/validate-coupon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: code,
            orderSubtotal: subtotal,
            productIds,
            categoryIds,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result?.message || "Invalid coupon");
        return;
      }

      onApply(result.data); // trust backend

      onClose();
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center overflow-y-auto pb-10">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden max-h-[85vh] pb-20 sm:pb-0">

        <div className="px-6 py-5 border-b bg-orange-50 flex justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#f38918]" />
            Offers & Coupons
          </h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-6 pt-4 text-sm text-gray-600 line-clamp-2">
          {item.name}
        </p>

        <div className="px-6 py-4 border-b">
          <div className="flex gap-3">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 h-11 rounded-xl border px-4 text-sm"
            />

            <button
              disabled={loading}
              onClick={() => {
                if (!couponInput.trim()) return;
                handleApplyCoupon(couponInput.trim());
              }}
              className="h-11 px-6 rounded-xl bg-[#f38918] text-white font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto bg-[#fafafa]">
          {discounts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No offers available.
            </p>
          ) : (
            discounts.map((d: any) => (
              <div
                key={d.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#f38918] hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* LEFT SIDE (UPDATED PREMIUM UI) */}
                  <div>
                    <div className="flex items-start gap-2">
                      <Tag className="h-5 w-5 text-[#f38918] mt-0.5" />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {d.name}
                          </p>

                          {d.usePercentage && (
                            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                              {d.discountPercentage}% OFF
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-[#f38918] tracking-wide">
                          Use Code: {d.couponCode}
                        </p>

                        {!d.usePercentage && d.discountAmount > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Save £{d.discountAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE BUTTON */}
                  <button
                    disabled={loading}
                    onClick={() => handleApplyCoupon(d.couponCode)}
                    className="rounded-lg bg-[#f38918] hover:bg-black text-white text-xs font-semibold px-4 py-2 transition"
                  >
                    Apply
                  </button>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}