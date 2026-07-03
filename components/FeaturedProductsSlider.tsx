//components\FeaturedProductsSlider.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, ChevronLeft, ChevronRight, BadgePercent, Zap, BellRing, Heart, CircleOff, PackageX, Award, Badge, Coins, AwardIcon, StarHalf, ExternalLink, ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo, useId } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";
import { useWishlist } from "@/context/WishlistContext";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import {
  getDiscountBadge,
  getDiscountedPrice,
} from "@/app/lib/discountHelpers";
// import GenderBadge from "@/components/shared/GenderBadge";
import { getOldPriceDiscount } from "@/utils/pricing";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/analytics";
import { useAuth } from "@/context/AuthContext";
import { getBackorderUIState } from "@/app/lib/backorderHelpers";
import BackInStockModal from "@/components/backorder/BackInStockModal";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  option1Name: string;
  option1Value: string;
  displayOrder?: number;
  isDefault?: boolean;
  imageUrl?: string;
  loyaltyPointsEarnable?: number;
  loyaltyPointsMessage?: string;
  nextDayDeliveryEnabled?: boolean | null;
  nextDayDeliveryFree?: boolean | null;
}
interface Product {
  orderMinimumQuantity?: number;
  orderMaximumQuantity?: number;
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  displayDiscountType?: "None" | "OldPrice" | "System";

  hasSystemDiscount?: boolean;

  systemDiscountAmount?: number;
  averageRating?: number;
  reviewCount?: number;
  images?: { imageUrl: string }[];
  vatExempt?: boolean;
  vatRate?: number;
  gender?: string;
  variants?: Variant[];  // 🟢 ADD THIS
  stockQuantity?: number; // optional fallback if simple product
  sku?: string;           // for simple product
  allowBackorder?: boolean;
  backorderMode?: string;
  disableBuyButton?: boolean;
  disableWishlistButton?: boolean;
  excludeFromLoyaltyPoints?: boolean;
  loyaltyPointsEarnable?: number;
  loyaltyPointsMessage?: string;
  shipSeparately?: boolean;
  nextDayDeliveryEnabled?: boolean;
  nextDayDeliveryFree?: boolean;
  sameDayDeliveryEnabled?: boolean;
  isPharmaProduct?: boolean;
}


const ProductCardImage = ({ src, hoverSrc, alt, className }: { src: string; hoverSrc?: string; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hoverImgSrc, setHoverImgSrc] = useState(hoverSrc);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  useEffect(() => {
    setHoverImgSrc(hoverSrc);
  }, [hoverSrc]);

  return (
    <div className="relative w-full h-full transform transition duration-300">
      {/* Main Image */}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 250px"
        className={`object-contain transition-opacity duration-300 ${hoverImgSrc ? 'group-hover:opacity-0' : ''}`}
        onError={() => setImgSrc("/placeholder.jpg")}
        loading="lazy"
      />
      {/* Hover Image */}
      {hoverImgSrc && (
        <Image
          src={hoverImgSrc}
          alt={`${alt} hover`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 250px"
          className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          onError={() => setHoverImgSrc("")} // On error, just hide hover image
          loading="lazy"
        />
      )}
    </div>
  );
};

export default function FeaturedProductsSlider({
  products,
  baseUrl,
  title = "Our Top Selling Products",
}: {
  products: Product[];
  baseUrl: string;
  title?: string;
}) {

  const toast = useToast();
  const { addToCart, cart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // Generate unique IDs per slider instance to avoid conflicts when multiple sliders are on the same page
  const uid = useId();
  const prevBtnId = `prevBtn-${uid.replace(/:/g, '')}`;
  const nextBtnId = `nextBtn-${uid.replace(/:/g, '')}`;
  const flattenedProducts = useMemo(() => {
    return flattenProductsForListing(products);
  }, [products]);
  const shouldShowNav = flattenedProducts.length > 4;
  const [notifyProduct, setNotifyProduct] = useState<{
    productId: string;
    variantId?: string | null;
  } | null>(null);

  const [pharmaModal, setPharmaModal] = useState<{
    product: Product;
    variant?: Variant;
    action: "ADD_TO_CART" | "BUY_NOW";
    basePrice: number;
    finalPrice: number;
    discountAmount: number;
    cardSlug: string;
  } | null>(null);

  const getProductDisplayImage = (
    product: Product,
    defaultVariant?: Variant
  ) => {
    // 1️⃣ Variant image (highest priority)
    if (defaultVariant?.imageUrl) {
      return defaultVariant.imageUrl.startsWith("http")
        ? defaultVariant.imageUrl
        : `${baseUrl}${defaultVariant.imageUrl}`;
    }

    // 2️⃣ Product main image
    const mainImage = (product as any)?.images?.find(
      (img: any) => img.isMain === true
    );

    if (mainImage?.imageUrl) {
      return mainImage.imageUrl.startsWith("http")
        ? mainImage.imageUrl
        : `${baseUrl}${mainImage.imageUrl}`;
    }

    // 3️⃣ SortOrder based fallback
    const sorted = (product as any)?.images
      ?.slice()
      ?.sort(
        (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

    if (sorted?.[0]?.imageUrl) {
      return sorted[0].imageUrl.startsWith("http")
        ? sorted[0].imageUrl
        : `${baseUrl}${sorted[0].imageUrl}`;
    }

    // 4️⃣ Absolute fallback
    return "/placeholder.jpg";
  };

  const getProductHoverImage = (product: Product) => {
    // Find the second image for hover effect
    const sorted = (product as any)?.images
      ?.slice()
      ?.sort(
        (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

    // Make sure we have at least 2 images
    if (sorted && sorted.length > 1 && sorted[1]?.imageUrl) {
      return sorted[1].imageUrl.startsWith("http")
        ? sorted[1].imageUrl
        : `${baseUrl}${sorted[1].imageUrl}`;
    }

    return undefined;
  };

  const handleBuyNow = (
    product: Product,
    defaultVariant: Variant | undefined,
    basePrice: number,
    finalPrice: number,
    discountAmount: number,
    cardSlug: string
  ) => {
    const finalQty = getInitialQty(product);

    // Use vatRate directly from API response
    const vatRate: number | null = (product as any).vatRate ?? null;
    const selected = defaultVariant ?? null;
    const oldPriceValue =
      (defaultVariant as any)?.compareAtPrice ?? (defaultVariant as any)?.oldPrice ??
      (product as any).compareAtPrice ?? product.oldPrice;
    const stockQty =
      selected?.stockQuantity ??
      (product as any).stockQuantity ??
      0;

    const maxQty = (product as any).orderMaximumQuantity ?? Infinity;

    const nextDayDeliveryEnabled = defaultVariant
      ? defaultVariant.nextDayDeliveryEnabled === true
      : !!product.nextDayDeliveryEnabled;

    const nextDayDeliveryFree = defaultVariant
      ? defaultVariant.nextDayDeliveryFree === true
      : !!product.nextDayDeliveryFree;

    // 🔥 STOCK CHECK
    if (finalQty > stockQty) {
      toast.error(`Only ${stockQty} items available`);
      return;
    }

    // 🔥 MAX ORDER CHECK
    if (finalQty > maxQty) {
      toast.error(`Maximum order quantity is ${maxQty}`);
      return;
    }

    sessionStorage.setItem(
      "buyNowItem",
      JSON.stringify({
        id: defaultVariant ? `${defaultVariant.id}-one` : product.id,
        type: "one-time",
        productId: product.id,
        name: defaultVariant
          ? `${product.name} (${[
            defaultVariant.option1Value,
            (defaultVariant as any)?.option2Value,
            (defaultVariant as any)?.option3Value,
          ]
            .filter(Boolean)
            .join(", ")})`
          : product.name,
        price: finalPrice,
        priceBeforeDiscount: basePrice,
        finalPrice: finalPrice,
        discountAmount:
          product.displayDiscountType === "System"
            ? discountAmount
            : 0,
        oldPrice: oldPriceValue ?? null,

        displayDiscountType:
          product.displayDiscountType ?? "None",

        hasSystemDiscount:
          product.hasSystemDiscount ?? false,

        systemDiscountAmount:
          product.systemDiscountAmount ?? 0,
        quantity: finalQty,
        vatRate: vatRate,
        vatIncluded: vatRate !== null,
        image: getProductDisplayImage(product, defaultVariant),
        sku: defaultVariant?.sku ?? product.sku,
        variantId: defaultVariant?.id ?? null,

        slug: cardSlug,
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
      })
    );

    if (shouldShowMinWarning(product)) {
      toast.warning(
        `Minimum order quantity is ${product.orderMinimumQuantity}. Proceeding with ${finalQty}.`
      );
    }


    if (!isAuthenticated) {
      router.push("/account?from=buy-now");
    } else {
      router.push("/checkout");
    }
  };



  const getInitialQty = (product: any) => {
    return product.orderMinimumQuantity ?? 1;
  };

  const shouldShowMinWarning = (product: any) => {
    return (
      product.orderMinimumQuantity &&
      product.orderMinimumQuantity > 1
    );
  };


  return (
    <div className="relative w-full bg-transparent">

      <h2 className="text-[15px] md:text-[22px] font-bold -mt-[20px] mb-8 text-black text-center">
        {title}
      </h2>
      {shouldShowNav && (
        <button
          id={prevBtnId}
          className="hidden md:flex absolute -left-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm items-center justify-center hover:bg-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 hover:text-white" />
        </button>
      )}

      {shouldShowNav && (
        <button
          id={nextBtnId}
          className="hidden md:flex absolute -right-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm items-center justify-center hover:bg-black transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-700 hover:text-white" />
        </button>
      )}

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={2}
        className="featured-products-slider"
        autoplay={{
          delay: 3000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 22 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}

        navigation={
          shouldShowNav
            ? { prevEl: `#${prevBtnId}`, nextEl: `#${nextBtnId}` }
            : false
        }

        loop={true}

        watchSlidesProgress={true}
        resistanceRatio={0.85}
        touchRatio={1}
        simulateTouch={true}

      >
        {flattenedProducts.slice(0, 50).map((item) => {

          const product = item.productData;
          const variantForCard = item.variantForCard;
          const cardSlug = item.cardSlug;

          const defaultVariant =
            variantForCard ??
            (product as any).variants?.find((v: any) => v.isDefault);

          const isNextDayFree = defaultVariant
            ? defaultVariant.nextDayDeliveryFree === true
            : !!product.nextDayDeliveryFree;

          // 🎁 LOYALTY POINTS (PRODUCT + VARIANT AWARE)
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

          const basePrice =
            typeof defaultVariant?.price === "number" && defaultVariant.price > 0
              ? defaultVariant.price
              : product.price;

          const discountBadge = getDiscountBadge(product);
          const finalPrice = getDiscountedPrice(product, basePrice);
          // 🔥 NEW: oldPrice fallback logic
          const oldPriceValue =
            (defaultVariant as any)?.compareAtPrice ?? (defaultVariant as any)?.oldPrice ??
            (product as any).compareAtPrice ?? product.oldPrice;

          const oldPriceData =
            product.displayDiscountType === "OldPrice"
              ? getOldPriceDiscount(
                basePrice,
                oldPriceValue,
                false
              )
              : null;
          // ---------- Active Coupon (indicator only) ----------
          const hasActiveCoupon = (product as any).assignedDiscounts?.some((d: any) => {
            if (!d.isActive) return false;
            if (!d.requiresCouponCode) return false;

            const now = new Date();
            if (d.startDate && now < new Date(d.startDate)) return false;
            if (d.endDate && now > new Date(d.endDate)) return false;

            return true;
          });

          const discountAmount =
            basePrice > finalPrice
              ? +(basePrice - finalPrice).toFixed(2)
              : 0;

          const stock = defaultVariant?.stockQuantity ?? (product as any).stockQuantity ?? 0;
          const backorderState = getBackorderUIState({
            stock,
            allowBackorder: product.allowBackorder,
            backorderMode: product.backorderMode,
          });


          // Use vatRate directly from API response
          const vatRate: number | null = (product as any).vatRate ?? null;

          const heartTopClass = "top-2";

          return (
            <SwiperSlide key={variantForCard?.id ?? product.id}>

              <Card
                className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col flex-1 overflow-hidden bg-[#F4F4F4]">
                <CardContent className="p-3 md:p-4 flex flex-col h-full">


                  {/* Product Image */}
                  <Link href={`/product/${cardSlug}`}>


                    <div className="group h-[160px] sm:h-[220px] md:h-[290px] flex items-center justify-center overflow-hidden bg-white rounded-xl relative shadow-sm">


                      <ProductCardImage
                        src={getProductDisplayImage(product, defaultVariant)}
                        hoverSrc={getProductHoverImage(product)}
                        alt={product.name}
                      />


                      {/* Loyalty points — bottom left on image */}
                      {loyaltyPoints && (
                        <span className="absolute bottom-1.5 left-2 z-20 inline-flex items-center gap-0.5 text-[7px] md:text-[9px] font-semibold text-white bg-[#f38918] border border-orange-500/20 px-0.5 py-0.5 md:px-1.5 md:py-0.5 rounded shadow-sm whitespace-nowrap leading-none backdrop-blur-sm">
                          <AwardIcon className="h-2.5 w-2.5 text-white" />
                          Earn {loyaltyPoints} pts
                        </span>
                      )}
                      {/* Offer badge — top right */}
                      {product.displayDiscountType === "System" &&
                        discountBadge && (
                          <div className="absolute z-20 left-3 top-2">
                            <div className="px-1 py-1 md:px-3 md:py-1.5 rounded-full bg-[#E31B23] flex items-center justify-center text-white shadow-md">
                              <span className="text-[10px] md:text-[13px] font-bold leading-none tracking-wider">
                                -{discountBadge.type === "percent" ? `${discountBadge.value}%` : `£${discountBadge.value}`}
                              </span>
                            </div>
                          </div>
                        )}

                      {!discountBadge && !hasActiveCoupon && oldPriceData && (
                        <div className="absolute z-20 left-3 top-2">
                          <div className="px-1 py-1 md:px-3 md:py-1.5 rounded-full bg-[#E31B23] flex items-center justify-center text-white shadow-md">
                            <span className="text-[10px] md:text-[13px] font-bold leading-none tracking-wider">
                              -{oldPriceData.discount}%
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Coupon badge — top right, smaller */}
                      {!discountBadge && hasActiveCoupon && (
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
                      {/* Wishlist — top right below badge */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const wishlistId = defaultVariant?.id ?? product.id;
                          const inWishlist = isInWishlist(wishlistId);
                          toggleWishlist({
                            id: wishlistId,
                            productId: product.id,
                            variantId: defaultVariant?.id ?? null,

                            name: defaultVariant
                              ? `${product.name} (${[
                                defaultVariant.option1Value,
                                (defaultVariant as any)?.option2Value,
                                (defaultVariant as any)?.option3Value,
                              ]
                                .filter(Boolean)
                                .join(", ")})`
                              : product.name,

                            slug: cardSlug,
                            price: finalPrice,

                            priceBeforeDiscount: basePrice,
                            finalPrice: finalPrice,
                            discountAmount:
                              product.displayDiscountType === "System"
                                ? discountAmount
                                : 0,
                            oldPrice: oldPriceValue ?? null,

                            displayDiscountType:
                              product.displayDiscountType ?? "None",

                            hasSystemDiscount:
                              product.hasSystemDiscount ?? false,

                            systemDiscountAmount:
                              product.systemDiscountAmount ?? 0,
                            appliedDiscountId: null, // slider me coupon nahi hai
                            couponCode: null,
                            image: getProductDisplayImage(product, defaultVariant),

                            vatRate: vatRate ?? null,
                            vatExempt: product.vatExempt,

                            sku: defaultVariant?.sku ?? (product as any).sku,

                            stockQuantity:
                              defaultVariant?.stockQuantity ??
                              (product as any).stockQuantity ??
                              null,
                            // 🔥🔥🔥 MAIN FIX
                            productData: JSON.parse(JSON.stringify(product)),

                            // 🔥 optional but useful
                            orderMaximumQuantity: (product as any).orderMaximumQuantity ?? null,
                            orderMinimumQuantity: (product as any).orderMinimumQuantity ?? null,
                          });
                          if (inWishlist) {
                            toast.error("Product removed from wishlist");
                          } else {
                            toast.success("Product added to wishlist!");
                          }
                        }}
                        className={`absolute z-20 right-2 p-0.5 md:p-1 rounded shadow-sm border transition-all ${heartTopClass} ${isInWishlist(defaultVariant?.id ?? product.id)
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
                          }`}
                      >
                        <Heart
                          className={`h-3 w-3 md:h-4 md:w-4 transition-colors ${isInWishlist(defaultVariant?.id ?? product.id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
                            }`}
                        />
                      </button>
                    </div>
                  </Link>

                  {/* CONTENT */}
                  <div className="flex flex-col flex-grow pt-3 md:pt-4 items-center text-center">

                    {/* RATING + REVIEW */}
                    <div className="flex items-center justify-center gap-1 min-h-[20px] mb-2 flex-nowrap overflow-hidden w-full">
                      {/* Desktop: 5 Stars */}
                      <div className="hidden md:flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((_, i) => {
                          const rating = product.averageRating || 0;
                          if (rating >= i + 1) {
                            return <Star key={i} className="h-4 w-4 fill-[#ffc107] text-[#ffc107]" />;
                          } else if (rating > i && rating < i + 1) {
                            return <StarHalf key={i} className="h-4 w-4 fill-[#ffc107] text-[#ffc107]" />;
                          }
                          return <Star key={i} className="h-4 w-4 fill-gray-200 text-gray-200" />;
                        })}
                      </div>
                      {/* Mobile: Single Star + Rating Number */}
                      <div className="flex md:hidden items-center flex-shrink-0">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[11px] ml-0.5 font-semibold text-gray-700">
                          {(product.averageRating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 ml-0.5 flex-shrink-0">
                        ({product.reviewCount ?? 0})
                      </span>
                      {/* ⚡ Next Day Free badge */}
                      {isNextDayFree && (
                        <span className="inline-flex items-center gap-0.5 font-bold text-white bg-gradient-to-r from-[#f38918] to-[#e07010] px-1 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap leading-none flex-shrink-0 shadow-sm">
                          <Zap className="inline-block h-2 w-2 md:h-2.5 md:w-2.5 fill-white" />
                          <span className="inline md:hidden text-[8px]">Free Next Day</span>
                          <span className="hidden md:inline text-[9px]">Free Next Day Delivery</span>
                        </span>
                      )}
                    </div>

                    {/* TITLE */}
                    <div className="min-h-[42px] max-h-[42px] sm:min-h-[38px] sm:max-h-[38px] mb-1 flex items-center justify-center w-full">
                      <Link href={`/product/${cardSlug}`} className="block">
                        <h3
                          className="font-bold text-[14px] md:text-[15px] text-black hover:text-[#f39a16] line-clamp-2 transition-all duration-300 leading-tight"
                        >
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



                    {/* PRICE ROW FIXED HEIGHT */}
                    <div className="min-h-[30px] mt-2 mb-0 flex flex-col justify-center w-full">
                      {/* PRICE ROW */}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm md:text-base font-bold text-[#f38918] leading-none">
                          £{
                            (
                              product.displayDiscountType === "System"
                                ? finalPrice
                                : basePrice
                            ).toFixed(2)
                          }
                          <span className="hidden md:inline ml-0.5">GBP</span>
                        </span>

                        {/* 🔥 CASE 1: REAL DISCOUNT */}
                        {product.displayDiscountType === "System" &&
                          discountBadge && (
                            <span className="text-xs text-gray-500 line-through leading-none">
                              £{basePrice.toFixed(2)}
                              <span className="hidden md:inline ml-0.5">GBP</span>
                            </span>
                          )}

                        {/* 🔥 CASE 2: OLD PRICE (NO DISCOUNT) */}
                        {!discountBadge && !hasActiveCoupon && oldPriceData && (
                          <span className="text-xs text-gray-500 line-through leading-none">
                            £{oldPriceData.oldPrice.toFixed(2)}
                            <span className="hidden md:inline ml-0.5">GBP</span>
                          </span>
                        )}

                        {vatRate !== null && vatRate > 0 && !product.vatExempt ? (
                          <span className="text-[9px] md:text-xs font-semibold text-black bg-gray-50 border border-gray-200 px-1 md:px-2 py-0.5 rounded-md whitespace-nowrap">
                            {vatRate}% VAT
                          </span>
                        ) : (product.vatExempt || (product as any).vatRate === 0) ? (
                          <span className="text-[7px] md:text-[10px] font-semibold text-black bg-white border border-gray-200 px-1 md:px-2 py-0.5 rounded-md whitespace-nowrap inline-flex items-center gap-0.5">
                            <BadgePercent className="h-2 w-2 md:h-3 md:w-3 text-black" />
                            VAT Relief
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-auto flex flex-col w-full pt-4">

                      {/* ⭐ CASE: IN STOCK OR CAN BUY */}
                      {backorderState.canBuy && (
                        <div className="w-full">
                          {/* ADD TO CART */}
                          <Button
                            disabled={product.disableBuyButton === true}
                            onClick={() => {
                              if (product.disableBuyButton) return;

                              // 🔥 PHARMA PRODUCT GUARD
                              if (product.isPharmaProduct) {
                                setPharmaModal({
                                  product,
                                  variant: defaultVariant,
                                  action: "ADD_TO_CART",
                                  basePrice,
                                  finalPrice,
                                  discountAmount,
                                  cardSlug,
                                });
                                return;
                              }


                              const defaultVarId = defaultVariant?.id ?? null;

                              const existingCartQty = cart
                                .filter(
                                  (c) =>
                                    c.productId === product.id &&
                                    (c.variantId ?? null) === defaultVarId
                                )
                                .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

                              const stockQty =
                                defaultVariant?.stockQuantity ??
                                (product as any).stockQuantity ??
                                0;

                              const finalQty = getInitialQty(product);

                              const maxQty = (product as any).orderMaximumQuantity ?? Infinity;

                              // 🔥 MAX ORDER CHECK
                              if (existingCartQty + finalQty > maxQty) {
                                toast.error(`Maximum order quantity is ${maxQty}`);
                                return;
                              }

                              // 🔥 STOCK PROTECTION
                              if (existingCartQty + finalQty > stockQty) {
                                toast.error(
                                  `Only ${stockQty - existingCartQty} items left in stock`
                                );
                                return;
                              }

                              const nextDayDeliveryEnabled = defaultVariant
                                ? defaultVariant.nextDayDeliveryEnabled === true
                                : !!product.nextDayDeliveryEnabled;

                              const nextDayDeliveryFree = defaultVariant
                                ? defaultVariant.nextDayDeliveryFree === true
                                : !!product.nextDayDeliveryFree;

                              trackAddToCart({ productId: product.id, name: product.name, price: finalPrice, quantity: finalQty });
                              addToCart({
                                id: defaultVariant ? `${defaultVariant.id}-one` : product.id,
                                type: "one-time",
                                productId: product.id,
                                name: defaultVariant
                                  ? `${product.name} (${[
                                    defaultVariant.option1Value,
                                    (defaultVariant as any)?.option2Value,
                                    (defaultVariant as any)?.option3Value,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")})`
                                  : product.name,
                                price: finalPrice,
                                priceBeforeDiscount: basePrice,
                                finalPrice: finalPrice,
                                oldPrice: hasActiveCoupon
                                  ? undefined
                                  : ((defaultVariant as any)?.compareAtPrice ?? defaultVariant?.oldPrice ??
                                    oldPriceValue ??
                                    (product as any).compareAtPrice ?? product.oldPrice ??
                                    undefined),
                                displayDiscountType: hasActiveCoupon
                                  ? "None"
                                  : (defaultVariant?.displayDiscountType ??
                                    product.displayDiscountType ??
                                    "None"),

                                hasSystemDiscount:
                                  defaultVariant?.hasSystemDiscount ??
                                  product.hasSystemDiscount ??
                                  false,

                                systemDiscountAmount:
                                  defaultVariant?.systemDiscountAmount ??
                                  product.systemDiscountAmount ??
                                  0,
                                discountAmount:
                                  (
                                    defaultVariant?.displayDiscountType ??
                                    product.displayDiscountType
                                  ) === "System"
                                    ? discountAmount
                                    : 0,
                                quantity: finalQty,
                                // ✅ ADD THESE 👇
                                vatRate: vatRate,
                                vatIncluded: vatRate !== null,
                                image: getProductDisplayImage(product, defaultVariant),
                                sku: defaultVariant?.sku ?? product.sku,
                                shipSeparately: product.shipSeparately,
                                nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
                                // 🔥🔥🔥 MAIN FIX
                                nextDayDeliveryFree: nextDayDeliveryFree ?? false,
                                sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
                                variantId: defaultVariant?.id ?? null,
                                slug: cardSlug,
                                variantOptions: {
                                  option1: defaultVariant?.option1Value ?? null,
                                  option2: (defaultVariant as any)?.option2Value ?? null,
                                  option3: (defaultVariant as any)?.option3Value ?? null,
                                },
                                productData: JSON.parse(JSON.stringify(product)),
                              });

                              if (shouldShowMinWarning(product)) {
                                toast.warning(
                                  `Minimum order quantity is ${product.orderMinimumQuantity}. Added ${finalQty} items to cart.`
                                );
                              } else {
                                toast.success(
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">
                                      {product.name} added to cart!
                                    </span>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast.clearAll();
                                        router.push("/cart");
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#f38918] text-black hover:bg-black hover:text-white transition shadow-sm"
                                    >
                                      Cart→
                                    </button>
                                  </div>
                                );
                              }

                            }}

                            className="w-[92%] mx-auto mb-2 text-[13.5px] md:text-[15px] font-bold py-2.5 rounded whitespace-nowrap flex items-center justify-center gap-2
    bg-black text-white hover:bg-[#f39a16] hover:text-black
    disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <>
                              <ShoppingBag className="h-4 w-4" />
                              Add to cart
                            </>
                          </Button>

                          {/* BUY NOW - HIDING IT to match UI */}
                          <Button
                            disabled={product.disableBuyButton === true}
                            onClick={() => { }}
                            className="hidden"
                          >
                            <Zap className="h-2 w-2 md:h-3 md:w-3" />
                            Buy
                          </Button>
                        </div>
                      )}

                      {/* ⭐ CASE: BACKORDER NOTIFY MODE */}
                      {backorderState.showNotify && (
                        <>
                          {/* ADD TO CART KE JAGAH NOTIFY */}
                          <Button
                            variant="outline"
                            className="w-full text-xs md:text-xs border border-orange-400 text-[#f38918] hover:bg-orange-50"
                            onClick={() =>
                              setNotifyProduct({
                                productId: product.id,
                                variantId: defaultVariant?.id ?? null,
                              })
                            }
                          >
                            <BellRing className="h-3 w-3" />
                            Notify me
                          </Button>

                          {/* BUY NOW DISABLED */}
                          <Button
                            disabled
                            className="w-full text-xs md:text-sm rounded-lg py-2 bg-red-700 text-white cursor-not-allowed"
                          >
                            <PackageX className="h-4 w-4" />
                            Stock!
                          </Button>
                        </>
                      )}

                      {/* ⭐ CASE: PURE OUT OF STOCK (NO BACKORDER) */}
                      {!backorderState.canBuy && !backorderState.showNotify && (
                        <>
                          {/* ADD TO CART DISABLED WITH TEXT */}
                          <Button
                            disabled
                            className="w-full text-xs mb-2 md:text-sm rounded py-2 bg-red-500 cursor-not-allowed text-white"
                          >
                            <PackageX className="h-4 w-4" />
                            Out of stock
                          </Button>

                          {/* BUY NOW DISABLED */}

                        </>
                      )}

                    </div>


                  </div>
                </CardContent>
              </Card>
            </SwiperSlide>
          );
        })}
      </Swiper>
      {/* 🔔 BACK IN STOCK MODAL (GLOBAL) */}
      {notifyProduct && (
        <BackInStockModal
          open={true}
          productId={notifyProduct.productId}
          variantId={notifyProduct.variantId}
          onClose={() => setNotifyProduct(null)}
        />
      )}
      {pharmaModal && (
        <PharmaQuestionsModal
          open={true}
          productId={pharmaModal.product.id}
          mode="add"
          onClose={() => setPharmaModal(null)}
          onSuccess={() => {
            const {
              product,
              variant,
              action,
              basePrice,
              finalPrice,
              discountAmount,
              cardSlug,
            } = pharmaModal;

            if (action === "ADD_TO_CART") {
              const finalQty = getInitialQty(product);


              const defaultVarId = variant?.id ?? null;

              const existingCartQty = cart
                .filter(
                  (c) =>
                    c.productId === product.id &&
                    (c.variantId ?? null) === defaultVarId
                )
                .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

              const stockQty =
                variant?.stockQuantity ??
                (product as any).stockQuantity ??
                0;

              const maxQty = (product as any).orderMaximumQuantity ?? Infinity;

              // 🔥 MAX ORDER CHECK
              if (existingCartQty + finalQty > maxQty) {
                toast.error(`Maximum order quantity is ${maxQty}`);
                return;
              }

              // 🔥 STOCK CHECK
              if (existingCartQty + finalQty > stockQty) {
                toast.error(`Only ${stockQty - existingCartQty} items left in stock`);
                return;
              }
              // Use vatRate directly from API response
              const modalVatRate: number | null =
                !product.vatExempt ? ((product as any).vatRate ?? null) : null;

              const nextDayDeliveryEnabled = variant
                ? variant.nextDayDeliveryEnabled === true
                : !!product.nextDayDeliveryEnabled;

              const nextDayDeliveryFree = variant
                ? variant.nextDayDeliveryFree === true
                : !!product.nextDayDeliveryFree;

              trackAddToCart({ productId: product.id, name: product.name, price: finalPrice, quantity: finalQty });
              addToCart({
                id: variant ? `${variant.id}-one` : product.id,
                type: "one-time",
                productId: product.id,
                name: variant
                  ? `${product.name} (${[
                    variant.option1Value,
                    (variant as any)?.option2Value,
                    (variant as any)?.option3Value,
                  ].filter(Boolean).join(", ")})`
                  : product.name,
                price: finalPrice,
                priceBeforeDiscount: basePrice,
                finalPrice,
                discountAmount,
                quantity: finalQty,
                // ✅ ADD THESE 👇
                vatRate: modalVatRate,
                vatIncluded: modalVatRate !== null,
                image: getProductDisplayImage(product, variant),
                sku: variant?.sku ?? product.sku,
                shipSeparately: product.shipSeparately,
                nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
                nextDayDeliveryFree: nextDayDeliveryFree ?? false,
                sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
                variantId: variant?.id ?? null,
                slug: cardSlug,
                variantOptions: {
                  option1: variant?.option1Value ?? null,
                  option2: (variant as any)?.option2Value ?? null,
                  option3: (variant as any)?.option3Value ?? null,
                },
                productData: JSON.parse(JSON.stringify(product)),
              });

              toast.success(
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {product.name} added to cart!
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.clearAll();
                      router.push("/cart");
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-[#f38918] hover:bg-black hover:text-white transition shadow-sm"
                  >
                    Cart→
                  </button>
                </div>
              );
            }

            if (action === "BUY_NOW") {
              const stockQty =
                variant?.stockQuantity ??
                (product as any).stockQuantity ??
                0;

              const finalQty = getInitialQty(product);

              const maxQty = (product as any).orderMaximumQuantity ?? Infinity;

              if (finalQty > stockQty) {
                toast.error(`Only ${stockQty} items available`);
                return;
              }

              if (finalQty > maxQty) {
                toast.error(`Maximum order quantity is ${maxQty}`);
                return;
              }

              handleBuyNow(
                product,
                variant,
                basePrice,
                finalPrice,
                discountAmount,
                cardSlug
              );
            }

            setPharmaModal(null);
          }}
        />
      )}

    </div>
  );
}
