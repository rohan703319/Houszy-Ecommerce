"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { shareUrls, copyToClipboard } from "./shareUtils";
import { useToast } from "@/components/toast/CustomToast";

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function ShareMenu({ url, title, onClose }: Props) {
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);

  // ✅ Outside click + ESC close
  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        onClose();
      }

      if (
        e instanceof MouseEvent &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const open = (shareUrl: string) => {
    if (shareUrl.startsWith("mailto:")) {
      window.location.href = shareUrl; // ✅ FIXED
    } else {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    onClose();
  };

  return (
    <div
      ref={ref}
      className="flex flex-row items-center gap-1.5 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-max whitespace-nowrap"
    >
      <button
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
        onClick={() => open(shareUrls.email(url, title))}
        title="Email"
      >
        <Image src="/icons/email.svg" alt="Email" width={20} height={20} className="object-contain" />
      </button>

      <button
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
        onClick={() => open(shareUrls.facebook(url))}
        title="Facebook"
      >
        <Image src="/icons/facebook.svg" alt="Facebook" width={20} height={20} className="object-contain" />
      </button>

      <button
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
        onClick={() => open(shareUrls.messenger(url))}
        title="Messenger"
      >
        <Image src="/icons/messenger.svg" alt="Messenger" width={20} height={20} className="object-contain" />
      </button>

      <button
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
        onClick={() => open(shareUrls.whatsapp(url, title))}
        title="WhatsApp"
      >
        <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="object-contain" />
      </button>

      <button
        className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
        onClick={async () => {
          await copyToClipboard(url);
          toast.success("Link copied");
          onClose();
        }}
        title="Copy Link"
      >
        <Image src="/icons/link.svg" alt="Copy Link" width={20} height={20} className="object-contain" />
      </button>
    </div>
  );
}
