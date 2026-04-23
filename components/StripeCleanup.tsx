"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function StripeCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // 🔥 route change ke baad cleanup
    const timer = setTimeout(() => {
      const stripeElements = document.querySelectorAll(
        'iframe[src*="stripe"], div[id^="__privateStripe"], div[class*="stripe"]'
      );

      stripeElements.forEach((el) => {
        // ⚠️ sirf floating / orphan elements remove karna
        if (
          el instanceof HTMLElement &&
          !el.closest("[data-stripe-elements]") // payment form ko touch nahi karega
        ) {
          el.remove();
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}