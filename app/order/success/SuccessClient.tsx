"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/services/orders";
import { ArrowRight, MapPin, Package, PackageCheck, PackageIcon, ShoppingBag, Store } from "lucide-react";
import { trackAdsPurchase, trackPurchase } from "@/lib/analytics";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

function formatCurrency(n = 0) {
  return `£${n.toFixed(2)}`;
}

/* === Stripe wrapper component === */
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
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payment/config`);
        const json = await res.json();
        const pk = json?.data?.publishableKey;

        if (mounted) setStripePromise(loadStripe(pk));
      } catch (err) {
        console.error("Stripe config load failed", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!stripePromise) return <div>Loading Stripe...</div>;

  const options = clientSecret
    ? { clientSecret, locale: "en-GB" as const }
    : undefined;

  return (
    <Elements stripe={stripePromise} options={options as any}>
      {children}
    </Elements>
  );
}

/* === CARD PAYMENT COMPONENT === */
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
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements || !paymentElementReady) return;

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

  const isButtonDisabled = !stripe || !elements || !paymentElementReady || processing;

  return (
    <div className="space-y-2.5">
      <PaymentElement onReady={() => setPaymentElementReady(true)} options={{ layout: "tabs" }} />
      <button
        onClick={handlePay}
        disabled={isButtonDisabled}
        className={`w-full py-2 rounded flex items-center justify-center gap-2 transition ${isButtonDisabled
          ? "bg-gray-400 cursor-not-allowed opacity-75 text-white"
          : "bg-[#f38918] hover:bg-black text-white font-semibold text-sm"
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
        ) : !paymentElementReady ? (
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
            Loading payment options...
          </>
        ) : (
          `Pay ${formatCurrency(payAmount)}`
        )}
      </button>
    </div>
  );
}
function getStatusColor(status?: string) {
  if (!status) return "text-gray-600";

  const value = status.toLowerCase();

  if (value.includes("successful") || value.includes("confirmed") || value.includes("paid") || value.includes("completed")) {
    return "text-green-600 font-semibold";
  }

  if (value.includes("pending") || value.includes("processing")) {
    return "text-orange-600 font-semibold";
  }

  if (value.includes("failed") || value.includes("cancelled") || value.includes("error")) {
    return "text-red-600 font-semibold";
  }

  return "text-gray-700 font-medium";
}
function getPharmacyStatusColor(status?: string) {
  if (!status) return "text-gray-600";

  const value = status.toLowerCase();

  if (value.includes("approved") || value.includes("verified")) {
    return "text-green-600 font-semibold";
  }

  if (value.includes("pending")) {
    return "text-orange-600 font-semibold";
  }

  if (value.includes("rejected") || value.includes("failed")) {
    return "text-red-600 font-semibold";
  }

  return "text-gray-700 font-medium";
}
export function resolveImageUrl(url?: string | null) {
  if (!url || url === "string") {
    return "/placeholder-product.png";
  }

  // absolute already
  if (url.startsWith("http")) {
    return url;
  }

  // relative path from backend
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const purchaseTrackedRef = useRef<string | null>(null);

  const { accessToken, isAuthenticated } = useAuth();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const latestPayment = order?.payments?.length
    ? [...order.payments].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const isOnlinePayment = order?.paymentMethod?.toLowerCase() === "stripe" || 
                          order?.payments?.some((p: any) => p.paymentMethod?.toLowerCase() === "stripe");

  const isPaymentPending = order?.status === "Pending" && 
                           order?.totalAmount > 0 && 
                           isOnlinePayment && 
                           (latestPayment?.status === "Pending" || latestPayment?.status === "Failed" || order?.paymentStatus === "Pending");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Orders/${orderId}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(isAuthenticated && {
                Authorization: `Bearer ${accessToken}`,
              }),
            },
          }
        );

        const raw = await resp.text();
        if (!raw) return;

        const json = JSON.parse(raw);
        if (json?.success) setOrder(json.data);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, isAuthenticated, accessToken]);

  useEffect(() => {
    if (isPaymentPending && orderId && order) {
      setPaymentLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payment/create-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          currency: order.currency || "GBP",
          customerEmail: order.customerEmail,
          orderId: orderId,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.clientSecret) {
            setClientSecret(json.data.clientSecret);
          }
        })
        .catch((err) => console.error("Error creating payment intent:", err))
        .finally(() => setPaymentLoading(false));
    }
  }, [isPaymentPending, orderId, order]);

  useEffect(() => {
    if (order) {
      const isPaid = order.status !== "Pending" || order.payments?.some((p: any) => p.status === "Successful" || p.status === "Completed");
      if (isPaid && typeof window !== "undefined") {
        sessionStorage.removeItem("pending_order_id");
      }
    }
  }, [order]);

  useEffect(() => {
    if (!order) return;

    const transactionId = String(order.orderNumber ?? order.transactionId ?? order.id ?? orderId ?? "");
    if (!transactionId || purchaseTrackedRef.current === transactionId) return;

    purchaseTrackedRef.current = transactionId;
    trackPurchase(order);
    trackAdsPurchase(order);
  }, [order, orderId]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-gray-50/30 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm text-center">
          <div className="w-12 h-12 border-4 border-[#f38918] border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Loading your order…</h2>
          <p className="text-xs text-gray-500">Please wait while we retrieve your order details.</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-gray-50/30 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Order Not Found</h2>
          <p className="text-xs text-gray-500 mb-6">We couldn't retrieve the details for this order. Please verify your order ID or check your email confirmation.</p>
          <Link href="/" className="px-5 py-2 bg-[#f38918] hover:bg-black text-white rounded-lg text-xs font-semibold transition duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const payment = order.payments?.[0] ?? null;
  const loyaltyPointsEarned = order.loyaltyPointsEarned ?? 0;
  const loyaltyDiscount = order.loyaltyDiscountAmount ?? 0;

  return (
    <div className="max-w-7xl  mx-auto px-4 md:px-6 py-2">

      <div className="bg-white rounded shadow-md p-6">

        {/* SUCCESS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* LEFT: Order confirmed or Payment Pending */}
          <div className="flex items-start gap-4">
            {isPaymentPending ? (
              <div className="h-12 w-12 rounded bg-amber-50 flex items-center justify-center text-amber-600 text-2xl font-bold">
                ⚠️
              </div>
            ) : (
              <div className="h-12 w-12 rounded bg-orange-50 flex items-center justify-center text-green-700 font-bold">
                ✓
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-black">
                {isPaymentPending ? "Payment Pending" : "Order confirmed"}
              </h1>
              <p className="text-sm text-[#f38918]">
                {isPaymentPending ? (
                  "Please complete your payment below to process the order."
                ) : (
                  <>
                    Confirmation sent to <strong>{order.customerEmail}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          {loyaltyPointsEarned > 0 && (
            <div
              className="flex items-start sm:items-center gap-2 rounded px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm bg-gradient-to-br from-orange-600 to-[#f38918] text-white"
            >
              <span className="text-xl leading-none">🎁</span>
              <span className="tracking-tight">
                You have earned{" "}
                <span className="font-bold">
                  {loyaltyPointsEarned.toLocaleString()}
                </span>{" "}
                loyalty points on this order
              </span>
            </div>
          )}
        </div>

        {/* PENDING PAYMENT FORM (HORIZONTAL TOP BANNER) */}
        {isPaymentPending && (
          <div className="border border-amber-200 bg-amber-50/20 rounded p-4 shadow-sm mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Left side: Information */}
              <div className="md:col-span-2 space-y-2 md:pr-4">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-base">
                  <span className="text-xl">💳</span>
                  <span>Complete Your Payment</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your order is currently pending. Please complete the payment of{" "}
                  <strong className="text-black font-semibold text-sm">
                    {formatCurrency(order.totalAmount)}
                  </strong>{" "}
                  to finalize and process your order.
                </p>
                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded">
                  Orders are processed and dispatched immediately after verification.
                </div>
              </div>

              {/* Right side: Payment form */}
              <div className="md:col-span-3 bg-white border rounded p-3 shadow-sm">
                {paymentLoading && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[#f38918] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {!paymentLoading && clientSecret && (
                  <StripeWrapper clientSecret={clientSecret}>
                    <CheckoutPayment
                      clientSecret={clientSecret}
                      orderId={orderId}
                      payAmount={order.totalAmount}
                      orderPayload={{
                        billingFirstName: order.billingAddress?.firstName || "",
                        billingLastName: order.billingAddress?.lastName || "",
                        customerEmail: order.customerEmail,
                        billingAddressLine1: order.billingAddress?.addressLine1 || "",
                      }}
                      onPaymentSuccess={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.removeItem("pending_order_id");
                        }
                        window.location.reload();
                      }}
                      onError={(err: any) => {
                        alert(err?.message ?? "Payment failed");
                      }}
                    />
                  </StripeWrapper>
                )}
              </div>
            </div>
          </div>
        )}
        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* ORDER INFO */}
            <section>
              <h2 className="text-sm font-semibold uppercase mb-2">
                Order information
              </h2>
              <div className="border rounded p-4 space-y-1.5">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Status:</span>
                  <span className={getStatusColor(order.status)}>
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Ordered On:</span>
                  <span>{formatDate(order.orderDate)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Method:</span>
                  <span className="font-medium">
                    {order.deliveryMethod}
                  </span>
                </div>
                {order.pharmacyVerificationStatus && (
                  <div className="flex justify-between">
                    <span>Pharmacy Verification:</span>
                    <span
                      className={getPharmacyStatusColor(
                        order.pharmacyVerificationStatus
                      )}
                    >
                      {order.pharmacyVerificationStatus}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* DELIVERY */}
            <section>
              <h2 className="text-sm font-semibold uppercase mb-2">
                Delivery & Billing
              </h2>

              <div className="border rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                {order.deliveryMethod === "HomeDelivery" && order.shippingAddress && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 mt-1 text-gray-500" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1 text-lg">Shipping Address</p>
                      <p className="font-medium">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </p>
                      {order.shippingAddress.company && (
                        <p>{order.shippingAddress.company}</p>
                      )}
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
                      </p>
                      <p>
                        {order.shippingAddress.postalCode},{" "}
                        {order.shippingAddress.country}
                      </p>
                      {order.shippingAddress.phoneNumber && (
                        <p className="mt-1 text-gray-700">
                          📞 {order.shippingAddress.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {order.deliveryMethod === "ClickAndCollect" && (
                  <>
                    {/* STORE CARD */}
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 mt-1 text-gray-500" />
                      <div className="text-sm">
                        <p className="font-semibold  text-lg mb-1">Store Location</p>
                        <p className="font-medium">
                          {order.collectionStoreName || "Selected Store"}
                        </p>

                        {(order.collectionStoreAddressLine1 || order.collectionStoreAddressLine2) && (
                          <p className="text-gray-600 mt-1">
                            {[order.collectionStoreAddressLine1, order.collectionStoreAddressLine2]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}

                        {(order.collectionStoreCity ||
                          order.collectionStorePostalCode ||
                          order.collectionStoreCountry) && (
                            <p className="text-gray-600">
                              {[
                                order.collectionStoreCity,
                                order.collectionStorePostalCode,
                                order.collectionStoreCountry,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}

                        {/* CONTACT */}
                        {order.collectionStorePhone && (
                          <p className="mt-1 text-gray-700 text-sm">
                            📞 {order.collectionStorePhone}
                          </p>
                        )}

                        {order.collectionStoreEmail && (
                          <p className="text-gray-700 text-sm break-all">
                            ✉️ {order.collectionStoreEmail}
                          </p>
                        )}

                        {/* HOURS */}
                        {order.collectionStoreOpeningHours && (
                          <p className="text-xs text-gray-500 mt-1">
                            🕒 {order.collectionStoreOpeningHours}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* COLLECTION INFO CARD */}
                    <div className="text-sm space-y-2">
                      <p className="font-semibold mb-1 text-lg">Collection Details</p>
                      {order.collectionStatus && (
                        <div className="flex justify-between">
                          <span>Collection Status</span>
                          <span className={getStatusColor(order.collectionStatus)}>
                            {order.collectionStatus}
                          </span>
                        </div>
                      )}

                      {order.collectionExpiryDate && (
                        <div className="flex justify-between">
                          <span>Collect Before</span>
                          <span>
                            {new Date(order.collectionExpiryDate).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {order.readyForCollectionAt && (
                        <div className="flex justify-between">
                          <span>Ready At</span>
                          <span>
                            {new Date(order.readyForCollectionAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {order.collectedAt && (
                        <div className="flex justify-between">
                          <span>Collected At</span>
                          <span>
                            {new Date(order.collectedAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Click & Collect Fee</span>
                        <span>{formatCurrency(order.clickAndCollectFee)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* BILLING */}
                {order.billingAddress && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 mt-1 text-gray-500" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1 text-lg">Billing Address</p>

                      <p className="font-medium">
                        {order.billingAddress.firstName}{" "}
                        {order.billingAddress.lastName}
                      </p>

                      {order.billingAddress.company && (
                        <p>{order.billingAddress.company}</p>
                      )}

                      <p>{order.billingAddress.addressLine1}</p>

                      {order.billingAddress.addressLine2 && (
                        <p>{order.billingAddress.addressLine2}</p>
                      )}

                      <p>
                        {order.billingAddress.city},{" "}
                        {order.billingAddress.state}
                      </p>

                      <p>
                        {order.billingAddress.postalCode},{" "}
                        {order.billingAddress.country}
                      </p>
                      {order.billingAddress.phoneNumber && (
                        <p className="mt-1 text-gray-700">
                          📞 {order.billingAddress.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </section>

            {/* ITEMS */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#f38918]" />
                <h2 className="text-sm font-semibold uppercase">
                  Items
                </h2>
              </div>

              <div className="border rounded divide-y">
                {order.orderItems.map((item: any) => (

                  <div
                    key={item.id}
                    className="flex gap-4 p-4 items-start"
                  >
                    <Link href={`/product/${item.productSlug}`}>
                      <img
                        src={resolveImageUrl(item.productImageUrl)}
                        alt={item.productName}
                        className="w-20 h-20 object-contain border rounded bg-white"
                      />

                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="font-medium hover:text-[#f38918] line-clamp-2"
                      >
                        {item.productName}
                      </Link>

                      {item.variantName && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.variantName}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 gap-4">

                        {/* LEFT */}
                        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">

                          <span>Qty {item.quantity}</span>

                          {(item.productSavingAmount > 0 ||
                            item.discountAmount > 0) && (
                              <>
                                <span className="text-gray-300">•</span>

                                <span className="text-red-500 font-medium">
                                  You saved{" "}
                                  {formatCurrency(
                                    item.productSavingAmount ||
                                    item.discountAmount
                                  )}
                                </span>
                              </>
                            )}
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-2 shrink-0">

                          {/* FINAL PRICE */}
                          <span className="text-base font-semibold text-black">
                            {formatCurrency(
                              (
                                item.discountAmount > 0
                                  ? item.unitPrice - item.discountAmount
                                  : item.unitPrice
                              ) * item.quantity
                            )}
                          </span>

                          {/* CUT PRICE */}
                          {(item.oldUnitPrice ||
                            item.discountAmount > 0) && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(
                                  (
                                    item.oldUnitPrice ||
                                    item.unitPrice
                                  ) * item.quantity
                                )}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">



              {/* PAYMENT */}
              <section>
                <h2 className="text-sm font-semibold uppercase mb-2">
                  Payment Details
                </h2>
                <div className="border rounded p-4 space-y-2">
                  {!payment && (
                    <>
                      <div className="flex justify-between">
                        <span>Payment method:</span>

                        <span>
                          {order.totalAmount <= 0
                            ? "No Payment Needed"
                            : "Cash on Delivery"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-black">
                          Payment Status:
                        </span>

                        <span
                          className={
                            order.totalAmount <= 0
                              ? "text-green-600 font-semibold"
                              : getStatusColor("pending")
                          }
                        >
                          {order.totalAmount <= 0
                            ? "Completed"
                            : "Pay on delivery"}
                        </span>
                      </div>
                    </>
                  )}

                  {payment && (
                    <>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span>{payment.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className={getStatusColor(payment.status)}>
                          {payment.status}
                        </span>
                      </div>

                    </>
                  )}
                </div>
              </section>

              {/* TOTALS */}
              <section>
                <h2 className="text-sm font-semibold uppercase mb-2">
                  Summary
                </h2>
                <div className="border rounded p-4 space-y-2 bg-gray-50">
                  <div className="flex justify-between">
                    <span>Subtotal (Incl. VAT)</span>

                    <span>
                      {formatCurrency(
                        order.subtotalAmount +
                        (order.productSavingsAmount ?? 0)
                      )}
                    </span>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>VAT</span>
                      <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                  )}

                  {order.deliveryMethod === "ClickAndCollect" ? (
                    <div className="flex justify-between">
                      <span>Click & Collect</span>
                      <span>{formatCurrency(order.clickAndCollectFee)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>{order.shippingMethodName}</span>
                      <span>{formatCurrency(order.shippingAmount)}</span>
                    </div>
                  )}
                  {order.productSavingsAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Item Savings</span>
                      <span>
                        -{formatCurrency(order.productSavingsAmount)}
                      </span>
                    </div>
                  )}

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>
                        -{formatCurrency(order.discountAmount)}
                      </span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-green-700 text-xs">
                      <span>Loyalty points Discount</span>
                      <span>-{formatCurrency(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </section>


              <div className="space-y-3">
                {/* Go to Orders (only if logged in) */}
                {isAuthenticated && (
                  <Link
                    href="/account?tab=orders"
                    className="flex items-center justify-center gap-2 bg-[#f38918] text-white py-3 rounded font-semibold hover:opacity-90 transition"
                  >
                    <PackageIcon className="w-5 h-5" />
                    Go to My Orders
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {/* Continue Shopping (always show) */}
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 border border-[#f38918] text-[#f38918] py-3 rounded font-semibold hover:bg-gray-900 hover:text-white transition"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Continue Shopping
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
