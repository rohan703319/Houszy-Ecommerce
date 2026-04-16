'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { orderService, WooCommerceOrderImportResult } from '@/lib/services/orders';
import { useToast } from '@/app/admin/_components/CustomToast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportWooCommerceOrdersModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WooCommerceOrderImportResult | null>(null);

  if (!open) return null;

  const resetState = () => {
    setFile(null);
    setLoading(false);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

const handleImport = async () => {
  if (!file) {
    toast.warning('Please select a WooCommerce CSV file');
    return;
  }

  try {
    setLoading(true);

    const response = await orderService.importWooCommerce(file);

    // ✅ FIXED CHECK
    if (!response?.data) {
      toast.error(response?.message || "Import failed");
      return;
    }

    setResult(response.data);
    toast.success(response.message || 'WooCommerce orders imported successfully');

    onSuccess();

  } catch (error: any) {
    toast.error(error?.message || 'Import failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between border-b border-slate-800 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Import Orders from WooCommerce
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Upload a CSV file to import WooCommerce orders into the admin panel.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close import modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center transition hover:border-violet-500/50 hover:bg-slate-800/60"
          >
            <div className="mb-4 rounded-2xl bg-violet-500/10 p-4 text-violet-300">
              <Upload className="h-7 w-7" />
            </div>

            <p className="text-base font-medium text-white">
              Click to upload WooCommerce CSV
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Supported format: <span className="text-slate-300">.csv</span>
            </p>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="max-w-[420px] truncate">{file.name}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
              }}
            />
          </button>

          {result && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="mb-4 flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Import summary</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Total rows
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {result.totalRows}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Imported orders
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {result.importedOrders}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Created customers
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {result.createdCustomers}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Skipped orders
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {result.skippedOrders}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="text-sm font-medium text-rose-300">Import errors</p>
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                    {result.errors.map((error, index) => (
                      <p
                        key={`${error}-${index}`}
                        className="rounded-lg border border-rose-500/10 bg-slate-950/50 px-3 py-2 text-sm leading-6 text-slate-300 break-words"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/50 px-6 py-5 sm:flex-row">
          <button
            onClick={handleImport}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Importing Orders...' : 'Import Orders'}
          </button>

          <button
            onClick={handleClose}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
