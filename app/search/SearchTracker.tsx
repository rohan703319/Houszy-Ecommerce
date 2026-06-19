"use client";
import { useEffect } from "react";
import { trackViewItemList } from "@/lib/analytics";

export default function SearchTracker({ products, query }: { products: any[]; query: string }) {
  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, `Search: ${query}`);
    }
  }, []);
  return null;
}
