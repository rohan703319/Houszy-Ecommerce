// components/admin/orders/RefundModals.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  XCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
  PoundSterling,
  ShieldAlert,
  BadgePercent,
  Receipt,
  Truck,
} from 'lucide-react';
import { RefundHistory, RefundReason, orderEditService } from '@/lib/services/OrderEdit';
import { Order, formatCurrency } from '@/lib/services/orders';
import ConfirmDialog from '../_components/ConfirmDialog';

type RefundTab = 'full' | 'partial' | 'shipping';

interface RefundModalsProps {
  order: Order;
  refundHistory?: RefundHistory | null;
  paidAmountCap: number;
  isOpen: boolean;
  defaultTab?: RefundTab;
  canFullRefund: boolean;
  canPartialRefund: boolean;
  canShippingRefund: boolean;
  processingRefund: boolean;
  onClose: () => void;
  onFullRefund: (reason: RefundReason, notes: string) => void;
  onPartialRefund: (amount: number, reason: RefundReason, notes: string) => void;
  onShippingRefund: (notes: string) => void;
}

const TAB_CONFIG: Record<RefundTab, { label: string; icon: React.ReactNode; color: string; ring: string }> = {
  full: {
    label: 'Full Refund',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    color: 'text-red-400',
    ring: 'ring-red-500/60',
  },
  partial: {
    label: 'Partial Refund',
    icon: <BadgePercent className="h-3.5 w-3.5" />,
    color: 'text-orange-400',
    ring: 'ring-orange-500/60',
  },
  shipping: {
    label: 'Shipping Only',
    icon: <Truck className="h-3.5 w-3.5" />,
    color: 'text-cyan-400',
    ring: 'ring-cyan-500/60',
  },
};

export default function UnifiedRefundModal({
  order,
  refundHistory,
  paidAmountCap,
  isOpen,
  defaultTab = 'full',
  canFullRefund,
  canPartialRefund,
  canShippingRefund,
  processingRefund,
  onClose,
  onFullRefund,
  onPartialRefund,
  onShippingRefund,
}: RefundModalsProps) {
  const [activeTab, setActiveTab] = useState<RefundTab>(defaultTab);
  const [reason, setReason] = useState<RefundReason>(RefundReason.CustomerRequest);
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState<number>(0);

  const refundedAmount = refundHistory?.totalRefunded ?? 0;
  const remainingRefundable = Math.max(0, paidAmountCap - refundedAmount);
useEffect(() => {
  if (!processingRefund && confirmOpen) {
    setConfirmOpen(false);
  }
}, [processingRefund]);
  // Reset state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setReason(RefundReason.CustomerRequest);
      setNotes('');
      setPartialAmount(0);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const availableTabs: RefundTab[] = [
    ...(canFullRefund ? (['full'] as RefundTab[]) : []),
    ...(canPartialRefund ? (['partial'] as RefundTab[]) : []),
    ...(canShippingRefund ? (['shipping'] as RefundTab[]) : []),
  ];

  const handleClose = () => {
    if (!processingRefund) onClose();
  };

const handleConfirmRefund = () => {
  if (activeTab === 'full') onFullRefund(reason, notes);
  else if (activeTab === 'partial') onPartialRefund(partialAmount, reason, notes);
  else if (activeTab === 'shipping') onShippingRefund(notes);
};
  const isSubmitDisabled = (() => {
    if (processingRefund || !notes.trim()) return true;
    if (activeTab === 'partial' && partialAmount <= 0) return true;
    return false;
  })();

  const tabCfg = TAB_CONFIG[activeTab];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-br from-slate-900/80 via-slate-800 to-slate-800 border-b border-slate-700/60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-700/60 rounded-xl border border-slate-600/40">
                <Receipt className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Process Refund</h3>
                <p className="text-xs text-slate-400 mt-0.5">Order #{order.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processingRefund}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40 text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Financial summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-700/60">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Order Total</p>
              <p className="text-sm font-bold text-white">{formatCurrency(order.totalAmount, order.currency)}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-700/60">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Refunded</p>
              <p className="text-sm font-bold text-slate-300">{formatCurrency(refundedAmount, order.currency)}</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-500/20">
              <p className="text-[10px] text-orange-400/70 uppercase tracking-wide mb-0.5">Available</p>
              <p className="text-sm font-bold text-orange-400">{formatCurrency(remainingRefundable, order.currency)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-700/40">
            {availableTabs.map((tab) => {
              const cfg = TAB_CONFIG[tab];
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setNotes(''); setPartialAmount(0); }}
                  disabled={processingRefund}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? `bg-slate-700 ${cfg.color} shadow-sm`
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-5 space-y-4">

          {/* FULL REFUND tab */}
          {activeTab === 'full' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-300">Amount to refund</span>
                <span className="text-lg font-bold text-red-400">
                  {formatCurrency(remainingRefundable, order.currency)}
                </span>
              </div>

              <ReasonField reason={reason} setReason={setReason} processingRefund={processingRefund} ringClass="focus:ring-red-500/60 focus:border-red-500/60" />
              <NotesField notes={notes} setNotes={setNotes} processingRefund={processingRefund} placeholder="Explain why this full refund is being processed..." ringClass="focus:ring-red-500/60 focus:border-red-500/60" />

              <WarningBox lines={['Full order amount will be refunded', 'Inventory will be automatically restored', 'This action cannot be undone']} />
            </div>
          )}

          {/* PARTIAL REFUND tab */}
          {activeTab === 'partial' && (
            <div className="space-y-4">
              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Refund Amount <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setPartialAmount(Number(((remainingRefundable * pct) / 100).toFixed(2)))
                        }
                        disabled={processingRefund}
                        className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-700 hover:bg-orange-500/20 hover:text-orange-400 text-slate-300 border border-slate-600 hover:border-orange-500/40 transition-all disabled:opacity-40"
                      >
                        {pct === 100 ? 'Max' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-light select-none">£</span>
                  <input
                    type="number"
                    min="0.01"
                    max={remainingRefundable}
                    step="0.01"
                    value={partialAmount || ''}
                    onChange={(e) =>
                      setPartialAmount(
                        Number(Math.max(0, Math.min(remainingRefundable, Number(e.target.value))).toFixed(2))
                      )
                    }
                    disabled={processingRefund}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-900/60 border border-slate-600 rounded-xl text-white text-xl font-bold focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 placeholder:text-slate-600 disabled:opacity-50 transition-all"
                  />
                </div>
                {partialAmount > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (partialAmount / remainingRefundable) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 text-right">
                      {((partialAmount / remainingRefundable) * 100).toFixed(0)}% of available
                    </p>
                  </div>
                )}
              </div>

              <ReasonField reason={reason} setReason={setReason} processingRefund={processingRefund} ringClass="focus:ring-orange-500/60 focus:border-orange-500/60" />
              <NotesField notes={notes} setNotes={setNotes} processingRefund={processingRefund} placeholder="Reason for this partial refund..." ringClass="focus:ring-orange-500/60 focus:border-orange-500/60" />
              <WarningBox lines={['This action cannot be undone', 'Customer will be notified by email']} />
            </div>
          )}

          {/* SHIPPING tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-300">Shipping charge to refund</span>
                <span className="text-lg font-bold text-cyan-400">
                  {formatCurrency(order.shippingAmount, order.currency)}
                </span>
              </div>

              <NotesField notes={notes} setNotes={setNotes} processingRefund={processingRefund} placeholder="e.g. Late delivery, free shipping promotion..." ringClass="focus:ring-cyan-500/60 focus:border-cyan-500/60" />
              <WarningBox lines={['Only the shipping charge will be refunded', 'Product amounts remain unchanged', 'This action cannot be undone']} />
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/60 bg-slate-900/40">
          <div>
            {activeTab === 'partial' && partialAmount > 0 ? (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Refunding</p>
                <p className="text-lg font-bold text-orange-400 leading-tight">
                  {formatCurrency(partialAmount, order.currency)}
                </p>
              </div>
            ) : activeTab === 'full' ? (
              <p className="text-sm text-slate-400">Full order refund</p>
            ) : activeTab === 'shipping' ? (
              <p className="text-sm text-slate-400">Shipping only</p>
            ) : (
              <p className="text-sm text-slate-500">Enter amount above</p>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleClose}
              disabled={processingRefund}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitDisabled}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'full'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-900/30 text-white'
                  : activeTab === 'partial'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-900/30 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-cyan-900/30 text-white'
              }`}
            >
              {processingRefund ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : activeTab === 'full' ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Refund {formatCurrency(remainingRefundable, order.currency)}
                </>
              ) : activeTab === 'partial' ? (
                <>
                  <BadgePercent className="h-4 w-4" />
                  {partialAmount > 0 ? `Refund ${formatCurrency(partialAmount, order.currency)}` : 'Confirm Refund'}
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  Refund {formatCurrency(order.shippingAmount, order.currency)}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
<ConfirmDialog
  isOpen={confirmOpen}
  isLoading={processingRefund}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleConfirmRefund}
  title={
    activeTab === 'full'
      ? "Confirm Full Refund"
      : activeTab === 'partial'
      ? "Confirm Partial Refund"
      : "Confirm Shipping Refund"
  }
  message={
    activeTab === 'full'
      ? "Full refund will be issued. This action is irreversible and money will be returned to the customer."
      : activeTab === 'partial'
      ? `You are about to refund ${formatCurrency(partialAmount, order.currency)}. This cannot be undone.`
      : "Shipping charges will be refunded only. This action cannot be undone."
  }
  confirmText="Yes, Refund"
  iconColor={
    activeTab === 'full'
      ? "text-red-400"
      : activeTab === 'partial'
      ? "text-orange-400"
      : "text-cyan-400"
  }
  confirmButtonStyle={
    activeTab === 'full'
      ? "bg-red-600 hover:bg-red-700"
      : activeTab === 'partial'
      ? "bg-orange-500 hover:bg-orange-600"
      : "bg-cyan-600 hover:bg-cyan-700"
  }
/>
    </div>
  );
}

// ── Shared sub-components ──

function ReasonField({
  reason, setReason, processingRefund, ringClass,
}: {
  reason: RefundReason;
  setReason: (v: RefundReason) => void;
  processingRefund: boolean;
  ringClass: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
        Reason <span className="text-red-400">*</span>
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(Number(e.target.value) as RefundReason)}
        disabled={processingRefund}
        className={`w-full px-3 py-2.5 bg-slate-900/60 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 ${ringClass} disabled:opacity-50 transition-all`}
      >
        {Object.entries(RefundReason)
          .filter(([key]) => isNaN(Number(key)))
          .map(([, value]) => (
            <option key={value} value={value}>
              {orderEditService.getRefundReasonLabel(value as number)}
            </option>
          ))}
      </select>
    </div>
  );
}

function NotesField({
  notes, setNotes, processingRefund, placeholder, ringClass,
}: {
  notes: string;
  setNotes: (v: string) => void;
  processingRefund: boolean;
  placeholder: string;
  ringClass: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
        Notes <span className="text-red-400">*</span>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={processingRefund}
        className={`w-full px-3 py-2.5 bg-slate-900/60 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 ${ringClass} resize-none disabled:opacity-50 placeholder:text-slate-600 transition-all`}
      />
    </div>
  );
}

function WarningBox({ lines }: { lines: string[] }) {
  return (
    <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
      <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <ul className="space-y-0.5">
        {lines.map((line, i) => (
          <li key={i} className="text-xs text-amber-300/90">{line}</li>
        ))}
      </ul>
    </div>
  );
}
