"use client";

import { useWishlist, WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Trash2, BadgePercent, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, cart } = useCart();
  const toast = useToast();
const [showConfirm, setShowConfirm] = useState(false);
const handleAddToCart = (item: WishlistItem) => {
  const existingCartQty = cart
    .filter(
      (c) =>
        c.productId === item.productId &&
        (c.variantId ?? null) === (item.variantId ?? null)
    )
    .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

  const stock = item.stockQuantity ?? 0;

  const productData = (item as any).productData;

  const maxQty =
    productData?.orderMaximumQuantity ?? Infinity;

  const minQty =
    productData?.orderMinimumQuantity ?? 1;

  const finalQty = minQty;

  // ❌ OUT OF STOCK
  if (stock === 0) {
    toast.error("Out of stock");
    return;
  }

  // ❌ MAX ORDER CHECK
  if (existingCartQty + finalQty > maxQty) {
    toast.error(`Maximum order quantity is ${maxQty}`);
    return;
  }

  // ❌ STOCK CHECK
  if (existingCartQty + finalQty > stock) {
    toast.error(`Only ${stock - existingCartQty} left in stock`);
    return;
  }

  // ✅ ADD TO CART (FULL DATA)
  addToCart({
    id: item.variantId
      ? `${item.variantId}-one`
      : item.productId,

    type: "one-time",

    productId: item.productId,
    variantId: item.variantId ?? null,

    name: item.name,
   price: item.finalPrice ?? item.price,
finalPrice: item.finalPrice ?? item.price,
priceBeforeDiscount:
  item.priceBeforeDiscount ?? item.price,
discountAmount: item.discountAmount ?? 0,
appliedDiscountId: item.appliedDiscountId ?? null,
couponCode: item.couponCode ?? null,

    quantity: finalQty,

    image: item.image,
    slug: item.slug,
    sku: item.sku,

    vatRate: item.vatRate ?? null,
    vatIncluded: item.vatRate != null,

    // 🔥🔥🔥 MOST IMPORTANT
    productData: productData,
  });

  toast.success(`${item.name} added to cart`);
};

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h1>
        <p className="text-gray-500 mb-6">Save products you love by clicking the heart icon.</p>
        <Link href="/">
          <Button className="bg-[#445D41] hover:bg-black text-white px-6 py-2 rounded-xl">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
          <h1 className="text-xl font-bold text-gray-900">
            My Wishlist <span className="text-gray-400 font-normal text-base">({wishlist.length})</span>
          </h1>
        </div>
       <button
  onClick={() => setShowConfirm(true)}
  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
>
  <Trash2 className="h-3.5 w-3.5" /> Clear all
</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col"
          >
            {/* Image */}
           <Link href={`/product/${item.slug}`}>
              <div className="relative h-[130px] w-full rounded-lg overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                />
              </div>
            </Link>

            {/* Name */}
          <Link href={`/product/${item.slug}`}>
  <div className="mb-1">
    <p className="text-xs font-semibold text-gray-800 line-clamp-2 hover:text-[#445D41]">
      {item.variantId ? item.name.split(" - ")[0] : item.name}
    </p>

    {item.variantName && (
      <span className="inline-block text-[12px] text-gray-500">
        {item.variantName}
      </span>
    )}
  </div>
</Link>
         
            {/* Price + VAT */}
            <div className="flex items-baseline gap-1 flex-wrap mb-3 mt-auto">
              <span className="text-sm font-bold text-[#445D41]">
                £{item.price.toFixed(2)}
              </span>
              {item.vatExempt ? (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1 py-0.5 rounded whitespace-nowrap">
                  <BadgePercent className="h-2.5 w-2.5" /> VAT Exempt
                </span>
              ) : item.vatRate != null ? (
                <span className="text-[9px] font-semibold text-green-700 bg-green-100 px-1 py-0.5 rounded whitespace-nowrap">
                  ({item.vatRate}% VAT)
                </span>
              ) : null}
            </div>

            {/* Buttons */}
            <div className="flex gap-1">
       <Button
  onClick={() => {
    if ((item.stockQuantity ?? 0) === 0) return;
    handleAddToCart(item);
  }}
  disabled={(item.stockQuantity ?? 0) === 0}
  className={`flex-1 h-7 text-[10px] px-1.5 text-white rounded-lg font-semibold
    ${(item.stockQuantity ?? 0) === 0
      ? "bg-red-600 cursor-not-allowed"
      : "bg-[#445D41] hover:bg-black"}
  `}
>
{(item.stockQuantity ?? 0) === 0 ? (
  <PackageX className="h-3 w-3" />
) : (
  <ShoppingCart className="h-3 w-3" />
)}

{(item.stockQuantity ?? 0) === 0 ? "Out of Stock" : "Add to cart"}
</Button>
              <button
                onClick={() => { removeFromWishlist(item.id); toast.error("Removed from wishlist"); }}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 text-red-400 hover:text-red-600 hover:border-red-300 transition flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
 {showConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    
    <div className="w-[90%] max-w-md rounded-2xl overflow-hidden shadow-2xl">
      
      {/* HEADER */}
      <div className="bg-[#445D41] px-5 py-4">
        <h2 className="text-white text-lg font-semibold">
          Clear Wishlist
        </h2>
      </div>

      {/* BODY */}
      <div className="bg-white px-5 py-6">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to remove all items from your wishlist?
        </p>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              clearWishlist();
              toast.error("Wishlist cleared");
              setShowConfirm(false);
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition flex items-center gap-1"
          >
            {/* icon optional */}
            Yes, Clear
          </button>

        </div>
      </div>

    </div>
  </div>
)}
    </div>
    
  );
}
