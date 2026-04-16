"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { getImageUrl } from "../_utils/formatUtils";

type Props = {
  imageUrl: string | null;
  onClose: () => void;
};

export default function ImagePreviewModal({ imageUrl, onClose }: Props) {

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur border-b border-white/10">
        <p className="text-sm text-white font-medium truncate">
          Image Preview
        </p>

        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* IMAGE */}
     <div className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl transition-transform duration-300 hover:scale-105">
  <img
    src={getImageUrl(imageUrl)}
    alt="Preview"
    className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
  />
</div>

      {/* CLICK OUTSIDE */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />

    </div>
  );
}