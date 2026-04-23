//components\FeaturedProductsSlider.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, ChevronLeft, ChevronRight,  BadgePercent, Zap,BellRing, Heart, CircleOff, PackageX, Award, Badge, Coins, AwardIcon } from "lucide-react";
import { useState, useEffect,useMemo } from "react";
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
import GenderBadge from "@/components/shared/GenderBadge";

import { useRouter } from "next/navigation";
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
}
interface Product {
  orderMinimumQuantity?: number;
orderMaximumQuantity?: number;
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  averageRating?: number;
  reviewCount?: number;
  images?: { imageUrl: string }[];
  vatExempt?: boolean;
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


export default function FeaturedProductsSlider({
  products,
  baseUrl,
  title = "Top Selling Products",
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
const flattenedProducts = useMemo(() => {
  return flattenProductsForListing(products);
}, [products]);

const [vatRates, setVatRates] = useState<any[]>([]);
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

const handleBuyNow = (
  product: Product,
  defaultVariant: Variant | undefined,
  basePrice: number,
  finalPrice: number,
  discountAmount: number,
   cardSlug: string
) => {
 const finalQty = getInitialQty(product);

const vatRate =
  !product.vatExempt && (product as any).vatRateId
    ? vatRates.find(v => v.id === (product as any).vatRateId)?.rate ?? null
    : null;
const selected = defaultVariant ?? null;

const stockQty =
  selected?.stockQuantity ??
  (product as any).stockQuantity ??
  0;

const maxQty = (product as any).orderMaximumQuantity ?? Infinity;

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
      discountAmount: discountAmount,
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



useEffect(() => {
  const fetchVatRates = async () => {
    try {
      const res = await fetch("https://testapi.knowledgemarkg.com/api/VATRates?activeOnly=true");
      const json = await res.json();
      setVatRates(json.data || []);
    } catch (error) {
      console.error("VAT rates error:", error);
    }
  };

  fetchVatRates();
}, []);
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
    <div className="relative w-full bg-gray-50">

      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8 text-gray-900 text-center">
        {title}
      </h2>

      <button id="prevBtn" className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0">
        <ChevronLeft className="w-8 h-8 text-gray-700" />
      </button>

      <button id="nextBtn" className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0">
        <ChevronRight className="w-8 h-8 text-gray-700" />
      </button>

      <Swiper
  modules={[Autoplay, Navigation, Pagination]}
  spaceBetween={16}
  slidesPerView={2}
  className="pb-12 featured-products-slider"
  breakpoints={{
    640: { slidesPerView: 2, spaceBetween: 16 },
    768: { slidesPerView: 3, spaceBetween: 20 },
    1024: { slidesPerView: 4, spaceBetween: 22 },
    1280: { slidesPerView: 4, spaceBetween: 24 },
  }}

  autoplay={{
    delay: 3000,
    disableOnInteraction: true, // 🔥 fix lag
    pauseOnMouseEnter: true,
  }}

  navigation={{ prevEl: "#prevBtn", nextEl: "#nextBtn" }}

  pagination={{ clickable: true, dynamicBullets: true }}

  loop={true} // 🔥 MOST IMPORTANT FIX

  watchSlidesProgress={true}
  resistanceRatio={0.85}
  touchRatio={1}
  simulateTouch={true}
 
>
        {flattenedProducts.map((item) =>  {

  const product = item.productData;
  const variantForCard = item.variantForCard;
  const cardSlug = item.cardSlug;

       const defaultVariant =
  variantForCard ??
  (product as any).variants?.find((v: any) => v.isDefault);

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


  const vatRate =
    !product.vatExempt && (product as any).vatRateId
      ? vatRates.find(v => v.id === (product as any).vatRateId)?.rate
      : null;
        
       return (
          <SwiperSlide key={variantForCard?.id ?? product.id}>

          <Card
  className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl flex flex-col flex-1 overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">


                {/* Product Image */}
                <Link href={`/products/${cardSlug}`}>
                  
                  {/* UNISEX Badge */}
                <GenderBadge gender={product.gender} />


                 <div className="group h-[176px] sm:h-[200px] md:h-[224px] flex items-center justify-center overflow-hidden bg-white rounded-t-xl pt-2 relative">
               

                  <img
  src={getProductDisplayImage(product, defaultVariant)}
  loading="lazy"
  decoding="async"
  alt={product.name}
  className="object-contain w-full h-full transform transition duration-300 md:group-hover:scale-110"
  onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.jpg")}
/>


 {/* VAT Relief — bottom left on image */}
{product.vatExempt && (
  <span className="absolute bottom-1.5 left-2 z-20 inline-flex items-center gap-0.5 text-[9px] font-semibold text-white bg-black/80 border border-black/20 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap leading-none backdrop-blur-sm">
    <BadgePercent className="h-2.5 w-2.5" />
    VAT Relief
  </span>
)}
{/* Offer badge — top right, smaller */}
{discountBadge && (
  <div className="absolute top-1 right-2 z-20">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md ring-2 ring-white">
      <div className="flex flex-col items-center leading-none">
        {discountBadge.type === "percent" ? (
          <>
            <span className="text-[10px] sm:text-xs font-extrabold">{discountBadge.value}%</span>
            <span className="text-[7px] sm:text-[8px] font-semibold">OFF</span>
          </>
        ) : (
          <>
            <span className="text-[10px] sm:text-xs font-extrabold">£{discountBadge.value}</span>
            <span className="text-[7px] sm:text-[8px] font-semibold">OFF</span>
          </>
        )}
      </div>
    </div>
  </div>
)}
{/* Coupon badge — top right, smaller */}
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
  image: getProductDisplayImage(product, defaultVariant),

  vatRate: vatRate ?? null,
  vatExempt: product.vatExempt,

  sku: defaultVariant?.sku ?? (product as any).sku,

  stockQuantity:
    defaultVariant?.stockQuantity ??
    (product as any).stockQuantity ??
    null,
});
  if (inWishlist) {
  toast.error("Product removed from wishlist");
} else {
  toast.success("Product added to wishlist!");
}
  }}
  className={`absolute z-20 right-2 p-1.5 rounded-full shadow-sm border transition-all ${
    (discountBadge || hasActiveCoupon) ? "top-12" : "top-2"
  } ${
    isInWishlist(defaultVariant?.id ?? product.id)
      ? "bg-green-50 border-green-200"
      : "bg-white border-gray-200 hover:bg-green-50 hover:border-green-200"
  }`}
>
  <Heart
    className={`h-4 w-4 transition-colors ${
      isInWishlist(defaultVariant?.id ?? product.id) ? "fill-green-500 text-green-500" : "text-gray-400 hover:text-green-400"
    }`}
  />
</button>
                </div>
                </Link>

                {/* CONTENT */}
             <div className="flex flex-col flex-grow px-1.5 md:px-3 pb-3 pt-2">

                  {/* FIXED TITLE HEIGHT */}
                 <div className="min-h-[42px] max-h-[42px] sm:min-h-[38px] sm:max-h-[38px] mb-0.5">
                    <Link href={`/products/${cardSlug}`} className="block">
                     <h3
  className="
    font-semibold text-xs md:text-sm text-gray-800 line-clamp-2
    transition-all duration-300 group-hover:text-[#445D41] 
  "
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

                  {/* RATING + REVIEW + LOYALTY — single compact row */}
               <div className="flex items-center gap-1 min-h-[20px] mb-0 flex-nowrap overflow-hidden">

  {/* ⭐ Rating badge */}
  <div className="flex items-center bg-green-600 text-white px-1 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">
    <span>{product.averageRating?.toFixed(1)}</span>
    <Star className="h-2.5 w-2.5 ml-0.5 fill-white text-white" />
  </div>

  {/* Review Count */}
  <span className="text-[10px] text-gray-500 flex-shrink-0">
    ({product.reviewCount ?? 0})
  </span>

  {/* Loyalty */}
  {loyaltyPoints && (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-0.5 py-0.5 rounded whitespace-nowrap leading-none flex-shrink-0">
      <AwardIcon className="h-2.5 w-2.5 text-green-600 flex-shrink-0" />
      Earn {loyaltyPoints} pts
    </span>
  )}

</div>



                  {/* PRICE ROW FIXED HEIGHT */}
            {/* PRICE + LOYALTY (SAME RESERVED SPACE) */}
<div className="min-h-[30px] mt-1 mb-0 flex flex-col justify-center">

  {/* PRICE ROW */}
  <div className="flex items-center gap-1 sm:gap-2">
    <span className="text-lg font-bold text-[#445D41] leading-none">
      £{finalPrice.toFixed(2)}
    </span>
    {discountBadge && (
      <span className="text-xs text-gray-400 line-through leading-none">
        £{basePrice.toFixed(2)}
      </span>
    )}
    {!product.vatExempt && vatRate !== null && (
      <span className="text-[8px] sm:text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded whitespace-nowrap leading-none">
        {vatRate}% VAT
      </span>
    )}
  </div>



</div>

{/* ACTION BUTTONS */}
<div className="mt-auto flex items-center gap-1 md:gap-2 pt-1.5">

  {/* ⭐ CASE: IN STOCK OR CAN BUY */}
  {backorderState.canBuy && (
    <>
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
    discountAmount: discountAmount,
    quantity: finalQty,
      // ✅ ADD THESE 👇
 vatRate: vatRate,
vatIncluded: vatRate !== null,
    image: getProductDisplayImage(product, defaultVariant),
    sku: defaultVariant?.sku ?? product.sku,
    shipSeparately: product.shipSeparately,
    nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
    // 🔥🔥🔥 MAIN FIX
nextDayDeliveryFree:
  (product as any).nextDayDeliveryFree ?? false,
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
  className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-[#445D41] hover:bg-black hover:text-white transition shadow-sm"
>
 Cart→
</button>
  </div>
);
}

}}

        className="flex-[0.47] md:flex-1 text-[9px] md:text-sm py-1.5 md:py-2 whitespace-nowrap flex items-center justify-center gap-1 md:gap-2
    bg-[#445D41] hover:bg-black text-white
    disabled:opacity-60 disabled:cursor-not-allowed"
>
        <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
        Add
      </Button>

      {/* BUY NOW */}
     <Button
  disabled={product.disableBuyButton === true}
  onClick={() => {
    if (product.disableBuyButton) return;

  // 🔥 PHARMA PRODUCT GUARD
  if (product.isPharmaProduct) {
    setPharmaModal({
      product,
      variant: defaultVariant,
      action: "BUY_NOW",
      basePrice,
      finalPrice,
      discountAmount,
      cardSlug,
    });
    return;
  }
    handleBuyNow(
      product,
      defaultVariant,
      basePrice,
      finalPrice,
      discountAmount,
      cardSlug
    );
  }}
  className="flex-[0.47] md:flex-1 text-[9px] md:text-sm py-1.5 md:py-2 whitespace-nowrap flex items-center justify-center gap-1 md:gap-2
    bg-black border border-[#445D41] text-white hover:bg-[#445D41]
    disabled:opacity-60 disabled:cursor-not-allowed"
>
        <Zap className="h-3 w-3 md:h-4 md:w-4" />
        Buy
      </Button>
    </>
  )}

  {/* ⭐ CASE: BACKORDER NOTIFY MODE */}
  {backorderState.showNotify && (
    <>
      {/* ADD TO CART KE JAGAH NOTIFY */}
      <Button
        variant="outline"
        className="w-full text-xs md:text-xs border border-green-500 text-green-700 hover:bg-green-50"
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
        className="w-full text-xs md:text-sm rounded-lg py-2 bg-red-500 cursor-not-allowed text-white"
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
const modalVatRate =
  !product.vatExempt && (product as any).vatRateId
    ? vatRates.find(v => v.id === (product as any).vatRateId)?.rate ?? null
    : null;

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
    nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
    // 🔥🔥🔥 MAIN FIX
nextDayDeliveryFree:
  (product as any).nextDayDeliveryFree ?? false,
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
      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white text-[#445D41] hover:bg-black hover:text-white transition shadow-sm"
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
