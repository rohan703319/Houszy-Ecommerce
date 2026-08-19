//components\ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, StarHalf, BadgePercent, AwardIcon, PackageX, Heart, ShoppingBag, Zap, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/components/toast/CustomToast";
import { getDiscountBadge, getDiscountedPrice } from "@/app/lib/discountHelpers";
import { getOldPriceDiscount } from "@/utils/pricing";
// import GenderBadge from "./shared/GenderBadge";
const FALLBACK_IMAGE = "/placeholder-product.jpg";
import { useState, useRef } from "react";
import { trackAddToCart, trackSelectItem } from "@/lib/analytics";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import BackInStockModal from "@/components/backorder/BackInStockModal";
import { useRouter } from "next/navigation";
export default function ProductCard({
  product,
  variantForCard = null,
  cardSlug,
}: {
  product: any;
  variantForCard?: any | null;
  cardSlug: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { addToCart, cart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [showPharmaModal, setShowPharmaModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // 🔁 resume add after modal
  const pharmaApprovedRef = useRef(false);

  // ---------- Variant ----------
  const defaultVariant =
    variantForCard ??
    product.variants?.find((v: any) => v.isDefault) ??
    product.variants?.[0] ??
    null;

  const isNextDayFree = defaultVariant
    ? defaultVariant.nextDayDeliveryFree === true && defaultVariant.nextDayDeliveryEnabled === true
    : !!product.nextDayDeliveryFree && !!product.nextDayDeliveryEnabled;

  // ---------- Image ----------
  const mainImage = (() => {
    // 1️⃣ Default variant image
    if (defaultVariant?.imageUrl) {
      return defaultVariant.imageUrl.startsWith("http")
        ? defaultVariant.imageUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${defaultVariant.imageUrl}`;
    }

    // 2️⃣ Product main image (isMain === true)
    const mainProductImage = product.images?.find(
      (img: any) => img.isMain && img.imageUrl
    );
    if (mainProductImage?.imageUrl) {
      return mainProductImage.imageUrl.startsWith("http")
        ? mainProductImage.imageUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${mainProductImage.imageUrl}`;
    }

    // 3️⃣ Any product image
    const anyImage = product.images?.find((img: any) => img.imageUrl);
    if (anyImage?.imageUrl) {
      return anyImage.imageUrl.startsWith("http")
        ? anyImage.imageUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${anyImage.imageUrl}`;
    }

    // 4️⃣ Fallback
    return FALLBACK_IMAGE;
  })();

  // ---------- Hover Image ----------
  const hoverImage = (() => {
    const sorted = product.images
      ?.slice()
      ?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (sorted && sorted.length > 1 && sorted[1]?.imageUrl) {
      return sorted[1].imageUrl.startsWith("http")
        ? sorted[1].imageUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${sorted[1].imageUrl}`;
    }
    return null;
  })();

  // ---------- Pricing ----------
  // Base regular price (MRP / Strikethrough)
  const basePrice =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.price ?? 0)
      : (product.price ?? 0);

  // Selling price (highlighted price shown to user)
  const sellPriceToShow =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.sellPrice ?? defaultVariant?.price ?? 0)
      : (product.sellPrice ?? product.price ?? 0);

  // Discount percentage from DB
  const discountPercentageToShow =
    product.variants && product.variants.length > 0
      ? (defaultVariant?.discountPercentage ?? 0)
      : (product.discountPercentage ?? 0);

  // Show strikethrough only when base price is higher than sell price
  const hasDiscount = discountPercentageToShow > 0 && basePrice > sellPriceToShow;

  // Coupon indicator (separate from our discount)
  const discountBadge = getDiscountBadge(product);
  // ---------- Active Coupon (indicator only) ----------
  const hasActiveCoupon = product.assignedDiscounts?.some((d: any) => {
    if (!d.isActive) return false;
    if (!d.requiresCouponCode) return false;

    const now = new Date();
    if (d.startDate && now < new Date(d.startDate)) return false;
    if (d.endDate && now > new Date(d.endDate)) return false;

    return true;
  });

  // ---------- VAT ----------
  // Use vatRate directly from API response; fallback to null if not present
  const vatRate: number | null = product.vatRate ?? null;

  // ---------- Stock ----------
  const stock =
    defaultVariant?.stockQuantity ??
    product.stockQuantity ??
    0;
  // ---------- Loyalty Points (Product + Variant aware) ----------
  const loyaltyPoints = (() => {
    if (product.excludeFromLoyaltyPoints) return null;

    if (defaultVariant?.loyaltyPointsEarnable) {
      return defaultVariant.loyaltyPointsEarnable;
    }

    if (product.loyaltyPointsEarnable) {
      return product.loyaltyPointsEarnable;
    }

    return null;
  })();
  const handlePharmaGuard = (): boolean => {
    if (pharmaApprovedRef.current) return true;

    if (product.isPharmaProduct) {
      setShowPharmaModal(true);
      return false;
    }

    return true;
  };
  const getInitialQty = (product: any) => {
    return (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
  };

  // ---------- Add to Cart ----------
  const handleAddToCart = () => {
    if (product.disableBuyButton) return;
    // 🔥 PHARMA GUARD
    if (!handlePharmaGuard()) return;
    const variantId = defaultVariant?.id ?? null;

    const maxQty = (defaultVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;
    const finalQty = getInitialQty(product);


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

    const allowedMaxQty = Math.min(stockQty, maxQty);

    // ⭐ BLOCK IF EXCEEDS
    if (existingCartQty + finalQty > allowedMaxQty) {
      toast.error(`Maximum allowed quantity is ${allowedMaxQty}`);
      return;
    }

    const nextDayDeliveryEnabled = defaultVariant
      ? defaultVariant.nextDayDeliveryEnabled === true
      : !!product.nextDayDeliveryEnabled;

    const nextDayDeliveryFree = defaultVariant
      ? defaultVariant.nextDayDeliveryFree === true
      : !!product.nextDayDeliveryFree;

    trackAddToCart({
      ...{
        id: `${variantId ?? product.id}-one`,
        productId: product.id,
        name: defaultVariant
          ? `${product.name} (${[
            defaultVariant.option1Value,
            defaultVariant.option2Value,
            defaultVariant.option3Value,
          ]
            .filter(Boolean)
            .join(", ")})`
          : product.name,
        price: sellPriceToShow,
        quantity: finalQty,
      }, categories: product.productCategories ?? product.categories
    });
    addToCart({
      id: `${variantId ?? product.id}-one`,
      productId: product.id,
      name: defaultVariant
        ? `${product.name} (${[
          defaultVariant.option1Value,
          defaultVariant.option2Value,
          defaultVariant.option3Value,
        ]
          .filter(Boolean)
          .join(", ")})`
        : product.name,
      price: basePrice,
      sellPrice: sellPriceToShow,
      discountPercentage: discountPercentageToShow,
      priceBeforeDiscount: basePrice,
      finalPrice: sellPriceToShow,
      discountAmount: 0,
      oldPrice: hasDiscount ? basePrice : undefined,
      displayDiscountType: hasDiscount ? "OldPrice" : "None",
      hasSystemDiscount: false,
      systemDiscountAmount: 0,
      quantity: finalQty,
      image: mainImage,
      sku: defaultVariant?.sku ?? product.sku,
      variantId: variantId,
      vatRate: vatRate,
      vatIncluded: vatRate !== null,
      slug: cardSlug,
      variantOptions: {
        option1: defaultVariant?.option1Value ?? null,
        option2: defaultVariant?.option2Value ?? null,
        option3: defaultVariant?.option3Value ?? null,
      },
      shipSeparately: product.shipSeparately,
      nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
      nextDayDeliveryFree: nextDayDeliveryFree ?? false,
      sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
      productData: JSON.parse(JSON.stringify(product)),
    });

    // ⭐ UX TOAST
    const minOrderQty = (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
    if (minOrderQty > 1) {
      toast.warning(
        `Minimum order quantity is ${minOrderQty}. Added ${finalQty} items to cart.`
      );
    }


  };


  return (
    <div className="group rounded-lg hover:shadow-xl transition-all bg-white">
      {/* IMAGE */}
      <Link href={`/product/${cardSlug}`} className="block" onClick={() => trackSelectItem(product, "Category")}>
        <div className="relative h-44 md:h-56 bg-white rounded-t-lg overflow-hidden">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`object-contain p-2 transition-all duration-300 group-hover:scale-110 ${hoverImage ? 'group-hover:opacity-0' : ''}`}
            loading="lazy"
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${product.name} hover`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain p-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
              loading="lazy"
            />
          )}
          {/* DISCOUNT BADGE — show when discountPercentage > 0 */}
          {hasDiscount && (
            <div className="absolute z-20 left-2 top-2">
              <div className="px-1 py-1 md:px-3 md:py-1.5 rounded-full bg-[#E31B23] flex items-center justify-center text-white shadow-md">
                <span className="text-[10px] md:text-[13px] font-bold leading-none tracking-wider">
                  {discountPercentageToShow}% Off
                </span>
              </div>
            </div>
          )}
          {/* COUPON BADGE */}
          {!hasDiscount && hasActiveCoupon && (
            <div className="absolute z-20 top-1 md:top-2 left-1 md:left-2">
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
          {/* <GenderBadge gender={product.gender} absolute={false} className="absolute bottom-2 right-2 z-20" /> */}
          {/* Free Next Day badge — bottom left on image */}
          {isNextDayFree && stock > 0 && (
            <span
              className="absolute left-2 bottom-1.5 z-20 inline-flex items-center gap-0.5 font-bold text-white bg-gradient-to-r from-[#f38918] to-[#e07010] px-1 md:px-1.5 py-0.5 rounded shadow-sm text-[7px] md:text-[9px] whitespace-nowrap leading-none"
            >
              <Zap className="h-2.5 w-2.5 fill-white flex-shrink-0" />
              <span>Free Next Day Delivery</span>
            </span>
          )}
          {/* Out of Stock Badge — bottom right on image */}
          {stock === 0 && (
            <span className="absolute bottom-1.5 right-2 z-20 inline-flex items-center gap-0.5 text-[8px] md:text-[9px] font-bold text-white bg-red-600/95 border border-red-500/20 px-1 md:px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap leading-none backdrop-blur-sm uppercase">
              <PackageX className="hidden md:inline h-2 w-2 md:h-2.5 md:w-2.5" />
              Out of stock
            </span>
          )}
          {/* ❤️ WISHLIST BUTTON */}
          <button
            onClick={(e) => {
              e.preventDefault();

              const wishlistId = defaultVariant?.id ?? product.id;
              const inWishlist = isInWishlist(wishlistId);

              toggleWishlist({
                id: wishlistId,
                productId: product.id,
                variantId: defaultVariant?.id ?? null,

                // ✅ MATCH CART EXACTLY
                name: defaultVariant
                  ? `${product.name} (${[
                    defaultVariant.option1Value,
                    defaultVariant.option2Value,
                    defaultVariant.option3Value,
                  ]
                    .filter(Boolean)
                    .join(", ")})`
                  : product.name,

                slug: cardSlug,

                price: basePrice,
                sellPrice: sellPriceToShow,
                discountPercentage: discountPercentageToShow,
                priceBeforeDiscount: basePrice,
                finalPrice: sellPriceToShow,
                discountAmount: 0,
                appliedDiscountId: null,
                couponCode: null,
                oldPrice: hasDiscount ? basePrice : null,

                displayDiscountType: hasDiscount ? "OldPrice" : "None",
                hasSystemDiscount: false,
                systemDiscountAmount: 0,
                image: mainImage,

                vatRate: vatRate ?? null,
                vatExempt: product.vatExempt,

                sku: defaultVariant?.sku ?? product.sku,

                stockQuantity:
                  defaultVariant?.stockQuantity ??
                  product.stockQuantity ??
                  null,
                productData: JSON.parse(JSON.stringify(product)),

                // 🔥 OPTIONAL BUT IMPORTANT
                orderMaximumQuantity: (defaultVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? null,
                orderMinimumQuantity: (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? null,
              });

              if (inWishlist) {
                toast.error("Product removed from wishlist");
              } else {
                toast.success("Product added to wishlist!");
              }
            }}
            className={`absolute z-20 right-2 top-2 p-0.5 md:p-1 rounded shadow-sm border transition-all
    ${isInWishlist(defaultVariant?.id ?? product.id)
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
              }`}
          >
            <Heart
              className={`h-3 w-3 md:h-4 md:w-4 transition-colors ${isInWishlist(defaultVariant?.id ?? product.id)
                ? "fill-red-500 text-red-500"
                : "text-gray-400 hover:text-red-400"
                }`}
            />
          </button>
        </div>
      </Link>

      {/* CONTENT */}
      <div className="p-2 md:p-4">
        {/* TITLE */}
        <Link href={`/product/${cardSlug}`}>
          <h3 className="font-semibold text-xs md:text-sm mb-1 line-clamp-2 hover:text-[#f39a16] transition min-h-[32px] md:min-h-[40px]">
            {defaultVariant
              ? `${product.name} (${[
                defaultVariant.option1Value,
                defaultVariant.option2Value,
                defaultVariant.option3Value,
              ]
                .filter(Boolean)
                .join(", ")})`
              : product.name}
          </h3>
        </Link>

        {/* RATING + REVIEW + LOYALTY — single compact row */}
        <div className="flex items-center gap-1 mb-1 flex-nowrap overflow-hidden">
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
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            ({product.reviewCount || 0})
          </span>
          {/* ⚡ Next Day Free badge removed from here (now on image overlay) */}
          {loyaltyPoints && (
            <span className="inline-flex items-center gap-0.5 text-[8px] md:text-[10px] font-semibold text-[#f38918] bg-orange-50 border border-orange-200 px-1 py-0.5 rounded whitespace-nowrap leading-none flex-shrink-0">
              <AwardIcon className="h-2.5 w-2.5 text-[#f38918] flex-shrink-0" />
              Earn {loyaltyPoints} pts
            </span>
          )}
        </div>

        {/* PRICE */}
        <div className="flex items-center gap-1 md:gap-2 mb-1">
          {/* Highlighted selling price */}
          <span className="text-sm md:text-xl font-bold text-[#f38918]">
            £{sellPriceToShow.toFixed(2)}
          </span>
          {/* Strikethrough base price — only if discount exists */}
          {hasDiscount && (
            <span className="text-xs md:text-sm text-gray-400 line-through">
              £{basePrice.toFixed(2)}
            </span>
          )}
          {vatRate !== null && vatRate > 0 && !product.vatExempt ? (
            <span className="text-[9px] md:text-xs font-semibold text-black bg-gray-50 border border-gray-200 px-1 md:px-2 py-0.5 rounded-md whitespace-nowrap">
              {vatRate}% VAT
            </span>
          ) : (product.vatExempt || product.vatRate === 0) ? (
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-1 md:px-1.5 py-0.5 rounded-md whitespace-nowrap inline-flex items-center gap-0.5">
              <BadgePercent className="h-2.5 w-2.5 text-slate-600" />
              VAT Relief
            </span>
          ) : null}
        </div>
        {/* ADD TO CART / NOTIFY ME */}
        {stock > 0 ? (
          <Button
            onClick={handleAddToCart}
            disabled={product.disableBuyButton === true}
            className="mt-1 w-full font-bold bg-black text-white hover:bg-[#f39a16] hover:text-black transition-colors duration-300"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        ) : (
          <Button
            onClick={(e) => {
              e.preventDefault();
              setShowNotifyModal(true);
            }}
            className="mt-1 w-full font-bold bg-white hover:bg-orange-50 border border-[#f38918] text-[#f38918] transition-colors duration-300"
          >
            <Bell className="mr-2 h-4 w-4 animate-pulse text-[#f38918]" />
            Notify Me
          </Button>
        )}

      </div>
      {showPharmaModal && (
        <PharmaQuestionsModal
          open={showPharmaModal}
          productId={product.id}
          mode="add"
          onClose={() => {
            setShowPharmaModal(false);
          }}
          onSuccess={(messageFromBackend) => {
            // 🔒 approve once
            pharmaApprovedRef.current = true;

            setShowPharmaModal(false);

            // 🔁 resume add-to-cart
            handleAddToCart();

            // reset for next click
            setTimeout(() => {
              pharmaApprovedRef.current = false;
            }, 0);
          }}
        />
      )}
      {showNotifyModal && (
        <BackInStockModal
          open={showNotifyModal}
          productId={product.id}
          variantId={defaultVariant?.id ?? null}
          onClose={() => setShowNotifyModal(false)}
        />
      )}

    </div>

  );
}
