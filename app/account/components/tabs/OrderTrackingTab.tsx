"use client";

import { useState } from "react";
import { Truck, Info } from "lucide-react";

export default function OrderTrackingTab() {
  const [trackingNumber, setTrackingNumber] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="border-b border-gray-100 pb-6 flex flex-col items-start gap-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Tracking</h1>
        <p className="text-sm font-medium text-gray-500">
          Enter your tracking number to see the latest delivery status.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
            Tracking Number
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. EVR123456789"
            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all"
          />
        </div>

        <button
          disabled
          className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold text-xs uppercase tracking-widest bg-gray-200 text-gray-400 cursor-not-allowed transition-all"
        >
          Track Order
        </button>

        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 pt-2">
          Tracking will be available once your order is dispatched.
        </div>
      </div>

      <div className="mt-12 bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 mb-1">
            Order Tracking Coming Soon
          </p>
          <p className="text-sm font-medium text-gray-500">
            We are currently working on this feature. You will be able to track your orders here soon.
          </p>
        </div>
      </div>
    </div>
  );
}
