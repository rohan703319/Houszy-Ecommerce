// app/checkout/page.tsx ka working code hai
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import EmptyCart from "@/components/cart/EmptyCart";
import { Gift, ShoppingBag } from "lucide-react";
import SavedAddressesSection from "@/components/checkout/SavedAddressesSection";
import LoyaltyRedemptionBox from "@/components/checkout/LoyaltyRedemptionBox";
import { getPharmaSessionId } from "@/app/lib/pharmaSession";
// ---------- Types ----------
type AddressSuggestion = {
  id: string;
  type: string;
  text: string;
};

function formatCurrency(n = 0) {
  return `£${n.toFixed(2)}`;
}
function isBundleComplete(cartItems: any[], mainProductId: string) {
  const mainItem = cartItems.find(
    i => i.productId === mainProductId && !i.parentProductId
  );

  if (!mainItem) return false;

  const groupedItems = cartItems.filter(
    i => i.parentProductId === mainProductId
  );
  // ❌ koi grouped item hi nahi
  if (groupedItems.length === 0) return false;
  // optional: quantity validation
  return groupedItems.every(
    gi => gi.quantity >= mainItem.quantity
  );
}
/* ===== Simple debounce hook (no lodash) ===== */
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, wait = 300) {
  const timer = useRef<number | undefined>(undefined);
  const latestFn = useRef(fn);
  useEffect(() => {
    latestFn.current = fn;
  }, [fn]);

  return useCallback((...args: Parameters<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      latestFn.current(...args);
    }, wait) as unknown as number;
  }, [wait]);
}
/* === Stripe wrapper component (we fetch publishable key first) === */
function StripeWrapper({
  children,
  clientSecret,
}: {
  children: React.ReactNode;
  clientSecret?: string;
}) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payment/config`);
      const json = await res.json();
      const pk = json?.data?.publishableKey;

      if (mounted) setStripePromise(loadStripe(pk));
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!stripePromise) return <div>Loading...</div>;

  const options = clientSecret
    ? { clientSecret, locale: "en-GB" as const }
    : undefined;

  return (
    <Elements stripe={stripePromise} options={options as any}>
      {children}
    </Elements>
  );
}
/* === Payment form as a child component === */
/* === CARD PAYMENT COMPONENT (FINAL PERFECT VERSION) === */
function CheckoutPayment({
  orderPayload,
  payAmount,
  clientSecret,
  orderId,
  onPaymentSuccess,
  onError,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/success?orderId=${orderId}`,
        payment_method_data: {
          billing_details: {
            name: `${orderPayload.billingFirstName} ${orderPayload.billingLastName}`,
            email: orderPayload.customerEmail,
            address: {
              line1: orderPayload.billingAddressLine1,
              country: "GB",
            },
          },
        },
      },
      redirect: "if_required",
    });

    if (result.error) {
      onError(result.error);
      setProcessing(false);
      return;
    }
    if (!result.paymentIntent?.id) {
      onError({ message: "Payment failed" });
      setProcessing(false);
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payment/confirm/${result.paymentIntent.id}`, {
      method: "POST",
    });

    onPaymentSuccess({ data: { id: orderId } });
    setProcessing(false);
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      <button
        onClick={handlePay}
        disabled={!stripe || processing}
        className={`w-full py-3 rounded flex items-center justify-center gap-2 transition ${processing
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#445D41] hover:bg-[#3a5037] text-white"
          }`}
      >
        {processing ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Processing payment
          </>
        ) : (
          `Pay ${formatCurrency(payAmount)}`
        )}
      </button>
    </div>
  );
}
const ErrorText = ({ error }: { error?: string }) => {
  if (!error) return null;
  return <p className="text-red-600 text-xs mt-1">{error}</p>;
};

/* === Main Checkout Page === */
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, updateCart, updateQuantity, clearCart } = useCart();
  const { user, accessToken, isAuthenticated } = useAuth();
  // Billing fields
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("United Kingdom");
  //delivery methods
  const [deliveryMethod, setDeliveryMethod] = useState<"HomeDelivery" | "ClickAndCollect">("HomeDelivery");
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  // Shipping quote options
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<any | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  // Shipping fields
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingFirstName, setShippingFirstName] = useState("");
  const [shippingLastName, setShippingLastName] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [shippingAddress1, setShippingAddress1] = useState("");
  const [shippingAddress2, setShippingAddress2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("United Kingdom");
  const [shippingPhone, setShippingPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // 🔹 Shipping address autocomplete states
  const [shippingAddressQuery, setShippingAddressQuery] = useState("");
  const [shippingAddressSuggestions, setShippingAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showShippingSuggestions, setShowShippingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const clearFieldError = (key: string) => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };
  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) {
      setError(null);
    }
  }, [fieldErrors]);
  const handleAddressSelect = (addr: any | null) => {
    if (!addr) {
      // Clear form for new address
      setBillingFirstName("");
      setBillingLastName("");
      setBillingPhone("");
      setBillingCompany("");
      setBillingAddress1("");
      setBillingAddress2("");
      setBillingCity("");
      setBillingState("");
      setBillingPostalCode("");
      setBillingCountry("United Kingdom");
      return;
    }

    setBillingFirstName(addr.firstName);
    setBillingLastName(addr.lastName);

    setBillingCompany(addr.company || "");
    setBillingAddress1(addr.addressLine1);
    setBillingAddress2(addr.addressLine2 || "");
    setBillingCity(addr.city);
    setBillingState(addr.state);
    setBillingPostalCode(addr.postalCode);
    setBillingCountry(addr.country || "United Kingdom");
    // 🔥 FIXED PHONE LOGIC (UK Safe)
    // 🔥 SAFE PHONE
    const phoneRaw = addr.phoneNumber ?? "";

    const cleaned = phoneRaw
      .replace("+44", "")
      .replace(/^0/, "")
      .replace(/\D/g, "");

    setBillingPhone(cleaned);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated.billingFirstName;
      delete updated.billingPhone;
      delete updated.billingAddress1;
      delete updated.billingPostalCode;
      delete updated.billingCity;
      delete updated.billingState;
      return updated;
    });
    if (shippingSameAsBilling) {
      setShippingFirstName(addr.firstName);
      setShippingLastName(addr.lastName);
      setShippingPhone(cleaned);
      setShippingCompany(addr.company || "");
      setShippingAddress1(addr.addressLine1);
      setShippingAddress2(addr.addressLine2 || "");
      setShippingCity(addr.city);
      setShippingState(addr.state);
      setShippingPostalCode(addr.postalCode);
      setShippingCountry(addr.country || "United Kingdom");
    }
  };

  // const [showPayment, setShowPayment] = useState(false);

  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<{
    subtotalAmount: number;
    shippingAmount: number;
    discountAmount: number;
    bundleDiscountAmount: number;
    taxAmount: number;
    totalAmount: number;
  } | null>(null);


  const [isPlacing, setIsPlacing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  // ✅ Terms & Newsletter states
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  // 🔹 BUY NOW ITEM (frontend-only)
  // ✅ BUY NOW SAFE STATE
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [reorderItems, setReorderItems] = useState<any[]>([]);
  useEffect(() => {
    const stored = sessionStorage.getItem("buyNowItem");

    if (stored) {
      try {
        setBuyNowItem(JSON.parse(stored));
      } catch {
        setBuyNowItem(null);
      }
    }
  }, []);

  useEffect(() => {
    const reorder = sessionStorage.getItem("reorderItems");

    if (reorder) {
      try {
        setReorderItems(JSON.parse(reorder));
      } catch {
        setReorderItems([]);
      }
    }
  }, []);

  const isReorderFlow = reorderItems.length > 0;
  const isBuyNowFlow = !!buyNowItem;

  const checkoutItems = isReorderFlow
    ? reorderItems
    : isBuyNowFlow
      ? [buyNowItem]
      : cart;
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("buyNowItem");
      sessionStorage.removeItem("reorderItems"); // 🔥 ADD THIS

      setBuyNowItem(null);
      setReorderItems([]); // 🔥 ADD THIS
    };
  }, []);
  useEffect(() => {
    console.log("CHECK ITEMS", checkoutItems);
  }, [checkoutItems]);
  // 🔥 PHARMA CHECK
  const hasPharmaProduct = useMemo(() => {
    return checkoutItems.some(
      (item) => item.productData?.isPharmaProduct === true
    );
  }, [checkoutItems]);
  const effectiveCartCount = checkoutItems.reduce(
    (sum, i) => sum + i.quantity,
    0
  );
  // ✅ PRICE CALCULATIONS FROM CART (FOR UI)
  const cartSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const base = item.priceBeforeDiscount ?? item.price;
      return sum + base * item.quantity;
    }, 0);
  }, [checkoutItems]);


  // 🎁 Loyalty points helpers (CHECKOUT)
  const isLoyaltyEligible = (item: any) => {
    if (!item?.productData) return false;
    if (item.productData.excludeFromLoyaltyPoints === true) return false;
    return true;
  };
  const getItemLoyaltyPoints = (item: any) => {
    if (!isLoyaltyEligible(item)) return 0;
    // Variant priority
    if (item.variantId && Array.isArray(item.productData?.variants)) {
      const v = item.productData.variants.find(
        (x: any) => x.id === item.variantId
      );
      return v?.loyaltyPointsEarnable ?? 0;
    }

    // Product level fallback
    return item.productData?.loyaltyPointsEarnable ?? 0;
  };
  // 🎁 TOTAL LOYALTY POINTS (PER PRODUCT, NOT PER QTY)
  const totalLoyaltyPoints = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const pts = getItemLoyaltyPoints(item);
      if (!pts) return sum;
      return sum + pts; // ❌ no quantity multiplication
    }, 0);
  }, [checkoutItems]);

  const cartBundleDiscount = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      // only main product can trigger bundle
      if (
        item.productData?.requireOtherProducts === true &&
        typeof item.productData?.totalSavings === "number"
      ) {
        const valid = isBundleComplete(checkoutItems, item.productId);

        if (!valid) return sum;

        // 🔥 MULTIPLY BY MAIN PRODUCT QUANTITY
        return sum + item.productData.totalSavings * item.quantity;
      }
      return sum;
    }, 0);
  }, [checkoutItems]);

  const cartDiscount = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      return sum + (item.discountAmount ?? 0) * item.quantity;
    }, 0);
  }, [checkoutItems]);
  // ✅ CORRECT SUBTOTAL (same as cart)
  const correctSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const qty = item.quantity ?? 1;

      // 🟢 COUPON DISCOUNT — check FIRST (takes priority over all other discount types)
      if (item.couponCode && (item.discountAmount ?? 0) > 0) {
        const preCouponPrice = (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);
        return sum + preCouponPrice * qty;
      }

      // 🔴 SYSTEM DISCOUNT

      if (
        item.displayDiscountType === "System" &&
        (item.discountAmount ?? 0) > 0
      ) {
        const originalPrice =
          item.priceBeforeDiscount &&
            item.priceBeforeDiscount > (item.finalPrice ?? item.price)
            ? item.priceBeforeDiscount
            : (item.finalPrice ?? item.price) + (item.discountAmount ?? 0);

        return sum + originalPrice * qty;
      }

      if (item.displayDiscountType === "OldPrice") {
        const oldPrice = item.oldPrice ?? item.productData?.oldPrice;
        if (oldPrice && oldPrice > item.price) {
          return sum + oldPrice * qty;
        }
      }

      return sum + item.price * qty;
    }, 0);
  }, [checkoutItems]);

  // ✅ OLD PRICE DISCOUNT
  const oldPriceDiscount = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {

      const qty = item.quantity ?? 1;
      if (item.displayDiscountType === "OldPrice") {

        const oldPrice =
          item.oldPrice ??
          item.productData?.oldPrice;

        if (oldPrice && oldPrice > item.price) {
          return sum + (oldPrice - item.price) * qty;
        }
      }



      return sum;
    }, 0);
  }, [checkoutItems]);

  // ✅ FINAL DISCOUNT
  const finalDiscount = cartDiscount + oldPriceDiscount;

  // ✅ TOTAL DISCOUNT (bundle + all)
  const totalCombinedDiscount = cartBundleDiscount + finalDiscount;
  // Delivery type availability — ALL cart items must support the type
  const allSupportNextDay = useMemo(() =>
    checkoutItems.length > 0 && checkoutItems.every(i => i.nextDayDeliveryEnabled === true),
    [checkoutItems]);
  const allNextDayFree = useMemo(() =>
    checkoutItems.length > 0 &&
    checkoutItems.every(i => i.nextDayDeliveryFree === true),
    [checkoutItems]
  );
  const allSupportSameDay = useMemo(() =>
    checkoutItems.length > 0 && checkoutItems.every(i => i.sameDayDeliveryEnabled === true),
    [checkoutItems]);

  const shippingCost = useMemo(() => {
    if (!selectedShippingOption) return 0;

    const isNextDay =
      selectedShippingOption?.deliveryOptionId === "451bb725-19f7-441a-9dd0-d282cf268397";

    if (isNextDay && allNextDayFree) {
      return 0;
    }

    return selectedShippingOption.price ?? 0;
  }, [selectedShippingOption, allNextDayFree]);

  const cartTotalAmount = useMemo(() => {
    return (
      correctSubtotal -
      totalCombinedDiscount +
      shippingCost
    );
  }, [
    correctSubtotal,
    totalCombinedDiscount,
    shippingCost,
  ]);
  const finalPayableAmount = cartTotalAmount - pointsDiscount;
  const isFreeOrder = finalPayableAmount <= 0;
  const checkoutVatAmount = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const rate =
        typeof item.vatRate === "number" ? item.vatRate : 0;
      // line total is VAT-inclusive
      const lineTotal =
        (item.finalPrice ?? item.price) * item.quantity;

      if (rate <= 0) return sum;
      // VAT-inclusive formula
      const vat = (lineTotal * rate) / (100 + rate);
      return sum + vat;
    }, 0);
  }, [checkoutItems]);
  // Fetch shipping quote when postcode is available
  useEffect(() => {
    const postcode = (shippingSameAsBilling ? billingPostalCode : shippingPostalCode).trim();
    if (!postcode) {
      setShippingOptions([]);
      setSelectedShippingOption(null);
      setShippingError(null);
      return;
    }
    const cartValue = checkoutItems.reduce((s, i) => s + (i.finalPrice ?? i.price) * i.quantity, 0);
    const itemCount = checkoutItems.reduce((s, i) => s + i.quantity, 0);

    const timer = setTimeout(async () => {
      try {
        setShippingQuoteLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Shipping/quote?postcode=${encodeURIComponent(postcode)}&orderTotal=${cartValue}`
        );
        const json = await res.json();

        if (!res.ok) {
          setShippingError(json?.message || "We do not currently deliver to this region.");
          setShippingOptions([]);
          setSelectedShippingOption(null);
          return;
        }

        if (json?.success && Array.isArray(json.data)) {
          setShippingError(null);
          let options = json.data;

          // 🔥 MAIN FILTER (IMPORTANT)
          options = options.filter((opt: any) => {
            const name = (opt.name || opt.displayName || "").toLowerCase();
            const isCollect = name.includes("collect");

            // 👉 Home Delivery → remove collect
            if (deliveryMethod === "HomeDelivery") {
              return !isCollect;
            }

            // 👉 Click & Collect → ONLY collect
            if (deliveryMethod === "ClickAndCollect") {
              return isCollect;
            }

            return true;
          });

          // existing capability filter (same as before)
          options = options.filter((opt: any) => {
            const name = (opt.name || "").toLowerCase();

            if (name.includes("next")) return allSupportNextDay;
            if (name.includes("same")) return allSupportSameDay;

            return true;
          });

          options.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          setShippingOptions(options);

          if (options.length > 0) {
            setSelectedShippingOption(options[0]);
          }
        }
      } catch { /* silent */ } finally {
        setShippingQuoteLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [billingPostalCode, shippingPostalCode, shippingSameAsBilling, deliveryMethod, allSupportNextDay, allSupportSameDay]);
  useEffect(() => {
    if (deliveryMethod !== "ClickAndCollect") {
      setStores([]);
      setSelectedStoreId(null);
      return;
    }

    const fetchStores = async () => {
      try {
        setStoreLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/StoreLocations?includeInactive=false`
        );

        // ❌ अगर response hi fail ho gaya (500, 404 etc)
        if (!res.ok) {
          console.error("Store API failed with status:", res.status);
          setStores([]); // 👈 ADD THIS
          return;
        }

        // 🔥 SAFE parsing
        const text = await res.text();

        if (!text) {
          console.error("Empty StoreLocations response");
          setStores([]); // 👈 ADD THIS
          return;
        }

        let json: any;
        try {
          json = JSON.parse(text);
        } catch (err) {
          console.error("Invalid JSON from StoreLocations:", text);
          setStores([]); // 👈 ADD THIS
          return;
        }

        // ✅ VALID DATA CHECK
        if (json?.success && Array.isArray(json.data)) {
          const activeStores = json.data.filter((s: any) => s.isActive === true);
          setStores(activeStores);
          if (activeStores.length > 0) {
            setSelectedStoreId((prev) => {
              const exists = activeStores.some((s: any) => s.id === prev);
              return exists ? prev : activeStores[0].id;
            });
          }
        } else {
          console.error("Unexpected store response format:", json);
        }

      } catch (err) {
        console.error("Store fetch failed:", err);
      } finally {
        setStoreLoading(false);
      }
    };

    fetchStores();
  }, [deliveryMethod]);
  // ✅ 🔥 YAHI ADD KARNA HAI (NEW EFFECT)
  useEffect(() => {
    if (
      deliveryMethod === "ClickAndCollect" &&
      stores.length > 0 &&
      !stores.some(s => s.id === selectedStoreId)
    ) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId, deliveryMethod]);
  // --- NEW: prefill billing email from localStorage (Continue as Guest) ---
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setBillingEmail(user.email);
    } else {
      const savedEmail = localStorage.getItem("guestEmail");
      if (savedEmail) setBillingEmail(savedEmail);
    }
  }, [isAuthenticated, user]);
  // Debounced autocomplete using the single API you provided
  const doAutocomplete = useCallback(async (q: string) => {
    if (!q || q.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/search?query=${encodeURIComponent(q.trim())}&country=GB`
      );

      const json = await res.json();

      if (!json?.success || !Array.isArray(json.data)) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setAddressSuggestions(json.data);
      setShowSuggestions(json.data.length > 0);
    } catch (err) {
      console.error("Address lookup failed", err);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);
  const doShippingAutocomplete = useCallback(async (q: string) => {
    if (!q || q.trim().length < 3) {
      setShippingAddressSuggestions([]);
      setShowShippingSuggestions(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/search?query=${encodeURIComponent(q.trim())}&country=GB`
      );

      const json = await res.json();

      if (!json?.success || !Array.isArray(json.data)) {
        setShippingAddressSuggestions([]);
        setShowShippingSuggestions(false);
        return;
      }

      setShippingAddressSuggestions(json.data);
      setShowShippingSuggestions(json.data.length > 0);
    } catch (err) {
      console.error("Shipping address lookup failed", err);
      setShippingAddressSuggestions([]);
      setShowShippingSuggestions(false);
    }
  }, []);
  const fetchAddressDetails = async (id: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/details/${encodeURIComponent(
        id
      )}`
    );

    const json = await res.json();

    if (!json?.success || !json?.data) {
      throw new Error("Failed to fetch address details");
    }
    return json.data;
  };
  const debouncedAutocomplete = useDebouncedCallback(doAutocomplete, 350);
  const debouncedShippingAutocomplete = useDebouncedCallback(doShippingAutocomplete, 350);
  useEffect(() => {
    debouncedAutocomplete(addressQuery);
  }, [addressQuery, debouncedAutocomplete]);

  useEffect(() => {
    debouncedShippingAutocomplete(shippingAddressQuery);
  }, [shippingAddressQuery, debouncedShippingAutocomplete]);

  useEffect(() => {
    if (!shippingSameAsBilling) return;
    setShippingFirstName(billingFirstName);
    setShippingLastName(billingLastName);
    setShippingPhone(billingPhone);
    setShippingCompany(billingCompany);
    setShippingAddress1(billingAddress1);
    setShippingAddress2(billingAddress2);
    setShippingCity(billingCity);
    setShippingState(billingState);
    setShippingPostalCode(billingPostalCode);
    setShippingCountry(billingCountry);
  }, [
    shippingSameAsBilling,
    billingFirstName,
    billingLastName,
    billingCompany,
    billingAddress1,
    billingAddress2,
    billingCity,
    billingState,
    billingPostalCode,
    billingCountry,
  ]);
  // When user selects suggestion -> autofill fields
  const handleSelectSuggestion = async (s: AddressSuggestion) => {
    try {
      setShowSuggestions(false);
      setAddressSuggestions([]); // ⭐ ADD THIS
      setAddressQuery(""); // 🔥 clear search input after select
      const details = await fetchAddressDetails(s.id);
      const line1 =
        details.line1 ||
        details.line2 ||
        details.line3 ||
        s.text || "";
      const city =
        details.city ||
        details.town ||
        details.locality ||
        details.administrativeArea ||
        "";
      const state = details.province || "";
      const postcode = details.postalCode || "";
      const country = details.country || "United Kingdom";
      // 🔹 Billing
      setBillingAddress1(line1);
      setBillingCity(city);
      setBillingState(state);
      setBillingPostalCode(postcode);
      setBillingCountry(country);
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.billingAddress1;
        delete updated.billingPostalCode;
        delete updated.billingCity;
        delete updated.billingState;
        return updated;
      });
      // 🔹 Shipping (respect checkbox)
      if (shippingSameAsBilling) {
        setShippingAddress1(line1);
        setShippingCity(city);
        setShippingState(state);
        setShippingPostalCode(postcode);
        setShippingCountry(country);
      }
    } catch (err) {
      console.error("Address details error", err);
    }
  };

  async function subscribeNewsletterAfterOrder(email: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "Checkout",
            ipAddress: "0.0.0.0",
          }),
        }
      );
      const data = await res.json();
      if (data?.success) {
        localStorage.setItem("newsletterEmail", email);
      }
    } catch (err) {
      console.error("Newsletter subscribe failed", err);
    }
  }
  const getAppliedCouponCode = () => {
    const codes = checkoutItems
      .map((item) => item.couponCode?.trim())
      .filter((code): code is string => Boolean(code));
    return codes.length > 0 ? codes[0] : null;
  };
  // Build order payload matching your sample
  const buildOrderPayload = () => {
    // 🔥 pharmacySessionId logic
    let pharmacySessionId: string | null = null;

    if (!isAuthenticated && hasPharmaProduct) {
      pharmacySessionId = getPharmaSessionId();
    }
    const items = checkoutItems.map((c) => ({
      productId: c.productId ?? c.id,
      productVariantId: c.variantId ?? null,
      quantity: c.quantity,
      unitPrice:
        c.displayDiscountType === "System" &&
          (c.discountAmount ?? 0) > 0
          ? (
            c.priceBeforeDiscount ??
            ((c.finalPrice ?? c.price) + (c.discountAmount ?? 0))
          )
          : (c.priceBeforeDiscount ?? c.price ?? c.finalPrice),

    }));
    return {
      deliveryMethod,  // ADD THIS LINE
      collectionStoreId:
        deliveryMethod === "ClickAndCollect"
          ? selectedStoreId
          : null,
      paymentMethod: "Card",
      customerEmail: billingEmail,
      customerPhone: `+44${billingPhone}`,
      billingPhone: `+44${billingPhone}`,
      shippingPhone: `+44${shippingSameAsBilling ? billingPhone : shippingPhone}`,
      isGuestOrder: !isAuthenticated,
      userId: isAuthenticated ? user?.id : null,
      pharmacySessionId,
      billingFirstName,
      billingLastName,
      billingCompany,
      billingAddressLine1: billingAddress1,
      billingAddressLine2: billingAddress2,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      shippingFirstName: shippingSameAsBilling ? billingFirstName : shippingFirstName,
      shippingLastName: shippingSameAsBilling ? billingLastName : shippingLastName,
      shippingCompany: shippingSameAsBilling ? billingCompany : shippingCompany,
      shippingAddressLine1: shippingSameAsBilling ? billingAddress1 : shippingAddress1,
      shippingAddressLine2: shippingSameAsBilling ? billingAddress2 : shippingAddress2,
      shippingCity: shippingSameAsBilling ? billingCity : shippingCity,
      shippingState: shippingSameAsBilling ? billingState : shippingState,
      shippingPostalCode: shippingSameAsBilling ? billingPostalCode : shippingPostalCode,
      shippingCountry: shippingSameAsBilling ? billingCountry : shippingCountry,
      orderItems: items,
      couponCode: getAppliedCouponCode(),
      // ✅ ADD THIS
      selectedShippingMethodId:
        selectedShippingOption?.deliveryOptionId ?? null,

      selectedShippingMethodName:
        selectedShippingOption?.displayName ||
        selectedShippingOption?.name ||
        null,

      shippingCost: selectedShippingOption?.price ?? 0,
      notes,
      pointsToRedeem: pointsToRedeem || 0,
      pointsDiscountAmount: pointsDiscount || 0,
    };
  };
  const validateAndBuildPayload = async (): Promise<any | null> => {
    setError(null);
    setFieldErrors({});
    const errors: any = {};

    if (!billingEmail.trim()) {
      errors.billingEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      errors.billingEmail = "Enter a valid email address";
    }
    if (!billingFirstName.trim()) errors.billingFirstName = "First name is required";
    if (!billingPhone.trim()) errors.billingPhone = "Phone number is required";

    if (!billingAddress1.trim()) errors.billingAddress1 = "Address line 1 is required";
    if (!billingPostalCode.trim()) errors.billingPostalCode = "Postcode is required";
    // ✅ ADD THESE TWO LINES
    if (!billingCity.trim())
      errors.billingCity = "City is required";

    if (!billingState.trim())
      errors.billingState = "County is required";
    // ✅ SHIPPING VALIDATION (same as billing)
    if (deliveryMethod === "HomeDelivery" && !shippingSameAsBilling) {
      // ✅ ADD THIS
      if (!shippingFirstName.trim())
        errors.shippingFirstName = "Shipping first name is required";
      if (!shippingPhone.trim())
        errors.shippingPhone = "Shipping phone number is required";
      if (!shippingAddress1.trim())
        errors.shippingAddress1 = "Shipping address line 1 is required";

      if (!shippingPostalCode.trim())
        errors.shippingPostalCode = "Shipping postcode is required";

      if (!shippingCity.trim())
        errors.shippingCity = "Shipping city is required";

      if (!shippingState.trim())
        errors.shippingState = "Shipping county is required";
    }


    if (deliveryMethod === "ClickAndCollect" && !selectedStoreId) {
      errors.selectedStore = "Please select a store";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill all required fields");
      return null;
    }
    // 🔁 subscription logic (AS IS – unchanged)
    const subscriptionMap: Record<string, string> = {};
    for (const item of checkoutItems) {
      if (item.type === "subscription") {
        try {
          const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Subscriptions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isAuthenticated && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify({
              productId: item.productId ?? item.id,
              productVariantId: item.variantId ?? null,
              quantity: item.quantity,
              frequency: item.frequencyPeriod,
              shippingFirstName: shippingSameAsBilling ? billingFirstName : shippingFirstName,
              shippingLastName: shippingSameAsBilling ? billingLastName : shippingLastName,
              shippingPhone: `+44${shippingSameAsBilling ? billingPhone : shippingPhone}`,
              shippingAddressLine1: shippingSameAsBilling ? billingAddress1 : shippingAddress1,
              shippingAddressLine2: shippingSameAsBilling ? billingAddress2 : shippingAddress2,
              shippingCity: shippingSameAsBilling ? billingCity : shippingCity,
              shippingState: shippingSameAsBilling ? billingState : shippingState,
              shippingPostalCode: shippingSameAsBilling ? billingPostalCode : shippingPostalCode,
              shippingCountry: shippingSameAsBilling ? billingCountry : shippingCountry,
            }),
          });
          if (resp.ok) {
            const json = await resp.json();
            if (json?.data?.id) subscriptionMap[item.id] = json.data.id;
          }
        } catch {
          setError("Subscription setup failed. Try again.");
          return null;
        }
      }
    }
    const payload = {
      ...buildOrderPayload(),
      orderItems: checkoutItems.map((c) => ({
        productId: c.productId ?? c.id,
        productVariantId: c.variantId ?? null,
        quantity: c.quantity,
        unitPrice:
          c.displayDiscountType === "System" &&
            (c.discountAmount ?? 0) > 0
            ? (
              c.priceBeforeDiscount ??
              ((c.finalPrice ?? c.price) + (c.discountAmount ?? 0))
            )
            : (c.priceBeforeDiscount ?? c.price ?? c.finalPrice),
        subscriptionId: subscriptionMap[c.id] ?? null,
        frequency: c.frequency,
        couponCode: c.couponCode || null,
      })),
    };

    return payload;           // COD flow ke liye
  };

  const onPaymentSuccess = (createdOrder: any) => {
    if (createdOrder?.data) {
      setOrderSummary({
        subtotalAmount: createdOrder.data.subtotalAmount,
        shippingAmount: createdOrder.data.shippingAmount,
        discountAmount: createdOrder.data.discountAmount,
        bundleDiscountAmount: createdOrder.data.bundleDiscountAmount,
        taxAmount: createdOrder.data.taxAmount,
        totalAmount: createdOrder.data.totalAmount,
      });
    }

    if (isReorderFlow) {
      sessionStorage.removeItem("reorderItems");
    } else if (isBuyNowFlow) {
      sessionStorage.removeItem("buyNowItem");
      sessionStorage.setItem("preserveCart", "1");
    } else {
      clearCart();
    }
    if (subscribeNewsletter && billingEmail) {
      subscribeNewsletterAfterOrder(billingEmail);
    }
    // 🔥 CLEAR PHARMA SESSION AFTER SUCCESS (GUEST ONLY)
    if (!isAuthenticated) {
      localStorage.removeItem("pharmacy_session_id");
    }
    router.push(`/order/success?orderId=${createdOrder.data.id}`);
  };
  const onPaymentError = (err: any) => {
    setError(err?.message ?? "Payment failed");
  };
  if (!checkoutItems || checkoutItems.length === 0) {
    return <EmptyCart />;
  }
  const effectivePostcode = (
    shippingSameAsBilling ? billingPostalCode : shippingPostalCode
  ).trim();
  return (
    <div className="max-w-7xl mx-auto px-3 py-3">
      <h1 className="flex items-center gap-1.5 text-base font-bold mb-2">
        <ShoppingBag className="h-4 w-4 text-[#445D41]" />
        Checkout
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* LEFT: Billing + Shipping */}
        <div className="lg:col-span-2 space-y-2">
          {isAuthenticated && (
            <div className={isLocked ? "pointer-events-none opacity-60" : ""}>
              <SavedAddressesSection onSelect={handleAddressSelect} />
            </div>
          )}
          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 text-xs text-yellow-700 p-2 rounded mb-2">
              Order is locked for payment. You cannot edit details now.
            </div>
          )}
          <fieldset disabled={isLocked} className={isLocked ? "opacity-60" : ""}>
            <div className="bg-white p-3 lg:p-6 rounded shadow">
              <h2 className="text-sm font-semibold mb-2 lg:text-lg lg:mb-3">Billing details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">Email *</label>
                  <input
                    value={billingEmail}
                    onChange={(e) => { setBillingEmail(e.target.value); clearFieldError("billingEmail"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingEmail} />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <label className="text-xs font-medium text-gray-700">First name *</label>
                  <input
                    value={billingFirstName}
                    onChange={(e) => { setBillingFirstName(e.target.value); clearFieldError("billingFirstName"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingFirstName} />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <label className="text-xs font-medium text-gray-700">Last name</label>
                  <input
                    value={billingLastName}
                    onChange={(e) => setBillingLastName(e.target.value)}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">Phone (UK) *</label>
                  <div className="flex">
                    <span className="flex items-center bg-gray-100 border border-r-0 border-gray-300 px-2 rounded-l text-xs text-gray-700">+44</span>
                    <input
                      type="tel"
                      value={billingPhone}
                      onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, ""); setBillingPhone(cleaned); clearFieldError("billingPhone"); }}
                      placeholder="7xxxxxxxxx"
                      className="w-full border border-gray-300 p-1.5 text-sm rounded-r focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                      maxLength={10}
                    />
                  </div>
                  <ErrorText error={fieldErrors.billingPhone} />
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">Company Name (optional)</label>
                  <input
                    value={billingCompany}
                    onChange={(e) => setBillingCompany(e.target.value)}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2 relative z-[40]">
                  <label className="text-xs font-medium text-gray-700">Search address or postcode</label>
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    placeholder="Start typing city, postcode or address..."
                    className="w-full border p-1.5 text-sm rounded"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded max-h-48 overflow-auto shadow-lg z-[40]">
                      {addressSuggestions.map((s) => (
                        <button key={s.id} onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100">{s.text}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address line 1 *</label>
                  <input
                    value={billingAddress1}
                    onChange={(e) => { setBillingAddress1(e.target.value); clearFieldError("billingAddress1"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingAddress1} />
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address line 2 (optional)</label>
                  <input
                    value={billingAddress2}
                    onChange={(e) => setBillingAddress2(e.target.value)}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <label className="text-xs font-medium text-gray-700">Postcode *</label>
                  <input
                    value={billingPostalCode}
                    onChange={(e) => { setBillingPostalCode(e.target.value); clearFieldError("billingPostalCode"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingPostalCode} />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <label className="text-xs font-medium text-gray-700">City *</label>
                  <input
                    value={billingCity}
                    onChange={(e) => { setBillingCity(e.target.value); clearFieldError("billingCity"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingCity} />
                </div>
                <div className="flex flex-col space-y-0.5 col-span-2">
                  <label className="text-xs font-medium text-gray-700">County *</label>
                  <input
                    value={billingState}
                    onChange={(e) => { setBillingState(e.target.value); clearFieldError("billingState"); }}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                  />
                  <ErrorText error={fieldErrors.billingState} />
                </div>
              </div>
            </div>
          </fieldset>
          {/* Shipping */}
          {deliveryMethod === "HomeDelivery" && (
            <fieldset disabled={isLocked} className={isLocked ? "opacity-60" : ""}>
              <div className="bg-white p-3 lg:p-6 rounded shadow">
                <h2 className="text-sm font-semibold mb-2 lg:text-lg lg:mb-3">Shipping details</h2>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="same"
                    checked={shippingSameAsBilling}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShippingSameAsBilling(checked);

                      if (checked) {
                        // fill shipping with billing
                        setShippingFirstName(billingFirstName);
                        setShippingLastName(billingLastName);
                        setShippingPhone(billingPhone);
                        setShippingCompany(billingCompany);
                        setShippingAddress1(billingAddress1);
                        setShippingAddress2(billingAddress2);
                        setShippingCity(billingCity);
                        setShippingState(billingState);
                        setShippingPostalCode(billingPostalCode);
                        setShippingCountry(billingCountry);
                      } else {
                        // 🔥 CLEAR SHIPPING FORM
                        setShippingFirstName("");
                        setShippingLastName("");
                        setShippingPhone("");
                        setShippingCompany("");
                        setShippingAddress1("");
                        setShippingAddress2("");
                        setShippingCity("");
                        setShippingState("");
                        setShippingPostalCode("");
                        setShippingCountry("United Kingdom");
                      }
                    }}
                    type="checkbox"
                  />
                  <label htmlFor="same" className="text-s">Shipping same as billing</label>
                </div>
                {!shippingSameAsBilling ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col space-y-0.5 mt-2 col-span-2 relative z-[40]">
                      <label className="text-xs font-medium text-gray-700">
                        Search shipping address or postcode
                      </label>

                      <input
                        type="text"
                        value={shippingAddressQuery}
                        onChange={(e) => setShippingAddressQuery(e.target.value)}
                        placeholder="Start typing city, postcode or address..."
                        className="w-full border p-1.5 text-sm rounded"
                      />

                      {showShippingSuggestions && shippingAddressSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded max-h-48 overflow-auto shadow-lg z-[40]">
                          {shippingAddressSuggestions.map((s) => (
                            <button
                              key={s.id}
                              onClick={async () => {
                                try {
                                  const details = await fetchAddressDetails(s.id);

                                  const line1 =
                                    details.line1 ||
                                    details.line2 ||
                                    details.line3 ||
                                    s.text ||
                                    "";

                                  const city =
                                    details.city ||
                                    details.town ||
                                    details.locality ||
                                    details.administrativeArea ||
                                    "";

                                  const state = details.province || "";
                                  const postcode = details.postalCode || "";
                                  const country = details.country || "United Kingdom";

                                  setShippingAddress1(line1);
                                  setShippingCity(city);
                                  setShippingState(state);
                                  setShippingPostalCode(postcode);
                                  setShippingCountry(country);

                                  setShowShippingSuggestions(false);
                                  setShippingAddressSuggestions([]);
                                  setShippingAddressQuery("");
                                } catch (err) {
                                  console.error("Shipping address lookup error", err);
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                            >
                              {s.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <label className="text-xs font-medium text-gray-700">First name *</label>
                      <input value={shippingFirstName} onChange={(e) => { setShippingFirstName(e.target.value); clearFieldError("shippingFirstName"); }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                      <ErrorText error={fieldErrors.shippingFirstName} />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <label className="text-xs font-medium text-gray-700">Last name</label>
                      <input value={shippingLastName} onChange={(e) => setShippingLastName(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                    </div>
                    <div className="flex flex-col space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-gray-700">Phone (UK) *</label>
                      <div className="flex">
                        <span className="flex items-center bg-gray-100 border border-r-0 border-gray-300 px-2 rounded-l text-xs text-gray-700">
                          +44
                        </span>
                        <input
                          type="tel"
                          value={shippingPhone}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "");
                            setShippingPhone(cleaned);
                            clearFieldError("shippingPhone");
                          }}
                          placeholder="7xxxxxxxxx"
                          className="w-full border border-gray-300 p-1.5 text-sm rounded-r focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all"
                          maxLength={10}
                        />
                      </div>
                      <ErrorText error={fieldErrors.shippingPhone} />
                    </div>
                    <div className="flex flex-col space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-gray-700">Company (optional)</label>
                      <input value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                    </div>
                    <div className="flex flex-col space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-gray-700">Address line 1 *</label>
                      <input value={shippingAddress1} onChange={(e) => { setShippingAddress1(e.target.value); clearFieldError("shippingAddress1"); }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                      <ErrorText error={fieldErrors.shippingAddress1} />
                    </div>
                    <div className="flex flex-col space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-gray-700">Address line 2</label>
                      <input value={shippingAddress2} onChange={(e) => setShippingAddress2(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <label className="text-xs font-medium text-gray-700">Postcode *</label>
                      <input value={shippingPostalCode} onChange={(e) => { setShippingPostalCode(e.target.value); clearFieldError("shippingPostalCode"); }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                      <ErrorText error={fieldErrors.shippingPostalCode} />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <label className="text-xs font-medium text-gray-700">City *</label>
                      <input value={shippingCity} onChange={(e) => { setShippingCity(e.target.value); clearFieldError("shippingCity"); }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                      <ErrorText error={fieldErrors.shippingCity} />
                    </div>
                    <div className="flex flex-col space-y-0.5 col-span-2">
                      <label className="text-xs font-medium text-gray-700">County *</label>
                      <input value={shippingState} onChange={(e) => { setShippingState(e.target.value); clearFieldError("shippingState"); }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-2 focus:ring-[#445D41]/20 focus:border-[#445D41] transition-all" />
                      <ErrorText error={fieldErrors.shippingState} />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">Shipping will use billing address.</div>
                )}
              </div>
            </fieldset>
          )}
          {!effectivePostcode && (
            <div className="bg-yellow-50 border border-yellow-200 text-xs text-yellow-700 p-2 rounded">
              Enter postcode to see delivery methods
            </div>
          )}
          {/* DELIVERY METHOD SELECTOR */}
          {effectivePostcode && (
            <fieldset disabled={isLocked} className={isLocked ? "opacity-60" : ""}>
              <div className="bg-white p-3 rounded shadow">
                <h2 className="text-sm font-semibold mb-2">Delivery method</h2>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="deliveryMethod" checked={deliveryMethod === "HomeDelivery"} onChange={() => setDeliveryMethod("HomeDelivery")} />
                    Home Delivery
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="deliveryMethod" checked={deliveryMethod === "ClickAndCollect"} onChange={() => setDeliveryMethod("ClickAndCollect")} />
                    Click & Collect (Collect from store)
                  </label>
                </div>
              </div>
            </fieldset>
          )}
          {deliveryMethod === "ClickAndCollect" && (
            <fieldset disabled={isLocked} className={isLocked ? "opacity-60" : ""}>
              <div className="bg-white p-3 rounded shadow">
                <h2 className="text-sm font-semibold mb-2">Select Store</h2>

                {storeLoading ? (
                  <p className="text-xs text-gray-500">Loading stores...</p>
                ) : stores.length === 0 ? (
                  <p className="text-xs text-gray-400">No stores available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stores.map((store) => {
                      const isSelected = selectedStoreId === store.id;

                      return (
                        <label
                          key={store.id}
                          className={`flex items-start gap-3 h-full rounded-xl border p-3 cursor-pointer transition-all ${isSelected
                            ? "border-[#445D41] bg-[#445D41]/5 shadow-sm"
                            : "border-gray-200 hover:border-[#445D41]/40"
                            }`}
                        >
                          {/* Radio */}
                          <input
                            type="radio"
                            name="store"
                            checked={isSelected}
                            onChange={() => setSelectedStoreId(store.id)}
                            className="mt-1 accent-[#445D41]"
                          />

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">
                                {store.name}
                              </p>

                              {isSelected && (
                                <span className="text-[10px] bg-[#445D41] text-white px-2 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 mt-0.5">
                              {store.addressLine1}, {store.city}, {store.postalCode}
                            </p>

                            {store.openingHours && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {store.openingHours}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </fieldset>
          )}
          {/* SHIPPING OPTIONS */}
          {deliveryMethod === "HomeDelivery" && shippingOptions.length > 0 && (
            <fieldset disabled={isLocked} className={isLocked ? "opacity-60" : ""}>
              <div className="bg-white p-3 rounded shadow">
                <h2 className="text-sm font-semibold mb-2">Delivery options</h2>
                {shippingQuoteLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <svg className="animate-spin h-4 w-4 text-[#445D41]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading delivery options...
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <p className="text-xs text-gray-400">Enter your postcode above to see delivery options.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shippingOptions.map((opt: any) => (
                      <label
                        key={opt.deliveryOptionId}
                        className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-all ${selectedShippingOption?.deliveryOptionId === opt.deliveryOptionId
                          ? "border-[#445D41] bg-[#445D41]/5"
                          : "border-gray-200 hover:border-[#445D41]/50"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingOption"
                            checked={selectedShippingOption?.deliveryOptionId === opt.deliveryOptionId}
                            onChange={() => setSelectedShippingOption(opt)}
                            className="accent-[#445D41]"
                          />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{opt.displayName}</p>
                            {opt.estimatedDelivery && (
                              <p className="text-[11px] text-gray-500">{opt.estimatedDelivery}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${opt.isFree ? "text-green-600" : "text-gray-800"}`}>
                          {(() => {
                            const isNextDay =
                              opt.deliveryOptionId === "451bb725-19f7-441a-9dd0-d282cf268397";

                            if (isNextDay && allNextDayFree) return "FREE";

                            return opt.isFree ? "FREE" : `£${Number(opt.price).toFixed(2)}`;
                          })()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {/* Shipping Delivery Error Banner */}
          {deliveryMethod === "HomeDelivery" && shippingError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
              <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-700 font-medium">{shippingError}</p>
            </div>
          )}
          {/* Order notes */}
          <div className="bg-white p-3 rounded shadow">
            <label className="block text-xs font-medium mb-1">Order notes (optional)</label>
            <textarea disabled={isLocked} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes" rows={2} className="w-full border p-1.5 text-sm rounded" />
          </div>
        </div>
        {/* RIGHT: Summary + coupon */}
        <aside className="lg:col-span-1 mt-2 lg:mt-0">
          <div className="bg-white p-3 rounded shadow lg:sticky lg:top-6 flex flex-col">
            <h3 className="text-sm font-semibold mb-2">Order summary ({effectiveCartCount} items)</h3>
            <div className="space-y-2 mb-3 overflow-visible">
              {checkoutItems.map((it) => {
                const productSlug =
                  it.productData?.slug ||
                  it.slug ||
                  it.productSlug ||
                  "";

                return (
                  <Link
                    key={it.id + (it.variantId || "")}
                    href={`/product/${productSlug}`}
                    className="flex gap-2 items-start group"
                  >
                    <img
                      src={it.image}
                      alt={"no img"}
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                    />

                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#445D41] hover:text-black transition">
                        {it.name}
                      </div>

                      {it.type === "subscription" && (
                        <p className="text-xs font-semibold text-indigo-600 mt-1">
                          Subscription • Every{" "}
                          {it.frequency && !isNaN(Number(it.frequency))
                            ? `${it.frequency} `
                            : ""}
                          {it.frequencyPeriod} • {it.subscriptionTotalCycles} cycles
                        </p>
                      )}

                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span>Qty: {it.quantity}</span>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1 flex-wrap">

                          {/* FINAL PRICE */}
                          <span className="font-medium text-gray-800">
                            {formatCurrency((it.finalPrice ?? it.price) * it.quantity)}
                          </span>

                          {/* CUT PRICE */}
                          {(() => {

                            let comparePrice: number | null = null;

                            // SYSTEM DISCOUNT
                            if (
                              it.displayDiscountType === "System" &&
                              (it.discountAmount ?? 0) > 0
                            ) {
                              comparePrice =
                                (it.price + (it.discountAmount ?? 0)) *
                                it.quantity;
                            }

                            // OLD PRICE
                            else if (it.displayDiscountType === "OldPrice") {

                              const oldPrice =
                                it.oldPrice ??
                                it.productData?.oldPrice;

                              if (oldPrice && oldPrice > it.price) {
                                comparePrice = oldPrice * it.quantity;
                              }
                            }

                            if (!comparePrice) return null;

                            return (
                              <span className="text-[11px] text-gray-400 line-through">
                                {formatCurrency(comparePrice)}
                              </span>
                            );

                          })()}

                        </div>

                        {getItemLoyaltyPoints(it) > 0 && (
                          <div className="text-[10px] text-green-700 font-medium">
                            (Earn {getItemLoyaltyPoints(it)} loyalty points)
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="border-t pt-3">
              {totalLoyaltyPoints > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-2 text-green-700 font-medium">
                    <Gift size={16} className="text-green-600" />
                    Total Loyalty points
                  </span>
                  <span className="font-semibold text-green-800">
                    +{totalLoyaltyPoints} points
                  </span>
                </div>
              )}
              {/* ===== PRICE SUMMARY ===== */}
              <div className="mt-2 rounded-lg border bg-gray-50 p-2 space-y-1.5 text-sm">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Subtotal (Incl. VAT)</span>
                  <span className="font-medium">
                    {formatCurrency(correctSubtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 mt-2 text-sm text-gray-700">
                  <span>VAT</span>
                  <span>{formatCurrency(checkoutVatAmount)}</span>
                </div>
                {deliveryMethod === "ClickAndCollect" && selectedShippingOption && (
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-medium">
                      {selectedShippingOption.displayName}
                    </span>
                    <span className={`font-semibold ${shippingCost === 0 ? "text-green-600" : ""}`}>
                      {shippingCost === 0 ? "FREE" : `+ ${formatCurrency(shippingCost)}`}
                    </span>
                  </div>
                )}

                {/* Bundle Discount */}
                {cartBundleDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <span>Bundle discount</span>
                    <span className="font-medium">
                      - {formatCurrency(cartBundleDiscount)}
                    </span>
                  </div>
                )}
                {/* Coupon / Normal Discount */}
                {finalDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <span>Discount</span>
                    <span className="font-medium">
                      - {formatCurrency(finalDiscount)}
                    </span>
                  </div>
                )}

                {/* Shipping */}
                {deliveryMethod === "HomeDelivery" && selectedShippingOption && (
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-medium">{selectedShippingOption.displayName || selectedShippingOption.methodName}</span>
                    <span className={`font-semibold ${shippingCost === 0 ? "text-green-600" : ""}`}>
                      {(() => {
                        const isNextDay =
                          selectedShippingOption?.deliveryOptionId === "451bb725-19f7-441a-9dd0-d282cf268397";

                        if (isNextDay && allNextDayFree) return "FREE";

                        return shippingCost === 0
                          ? "FREE"
                          : `+ ${formatCurrency(shippingCost)}`;
                      })()}
                    </span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-700 text-xs">
                    <span>Loyalty Points Discount ({pointsToRedeem} pts)</span>
                    <span>- {formatCurrency(pointsDiscount)}</span>
                  </div>
                )}
                {totalCombinedDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-800 font-semibold border-t pt-2">
                    <span>Total Discount</span>
                    <span>− {formatCurrency(totalCombinedDiscount)}</span>
                  </div>
                )}
                {/* Divider + Total */}
                <div className="border-t pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(finalPayableAmount)}
                  </span>
                </div>
              </div>
              <LoyaltyRedemptionBox
                orderTotal={cartTotalAmount}
                onApply={(pts, discount) => {
                  setPointsToRedeem(pts);
                  setPointsDiscount(discount);
                }}
                onRemove={() => {
                  setPointsToRedeem(0);
                  setPointsDiscount(0);
                }}
              />
              {error && (
                <div className="mt-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="mt-2">
                <>
                  {/* Payment method selector */}
                  <div className="mb-2">
                    <label className="text-xs font-semibold block mb-1.5">
                      Payment
                    </label>
                  </div>

                  {/* STEP 1 */}
                  {!stripeClientSecret && (
                    <button
                      disabled={
                        isPlacing ||
                        (deliveryMethod === "HomeDelivery" && !!shippingError)
                      }
                      onClick={async () => {

                        // ✅ TERMS CHECK
                        if (!acceptTerms) {
                          setError("Please accept Terms & Conditions");
                          return;
                        }

                        if (isPlacing) return;

                        setIsPlacing(true);

                        const payload = await validateAndBuildPayload();

                        if (!payload) {
                          setIsPlacing(false);
                          return;
                        }

                        // ✅ FREE ORDER FLOW (NO STRIPE)
                        if (isFreeOrder) {
                          try {

                            const orderResp = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/Orders`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  ...(isAuthenticated && {
                                    Authorization: `Bearer ${accessToken}`,
                                  }),
                                },
                                body: JSON.stringify(payload),
                              }
                            );

                            if (!orderResp.ok) {
                              setError("Order creation failed");
                              setIsPlacing(false);
                              return;
                            }

                            const orderJson = await orderResp.json();

                            if (!orderJson?.data?.id) {
                              setError("Invalid order response");
                              setIsPlacing(false);
                              return;
                            }

                            // ✅ DIRECT SUCCESS
                            onPaymentSuccess({
                              data: orderJson.data,
                            });

                          } catch (err) {
                            setError("Failed to place free order");
                          } finally {
                            setIsPlacing(false);
                          }

                          return;
                        }

                        // ✅ NORMAL PAID ORDER FLOW
                        const orderResp = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/api/Orders`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...(isAuthenticated && {
                                Authorization: `Bearer ${accessToken}`,
                              }),
                            },
                            body: JSON.stringify(payload),
                          }
                        );

                        if (!orderResp.ok) {
                          setError("Order creation failed");
                          setIsPlacing(false);
                          return;
                        }

                        const orderJson = await orderResp.json();

                        if (!orderJson?.data?.id) {
                          setError("Invalid order response");
                          setIsPlacing(false);
                          return;
                        }

                        const orderId = orderJson.data.id;
                        const totalAmount = orderJson.data.totalAmount;

                        // ✅ STRIPE PAYMENT INTENT
                        const intentResp = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/api/Payment/create-intent`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              amount: totalAmount,
                              currency: "GBP",
                              customerEmail: billingEmail,
                              orderId,
                            }),
                          }
                        );

                        const intentJson = await intentResp.json();

                        if (!intentJson?.data?.clientSecret) {
                          setError("Payment initialization failed");
                          setIsPlacing(false);
                          return;
                        }

                        setStripeOrderId(orderId);
                        setStripeClientSecret(intentJson.data.clientSecret);
                        setIsLocked(true);
                        setIsPlacing(false);

                      }}
                      className={`w-full py-2 text-sm rounded transition flex items-center justify-center gap-2 ${isPlacing ||
                          (deliveryMethod === "HomeDelivery" && !!shippingError)
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-[#445D41] hover:bg-[#3a5037] text-white"
                        }`}
                    >
                      {isPlacing ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>

                          {isFreeOrder
                            ? "Placing order"
                            : "Preparing payment"}
                        </>
                      ) : (
                        isFreeOrder
                          ? "Place Order"
                          : "Continue to payment"
                      )}
                    </button>
                  )}

                  {/* STEP 2 */}
                  {stripeClientSecret && stripeOrderId && (
                    <StripeWrapper clientSecret={stripeClientSecret}>
                      <CheckoutPayment
                        clientSecret={stripeClientSecret}
                        orderId={stripeOrderId}
                        payAmount={finalPayableAmount}
                        orderPayload={{
                          billingFirstName,
                          billingLastName,
                          customerEmail: billingEmail,
                          billingAddressLine1: billingAddress1,
                        }}
                        onPaymentSuccess={onPaymentSuccess}
                        onError={onPaymentError}
                      />
                    </StripeWrapper>
                  )}



                </>
              </div>
              {/* Terms & Newsletter */}
              <div className="mt-2 space-y-1.5">
                <label className={`flex items-start gap-2 text-xs ${stripeClientSecret ? "text-gray-400 cursor-not-allowed" : "text-gray-700"
                  }`}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    disabled={!!stripeClientSecret} // 🔥 lock in step 2
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAcceptTerms(checked);

                      if (checked) {
                        setError(null);
                      }
                    }}
                  />
                  <span>I agree to the <Link href="/terms-and-conditions" className="text-blue-600 underline">Terms & Conditions</Link></span>
                </label>
                <label className="flex items-start gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={subscribeNewsletter} onChange={(e) => setSubscribeNewsletter(e.target.checked)} className="mt-0.5" />
                  <span>Subscribe to newsletter for offers & updates</span>
                </label>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}