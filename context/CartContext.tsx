"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/toast/CustomToast";
import * as signalR from "@microsoft/signalr";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5285";
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const user = localStorage.getItem("user");

  // ✅ If logged in → FIXED session per user
  if (user) {
    const userId = JSON.parse(user)?.id;
    if (userId) {
      return `user_${userId}`; // 🔥 SAME across all browsers
    }
  }

  // 👇 guest (same as before)
  let id = localStorage.getItem("cart_guest");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cart_guest", id);
  }
  return id;
}
// ─── Cart item type (unchanged from original) ─────────────────────────────────
export interface CartItem {
  id: string;            // variant id OR product id (frontend key)
  backendId?: string;    // DB GUID returned after save
  productId?: string;
  name: string;
  price: number;
  sellPrice?: number;
  discountPercentage?: number;
  priceBeforeDiscount?: number;
  finalPrice?: number;
  oldPrice?: number | null;
  discountAmount?: number;
  displayDiscountType?: "None" | "OldPrice" | "System";

  hasSystemDiscount?: boolean;

  systemDiscountAmount?: number;
  appliedDiscountId?: string | null;
  couponCode?: string | null;
  isCumulative?: boolean;
  image: string;
  quantity: number;
  sku?: string;
  variantId?: string | null;
  slug: string;
  variantOptions?: {
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
  };
  type?: "one-time" | "subscription";
  frequency?: number | string | null;
  frequencyPeriod?: string | null;
  subscriptionTotalCycles?: number | null;
  vatRate?: number | null;
  vatIncluded?: boolean;
  productData?: any;
  maxStock?: number;
  parentProductId?: string;
  bundlePrice?: number;
  individualSavings?: number;
  hasBundleDiscount?: boolean;
  nextDayDeliveryEnabled?: boolean;
  nextDayDeliveryFree?: boolean; // 🔥 ADD THIS LINE
  sameDayDeliveryEnabled?: boolean;
  purchaseContext?: "bundle" | "standalone";
  bundleId?: string | null;
  isBundleParent?: boolean;
  bundleParentId?: string | null;
  bundleInstanceId?: string;
  bundleParentInstanceId?: string;
  shipSeparately?: boolean;
  pharmaApproved?: boolean;
  freeShippingThreshold?: number | null;
}

// ─── Context type ─────────────────────────────────────────────────────────────
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, type?: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateCart: (updatedItems: CartItem[]) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isInitialized: boolean;
  sessionId: string;
  cartActivity: { productId: string; message: string; timestamp: number } | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  updateCartEmail: (email: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Helper: map backend DTO → frontend CartItem ──────────────────────────────
function backendToFrontend(dto: any): CartItem {

  return {
    id: dto.variantId ?? dto.productId,
    backendId: dto.id,
    productId: dto.productId,
    name: dto.productName,
    // Use sellPrice as the unit price; fallback to dto.price
    price: dto.price,
    sellPrice: dto.sellPrice ?? dto.price,
    discountPercentage: dto.discountPercentage ?? 0,
    priceBeforeDiscount: dto.price,
    finalPrice: dto.finalPrice ?? dto.sellPrice ?? dto.price,
    discountAmount: dto.discountAmount ?? 0,
    displayDiscountType: dto.discountPercentage > 0 ? "OldPrice" : "None",
    hasSystemDiscount: dto.hasSystemDiscount ?? false,
    systemDiscountAmount: dto.systemDiscountAmount ?? 0,
    appliedDiscountId: dto.appliedDiscountId,
    couponCode: dto.couponCode,
    image: dto.productImageUrl
      ? dto.productImageUrl.startsWith("http")
        ? dto.productImageUrl
        : `${API_BASE_URL}${dto.productImageUrl}`
      : "",
    quantity: dto.quantity,
    sku: dto.productSku,
    variantId: dto.variantId,
    slug: dto.productSlug,
    variantOptions: {
      option1: dto.variantOption1,
      option2: dto.variantOption2,
      option3: dto.variantOption3,
    },
    type: dto.itemType as "one-time" | "subscription",
    frequency: dto.frequency,
    frequencyPeriod: dto.frequencyPeriod,
    subscriptionTotalCycles: dto.subscriptionTotalCycles,
    vatRate: dto.vatRate,
    purchaseContext: dto.purchaseContext as "bundle" | "standalone",
    bundleId: dto.bundleId,
    isBundleParent: dto.isBundleParent,
    bundleParentId: dto.bundleParentId,
    bundlePrice: dto.bundlePrice,
    individualSavings: dto.individualSavings,
    bundleInstanceId: dto.bundleInstanceId,
    bundleParentInstanceId: dto.bundleParentInstanceId,
    nextDayDeliveryEnabled:
      dto.variant?.nextDayDeliveryEnabled ??
      dto.nextDayDeliveryEnabled ??
      dto.productData?.nextDayDeliveryEnabled ??
      dto.product?.nextDayDeliveryEnabled ??
      false,
    nextDayDeliveryFree:
      dto.variant?.nextDayDeliveryFree ??
      dto.nextDayDeliveryFree ??
      (dto.variantId && (dto.productData?.variants || dto.product?.variants)
        ? (dto.productData?.variants || dto.product?.variants)?.find((v: any) => v.id === dto.variantId)?.nextDayDeliveryFree
        : null) ??
      dto.productData?.nextDayDeliveryFree ??
      dto.product?.nextDayDeliveryFree ??
      false,
    sameDayDeliveryEnabled: dto.sameDayDeliveryEnabled,
    shipSeparately: dto.shipSeparately,
    freeShippingThreshold: dto.freeShippingThreshold ?? null,
    vatIncluded:
      dto.vatIncluded ??
      dto.productData?.vatIncluded ??
      dto.product?.vatIncluded ??
      false,

    productData:
      dto.productData ??
      dto.product ??
      null,

    maxStock:
      dto.variant?.stockQuantity ??
      dto.product?.stockQuantity ??
      undefined,
  };
}

// ─── Helper: map frontend CartItem → backend add command ─────────────────────
function frontendToBackend(item: CartItem, sessionId: string) {
  return {
    sessionId,
    productId: item.productId ?? item.id,
    variantId: item.variantId ?? null,
    productName: item.name,
    productSlug: item.slug,
    productSku: item.sku ?? null,
    productImageUrl: item.image ?? null,
    quantity: item.quantity,
    price: item.price,
    sellPrice: item.sellPrice ?? item.price,
    discountPercentage: item.discountPercentage ?? 0,

    finalPrice: item.finalPrice ?? item.sellPrice ?? item.price,
    discountAmount: item.discountAmount ?? 0,
    oldPrice: item.oldPrice ?? null,

    displayDiscountType:
      item.displayDiscountType ?? "None",

    hasSystemDiscount:
      item.hasSystemDiscount ?? false,

    systemDiscountAmount:
      item.systemDiscountAmount ?? 0,
    appliedDiscountId: item.appliedDiscountId ?? null,
    couponCode: item.couponCode ?? null,
    variantOption1: item.variantOptions?.option1 ?? null,
    variantOption2: item.variantOptions?.option2 ?? null,
    variantOption3: item.variantOptions?.option3 ?? null,
    itemType: item.type ?? "one-time",
    frequency: item.frequency ? Number(item.frequency) : null,
    frequencyPeriod: item.frequencyPeriod ?? null,
    subscriptionTotalCycles: item.subscriptionTotalCycles ?? null,
    purchaseContext: item.purchaseContext ?? "standalone",
    bundleId: item.bundleId ?? null,
    bundleParentId: item.bundleParentId ?? null,
    isBundleParent: item.isBundleParent ?? false,
    bundlePrice: item.bundlePrice ?? null,
    individualSavings: item.individualSavings ?? null,
    bundleInstanceId: item.bundleInstanceId ?? null,
    bundleParentInstanceId: item.bundleParentInstanceId ?? null,
    vatRate: item.vatRate ?? null,
    nextDayDeliveryEnabled: item.nextDayDeliveryEnabled ?? false,
    nextDayDeliveryFree: item.nextDayDeliveryFree ?? false,
    sameDayDeliveryEnabled: item.sameDayDeliveryEnabled ?? false,
    shipSeparately: item.shipSeparately ?? false,
    freeShippingThreshold: item.freeShippingThreshold ?? null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getSessionId());
  const [cartActivity, setCartActivity] = useState<{ productId: string; message: string; timestamp: number } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hubRef = useRef<signalR.HubConnection | null>(null);

  // Restore cart session from URL if present (from abandoned cart recovery email)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get("sessionId");
      if (urlSessionId) {
        localStorage.setItem("cart_guest", urlSessionId);
        setSessionId(urlSessionId);
      }
    }
  }, []);
  const addToCartAnalyticsRef = useRef<{ signature: string; timestamp: number } | null>(null);
  const toast = useToast();

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const sendAddToCartAnalytics = useCallback((item: CartItem) => {
    const signature = [
      item.productId ?? item.id,
      item.variantId ?? "",
      item.type ?? "one-time",
      item.purchaseContext ?? "standalone",
      item.quantity,
      item.finalPrice ?? item.price,
    ].join("|");
    const now = Date.now();

    if (
      addToCartAnalyticsRef.current?.signature === signature &&
      now - addToCartAnalyticsRef.current.timestamp < 1000
    ) {
      return;
    }

    addToCartAnalyticsRef.current = { signature, timestamp: now };
    trackAddToCart(item);
  }, []);

  // ── Load cart from backend on mount / session change ───────────────────────
  useEffect(() => {
    if (!sessionId) return;
    setIsInitialized(false);
    fetch(`${API_BASE_URL}/api/Cart/${sessionId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCart(res.data.map(backendToFrontend));
        }
      })
      .catch(() => {/* silently fail — cart stays empty */ })
      .finally(() => setIsInitialized(true));
  }, [sessionId]);

  // ── React to login / logout events ────────────────────────────────────────
  useEffect(() => {
    const handleLogin = async () => {
      const oldGuestId = localStorage.getItem("cart_guest");
      const newUserSession = getSessionId();

      // 🔥 STEP 1: resync FIRST
      if (oldGuestId && oldGuestId !== newUserSession) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/Cart/${oldGuestId}`);
          const data = await res.json();

          if (data.success && Array.isArray(data.data)) {
            // 🔥 WAIT for all items to be added
            await Promise.all(
              data.data.map((item: any) =>
                fetch(`${API_BASE_URL}/api/Cart/items`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...item,
                    sessionId: newUserSession,
                  }),
                })
              )
            );
            // 🔥 ADD THIS LINE HERE
            localStorage.removeItem("cart_guest");
          }
        } catch { }
      }

      // 🔥 STEP 2: THEN switch session
      setSessionId(newUserSession);
    };

    const handleLogout = () => {
      // Clear in-memory cart immediately
      setCart([]);
      // Generate a fresh anonymous session for the next visitor
      const newId = crypto.randomUUID();
      localStorage.setItem("cart_guest", newId);
      setSessionId(newId);
    };

    window.addEventListener("auth:login", handleLogin);
    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:login", handleLogin);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  // ── SignalR: connect to cart activity hub (anonymous) ──────────────────────
  useEffect(() => {
    let batchTimeout: NodeJS.Timeout | null = null;
    let batchCount = 0;
    let singleMessage = "";

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/cart-activity`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on(
      "CartItemAdded",
      (payload: { productId: string; message: string; sessionId?: string }) => {
        const currentSessionId = getSessionId();
        const incomingSessionId = payload.sessionId || (payload as any).SessionId || (payload as any).sessionid;

        // ❌ ignore own event (by ID)
        if (incomingSessionId && incomingSessionId === currentSessionId) return;

        // ❌ ignore own event (foolproof local timestamp check)
        const lastAdded = sessionStorage.getItem(`lastAdded_${payload.productId}`);
        if (lastAdded && Date.now() - parseInt(lastAdded) < 5000) {
          return; // Ignore if we added this exact product in the last 5 seconds
        }

        // ✅ Instant show + Grouping (Now uses local state for in-page banner instead of toast)
        if (batchCount === 0) {
          // Instantly show the first one
          setCartActivity({ productId: payload.productId, message: payload.message, timestamp: Date.now() });
          batchCount = 1;

          // Clear after 5 seconds if no more come in
          batchTimeout = setTimeout(() => {
            if (batchCount > 1) {
              // Update with grouped message
              setCartActivity({
                productId: payload.productId,
                message: `🔥 ${batchCount - 1} more people just added this to their cart!`,
                timestamp: Date.now()
              });
              // Clear after another 5 seconds
              setTimeout(() => {
                setCartActivity(null);
              }, 5000);
            } else {
              setCartActivity(null);
            }

            // Reset for next batch
            batchCount = 0;
            batchTimeout = null;
          }, 4000); // 4-second window
        } else {
          // If already in a window, just increment the count
          batchCount += 1;
        }
      }
    );

    connection
      .start()
      .then(() => {
        hubRef.current = connection;
      })
      .catch(() => {
        // SignalR not critical — cart still works
      });

    return () => {
      if (batchTimeout) clearTimeout(batchTimeout);
      connection.stop();
    };
  }, []);

  // ── Subscribe to a product page (call from product page component) ─────────
  const subscribeToProduct = useCallback((productId: string) => {
    hubRef.current?.invoke("SubscribeToProduct", productId).catch(() => { });
  }, []);

  const unsubscribeFromProduct = useCallback((productId: string) => {
    hubRef.current?.invoke("UnsubscribeFromProduct", productId).catch(() => { });
  }, []);

  // Expose subscribeToProduct on the hub ref so product pages can call it
  (CartProvider as any)._hub = { subscribeToProduct, unsubscribeFromProduct };

  // ── ADD TO CART ────────────────────────────────────────────────────────────
  const addToCart = (item: CartItem) => {
    // Automatically open mini-cart popup on header
    setIsCartOpen(true);

    // 🔥 FOOLPROOF LOCAL FLAG (to strictly prevent own events from showing)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`lastAdded_${item.productId ?? item.id}`, Date.now().toString());
    }

    setCart((prev) => {
      // ── Subscription merge ──
      if (item.type === "subscription") {
        const existingSub = prev.find(
          (p) =>
            p.productId === item.productId &&
            p.variantId === item.variantId &&
            p.type === "subscription"
        );
        if (existingSub) {
          return prev.map((p) =>
            p.productId === item.productId &&
              p.variantId === item.variantId &&
              p.type === "subscription"
              ? {
                ...p, quantity: item.quantity, frequency: item.frequency,
                frequencyPeriod: item.frequencyPeriod,
                subscriptionTotalCycles: item.subscriptionTotalCycles,
                sku: item.sku ?? p.sku
              }
              : p
          );
        }
      }

      // ── Normal merge ──
      const existing = prev.find(
        (p) =>
          p.productId === item.productId &&
          (p.variantId ?? null) === (item.variantId ?? null) &&
          (p.type ?? "one-time") === (item.type ?? "one-time") &&
          (p.purchaseContext ?? "standalone") === (item.purchaseContext ?? "standalone")
      );

      if (existing) {
        const product = item.productData;
        const variantObj = item.variantId
          ? product?.variants?.find((v: any) => v.id === item.variantId)
          : null;
        const mainMax = (variantObj?.orderMaximumQuantity ?? product?.orderMaximumQuantity) ?? Infinity;
        const variantStock = item.variantId
          ? variantObj?.stockQuantity
          : product?.stockQuantity;
        const maxStock = item.maxStock ?? variantStock ?? product?.stockQuantity ?? Infinity;
        const allowedMax = Math.min(mainMax, maxStock);
        const newQty = existing.quantity + item.quantity;

        if (newQty > allowedMax) {
          toast.error(`Allowed maximum order quantity is ${allowedMax}`);
          return prev;
        }

        sendAddToCartAnalytics(item);
        return prev.map((p) =>
          p.productId === item.productId &&
            (p.variantId ?? null) === (item.variantId ?? null) &&
            (p.type ?? "one-time") === (item.type ?? "one-time") &&
            (p.purchaseContext ?? "standalone") === (item.purchaseContext ?? "standalone")
            ? {
              ...p, quantity: p.quantity + item.quantity, sku: item.sku ?? p.sku,
              finalPrice: item.finalPrice ?? p.finalPrice,
              discountAmount: item.discountAmount ?? p.discountAmount,

              oldPrice:
                item.oldPrice ?? p.oldPrice,

              displayDiscountType:
                item.displayDiscountType ??
                p.displayDiscountType,

              hasSystemDiscount:
                item.hasSystemDiscount ??
                p.hasSystemDiscount,

              systemDiscountAmount:
                item.systemDiscountAmount ??
                p.systemDiscountAmount,
            }
            : p
        );
      }

      sendAddToCartAnalytics(item);
      return [
        ...prev,
        {
          ...item,
          sku: item.sku,
          price: item.price,
          sellPrice: item.sellPrice ?? item.price,
          discountPercentage: item.discountPercentage ?? 0,
          priceBeforeDiscount: item.price,
          finalPrice: item.finalPrice ?? item.sellPrice ?? item.price,
          discountAmount: item.discountAmount ?? 0,
          oldPrice: item.oldPrice ?? null,
          displayDiscountType: item.displayDiscountType ?? "None",
          hasSystemDiscount: item.hasSystemDiscount ?? false,
          systemDiscountAmount: item.systemDiscountAmount ?? 0,
          type: item.type ?? "one-time",
          // 🔥🔥🔥 MAIN FIX
          nextDayDeliveryEnabled:
            item.nextDayDeliveryEnabled ??
            item.productData?.nextDayDeliveryEnabled ??
            false,

          nextDayDeliveryFree:
            item.nextDayDeliveryFree ??
            item.productData?.nextDayDeliveryFree ??
            false,
        },
      ];
    });

    // Sync to backend (fire-and-forget; update backendId when response comes)
    const payload = frontendToBackend(item, sessionId);
    fetch(`${API_BASE_URL}/api/Cart/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.id) {
          setCart((prev) =>
            prev.map((p) =>
              p.productId === item.productId &&
                (p.variantId ?? null) === (item.variantId ?? null) &&
                (p.type ?? "one-time") === (item.type ?? "one-time")
                ? { ...p, backendId: res.data.id }
                : p
            )
          );
        }
      })
      .catch(() => {/* network error — item still in local state */ });
  };

  // ── REMOVE FROM CART ───────────────────────────────────────────────────────
  const removeFromCart = (id: string, type?: string) => {
    setCart((prev) => {
      const itemToRemove = prev.find(
        (p) => p.id === id && (p.type ?? "one-time") === (type ?? p.type)
      );
      if (!itemToRemove) return prev;
      trackRemoveFromCart(itemToRemove);

      // Remove bundle parent + children
      if (itemToRemove.isBundleParent && itemToRemove.bundleInstanceId) {
        const bundleInstanceId = itemToRemove.bundleInstanceId;
        // Call backend to remove the whole bundle
        if (sessionId) {
          fetch(`${API_BASE_URL}/api/Cart/${sessionId}/bundle/${bundleInstanceId}`, {
            method: "DELETE",
          }).catch(() => { });
        }
        return prev.filter(
          (p) =>
            p.id !== id &&
            p.bundleParentInstanceId !== itemToRemove.bundleInstanceId
        );
      }

      // Remove single item from backend
      if (itemToRemove.backendId && sessionId) {
        fetch(
          `${API_BASE_URL}/api/Cart/items/${itemToRemove.backendId}?sessionId=${sessionId}`,
          { method: "DELETE" }
        ).catch(() => { });
      }

      return prev.filter(
        (p) => !(p.id === id && (p.type ?? "one-time") === (type ?? p.type))
      );
    });
  };

  // ── UPDATE QUANTITY ────────────────────────────────────────────────────────
  const updateQuantity = (id: string, qty: number) => {
    setCart((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      if (target.parentProductId) return prev; // block child updates

      const product = target.productData;
      const variantObj = target.variantId
        ? product?.variants?.find((v: any) => v.id === target.variantId)
        : null;
      const variantStock = target.variantId
        ? variantObj?.stockQuantity
        : product?.stockQuantity;
      const maxStock = target.maxStock ?? variantStock ?? product?.stockQuantity ?? 9999;
      const mainMin = (variantObj?.orderMinimumQuantity ?? product?.orderMinimumQuantity) ?? 1;
      const mainMax = (variantObj?.orderMaximumQuantity ?? product?.orderMaximumQuantity) ?? Infinity;

      let finalQty = qty;
      if (qty === 0) finalQty = 0;
      else if (qty < mainMin) finalQty = mainMin;
      else if (qty > mainMax) finalQty = mainMax;
      else if (qty > maxStock) finalQty = maxStock;

      // Sync to backend
      if (target.backendId && sessionId) {
        fetch(`${API_BASE_URL}/api/Cart/items/${target.backendId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, quantity: finalQty }),
        }).catch(() => { });
      }

      return prev.map((item) => {
        if (item.id === id) return { ...item, quantity: finalQty };
        // Auto-sync grouped bundle children
        if (
          item.bundleParentInstanceId &&
          item.bundleParentInstanceId === target.bundleInstanceId
        ) {
          return { ...item, quantity: finalQty };
        }
        return item;
      });
    });
  };

  // ── UPDATE CART (coupon apply) ─────────────────────────────────────────────
  const updateCart = (updatedItems: CartItem[]) => {
    setCart(updatedItems);
    // Sync pricing updates to backend for each changed item
    updatedItems.forEach((item) => {
      if (!item.backendId || !sessionId) return;
      fetch(`${API_BASE_URL}/api/Cart/items/${item.backendId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          quantity: item.quantity,
          finalPrice: item.finalPrice,
          discountAmount: item.discountAmount,
          oldPrice: item.oldPrice ?? null,

          displayDiscountType:
            item.displayDiscountType ?? "None",

          hasSystemDiscount:
            item.hasSystemDiscount ?? false,

          systemDiscountAmount:
            item.systemDiscountAmount ?? 0,
          couponCode: item.couponCode,
          appliedDiscountId: item.appliedDiscountId,
        }),
      }).catch(() => { });
    });
  };

  // ── CLEAR CART ─────────────────────────────────────────────────────────────
  const clearCart = () => {
    const preserveCart = sessionStorage.getItem("preserveCart");
    if (preserveCart === "1") {
      sessionStorage.removeItem("preserveCart");
      return;
    }
    setCart([]);
    if (sessionId) {
      fetch(`${API_BASE_URL}/api/Cart/${sessionId}`, { method: "DELETE" }).catch(() => { });
    }
  };

  const updateCartEmail = async (email: string): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/Cart/${sessionId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        const resData = await response.json();
        return resData?.success || false;
      }
      return false;
    } catch (error) {
      console.error("Error updating cart email:", error);
      return false;
    }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.finalPrice ?? item.price) * (item.quantity ?? 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateCart,
        cartCount,
        cartTotal,
        isInitialized,
        sessionId,
        cartActivity,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        updateCartEmail,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};

// ─── Helper hook for product pages to subscribe to real-time notifications ────
export const useCartActivity = (productId: string | undefined) => {
  useEffect(() => {
    if (!productId) return;
    const hub = (CartProvider as any)._hub;
    hub?.subscribeToProduct(productId);
    return () => hub?.unsubscribeFromProduct(productId);
  }, [productId]);
};
