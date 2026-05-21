"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Info from "../ui/Info";
import { getOrderStatusBadge, getCollectionStatusTextColor, getOrderStatusLabel } from "./orderUtils";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast/CustomToast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, RefreshCcw, XCircle } from "lucide-react";
const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time is taking too long",
  "Product no longer needed",
  "Other",
];

const MIN_OTHER_REASON_LENGTH = 10;

/* =====================================================================
   STRIPE PAYMENT FORM  (shown inside the Pay Now modal)
===================================================================== */
function StripePaymentForm({
  clientSecret,
  amount,
  orderId,
  accessToken,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  orderId: string;
  accessToken: string | null;
  onSuccess: () => void;
}) {

  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) return;

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    // Tell backend to mark pending payment as cleared
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/confirm/${paymentIntent?.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );
    } catch {
      /* backend webhook will handle it if this fails */
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "16px",
                color: "#1a202c",
                "::placeholder": {
                  color: "#a0aec0",
                },
              },
              invalid: {
                color: "#e53e3e",
              },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-[#445D41] hover:bg-green-800 text-white font-semibold"
      >
        {loading ? "Processing…" : `Pay £${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

/* =====================================================================
   PAY NOW MODAL
===================================================================== */
function PayNowModal({
  order,
  accessToken,
  customerEmail,
  onClose,
  onPaid,
}: {
  order: any;
  accessToken: string | null;
  customerEmail: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1. Get Stripe publishable key
        const configRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/config`);
        const configJson = await configRes.json();
        const pk = configJson?.data?.publishableKey;
        if (!pk) throw new Error("Missing Stripe key");

        // 2. Create payment intent for the pending amount
        const intentRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              amount: order.pendingPaymentAmount,
              currency: "GBP",
              orderId: order.id,
              customerEmail: customerEmail,
              metadata: { type: "additional_payment" },
            }),
          }
        );

        const intentJson = await intentRes.json();
        if (!intentJson.success) throw new Error(intentJson.message ?? "Could not create payment");

        if (mounted) {
          setStripePromise(loadStripe(pk));
          setClientSecret(intentJson.data.clientSecret);
        }
      } catch (err: any) {
        if (mounted) setInitError(err.message ?? "Initialisation failed");
      }
    };

    init();
    return () => { mounted = false; };
  }, [order.id, order.pendingPaymentAmount, accessToken]);

  const handleSuccess = () => {
    setPaid(true);
    setTimeout(() => {
      onPaid();
      onClose();
    }, 2500);
  };
  const totalPaid =
    order.payments
      ?.filter((p: any) => p.status?.toLowerCase() === "successful")
      ?.reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Additional Payment</h3>
            <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Amount due */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5 flex justify-between items-center">
          <span className="text-sm text-orange-700 font-medium">Amount Due</span>
          <span className="text-xl font-bold text-orange-800">
            £{order.pendingPaymentAmount?.toFixed(2)}
          </span>
        </div>

        {paid ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-semibold text-green-700">Payment Successful!</p>
            <p className="text-sm text-gray-500 mt-1">Your order has been updated.</p>
          </div>
        ) : initError ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {initError}
          </p>
        ) : !stripePromise || !clientSecret ? (
          <p className="text-sm text-gray-500 text-center py-4">Preparing payment form…</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={order.pendingPaymentAmount}
              orderId={order.id}
              accessToken={accessToken}
              onSuccess={handleSuccess}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

/* =====================================================================
   MAIN ORDER CARD
===================================================================== */
export default function OrderCard({
  order,
  targetOrderId
}: {
  order: any;
  targetOrderId?: string | null;
}) {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(
    order.pendingPaymentAmount ?? null
  );
  useEffect(() => {
    setPendingAmount(order.pendingPaymentAmount ?? null);
  }, [order.pendingPaymentAmount]);


  // Order History
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    if (history.length > 0) { setShowHistory(true); return; }
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/history`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const json = await res.json();
      if (json.success) setHistory(json.data ?? []);
    } catch { /* ignore */ } finally {
      setHistoryLoading(false);
      setShowHistory(true);
    }
  };
  const [refundHistory, setRefundHistory] = useState<any | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [showRefundHistory, setShowRefundHistory] = useState(false);

  const loadRefundHistory = async () => {
    if (refundHistory) {
      setShowRefundHistory(true);
      return;
    }

    setRefundLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/refund-history`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const json = await res.json();

      if (json.success) {
        setRefundHistory(json.data);
      }
    } catch {
      toast.error("Unable to load refund history");
    }

    setRefundLoading(false);
    setShowRefundHistory(true);
  };

  useEffect(() => {
    if (
      targetOrderId &&
      order.orderNumber === targetOrderId
    ) {
      const el = document.getElementById(`order-${order.orderNumber}`);

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // 🔥 auto open payment modal
      if (order.pendingPaymentAmount > 0) {
        setShowPayModal(true);
      }
    }
  }, [targetOrderId, order]);
  /* =========================
     DOWNLOAD INVOICE
  ========================== */
  const handleDownloadInvoice = async () => {
    try {
      setInvoiceLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/invoice/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Invoice not available. Please contact support.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Unable to download invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };


  /* =========================
     CANCEL ORDER
  ========================== */
  const handleConfirmCancel = async () => {
    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (!finalReason) return;

    if (selectedReason === "Other" && finalReason.length < MIN_OTHER_REASON_LENGTH) {
      toast.error(`Please enter at least ${MIN_OTHER_REASON_LENGTH} characters`);
      return;
    }

    setCancelLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/request-cancellation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json", // 🔥 ADD THIS
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reason: finalReason,
            additionalNotes:
              selectedReason === "Other" ? customReason.trim() : "",
          }),
        }
      );

      let json: any = null;

      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok || (json && !json.success)) {
        throw new Error(json?.message || "Cancellation request failed");
      }

      toast.success(json.message || "Cancellation request submitted");

      setShowCancelModal(false);
      setSelectedReason("");
      setCustomReason("");

      // 🔥 IMPORTANT: update status locally
      order.status = "CancellationRequested";
      order.statusName = "Cancellation Requested";

    } catch (err: any) {
      toast.error(err.message || "Unable to request cancellation");
    } finally {
      setCancelLoading(false);
    }
  };
  const refundedAmount =
    order.payments?.[0]?.refundAmount ??
    order.payment?.refundAmount ??
    0;
  const handleReorder = async () => {
    try {
      toast.info("Preparing reorder...");

      const results = await Promise.all(
        order.items.map(async (item: any) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/Products/${item.productId}`
            );

            const json = await res.json();

            if (!json?.success || !json?.data) return null;

            const p = json.data;

            // ❌ inactive
            if (!p.isActive) return null;

            let stock = p.stockQuantity;

            // 🔥 VARIANT STOCK
            if (p.selectedVariantId && p.variants?.length) {
              const variant = p.variants.find(
                (v: any) => v.id === p.selectedVariantId
              );

              if (variant) {
                stock = variant.stockQuantity;
              }
            }

            // ❌ OUT OF STOCK
            if (!stock || stock <= 0) {
              return { skipped: true };
            }

            // ✅ ADJUST QTY
            const qty = Math.min(item.quantity, stock);

            return {
              id: p.id,
              productId: p.id,
              variantId: p.selectedVariantId || null,
              name: p.name,
              image:
                p.images?.find((img: any) => img.isMain)?.imageUrl ||
                p.images?.[0]?.imageUrl ||
                "",
              price: p.price,
              finalPrice: p.price,
              quantity: qty,
              productData: p,
            };
          } catch {
            return null;
          }
        })
      );

      const valid = results.filter((x: any) => x && !x.skipped);

      if (valid.length === 0) {
        toast.error("Items are out of stock");
        return;
      }

      sessionStorage.setItem("reorderItems", JSON.stringify(valid));

      toast.success("Redirecting to checkout...");

      router.push("/checkout?reorder=true");
    } catch {
      toast.error("Reorder failed");
    }
  };

  return (
    <div
      id={`order-${order.orderNumber}`}
      className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 ${order.orderNumber === targetOrderId
          ? "border-orange-500 ring-2 ring-orange-300 bg-orange-50"
          : ""
        }`}
    >
      {/* HEADER */}
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-semibold">Order Number: #{order.orderNumber}</p>
          <p className="text-xs text-gray-500">
            Ordered on: {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>

        <span
          className={`inline-flex items-center justify-center h-7 px-3 rounded-full text-xs font-medium capitalize border whitespace-nowrap ${getOrderStatusBadge(order.status)}`} >
          {getOrderStatusLabel(order.status, order.statusName)}
        </span>
      </div>

      {/* CANCELLATION REJECTED BANNER */}
      {order.cancellationRequestStatus === "Rejected" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-red-500 mt-0.5">✕</span>
          <div>
            <p className="font-semibold text-red-700">Cancellation Request Rejected</p>
            {order.cancellationRejectedReason ? (
              <p className="text-red-600 mt-0.5">Reason: {order.cancellationRejectedReason}</p>
            ) : (
              <p className="text-red-500 mt-0.5">Your cancellation request has been reviewed and rejected. Your order will proceed as normal.</p>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <div className="space-y-3">
        {order.items?.map((item: any) => (
          <Link
            key={item.id}
            href={`/product/${item.productSlug}`}
            className="flex items-center gap-4 border rounded-lg p-3 hover:bg-gray-50 transition"
          >
            <div className="w-16 h-16 flex-shrink-0 border rounded-md overflow-hidden bg-white">
              <img
                src={
                  item.productImageUrl?.startsWith("http")
                    ? item.productImageUrl
                    : `${process.env.NEXT_PUBLIC_API_URL}${item.productImageUrl}`
                }
                alt={item.productName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-[#445D41] line-clamp-2">{item.productName}</p>
              <p className="text-xs text-black mt-1">Qty: {item.quantity}</p>
            </div>
            <div className="text-right text-sm font-semibold">
              £{item.totalPrice.toFixed(2)}
            </div>
          </Link>
        ))}
      </div>

      {/* PENDING PAYMENT BANNER */}
      {pendingAmount !== null && pendingAmount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-orange-800 text-sm">
              Additional Payment Required
            </p>
            <p className="text-orange-700 text-sm mt-0.5">
              Your order was updated. Please pay the remaining{" "}
              <strong>£{pendingAmount.toFixed(2)}</strong> to proceed.
            </p>
          </div>
          <button
            onClick={() => setShowPayModal(true)}
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Pay Now →
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 pt-3 border-t text-sm">
        <Info label="Total Items" value={order.itemsCount} />
        <Info label="Payment Method" value={order.payment?.paymentMethod ?? "Cash on delivery"} />
        <Info label="Delivery Method" value={order.deliveryMethodName} />
        <Info
          label="Shipping Method"
          value={order.shippingMethodName ?? "—"}
        />
        {order.deliveryMethod === "ClickAndCollect" && (
          <Info
            label="Store"
            value={
              <button
                onClick={() => setShowStoreModal(true)}
                title="View store address"
                className="flex items-center gap-1 text-[#445D41] font-semibold hover:underline"
              >
                {order.collectionStoreName || "Selected Store"}

                <span className="text-xs text-gray-400 group-hover:text-[#445D41]">
                  ↗
                </span>
              </button>


            }
          />
        )}
        {order.deliveryMethod === "ClickAndCollect" && (
          <>
            <Info
              label="Collection Status"
              value={
                <span className={`capitalize ${getCollectionStatusTextColor(order.collectionStatus)}`}>
                  {order.collectionStatus ?? "—"}
                </span>
              }
            />
            <Info
              label="Collection Expiry"
              value={
                order.collectionExpiryDate
                  ? new Date(order.collectionExpiryDate).toLocaleDateString()
                  : "—"
              }
            />
          </>
        )}

        <Info
          label="Total amount paid"
          value={
            <button
              onClick={() => setShowPriceModal(true)}
              title="View price breakdown"
              className="text-[#445D41] font-semibold hover:underline"
            >
              £{order.totalPaidAmount?.toFixed(2) ?? "0.00"}
            </button>
          }
        />
        <Info
          label="Payment Status"
          value={
            <span
              className={`font-medium ${order.paymentStatus?.toLowerCase() === "successful"
                  ? "text-green-600"
                  : order.paymentStatus?.toLowerCase() === "pending" ||
                    order.paymentStatus?.toLowerCase() === "partiallypaid"
                    ? "text-orange-500"
                    : order.paymentStatus?.toLowerCase() === "failed"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
            >
              {order.paymentStatus ?? "—"}
            </span>
          }
        />
        {refundedAmount > 0 && (
          <Info
            label="Refunded Amount"
            value={<span className="text-green-600 font-medium">£{refundedAmount.toFixed(2)}</span>}
          />
        )}
        <Info
          label="Transaction ID"
          value={
            <span className="break-all">
              {order.payment?.transactionId ?? "—"}
            </span>
          }
        />
      </div>
      {refundedAmount > 0 && (
        <div className="pt-2 border-t">
          <button
            onClick={() =>
              showRefundHistory ? setShowRefundHistory(false) : loadRefundHistory()
            }
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <span>{showRefundHistory ? "▲" : "▼"}</span>
            <span>View refund history</span>
            {refundLoading && <span className="ml-1 text-gray-400">Loading…</span>}
          </button>

          {showRefundHistory && refundHistory && (
            <div className="mt-3 bg-green-50 border rounded-lg p-3 text-xs space-y-2">
              <p>
                Total Refunded:{" "}
                <span className="font-semibold">
                  £{refundHistory.totalRefunded.toFixed(2)}
                </span>
              </p>

              <p>
                Remaining Balance:{" "}
                <span className="font-semibold">
                  £{refundHistory.remainingBalance.toFixed(2)}
                </span>
              </p>

              {refundHistory.refunds?.map((r: any) => (
                <div key={r.refundId} className="border-t pt-2">
                  <p>Amount: £{r.amount.toFixed(2)}</p>
                  <p>Reason: {r.reason}</p>

                  <p>{new Date(r.processedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ORDER HISTORY */}
      <div className="pt-2 border-t">
        <button
          onClick={() => showHistory ? setShowHistory(false) : loadHistory()}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
        >
          <span>{showHistory ? "▲" : "▼"}</span>
          <span>View order changes</span>
          {historyLoading && <span className="ml-1 text-gray-400">Loading…</span>}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-3">

            {(() => {
              const filteredHistory = history.filter(
                (h: any) => h.changeType === "OrderEdited"
              );

              if (filteredHistory.length === 0) {
                return (
                  <p className="text-xs text-gray-400">
                    No changes recorded for this order.
                  </p>
                );
              }

              return filteredHistory.map((h: any) => {
                const ops: any[] = h.changeDetails?.Operations ?? [];
                const priceDiff =
                  h.newTotalAmount != null && h.oldTotalAmount != null
                    ? h.newTotalAmount - h.oldTotalAmount
                    : null;

                return (
                  <div key={h.id} className="bg-gray-50 border rounded-lg p-3 text-xs">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-700">
                          Order Updated
                        </span>
                        <span className="text-gray-400 ml-2">
                          {new Date(h.changeDate).toLocaleString()}
                        </span>
                      </div>

                      {priceDiff != null && (
                        <span
                          className={`font-semibold ${priceDiff > 0 ? "text-orange-600" : "text-green-600"
                            }`}
                        >
                          {priceDiff > 0 ? "+" : ""}£{priceDiff.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Item changes table */}
                    {ops.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-gray-400 border-b">
                            <th className="pb-1 font-medium">Product</th>
                            <th className="pb-1 font-medium text-center">Change</th>
                            <th className="pb-1 font-medium text-right">Old</th>
                            <th className="pb-1 font-medium text-right">New</th>
                          </tr>
                        </thead>

                        <tbody>
                          {ops.map((op: any, i: number) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-1 text-gray-700 pr-2">
                                {op.ProductName}
                              </td>

                              <td className="py-1 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${op.ChangeType === "Added"
                                      ? "bg-green-100 text-green-700"
                                      : op.ChangeType === "Removed"
                                        ? "bg-red-100 text-red-700"
                                        : op.ChangeType === "PriceAdjusted"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                  {op.ChangeType}
                                </span>
                              </td>

                              <td className="py-1 text-right text-gray-400">
                                Qty: {op.OldQuantity ?? 0} <br />
                                £{(op.OldTotalPrice ?? 0).toFixed(2)}
                              </td>

                              <td className="py-1 text-right text-gray-700 font-medium">
                                Qty: {op.NewQuantity ?? 0} <br />
                                £{(op.NewTotalPrice ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No item-level changes available.
                      </p>
                    )}

                    {/* Total summary */}
                    {h.oldTotalAmount != null && h.newTotalAmount != null && (
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-gray-500">
                          Old total:{" "}
                          <strong>£{h.oldTotalAmount.toFixed(2)}</strong>
                        </span>
                        <span className="text-gray-800 font-semibold">
                          New total: £{h.newTotalAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap justify-end items-center gap-2 pt-3 border-t">


        <Button
          onClick={handleDownloadInvoice}
          size="sm"
          variant="outline"
          disabled={invoiceLoading}
          className="text-white bg-[#445D41] hover:bg-black hover:text-white gap-1"
        >
          <Download className="h-4 w-4" />

          {invoiceLoading
            ? "Generating Invoice..."
            : "Download Invoice"}
        </Button>

        {["pending", "processing"].includes(order.status?.toLowerCase()) &&
          order.status !== "CancellationRequested" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowCancelModal(true)}
              className="gap-1"
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          )}

        {order.status?.toLowerCase() !== "processing" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReorder}
            className="text-white bg-black hover:bg-[#445D41] hover:text-white gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            Reorder
          </Button>
        )}
      </div>

      {/* PAY NOW MODAL */}
      {showPayModal && (
        <PayNowModal
          order={order}
          accessToken={accessToken}
          customerEmail={user?.email ?? ""}
          onClose={() => setShowPayModal(false)}
          onPaid={() => setPendingAmount(null)}
        />
      )}

      {/* CANCEL MODAL */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent
          className="max-w-md p-0 overflow-hidden border-none shadow-2xl 
  [&>button]:text-white 
  [&>button]:text-2xl 
  [&>button]:right-4 
  [&>button]:top-3 
  [&>button]:bg-white/20 
  [&>button]:rounded-full 
  [&>button]:p-1.5 
  [&>button]:focus:outline-none 
  [&>button]:focus:ring-0 
  [&>button]:focus-visible:ring-0"
        >

          {/* 🔥 HEADER */}
          <DialogHeader className="bg-[#445D41] text-white px-5 py-2 space-y-0">
            <DialogTitle className="text-lg font-semibold">
              Cancel Order
            </DialogTitle>
            <p className="text-xs text-white/80">
              Order number #{order.orderNumber}
            </p>
          </DialogHeader>

          {/* BODY */}
          <div className="pt-2 pb-5 px-5 space-y-3 text-sm">

            <p className="text-gray-600">
              Please select a reason for cancellation.
            </p>

            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 text-sm cursor-pointer border rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    checked={selectedReason === reason}
                    onChange={() => {
                      setSelectedReason(reason);
                      if (reason !== "Other") setCustomReason("");
                    }}
                  />
                  {reason}
                </label>
              ))}
            </div>

            {selectedReason === "Other" && (
              <>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={`Please specify your reason (min ${MIN_OTHER_REASON_LENGTH} characters)`}
                  rows={3}
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#445D41]"
                />
                <p className="text-xs text-gray-500">
                  {customReason.trim().length}/{MIN_OTHER_REASON_LENGTH} characters required
                </p>
              </>
            )}

          </div>

          {/* FOOTER */}
          <div className="border-t px-5 py-3 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(false)}
            >
              Back
            </Button>

            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={
                cancelLoading ||
                !selectedReason ||
                (selectedReason === "Other" &&
                  customReason.trim().length < MIN_OTHER_REASON_LENGTH)
              }
              onClick={handleConfirmCancel}
            >
              {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
      <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md p-0 overflow-hidden border-none shadow-2xl 
  [&>button]:text-white 
  [&>button]:text-2xl 
  [&>button]:right-4 
  [&>button]:top-3 
  [&>button]:bg-white/20 
  [&>button]:rounded-full 
  [&>button]:p-1.5"
        >

          {/* HEADER (with DialogTitle FIX) */}
          <DialogHeader className="bg-[#445D41] text-white px-5 py-3 space-y-0">
            <DialogTitle className="text-lg font-semibold">
              Collection Store
            </DialogTitle>
            <p className="text-xs text-white/80">
              Pickup location details
            </p>
          </DialogHeader>

          {/* BODY */}
          <div className="pt-1 pb-5 px-5 space-y-3 text-sm">

            <div>
              <p className="text-xs text-gray-500">Store Name</p>
              <p className="font-semibold text-[#445D41]">
                {order.collectionStoreName}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-gray-700 leading-relaxed">
                {[
                  order.collectionStoreAddressLine1,
                  order.collectionStoreAddressLine2,
                  order.collectionStoreCity,
                  order.collectionStorePostalCode,
                  order.collectionStoreCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {(order.collectionStorePhone || order.collectionStoreEmail) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Contact</p>
                <div className="space-y-1 text-gray-700">
                  {order.collectionStorePhone && (
                    <p>📞 {order.collectionStorePhone}</p>
                  )}
                  {order.collectionStoreEmail && (
                    <p className="break-all">✉️ {order.collectionStoreEmail}</p>
                  )}
                </div>
              </div>
            )}

            {order.collectionStoreOpeningHours && (
              <div>
                <p className="text-xs text-gray-500">Opening Hours</p>
                <p className="text-gray-700">
                  🕒 {order.collectionStoreOpeningHours}
                </p>
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-md p-0 overflow-hidden border-none shadow-2xl 
  [&>button]:text-white 
  [&>button]:text-2xl 
  [&>button]:right-4 
  [&>button]:top-3 
  [&>button]:bg-white/20 
  [&>button]:rounded-full 
  [&>button]:p-1.5"
        >

          {/* HEADER (with DialogTitle FIX) */}
          <DialogHeader className="bg-[#445D41] text-white px-5 py-3 space-y-0">
            <DialogTitle className="text-lg font-semibold">
              Price Breakdown
            </DialogTitle>
            <p className="text-xs text-white/80">
              Order #{order.orderNumber}
            </p>
          </DialogHeader>

          {/* BODY */}
          <div className="pt-1 pb-5 px-5 space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal (Incl. vat)</span>
              <span>£{order.subtotalAmount?.toFixed(2) ?? "0.00"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">VAT</span>
              <span>£{order.taxAmount?.toFixed(2) ?? "0.00"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>£{order.shippingAmount?.toFixed(2) ?? "0.00"}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-£{order.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-semibold text-base">
              <span>Total amount paid:</span>
              <span> £{order.totalPaidAmount?.toFixed(2) ?? "0.00"}</span>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
