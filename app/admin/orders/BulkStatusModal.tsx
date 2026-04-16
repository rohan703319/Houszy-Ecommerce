'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrderStatus } from '@/lib/services/orders';
import { X, AlertCircle } from 'lucide-react';
import ConfirmDialog from '../_components/ConfirmDialog';

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    newStatus: OrderStatus;
    adminNotes: string;
  }) => void;
  currentStatus: OrderStatus;
  selectedOrders: { id: string; orderNumber: string }[];
  loading?: boolean;
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Processing', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled', 'PartiallyShipped'],
  Shipped: ['Delivered', 'Returned'],
  PartiallyShipped: ['Shipped', 'Cancelled'],
  Delivered: [],
  Returned: [],
  Cancelled: [],
  Refunded: [],
  CancellationRequested: ['Cancelled', 'Processing'],
  Collected: [], // ✅ FIX
};
export default function BulkStatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  selectedOrders,
  loading = false,
}: BulkStatusModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(currentStatus);
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus);
      setAdminNotes('');
      setConfirmOpen(false);
      setError('');
    }
  }, [isOpen, currentStatus]);

const allowedStatuses = useMemo(() => {
  return STATUS_TRANSITIONS[currentStatus] || [];
}, [currentStatus]);

if (!isOpen) return null;

  const isSameStatus = newStatus === currentStatus;

const isDestructive =
  newStatus === 'Returned' || newStatus === 'Cancelled';

  const handleOpenConfirm = () => {
    if (!allowedStatuses.includes(newStatus)) {
      setError(
        `Status "${newStatus}" is not allowed from "${currentStatus}".`
      );
      return;
    }

    setError('');
    setConfirmOpen(true);
  };

  const handleFinalConfirm = () => {
    onConfirm({
      newStatus,
      adminNotes,
    });
    setConfirmOpen(false);
  };

  return (
    <>
    
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-[520px] shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white">
              Bulk Status Update
            </h3>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="p-6 space-y-5">

            {/* Selected Orders */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-32 overflow-y-auto">
              <p className="text-xs text-slate-400 mb-2">
                {selectedOrders.length} order(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedOrders.map((o) => (
                  <span
                    key={o.id}
                    className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg border border-violet-500/20"
                  >
                    {o.orderNumber}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div>
              <p className="text-xs text-slate-400 mb-1">Current Status</p>
              <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
                {currentStatus}
              </div>
            </div>

            {/* New Status Dropdown */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                New Status
              </label>

              {allowedStatuses.length === 0 ? (
                <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm">
                  No further transitions allowed
                </div>
              ) : (
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as OrderStatus)
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value={currentStatus}>
                    -- Select Status --
                  </option>

                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes for this bulk update..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleOpenConfirm}
                disabled={
                  loading ||
                  isSameStatus ||
                  allowedStatuses.length === 0
                }
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isDestructive
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleFinalConfirm}
        title="Confirm Status Update"
        message={
  newStatus === 'Cancelled'
    ? `Cancel ${selectedOrders.length} order(s)? This action may require refund if payment was completed.`
    : `Change status from "${currentStatus}" to "${newStatus}" for ${selectedOrders.length} order(s)?`
}
        confirmText="Yes, Update"
        cancelText="Cancel"
        iconColor={isDestructive ? 'text-red-500' : 'text-violet-500'}
        isLoading={loading}
      />
    </>
  );
}