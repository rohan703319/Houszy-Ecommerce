'use client';

import { orderService } from '@/lib/services/orders';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedShipment {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shippingMethod: string;
  notes?: string;
}

interface BulkResult {
  processedCount: number;
  failedCount: number;
  failed?: {
    orderId: string;
    orderNumber: string;
    reason: string;
  }[];
}

export default function BulkShipmentUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [shipments, setShipments] = useState<ParsedShipment[]>([]);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(Date.now());
const resetState = () => {
  setLoading(false);
  setFileName('');
  setShipments([]);
  setResult(null);
  setError(null);
  setInputKey(Date.now()); // 👈 this resets file input
};

const downloadTemplate = () => {
  const data = [
    {
      orderId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      trackingNumber: "TRK123456",
      carrier: "Delhivery",
      shippingMethod: "Surface",
      notes: "Handle with care",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");

  XLSX.writeFile(workbook, "bulk_shipment_template.xlsx");
};


useEffect(() => {
  if (isOpen) {
    resetState();
  }
}, [isOpen]);

  if (!isOpen) return null;

  const allowedTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
];

const handleFileUpload = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ❗ File type validation
  if (!allowedTypes.includes(file.type)) {
    setError("Invalid file type. Please upload an Excel file (.xlsx or .xls).");
    setFileName("");
    setShipments([]);
    return;
  }

  setFileName(file.name);
  setError(null);
  setResult(null);

  const reader = new FileReader();

  reader.onload = (evt) => {
    try {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const formatted: ParsedShipment[] = json.map((row) => ({
        orderId: row.orderId,
        trackingNumber: row.trackingNumber,
        carrier: row.carrier,
        shippingMethod: row.shippingMethod,
        notes: row.notes || "",
      }));

      setShipments(formatted);
    } catch {
      setError("Failed to read Excel file. Please check the file format.");
    }
  };

  reader.readAsBinaryString(file);
};

  const handleSubmit = async () => {
    if (shipments.length === 0) {
      setError('Excel file is empty or invalid.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentUser =
        localStorage.getItem('adminName') || 'System Admin';

      const response = await orderService.bulkCreateShipment({
        shipments,
        currentUser,
      });

      if (!response?.data) {
        setError('Invalid server response.');
        return;
      }

      setResult(response.data);

      if (response.data.failedCount === 0) {
        setTimeout(() => {
          onClose();
          resetState();
          onSuccess?.();
        }, 1500);
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

return (
<div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999] p-4">

  <div className="bg-slate-900 w-full max-w-2xl 
  max-h-[90vh] rounded-2xl border border-slate-700 
  shadow-2xl flex flex-col overflow-hidden">

    {/* Header */}
 <div className="flex justify-between items-start px-6 py-5 border-b border-slate-800">

  <div>
    <h2 className="text-white text-xl font-semibold">
      Bulk Shipment Upload
    </h2>

    <p className="text-slate-400 text-sm mt-1">
      Upload Excel file to create multiple shipments
    </p>
  </div>

  <button
    onClick={onClose}
    className="text-slate-400 hover:text-white transition"
  >
    <X size={20} />
  </button>

</div>



    {/* Body */}
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
{/* Template Download Card */}
<div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex items-start gap-4">

  <div className="bg-slate-700 p-2 rounded-lg">
    <FileSpreadsheet size={20} className="text-blue-400" />
  </div>

  <div className="flex-1">

    <p className="text-white font-medium">
      Need a template?
    </p>

    <p className="text-slate-400 text-sm mt-1">
      Download the sample Excel file to see the correct format
    </p>

    <button
      onClick={downloadTemplate}
      className="mt-3 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
      text-white text-sm px-4 py-2 rounded-lg transition"
    >
      <FileSpreadsheet size={16} />
      Download Sample File
    </button>

  </div>

</div>
      {/* Upload Box */}
      <label
        className="border-2 border-dashed border-slate-600 
        hover:border-blue-500 transition-all rounded-xl 
        p-8 flex flex-col items-center justify-center 
        text-center cursor-pointer bg-slate-800/40"
      >

        <UploadCloud size={36} className="text-slate-400 mb-3" />

        <p className="text-white font-medium">
          Click to upload Excel file
        </p>

        <p className="text-slate-400 text-sm mt-1">
          .xlsx or .xls format
        </p>

        <input
          key={inputKey}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />

      </label>


      {/* File Name */}
      {fileName && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <FileSpreadsheet size={16} />
          {fileName}
        </div>
      )}


      {/* Parsed Rows */}
      {shipments.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 
        rounded-lg px-4 py-3 flex justify-between text-sm">

          <span className="text-green-400 font-medium">
            {shipments.length} rows parsed
          </span>

          <span className="text-slate-400">
            Ready to submit
          </span>

        </div>
      )}


      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 
        px-4 py-3 rounded-lg text-red-400 text-sm flex gap-2">

          <AlertTriangle size={18} />
          {error}

        </div>
      )}


      {/* Result */}
      {result && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">

          <div className="grid grid-cols-2 gap-4 text-center">

            <div className="bg-green-900/20 border border-green-600 rounded-lg py-4">
              <p className="text-green-400 text-2xl font-bold">
                {result.processedCount}
              </p>
              <p className="text-slate-300 text-sm">Processed</p>
            </div>

            <div className="bg-red-900/20 border border-red-600 rounded-lg py-4">
              <p className="text-red-400 text-2xl font-bold">
                {result.failedCount}
              </p>
              <p className="text-slate-300 text-sm">Failed</p>
            </div>

          </div>


          {result.failedCount > 0 && (
            <div className="max-h-32 overflow-y-auto text-sm 
            text-red-300 space-y-2 border-t border-slate-700 pt-3">

              {result.failed?.map((f, i) => (
                <div key={i} className="flex justify-between gap-3">

                  <span className="truncate">
                    {f.orderNumber}
                  </span>

                  <span className="text-red-400 text-right">
                    {f.reason}
                  </span>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </div>


    {/* Footer */}
    <div className="flex gap-3 px-6 py-5 border-t border-slate-800 bg-slate-900">

      <button
        onClick={onClose}
        className="flex-1 bg-slate-700 hover:bg-slate-600 
        text-white py-2.5 rounded-lg text-sm font-medium transition"
      >
        Cancel
      </button>
<button
  onClick={handleSubmit}
  disabled={loading || shipments.length === 0}
  title={
    shipments.length === 0
      ? "Upload a valid Excel file to enable shipment creation"
      : "Create shipments from uploaded Excel file"
  }
  className={`flex-1 py-2.5 rounded-lg text-sm font-medium 
  flex justify-center items-center gap-2 transition
  ${
    loading || shipments.length === 0
      ? "bg-slate-600 text-slate-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700 text-white"
  }`}
>
  {loading && <Loader2 size={16} className="animate-spin" />}

  {loading ? "Processing..." : "Create Shipments"}
</button>

    </div>

  </div>

</div>
);
}