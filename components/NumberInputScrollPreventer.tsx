"use client";

import { useEffect } from "react";

export default function NumberInputScrollPreventer() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl instanceof HTMLInputElement &&
        activeEl.type === "number"
      ) {
        activeEl.blur();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
