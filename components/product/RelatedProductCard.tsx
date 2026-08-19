"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { Star, StarHalf, BadgePercent, ChevronLeft, ChevronRight, AwardIcon, Heart, Zap } from "lucide-react";

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
// import GenderBadge from "../shared/GenderBadge";
import { useRef } from "react";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/analytics";

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
  const defaultVariant =
    product.variants?.find((v: any) => v.isDefault) ??
    product.variants?.[0] ??
    null;
  const minQty = (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
  const [qty, setQty] = useState(minQty);
  const [stockError, setStockError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const stock = defaultVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const isNextDayFree = defaultVariant
    ? defaultVariant.nextDayDeliveryFree === true && defaultVariant.nextDayDeliveryEnabled === true
    : !!product.nextDayDeliveryFree && !!product.nextDayDeliveryEnabled;
  useEffect(() => {
    if (qty < minQty) {
      setQty(minQty);
    }
  }, [minQty]);

  const basePrice =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.price ?? 0)
      : (product.price ?? 0);

  const sellPriceToShow =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.sellPrice ?? defaultVariant?.price ?? 0)
      : (product.sellPrice ?? product.price ?? 0);

  const discountPercentageToShow =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.discountPercentage ?? 0)
      : (product.discountPercentage ?? 0);

  const hasDiscount = discountPercentageToShow > 0 && basePrice > sellPriceToShow;

  const discountBadge = getDiscountBadge(product);

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
  // Use vatRate directly from API response
  const vatRate: number | null = (product as any).vatRate ?? null;
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

    const maxQty = (defaultVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;
    const allowedMaxQty = Math.min(stockQty, maxQty);

    if (qty < minQty) {
      toast.error(`Minimum order quantity is ${minQty}`);
      return;
    }

    if (existingCartQty + qty > allowedMaxQty) {
      toast.error(`Maximum allowed quantity is ${allowedMaxQty}`);
      return;
    }

    const nextDayDeliveryEnabled = defaultVariant
      ? defaultVariant.nextDayDeliveryEnabled === true
      : !!product.nextDayDeliveryEnabled;

    const nextDayDeliveryFree = defaultVariant
      ? defaultVariant.nextDayDeliveryFree === true
      : !!product.nextDayDeliveryFree;

    trackAddToCart({ productId: product.id, name: product.name, price: sellPriceToShow, quantity: qty });
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

      price: basePrice,
      sellPrice: sellPriceToShow,
      discountPercentage: discountPercentageToShow,
      priceBeforeDiscount: basePrice,
      finalPrice: sellPriceToShow,
      oldPrice: hasDiscount ? basePrice : null,
      displayDiscountType: hasDiscount ? "OldPrice" : "None",
      hasSystemDiscount: false,
      systemDiscountAmount: 0,
      discountAmount: 0,

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
      nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
      nextDayDeliveryFree: nextDayDeliveryFree ?? false,
      sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,

      productData: JSON.parse(JSON.stringify(product)),
    });
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

      price: sellPriceToShow,
      priceBeforeDiscount: basePrice,
      finalPrice: sellPriceToShow,
      discountAmount: hasDiscount ? +(basePrice - sellPriceToShow).toFixed(2) : 0,
      appliedDiscountId: null,
      couponCode: null,
      oldPrice: hasDiscount ? basePrice : null,
      displayDiscountType: "None",
      hasSystemDiscount: false,
      systemDiscountAmount: 0,
      image: getRelatedProductImage(product, defaultVariant),

      vatRate: vatRate ?? null,
      vatExempt: product.vatExempt,

      sku: defaultVariant?.sku ?? product.sku,

      stockQuantity:
        defaultVariant?.stockQuantity ??
        product.stockQuantity ??
        null,

      productData: JSON.parse(JSON.stringify(product)),

      orderMaximumQuantity: (defaultVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? null,
      orderMinimumQuantity: (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? null,
    });
  };
  return (
    <Card className="relative border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl
                 flex flex-col">
      <CardContent className="p-1.5 mt-3 flex flex-col h-full">

        {/* IMAGE */}
        <div className="h-[176px] sm:h-[200px] md:h-[224px] flex items-center justify-center overflow-hidden bg-white rounded-t-xl pt-2 relative">
          {/* DISCOUNT BADGE — show when discountPercentage > 0 */}
          {hasDiscount && (
            <div className="absolute top-1 left-2 z-20">
              <div className="px-3 py-1.5 rounded-full bg-[#E31B23] flex items-center justify-center text-white shadow-md">
                <span className="text-[12px] md:text-[13px] font-bold leading-none tracking-wider">
                  {discountPercentageToShow}% Off
                </span>
              </div>
            </div>
          )}
          {/* Coupon badge — smaller */}
          {!discountBadge && hasActiveCoupon && (
            <div className="absolute top-1 md:top-2 left-1 md:left-2 z-20">
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
          {/* Free Next Day badge — bottom left on image */}
          {isNextDayFree && stock > 0 && (
            <span
              className="absolute left-2 bottom-1.5 z-20 inline-flex items-center gap-0.5 font-bold text-white bg-gradient-to-r from-[#f38918] to-[#e07010] px-1 md:px-1.5 py-0.5 rounded shadow-sm text-[7px] md:text-[9px] whitespace-nowrap leading-none"
            >
              <Zap className="h-2.5 w-2.5 fill-white flex-shrink-0" />
              <span>Free Next Day Delivery</span>
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
            className={`absolute z-20 right-2 p-1 rounded-md shadow-sm border transition-all
      ${(
                product.displayDiscountType !== "None" ||
                hasActiveCoupon
              ) ? "top-2" : "top-2"}
      ${inWishlist
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
              }
    `}
          >
            <Heart
              className={`h-4 w-4 ${inWishlist
                ? "fill-red-500 text-red-500"
                : "text-gray-400 hover:text-red-400"
                }`}
            />
          </button>
          {/* <GenderBadge gender={product.gender} absolute={false} className="absolute bottom-2 right-2 z-20" /> */}
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
            <h3 className="font-semibold text-xs md:text-sm text-gray-800 line-clamp-2 hover:text-[#f39a16] transition-colors">
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
          <div className="flex items-center flex-shrink-0 gap-0.5">
            {[...Array(5)].map((_, i) => {
              const rating = product.averageRating || 0;
              if (rating >= i + 1) {
                return <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />;
              } else if (rating > i && rating < i + 1) {
                return <StarHalf key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />;
              }
              return <Star key={i} className="h-3 w-3 text-gray-300 fill-gray-100 flex-shrink-0" />;
            })}
            <span className="text-[10px] ml-1 font-semibold text-gray-700 flex-shrink-0">
              {(product.averageRating ?? 0).toFixed(1)}
            </span>
          </div>

          {/* Reviews */}
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            ({product.reviewCount ?? 0})
          </span>

          {/* 🎁 Loyalty */}
          {getLoyaltyPoints() > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#f38918] bg-orange-50 border border-orange-200 px-1 py-0.5 rounded whitespace-nowrap leading-none flex-shrink-0">
              <AwardIcon className="h-2.5 w-2.5 text-[#f38918] flex-shrink-0" />
              Earn {getLoyaltyPoints()} pts
            </span>
          )}

        </div>


        {/* PRICE & VAT */}
        <div className="flex items-center gap-1 mb-0">
          {/* Highlighted selling price */}
          <span className="text-base font-bold text-[#f38918]">£{sellPriceToShow.toFixed(2)}</span>
          {/* Strikethrough base price — only if discount exists */}
          {hasDiscount && (
            <span className="line-through text-xs text-gray-400">
              £{basePrice.toFixed(2)}
            </span>
          )}
          {vatRate !== null && vatRate > 0 && !product.vatExempt ? (
            <span className="text-[10px] font-semibold text-black bg-gray-50 border border-gray-200 px-1 py-0.5 rounded whitespace-nowrap">
              {vatRate}% VAT
            </span>
          ) : (product.vatExempt || (product as any).vatRate === 0) ? (
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-1 md:px-1.5 py-0.5 rounded-md whitespace-nowrap inline-flex items-center gap-0.5">
              <BadgePercent className="h-2.5 w-2.5 text-slate-600" />
              VAT Relief
            </span>
          ) : null}
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
            className={`flex-1 h-[30px] text-[9px] px-1 rounded-lg font-bold ${stock === 0
              ? "bg-red-500 text-white cursor-not-allowed"
              : "bg-black text-white hover:bg-[#f39a16] hover:text-black transition-colors duration-300"
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
