"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function OrderTrackingTab() {
  const [trackingNumber, setTrackingNumber] = useState("");

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 max-w-lg">
      <h2 className="text-xl font-semibold mb-1">Track Your Order</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your tracking number to see the latest delivery status.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Tracking Number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. EVR123456789"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#445D41]"
          />
        </div>

        <Button
          disabled
          className="w-full bg-[#445D41]"
        >
          Track Order
        </Button>

        {/* EMPTY / INFO STATE */}
        <div className="text-xs text-gray-500 text-center pt-2">
          Tracking will be available once your order is dispatched.
        </div>
      </div>

    <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
  <p className="text-sm font-medium text-gray-700">
    🚧 Order Tracking Coming Soon
  </p>

  <p className="text-xs text-gray-500 mt-1">
    We are currently working on this feature. You will be able to track your orders here soon.
  </p>
</div>
    </div>
  );
}
