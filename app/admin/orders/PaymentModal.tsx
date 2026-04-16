'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CreditCard, Banknote, Wallet, Receipt } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    transactionId?: string;
    paymentMethod?: string;
    notes: string;
  }) => Promise<void>;
  loading?: boolean;
  mode: 'full' | 'partial';
  amount?: number;
};

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode,
  amount,
}: Props) {
  const [form, setForm] = useState({
    transactionId: '',
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        transactionId: '',
        paymentMethod: 'Bank Transfer',
        notes: '',
      });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const title = mode === 'full'
    ? 'Mark Full Payment as Paid'
    : 'Mark Pending Amount as Paid';

  // Check if transaction ID should be shown (hide for Cash)
  const showTransactionId = form.paymentMethod !== 'Cash';

  const handleSubmit = async () => {
    if (!form.notes.trim()) {
      setError('Notes are required');
      return;
    }

    setError('');

    await onSubmit({
      transactionId: showTransactionId ? (form.transactionId || undefined) : undefined,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    });
  };

  // Get icon for payment method
  const getPaymentMethodIcon = () => {
    switch (form.paymentMethod) {
      case 'Bank Transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'Cash':
        return <Banknote className="h-4 w-4" />;
      case 'Cheque':
        return <Receipt className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        {/* HEADER */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>

          {/* MODE BADGE */}
          <div className="flex items-center justify-between mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                mode === 'full'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {mode === 'full' ? '✓ FULL PAYMENT' : '⏷ PARTIAL PAYMENT'}
            </span>

            {mode === 'partial' && amount !== undefined && (
              <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded-lg text-slate-300">
                Pending: <span className="text-amber-400 font-bold">£{amount.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        {/* ALERT - Offline Payment Notice */}
        <div className="flex items-start gap-2.5 p-3 mb-5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Offline payment entry (bank transfer, cash, cheque, etc.) — no automatic verification.</span>
        </div>

        {/* FORM FIELDS */}
        <div className="space-y-4">

          {/* PAYMENT METHOD FIELD with Label */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {getPaymentMethodIcon()}
              </div>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value, transactionId: '' })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Card (Manual)</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* TRANSACTION ID - Conditional (hidden for Cash) */}
          {showTransactionId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Transaction ID <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., TRX-123456, UTR number, Reference ID"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
              />            
            </div>
          )}

          {/* NOTES FIELD with Label */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              placeholder="Required: Describe the payment details (e.g., date received, reference, customer name, etc.)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2.5 bg-slate-800/80 border rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700'
              }`}
            />
            {error && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-amber-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              mode === 'full' ? 'Confirm Full Payment' : 'Confirm Partial Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}