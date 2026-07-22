"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import { productReviewsService } from "@/lib/services/productReviews";

interface ImportResultExtended {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

interface ExcelImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResultExtended | null>(null);
  const [downloadingSample, setDownloadingSample] = useState(false);

  // ✅ Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error("❌ Please upload a valid Excel or CSV file");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  // ✅ Download Sample using API
  const downloadSample = async () => {
    setDownloadingSample(true);
    try {
      const blob = await productReviewsService.downloadSample();
      
      // ✅ Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ReviewImportTemplate.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("✅ Sample file downloaded successfully!");
    } catch (error: any) {
      console.error("❌ Download sample error:", error);
      toast.error(error.message || "❌ Failed to download sample file");
    } finally {
      setDownloadingSample(false);
    }
  };

  // ✅ Import Reviews using API
  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      // ✅ Simulate progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // ✅ Call backend import API
      const response = await productReviewsService.importExcel(file);

      clearInterval(progressInterval);
      setProgress(100);

      console.log("✅ Import Response:", response);

      // ✅ Extract backend data
      const backendData = response.data;
      
      const importResult: ImportResultExtended = {
        total: backendData.totalRows || 0,
        success: backendData.successCount || 0,
        failed: backendData.failedCount || 0,
        errors: backendData.errors || [],
        warnings: backendData.warnings || []
      };

      setResult(importResult);

      // ✅ Show backend success message
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        
        if (importResult.success > 0 && typeof onSuccess === 'function') {
          setTimeout(() => onSuccess(), 1000);
        }
      }

      // ✅ Show backend error message
      if (importResult.failed > 0) {
        toast.error(`⚠️ ${importResult.failed} reviews failed. Check error report.`);
      }

    } catch (error: any) {
      console.error("❌ Import error:", error);
      setProgress(100);

      // ✅ Show backend error message
      const errorMessage = error?.message || "Failed to import file";
      toast.error(`❌ ${errorMessage}`);

      // ✅ If there are specific errors, show them
      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        setResult({
          total: 0,
          success: 0,
          failed: error.errors.length,
          errors: error.errors,
          warnings: []
        });
      }
    } finally {
      setImporting(false);
    }
  };

  // ✅ Download Error Report (Client-side XLSX generation)
  const downloadErrorReport = async () => {
    if (!result || result.errors.length === 0) return;

    try {
      // Build a small CSV locally for import errors only.
      const escapeCsvValue = (value: string | number) =>
        `"${String(value).replace(/"/g, '""')}"`;

      const csv = [
        ["Error #", "Error Message"].map(escapeCsvValue).join(","),
        ...result.errors.map((err, idx) =>
          [idx + 1, err].map(escapeCsvValue).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `import_errors_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("📥 Error report downloaded!");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download error report");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Import Reviews from Excel</h2>
            <p className="text-slate-400 text-sm mt-1">
              Upload Excel file with review data
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-2 hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Sample */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">Need a template?</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Download the sample Excel file to see the correct format
                </p>
                <button
                  onClick={downloadSample}
                  disabled={downloadingSample}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingSample ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Sample File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-white font-medium mb-3">
              Select Excel File
            </label>
            <div
              onClick={() => !importing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                file
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-600 hover:border-violet-500 bg-slate-800/30"
              } ${importing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  {!importing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                  <p className="text-white font-medium">Click to upload Excel file</p>
                  <p className="text-slate-400 text-sm">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Importing reviews...</span>
                <span className="text-white font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{result.total}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xs mb-1">Success</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">{result.success}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xs mb-1">Failed</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-400">{result.failed}</p>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-yellow-400 font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Warnings ({result.warnings.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <p key={idx} className="text-yellow-300 text-xs">{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Error List */}
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-red-400 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Import Errors ({result.errors.length})
                    </h3>
                    <button
                      onClick={downloadErrorReport}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Report
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-3 text-sm">
                        <p className="text-red-400 text-xs">{err}</p>
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-slate-400 text-xs text-center pt-2">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Reviews
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={importing}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {result ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
