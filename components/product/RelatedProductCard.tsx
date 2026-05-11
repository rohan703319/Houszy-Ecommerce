"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { Star, BadgePercent,ChevronLeft, ChevronRight, AwardIcon, Heart } from "lucide-react";
import { useVatRates } from "@/app/hooks/useVatRates";
import { getVatRate } from "@/app/lib/vatHelpers";
import { useWishlist } from "@/context/WishlistContext";
import {
  getDiscountBadge,
  getDiscountedPrice,
} from "@/app/lib/discountHelpers";
import { useToast } from "@/components/toast/CustomToast";
import { getOldPriceDiscount } from "@/utils/pricing";
import { Card, CardContent } from "../ui/card";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import GenderBadge from "../shared/GenderBadge";
import { useRef } from "react";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import { useRouter } from "next/navigation";

const getRelatedProductImage = (
  product: any,
  defaultVariant?: any
) => {
  // 1️⃣ Variant image
  if (defaultVariant?.imageUrl) {
    return defaultVariant.imageUrl.startsWith("http")
      ? defaultVariant.imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${defaultVariant.imageUrl}`;
  }

  // 2️⃣ Product main image
  const mainImage = product.images?.find(
    (img: any) => img.isMain === true
  );

  if (mainImage?.imageUrl) {
    return mainImage.imageUrl.startsWith("http")
      ? mainImage.imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${mainImage.imageUrl}`;
  }

  // 3️⃣ sortOrder fallback
  const sorted = product.images
    ?.slice()
    ?.sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

  if (sorted?.[0]?.imageUrl) {
    return sorted[0].imageUrl.startsWith("http")
      ? sorted[0].imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${sorted[0].imageUrl}`;
  }

  // 4️⃣ fallback
  return "/placeholder.jpg";
};

export default function RelatedProductCard({ product, getImageUrl }: any) {
const { addToCart, cart } = useCart();
 const minQty = product.orderMinimumQuantity ?? 1;
const [qty, setQty] = useState(minQty);
  const [stockError, setStockError] = useState<string | null>(null);
const toast = useToast();
 const router = useRouter();
 const { toggleWishlist, isInWishlist } = useWishlist();
  const defaultVariant =
    product.variants?.find((v: any) => v.isDefault) ??
    product.variants?.[0] ??
    null;
  const stock = defaultVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  useEffect(() => {
  if (qty < minQty) {
    setQty(minQty);
  }
}, [minQty]);

const basePrice =
  typeof defaultVariant?.price === "number" && defaultVariant.price > 0
    ? defaultVariant.price
    : product.price;

const discountBadge = getDiscountBadge(product);
const finalPrice = getDiscountedPrice(product, basePrice);
// 🔥 NEW: oldPrice fallback logic
const oldPriceValue =
  defaultVariant?.oldPrice ?? product.oldPrice;

const oldPriceData =
  product.displayDiscountType === "OldPrice"
    ? getOldPriceDiscount(
        basePrice,
        oldPriceValue,
        false
      )
    : null;
// ---------- Active Coupon Indicator ----------
const hasActiveCoupon = (product as any).assignedDiscounts?.some((d: any) => {
  if (!d.isActive) return false;
  if (!d.requiresCouponCode) return false;

  const now = new Date();
  if (d.startDate && now < new Date(d.startDate)) return false;
  if (d.endDate && now > new Date(d.endDate)) return false;

  return true;
});
// 🎁 Loyalty Points Logic (NEW – production safe)
const getLoyaltyPoints = () => {
  // ❌ excluded
  if ((product as any).excludeFromLoyaltyPoints) return 0;

  // ✅ variant priority
  if (defaultVariant?.loyaltyPointsEarnable) {
    return defaultVariant.loyaltyPointsEarnable;
  }

  // ✅ product fallback
  if ((product as any).loyaltyPointsEarnable) {
    return (product as any).loyaltyPointsEarnable;
  }

  return 0;
};

  // VAT Rate / Exempt Logic
  const vatRates = useVatRates(); // 👈 yaha dalna
const vatRate = getVatRate(vatRates, (product as any).vatRateId, product.vatExempt);
const [showPharmaModal, setShowPharmaModal] = useState(false);
const [pendingAction, setPendingAction] = useState<"cart" | null>(null);

// 🔒 double-submit protection
const pharmaApprovedRef = useRef(false);
const handlePharmaGuard = (action: "cart") => {
  // already approved in this flow
  if (pharmaApprovedRef.current) return true;

  if (product.isPharmaProduct) {
    setPendingAction(action);
    setShowPharmaModal(true);
    return false;
  }
  return true;
};

const handleAddToCart = () => {
  if (!handlePharmaGuard("cart")) return;
if (product.disableBuyButton) return;
  const variantId = defaultVariant?.id ?? null;

  const existingCartQty = cart
    .filter(
      (c) =>
        c.productId === product.id &&
        (c.variantId ?? null) === variantId
    )
    .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

  const stockQty =
    defaultVariant?.stockQuantity ??
    product.stockQuantity ??
    0;

  const maxQty = product.orderMaximumQuantity ?? Infinity;
  const allowedMaxQty = Math.min(stockQty, maxQty);

  if (qty < minQty) {
    toast.error(`Minimum order quantity is ${minQty}`);
    return;
  }

  if (existingCartQty + qty > allowedMaxQty) {
    toast.error(`Maximum allowed quantity is ${allowedMaxQty}`);
    return;
  }

  addToCart({
    id: `standalone:${product.id}:${variantId ?? "base"}`,
    type: "one-time",
    purchaseContext: "standalone",

    productId: product.id,
    variantId,

    name: defaultVariant
      ? `${product.name} (${[
          defaultVariant.option1Value,
          (defaultVariant as any)?.option2Value,
          (defaultVariant as any)?.option3Value,
        ].filter(Boolean).join(", ")})`
      : product.name,

    price: finalPrice,

    priceBeforeDiscount: basePrice,
    finalPrice,
    oldPrice: oldPriceValue ?? null,

displayDiscountType:
  product.displayDiscountType ?? "None",

hasSystemDiscount:
  product.hasSystemDiscount ?? false,

systemDiscountAmount:
  product.systemDiscountAmount ?? 0,
   discountAmount:
  product.displayDiscountType === "System"
    ? +(basePrice - finalPrice).toFixed(2)
    : 0,

    quantity: qty,
  vatRate: vatRate,
  vatIncluded: vatRate !== null,
    image: getRelatedProductImage(product, defaultVariant),
    sku: defaultVariant?.sku ?? product.sku,
    slug: product.slug,

    variantOptions: {
      option1: defaultVariant?.option1Value ?? null,
      option2: (defaultVariant as any)?.option2Value ?? null,
      option3: (defaultVariant as any)?.option3Value ?? null,
    },

    shipSeparately: product.shipSeparately,
    nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
    sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,

    productData: JSON.parse(JSON.stringify(product)),
  });

 toast.success(
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm font-medium">
      {qty} × {product.name} added to cart!
    </span>

    <button
      onClick={(e) => {
        e.stopPropagation();
        toast.clearAll();
        router.push("/cart");
      }}
      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-[#445D41] hover:bg-black hover:text-white transition shadow-sm"
    >
      Cart→
    </button>
  </div>
);
};

const wishlistId = defaultVariant?.id ?? product.id;
const inWishlist = isInWishlist(wishlistId);
const handleToggleWishlist = () => {
  toggleWishlist({
    id: wishlistId,
    productId: product.id,
    variantId: defaultVariant?.id ?? null,

    name: defaultVariant
      ? `${product.name} (${[
          defaultVariant.option1Value,
          (defaultVariant as any)?.option2Value,
          (defaultVariant as any)?.option3Value,
        ].filter(Boolean).join(", ")})`
      : product.name,

    slug: product.slug,

    // ✅ PRICING (CRITICAL)
    price: finalPrice,
    priceBeforeDiscount: basePrice,
    finalPrice: finalPrice,
   discountAmount:
  product.displayDiscountType === "System"
    ? +(basePrice - finalPrice).toFixed(2)
    : 0,
    appliedDiscountId: null,
    couponCode: null,
oldPrice: oldPriceValue ?? null,

displayDiscountType:
  product.displayDiscountType ?? "None",

hasSystemDiscount:
  product.hasSystemDiscount ?? false,

systemDiscountAmount:
  product.systemDiscountAmount ?? 0,
    image: getRelatedProductImage(product, defaultVariant),

    vatRate: vatRate ?? null,
    vatExempt: product.vatExempt,

    sku: defaultVariant?.sku ?? product.sku,

    stockQuantity:
      defaultVariant?.stockQuantity ??
      product.stockQuantity ??
      null,

    productData: JSON.parse(JSON.stringify(product)),

    orderMaximumQuantity: product.orderMaximumQuantity ?? null,
    orderMinimumQuantity: product.orderMinimumQuantity ?? null,
  });
};
  return (
   <Card className="relative border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl
                 flex flex-col">
             <CardContent className="p-1.5 mt-3 flex flex-col h-full">
      {/* BADGES */}    
 <GenderBadge gender={product.gender} />
      
      {/* IMAGE */}
    <div className="h-[176px] sm:h-[200px] md:h-[224px] flex items-center justify-center overflow-hidden bg-white rounded-t-xl pt-2 relative">
      {/* Offer badge — smaller */}
      {product.displayDiscountType === "System" &&
 discountBadge && (
        <div className="absolute top-1 right-2 z-20">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md ring-2 ring-white">
            <div className="flex flex-col items-center leading-none">
              {discountBadge.type === "percent" ? (
                <><span className="text-[10px] sm:text-xs font-extrabold">{discountBadge.value}%</span><span className="text-[7px] sm:text-[8px] font-semibold">OFF</span></>
              ) : (
                <><span className="text-[10px] sm:text-xs font-extrabold">£{discountBadge.value}</span><span className="text-[7px] sm:text-[8px] font-semibold">OFF</span></>
              )}
  
            </div>
          </div>
        </div>
      )}
      {/* 🔥 OLD PRICE BADGE */}
{!discountBadge && !hasActiveCoupon && oldPriceData && (
  <div className="absolute top-1 right-2 z-20">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md ring-2 ring-white">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] sm:text-xs font-extrabold">
          {oldPriceData.discount}%
        </span>
        <span className="text-[7px] sm:text-[8px] font-semibold">
          OFF
        </span>
      </div>
    </div>
  </div>
)}
      {/* Coupon badge — smaller */}
  {!discountBadge && hasActiveCoupon && (
  <div className="absolute top-1 md:top-2 right-1 md:right-2 z-20">
    <div className="relative bg-gradient-to-br from-red-50 to-red-100 text-red-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-lg rotate-[-6deg] border border-red-200 leading-tight">

      <div className="flex flex-col items-center text-center">
        <span className="flex items-center gap-1 text-[9px]">
          Coupon
        </span>
        <span className="text-[9px] opacity-90">
          Available
        </span>
      </div>

      {/* hole */}
      <span className="absolute -top-1 left-2 w-2 h-2 bg-white border border-red-200 rounded-full shadow-inner"></span>

      {/* string effect */}
      <span className="absolute -top-3 left-[10px] w-[1px] h-3 bg-gray-300"></span>

    </div>
  </div>
)}
      {/* VAT Relief — bottom left on image */}
      {product.vatExempt && (
        <span className="absolute bottom-1.5 left-2 z-20 inline-flex items-center gap-0.5 text-[9px] font-semibold text-white bg-black/80 border border-black/20 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap leading-none backdrop-blur-sm">
          <BadgePercent className="h-2.5 w-2.5" />
          VAT Relief
        </span>
      )}
 <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleToggleWishlist();

      if (inWishlist) {
        toast.error("Product removed from wishlist");
      } else {
        toast.success("Product added to wishlist!");
      }
    }}
    className={`absolute z-20 right-2 p-1.5 rounded-full shadow-sm border transition-all
      ${(
  product.displayDiscountType !== "None" ||
  hasActiveCoupon
) ? "top-12" : "top-2"}
      ${
        inWishlist
          ? "bg-red-50 border-red-200"
          : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
      }
    `}
  >
    <Heart
      className={`h-4 w-4 ${
        inWishlist
          ? "fill-red-500 text-red-500"
          : "text-gray-400 hover:text-red-400"
      }`}
    />
  </button>
        <Link href={`/product/${product.slug}`}>
          <Image
  src={getRelatedProductImage(product, defaultVariant)}
  alt={product.name}
  fill
  className="object-contain w-full h-full"
/>

          
        </Link>
      </div>

      {/* NAME */}
                <div className="min-h-[38px] max-h-[38px] mb-0.5">
                    <Link href={`/product/${product.slug}`} className="block">
                      <h3 className="font-semibold text-xs md:text-sm text-gray-800 line-clamp-2">
  {defaultVariant
    ? `${product.name} (${[
        defaultVariant.option1Value,
        (defaultVariant as any).option2Value,
        (defaultVariant as any).option3Value
      ].filter(Boolean).join(", ")})`
    : product.name}
</h3>

                    </Link>
                  </div>

      {/* RATING + REVIEW + LOYALTY — single compact row */}
    <div className="flex items-center gap-1 min-h-[20px] mb-2 flex-nowrap overflow-hidden">

  {/* ⭐ Rating */}
  <div className="flex items-center bg-green-600 text-white px-1 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">
    <span>{product.averageRating?.toFixed(1)}</span>
    <Star className="h-2.5 w-2.5 ml-0.5 fill-white text-white" />
  </div>

  {/* Reviews */}
  <span className="text-[10px] text-gray-500 flex-shrink-0">
    ({product.reviewCount ?? 0})
  </span>

  {/* 🎁 Loyalty */}
  {getLoyaltyPoints() > 0 && (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1 py-0.5 rounded whitespace-nowrap leading-none flex-shrink-0">
      <AwardIcon className="h-2.5 w-2.5 text-green-600 flex-shrink-0" />
      Earn {getLoyaltyPoints()} pts
    </span>
  )}

</div>


      {/* PRICE & VAT */}
      <div className="flex items-center gap-1 mb-0">
        <span className="text-base font-bold text-[#445D41]">£{
  (
    product.displayDiscountType === "System"
      ? finalPrice
      : basePrice
  ).toFixed(2)
}</span>
        {/* 🔥 CASE 1: REAL DISCOUNT */}
{product.displayDiscountType === "System" &&
 discountBadge && (
  <span className="line-through text-xs text-gray-400">
    £{basePrice.toFixed(2)}
  </span>
)}

{/* 🔥 CASE 2: OLD PRICE */}
{!discountBadge && !hasActiveCoupon && oldPriceData && (
  <span className="line-through text-xs text-gray-400">
    £{oldPriceData.oldPrice.toFixed(2)}
  </span>
)}
        {!product.vatExempt && vatRate !== null && (
          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1 py-0.5 rounded whitespace-nowrap">
            {vatRate}% VAT
          </span>
        )}
      </div>


      {/* QUANTITY + BUTTON — same row, pushed to bottom */}
      <div className="flex items-center gap-1 pt-2">
        <div className="flex-shrink-0 -ml-1 [&_input]:w-7 [&_button]:px-1.5">
          <QuantitySelector
            quantity={qty}
            setQuantity={setQty}
            maxStock={stock}
            stockError={stockError}
            setStockError={setStockError}
          />
        </div>

        <Button
          disabled={stock === 0 || product.disableBuyButton === true}
          onClick={handleAddToCart}
          className={`flex-1 h-[30px] text-[9px] px-1 rounded-lg font-semibold ${
            stock === 0
              ? "bg-red-500 text-white cursor-not-allowed"
              : "bg-[#445D41] hover:bg-black text-white"
          }`}
        >
          {stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>


{showPharmaModal && (
  <PharmaQuestionsModal
    open={showPharmaModal}
    productId={product.id} // ✅ MAIN PRODUCT ID
    mode="add"
    onClose={() => {
      setShowPharmaModal(false);
      setPendingAction(null);
    }}
    onSuccess={(messageFromBackend) => {
  pharmaApprovedRef.current = true;



  setShowPharmaModal(false);

  if (pendingAction === "cart") {
    setPendingAction(null);

    // 🔥 THIS IS THE KEY
    handleAddToCart();
  }

  // reset for next product
  setTimeout(() => {
    pharmaApprovedRef.current = false;
  }, 0);
}}

  />
)}

       </CardContent>
            </Card>



   
  );
}
