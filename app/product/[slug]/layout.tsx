//app\products\[slug]\layout.tsx
"use client";

import { useEffect } from "react";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}