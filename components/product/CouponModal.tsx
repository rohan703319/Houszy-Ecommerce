"use client";

import { useState } from "react";
import {
  X,
  BadgePercent,
  Trash,
  Tag,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";

export default function CouponModal({
  open,
  onClose,
  couponCode,
  setCouponCode,
  appliedCoupon,
  offers,
  onApply,
  onRemove,
  orderSubtotal,
  productIds,
  categoryIds,
}: any) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const validateAndApply = async (code?: string) => {
    const finalCode = (code ?? couponCode)?.trim();

    if (!finalCode) {
      toast.error("Enter coupon code");
      return;
    }

    // 🚨 SAFETY CHECK
    if (!productIds?.length && !categoryIds?.length) {
      toast.error("Coupon cannot be validated. Missing product data.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        couponCode: finalCode,
        orderSubtotal: Number(orderSubtotal) || 0,
        productIds: productIds ?? [],
        categoryIds: categoryIds ?? [],
      };
      // alert(
      //   "Payload:\n" +
      //   "Subtotal: " + payload.orderSubtotal +
      //   "\nProductIds: " + JSON.stringify(payload.productIds) +
      //   "\nCategoryIds: " + JSON.stringify(payload.categoryIds)
      // );
      console.log("Coupon Validate Payload:", payload);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Discounts/validate-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();
      // alert(
      //   "Response:\n" +
      //   "Success: " + result.success +
      //   "\nMessage: " + result.message +
      //   "\nDiscountAmount: " + result?.data?.discountAmount
      // );
      if (!res.ok || !result.success) {
        toast.error(result?.message || "Coupon does not apply.");
        return;
      }

      /*
        Backend response structure:

        {
          success: true,
          message: "...",
          data: {
            discountId,
            couponCode,
            discountName,
            discountType,
            usePercentage,
            discountPercentage,
            discountAmount,
            isCumulative,
            expiresAt,
            requiresLogin
          }
        }
      */

      const discountData = result.data;

      if (!discountData) {
        toast.error("Invalid discount response");
        return;
      }

      // 🚨 IMPORTANT:
      // Backend discountAmount is FINAL calculated value
      // Do NOT recalc on frontend

      onApply(discountData);

      toast.success(result.message);

    } catch (err) {
      console.error("Coupon validation error:", err);
      toast.error("Something went wrong while validating coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#f38918]" />
                Offers & Coupons
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose the best offer and save instantly
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/70 transition"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* COUPON INPUT */}
        <div className="px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 h-11 rounded-xl border border-gray-300 px-4 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#f38918]"
            />

            <Button
              onClick={() => validateAndApply()}
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-[#f38918] hover:bg-black text-white font-semibold"
            >
              {loading ? "Checking..." : "Apply"}
            </Button>
          </div>
        </div>

        {/* OFFERS LIST */}
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto bg-[#fafafa]">
          {offers?.map((offer: any) => {
            const applied = appliedCoupon?.id === offer.id;

            return (
              <div
                key={offer.id}
                className={`rounded-2xl border p-4 transition-all
                  ${applied
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-[#f38918] hover:shadow-sm"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">

                  <div>
                    <div className="flex items-start gap-2">
                      <Tag className="h-6 w-6 text-[#f38918] mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {offer.name}
                          </p>

                          {offer.usePercentage && (
                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                              {offer.discountPercentage}% OFF
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-[#f38918]">
                          Use Code: {offer.couponCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {applied ? (
                    <Button
                      size="sm"
                      onClick={onRemove}
                      className="rounded-lg bg-red-900 hover:bg-black text-white"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={() => validateAndApply(offer.couponCode)}
                      className="rounded-lg bg-[#f38918] hover:bg-black text-white"
                    >
                      <Ticket className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
          <BadgePercent className="h-4 w-4" />
          Coupons are available for limited time!
        </div>
      </div>
    </div>
  );
}