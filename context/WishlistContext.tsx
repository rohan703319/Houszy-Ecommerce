//wishlist context
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WishlistItem {
  id: string;         // variant ID (if variant selected) or product ID
  productId: string;  // always main product ID (for navigation)
  variantId?: string; // variant ID if applicable
  variantName?: string;
  name: string;
  slug: string;
  price: number;
  priceBeforeDiscount?: number;
  finalPrice?: number;
  discountAmount?: number;
  appliedDiscountId?: string | null;
  couponCode?: string | null;
  image: string;
  vatRate?: number | null;
  vatExempt?: boolean;
  sku?: string;
  // 🔥 ADD THIS
  stockQuantity?: number;
  productData?: any;
orderMaximumQuantity?: number | null;
orderMinimumQuantity?: number | null;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  wishlistCount: number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      if (saved) setWishlist(JSON.parse(saved));
    } catch {}
    setIsInitialized(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist, isInitialized]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((prev) =>
      prev.some((i) => i.id === item.id) ? prev : [...prev, item]
    );
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((i) => i.id !== id));
  };

  const isInWishlist = (id: string) => wishlist.some((i) => i.id === id);

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        wishlistCount: wishlist.length,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
