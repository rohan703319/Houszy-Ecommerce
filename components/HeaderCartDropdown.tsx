"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function HeaderCartDropdown() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [apiThreshold, setApiThreshold] = useState<number>(40);
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const {
    cart,
    cartCount,
    cartTotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // 🔹 Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1. Ignore if element was detached from document (e.g. unmounted during react render cycles)
      if (!document.contains(target)) {
        return;
      }

      // 2. Ignore clicks on any of our quantity buttons/inputs
      if (
        target.classList.contains("cart-qty-btn") ||
        target.closest(".cart-qty-btn")
      ) {
        return;
      }

      // 3. Ignore clicks inside the dropdown
      if (dropdownRef.current?.contains(target)) {
        return;
      }
      if (target.closest('[data-cart-dropdown="true"]')) {
        return;
      }

      // 4. Ignore clicks on header cart toggle button
      if (target.closest('[data-cart-toggle="true"]')) {
        return;
      }

      // 5. Ignore clicks on any add-to-cart, subscription, or buy-now buttons to prevent race conditions/blockage
      const buttonText = target.closest("button")?.textContent?.toLowerCase() || "";
      if (
        buttonText.includes("add to cart") ||
        buttonText.includes("add to basket") ||
        buttonText.includes("buy now") ||
        buttonText.includes("subscription") ||
        buttonText.includes("add subscription") ||
        (buttonText.includes("add") && buttonText.includes("cart")) ||
        target.closest('[data-cart-button="true"]') ||
        target.closest('[data-add-to-cart="true"]')
      ) {
        return;
      }

      closeCart();
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [closeCart]);

  // 🔹 Fetch dynamic delivery option threshold from API
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/Shipping/delivery-options`)
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          const stdOpt = list.find((opt: any) =>
            (opt.name || opt.title || opt.displayName || "").toLowerCase().includes("standard") || opt.isDefault
          );
          const val = stdOpt?.freeShippingThreshold ?? stdOpt?.minOrderAmountForFreeDelivery ?? stdOpt?.threshold;
          if (typeof val === "number" && val > 0) {
            setApiThreshold(val);
          }
        }
      })
      .catch(() => { });
  }, []);

  // 🔹 Fetch active public BuyXGetY discounts
  const [publicDiscounts, setPublicDiscounts] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/Discounts/public`)
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setPublicDiscounts(list.filter((d: any) => d.discountType === "BuyXGetY" || d.discountType === "TieredQuantity"));
        }
      })
      .catch(() => {});
  }, []);

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

  const getBuyXGetYInfo = (item: any) => {
    if (item.type === "subscription") return null;

    const assigns: any[] = item.productData?.variants?.find((v: any) => v.id === item.variantId)?.assignedDiscounts
      || item.productData?.assignedDiscounts
      || [];
    
    let deal = assigns.find((d: any) => d && d.discountType === "BuyXGetY" && d.isActive !== false && isDiscountActive(d) && (d.discountPercentage > 0));

    if (!deal && publicDiscounts.length > 0) {
      const targetProdId = (item.productId || item.id || "").toLowerCase();
      const targetVarId = (item.variantId || "").toLowerCase();
      const itemCatIds = (item.productData?.categories || []).map((c: any) => (c.categoryId || c.id || "").toLowerCase());

      deal = publicDiscounts.find((d: any) => {
        if (d.discountType !== "BuyXGetY" || !isDiscountActive(d) || !d.discountPercentage || d.discountPercentage <= 0) return false;
        const assignedProds = (d.assignedProductIds || "")
          .split(",")
          .map((id: string) => id.trim().toLowerCase())
          .filter(Boolean);
        const assignedCats = (d.assignedCategoryIds || "")
          .split(",")
          .map((id: string) => id.trim().toLowerCase())
          .filter(Boolean);

        if (assignedProds.length > 0) {
          return assignedProds.includes(targetProdId) || (targetVarId && assignedProds.includes(targetVarId));
        }
        if (assignedCats.length > 0) {
          return itemCatIds.some((cid: string) => assignedCats.includes(cid));
        }
        return true; // storewide
      });
    }

    if (!deal || deal.discountType !== "BuyXGetY" || !deal.discountPercentage || deal.discountPercentage <= 0) return null;

    const buy = deal.buyQuantity || 1;
    const get = deal.getQuantity || 1;
    const groupSize = buy + get;
    const pct = deal.discountPercentage || 0;
    const qty = item.quantity || 1;
    const completed = Math.floor(qty / groupSize);
    const remainder = qty % groupSize;
    const needed = groupSize - remainder;
    const discountedItemCount = completed * get;
    const itemPrice = item.finalPrice ?? item.sellPrice ?? item.price ?? 0;
    let lineDiscount = discountedItemCount * (itemPrice * (pct / 100));

    if (deal.maximumDiscountAmount && lineDiscount > deal.maximumDiscountAmount) {
      lineDiscount = deal.maximumDiscountAmount;
    }

    const nextTarget = (completed + 1) * groupSize;
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const targetOrdinal = get === 1 ? getOrdinal(nextTarget) : null;
    const nudgeText = get === 1
      ? `Add ${needed} more to get the ${targetOrdinal} item at ${pct}% OFF!`
      : `Add ${needed} more to get ${get} items at ${pct}% OFF!`;

    const unlockedText = completed > 1 
      ? (buy === 1 && get === 1
          ? `Buy 1, Get 2nd at ${pct}% Off (${completed}x applied)`
          : `Buy ${buy} Get ${get} at ${pct}% Off (${completed}x applied)`)
      : (buy === 1 && get === 1
          ? `Buy 1, Get 2nd at ${pct}% Off applied!`
          : `Buy ${buy} Get ${get} at ${pct}% Off applied!`);

    return {
      buy,
      get,
      groupSize,
      pct,
      isUnlocked: completed > 0,
      completed,
      needed,
      remainder,
      lineDiscount,
      nudgeText,
      unlockedText
    };
  };

  const getTieredQuantityInfo = (item: any) => {
    if (item.type === "subscription") return null;

    const assigns: any[] = item.productData?.variants?.find((v: any) => v.id === item.variantId)?.assignedDiscounts
      || item.productData?.assignedDiscounts
      || [];
    
    let deal = assigns.find((d: any) => d && d.discountType === "TieredQuantity" && d.isActive !== false && isDiscountActive(d));

    if (!deal && publicDiscounts.length > 0) {
      const targetProdId = (item.productId || item.id || "").toLowerCase();
      const targetVarId = (item.variantId || "").toLowerCase();
      const itemCatIds = (item.productData?.categories || []).map((c: any) => (c.categoryId || c.id || "").toLowerCase());

      deal = publicDiscounts.find((d: any) => {
        if (d.discountType !== "TieredQuantity" || !isDiscountActive(d)) return false;
        const assignedProds = (d.assignedProductIds || "")
          .split(",")
          .map((id: string) => id.trim().toLowerCase())
          .filter(Boolean);
        const assignedCats = (d.assignedCategoryIds || "")
          .split(",")
          .map((id: string) => id.trim().toLowerCase())
          .filter(Boolean);

        if (assignedProds.length > 0) {
          return assignedProds.includes(targetProdId) || (targetVarId && assignedProds.includes(targetVarId));
        }
        if (assignedCats.length > 0) {
          return itemCatIds.some((cid: string) => assignedCats.includes(cid));
        }
        return true;
      });
    }

    if (!deal || !deal.tiers || deal.tiers.length === 0) return null;

    const sortedTiers = [...deal.tiers].sort((a: any, b: any) => a.quantity - b.quantity);
    const qty = item.quantity || 1;
    const itemPrice = item.finalPrice ?? item.sellPrice ?? item.price ?? 0;

    const qualifyingTier = [...sortedTiers].reverse().find((t: any) => qty >= t.quantity) || null;
    const nextTier = sortedTiers.find((t: any) => qty < t.quantity) || null;

    let lineDiscount = 0;
    if (qualifyingTier && qualifyingTier.discountPercentage > 0) {
      lineDiscount = qty * (itemPrice * (qualifyingTier.discountPercentage / 100));
      if (deal.maximumDiscountAmount && lineDiscount > deal.maximumDiscountAmount) {
        lineDiscount = deal.maximumDiscountAmount;
      }
    }

    const nudgeText = nextTier
      ? `Add ${nextTier.quantity - qty} more to get ${nextTier.discountPercentage}% OFF each!`
      : null;

    const unlockedText = qualifyingTier
      ? `Buy ${qualifyingTier.quantity}+ for ${qualifyingTier.discountPercentage}% Off applied!`
      : null;

    return {
      deal,
      tiers: sortedTiers,
      qualifyingTier,
      nextTier,
      isUnlocked: !!qualifyingTier,
      lineDiscount,
      nudgeText,
      unlockedText
    };
  };

  const totalBuyXGetYSavings = useMemo(() => {
    return cart.reduce((sum, item) => {
      const info = getBuyXGetYInfo(item);
      return sum + (info?.lineDiscount ?? 0);
    }, 0);
  }, [cart, publicDiscounts]);

  const totalTieredQuantitySavings = useMemo(() => {
    return cart.reduce((sum, item) => {
      const info = getTieredQuantityInfo(item);
      return sum + (info?.lineDiscount ?? 0);
    }, 0);
  }, [cart, publicDiscounts]);

  const effectiveCartTotal = Math.max(0, cartTotal - totalBuyXGetYSavings - totalTieredQuantitySavings);

  // 🔹 Calculate dynamic free shipping threshold matching cart/page.tsx logic
  const dynamicFreeThreshold = useMemo(() => {
    let threshold = 0;
    for (const item of cart) {
      if (item.productData) {
        let thresholdsArray = null;

        if (item.variantId && item.productData.variants?.length) {
          const v = item.productData.variants.find((x: any) => x.id === item.variantId);
          if (v && Array.isArray(v.freeShippingThresholds)) {
            thresholdsArray = v.freeShippingThresholds;
          }
        }

        if (!thresholdsArray && Array.isArray(item.productData.freeShippingThresholds)) {
          thresholdsArray = item.productData.freeShippingThresholds;
        }

        if (thresholdsArray) {
          const standardOpt = thresholdsArray.find((x: any) => {
            const name = (x.name || x.displayName || "").toLowerCase();
            return name.includes("standard");
          });
          if (standardOpt && standardOpt.threshold > 0) {
            threshold = Math.max(threshold, standardOpt.threshold);
          }
        }
      }

      if (threshold === 0 && typeof (item as any).freeShippingThreshold === "number" && (item as any).freeShippingThreshold > 0) {
        threshold = (item as any).freeShippingThreshold;
      }
    }
    return threshold > 0 ? threshold : (apiThreshold > 0 ? apiThreshold : 40);
  }, [cart, apiThreshold]);

  const allNextDayFree = useMemo(() =>
    cart.length > 0 &&
    cart.every(i => {
      const isEnabled = i.nextDayDeliveryEnabled === true ||
        (i.variantId && i.productData?.variants?.find((x: any) => x.id === i.variantId)?.nextDayDeliveryEnabled === true) ||
        i.productData?.nextDayDeliveryEnabled === true;

      const isFree = i.nextDayDeliveryFree === true ||
        (i.variantId && i.productData?.variants?.find((x: any) => x.id === i.variantId)?.nextDayDeliveryFree === true) ||
        i.productData?.nextDayDeliveryFree === true;

      return isEnabled && isFree;
    }),
    [cart]
  );

  if (!isCartOpen) return null;

  const effectiveFreeThreshold = dynamicFreeThreshold > 0 ? dynamicFreeThreshold : (apiThreshold > 0 ? apiThreshold : 40);
  const remainingForFreeDelivery = Math.max(0, effectiveFreeThreshold - effectiveCartTotal);

  return (
    <>
      {/* 🔹 Cart Dropdown Panel */}
      <div
        ref={dropdownRef}
        data-cart-dropdown="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed md:absolute left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 right-auto md:right-0 top-[75px] md:top-full mt-2 w-[92vw] md:w-[380px] max-w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200 text-gray-800"
      >
        {/* ── Top Header: Free Delivery & Action Buttons ── */}
        <div className="border-b border-gray-100 pb-3 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex flex-col gap-0.5">
              {allNextDayFree ? (
                <p className="text-xs font-bold text-orange-600 flex items-center gap-1 animate-in fade-in duration-200">
                  🚚 You've unlocked FREE Next Day Delivery!
                </p>
              ) : (
                <p className="text-xs font-semibold text-gray-700">
                  {remainingForFreeDelivery > 0 ? (
                    <>
                      Spend <span className="font-bold text-[#f38918]">£{remainingForFreeDelivery.toFixed(2)}</span> more for <span className="font-bold">FREE Standard Delivery</span>
                    </>
                  ) : (
                    <span className="text-emerald-600 font-bold">🎉 You qualify for FREE Standard Delivery!</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={closeCart}
              aria-label="Close cart preview"
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Buttons: View Basket & Checkout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeCart();
                router.push("/cart");
              }}
              className="flex-1 py-1.5 px-3 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg transition text-center shadow-sm"
            >
              View Cart
            </button>
            <button
              onClick={() => {
                closeCart();
                if (isAuthenticated) {
                  router.push("/checkout");
                } else {
                  router.push("/account?from=checkout");
                }
              }}
              className="flex-1 py-1.5 px-3 bg-[#f38918] hover:bg-[#d97712] text-white text-xs font-bold rounded-lg transition text-center shadow-sm"
            >
              Checkout
            </button>
          </div>
        </div>

        {/* ── Items List ── */}
        {cart.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <ShoppingBag className="mx-auto mb-2 text-gray-300" size={36} />
            <p className="text-sm font-medium">Your cart is empty</p>
          </div>
        ) : (
          <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
            {cart.map((item) => {
              const itemPrice = item.finalPrice ?? item.sellPrice ?? item.price ?? 0;
              const imageUrl = item.image ?? item.productData?.images?.[0] ?? "/logo/logo.png";

              const product = item.productData;
              const variantStock = item.variantId
                ? product?.variants?.find((v: any) => v.id === item.variantId)?.stockQuantity
                : product?.stockQuantity;
              const maxStock = variantStock ?? product?.stockQuantity ?? 9999;
              const minQty = product?.orderMinimumQuantity ?? 1;
              const maxQty = product?.orderMaximumQuantity ?? Infinity;

              return (
                <div key={`${item.id}-${item.variantId ?? "no-var"}`} className="pt-3 first:pt-0 flex items-center gap-3">
                  {/* Item Image */}
                  <Link
                    href={`/product/${item.slug || item.productData?.slug || ""}`}
                    onClick={() => closeCart()}
                    className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-md border border-gray-100 overflow-hidden hover:opacity-80 transition cursor-pointer"
                  >
                    <Image
                      src={imageUrl}
                      alt={item.name || "Product"}
                      fill
                      className="object-contain p-1"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug || item.productData?.slug || ""}`}
                      onClick={() => closeCart()}
                      className="hover:text-[#f38918] transition inline-block w-full"
                    >
                      <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight hover:text-[#f38918] transition-colors">
                        {item.name}
                      </h4>
                    </Link>
                    {item.type === "subscription" && (
                      <p className="text-[10px] text-[#f38918] font-semibold mt-0.5 leading-tight">
                        Subscription • {item.frequency && !isNaN(Number(item.frequency)) ? `${item.frequency} ` : ""}{item.frequencyPeriod}
                      </p>
                    )}

                    {/* Buy X Get Y Offer Nudge / Unlocked status */}
                    {(() => {
                      const dealInfo = getBuyXGetYInfo(item);
                      if (!dealInfo) return null;
                      return (
                        <div className="mt-1">
                          {dealInfo.isUnlocked ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-block text-[10px] font-bold text-orange-900 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded leading-tight w-fit">
                                🎉 {dealInfo.unlockedText} (-£{dealInfo.lineDiscount.toFixed(2)})
                              </span>
                              {dealInfo.remainder > 0 && (
                                <span className="text-[9px] text-amber-800 font-semibold">
                                  ⚡ {dealInfo.nudgeText}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded leading-tight w-fit animate-pulse">
                              ⚡ {dealInfo.nudgeText}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tiered Quantity Offer Nudge / Unlocked status */}
                    {(() => {
                      const tieredInfo = getTieredQuantityInfo(item);
                      if (!tieredInfo) return null;
                      return (
                        <div className="mt-1">
                          {tieredInfo.isUnlocked ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-block text-[10px] font-bold text-orange-900 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded leading-tight w-fit">
                                🎉 {tieredInfo.unlockedText} (-£{tieredInfo.lineDiscount.toFixed(2)})
                              </span>
                              {tieredInfo.nudgeText && (
                                <span className="text-[9px] text-amber-800 font-semibold">
                                  ⚡ {tieredInfo.nudgeText}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded leading-tight w-fit animate-pulse">
                              ⚡ {tieredInfo.nudgeText}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const dealInfo = getBuyXGetYInfo(item);
                      const tieredInfo = getTieredQuantityInfo(item);
                      const itemDiscount = (dealInfo?.lineDiscount ?? 0) + (tieredInfo?.lineDiscount ?? 0);
                      const lineTotal = Math.max(0, (itemPrice * (item.quantity ?? 1)) - itemDiscount);
                      const baseLineTotal = (item.priceBeforeDiscount ?? item.price ?? itemPrice) * (item.quantity ?? 1);
                      const showStrike = baseLineTotal > lineTotal || itemDiscount > 0;
                      return (
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className={`text-xs font-bold ${showStrike ? "text-[#f38918]" : "text-gray-900"}`}>
                            £{lineTotal.toFixed(2)}
                          </span>
                          {showStrike && (
                            <span className="text-[10px] font-semibold text-gray-400 line-through">
                              £{baseLineTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quantity Controls & Delete */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center border border-gray-300 rounded-md h-8 bg-white">
                      {/* MINUS */}
                      <button
                        type="button"
                        className="px-1.5 h-full hover:bg-gray-100 text-gray-600 rounded-l-md transition disabled:opacity-50 disabled:cursor-not-allowed cart-qty-btn flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.quantity <= minQty) {
                            toast.error(`Minimum order quantity is ${minQty}`);
                            return;
                          }
                          updateQuantity(item.id, Math.max(1, item.quantity - 1));
                        }}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3 pointer-events-none" />
                      </button>

                      {/* INPUT */}
                      <input
                        type="number"
                        className="w-8 text-center font-semibold outline-none border-l border-r border-gray-300 text-xs cart-qty-btn"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!/^\d*$/.test(val)) return;

                          if (val === "") {
                            updateQuantity(item.id, 0);
                            return;
                          }

                          let num = parseInt(val, 10);
                          const limit = maxQty ?? maxStock;

                          if (num > limit) {
                            num = limit;
                            if (limit === maxStock) {
                              toast.error(`Only ${maxStock} items available in stock`);
                            } else {
                              toast.error(`Allowed Maximum order quantity is ${limit}`);
                            }
                          }
                          updateQuantity(item.id, num);
                        }}
                        onBlur={() => {
                          if (!item.quantity || item.quantity < minQty) {
                            updateQuantity(item.id, minQty);
                          }
                          const limit = maxQty ?? maxStock;
                          if (item.quantity > limit) {
                            updateQuantity(item.id, limit);
                          }
                        }}
                        inputMode="numeric"
                      />

                      {/* PLUS */}
                      <button
                        type="button"
                        className="px-1.5 h-full hover:bg-gray-100 text-gray-600 rounded-r-md transition disabled:opacity-50 disabled:cursor-not-allowed cart-qty-btn flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          const limit = maxQty ?? maxStock;

                          if (item.quantity >= maxStock) {
                            toast.error(`Only ${maxStock} items available in stock`);
                            return;
                          }

                          if (item.quantity >= limit) {
                            toast.error(`Allowed Maximum order quantity is ${limit}`);
                            return;
                          }

                          updateQuantity(item.id, Math.min(item.quantity + 1, maxStock));
                        }}
                        disabled={item.quantity >= maxStock}
                      >
                        <Plus className="h-3 w-3 pointer-events-none" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.id, item.type);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Bottom Footer: Empty Basket & Subtotal ── */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between text-xs">
            <button
              onClick={() => clearCart()}
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition font-medium"
            >
              <Trash2 size={13} />
              <span>Empty Cart</span>
            </button>

            <div className="text-right">
              <span className="text-gray-600 mr-1">Total amount</span>
              <span className="font-bold text-sm text-gray-900">
                £{effectiveCartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
