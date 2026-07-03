"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2, GiftIcon, AwardIcon, Truck, ShoppingBag, Plus, Minus, Tag, ChevronRight, Info, ShieldCheck, BadgePercent } from "lucide-react";
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

  const [isCheckingStock, setIsCheckingStock] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckingStock(true);
    try {
      // 1. Run parallel API stock checks for all items in the cart
      const stockResults = await Promise.all(
        cart.map(async (item) => {
          // Determine the correct SKU: Variant SKU gets priority over Product SKU
          let sku = item.sku;
          if (!sku && item.variantId && item.productData?.variants) {
            const variant = item.productData.variants.find((v: any) => v.id === item.variantId);
            sku = variant?.sku;
          }
          if (!sku) {
            sku = item.productData?.sku;
          }

          if (!sku) {
            // Fallback if no SKU is found anywhere
            return {
              item,
              sku: null,
              success: true,
              stockQuantity: getItemStock(item),
              trackInventory: false,
            };
          }

          try {
            const res = await fetch(`/api/Products/stock-by-sku/${encodeURIComponent(sku)}`);
            if (res.ok) {
              const json = await res.json();
              if (json?.success && json?.data) {
                return {
                  item,
                  sku,
                  success: true,
                  stockQuantity: json.data.stockQuantity ?? 0,
                  trackInventory: json.data.trackInventory !== false,
                  productName: json.data.productName || item.name,
                };
              }
            }
            // Fail-safe local stock check fallback if API call fails
            return {
              item,
              sku,
              success: false,
              stockQuantity: getItemStock(item),
              trackInventory: true,
            };
          } catch (err) {
            console.error(`Stock check failed for SKU ${sku}:`, err);
            return {
              item,
              sku,
              success: false,
              stockQuantity: getItemStock(item),
              trackInventory: true,
            };
          }
        })
      );

      // 2. Process stock verification results
      const outOfStockItems: string[] = [];
      const insufficientStockItems: { name: string; available: number; requested: number }[] = [];

      stockResults.forEach((res) => {
        const item = res.item;
        if (res.trackInventory === false) return; // Skip if stock tracking is disabled

        const available = res.stockQuantity;
        const requested = item.quantity ?? 1;

        if (available <= 0) {
          outOfStockItems.push(item.name);
        } else if (requested > available) {
          insufficientStockItems.push({
            name: item.name,
            available,
            requested,
          });
        }
      });

      // 3. Show error notifications and block checkout if there are stock issues
      if (outOfStockItems.length > 0) {
        toast.error(
          `Stock is 0 for: ${outOfStockItems.join(", ")}. Please remove these items to proceed.`
        );
        return;
      }

      if (insufficientStockItems.length > 0) {
        insufficientStockItems.forEach((info) => {
          toast.error(
            `Only ${info.available} quantity is available for "${info.name}". Please decrease or remove the extra ${info.requested - info.available} quantity.`
          );
        });
        return;
      }

      // 4. If stock is valid for all items, proceed to checkout
      if (isAuthenticated) {
        sessionStorage.removeItem("buyNowItem");
        router.push("/checkout");
      } else {
        router.push("/account?from=checkout");
      }
    } catch (error) {
      console.error("Error during checkout stock validation:", error);
      toast.error("Unable to verify stock at this moment. Please try again.");
    } finally {
      setIsCheckingStock(false);
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
        // ❌ Skip items with coupon applied — those use discountAmount for discount, not oldPrice
        if (item.couponCode && (item.discountAmount ?? 0) > 0) return acc;

        // ❌ Skip items that require coupon code (even if not yet applied) — old price must not be used
        const hasCouponRequiredDiscount = item.productData?.assignedDiscounts?.some(
          (d: any) => d?.requiresCouponCode === true && d?.isActive
        );
        if (hasCouponRequiredDiscount) return acc;

        // ❌ Only process OldPrice type items
        if (item.displayDiscountType !== "OldPrice") return acc;

        const price = item.price;
        const oldPrice = item.oldPrice ?? item.productData?.oldPrice;
        const qty = item.quantity ?? 1;

        // hasDiscount is always false here — we only reach this for OldPrice items
        // (System items and coupon items are skipped above)
        const pricing = getOrderSummaryPricing({
          price,
          oldPrice,
          quantity: qty,
          hasDiscount: false,
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
    return cart.reduce((sum, item) => {
      let savings = 0;
      // 1. If individual child has savings
      if (item.hasBundleDiscount && item.individualSavings) {
        savings += item.individualSavings * (item.quantity ?? 1);
      }
      // 2. If it's a bundle parent with totalSavings
      if (item.isBundleParent && item.productData?.totalSavings) {
        savings += item.productData.totalSavings * (item.quantity ?? 1);
      }
      return sum + savings;
    }, 0);
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
      const hasCouponRequiredDiscount = item.productData?.assignedDiscounts?.some(
        (d: any) => d?.requiresCouponCode === true && d?.isActive
      );
      if (
        item.displayDiscountType === "OldPrice" &&
        !hasCouponRequiredDiscount &&
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

      // 🔥 THE CORRECT FIX:
      // `priceBeforeDiscount` is always set to the original product price when
      // adding to cart (e.g. £6.15), even when a coupon was already applied on
      // the product page. We use this as the authoritative source.
      //
      // We CANNOT use `item.price` because when the product was added to cart
      // with a coupon already applied, `price` was set to `final` (£5.54).
      //
      // We CANNOT safely use `finalPrice + discountAmount` due to floating
      // point arithmetic producing values like 6.149999999...
      const basePrice = item.priceBeforeDiscount ?? item.price;

      // 🔹 find auto discount (non-coupon) that may still apply after coupon removal
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
        // ✅ CRITICAL: Restore item.price to original (it was set to discounted
        // price when added to cart with coupon). correctSubtotal uses item.price
        // for the normal (no-coupon) case.
        price: basePrice,
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

  const getAllowedMaxQty = (item: any, bundleChildren: any[] = []) => {
    const stock = getItemStock(item);
    const orderMax = item.productData?.orderMaximumQuantity ?? Infinity;
    const bundleMax =
      item.isBundleParent && item.bundleId
        ? getBundleMaxQty(item, bundleChildren)
        : Infinity;

    return Math.min(stock, orderMax, bundleMax);
  };

  const getMaxQtyMessage = (item: any, maxQty: number) => {
    const stock = getItemStock(item);
    const orderMax = item.productData?.orderMaximumQuantity ?? Infinity;

    if (maxQty === stock) {
      return `Only ${maxQty} items available in stock`;
    }

    if (maxQty === orderMax) {
      return `Maximum order quantity is ${maxQty}`;
    }

    return `Only ${maxQty} items available in this bundle item`;
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
    return threshold;
  }, [cart]);

  const allNextDayFree = useMemo(() => {
    return cart.length > 0 && cart.every((item) => item.nextDayDeliveryFree === true);
  }, [cart]);
  // UI render\n  // -------------------------\n
  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50/30 px-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center max-w-sm text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-8">Looks like you haven't added anything to your bag yet.</p>
          <Link href="/" className="w-full bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-md">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 lg:pb-12">
      {/* Fixed bottom checkout bar — mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-4 py-3 pb-safe">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total</span>
            <span className="text-lg font-black text-gray-900 leading-none mt-0.5">£{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingStock}
            className={`flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${isCheckingStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCheckingStock ? "Checking Stock..." : "Checkout Now"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-gray-900" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Shopping Bag
            </h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: items */}
          <div className="w-full lg:flex-1 space-y-4">
            {cart.map((item) => {
              const basePrice = item.priceBeforeDiscount ?? item.price;
              const finalPrice = item.finalPrice ?? item.price;
              const oldPrice = item.oldPrice ?? item.productData?.oldPrice;

              const hasCouponRequiredDiscount = item.productData?.assignedDiscounts?.some(
                (d: any) => d?.requiresCouponCode === true && d?.isActive
              );

              const oldPricePercent = item.displayDiscountType === "OldPrice" && !hasCouponRequiredDiscount && oldPrice && oldPrice > basePrice
                ? Math.round(((oldPrice - basePrice) / oldPrice) * 100) : null;

              if (isBundleChild(item)) return null;

              const bundleChildren = isBundleParent(item) ? item.bundleId ? getBundleChildren(item.bundleId) : [] : [];

              return (
                <div key={item.id + (item.variantId ?? "") + (item.type ?? "")} className="bg-white rounded p-3 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
                  <div className="flex flex-row gap-3">
                    {/* Image */}
                    <div className="relative w-[72px] h-[72px] md:w-24 md:h-24 flex-shrink-0 bg-white rounded-lg p-1 overflow-hidden flex items-center justify-center">
                      <Link href={`/product/${item.slug}`} className="w-full h-full flex items-center justify-center">
                        <img src={item.image} alt="product" className="max-w-full max-h-full object-contain" />
                      </Link>
                      {item.couponCode && (item.discountAmount ?? 0) > 0 && (() => {
                        const preCouponPrice = (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
                        const pct = Math.round(((item.discountAmount ?? 0) / (preCouponPrice || 1)) * 100);
                        return pct > 0 ? (
                          <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-10 shadow-sm">
                            -{pct}%
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <Link href={`/product/${item.slug}`}>
                            <h2 className="font-semibold text-sm text-gray-900 leading-tight hover:text-[#f38918] transition-colors line-clamp-2">
                              {item.name}
                            </h2>
                          </Link>
                          {/* Price Row */}
                          <div className="flex items-baseline gap-2 mt-0.5 mb-2">
                            <span className="text-sm font-bold text-[#f38918]">
                              £{((item.displayDiscountType === "System" || item.couponCode ? (item.finalPrice ?? item.price) : item.price) * (item.quantity ?? 1)).toFixed(2)}
                            </span>
                            {(() => {
                              let comparePrice = null;
                              const hasCouponRequiredDiscount = item.productData?.assignedDiscounts?.some(
                                (d: any) => d?.requiresCouponCode === true && d?.isActive
                              );
                              if (item.displayDiscountType === "System" && (item.systemDiscountAmount ?? 0) > 0) {
                                comparePrice = item.price + (item.discountAmount ?? 0);
                              } else if (item.couponCode && (item.discountAmount ?? 0) > 0) {
                                comparePrice = (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
                              } else if (item.displayDiscountType === "OldPrice" && !hasCouponRequiredDiscount) {
                                const oldP = item.oldPrice ?? item.productData?.oldPrice;
                                if (oldP && oldP > item.price) comparePrice = oldP;
                              }
                              if (!comparePrice) return null;
                              return (
                                <span className="text-xs font-semibold text-gray-400 line-through">
                                  £{(comparePrice * (item.quantity ?? 1)).toFixed(2)}
                                </span>
                              );
                            })()}
                          </div>

                          {/* QTY & BADGES IN ONE ROW */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-0.5 shadow-sm h-7">
                              {(item.quantity ?? 1) === 1 ? (
                                <button onClick={() => setRemoveTarget({ item, bundleChildren })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white rounded transition-colors">
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
                                  className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors font-bold"
                                >
                                  <Minus size={12} />
                                </button>
                              )}
                              <input
                                type="number"
                                className="w-7 text-center bg-transparent outline-none font-bold text-xs text-gray-900"
                                min={item.productData?.orderMinimumQuantity ?? 1}
                                max={Number.isFinite(getAllowedMaxQty(item, bundleChildren)) ? getAllowedMaxQty(item, bundleChildren) : undefined}
                                value={item.quantity}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value || "1", 10);
                                  const minQty = item.productData?.orderMinimumQuantity ?? 1;
                                  const maxQty = getAllowedMaxQty(item, bundleChildren);

                                  if (Number.isNaN(val)) return;
                                  if (val < minQty) {
                                    toast.error(`Minimum order quantity is ${minQty}`);
                                    val = minQty;
                                  }
                                  if (val > maxQty) {
                                    toast.error(getMaxQtyMessage(item, maxQty));
                                    val = maxQty;
                                  }
                                  updateQuantity(item.id, val);
                                  if (item.isBundleParent && item.bundleId) bundleChildren.forEach((c) => updateQuantity(c.id, val));
                                }}
                              />
                              <button
                                onClick={() => {
                                  let newQty = (item.quantity ?? 1) + 1;
                                  const maxQty = getAllowedMaxQty(item, bundleChildren);
                                  if (newQty > maxQty) {
                                    toast.error(getMaxQtyMessage(item, maxQty));
                                    return;
                                  }
                                  updateQuantity(item.id, newQty);
                                  if (item.isBundleParent && item.bundleId) bundleChildren.forEach((c) => updateQuantity(c.id, newQty));
                                }}
                                className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors font-bold"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Badges */}
                            {typeof item.vatRate === "number" && item.vatRate > 0 ? (
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {item.vatRate}% VAT
                              </span>
                            ) : (item.vatIncluded === false || item.vatRate === 0 || item.vatRate === null) ? (
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider">
                                VAT Exempt
                              </span>
                            ) : null}
                            {getItemLoyaltyPoints(item) > 0 && (
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider">
                                <AwardIcon className="w-3 h-3" />
                                Earn {getItemLoyaltyPoints(item)} pts
                              </div>
                            )}
                            {item.shipSeparately === true && purchasableItemCount > 1 && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider">
                                📦 Ships separately
                              </span>
                            )}
                            {item.type === "subscription" && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Subscription • {item.frequency && !isNaN(Number(item.frequency)) ? `${item.frequency} ` : ""}{item.frequencyPeriod}
                              </span>
                            )}
                          </div>

                          {/* Extra info (Coupons, Errors) */}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.couponCode ? (
                              <div className="flex items-center gap-1 bg-orange-50 text-orange-800 px-2 py-1 rounded border border-orange-100">
                                <span className="text-[10px] font-bold uppercase tracking-wide">{item.couponCode}</span>
                                <button onClick={() => removeCouponFromItem(item.id, item.type)} className="flex items-center justify-center text-red-600 hover:text-red-600 transition-colors ml-1">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ) : availableCoupons.some((c) => c.productIds.includes(item.id)) ? (
                              <button onClick={() => { setSelectedItem(item); setShowOffers(true); }} className="flex items-center gap-1 text-[11px] font-bold text-[#d0021b] hover:text-[#b0011a] transition-colors hover:underline">
                                <BadgePercent size={12} />
                                Apply Coupon
                              </button>
                            ) : null}

                            {getItemStock(item) === 0 && (
                              <span className="text-red-600 text-[10px] font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Out of Stock</span>
                            )}
                            {stockError[item.id] && <span className="text-red-600 text-[10px] font-medium">{stockError[item.id]}</span>}
                            {item.productData?.isPharmaProduct && (
                              <button onClick={() => setPharmaEditItem(item)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2 transition-colors">
                                Edit Medical Info
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Top-right trash icon */}
                        <button onClick={() => setRemoveTarget({ item, bundleChildren })} className="w-7 h-7 flex items-center justify-center rounded bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bundle Children */}
                  {bundleChildren.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bundle Contents</span>
                      </div>
                      <div className="space-y-2">
                        {bundleChildren.map((gp: any) => (
                          <div key={gp.id} className="flex items-center gap-3 bg-gray-50/50 p-2 sm:p-3 rounded-xl border border-gray-100">
                            <Link href={`/product/${gp.slug}`} className="relative w-12 h-12 bg-white rounded-lg border border-gray-100 p-1 flex-shrink-0">
                              <img src={gp.image} alt="no img" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/product/${gp.slug}`}>
                                <h3 className="text-xs font-bold text-gray-900 leading-tight truncate">{gp.name}</h3>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                {gp.hasBundleDiscount ? (
                                  <>
                                    <span className="text-xs font-bold text-gray-900">£{(gp.price * gp.quantity).toFixed(2)}</span>
                                    {(gp.individualSavings ?? 0) > 0 && (
                                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                        Save £{(gp.individualSavings * gp.quantity).toFixed(2)}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-gray-900">£{(gp.price * gp.quantity).toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                              x{gp.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT: order summary */}
          <div className="w-full lg:w-[350px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">Price Details</h2>

              {/* Free Shipping Progress */}
              {allNextDayFree ? (
                <div className="mb-2 bg-orange-50 border border-orange-100 rounded p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        You've unlocked <span className="text-orange-600">FREE Next Day Delivery!</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All items in your cart qualify for free next day delivery.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                freeShippingThreshold > 0 ? (
                  <div className="mb-2 bg-gray-50 border border-gray-100 rounded p-4 sm:p-5">
                    {cartTotal >= freeShippingThreshold ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                          <Truck size={18} />
                        </div>
                        <span className="text-sm font-bold text-gray-900">You've unlocked <span className="text-orange-600">FREE Standard Delivery!</span></span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                            <Truck size={18} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 leading-tight">
                            Add <span className="font-bold text-gray-900">£{(freeShippingThreshold - cartTotal).toFixed(2)}</span> more for <span className="text-orange-600 font-bold">FREE Delivery</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded h-2.5 overflow-hidden">
                          <div
                            className="bg-black h-full rounded transition-all duration-500 ease-out"
                            style={{ width: `${Math.min((cartTotal / freeShippingThreshold) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mb-2 bg-orange-50 border border-orange-100 rounded p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <Truck size={18} />
                      </div>
                      <span className="text-sm font-bold text-gray-900">You've unlocked <span className="text-orange-600">FREE Standard Delivery!</span></span>
                    </div>
                  </div>
                )
              )}

              {/* Apply Coupon */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">Promo Code</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-sm font-semibold outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:font-medium placeholder:text-gray-400"
                  />
                  <button onClick={applyCouponInput} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded text-sm font-bold shadow-sm transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {totalLoyaltyPoints > 0 && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded mb-6">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AwardIcon size={18} />
                    <span className="font-bold text-sm">Loyalty Points</span>
                  </div>
                  <span className="font-black text-amber-700">+{totalLoyaltyPoints}</span>
                </div>
              )}

              {/* Price Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>Subtotal (Incl. VAT)</span>
                  <span className="text-gray-900 font-bold">£{correctSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                  <span>VAT</span>
                  <span className="text-gray-900 font-bold">£{orderVatAmount.toFixed(2)}</span>
                </div>

                {bundleSavings > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-orange-600">
                    <span>Bundle Savings</span>
                    <span>-£{bundleSavings.toFixed(2)}</span>
                  </div>
                )}
                {finalDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-orange-600">
                    <span>Discounts</span>
                    <span>-£{finalDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-black text-gray-900 tracking-tight">£{(correctSubtotal - totalCombinedDiscount).toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingStock}
                className={`w-full bg-black hover:bg-gray-800 text-white py-3 rounded font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group ${isCheckingStock ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCheckingStock ? "Checking Stock..." : "Proceed to Checkout"}
                {!isCheckingStock && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-gray-400 text-xs font-semibold">
                <ShieldCheck size={14} />
                <span>Secure Checkout Process</span>
              </div>

              {showOffers && selectedItem && (
                <ProductOffersModal
                  item={selectedItem}
                  onClose={() => { setShowOffers(false); setSelectedItem(null); }}
                  onApply={(couponData) => applyCouponFromBackend(selectedItem, couponData)}
                  isDiscountActive={isDiscountActive}
                />
              )}
              <ConfirmRemoveModal
                open={!!removeTarget}
                title="Remove item"
                description="Are you sure you want to remove this item from your bag?"
                onCancel={() => setRemoveTarget(null)}
                onConfirm={() => {
                  if (!removeTarget) return;
                  const { item, bundleChildren } = removeTarget;
                  if (item.isBundleParent === true && item.purchaseContext === "bundle" && item.bundleId) {
                    bundleChildren.forEach((c: any) => removeFromCart(c.id, c.type));
                  }
                  removeFromCart(item.id, item.type);
                  setRemoveTarget(null);
                  toast.error("Item removed");
                }}
              />
              {pharmaEditItem && (
                <PharmaQuestionsModal
                  open={!!pharmaEditItem}
                  productId={pharmaEditItem.productId}
                  mode="edit"
                  onClose={() => setPharmaEditItem(null)}
                  onSuccess={() => { setPharmaEditItem(null); toast.success("Medical info updated."); }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
