"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { Pause, SkipForward, XCircle, Play, Pencil } from "lucide-react";
import Link from "next/link";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function SubscriptionsTab() {
  const { accessToken, user } = useAuth();
const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
  type: "cancel" | "pause" | "resume" | "skip" | null;
  id: string | null;
}>({ type: null, id: null });
const [cancelReason, setCancelReason] = useState("");
const [editData, setEditData] = useState<{
  id: string | null;
  quantity?: number;
  frequency?: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}>({ id: null });
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH SUBSCRIPTIONS
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/Subscriptions/customer/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch subscriptions");
      }

      setSubscriptions(data?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Error loading subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && accessToken) {
      fetchSubscriptions();
    }
  }, [user?.id, accessToken]);

  // 🔥 CANCEL
 const handleCancel = async (id: string) => {
  try {
    const res = await fetch(
      `${API}/api/Subscriptions/${id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancellationReason: cancelReason || "User cancelled from panel",
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Cancel failed");
    }

    toast.error(data?.message || "Subscription cancelled");
    setCancelReason(""); // reset
    fetchSubscriptions();
  } catch (err: any) {
    toast.error(err.message || "Error cancelling subscription");
  }
};
const handlePause = async (id: string) => {
  try {
    const res = await fetch(`${API}/api/Subscriptions/${id}/pause`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.message || "Pause failed");

    toast.error(data?.message || "Subscription paused");
    fetchSubscriptions();
  } catch (err: any) {
    toast.error(err.message || "Error pausing subscription");
  }
};

const handleResume = async (id: string) => {
  try {
    const res = await fetch(`${API}/api/Subscriptions/${id}/resume`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.message || "Resume failed");

    toast.success(data?.message || "Subscription resumed");
    fetchSubscriptions();
  } catch (err: any) {
    toast.error(err.message || "Error resuming subscription");
  }
};

const handleSkip = async (id: string) => {
  try {
    const res = await fetch(`${API}/api/Subscriptions/${id}/skip`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.message || "Skip failed");

    toast.warning(data?.message || "Next delivery skipped");
    fetchSubscriptions();
  } catch (err: any) {
    toast.error(err.message || "Error skipping delivery");
  }
};
const handleUpdateSubscription = async () => {
  if (!editData.id) return;

  try {
  const payload: any = {};

Object.entries(editData).forEach(([key, value]) => {
  if (key !== "id" && value !== undefined && value !== "") {
    payload[key] = value;
  }
});

    if (Object.keys(payload).length === 0) {
      toast.error("Nothing to update");
      return;
    }

    const res = await fetch(
      `${API}/api/Subscriptions/${editData.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Update failed");
    }

    toast.success("Subscription updated");
    setEditData({ id: null });
    fetchSubscriptions();
  } catch (err: any) {
    toast.error(err.message || "Error updating subscription");
  }
};
  // 🔥 LOADING
  if (loading) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <p className="text-sm text-gray-500">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-1">My Subscriptions</h2>
      <p className="text-sm text-gray-600 mb-6">
        Manage your recurring products and delivery schedules.
      </p>

      {/* EMPTY STATE */}
      {!subscriptions.length ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-gray-600 mb-3">
            You don’t have any active subscriptions yet.
          </p>

          <p className="text-xs text-gray-500 mb-6">
            Subscription products allow you to receive items automatically on a
            schedule you choose.
          </p>
          {/* <Button disabled className="bg-[#445D41]">
            Browse Subscription Products
          </Button> */}
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((item) => (
<div
  key={item.id}
  className="border rounded-xl p-3 sm:p-4 shadow-sm bg-white flex gap-3 sm:gap-4 w-full min-w-0"
>
<div className="flex flex-col items-center flex-shrink-0">
<Link href={`/product/${item.productSlug}`}>
  <img
    src={
      item.productImageUrl?.startsWith("http")
        ? item.productImageUrl
        : `${API}${item.productImageUrl}`
    }
    className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:scale-105 transition"
  />
</Link>

  <span className="mt-1 text-[10px] sm:text-xs text-gray-600 font-medium">
    Qty: {item.quantity}
  </span>

  {/* 🔥 MOBILE EDIT BUTTON */}
  {(item.status === "Active" || item.status === "Paused") && (
    <button
      onClick={() =>
        setEditData({
          id: item.id,
          quantity: item.quantity,
          frequency: item.frequency,
          shippingFirstName: item.shippingFirstName,
          shippingLastName: item.shippingLastName,
          shippingAddressLine1: item.shippingAddressLine1,
          shippingAddressLine2: item.shippingAddressLine2,
          shippingCity: item.shippingCity,
          shippingState: item.shippingState,
          shippingPostalCode: item.shippingPostalCode,
          shippingCountry: item.shippingCountry,
        })
      }
      className="mt-1 flex items-center gap-1 text-[9px] px-2 py-[2px] rounded-md bg-gray-100 text-gray-700 sm:hidden"
    >
        <Pencil size={10} />
      Edit
    </button>
  )}
</div>
  {/* DETAILS */}
  <div className="flex-1 min-w-0">
 <Link href={`/product/${item.productSlug}`}>
  <p className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 break-words hover:text-green-700 cursor-pointer transition">
    {item.productName}
  </p>
</Link>

    <p className="text-[11px] text-gray-500 truncate">
  {item.frequencyDisplay}
</p>

<p className="text-[11px] text-green-600">
  Next Delivery: {new Date(item.nextDeliveryDate).toLocaleDateString()}
</p>
{/* MOBILE ACTIONS */}
<div className="flex items-center gap-0.5 mt-2 sm:hidden whitespace-nowrap overflow-hidden">

  {item.status === "Active" && (
    <>
      <button
        onClick={() => setConfirmAction({ type: "pause", id: item.id })}
        className="flex items-center gap-1 text-[9px] px-2 py-[2px] rounded-md bg-yellow-100 text-yellow-700"
      >
        <Pause size={10} />
        Pause
      </button>

      <button
        onClick={() => setConfirmAction({ type: "skip", id: item.id })}
        className="flex items-center gap-1 text-[9px] px-2 py-[2px] rounded-md bg-blue-100 text-blue-700"
      >
        <SkipForward size={10} />
        Skip
      </button>

      <button
        onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
        className="flex items-center gap-0.5 text-[8px] px-1 py-[2px] rounded-md bg-red-100 text-red-600"
      >
        <XCircle size={12} />
        Cancel
      </button>
    </>
  )}

  {item.status === "Paused" && (
    <>
      <button
        onClick={() => setConfirmAction({ type: "resume", id: item.id })}
        className="flex items-center gap-1 text-[9px] px-2 py-[2px] rounded-md bg-green-100 text-green-700"
      >
        <Play size={10} />
        Resume
      </button>

      <button
        onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
        className="flex items-center gap-1 text-[9px] px-2 py-[2px] rounded-md bg-red-100 text-red-600"
      >
        <XCircle size={10} />
        Cancel
      </button>
    </>
  )}
  
</div>
    <p className="hidden sm:block text-[10px] text-gray-400 mt-1 line-clamp-1">
      {item.shippingFullAddress}
    </p>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex flex-col items-end gap-1 sm:gap-1 shrink-0">

    {/* STATUS */}
    <span
      className={`text-xs sm:text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${
        item.status === "Active"
          ? "bg-green-100 text-green-700"
          : item.status === "Paused"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {item.statusDisplay}
    </span>

    {/* PRICE */}
    <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
      £{(item.discountedPrice * item.quantity).toFixed(2)}
    </p>
{/* <p className="text-[10px] text-gray-500">
  {item.quantity} × £{item.discountedPrice.toFixed(2)}
</p> */}
    {/* ACTIONS */}
    <div className="hidden sm:flex flex-wrap justify-end gap-1 mt-1">

      {item.status === "Active" && (
        <>
          <button
            onClick={() => setConfirmAction({ type: "pause", id: item.id })}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition whitespace-nowrap"
          >
            <Pause size={12} />
            Pause
          </button>

          <button
            onClick={() => setConfirmAction({ type: "skip", id: item.id })}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition whitespace-nowrap"
          >
            <SkipForward size={12} />
            Skip
          </button>

          <button
            onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition whitespace-nowrap"
          >
            <XCircle size={12} />
            Cancel
          </button>
        </>
      )}

      {item.status === "Paused" && (
        <>
          <button
            onClick={() => setConfirmAction({ type: "resume", id: item.id })}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition whitespace-nowrap"
          >
            <Play size={12} />
            Resume
          </button>

          <button
            onClick={() => setConfirmAction({ type: "cancel", id: item.id })}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition whitespace-nowrap"
          >
            <XCircle size={12} />
            Cancel
          </button>
        </>
      )}
  {(item.status === "Active" || item.status === "Paused") && (
<button
  onClick={() =>
    setEditData({
      id: item.id,
      quantity: item.quantity,
      frequency: item.frequency,
      shippingFirstName: item.shippingFirstName,
      shippingLastName: item.shippingLastName,
      shippingAddressLine1: item.shippingAddressLine1,
      shippingAddressLine2: item.shippingAddressLine2,
      shippingCity: item.shippingCity,
      shippingState: item.shippingState,
      shippingPostalCode: item.shippingPostalCode,
      shippingCountry: item.shippingCountry,
    })
  }
  className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition whitespace-nowrap"
>
  <Pencil size={12} />
  Edit
</button>
)}
    </div>
  </div>
</div>
          ))}
        </div>
      )}
{confirmAction.type && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    
    <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">

      {/* ICON + TITLE */}
      <div className="flex items-start gap-3 mb-4">

        <div
          className={`p-2 rounded-full ${
            confirmAction.type === "cancel"
              ? "bg-red-100 text-red-600"
              : confirmAction.type === "pause"
              ? "bg-yellow-100 text-yellow-700"
              : confirmAction.type === "resume"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {confirmAction.type === "cancel" && <XCircle size={20} />}
          {confirmAction.type === "pause" && <Pause size={20} />}
          {confirmAction.type === "resume" && <Play size={20} />}
          {confirmAction.type === "skip" && <SkipForward size={20} />}
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            {confirmAction.type === "cancel" && "Cancel Subscription"}
            {confirmAction.type === "pause" && "Pause Subscription"}
            {confirmAction.type === "resume" && "Resume Subscription"}
            {confirmAction.type === "skip" && "Skip Delivery"}
          </h3>

          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {confirmAction.type === "cancel" &&
              "This will permanently cancel your subscription. You won’t receive future deliveries."}
{confirmAction.type === "cancel" && (
  <textarea
    placeholder="Reason (optional)"
    value={cancelReason}
    onChange={(e) => setCancelReason(e.target.value)}
    className="w-full mt-3 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
  />
)}
            {confirmAction.type === "pause" &&
              "Your subscription will be paused. You can resume anytime from your account."}

            {confirmAction.type === "resume" &&
              "Your subscription will continue as scheduled from the next delivery."}

            {confirmAction.type === "skip" &&
              "Your upcoming delivery will be skipped once. The next cycle will continue normally."}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2 mt-6">

        <button
        onClick={() => {
  setConfirmAction({ type: null, id: null });
  setCancelReason("");
}}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            const { type, id } = confirmAction;
            if (!id) return;

            if (type === "cancel") await handleCancel(id);
            if (type === "pause") await handlePause(id);
            if (type === "resume") await handleResume(id);
            if (type === "skip") await handleSkip(id);

           setConfirmAction({ type: null, id: null });
setCancelReason("");
          }}
          className={`px-4 py-2 text-sm rounded-lg text-white transition ${
            confirmAction.type === "cancel"
              ? "bg-red-600 hover:bg-red-700"
              : confirmAction.type === "pause"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : confirmAction.type === "resume"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Confirm
        </button>

      </div>
    </div>
  </div>
)}
{editData.id && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white w-[95%] max-w-md rounded-2xl shadow-xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">

      <h3 className="text-base sm:text-lg font-semibold mb-3">
        Update Subscription
      </h3>

      <div className="grid grid-cols-2 gap-2">

        {/* Quantity */}
        <div>
          <label className="text-[10px] font-medium">Qty</label>
          <input
            type="number"
            value={editData.quantity || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                quantity: Number(e.target.value),
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="text-[10px] font-medium">Frequency</label>
          <input
            type="text"
            value={editData.frequency || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                frequency: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* First Name */}
        <div>
          <label className="text-[10px] font-medium">First Name</label>
          <input
            type="text"
            value={editData.shippingFirstName || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingFirstName: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="text-[10px] font-medium">Last Name</label>
          <input
            type="text"
            value={editData.shippingLastName || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingLastName: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label className="text-[10px] font-medium">Address</label>
          <input
            type="text"
            value={editData.shippingAddressLine1 || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingAddressLine1: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* City */}
        <div>
          <label className="text-[10px] font-medium">City</label>
          <input
            type="text"
            value={editData.shippingCity || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingCity: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="text-[10px] font-medium">Postal</label>
          <input
            type="text"
            value={editData.shippingPostalCode || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingPostalCode: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

        {/* Country */}
        <div className="col-span-2">
          <label className="text-[10px] font-medium">Country</label>
          <input
            type="text"
            value={editData.shippingCountry || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                shippingCountry: e.target.value,
              }))
            }
            className="w-full border rounded-md px-2 py-1 text-xs"
          />
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setEditData({ id: null })}
          className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          onClick={handleUpdateSubscription}
          className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Update
        </button>
      </div>

    </div>
  </div>
)}
    </div>
    
  );
}