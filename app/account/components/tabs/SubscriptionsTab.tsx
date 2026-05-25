"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { Pause, SkipForward, XCircle, Play, Pencil, Repeat, Edit2 } from "lucide-react";
import Link from "next/link";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function SubscriptionsTab() {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: "cancel" | "pause" | "resume" | "skip" | null; id: string | null; }>({ type: null, id: null });
  const [cancelReason, setCancelReason] = useState("");
  const [editData, setEditData] = useState<{ id: string | null; quantity?: number; frequency?: string; shippingFirstName?: string; shippingLastName?: string; shippingAddressLine1?: string; shippingAddressLine2?: string; shippingCity?: string; shippingState?: string; shippingPostalCode?: string; shippingCountry?: string; }>({ id: null });
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/Subscriptions/customer/${user?.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch subscriptions");
      setSubscriptions(data?.data || []);
    } catch (err: any) { toast.error(err.message || "Error loading subscriptions"); } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id && accessToken) fetchSubscriptions(); }, [user?.id, accessToken]);

  const handleAction = async (type: string, id: string, body?: any) => {
    try {
      const res = await fetch(`${API}/api/Subscriptions/${id}/${type}`, {
        method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `${type} failed`);
      toast.success(data?.message || `Subscription ${type}d`);
      fetchSubscriptions();
    } catch (err: any) { toast.error(err.message || `Error during ${type}`); }
  };

  const handleUpdateSubscription = async () => {
    if (!editData.id) return;
    try {
      const payload: any = {};
      Object.entries(editData).forEach(([key, value]) => { if (key !== "id" && value !== undefined && value !== "") payload[key] = value; });
      if (Object.keys(payload).length === 0) return toast.error("Nothing to update");

      const res = await fetch(`${API}/api/Subscriptions/${editData.id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");

      toast.success("Subscription updated");
      setEditData({ id: null }); fetchSubscriptions();
    } catch (err: any) { toast.error(err.message || "Error updating subscription"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="border-b border-gray-100 pb-4 flex flex-col items-start gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Subscriptions</h1>
        <p className="text-[11px] font-medium text-gray-500">Manage your recurring products and delivery schedules.</p>
      </div>

      {!subscriptions.length ? (
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-10 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-gray-400"><Repeat className="w-6 h-6" /></div>
          <h3 className="text-lg font-black text-gray-900 mb-1">No active subscriptions</h3>
          <p className="text-[11px] font-medium text-gray-500">You don’t have any recurring deliveries set up yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-all shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/product/${item.productSlug}`} className="shrink-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img src={item.productImageUrl?.startsWith("http") ? item.productImageUrl : `${API}${item.productImageUrl}`} className="w-full h-full object-cover mix-blend-multiply hover:scale-110 transition-transform" />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link href={`/product/${item.productSlug}`}>
                        <p className="font-bold text-sm text-gray-900 hover:text-[#f38918] transition-colors line-clamp-1">{item.productName}</p>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.frequencyDisplay}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 ${item.status === "Active" ? "bg-green-100 text-green-800" : item.status === "Paused" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                      {item.statusDisplay}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">£{(item.discountedPrice * item.quantity).toFixed(2)}</span>
                      <span className="text-gray-300 mx-1.5">|</span>
                      <span className="text-gray-500 font-medium text-[11px]">Next: <strong className="text-black">{new Date(item.nextDeliveryDate).toLocaleDateString()}</strong></span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.status === "Active" && (
                        <>
                          <button onClick={() => setConfirmAction({ type: "pause", id: item.id })} className="px-2.5 py-1 rounded bg-yellow-50 text-yellow-700 font-bold text-[9px] uppercase tracking-widest hover:bg-yellow-100 transition-colors">Pause</button>
                          <button onClick={() => setConfirmAction({ type: "skip", id: item.id })} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-colors">Skip Next</button>
                          <button onClick={() => setConfirmAction({ type: "cancel", id: item.id })} className="px-2.5 py-1 rounded bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-widest hover:bg-red-100 transition-colors">Cancel</button>
                        </>
                      )}
                      {item.status === "Paused" && (
                        <>
                          <button onClick={() => setConfirmAction({ type: "resume", id: item.id })} className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-bold text-[9px] uppercase tracking-widest hover:bg-green-100 transition-colors">Resume</button>
                          <button onClick={() => setConfirmAction({ type: "cancel", id: item.id })} className="px-2.5 py-1 rounded bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-widest hover:bg-red-100 transition-colors">Cancel</button>
                        </>
                      )}
                      {(item.status === "Active" || item.status === "Paused") && (
                        <button onClick={() => setEditData({ id: item.id, quantity: item.quantity, frequency: item.frequency, shippingFirstName: item.shippingFirstName, shippingLastName: item.shippingLastName, shippingAddressLine1: item.shippingAddressLine1, shippingAddressLine2: item.shippingAddressLine2, shippingCity: item.shippingCity, shippingState: item.shippingState, shippingPostalCode: item.shippingPostalCode, shippingCountry: item.shippingCountry })} className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-bold text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-colors ml-auto sm:ml-0">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {confirmAction.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <h3 className="text-xl font-black text-gray-900 mb-2 capitalize">{confirmAction.type} Subscription</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Are you sure you want to {confirmAction.type} this subscription?</p>
            {confirmAction.type === "cancel" && <textarea placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-6 resize-none" />}
            <div className="flex gap-3">
              <button onClick={() => { setConfirmAction({ type: null, id: null }); setCancelReason(""); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-2 border-gray-100 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => { const { type, id } = confirmAction; if (id) handleAction(type!, id, type === "cancel" ? { cancellationReason: cancelReason || "Cancelled by user" } : undefined); setConfirmAction({ type: null, id: null }); setCancelReason(""); }} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-black text-white rounded-xl hover:bg-gray-900">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {editData.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-900 mb-6">Update Subscription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Quantity</label><input type="number" value={editData.quantity || ""} onChange={(e) => setEditData((p) => ({ ...p, quantity: Number(e.target.value) }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Frequency</label><input type="text" value={editData.frequency || ""} onChange={(e) => setEditData((p) => ({ ...p, frequency: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div className="col-span-2 mt-4"><h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2">Shipping Details</h4></div>
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">First Name</label><input type="text" value={editData.shippingFirstName || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingFirstName: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Last Name</label><input type="text" value={editData.shippingLastName || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingLastName: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div className="col-span-2"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Address</label><input type="text" value={editData.shippingAddressLine1 || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingAddressLine1: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">City</label><input type="text" value={editData.shippingCity || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingCity: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Postal Code</label><input type="text" value={editData.shippingPostalCode || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingPostalCode: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
              <div className="col-span-2"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Country</label><input type="text" value={editData.shippingCountry || ""} onChange={(e) => setEditData((p) => ({ ...p, shippingCountry: e.target.value }))} className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#f38918] focus:outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditData({ id: null })} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-2 border-gray-100 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateSubscription} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-black text-white rounded-xl hover:bg-gray-900">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}