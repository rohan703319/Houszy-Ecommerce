"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2, GiftIcon, AwardIcon, Truck } from "lucide-react";
import { useToast } from "@/components/toast/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProductOffersModal from "@/components/cart/ProductOffersModal";
import ConfirmRemoveModal from "@/components/ui/ConfirmRemoveModal";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import { getOrderSummaryPricing } from "@/utils/pricing";
import { trackViewCart } from "@/lib/analytics";

export default function CartPage() {
  const toast = useToast();
  const { cart, updateQuantity, removeFromCart, updateCart, cartTotal } = useCart();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const didTrackViewCart = useRef(false);

  useEffect(() => {
    if (didTrackViewCart.current || cart.length === 0) return;
    didTrackViewCart.current = true;
    trackViewCart(cart);
  }, [cart]);

  useEffect(() => {
    console.log("CART VAT DEBUG:", cart.map(i => ({
      name: i.name,
      vatRate: i.vatRate,
      vatIncluded: i.vatIncluded,
    })));
  }, [cart]);
  // ================= PHARMA SYNC =================
  const [maxToastMap, setMaxToastMap] = useState<{ [key: string]: boolean }>({});

  const handleCheckout = async () => {

    const inStockItems = cart.filter(item => getItemStock(item) > 0);

    if (inStockItems.length === 0) {
      toast.error("All selected items are out of stock. Please remove them to continue.");
      return;
    }

    // Send only valid items to checkout
    updateCart(inStockItems);

    if (isAuthenticated) {
      sessionStorage.removeItem("buyNowItem");
      router.push("/checkout");

    } else {
      router.push("/account?from=checkout");
    }
  };
  const [removeTarget, setRemoveTarget] = useState<any | null>(null);
  // Single input to try a coupon (applies to every eligible product)
  const [couponInput, setCouponInput] = useState("");
  const [offersItem, setOffersItem] = useState<any | null>(null);
  // ⭐ Product Offers Modal state
  const [showOffers, setShowOffers] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [pharmaEditItem, setPharmaEditItem] = useState<any | null>(null);
  // map itemId->error for stock/qty UI (keeps your existing state shape)
  const [stockError, setStockError] = useState<{ [key: string]: string | null }>({});
  // -------------------------
  // Helpers: determine if discount object is valid now
  // -------------------------
  const isDiscountActive = (d: any) => {
    if (!d || !d.isActive) return false;
    try {
      const now = new Date();
      const start = d.startDate ? new Date(d.startDate) : null;
      const end = d.endDate ? new Date(d.endDate) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    } catch {
      return false;
    }
  };
  // 🎁 Loyalty points per cart item
  const getItemLoyaltyPoints = (item: any) => {
    const pd = item.productData;
    if (!pd || pd.excludeFromLoyaltyPoints) return 0;

    // variant priority
    if (item.variantId && pd.variants?.length) {
      const v = pd.variants.find((x: any) => x.id === item.variantId);
      if (v?.loyaltyPointsEarnable) {
        return v.loyaltyPointsEarnable;
      }
    }

    // product fallback
    if (pd.loyaltyPointsEarnable) {
      return pd.loyaltyPointsEarnable;
    }

    return 0;
  };
  // -------------------------
  // BUILD list of available coupon-able discounts from cart (for UI hint)
  // -------------------------
  const availableCoupons = useMemo(() => {
    const map = new Map<string, { code: string; productIds: string[]; discount: any }>();
    cart.forEach((item) => {
      const pd = item.productData;
      const assigns: any[] = pd?.assignedDiscounts ?? [];
      for (const d of assigns) {
        if (!isDiscountActive(d)) continue;
        if (!d.requiresCouponCode) continue;
        if (!d.couponCode) continue;
        const code = d.couponCode.trim().toLowerCase();
        if (!map.has(code)) {
          map.set(code, { code, productIds: [item.id], discount: d });
        } else {
          map.get(code)!.productIds.push(item.id);
        }
      }
    });
    return Array.from(map.values());
  }, [cart]);

  const subtotalBeforeDiscount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = item.priceBeforeDiscount ?? item.price;
      return sum + base * (item.quantity ?? 1);
    }, 0);
  }, [cart]);

  const oldPriceSummary = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const price = item.price;
        const oldPrice = item.oldPrice ?? item.productData?.oldPrice;
        const qty = item.quantity ?? 1;

        const hasDiscount =
          item.displayDiscountType === "System";

        const pricing = getOrderSummaryPricing({
          price,
          oldPrice,
          quantity: qty,
          hasDiscount,
        });

        acc.subtotal += pricing.subtotal;
        acc.discount += pricing.discount;

        return acc;
      },
      { subtotal: 0, discount: 0 }
    );
  }, [cart]);

  const totalDiscount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item.discountAmount ?? 0) * (item.quantity ?? 1),
      0
    );
  }, [cart]);
  const bundleSavings = useMemo(() => {
    return cart
      .filter(i => i.hasBundleDiscount)
      .reduce(
        (sum, i) => sum + (i.individualSavings ?? 0) * (i.quantity ?? 1),
        0
      );
  }, [cart]);

  const finalDiscount = useMemo(() => {
    return totalDiscount + oldPriceSummary.discount;
  }, [totalDiscount, oldPriceSummary.discount]);
  const totalCombinedDiscount = bundleSavings + finalDiscount;
  const correctSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const qty = item.quantity ?? 1;

      // 🟢 COUPON DISCOUNT — check FIRST (takes priority over all other discount types)
      // finalPrice + discountAmount reconstructs the pre-coupon price reliably
      // both before AND after page refresh, regardless of displayDiscountType.
      if (item.couponCode && (item.discountAmount ?? 0) > 0) {
        const preCouponPrice = (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
        return sum + preCouponPrice * qty;
      }

      // 🔴 SYSTEM DISCOUNT
      if (item.displayDiscountType === "System") {
        const base = item.price + (item.discountAmount ?? 0);
        return sum + base * qty;
      }

      // 🟠 OLD PRICE
      const oldPrice = item.oldPrice ?? item.productData?.oldPrice;
      if (
        item.displayDiscountType === "OldPrice" &&
        oldPrice &&
        oldPrice > item.price
      ) {
        return sum + oldPrice * qty;
      }

      // ⚪ NORMAL
      return sum + item.price * qty;
    }, 0);
  }, [cart]);
  const applyCouponFromBackend = (item: any, couponData: any) => {

    const assigns = item.productData?.assignedDiscounts ?? [];

    const basePrice = item.priceBeforeDiscount ?? item.price;

    // 🔹 AUTO DISCOUNT
    const autoDiscount = assigns.find(
      (d: any) =>
        d &&
        !d.requiresCouponCode &&
        isDiscountActive(d)
    );

    let autoDiscountAmount = 0;

    if (autoDiscount) {
      if (autoDiscount.usePercentage) {
        autoDiscountAmount =
          (basePrice * autoDiscount.discountPercentage) / 100;
      } else {
        autoDiscountAmount = autoDiscount.discountAmount ?? 0;
      }
    }

    // 🔹 COUPON VALUE
    let couponValue = couponData.usePercentage
      ? Math.floor(
        ((basePrice * couponData.discountPercentage) / 100) * 100
      ) / 100
      : couponData.discountAmount ?? 0;

    // 🔥 CUMULATIVE
    let totalDiscount = couponValue;

    if (couponData.isCumulative === true) {
      totalDiscount = couponValue + autoDiscountAmount;
    }

    if (totalDiscount > basePrice) {
      totalDiscount = basePrice;
    }

    const updated = cart.map((ci) =>
      ci.id === item.id && ci.type === item.type
        ? {
          ...ci,
          appliedDiscountId: couponData.discountId,
          couponCode: couponData.couponCode,
          discountAmount: totalDiscount,
          finalPrice: basePrice - totalDiscount,
        }
        : ci
    );

    updateCart(updated);
    toast.success("Coupon applied successfully");
  };

  // -------------------------
  // APPLY COUPON (global input) -> applies to each item that has a matching assignedDiscount
  // -------------------------
  const applyCouponInput = () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }

    let appliedAny = false;

    const updated = cart.map((item) => {
      // ❌ subscription pe coupon nahi
      if (item.type === "subscription") return item;

      const assigns: any[] = item.productData?.assignedDiscounts ?? [];

      const match = assigns.find((d: any) => {
        if (!d || !d.requiresCouponCode) return false;
        if (!isDiscountActive(d)) return false;
        if (!d.couponCode) return false;
        return d.couponCode.trim().toLowerCase() === code.toLowerCase();
      });
      console.log("COUPON MATCH:", {
        product: item.name,
        match
      });
      if (!match) return item;

      // ❌ same coupon dubara apply na ho
      if (
        item.appliedDiscountId === match.id &&
        item.couponCode?.toLowerCase() === code.toLowerCase()
      ) {
        return item;
      }
      const basePrice = item.priceBeforeDiscount ?? item.price;

      // 🔹 Find AUTO discount (same as PDP)
      const activeAutoDiscount = assigns.find(
        (d: any) =>
          d &&
          !d.requiresCouponCode &&
          isDiscountActive(d)
      );
      console.log("AUTO DISCOUNT FOUND:", {
        product: item.name,
        activeAutoDiscount
      });
      let autoDiscountAmount = 0;

      if (activeAutoDiscount) {
        if (activeAutoDiscount.usePercentage) {
          autoDiscountAmount =
            (basePrice * activeAutoDiscount.discountPercentage) / 100;
        } else {
          autoDiscountAmount = activeAutoDiscount.discountAmount ?? 0;
        }
      }

      // 🔹 Coupon value
      let couponValue = match.usePercentage

        ? Math.floor(
          ((basePrice * match.discountPercentage) / 100) * 100
        ) / 100
        : match.discountAmount ?? 0;
      console.log("COUPON VALUE:", {
        product: item.name,
        couponValue,
        isCumulative: match.isCumulative
      });
      if (
        match.maximumDiscountAmount &&
        couponValue > match.maximumDiscountAmount
      ) {
        couponValue = match.maximumDiscountAmount;
      }

      // 🔥 CUMULATIVE LOGIC (same as PDP)
      let totalDiscount = couponValue;

      if (match.isCumulative === true && autoDiscountAmount > 0) {
        totalDiscount = couponValue + autoDiscountAmount;
      }
      console.log("FINAL DISCOUNT:", {
        product: item.name,
        basePrice,
        autoDiscountAmount,
        couponValue,
        totalDiscount
      });
      // safety clamp
      if (totalDiscount > basePrice) {
        totalDiscount = basePrice;
      }

      appliedAny = true;
      return {
        ...item,
        appliedDiscountId: match.id,
        discountAmount: totalDiscount,
        finalPrice: basePrice - totalDiscount,
        couponCode: code,
        priceBeforeDiscount: basePrice,
      };
    });

    if (!appliedAny) {
      toast.error("This coupon is not valid for any product in your cart.");
      return;
    }

    updateCart(updated);
    setCouponInput("");
    toast.success("Coupon applied to eligible items.");
  };


  // -------------------------
  // Remove coupon only from a single item
  // -------------------------
  const removeCouponFromItem = (itemId: string, itemType?: string) => {
    const updated = cart.map((item) => {
      if (!(item.id === itemId && (item.type ?? "one-time") === (itemType ?? item.type ?? "one-time"))) {
        return item;
      }

      const assigns: any[] = item.productData?.assignedDiscounts ?? [];
      const basePrice = item.priceBeforeDiscount ?? item.price;

      // 🔹 find auto discount
      const autoDiscount = assigns.find(
        (d: any) =>
          d &&
          !d.requiresCouponCode &&
          isDiscountActive(d)
      );

      let autoDiscountAmount = 0;

      if (autoDiscount) {
        if (autoDiscount.usePercentage) {
          autoDiscountAmount =
            (basePrice * autoDiscount.discountPercentage) / 100;
        } else {
          autoDiscountAmount = autoDiscount.discountAmount ?? 0;
        }
      }

      return {
        ...item,
        appliedDiscountId: null,
        couponCode: null,
        discountAmount: autoDiscountAmount,
        finalPrice: basePrice - autoDiscountAmount,
        priceBeforeDiscount: basePrice,
      };
    });

    updateCart(updated);
    toast.error("Coupon removed from item.");
  };
  // 🎁 TOTAL LOYALTY POINTS (ORDER LEVEL)
  // 🎁 TOTAL LOYALTY POINTS (PER PRODUCT LINE)
  const totalLoyaltyPoints = useMemo(() => {
    return cart.reduce((sum, item) => {
      const pts = getItemLoyaltyPoints(item);
      if (!pts) return sum;
      return sum + pts; // ❗ no quantity multiplication
    }, 0);
  }, [cart]);



  // -------------------------
  // Group applied coupons for right side UI
  // -------------------------
  const groupedApplied = useMemo(() => {
    const map = new Map<string, { code: string; items: { id: string; name: string; amount: number }[]; totalDiscount: number }>();
    cart.forEach((item) => {
      const code = item.couponCode ?? null;
      if (!code) return;
      const key = code.toLowerCase();
      const amount = item.discountAmount ?? 0;
      if (!map.has(key)) {
        map.set(key, { code, items: [{ id: item.id, name: item.name, amount }], totalDiscount: amount });
      } else {
        const entry = map.get(key)!;
        entry.items.push({ id: item.id, name: item.name, amount });
        entry.totalDiscount += amount;
      }
    });
    return Array.from(map.values());
  }, [cart]);
  const getItemStock = (item: any) => {
    // Variant stock check
    if (item.variantId) {
      const variant = item.productData?.variants?.find(
        (v: any) => v.id === item.variantId
      );

      if (variant && typeof variant.stockQuantity === "number") {
        return variant.stockQuantity;
      }
    }

    // Product stock check
    if (
      item.productData &&
      typeof item.productData.stockQuantity === "number"
    ) {
      return item.productData.stockQuantity;
    }

    // ❗Safety fallback — always high value, not zero
    return 9999;
  };

  // ================= BUNDLE HELPERS =================
  const isBundleParent = (item: any) => Boolean(item.isBundleParent && item.bundleId);
  const isBundleChild = (item: any) => Boolean(item.bundleParentId);

  const getBundleChildren = (bundleId: string) =>
    cart.filter((i) => i.bundleParentId === bundleId);


  // 🔥 BUNDLE MAX QTY (GROUPED MIN STOCK)
  const getBundleMaxQty = (bundleParent: any, bundleChildren: any[]) => {
    if (!bundleParent || !bundleChildren.length) return Infinity;

    // main product stock
    const mainStock = getItemStock(bundleParent);

    // grouped products min stock
    const groupedMinStock = Math.min(
      ...bundleChildren.map((c) => getItemStock(c))
    );

    return Math.min(mainStock, groupedMinStock);
  };
  // 🔹 Count only visible purchasable items (exclude bundle children)
  const purchasableItemCount = useMemo(() => {
    return cart.filter(
      (i) => !isBundleChild(i)
    ).length;
  }, [cart]);
  // ================= GROUPED PRODUCTS UI HELPERS =================
  const isGroupedChild = (item: any) => Boolean(item.parentProductId);

  const getGroupedItems = (parentProductId?: string) => {
    if (!parentProductId) return [];
    return cart.filter(
      (i) => i.parentProductId === parentProductId
    );
  };
  const orderVatAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const rate =
        typeof item.vatRate === "number" ? item.vatRate : 0;

      // line total (VAT inclusive)
      const lineTotal =
        (item.finalPrice ?? item.price) * (item.quantity ?? 1);

      if (rate <= 0) return sum;

      // VAT-inclusive formula
      const vat = (lineTotal * rate) / (100 + rate);
      return sum + vat;
    }, 0);
  }, [cart]);



  const freeShippingThreshold = useMemo(() => {
    let threshold = 0;
    for (const item of cart) {
      if (item.productData) {
        if (item.variantId && item.productData.variants?.length) {
          const v = item.productData.variants.find((x: any) => x.id === item.variantId);
          if (v && v.freeShippingThreshold && v.freeShippingThreshold > 0) {
            threshold = Math.max(threshold, v.freeShippingThreshold);
          }
        }
        if (item.productData.freeShippingThreshold && item.productData.freeShippingThreshold > 0) {
          threshold = Math.max(threshold, item.productData.freeShippingThreshold);
        }
      }
    }
    return threshold;
  }, [cart]);

  // UI render
  // -------------------------
  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-600">
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 24 24" stroke="#9aa1ab" fill="none" strokeWidth="1.4" className="opacity-80 drop-shadow">
            <circle cx="12" cy="12" r="11" fill="#f5f6f7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 6h2l1.5 9h10l2-6H6M8 17.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm8 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          </svg>
        </div>

        <p className="text-xl font-semibold text-gray-700 mt-6">Your cart is empty</p>

        <Link href="/" className="mt-4 bg-[#445D41] text-white px-6 py-2 rounded-lg hover:bg-black transition-all">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Fixed bottom checkout bar — mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-500">Total</span>
            <span className="text-base font-bold text-gray-900">£{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-3 pb-24 lg:pb-3">
        <h1 className="text-lg font-bold mb-3">My Shopping Bag</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT: items */}
          <div className="lg:col-span-2 space-y-2">
            {cart.map((item) => {
              const basePrice = item.priceBeforeDiscount ?? item.price;
              const finalPrice = item.finalPrice ?? item.price;
              const oldPrice = item.oldPrice ?? item.productData?.oldPrice;

              // 🟠 OLD PRICE % CALC
              const oldPricePercent =
                item.displayDiscountType === "OldPrice" &&
                  oldPrice &&
                  oldPrice > basePrice
                  ? Math.round(((oldPrice - basePrice) / oldPrice) * 100)
                  : null;
              // ❌ bundle child direct render nahi hoga
              if (isBundleChild(item)) return null;

              const bundleChildren = isBundleParent(item)
                ? item.bundleId ? getBundleChildren(item.bundleId) : []

                : [];


              return (
                <React.Fragment
                  key={item.id + (item.variantId ?? "") + (item.type ?? "")}
                >

                  <div key={item.id + (item.variantId ?? "") + (item.type ?? "")} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-row gap-3 shadow-sm">

                    {/* Image + delete */}
                    <div className="relative w-[72px] h-[72px] md:w-24 md:h-24 flex-shrink-0">
                      <Link href={`/product/${item.slug}`}>
                        <img
                          src={item.image}
                          alt="no image"
                          className="w-[72px] h-[72px] md:w-24 md:h-24 object-contain rounded-md border bg-gray-50"
                        />
                      </Link>
                      <button
                        onClick={() => setRemoveTarget({ item, bundleChildren })}
                        className="absolute -top-2 -left-2 bg-white border border-gray-200 rounded-full p-1 text-red-500 hover:bg-red-50 shadow-sm transition"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Right: all details */}
                    <div className="flex flex-col flex-1 min-w-0">

                      {/* Row 1: Name + Price */}
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/product/${item.slug}`} className="flex-1 min-w-0 pr-2 md:pr-4">
                          <h2 className="font-medium text-xs md:text-sm text-gray-900 hover:text-[#445D41] leading-tight line-clamp-2">
                            {item.name}
                          </h2>
                        </Link>
                        <div className="flex flex-col items-end flex-shrink-0 ml-1">

                          {/* PRICE ROW */}
                          <div className="flex items-center gap-1 flex-wrap justify-end">

                            {/* FINAL PRICE */}
                            <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                              £{
                                (
                                  (
                                    item.displayDiscountType === "System" ||
                                      item.couponCode
                                      ? (item.finalPrice ?? item.price)
                                      : item.price
                                  ) * (item.quantity ?? 1)
                                ).toFixed(2)
                              }
                            </p>

                            {/* CUT PRICE */}
                            {(() => {

                              let comparePrice: number | null = null;

                              // SYSTEM DISCOUNT
                              // SYSTEM DISCOUNT
                              if (
                                item.displayDiscountType === "System" &&
                                (item.systemDiscountAmount ?? 0) > 0
                              ) {
                                comparePrice =
                                  item.price + (item.discountAmount ?? 0);
                              }

                              // COUPON DISCOUNT — reconstruct pre-coupon price reliably
                              else if (
                                item.couponCode &&
                                (item.discountAmount ?? 0) > 0
                              ) {
                                comparePrice =
                                  (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
                              }

                              // OLD PRICE
                              else if (
                                item.displayDiscountType === "OldPrice"
                              ) {
                                const oldPrice =
                                  item.oldPrice ??
                                  item.productData?.oldPrice;

                                if (oldPrice && oldPrice > item.price) {
                                  comparePrice = oldPrice;
                                }
                              }

                              if (!comparePrice) return null;

                              return (
                                <span className="text-[11px] text-gray-400 line-through whitespace-nowrap">
                                  £{(comparePrice * (item.quantity ?? 1)).toFixed(2)}
                                </span>
                              );

                            })()}

                          </div>

                          {/* COUPON DISCOUNT BADGE — shown when coupon is active */}
                          {item.couponCode && (item.discountAmount ?? 0) > 0 && (() => {
                            const preCouponPrice = (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
                            const pct = Math.round(((item.discountAmount ?? 0) / (preCouponPrice || 1)) * 100);
                            return pct > 0 ? (
                              <span className="text-[10px] font-semibold text-green-700 whitespace-nowrap">
                                {pct}% OFF
                              </span>
                            ) : null;
                          })()}

                          {/* SYSTEM DISCOUNT — only show when NO coupon is active */}
                          {item.displayDiscountType === "System" &&
                            !item.couponCode &&
                            (item.systemDiscountAmount ?? 0) > 0 && (
                              <span className="text-[10px] font-semibold text-green-700 whitespace-nowrap">
                                {Math.round(
                                  ((item.systemDiscountAmount ?? 0) /
                                    ((item.price + (item.discountAmount ?? 0)) || 1)) *
                                  100
                                )}
                                % OFF
                              </span>
                            )}

                          {/* OLD PRICE DISCOUNT */}
                          {item.displayDiscountType === "OldPrice" &&
                            !item.couponCode &&
                            oldPricePercent && (
                              <span className="text-[10px] font-semibold text-green-700 whitespace-nowrap">
                                {oldPricePercent}% OFF
                              </span>
                            )}

                        </div>
                      </div>

                      {/* Row 2: meta (stock / subscription) */}
                      {getItemStock(item) === 0 && (
                        <p className="text-red-600 text-[10px] font-semibold mt-0.5">Out of Stock — remove this item</p>
                      )}
                      {item.type === "subscription" && (
                        <p className="text-xs font-semibold text-indigo-600 mt-1">
                          Subscription • Every{" "}
                          {item.frequency && !isNaN(Number(item.frequency))
                            ? `${item.frequency} `
                            : ""}
                          {item.frequencyPeriod} • {item.subscriptionTotalCycles} cycles
                        </p>
                      )}

                      {/* Row 3: Qty controls + VAT + Loyalty */}
                      <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                        {/* Qty */}
                        <div className="flex items-center border rounded-md h-7">
                          {(item.quantity ?? 1) === 1 ? (
                            <button
                              onClick={() => setRemoveTarget({ item, bundleChildren })}
                              className="px-1.5 h-full text-gray-600 hover:text-red-600 flex items-center"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const minQty = item.productData?.orderMinimumQuantity ?? 1;
                                if ((item.quantity ?? 1) <= minQty) { toast.error(`Minimum order quantity is ${minQty}`); return; }
                                const newQty = (item.quantity ?? 1) - 1;
                                updateQuantity(item.id, newQty);
                                if (item.isBundleParent && item.bundleId) bundleChildren.forEach((c) => updateQuantity(c.id, newQty));
                              }}
                              className="px-1.5 h-full text-gray-700 font-bold text-sm flex items-center"
                            >-</button>
                          )}
                          <input
                            type="number"
                            className="w-8 text-center outline-none font-medium text-sm border-l border-r border-gray-200 h-full"
                            value={item.quantity}
                            onChange={(e) => {
                              let val = parseInt(e.target.value || "1", 10);
                              if (val < 1) return;

                              setMaxToastMap((prev) => ({ ...prev, [item.id]: false }));

                              // bundle check...
                              if (item.isBundleParent && item.bundleId) {
                                const maxQty = getBundleMaxQty(item, bundleChildren);

                                if (val > maxQty) {
                                  toast.error(`Only ${maxQty} items available in bundle`);
                                  val = maxQty;
                                }
                              }

                              updateQuantity(item.id, val);

                              if (item.isBundleParent && item.bundleId)
                                bundleChildren.forEach((c) => updateQuantity(c.id, val));
                            }}
                          />
                          <button
                            onClick={() => {
                              const itemId = item.id;
                              let newQty = (item.quantity ?? 1) + 1;

                              // 🔥 STOCK CHECK (ADD THIS)
                              const stock = getItemStock(item);

                              if (newQty > stock) {
                                if (!maxToastMap[itemId]) {
                                  toast.error(`Only ${stock} items available in stock`);
                                  setMaxToastMap((prev) => ({ ...prev, [itemId]: true }));
                                }
                                return;
                              }

                              // 🔥 BUNDLE CHECK (existing)
                              if (item.isBundleParent && item.bundleId) {
                                const maxQty = getBundleMaxQty(item, bundleChildren);

                                if (newQty > maxQty) {
                                  toast.error(`Only ${maxQty} items available in this bundle item`);
                                  return;
                                }
                              }

                              // ✅ RESET TOAST FLAG
                              setMaxToastMap((prev) => ({ ...prev, [itemId]: false }));

                              updateQuantity(item.id, newQty);

                              if (item.isBundleParent && item.bundleId)
                                bundleChildren.forEach((c) => updateQuantity(c.id, newQty));
                            }}
                            className="px-1.5 h-full text-gray-700 font-bold text-sm flex items-center"
                          >
                            +
                          </button>
                        </div>

                        {/* VAT + Loyalty badges */}
                        <div className="flex flex-wrap items-center gap-1">
                          {typeof item.vatRate === "number" && item.vatRate > 0 && (
                            <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                              {item.vatRate}% VAT
                            </span>
                          )}
                          {(
                            item.vatIncluded === false ||
                            item.vatRate === 0 ||
                            item.vatRate === null
                          ) && (
                              <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                VAT Exempt
                              </span>
                            )}
                          {getItemLoyaltyPoints(item) > 0 && (
                            <div className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                              <AwardIcon className="h-3 w-3 text-green-600" />
                              Earn {getItemLoyaltyPoints(item)} pts
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row 4: Coupon */}
                      {item.couponCode ? (
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 w-fit">
                          <span>Coupon: {item.couponCode}</span>
                          <button onClick={() => removeCouponFromItem(item.id, item.type)} className="text-red-600 underline">Remove</button>
                        </div>
                      ) : availableCoupons.some((c) => c.productIds.includes(item.id)) && (
                        <button
                          onClick={() => { setSelectedItem(item); setShowOffers(true); }}
                          className="flex items-center gap-1 text-[10px] text-green-600 font-medium hover:underline mt-1 w-fit"
                        >
                          <GiftIcon className="h-3.5 w-3.5" />
                          Apply coupon
                        </button>
                      )}

                      {/* Row 5: extras */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.productData?.isPharmaProduct && (
                          <button onClick={() => setPharmaEditItem(item)} className="text-[10px] font-medium text-blue-600 hover:underline">
                            Edit Medical Info
                          </button>
                        )}
                        {item.shipSeparately === true && purchasableItemCount > 1 && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            📦 Ships separately
                          </span>
                        )}
                        {stockError[item.id] && <p className="text-red-600 text-[10px]">{stockError[item.id]}</p>}
                      </div>

                    </div>
                  </div>
                  {/* 🔥 GROUPED PRODUCTS (NESTED) */}
                  {bundleChildren.length > 0 && (
                    <div className="mt-3 ml-6 border-l-2 border-dashed border-gray-300 pl-4 space-y-3">
                      {/* 🔥 SINGLE GROUP REMOVE BUTTON (TOP-LEFT) */}
                      {!item.productData?.automaticallyAddProducts && (
                        <div className="mb-2">

                        </div>
                      )}
                      {bundleChildren.map((gp: any) => (
                        <div
                          key={gp.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/product/${gp.slug}`}
                              className="flex items-center gap-3 group"
                            >
                              <img
                                src={gp.image}
                                alt={"no img"}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            </Link>
                            <div>
                              <Link href={`/product/${gp.slug}`}>
                                <p className="text-sm font-semibold text-gray-800 
              line-clamp-2 max-w-[220px]">
                                  {gp.name}
                                </p>

                              </Link>
                              <div className="flex flex-col">
                                {/* 🔥 BUNDLE PRICE */}
                                {gp.hasBundleDiscount ? (
                                  <>

                                    {/* FINAL PRICE + SAVING */}
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-green-700">
                                        £{(gp.price * gp.quantity).toFixed(2)}
                                      </p>

                                      {(gp.individualSavings ?? 0) > 0 && (
                                        <span className="text-[11px] text-green-600 whitespace-nowrap">
                                          (You save £{(gp.individualSavings * gp.quantity).toFixed(2)})
                                        </span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm font-semibold text-gray-800">
                                    £{(gp.price * gp.quantity).toFixed(2)}
                                  </p>
                                )}

                              </div>

                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-gray-100">
                              <span className="text-sm font-semibold text-gray-800">
                                Qty: {gp.quantity}
                              </span>
                            </div>

                            <span className="text-[11px] text-gray-500 mt-1">
                              Quantity matches main product
                            </span>
                          </div>


                        </div>
                      ))}
                    </div>
                  )}

                </React.Fragment>
              );
            })}

          </div>

          {/* RIGHT: order summary + coupon input */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-2 sticky top-24">
              {/* Free Shipping Progress */}
              {freeShippingThreshold > 0 && (
                <div className="mb-2 bg-[#f8fafc] border border-gray-200 rounded-lg p-2.5">
                  {cartTotal >= freeShippingThreshold ? (
                    <div className="flex items-center gap-2 text-[#445D41] text-xs font-semibold">
                      <Truck size={14} className="flex-shrink-0" />
                      <span>Yay! You get <strong className="text-green-600">FREE Delivery!</strong></span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-gray-700 text-xs mb-1.5 leading-tight">
                        <Truck size={14} className="text-[#445D41] mt-0.5 flex-shrink-0" />
                        <span>
                          Add <strong className="text-[#445D41]">£{(freeShippingThreshold - cartTotal).toFixed(2)}</strong> more for <strong className="text-green-600">FREE Delivery!</strong>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#445D41] h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.min((cartTotal / freeShippingThreshold) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Inline coupon input */}
              <div className="border border-gray-300 rounded-lg p-2 mb-2">
                <h3 className="text-sm font-semibold mb-1.5">Apply Coupon</h3>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#445D41]"
                  />
                  <button onClick={applyCouponInput} className="bg-[#445D41] text-white px-3 py-1.5 rounded-lg text-xs">
                    Apply
                  </button>
                </div>
              </div>
              {totalLoyaltyPoints > 0 && (
                <div className="flex items-center justify-between text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1.5 rounded-lg mb-2">
                  <span>🎁 Total Loyalty Points</span>
                  <span className="font-semibold">{totalLoyaltyPoints} points</span>
                </div>
              )}

              {/* Price details */}
              <h3 className="text-sm font-semibold mb-2">Price Details</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal (Incl. VAT)</span>
                  <span>£{correctSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>VAT</span>
                  <span>£{orderVatAmount.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Bundle Savings</span>
                    <span>- £{bundleSavings.toFixed(2)}</span>
                  </div>
                )}
                {finalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- £{finalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {totalCombinedDiscount > 0 && (
                  <div className="flex justify-between text-green-800 font-semibold border-t pt-1.5 mt-1">
                    <span>Total Discount</span>
                    <span>- £{totalCombinedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t pt-1.5 text-sm">
                  <span>Total Amount</span>
                  <span>
                    £{(correctSubtotal - totalCombinedDiscount).toFixed(2)}
                  </span>
                </div>
              </div>

              <button onClick={handleCheckout} className="hidden lg:block w-full mt-3 bg-[#445D41] hover:bg-black text-white py-2.5 rounded-xl font-semibold text-sm shadow-md">
                Proceed to Checkout
              </button>
              {showOffers && selectedItem && (
                <ProductOffersModal
                  item={selectedItem}
                  onClose={() => {
                    setShowOffers(false);
                    setSelectedItem(null);
                  }}
                  onApply={(couponData) =>
                    applyCouponFromBackend(selectedItem, couponData)
                  }
                  isDiscountActive={isDiscountActive}
                />
              )}
              <ConfirmRemoveModal
                open={!!removeTarget}
                title="Remove item from cart?"
                description="This item will be permanently removed from your shopping bag."
                onCancel={() => setRemoveTarget(null)}
                onConfirm={() => {
                  if (!removeTarget) return;

                  const { item, bundleChildren } = removeTarget;

                  // 🔥 bundle parent → remove children first
                  if (
                    item.isBundleParent === true &&
                    item.purchaseContext === "bundle" &&
                    item.bundleId
                  ) {
                    bundleChildren.forEach((c: any) =>
                      removeFromCart(c.id, c.type)
                    );
                  }

                  removeFromCart(item.id, item.type);

                  setRemoveTarget(null);
                  toast.error("Item removed from cart");
                }}
              />
              {pharmaEditItem && (
                <PharmaQuestionsModal
                  open={!!pharmaEditItem}
                  productId={pharmaEditItem.productId}
                  mode="edit"
                  onClose={() => setPharmaEditItem(null)}
                  onSuccess={() => {
                    setPharmaEditItem(null);
                    toast.success("Medical information updated successfully.");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
