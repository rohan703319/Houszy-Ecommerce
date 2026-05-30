"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import { productsService } from "@/lib/services/products";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}
interface ProductImportBackendData {
  totalRows?: number;
  successCount?: number;
  failedCount?: number;
  errors?: string[];
  warnings?: string[];
}

interface ProductImportApiResponse {
  success: boolean;
  message: string;
  data: ProductImportBackendData;
}



interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductExcelImportModal({
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);


  // ==============================
  // FILE SELECT
  // ==============================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(selected.type)) {
      toast.error("Please upload a valid Excel  file");
      return;
    }

    setFile(selected);
    setResult(null);
  };

  // ==============================
  // DOWNLOAD TEMPLATE
  // ==============================
 const handleDownloadTemplate = async () => {
  try {
    // setIsDownloading(true);

    const response = await productsService.downloadImportTemplate();

    // ✅ Type safe
    const blob = response.data as Blob;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ProductImportTemplate.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully",{position: "top-center"});

  } catch (error) {
    toast.error("Download failed");
  } finally {

  }
};


  // ==============================
  // IMPORT EXCEL
  // ==============================
 const handleImport = async () => {
  if (!file) {
    toast.error("Please select a Excel file first");
    return;
  }

  setImporting(true);

  try {
    // 🔥 IMPORTANT: define response first
    const response = await productsService.importExcel(file);

    // 👇 Now response exists
    const apiResponse = response?.data as ProductImportApiResponse | undefined;

    const backend: ProductImportBackendData = apiResponse?.data ?? {};

    const importResult: ImportResult = {
      total: backend.totalRows ?? 0,
      success: backend.successCount ?? 0,
      failed: backend.failedCount ?? 0,
      errors: backend.errors ?? [],
      warnings: backend.warnings ?? [],
    };

    setResult(importResult);

    if (importResult.success > 0) {
      toast.success(apiResponse?.message || "Import completed");
      onSuccess();
    }

    if (importResult.failed > 0) {
      toast.error(`${importResult.failed} rows failed. Check error report.`);
    }

  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Import failed");
  } finally {
    setImporting(false);
  }
};


  // ==============================
  // UI
  // ==============================
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Import Products from Excel
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Upload Excel file with product data
              </p>
            </div>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* TEMPLATE SECTION */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-400 mt-1" />
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">
                    Need a template?
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Download the sample Excel file to see the correct format
                  </p>

                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample File
                  </button>
                </div>
              </div>
            </div>

            {/* FILE UPLOAD */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center cursor-pointer hover:border-violet-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <>
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="text-white mt-2">{file.name}</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="text-white mt-2">Click to upload Excel file</p>
                  <p className="text-slate-400 text-sm">
                    Supports .xlsx, .xls, .csv
                  </p>
                </>
              )}
            </div>

            {/* RESULT */}
            {result && (
              <div className="bg-slate-800/50 p-4 rounded-xl">
                <p className="text-white">
                  Total: {result.total} | Success:{" "}
                  <span className="text-green-400">{result.success}</span> |
                  Failed:{" "}
                  <span className="text-red-400">{result.failed}</span>
                </p>

                {result.errors.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-red-400 text-xs">
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
               onClick={handleImport}
                disabled={!file || importing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl"
              >
                Import Products
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
