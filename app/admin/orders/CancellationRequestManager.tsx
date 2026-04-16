"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Eye, Loader2, Send, X } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import {
  OrderCancellationRequestItem,
  orderCancellationRequestsService,
} from "@/lib/services/orderCancellationRequests";

interface CancellationRequestManagerProps {
  refreshKey?: number;
  onRequestsChange?: (requests: OrderCancellationRequestItem[]) => void;
  onViewOrders?: () => void;
  onActionSuccess?: () => void;
}

type DecisionType = "approve" | "reject";

interface DecisionState {
  mode: DecisionType;
  request: OrderCancellationRequestItem;
}

export function CancellationDecisionModal({
  state,
  notes,
  setNotes,
  loading,
  onClose,
  onConfirm,
}: {
  state: DecisionState | null;
  notes: string;
  setNotes: (value: string) => void;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!state) {
    return null;
  }

  const isApprove = state.mode === "approve";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-center justify-center py-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/40">
          <div
            className={`border-b px-6 py-5 ${
              isApprove
                ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10"
                : "border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-amber-500/10"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {isApprove ? "Approve Cancellation" : "Reject Cancellation"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Order {state.request.orderNumber} for {state.request.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Customer reason
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-200">
                {state.request.reason || "No reason provided"}
              </p>
              {state.request.additionalNotes && (
                <>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Additional notes
                  </p>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                    {state.request.additionalNotes}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Admin notes <span className="text-red-400">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                placeholder={
                  isApprove
                    ? "Explain why the cancellation is being approved..."
                    : "Explain why the cancellation is being rejected..."
                }
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading || !notes.trim()}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  isApprove
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/20"
                    : "bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg hover:shadow-rose-500/20"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isApprove ? "Approve Request" : "Reject Request"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CancellationActionButtons({
  onApprove,
  onReject,
  compact = false,
}: {
  onApprove: () => void;
  onReject: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
      <button
        type="button"
        onClick={onApprove}
        className={`rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-white transition hover:shadow-lg hover:shadow-emerald-500/20 ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        Approve
      </button>
      <button
        type="button"
        onClick={onReject}
        className={`rounded-xl bg-gradient-to-r from-rose-500 to-red-500 font-semibold text-white transition hover:shadow-lg hover:shadow-rose-500/20 ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        Reject
      </button>
    </div>
  );
}

export default function CancellationRequestManager({
  refreshKey = 0,
  onRequestsChange,
  onViewOrders,
  onActionSuccess,
}: CancellationRequestManagerProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<OrderCancellationRequestItem[]>([]);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await orderCancellationRequestsService.getAll({
        page: 1,
        pageSize: 20,
      });

      const items = response?.data?.items || [];
      setRequests(items);
      onRequestsChange?.(items);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load cancellation requests");
      setRequests([]);
      onRequestsChange?.([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refreshKey]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "Pending"),
    [requests]
  );

  const openDecisionModal = (
    request: OrderCancellationRequestItem,
    mode: DecisionType
  ) => {
    setDecisionState({ request, mode });
    setAdminNotes("");
  };

  const closeDecisionModal = () => {
    if (!processing) {
      setDecisionState(null);
      setAdminNotes("");
    }
  };

  const handleDecision = async () => {
    if (!decisionState || !adminNotes.trim()) {
      toast.error("Admin notes are required");
      return;
    }

    setProcessing(true);

    try {
      if (decisionState.mode === "approve") {
        await orderCancellationRequestsService.approve(decisionState.request.id, {
          adminNotes: adminNotes.trim(),
        });
        toast.success("Cancellation request approved successfully");
      } else {
        await orderCancellationRequestsService.reject(decisionState.request.id, {
          adminNotes: adminNotes.trim(),
        });
        toast.success("Cancellation request rejected successfully");
      }

      closeDecisionModal();
      await fetchRequests();
      onActionSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || "Failed to process cancellation request");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/15 p-3 text-amber-300">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <BellRing className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                Cancellation Requests
              </p>
              <h3 className="mt-1 text-2xl font-bold text-amber-300">
                {pendingRequests.length} pending cancellation request
                {pendingRequests.length === 1 ? "" : "s"}
              </h3>
              <p className="mt-1 text-sm text-amber-100/70">
                Review and approve or reject customer cancellation requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewOrders}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
          >
            <Eye className="h-4 w-4" />
            View Orders
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {pendingRequests.slice(0, 2).map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {request.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {request.customerName} | {request.customerEmail}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-300">
                    {request.status}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-300">
                  {request.reason || "No reason provided"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <CancellationActionButtons
                    onApprove={() => openDecisionModal(request, "approve")}
                    onReject={() => openDecisionModal(request, "reject")}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && pendingRequests.length === 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-400">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            No pending cancellation requests right now.
          </div>
        )}
      </div>

      <CancellationDecisionModal
        state={decisionState}
        notes={adminNotes}
        setNotes={setAdminNotes}
        loading={processing}
        onClose={closeDecisionModal}
        onConfirm={handleDecision}
      />
    </>
  );
}
