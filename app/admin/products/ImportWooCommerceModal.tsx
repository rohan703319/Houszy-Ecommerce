"use client";

import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { productsService } from "@/lib/services/products";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportWooCommerceModal({ open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleImport = async () => {
    if (!file) return alert("Select file");

    try {
      setLoading(true);
      const res = await productsService.importWooCommerce(file);

      alert(res.data?.message);
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 rounded-2xl p-6 border border-slate-700">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Import Products from WooCommerce
          </h2>
          <button onClick={onClose}>
            <X className="text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Upload Excel file with product data
        </p>

      

        {/* FILE UPLOAD */}
<div
  onClick={() => fileInputRef.current?.click()}
  className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center mb-4 cursor-pointer hover:border-slate-500 transition"
>
  <Upload className="mx-auto mb-2 text-slate-400" />

  <p className="text-sm text-slate-400">
    Click to upload CSV file
  </p>

  {file && (
    <p className="text-xs text-green-400 mt-2">
      {file.name}
    </p>
  )}

  {/* HIDDEN INPUT */}
  <input
    ref={fileInputRef}
    type="file"
    accept=".csv"
    className="hidden"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
  />
</div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-2 rounded-xl text-white font-semibold"
          >
            {loading ? "Importing..." : "Import Products"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}