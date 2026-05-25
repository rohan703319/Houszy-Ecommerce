"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface ConfirmRemoveModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmRemoveModal({
  open,
  title = "Remove item",
  description = "Are you sure you want to remove this item from your cart?",
  onConfirm,
  onCancel,
}: ConfirmRemoveModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">

        {/* 🔥 HEADER STRIP */}
        <div className="bg-black px-5 py-3">
          <h2 className="text-white text-base font-semibold">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-700">
            {description}
          </p>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-[#f38918] hover:text-white transition"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-500 rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
