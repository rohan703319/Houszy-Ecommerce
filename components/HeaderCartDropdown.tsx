"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, X, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function HeaderCartDropdown() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [apiThreshold, setApiThreshold] = useState<number>(0);
  const toast = useToast();

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

      // 5. Ignore clicks on any add-to-cart or buy-now buttons to prevent race conditions/blockage
      const buttonText = target.closest("button")?.textContent?.toLowerCase() || "";
      if (
        buttonText.includes("add to cart") ||
        buttonText.includes("add to basket") ||
        buttonText.includes("buy now") ||
        buttonText.includes("add subscription to cart") ||
        (buttonText.includes("add") && buttonText.includes("cart"))
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
            (opt.name || opt.title || "").toLowerCase().includes("standard") || opt.isDefault
          );
          const val = stdOpt?.minOrderAmountForFreeDelivery ?? stdOpt?.freeShippingThreshold ?? stdOpt?.threshold;
          if (typeof val === "number" && val > 0) {
            setApiThreshold(val);
          }
        }
      })
      .catch(() => { });
  }, []);

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
    }
    return threshold > 0 ? threshold : apiThreshold;
  }, [cart, apiThreshold]);

  if (!isCartOpen) return null;

  const remainingForFreeDelivery = dynamicFreeThreshold > 0 ? Math.max(0, dynamicFreeThreshold - cartTotal) : 0;

  return (
    <>
      {/* 🔹 Cart Dropdown Panel */}
      <div
        ref={dropdownRef}
        data-cart-dropdown="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute right-0 top-full mt-2 w-[92vw] max-w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200 text-gray-800"
      >
        {/* ── Top Header: Free Delivery & Action Buttons ── */}
        <div className="border-b border-gray-100 pb-3 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-gray-700">
              {remainingForFreeDelivery > 0 ? (
                <>
                  Spend <span className="font-bold text-[#f38918]">£{remainingForFreeDelivery.toFixed(2)}</span> more for <span className="font-bold">FREE delivery</span>
                </>
              ) : (
                <span className="text-emerald-600 font-bold">🎉 You qualify for FREE delivery!</span>
              )}
            </p>
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
              View Basket
            </button>
            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
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
              const itemPrice = item.finalPrice ?? item.price ?? 0;
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
                  <div className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-md border border-gray-100 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={item.name || "Product"}
                      fill
                      className="object-contain p-1"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
                      {item.name}
                    </h4>
                    {item.type === "subscription" && (
                      <p className="text-[10px] text-[#f38918] font-semibold mt-0.5 leading-tight">
                        Subscription • {item.frequency && !isNaN(Number(item.frequency)) ? `${item.frequency} ` : ""}{item.frequencyPeriod}
                      </p>
                    )}
                    <p className="text-xs font-bold text-gray-900 mt-1">
                      £{itemPrice.toFixed(2)}
                    </p>
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
              <span>Empty Basket</span>
            </button>

            <div className="text-right">
              <span className="text-gray-600 mr-1">Total amount</span>
              <span className="font-bold text-sm text-gray-900">
                £{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
