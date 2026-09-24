'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/app/admin/_context/auth-context';

const API = process.env.NEXT_PUBLIC_API_URL;

type PaymentFromAPI = {
  id: string;
  paymentIntentId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  amount: number;
  currency: string;
  status: string; // API returns string
  paymentMethod: string;
  customerEmail: string | null;
  stripeFee?: number | null;
  netAmount?: number | null;
  failureReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
};

type Payment = {
  id: string;
  paymentIntentId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  amount: number;
  currency: string;
  status: number;
  paymentMethod: string;
  customerEmail: string | null;
  stripeFee: number | null;
  netAmount: number | null;
  failureReason: string | null;
  createdAt: string;
  processedAt: string | null;
};

const STATUS_STRING_MAP: Record<string, number> = {
  'Pending': 1,
  'Authorized': 2,
  'Successful': 3,
  'Failed': 4,
  'Cancelled': 5,
  'Refunded': 6,
  'Partial Refund': 7,
};

const STATUS_MAP: Record<number, { label: string; color: string; icon: any }> = {
  1: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  2: { label: 'Authorized', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CreditCard },
  3: { label: 'Successful', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  4: { label: 'Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  5: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle },
  6: { label: 'Refunded', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: RotateCcw },
  7: { label: 'Partial Refund', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: RotateCcw },
};

const convertPayment = (p: PaymentFromAPI): Payment => ({
  ...p,
  status: STATUS_STRING_MAP[p.status] ?? 1,
  stripeFee: p.stripeFee ?? null,
  netAmount: p.netAmount ?? null,
  failureReason: p.failureReason ?? null,
  processedAt: p.processedAt ?? null,
});

const fmt = (n: number | null | undefined, currency = 'GBP') =>
  n != null ? `£${n.toFixed(2)}` : '—';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  let cleanString = d;
  if (
    cleanString.includes("T") &&
    !cleanString.endsWith("Z") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("+") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("-")
  ) {
    cleanString = `${cleanString}Z`;
  }
  const parsedDate = new Date(cleanString);
  if (isNaN(parsedDate.getTime())) return '—';
  return parsedDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
};

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPayments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (status && status !== 'all') params.append('status', status);
      if (search.trim()) params.append('search', search.trim());
      if (paymentMethod && paymentMethod !== 'all') params.append('paymentMethod', paymentMethod);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await fetch(
        `${API}/api/Payment?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        showToast(`API error: ${res.status} ${res.statusText}`, false);
        return;
      }
      const json = await res.json();
      if (json?.data) {
        const paymentsFromAPI = json.data.payments ?? [];
        setPayments(paymentsFromAPI.map(convertPayment));
        setTotal(json.data.total ?? 0);
      }
    } catch (err: any) {
      showToast(`Failed to load payments: ${err?.message ?? 'Network error'}`, false);
    } finally {
      setLoading(false);
    }
  }, [status, search, paymentMethod, fromDate, toDate, page, accessToken]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleBackfillFees = async () => {
    if (!accessToken || backfilling) return;
    setBackfilling(true);
    try {
      const res = await fetch(`${API}/api/Payment/backfill-fees?batchSize=50`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        showToast(json.data?.message ?? 'Backfill completed', true);
        fetchPayments();
      } else {
        showToast(json.message ?? 'Failed to backfill fees', false);
      }
    } catch (err: any) {
      showToast(`Backfill failed: ${err?.message ?? 'Network error'}`, false);
    } finally {
      setBackfilling(false);
    }
  };

  const handleExportExcel = async () => {
    if (exporting || !accessToken) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search.trim()) params.append('search', search.trim());
      if (paymentMethod && paymentMethod !== 'all') params.append('paymentMethod', paymentMethod);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await fetch(`${API}/api/Payment/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Payments exported successfully!', true);
    } catch (err: any) {
      showToast(`Export failed: ${err?.message ?? 'Network error'}`, false);
    } finally {
      setExporting(false);
    }
  };

  const syncPayment = async (paymentIntentId: string) => {
    if (!accessToken) return;
    setSyncing(paymentIntentId);
    try {
      const res = await fetch(`${API}/api/Payment/sync/${paymentIntentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      showToast(json.data?.message ?? json.message ?? 'Synced', res.ok);
      if (res.ok) fetchPayments();
    } catch {
      showToast('Sync failed', false);
    } finally {
      setSyncing(null);
    }
  };

  const totalFees = payments.reduce((s, p) => s + (p.stripeFee ?? 0), 0);
  const totalNet = payments.reduce((s, p) => s + (p.netAmount ?? 0), 0);
  const totalAmt = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="md:p-2 space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-400" /> Payments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{total} total payments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Backfill Fees Button */}
          <button
            onClick={handleBackfillFees}
            disabled={backfilling}
            title="Fetch missing Stripe processing fees and net amounts"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${backfilling ? 'animate-spin' : ''}`} />
            {backfilling ? 'Backfilling Fees...' : 'Backfill Fees'}
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={exporting || payments.length === 0}
            title="Export payments to Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition shadow-sm"
          >
            <FileSpreadsheet className={`h-3.5 w-3.5 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchPayments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Charged', value: fmt(totalAmt), color: 'text-white' },
          { label: 'Stripe Fees', value: fmt(totalFees), color: 'text-red-400' },
          { label: 'Net Received', value: fmt(totalNet), color: 'text-green-400' },
          { label: 'Showing', value: `${payments.length} / ${total}`, color: 'text-slate-300' },
        ].map(c => (
          <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Order #, email, intent ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentMethod}
              onChange={e => { setPaymentMethod(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 transition"
            >
              <option value="all">All Payment Methods</option>
              <option value="Card">Card / Debit / Credit</option>
              <option value="Revolut Pay">Revolut Pay</option>
              <option value="Amazon Pay">Amazon Pay</option>
              <option value="Klarna">Klarna</option>
              <option value="PayPal">PayPal</option>
              <option value="Pay By Bank">Pay By Bank App</option>
              <option value="Apple Pay">Apple Pay</option>
              <option value="Google Pay">Google Pay</option>
              <option value="Stripe Link">Stripe Link</option>
              <option value="CashOnDelivery">Cash On Delivery</option>
            </select>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition [color-scheme:dark]"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Status Tabs & Active Filters Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
          <div className="flex flex-wrap gap-1.5">
            {['all', 'Pending', 'Successful', 'Failed', 'Refunded', 'Authorized'].map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-full border transition font-medium
                  ${status === s
                    ? 'bg-violet-600 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {(search || paymentMethod !== 'all' || fromDate || toDate || status !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setPaymentMethod('all');
                setFromDate('');
                setToDate('');
                setStatus('all');
                setPage(1);
              }}
              className="text-xs text-slate-400 hover:text-violet-300 underline transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                {['Date', 'Order', 'Customer', 'Method', 'Charged', 'Stripe Fee', 'Net', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">No payments found</td></tr>
              ) : payments.map(p => {
                const s = STATUS_MAP[p.status] ?? STATUS_MAP[1];
                const Icon = s.icon;
                return (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.orderNumber ? (
                        <a href={`/admin/orders/${p.orderId}`} target="_blank"
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-xs font-mono">
                          {p.orderNumber} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : <span className="text-slate-500 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-[160px] truncate" title={p.customerEmail ?? ''}>
                      {p.customerEmail ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-red-400 whitespace-nowrap font-medium">{fmt(p.stripeFee)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-green-400 whitespace-nowrap">{fmt(p.netAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
                        <Icon className="h-3 w-3" /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.paymentIntentId && (p.status === 1 || p.stripeFee == null) && (
                        <button
                          onClick={() => syncPayment(p.paymentIntentId!)}
                          disabled={syncing === p.paymentIntentId}
                          title="Sync status and Stripe fee details"
                          className="flex items-center gap-1 px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-400 text-xs rounded-lg transition disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncing === p.paymentIntentId ? 'animate-spin' : ''}`} />
                          Sync
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-40 transition">
                Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-40 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
