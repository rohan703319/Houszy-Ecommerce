// app/products/[slug]/ProductDetails.tsx
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RelatedProductCard from "@/components/product/RelatedProductCard";
import CrossSellProductCard from "@/components/product/CrossSellProductCard";
import RecentlyViewedSlider from "@/components/recently-viewed/RecentlyViewedSlider";
import BackInStockModal from "@/components/backorder/BackInStockModal";
import RatingReviews, { Review, getRecentApprovedReviews } from "@/components/product/RatingReviews";
import SubscriptionPurchaseCard from "@/components/product/SubscriptionPurchaseCard";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { getBackorderUIState } from "@/app/lib/backorderHelpers";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Heart, Star, StarHalf, Minus, Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Truck, RotateCcw, ShieldCheck, Pause, Play, Package, Bike, Users, BadgePercent, Zap, BellRing, Share2, Gift, AwardIcon, MapPin, Clock, TruckElectric, TruckElectricIcon, Pill, Share, Share2Icon, LucideShare2, ShareIcon, Bell } from "lucide-react";
import ShareMenu from "@/components/share/ShareMenu";
import { Card, CardContent } from "@/components/ui/card";
import ProductFeatures from "@/components/product/ProductFeatures";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { addRecentlyViewed } from "@/app/hooks/useRecentlyViewed";
import { normalizePrice } from "@/lib/price";
import CouponModal from "@/components/product/CouponModal";
import ProductImageModal from "@/components/product/ProductImageModal";
import { getDiscountBadge, getDiscountedPrice, } from "@/app/lib/discountHelpers";
import { usePathname } from "next/navigation";
import { detectUKRegion } from "@/app/lib/region";
// import GenderBadge from "@/components/shared/GenderBadge";
import { getOldPriceDiscount } from "@/utils/pricing";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import APlusContentRenderer from "@/components/aplus/APlusContentRenderer";
import { useCartActivity } from "@/context/CartContext";
import { trackViewItem } from "@/lib/analytics";
import { shippingService } from "@/lib/services/shipping";
// ---------- Types ----------
interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isMain: boolean;
}
interface FreeShippingThresholdDto {
  deliveryOptionId: string;
  name: string;
  displayName: string;
  threshold: number;
  displayOrder: number;
}
interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
  option3Name: string;
  option3Value: string;
  imageUrl?: string | null;
  isDefault?: boolean;
  displayOrder: number;
  slug: string;
  loyaltyPointsEarnable?: number;
  loyaltyPointsMessage?: string;
  oldPrice?: number;
  displayDiscountType?: "None" | "OldPrice" | "System";
  freeShippingThreshold?: number;
  freeShippingThresholds?: FreeShippingThresholdDto[];
  hasSystemDiscount?: boolean;

  systemDiscountAmount?: number;
  nextDayDeliveryEnabled?: boolean | null;
  nextDayDeliveryFree?: boolean | null;
  nextDayDeliveryCutoffTime?: string | null;

  fakeSaleCount?: number | null;
  saleCount?: number;
  orderMinimumQuantity?: number | null;
  orderMaximumQuantity?: number | null;
  displaySaleCount?: number;
  monthlySaleCount?: number;
  weeklySaleCount?: number;
}
interface AssignedDiscount {
  id: string;
  name: string;
  isActive: boolean;
  usePercentage: boolean;
  discountAmount: number;
  discountPercentage: number;
  maximumDiscountAmount?: number;
  startDate: string;
  endDate: string;
  requiresCouponCode: boolean;
  isCumulative?: boolean;
  couponCode?: string;
}
interface GroupedProduct {
  slug: string | undefined;
  mainImageUrl?: string;
  individualSavings: any;
  hasBundleDiscount: any;
  productId: string;
  name: string;
  shortDescription?: string;
  sku: string;
  price: number;
  stockQuantity: number;
  displayOrder?: number;
  isPublished?: boolean;
  inStock: boolean;
  bundlePrice?: number;
}
interface Product {
  orderMaximumQuantity?: number;
  orderMinimumQuantity?: number;
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice: number;
  displayDiscountType?: "None" | "OldPrice" | "System";

  hasSystemDiscount?: boolean;
  freeShippingThreshold?: number;
  freeShippingThresholds?: FreeShippingThresholdDto[];
  systemDiscountAmount?: number;
  compareAtPrice?: number | null;
  notReturnable?: boolean;
  stockQuantity: number;
  categories: {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    parentCategoryId?: string | null;
    isPrimary?: boolean;
    displayOrder?: number;
  }[];
  brandName: string;
  brandId?: string;
  brandSlug?: string;
  manufacturerName: string;
  images: ProductImage[];
  averageRating: number;
  reviewCount: number;
  tags: string;
  weight: number;
  weightUnit: string;
  videoUrls?: string;
  specificationAttributes: string;
  relatedProductIds: string;
  crossSellProductIds: string;
  variants?: Variant[];
  assignedDiscounts?: AssignedDiscount[];
  vatExempt?: boolean;
  vatRate?: number;
  gender?: string;
  isRecurring?: boolean;
  recurringCycleLength?: number;
  recurringCyclePeriod?: string;
  recurringTotalCycles?: number;
  subscriptionDiscountPercentage?: number;
  allowCustomerReviews?: boolean;
  allowBackorder?: boolean;
  backorderMode?: string;
  aPlusTemplateId?: string | null;
  aPlusContent?: string | null;
  attributes?: {
    id: string;
    name: string;
    value: string;
    displayName?: string;
    sortOrder?: number;
  }[];
  productType: "simple" | "grouped";
  requireOtherProducts: boolean;
  requiredProductIds: string;
  automaticallyAddProducts: boolean;
  groupedProducts?: GroupedProduct[];
  // 🔹 optional (backend pricing helpers)
  showIndividualPrices?: boolean;
  totalIndividualPrice?: number;
  bundlePrice?: number;
  // 🔥 GROUP / BUNDLE PRICING (BACKEND DRIVEN)
  groupBundleDiscountType?: string;
  groupBundleDiscountPercentage?: number;
  groupBundleSavingsMessage?: string;
  totalSavings?: number;
  savingsPercentage?: number;
  applyDiscountToAllItems?: boolean;
  nextDayDeliveryEnabled?: boolean;
  nextDayDeliveryFree?: boolean;
  sameDayDeliveryEnabled?: boolean;
  nextDayDeliveryCutoffTime?: string;
  standardDeliveryEnabled?: boolean;
  allowedDeliveryOptionIds?: string[];
  nextDayDeliveryCharge?: number;
  disableBuyButton?: boolean;
  disableWishlistButton?: boolean;
  excludeFromLoyaltyPoints?: boolean;
  loyaltyPointsEarnable?: number;
  loyaltyPointsMessage?: string;
  shipSeparately?: boolean;
  displayStockAvailability?: boolean;
  displayStockQuantity?: boolean;
  isPharmaProduct?: boolean;
  features?: any[];
  fakeSaleCount?: number;
  saleCount?: number;
  displaySaleCount?: number;
  monthlySaleCount?: number;
  weeklySaleCount?: number;
}
interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice: number;
  images: ProductImage[];
  isPublished?: boolean;
}
interface CrossSellProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice: number;
  images: ProductImage[];
  isPublished?: boolean;
  variants?: Variant[];
  compareAtPrice?: number | null;
  averageRating?: number;
  displayDiscountType?: "None" | "OldPrice" | "System";
  hasSystemDiscount?: boolean;
  systemDiscountAmount?: number;
  vatRate?: number | null;
  sku?: string;
  shipSeparately?: boolean;
  nextDayDeliveryEnabled?: boolean;
  sameDayDeliveryEnabled?: boolean;
}
interface ProductDetailsProps {
  product: Product | null;
  initialVariantId?: string | null;
  aplusTemplate?: any | null;
  aplusContent?: string | null;
  isAdminPreview?: boolean;
}
type BreadcrumbCategory = {
  name: string;
  slug: string;
};
function buildCategoryBreadcrumb(
  categories?: Product["categories"]
): BreadcrumbCategory[] {
  if (!categories || categories.length === 0) return [];
  const map = new Map(
    categories.map(c => [c.categoryId, c])
  );
  const primary =
    categories.find(c => c.isPrimary === true) ??
    categories.sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    )[0];
  if (!primary) return [];
  const chain: BreadcrumbCategory[] = [];
  let current: typeof primary | undefined = primary;
  while (current) {
    chain.unshift({
      name: current.categoryName,
      slug: current.categorySlug,
    });

    if (!current.parentCategoryId) break;

    current = map.get(current.parentCategoryId);
  }
  return chain;
}
const resolveBasePrice = (
  product: Product,
  variant?: Variant | null
) => {
  if (
    variant &&
    typeof variant.price === "number" &&
    variant.price > 0
  ) {
    return variant.price;
  }
  return product.price;
};

const getYouTubeEmbedUrl = (url: string) => {
  try {
    let videoId = "";
    if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
    } else if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("youtube.com/watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

// ---------- Skeletons ----------
const RelatedProductSkeleton = () => {
  return (
    <div className="relative border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col bg-white animate-pulse h-full min-h-[350px]">
      {/* IMAGE PLACEHOLDER */}
      <div className="h-[176px] sm:h-[200px] md:h-[224px] bg-gray-100 rounded-lg w-full mb-3" />
      {/* TITLE PLACEHOLDER */}
      <div className="h-3.5 bg-gray-150 rounded w-11/12 mb-2" />
      <div className="h-3.5 bg-gray-150 rounded w-2/3 mb-3" />
      {/* RATING PLACEHOLDER */}
      <div className="flex gap-2 items-center mb-3">
        <div className="h-4 bg-gray-150 rounded w-8" />
        <div className="h-3 bg-gray-150 rounded w-10" />
      </div>
      {/* PRICE PLACEHOLDER */}
      <div className="h-5 bg-gray-150 rounded w-20 mb-4" />
      {/* BUTTONS PLACEHOLDER */}
      <div className="flex gap-2 mt-auto items-center">
        <div className="h-8 bg-gray-150 rounded w-14" />
        <div className="h-8 bg-gray-150 rounded flex-1" />
      </div>
    </div>
  );
};

// ---------- Component ----------
const LiveCartActivityBanner = ({ activity }: { activity: { message: string, timestamp: number } | null }) => {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (activity) {
      setMsg(activity.message.replace(/^🔥\s*/, '')); // Strip generic emoji
      setShow(true);
    } else {
      setShow(false);
    }
  }, [activity]);

  return (
    <>
      <style>{`
        @keyframes heightExpand {
          0% { max-height: 0; margin-top: 0; opacity: 0; }
          100% { max-height: 60px; margin-top: 12px; opacity: 1; }
        }
        @keyframes heightCollapse {
          0% { max-height: 60px; margin-top: 12px; opacity: 1; }
          100% { max-height: 0; margin-top: 0; opacity: 0; }
        }
        @keyframes powerPop {
          0% { transform: scale(0.95) translateY(-10px); opacity: 0; filter: blur(2px); }
          50% { transform: scale(1.02) translateY(2px); opacity: 1; filter: blur(0); }
          75% { transform: scale(0.99) translateY(-1px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes powerZip {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          30% { transform: scale(1.02) translateY(2px); opacity: 1; }
          100% { transform: scale(0.95) translateY(-15px); opacity: 0; filter: blur(2px); }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.2); }
        }
        .outer-enter {
          animation: heightExpand 0.3s ease-out forwards;
        }
        .outer-exit {
          animation: heightCollapse 0.3s ease-in forwards;
          animation-delay: 0.2s; /* wait for inner zip out */
        }
        .inner-enter {
          animation: powerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.1s; /* wait slightly for container to open */
          opacity: 0; /* hidden before animation starts */
        }
        .inner-exit {
          animation: powerZip 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
        }
      `}</style>

      <div className={`overflow-hidden w-full ${show ? 'outer-enter' : (msg ? 'outer-exit' : 'hidden')}`}>
        <div className={`flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-gray-900 via-[#9d7822] to-[#f38918] px-3.5 py-2.5 shadow-[0_6px_20px_rgba(42,63,40,0.3)] border border-white/10 ${show ? 'inner-enter' : 'inner-exit'}`}>

          {/* Left Side: Icon & Message */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-8 w-8 items-center justify-center shrink-0" style={{ animation: 'iconPulse 1.2s infinite ease-in-out' }}>
              <div className="absolute inset-0 rounded-full bg-yellow-500 blur-[3px] opacity-40"></div>
              {/* Dark Background for Fire Icon */}
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gray-900 border border-yellow-500/40 shadow-[0_0_8px_rgba(250,204,21,0.5)] text-[14px]">
                🔥
              </div>
            </div>

            <p className="text-[13px] md:text-[14px] font-bold text-white tracking-wide drop-shadow-sm truncate">
              {msg}
            </p>
          </div>

          {/* Right Side: Professional FOMO Indicator */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 shrink-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-black">
              High Demand
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default function ProductDetails({
  product,
  initialVariantId,
  aplusTemplate,
  aplusContent,
  isAdminPreview = false,
}: ProductDetailsProps & { initialVariantId?: string }) {
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product unavailable</p>
      </div>
    );
  }

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  console.log("🧪 productType:", product.productType);
  console.log("🧪 requireOtherProducts:", product.requireOtherProducts);
  console.log("🧪 groupedProducts:", product.groupedProducts);
  const toast = useToast();
  const { addToCart, cart, cartActivity } = useCart();

  const router = useRouter();
  useCartActivity(product.id);
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const sliderRef = useRef<HTMLDivElement>(null);

  // Find first active assigned discount to link to its offer page
  const activeDiscountForOffer = useMemo(() => {
    if (!product.assignedDiscounts || product.assignedDiscounts.length === 0) return null;
    const now = new Date();
    return product.assignedDiscounts.find(d =>
      d.isActive &&
      (!d.startDate || new Date(d.startDate) <= now) &&
      (!d.endDate || new Date(d.endDate) >= now)
    ) || product.assignedDiscounts[0];
  }, [product.assignedDiscounts]);

  // Convert discount name to URL slug
  const discountSlug = useMemo(() => {
    if (!activeDiscountForOffer || !activeDiscountForOffer.name) return "";
    return activeDiscountForOffer.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [activeDiscountForOffer]);

  // Normal purchase quantity state
  const [normalQty, setNormalQty] = useState(
    product.orderMinimumQuantity ?? 1
  );
  const [normalStockError, setNormalStockError] = useState<string | null>(null);
  // Subscription purchase quantity state
  const [subscriptionQty, setSubscriptionQty] = useState(1);

  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDeliveryOptions = async () => {
      try {
        const res = await shippingService.getDeliveryOptions({ includeInactive: false });
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setDeliveryOptions(data);
      } catch (error) {
        console.error("Error fetching delivery options:", error);
      }
    };
    fetchDeliveryOptions();
  }, []);

  const allowedOptions = useMemo(() => {
    if (!deliveryOptions || deliveryOptions.length === 0) return [];

    const restrictionIds = product.allowedDeliveryOptionIds || [];
    if (restrictionIds.length === 0) {
      return deliveryOptions;
    }

    return deliveryOptions.filter((opt) => restrictionIds.includes(opt.id));
  }, [deliveryOptions, product.allowedDeliveryOptionIds]);
  const [subscriptionStockError, setSubscriptionStockError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [thumbVisible, setThumbVisible] = useState(4);
  useEffect(() => {
    const update = () => setThumbVisible(4);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [hasTriggeredRelatedFetch, setHasTriggeredRelatedFetch] = useState(false);
  const relatedSectionRef = useRef<HTMLDivElement | null>(null);
  const [crossSellProducts, setCrossSellProducts] = useState<CrossSellProduct[]>([]);
  const [openDescriptionSections, setOpenDescriptionSections] = useState<{ [key: number]: boolean }>({});
  const shouldShowRelatedNav = relatedProducts.length > 4;
  const shouldShowCrossNav = crossSellProducts.length > 4;
  const [activeTab, setActiveTab] = useState<"description" | "delivery">("description");
  const [purchaseType, setPurchaseType] = useState<"one" | "subscription">("one");
  // Use vatRate directly from API response
  const vatRate: number | null = (product as any).vatRate ?? null;
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // 🔥 Coupon Available (but not applied)
  const hasCouponAvailable = useMemo(() => {
    if (!product.assignedDiscounts) return false;
    const now = new Date();
    return product.assignedDiscounts.some(d =>
      d.isActive &&
      d.requiresCouponCode === true &&
      new Date(d.startDate) <= now &&
      new Date(d.endDate) >= now
    );
  }, [product.assignedDiscounts]);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "";
  const shareTitle = product.name;
  const handleShareClick = async () => {
    const url = window.location.href;

    // ✅ Mobile → only native share
    if (window.innerWidth < 768 && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url,
        });
      } catch {
        // user cancelled → do nothing
      }
      return;
    }

    // ✅ Desktop → custom share menu
    setShowShare((v) => !v);
  };
  const [isUKUser, setIsUKUser] = useState(false);
  useEffect(() => {
    let cancelled = false;
    detectUKRegion().then((uk) => {
      if (!cancelled) setIsUKUser(uk);
    });
    return () => { cancelled = true; };
  }, []);
  const formatUKDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const effectiveNextDayEnabled = selectedVariant
    ? selectedVariant.nextDayDeliveryEnabled === true
    : !!product.nextDayDeliveryEnabled;

  const effectiveNextDayCutoff = selectedVariant
    ? selectedVariant.nextDayDeliveryCutoffTime
    : product.nextDayDeliveryCutoffTime;

  const effectiveNextDayFree = selectedVariant
    ? selectedVariant.nextDayDeliveryFree === true
    : !!product.nextDayDeliveryFree;

  const hasVariantFakeOverride = !!selectedVariant && selectedVariant.fakeSaleCount !== null && selectedVariant.fakeSaleCount !== undefined;

  const activeWeeklySaleCount = selectedVariant
    ? (selectedVariant.weeklySaleCount || 0)
    : (product.weeklySaleCount || 0);

  const activeMonthlySaleCount = selectedVariant
    ? (selectedVariant.monthlySaleCount || 0)
    : (product.monthlySaleCount || 0);

  const activeDisplaySaleCount = selectedVariant
    ? (selectedVariant.saleCount || 0)
    : (product.saleCount || 0);

  const soldText = activeWeeklySaleCount > 0
    ? `${activeWeeklySaleCount} qty sold this week`
    : activeMonthlySaleCount > 0
      ? `${activeMonthlySaleCount} qty sold this month`
      : activeDisplaySaleCount > 0
        ? `${activeDisplaySaleCount} qty sold`
        : null;

  const [shipDate, setShipDate] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [nextDayTimeLeft, setNextDayTimeLeft] = useState<string | null>(null);
  useEffect(() => {
    if (
      !isUKUser ||
      !effectiveNextDayEnabled ||
      !effectiveNextDayCutoff
    ) {
      setNextDayTimeLeft(null);
      setShipDate(null);
      setDeliveryDate(null);
      return;
    }
    const calculateTimeLeft = () => {
      const now = new Date();
      let cutoffHour = 14;
      let cutoffMinute = 0;
      if (effectiveNextDayCutoff && effectiveNextDayCutoff.includes(":")) {
        const parsed = effectiveNextDayCutoff.split(":").map(Number);
        if (parsed.length >= 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
          cutoffHour = parsed[0];
          cutoffMinute = parsed[1];
        }
      }

      const cutoffToday = new Date(now);
      cutoffToday.setHours(cutoffHour, cutoffMinute, 0, 0);

      const isBeforeCutoff = now < cutoffToday;
      let targetCutoff = new Date(cutoffToday);
      let shipDateObj = new Date(now);

      const todayDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      if (todayDay === 6) { // Saturday
        if (isBeforeCutoff) {
          // Ships today (Saturday), target is today cutoff
          shipDateObj = new Date(now);
          targetCutoff = new Date(cutoffToday);
        } else {
          // Ships Monday, target is Monday cutoff
          shipDateObj = new Date(now);
          shipDateObj.setDate(shipDateObj.getDate() + 2); // Monday
          targetCutoff = new Date(shipDateObj);
          targetCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);
        }
      } else if (todayDay === 0) { // Sunday
        // Ships Monday, target is Monday cutoff
        shipDateObj = new Date(now);
        shipDateObj.setDate(shipDateObj.getDate() + 1); // Monday
        targetCutoff = new Date(shipDateObj);
        targetCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);
      } else { // Monday to Friday
        if (isBeforeCutoff) {
          // Ships today, target is today cutoff
          shipDateObj = new Date(now);
          targetCutoff = new Date(cutoffToday);
        } else {
          // Ships tomorrow (next working day)
          shipDateObj = new Date(now);
          shipDateObj.setDate(shipDateObj.getDate() + 1);
          // If tomorrow is Sunday, ships Monday
          if (shipDateObj.getDay() === 0) {
            shipDateObj.setDate(shipDateObj.getDate() + 1);
          }
          targetCutoff = new Date(shipDateObj);
          targetCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);
        }
      }

      const diffMs = targetCutoff.getTime() - now.getTime();
      if (diffMs <= 0) {
        setNextDayTimeLeft("0 sec");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? "s" : ""}`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);
      parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);
      setNextDayTimeLeft(parts.join(" "));

      const todayString = now.toDateString();
      const tomorrowObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowString = tomorrowObj.toDateString();

      const shipString = shipDateObj.toDateString();
      let shipPrefix = "";
      if (shipString === todayString) {
        shipPrefix = "Today";
      } else if (shipString === tomorrowString) {
        shipPrefix = "Tomorrow";
      } else {
        shipPrefix = shipDateObj.toLocaleDateString("en-GB", { weekday: "long" });
      }
      setShipDate(`${shipPrefix} • ${formatUKDate(shipDateObj)}`);

      let deliverDateObj = new Date(shipDateObj);
      deliverDateObj.setDate(deliverDateObj.getDate() + 1);
      // If delivery is Sunday, push to Monday
      if (deliverDateObj.getDay() === 0) {
        deliverDateObj.setDate(deliverDateObj.getDate() + 1);
      }

      const deliverString = deliverDateObj.toDateString();
      let deliverPrefix = "";
      if (deliverString === todayString) {
        deliverPrefix = "Today";
      } else if (deliverString === tomorrowString) {
        deliverPrefix = "Tomorrow";
      } else {
        deliverPrefix = deliverDateObj.toLocaleDateString("en-GB", { weekday: "long" });
      }
      setDeliveryDate(`${deliverPrefix} • ${formatUKDate(deliverDateObj)}`);
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [
    isUKUser,
    effectiveNextDayEnabled,
    effectiveNextDayCutoff,
  ]);
  // 🔥 PHARMA MODAL STATE
  const [showPharmaModal, setShowPharmaModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cart" | "buy" | null>(null);
  const pharmaApprovedRef = useRef(false);

  const handlePharmaGuard = (action: "cart" | "buy") => {
    // ✅ already approved → skip guard
    if (pharmaApprovedRef.current) {
      return true;
    }
    if (product.isPharmaProduct) {
      setPendingAction(action);
      setShowPharmaModal(true);
      return false;
    }
    return true;
  };
  // 🔹 GROUPED PRODUCT FLAGS
  const isGroupedProduct =
    product.productType === "grouped" &&
    product.requireOtherProducts === true;
  // 🔹 REQUIRED PRODUCT IDS (backend string → array)
  const requiredProductIds = useMemo(() => {
    if (!product.requiredProductIds) return [];
    return product.requiredProductIds.split(",").map(id => id.trim());
  }, [product.requiredProductIds]);
  // 🔥 BUNDLE TOTALS (QUANTITY AWARE)
  const bundleIndividualTotal = useMemo(() => {
    if (typeof product.totalIndividualPrice === "number") {
      return product.totalIndividualPrice * normalQty;
    }
    if (!product.groupedProducts) return 0;
    return product.groupedProducts.reduce(
      (sum, gp) => sum + gp.price * normalQty,
      0
    );
  }, [product.totalIndividualPrice, product.groupedProducts, normalQty]);

  const bundleTotalPrice = useMemo(() => {
    if (typeof product.bundlePrice === "number") {
      return product.bundlePrice * normalQty;
    }
    if (!product.groupedProducts) return 0;
    return product.groupedProducts.reduce(
      (sum, gp) => sum + (gp.bundlePrice ?? gp.price) * normalQty,
      0
    );
  }, [product.bundlePrice, product.groupedProducts, normalQty]);

  const bundleTotalSavings = useMemo(() => {
    if (typeof product.totalSavings === "number") {
      return product.totalSavings * normalQty;
    }
    return bundleIndividualTotal - bundleTotalPrice;
  }, [product.totalSavings, bundleIndividualTotal, bundleTotalPrice, normalQty]);
  // Discount & coupon states
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AssignedDiscount | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(() => product?.price ?? 0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const viewItemTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    const signature = `${product.id}:${selectedVariant?.id ?? "base"}`;
    if (viewItemTrackedRef.current === signature) return;

    viewItemTrackedRef.current = signature;
    trackViewItem(product, selectedVariant);
  }, [product, product.id, selectedVariant]);
  // 🔥 GROUP LEVEL TOGGLE (single source of truth)
  const [groupEnabled, setGroupEnabled] = useState<boolean>(() => {
    return product.automaticallyAddProducts ? true : true;
  });
  const [groupedSelections, setGroupedSelections] = useState<{
    [productId: string]: {
      selected: boolean;
      quantity: number;
    };
  }>({});
  // 🔥 GROUPED STOCK AWARE MAX QTY
  const groupedMaxQty = useMemo(() => {
    if (
      !isGroupedProduct ||
      !groupEnabled ||
      !product.groupedProducts
    ) {
      return selectedVariant?.stockQuantity ?? product.stockQuantity;
    }
    const selectedGrouped = product.groupedProducts.filter(
      gp => groupedSelections[gp.productId]?.selected
    );
    if (selectedGrouped.length === 0) {
      return selectedVariant?.stockQuantity ?? product.stockQuantity;
    }
    const minGroupedStock = Math.min(
      ...selectedGrouped.map(gp => gp.stockQuantity ?? Infinity)
    );
    const mainStock =
      selectedVariant?.stockQuantity ?? product.stockQuantity;
    return Math.min(mainStock, minGroupedStock);
  }, [
    isGroupedProduct,
    groupEnabled,
    product.groupedProducts,
    groupedSelections,
    selectedVariant,
    product.stockQuantity,
  ]);

  useEffect(() => {
    if (!isGroupedProduct || !groupEnabled) return;
    setGroupedSelections(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(pid => {
        updated[pid] = {
          ...updated[pid],
          quantity: Math.min(normalQty, groupedMaxQty),
        };
      });
      return updated;
    });
  }, [normalQty, groupedMaxQty, isGroupedProduct, groupEnabled]);
  const pathname = usePathname();
  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) return;

    // current slug from URL
    const currentSlug = pathname.split("/product/")[1];

    if (!currentSlug) return;

    // find matching variant
    const matchedVariant = product.variants.find(
      (v) => v.slug === currentSlug
    );

    if (!matchedVariant) return;

    // 🔥 prevent unnecessary re-renders
    if (selectedVariant?.id === matchedVariant.id) return;

    // ✅ update state from URL
    setSelectedVariant(matchedVariant);
    setSelectedOptions({
      option1: matchedVariant.option1Value,
      option2: matchedVariant.option2Value,
      option3: matchedVariant.option3Value,
    });

  }, [pathname, product.variants]);
  // GENERIC dynamic selected options
  const [selectedOptions, setSelectedOptions] = useState<{
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
  }>({});
  // Currently selected variant
  useEffect(() => {
    if (!initialVariantId) return;
    if (product.variants && product.variants.length > 0) {
      const v = product.variants.find(x => x.id === initialVariantId);

      if (v) {
        setSelectedVariant(v);
        setSelectedOptions({
          option1: v.option1Value,
          option2: v.option2Value,
          option3: v.option3Value,
        });
      }
    }
  }, [initialVariantId, product]);
  // 🎁 LOYALTY POINTS (PRODUCT + VARIANT AWARE)
  const loyaltyPoints = useMemo(() => {
    // ❌ Globally disabled
    if (product.excludeFromLoyaltyPoints) return null;
    // ✅ Variant priority
    if (selectedVariant?.loyaltyPointsEarnable) {
      return selectedVariant.loyaltyPointsEarnable;
    }
    // ✅ Product fallback
    if (product.loyaltyPointsEarnable) {
      return product.loyaltyPointsEarnable;
    }
    return null;
  }, [product.excludeFromLoyaltyPoints, product.loyaltyPointsEarnable, selectedVariant]);

  useEffect(() => {
    if (!isGroupedProduct || !product.groupedProducts) return;

    const initialState: {
      [productId: string]: { selected: boolean; quantity: number };
    } = {};

    product.groupedProducts.forEach(gp => {
      initialState[gp.productId] = {
        selected: product.automaticallyAddProducts ? true : groupEnabled,
        quantity: 1,
      };
    });
    setGroupedSelections(initialState);
  }, [isGroupedProduct, product, groupEnabled]);

  useEffect(() => {
    if (product.automaticallyAddProducts) {
      setGroupEnabled(true);
    }
  }, [product.automaticallyAddProducts]);
  const relatedSwiperRef = useRef<any>(null);
  const crossSwiperRef = useRef<any>(null);
  // Update URL WITHOUT re-triggering auto-select
  const updateVariantInUrl = useCallback(
    (variant: Variant) => {
      const newPath = `/product/${variant.slug}`;
      if (pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    },
    [pathname]
  );
  // 🔹 Reviews for PDP hover tooltip
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!product?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ProductReviews/product/${product.id}`)
      .then(res => res.json())
      .then(json => {
        setReviews(json?.data ?? []);
      })
      .catch(() => { });
  }, [product.id]);
  const recentReviews = useMemo(
    () => getRecentApprovedReviews(reviews),
    [reviews]
  );
  //Recently viewed
  useEffect(() => {
    addRecentlyViewed(product.id);
  }, [product.id]);
  // ---- DEFAULT VARIANT AUTO SELECT ----
  useEffect(() => {
    // ⛔ If URL provided variant ID → do NOT auto load default
    if (initialVariantId && product.variants && product.variants.length > 0) {
      return;
    }
    // ⛔ If selectedVariant already set → do NOT override
    if (selectedVariant) return;
    // ⛔ No variants → do nothing
    if (!product.variants || product.variants.length === 0) return;
    // ✅ Safe load default on first page only
    const def = product.variants.find(v => v.isDefault) ?? product.variants[0];
    setSelectedVariant(def);
    setSelectedOptions({
      option1: def.option1Value ?? null,
      option2: def.option2Value ?? null,
      option3: def.option3Value ?? null,
    });

  }, [product.variants, selectedVariant, initialVariantId]);

  useEffect(() => {
    // if URL already has initialVariant → do NOT update URL
    if (initialVariantId) return;
    // if variant not loaded yet → wait
    if (!selectedVariant) return;
    // push slug to URL (first load only)
    if (selectedVariant.slug) {
      window.history.replaceState(null, '', `/product/${selectedVariant.slug}`);
    }
  }, [selectedVariant, initialVariantId]);
  // ---- UNIVERSAL HANDLER ----
  const updateSelection = (level: 1 | 2 | 3, value: string) => {
    const updated = {
      ...selectedOptions,
      [`option${level}`]: value,
    };
    // Reset lower-level options when changing higher level ones
    if (level === 1) {
      updated.option2 = null;
      updated.option3 = null;
    }
    if (level === 2) {
      updated.option3 = null;
    }
    // AUTO CALCULATE VALID NEXT OPTIONS
    const validNext = product.variants?.filter(v =>
      v.option1Value === updated.option1 &&
      (!updated.option2 || v.option2Value === updated.option2)
    );
    // AUTO SELECT option2 if only one available
    if (level === 1 && validNext) {
      const colors = [...new Set(validNext.map(v => v.option2Value))];
      if (colors.length === 1) updated.option2 = colors[0];
    }
    // AUTO SELECT option3 if only one available
    const validThird = product.variants?.filter(v =>
      v.option1Value === updated.option1 &&
      v.option2Value === updated.option2
    );

    if (validThird) {
      const rams = [...new Set(validThird.map(v => v.option3Value))];
      if (rams.length === 1) updated.option3 = rams[0];
    }
    setSelectedOptions(updated);
    // 🔥 OPTION-C (FINAL): auto pick closest valid FULL variant (works for 1/2/3 options)
    const autoMatch = product.variants
      ?.filter(v =>
        (!updated.option1 || v.option1Value === updated.option1) &&
        (!updated.option2 || v.option2Value === updated.option2) &&
        (!updated.option3 || v.option3Value === updated.option3)
      )
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0];

    if (autoMatch) {
      setSelectedOptions({
        option1: autoMatch.option1Value ?? null,
        option2: autoMatch.option2Value ?? null,
        option3: autoMatch.option3Value ?? null,
      });

      setSelectedVariant(autoMatch);
      setNormalQty(product.orderMinimumQuantity ?? 1);
      updateVariantInUrl(autoMatch);
    }
  };
  // Reset state when product changes
  useEffect(() => {
    setSelectedImage(0);
    setNormalQty(product.orderMinimumQuantity ?? 1);
    setShowImageModal(false);
    setActiveTab("description");
    setRelatedProducts([]);
    setHasTriggeredRelatedFetch(false);
    setIsLoadingRelated(false);
    setCouponCode("");
    setAppliedCoupon(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);
  // ✅ HANDLE URL HASH (#reviews) → EMAIL / DIRECT LINK SUPPORT
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.hash === "#reviews") {
      const scrollToReviews = () => {
        const el = document.getElementById("reviews-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      };

      // 🔥 double attempt (important for SSR + hydration timing)
      setTimeout(scrollToReviews, 300);
      setTimeout(scrollToReviews, 800);
    }
  }, [product.id]);
  const basePrice = useMemo(() => {
    if (selectedVariant && typeof selectedVariant.price === "number" && selectedVariant.price > 0) {
      return selectedVariant.price;
    }
    return product?.price ?? 0;
  }, [selectedVariant, product]);
  const activeAutoDiscount = useMemo(() => {
    if (!product.assignedDiscounts) return null;

    const now = new Date();

    return product.assignedDiscounts.find(
      d =>
        d.isActive &&
        d.requiresCouponCode === false &&
        new Date(d.startDate) <= now &&
        new Date(d.endDate) >= now
    ) ?? null;
  }, [product.assignedDiscounts]);
  const isStackedDiscount = useMemo(() => {
    if (!appliedCoupon) return false;
    if (!activeAutoDiscount) return false;
    return appliedCoupon.isCumulative === true;
  }, [appliedCoupon, activeAutoDiscount]);
  const autoDiscountedPrice = useMemo(() => {
    return getDiscountedPrice(product, basePrice);
  }, [product, basePrice]);

  // 🔥 OLD PRICE FALLBACK (PDP SAFE)
  const oldPriceValue =
    selectedVariant?.compareAtPrice ?? selectedVariant?.oldPrice ??
    product.compareAtPrice ?? product.oldPrice;

  const currentDisplayType =
    selectedVariant?.displayDiscountType ??
    product.displayDiscountType ??
    "None";

  const currentSystemDiscountAmount =
    selectedVariant?.systemDiscountAmount ??
    product.systemDiscountAmount ??
    0;

  // 🔥 OLD PRICE DATA — null when:
  // 1. displayDiscountType is not "OldPrice"
  // 2. Product has requiresCouponCode discount (hasCouponAvailable) — coupon products must NEVER show old price
  // 3. There is an active auto discount
  const oldPriceData =
    currentDisplayType === "OldPrice" && !hasCouponAvailable
      ? getOldPriceDiscount(
        basePrice,
        oldPriceValue,
        false
      )
      : null;
  // ✅ STOCK (variant aware)
  const stock = useMemo(() => {
    return selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  }, [selectedVariant, product.stockQuantity]);
  // ✅ STOCK DISPLAY LOGIC (backend driven)
  const stockDisplay = useMemo(() => {
    // ❌ Always dominant
    if (stock === 0) {
      return {
        show: true,
        text: "Out of Stock",
        type: "out",
      };
    }
    // ✅ Exact quantity has highest priority
    if (product.displayStockQuantity === true) {
      if (stock <= 5) {
        return {
          show: true,
          text: `Only ${stock} left`,
          type: "low",
        };
      }
      return {
        show: true,
        text: `${stock} available`,
        type: "in",
      };
    }
    // ✅ Generic availability
    if (product.displayStockAvailability === true) {
      return {
        show: true,
        text: "In Stock",
        type: "in",
      };
    }
    // ❌ Nothing to show
    return {
      show: false,
      text: "",
      type: "none",
    };
  }, [
    stock,
    product.displayStockAvailability,
    product.displayStockQuantity,
  ]);
  // ✅ BACKORDER UI STATE (single source of truth)
  const backorderState = useMemo(() => {
    return getBackorderUIState({
      stock,
      allowBackorder: product.allowBackorder,
      backorderMode: product.backorderMode,
    });
  }, [stock, product.allowBackorder, product.backorderMode]);

  // 🔥 FINAL PRICE CALCULATION (Single Source of Truth)
  // 🔥 FINAL PRICE CALCULATION (Single Source of Truth)
  useEffect(() => {

    // 🥇 COUPON APPLIED
    if (appliedCoupon) {

      let autoAmount = 0;

      // check auto discount
      if (activeAutoDiscount) {
        if (activeAutoDiscount.usePercentage) {
          autoAmount = (basePrice * activeAutoDiscount.discountPercentage) / 100;
        } else {
          autoAmount = activeAutoDiscount.discountAmount;
        }
      }

      // coupon discount from backend
      const couponAmount = appliedCoupon.discountAmount;

      let totalDiscount = couponAmount;

      // 🔥 CUMULATIVE LOGIC
      if (appliedCoupon.isCumulative && activeAutoDiscount) {
        totalDiscount = couponAmount + autoAmount;
      }

      const final = +(basePrice - totalDiscount).toFixed(2);

      setFinalPrice(final);
      setDiscountAmount(+(basePrice - final).toFixed(2));
      return;
    }

    // 🥈 AUTO DISCOUNT ONLY
    if (activeAutoDiscount) {
      let autoAmount = 0;

      if (activeAutoDiscount.usePercentage) {
        autoAmount = (basePrice * activeAutoDiscount.discountPercentage) / 100;
      } else {
        autoAmount = activeAutoDiscount.discountAmount;
      }

      const autoFinal = +(basePrice - autoAmount).toFixed(2);

      setFinalPrice(autoFinal);
      setDiscountAmount(+(basePrice - autoFinal).toFixed(2));
      return;
    }

    // 🥉 NO DISCOUNT
    setFinalPrice(basePrice);
    setDiscountAmount(0);

  }, [basePrice, appliedCoupon, activeAutoDiscount]);

  const discountPercentage = useMemo(() => {
    if (appliedCoupon) {
      return basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
    }
    if (currentDisplayType === "System") {
      return basePrice > 0 ? Math.round((currentSystemDiscountAmount / basePrice) * 100) : 0;
    }
    if (activeAutoDiscount) {
      return activeAutoDiscount.usePercentage
        ? activeAutoDiscount.discountPercentage
        : Math.round((activeAutoDiscount.discountAmount / (selectedVariant?.price ?? product.price)) * 100);
    }
    if (currentDisplayType === "OldPrice" && oldPriceData) {
      return oldPriceData.discount;
    }
    return 0;
  }, [appliedCoupon, basePrice, discountAmount, currentDisplayType, currentSystemDiscountAmount, activeAutoDiscount, selectedVariant, product.price, oldPriceData]);

  const allRequiredSelected = useMemo(() => {
    if (!isGroupedProduct) return true;
    return requiredProductIds.every(
      id => groupedSelections[id]?.selected === true
    );
  }, [isGroupedProduct, requiredProductIds, groupedSelections]);

  // Reset description accordion states when product changes
  useEffect(() => {
    setOpenDescriptionSections({});
  }, [product.id]);

  const parsedDescription = useMemo(() => {
    if (!product.description) {
      return { introduction: "", sections: [] };
    }

    if (!isMounted || typeof window === "undefined") {
      return { introduction: product.description, sections: [] };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(product.description, "text/html");
      const body = doc.body;

      const hasH2 = body.querySelector("h2");
      if (!hasH2) {
        return { introduction: product.description, sections: [] };
      }

      const sections: { title: string; html: string }[] = [];
      let introductionHtml = "";
      let currentSectionTitle = "";
      let currentSectionHtml = "";
      let passedFirstHeader = false;

      const childNodes = Array.from(body.childNodes);

      for (const node of childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === "h2") {
            if (currentSectionTitle) {
              sections.push({
                title: currentSectionTitle,
                html: currentSectionHtml
              });
            }
            currentSectionTitle = element.textContent || "";
            currentSectionHtml = "";
            passedFirstHeader = true;
          } else {
            if (!passedFirstHeader) {
              introductionHtml += element.outerHTML;
            } else {
              currentSectionHtml += element.outerHTML;
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          if (!passedFirstHeader) {
            introductionHtml += text;
          } else {
            currentSectionHtml += text;
          }
        }
      }

      if (currentSectionTitle) {
        sections.push({
          title: currentSectionTitle,
          html: currentSectionHtml
        });
      }

      return { introduction: introductionHtml, sections };
    } catch (e) {
      console.error("Error parsing product description:", e);
      return { introduction: product.description, sections: [] };
    }
  }, [product.description, isMounted]);
  // Fetch related products when section is near viewport (Performance & Production Safe Lazy Loading)
  useEffect(() => {
    const primaryCategory =
      product.categories?.find((c) => c.isPrimary === true) ??
      product.categories?.[0];
    const categorySlug = primaryCategory?.categorySlug;
    if (!categorySlug || hasTriggeredRelatedFetch) return;

    const observerTarget = relatedSectionRef.current;
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasTriggeredRelatedFetch(true);
            setIsLoadingRelated(true);
            fetchRelatedProducts(categorySlug);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" } // Pre-fetch 200px before section comes into viewport
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, [product.id, hasTriggeredRelatedFetch, product.categories]);

  // Fetch cross-sell products
  useEffect(() => {
    if (product.crossSellProductIds) {
      fetchCrossSellProducts(product.crossSellProductIds);
    }
  }, [product.crossSellProductIds]);

  const fetchRelatedProducts = async (categorySlug: string) => {
    setIsLoadingRelated(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Products?categorySlug=${categorySlug}&sortBy=price&sortDirection=asc&stockStatus=InStock&isPublished=true&pageSize=12`
      );
      const json = await res.json();
      if (json.success && json.data?.items) {
        const items = json.data.items;

        const isProductInStock = (p: any) => {
          if (!p) return false;
          const defaultVariant =
            p.variants?.find((v: any) => v.isDefault) ??
            p.variants?.[0];

          const isTracked = defaultVariant
            ? defaultVariant.trackInventory !== false
            : p.manageInventoryMethod !== "donttrack";

          const stock = defaultVariant?.stockQuantity ?? p.stockQuantity ?? 0;

          return !isTracked || stock > 0;
        };

        const filtered = items
          .filter((p: any) => p && p.id !== product.id && isProductInStock(p))
          .slice(0, 8);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  // Fetch cross-sell products
  const fetchCrossSellProducts = async (crossIds: string) => {
    try {
      const ids = crossIds.split(',').map(id => id.trim());
      const promises = ids.slice(0, 8).map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Products/${id}`).then(res => res.json())
      );
      const results = await Promise.all(promises);
      const validProducts = results
        .filter((r: any) => r.success && r.data?.isPublished === true)
        .map((r: any) => r.data);
      setCrossSellProducts(
        validProducts.filter(
          (p: any, index: number, self: any[]) => index === self.findIndex(x => x.id === p.id)
        )
      );
    } catch (error) {
      console.error("Error fetching cross-sell products:", error);
    }
  };
  const hasOutOfStockGroupedProduct = useMemo(() => {
    if (!isGroupedProduct || !product.groupedProducts) return false;
    return product.groupedProducts.some(
      gp => gp.stockQuantity !== undefined && gp.stockQuantity <= 0
    );
  }, [isGroupedProduct, product.groupedProducts]);
  useEffect(() => {
    if (hasOutOfStockGroupedProduct) {
      setGroupEnabled(false);
    }
  }, [hasOutOfStockGroupedProduct]);

  const specifications = useMemo(() => {
    if (!product?.specificationAttributes) return [];
    try {
      return JSON.parse(product.specificationAttributes);
    } catch {
      return [];
    }
  }, [product.specificationAttributes]);
  // Memoized image URL generator
  const getImageUrl = useCallback((imageUrl: string) => {
    if (!imageUrl) return '/placeholder-product.jpg';
    return imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
  }, []);
  const sortedImages = useMemo(() => {
    const baseImages = [...(product.images ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(img => ({ ...img, isVideo: false, videoUrl: undefined }));

    // 🔥 If variant selected & has image → inject as first thumbnail
    if (selectedVariant?.imageUrl) {
      return [
        {
          id: `variant-${selectedVariant.id}`,
          imageUrl: selectedVariant.imageUrl,
          altText: product.name,
          sortOrder: -1,
          isMain: true,
          isVideo: false,
        },
        ...baseImages.filter(
          img => img.imageUrl !== selectedVariant.imageUrl
        ),
      ];
    }
    // Default product images
    const mainIndex = baseImages.findIndex(img => img.isMain);
    if (mainIndex > 0) {
      const [mainImg] = baseImages.splice(mainIndex, 1);
      baseImages.unshift(mainImg);
    }

    // Add video if exists
    if (product.videoUrls) {
      const videos = product.videoUrls.split(",").map(v => v.trim()).filter(Boolean);
      videos.forEach((vid, i) => {
        const ytData = getYouTubeEmbedUrl(vid);
        if (ytData) {
          baseImages.push({
            id: `video-${i}`,
            imageUrl: ytData.thumbnailUrl,
            altText: "Product Video",
            sortOrder: 999,
            isMain: false,
            isVideo: true,
            videoUrl: ytData.embedUrl,
          } as any);
        }
      });
    }

    return baseImages;
  }, [product.images, selectedVariant, product.name, product.videoUrls]);

  const activeMainImage = useMemo(() => {
    return getImageUrl(sortedImages[selectedImage]?.imageUrl);
  }, [sortedImages, selectedImage, getImageUrl]);

  // Track previous image to prevent flash/jerk during transition
  const prevImageRef = useRef(activeMainImage);
  useEffect(() => {
    prevImageRef.current = activeMainImage;
  }, [activeMainImage]);

  useEffect(() => {
    if (selectedVariant?.imageUrl) {
      setSelectedImage(0);
      setThumbStart(0);
    }
  }, [selectedVariant]);

  useEffect(() => {
    setThumbStart(0);
  }, [sortedImages]);
  const handleThumbPrev = () => {
    setThumbStart(prev => Math.max(prev - 1, 0));
  };
  const handleThumbNext = () => {
    setThumbStart(prev =>
      Math.min(prev + 1, sortedImages.length - thumbVisible)
    );
  };


  // Handlers
  const handleRelatedProductClick = useCallback((slug: string) => {
    router.push(`/products/${slug}`);
  }, [router]);

  const scrollSlider = useCallback((direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = 300;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  const handleAddToCart = useCallback(() => {
    // 🔥 PHARMA GUARD
    if (product.isPharmaProduct && !pharmaApprovedRef.current) {
      setPendingAction("cart");
      setShowPharmaModal(true);
      return;
    }
    const selected = selectedVariant ?? null;
    // ============================
    // ⭐ EXISTING CART QTY CHECK
    // ============================
    const existingCartQty = cart
      .filter(
        (c) =>
          c.productId === product.id &&
          (c.variantId ?? null) === (selected?.id ?? null)
      )
      .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

    const stockQty =
      selected?.stockQuantity ?? product.stockQuantity ?? 0;

    if (existingCartQty + normalQty > stockQty) {
      toast.error(
        `Only ${stockQty - existingCartQty} items left in stock`
      );
      return;
    }

    const mainMin = (selected?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;

    // 🔥 MAX ORDER CHECK (IMPORTANT FIX)
    const mainMax = (selected?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;

    if (existingCartQty + normalQty > mainMax) {
      toast.error(`Maximum order quantity is ${mainMax}`);
      return;
    }

    if (normalQty < mainMin) {
      toast.error(`Minimum order quantity is ${mainMin}`);
      return;
    }
    if (normalQty > mainMax) {
      toast.error(`Maximum order quantity is ${mainMax}`);
      return;
    }
    // ⭐ GROUPED PRODUCTS STOCK VALIDATION
    if (isGroupedProduct && groupEnabled && product.groupedProducts) {
      const selectedGrouped = product.groupedProducts.filter(
        gp => groupedSelections[gp.productId]?.selected
      );

      const insufficient = selectedGrouped.find(
        gp => (gp.stockQuantity ?? 0) < normalQty
      );
      if (insufficient) {
        toast.error(
          `${insufficient.name} has only ${insufficient.stockQuantity} items available`
        );
        return;
      }
    }
    // BASE + FINAL PRICE
    const basePrice = resolveBasePrice(product, selected);
    const final = finalPrice;
    const variantTitle = selected
      ? `(${[
        selected.option1Value,
        selected.option2Value,
        selected.option3Value,
      ]
        .filter(Boolean)
        .join(", ")})`
      : "";
    const allowNextDay =
      isUKUser && effectiveNextDayEnabled === true;
    // 🔥 SPLIT QTY BETWEEN BUNDLE & STANDALONE
    const bundleQty =
      isGroupedProduct && groupEnabled
        ? normalQty
        : 0;

    const standaloneQty =
      isGroupedProduct && groupEnabled
        ? normalQty - bundleQty
        : normalQty;
    // 🧩 1️⃣ ADD BUNDLE (PARENT + CHILDREN)
    if (bundleQty > 0) {
      // 🔥 UNIQUE INSTANCE ID (per add-to-cart click)
      const bundleInstanceId = crypto.randomUUID();
      const bundleId = `bundle:${product.id}:${selected?.id ?? "base"}`;
      // 🔹 BUNDLE PARENT (MAIN PRODUCT)
      addToCart({
        id: bundleId,
        type: "one-time",
        purchaseContext: "bundle",
        productId: product.id,
        variantId: selected?.id ?? null,
        name: `${product.name} ${variantTitle} (Bundle)`,
        price: final,
        priceBeforeDiscount: basePrice,
        finalPrice: final,
        discountAmount:
          currentDisplayType === "System" || appliedCoupon
            ? discountAmount ?? 0
            : 0,
        // 🔥 Coupon products: never send oldPrice or OldPrice type to cart
        oldPrice: hasCouponAvailable ? undefined : (oldPriceValue ?? undefined),

        displayDiscountType: hasCouponAvailable ? "None" : currentDisplayType,

        hasSystemDiscount:
          selectedVariant?.hasSystemDiscount ??
          product.hasSystemDiscount ??
          false,

        systemDiscountAmount:
          currentSystemDiscountAmount,
        couponCode: appliedCoupon?.couponCode ?? null,
        appliedDiscountId: appliedCoupon?.id ?? null,
        quantity: bundleQty,
        sku: selected?.sku ?? product.sku,
        slug: product.slug,
        vatRate: vatRate,
        vatIncluded: vatRate !== null,
        image: selected?.imageUrl
          ? getImageUrl(selected.imageUrl)
          : getImageUrl(
            product.images.find(img => img.isMain)?.imageUrl ||
            product.images[0]?.imageUrl
          ),
        variantOptions: {
          ...(selected?.option1Name && {
            [selected.option1Name]: selected.option1Value,
          }),
          ...(selected?.option2Name && {
            [selected.option2Name]: selected.option2Value,
          }),
          ...(selected?.option3Name && {
            [selected.option3Name]: selected.option3Value,
          }),
        },
        nextDayDeliveryEnabled: effectiveNextDayEnabled ?? false,
        nextDayDeliveryFree: effectiveNextDayFree ?? false,
        sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
        isBundleParent: true,
        bundleId,
        bundleInstanceId,
        productData: JSON.parse(JSON.stringify(product)),
      });
      // 🔹 BUNDLE CHILD PRODUCTS
      product.groupedProducts?.forEach(gp => {
        const state = groupedSelections[gp.productId];
        if (!state?.selected) return;
        addToCart({
          id: `bundle-child:${bundleId}:${gp.productId}`,
          type: "one-time",
          purchaseContext: "bundle",
          productId: gp.productId,
          parentProductId: product.id,
          bundleId,
          bundleParentId: bundleId,
          bundleParentInstanceId: bundleInstanceId, // 🔥 NEW       
          name: gp.name,
          price: gp.bundlePrice ?? gp.price,
          finalPrice: gp.bundlePrice ?? gp.price,
          quantity: bundleQty,
          sku: gp.sku,
          slug: gp.slug || "",
          image: gp.mainImageUrl
            ? gp.mainImageUrl.startsWith("http")
              ? gp.mainImageUrl
              : `${process.env.NEXT_PUBLIC_API_URL}${gp.mainImageUrl}`
            : "/placeholder-product.png",
          hasBundleDiscount: gp.hasBundleDiscount,
          individualSavings: gp.individualSavings,
          shipSeparately: product.shipSeparately,
          productData: JSON.parse(JSON.stringify(gp)),
        });
      });
    }
    // 🧍 2️⃣ ADD STANDALONE PRODUCT
    if (standaloneQty > 0) {
      addToCart({
        id: `standalone:${product.id}:${selected?.id ?? "base"}`,
        type: "one-time",
        purchaseContext: "standalone",
        productId: product.id,
        variantId: selected?.id ?? null,
        name: `${product.name} ${variantTitle}`,
        price: final,
        priceBeforeDiscount: basePrice,
        finalPrice: final,
        discountAmount:
          currentDisplayType === "System" || appliedCoupon
            ? discountAmount ?? 0
            : 0,
        // 🔥 Coupon products: never send oldPrice or OldPrice type to cart
        oldPrice: hasCouponAvailable ? undefined : (oldPriceValue ?? undefined),

        displayDiscountType: hasCouponAvailable ? "None" : currentDisplayType,

        hasSystemDiscount:
          selectedVariant?.hasSystemDiscount ??
          product.hasSystemDiscount ??
          false,

        systemDiscountAmount:
          currentSystemDiscountAmount,
        couponCode: appliedCoupon?.couponCode ?? null,
        appliedDiscountId: appliedCoupon?.id ?? null,
        quantity: standaloneQty,
        vatRate: vatRate,
        vatIncluded: vatRate !== null,
        sku: selected?.sku ?? product.sku,
        slug: product.slug || "",
        image: selected?.imageUrl
          ? getImageUrl(selected.imageUrl)
          : getImageUrl(
            product.images.find(img => img.isMain)?.imageUrl ||
            product.images[0]?.imageUrl
          ),
        variantOptions: {
          ...(selected?.option1Name && {
            [selected.option1Name]: selected.option1Value,
          }),
          ...(selected?.option2Name && {
            [selected.option2Name]: selected.option2Value,
          }),
          ...(selected?.option3Name && {
            [selected.option3Name]: selected.option3Value,
          }),
        },
        shipSeparately: product.shipSeparately,
        nextDayDeliveryEnabled: effectiveNextDayEnabled ?? false,
        nextDayDeliveryFree: effectiveNextDayFree ?? false,
        sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,

        productData: JSON.parse(JSON.stringify(product)),
      });
    }
  }, [
    addToCart,
    normalQty,
    groupedMaxQty,
    product,
    selectedVariant,
    finalPrice,
    discountAmount,
    appliedCoupon,
    getImageUrl,
    toast,
    groupedSelections,
    isGroupedProduct,
    groupEnabled,
    isUKUser,
    vatRate,
  ]);
  const handleBuyNow = () => {
    // 🔥 PHARMA GUARD
    if (product.isPharmaProduct && !pharmaApprovedRef.current) {
      setPendingAction("buy");
      setShowPharmaModal(true);
      return;
    }
    const selected = selectedVariant ?? null;
    const stockQty = selected?.stockQuantity ?? product.stockQuantity ?? 0;
    const mainMin = (selected?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
    const mainMax = (selected?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;
    if (normalQty < mainMin) {
      toast.error(`Minimum order quantity is ${mainMin}`);
      return;
    }

    if (normalQty > mainMax) {
      toast.error(`Maximum order quantity is ${mainMax}`);
      return;
    }
    if (normalQty > stockQty) {
      toast.error(`Only ${stockQty} items available`);
      return;
    }
    if (isGroupedProduct && groupEnabled && product.groupedProducts) {
      const selectedGrouped = product.groupedProducts.filter(
        gp => groupedSelections[gp.productId]?.selected
      );
      const insufficient = selectedGrouped.find(
        gp => (gp.stockQuantity ?? 0) < normalQty
      );
      if (insufficient) {
        toast.error(
          `${insufficient.name} has only ${insufficient.stockQuantity} items available`
        );
        return;
      }
    }
    const basePrice = resolveBasePrice(product, selected);
    const final = finalPrice;
    const allowNextDay =
      isUKUser && effectiveNextDayEnabled === true;
    const buyNowItem = {
      id: `${product.id}-${selected?.id ?? "base"}-one`,
      type: "one-time",
      productId: product.id,
      name: `${product.name}${selected
        ? ` (${[
          selected.option1Value,
          selected.option2Value,
          selected.option3Value,
        ]
          .filter(Boolean)
          .join(", ")})`
        : ""
        }`,
      price: final,
      priceBeforeDiscount: basePrice,
      finalPrice: final,
      discountAmount:
        currentDisplayType === "System" || appliedCoupon
          ? discountAmount ?? 0
          : 0,
      // 🔥 Coupon products: never send oldPrice or OldPrice type to cart
      oldPrice: hasCouponAvailable ? undefined : (oldPriceValue ?? undefined),

      displayDiscountType: hasCouponAvailable ? "None" : currentDisplayType,

      hasSystemDiscount:
        selectedVariant?.hasSystemDiscount ??
        product.hasSystemDiscount ??
        false,

      systemDiscountAmount:
        currentSystemDiscountAmount,
      quantity: normalQty,
      vatRate: vatRate,
      vatIncluded: vatRate !== null,
      image: selected?.imageUrl
        ? getImageUrl(selected.imageUrl)
        : getImageUrl(product.images[0]?.imageUrl),
      sku: selected?.sku ?? product.sku,
      variantId: selected?.id ?? null,
      slug: product.slug,
      variantOptions: {
        ...(selected?.option1Name && {
          [selected.option1Name]: selected.option1Value,
        }),
        ...(selected?.option2Name && {
          [selected.option2Name]: selected.option2Value,
        }),
        ...(selected?.option3Name && {
          [selected.option3Name]: selected.option3Value,
        }),
      },
      nextDayDeliveryEnabled: effectiveNextDayEnabled ?? false,
      // 🔥🔥🔥 MOST IMPORTANT FIX
      // 🔥 FINAL CORRECT
      nextDayDeliveryFree:
        effectiveNextDayFree ?? false,
      sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
      productData: JSON.parse(JSON.stringify(product)),
    };
    sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
    if (!isAuthenticated) {
      router.push("/account?from=buy-now");
    } else {
      router.push("/checkout");
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };
  const handlePrevImage = useCallback(() => {
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
  }, [product.images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
  }, [product.images.length]);
  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setNormalQty(product.orderMinimumQuantity ?? 1);
    if (variant.slug) updateVariantInUrl(variant);
    // <-- ONLY HERE URL UPDATES
    setSelectedOptions({
      option1: variant.option1Value,
      option2: variant.option2Value,
      option3: variant.option3Value,
    });
  };
  // Coupon apply handler
  const handleApplyCoupon = (couponData: any) => {
    if (!couponData) return;

    setAppliedCoupon({
      id: couponData.discountId,
      name: couponData.discountName,
      isActive: true,
      usePercentage: couponData.usePercentage,
      discountAmount: couponData.discountAmount,
      discountPercentage: couponData.discountPercentage,
      startDate: "",
      endDate: couponData.expiresAt,
      requiresCouponCode: true,
      isCumulative: couponData.isCumulative,
      couponCode: couponData.couponCode,
    });

    setCouponCode(couponData.couponCode);
    setShowCouponModal(false);
  };
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");

    // 🔥 Recalculate auto discount properly
    const autoPrice = getDiscountedPrice(product, basePrice);

    setFinalPrice(autoPrice);

    setDiscountAmount(
      basePrice > autoPrice
        ? +(basePrice - autoPrice).toFixed(2)
        : 0
    );
  };
  return (
    <div className="min-h-screen bg-white">
      {/* ✅ ADMIN PREVIEW BANNER */}
      {isAdminPreview && (
        <div className="sticky top-0 z-50 w-full bg-amber-500 text-black py-2 px-4 flex items-center justify-center gap-3 shadow-md">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/10 text-black font-bold text-xs">!</span>
          <p className="text-sm font-semibold tracking-wide">
            ⚠️ Admin Preview — This product is <strong>Unpublished</strong> and not visible to customers.
          </p>
          <a
            href="/admin/products"
            className="ml-4 text-xs font-bold underline underline-offset-2 hover:opacity-70 transition whitespace-nowrap"
          >
            ← Back to Products
          </a>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="hidden md:block bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-nowrap items-center gap-1 text-xs text-gray-500 overflow-hidden" >
            {/* Home */}
            <Link href="/" className="hover:text-black text-gray-600 whitespace-nowrap flex-shrink-0 transition-colors">
              Home
            </Link>
            {/* Categories */}
            {buildCategoryBreadcrumb(product.categories).map(cat => (
              <span key={cat.slug} className="flex items-center gap-1 flex-shrink-0">
                <span className="text-gray-400 text-[9px] mx-1">&gt;</span>
                <Link
                  href={`/category/${cat.slug}`}
                  className="hover:text-black text-gray-600 whitespace-nowrap transition-colors" >
                  {cat.name}
                </Link>
              </span>
            ))}
            {/* Product */}
            <span className="text-gray-400 text-[9px] mx-1 flex-shrink-0">&gt;</span>
            <span
              className="text-gray-800 font-medium truncate min-w-0"
              aria-current="page"
            >
              {product.name}
            </span>
          </nav>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* PRODUCT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          {/* LEFT: Image Gallery */}
          <div className="flex flex-col gap-3 w-full lg:sticky lg:top-24 lg:self-start">
            {/* Inner row: vertical thumbnails LEFT + main image RIGHT */}
            <div className="flex gap-4 md:gap-6 items-center md:items-start">

              {/* Vertical Thumbnail Strip */}
              <div className="flex flex-col items-center gap-2.5 w-[76px] md:w-[100px] flex-shrink-0">
                {/* UP arrow */}
                {thumbStart > 0 && (
                  <button
                    onClick={handleThumbPrev}
                    className="w-full flex justify-center py-0.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                  >
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {/* Thumbnails vertical */}
                <div className="flex flex-col gap-2.5">
                  {sortedImages
                    .slice(thumbStart, thumbStart + thumbVisible)
                    .map((img, idx) => {
                      const realIndex = thumbStart + idx;
                      const isVideo = (img as any).isVideo;
                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(realIndex)}
                          className={`relative cursor-pointer rounded-md overflow-hidden w-[70px] h-[70px] md:w-[94px] md:h-[94px] flex-shrink-0 transition-all duration-200 border bg-white
                          ${selectedImage === realIndex
                              ? "border-black shadow-sm"
                              : "border-gray-200 hover:border-gray-400"
                            }`}
                        >
                          <div className="relative w-full h-full bg-white p-1">
                            <Image
                              src={isVideo ? img.imageUrl : getImageUrl(img.imageUrl)}
                              alt={img.altText || product.name}
                              fill
                              unoptimized={isVideo}
                              className="object-contain p-1"
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                                <Play className="h-6 w-6 text-white fill-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {/* DOWN arrow */}
                {thumbStart + thumbVisible < sortedImages.length && (
                  <button
                    onClick={handleThumbNext}
                    className="w-full flex justify-center py-0.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Main Image */}
              <div className="flex-1 relative bg-white overflow-hidden">
                {/* 🎫 COUPON AVAILABLE BADGE — top-left on image (same style as FeaturedProductsSlider) */}
                {hasCouponAvailable && !appliedCoupon && (
                  <div className="absolute top-2 left-2 z-30">
                    <div className="relative bg-gradient-to-br from-red-50 to-red-100 text-red-800 text-[12px] font-semibold px-2.5 py-1.5 rounded-md shadow-lg rotate-[-6deg] border border-red-200 leading-tight">
                      <div className="flex flex-col items-center text-center">
                        <span className="flex items-center gap-1 text-[12px] font-bold">
                          🎫 Coupon
                        </span>
                        <span className="text-[12px] opacity-90">Available</span>
                      </div>
                      {/* hole */}
                      <span className="absolute -top-1 left-2 w-2 h-2 bg-white border border-red-200 rounded-full shadow-inner"></span>
                      {/* string */}
                      <span className="absolute -top-3 left-[10px] w-[1px] h-3 bg-gray-300"></span>
                    </div>
                  </div>
                )}
                <div className="relative bg-white overflow-hidden h-[310px] md:h-[390px] lg:h-[460px] flex items-center justify-center">

                  {/* ✅ ONLY IMAGE AREA HAS ZOOM */}
                  <div
                    className="relative w-full h-full"
                    onMouseEnter={() => setShowZoom(true)}
                    onMouseLeave={() => setShowZoom(false)}
                    onMouseMove={handleMouseMove}
                  >
                    <button
                      type="button"
                      aria-label="View product image"
                      onClick={() => {
                        if (!(sortedImages[selectedImage] as any)?.isVideo) {
                          setShowImageModal(true);
                        }
                      }}
                      className={`absolute inset-0 z-10 ${(sortedImages[selectedImage] as any)?.isVideo ? 'cursor-default pointer-events-none' : 'cursor-zoom-in'}`}
                    />

                    {(sortedImages[selectedImage] as any)?.isVideo ? (
                      <div className="w-full h-full p-2">
                        <iframe
                          src={(sortedImages[selectedImage] as any).videoUrl}
                          className="w-full h-full rounded-md"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <>
                        {/* Background (old/previous) image to prevent flash/jerk */}
                        {prevImageRef.current && prevImageRef.current !== activeMainImage && (
                          <Image
                            src={prevImageRef.current}
                            alt=""
                            fill
                            className="object-contain p-1 pointer-events-none opacity-80"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )}
                        <Image
                          key={activeMainImage}
                          src={activeMainImage}
                          alt={product.name}
                          fill
                          className="object-contain p-1 pointer-events-none animate-image-swipe"
                          priority
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </>
                    )}

                    {/* 🔥 ZOOM OVERLAY */}
                    {!(sortedImages[selectedImage] as any)?.isVideo && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-150 hidden lg:block"
                        style={{
                          opacity: showZoom ? 1 : 0,
                          backgroundImage: `url(${activeMainImage})`,
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "170%",
                          backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                        }}
                      />
                    )}
                  </div>

                  <div className="absolute top-1 md:top-3 right-1 md:right-3 flex flex-col gap-2 z-30">
                    {/* Wishlist */}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={product.disableWishlistButton === true}
                      onClick={() => {
                        if (product.disableWishlistButton) return;
                        const wishlistId = selectedVariant ? selectedVariant.id : product.id;

                        toggleWishlist({
                          id: wishlistId,
                          productId: product.id,
                          variantId: selectedVariant?.id,

                          // ✅ EXACT SAME AS CART
                          name: selectedVariant
                            ? `${product.name} (${[
                              selectedVariant.option1Value,
                              selectedVariant.option2Value,
                              selectedVariant.option3Value,
                            ]
                              .filter(Boolean)
                              .join(", ")})`
                            : product.name,

                          slug: selectedVariant?.slug ?? product.slug, // 🔥 IMPORTANT
                          price: finalPrice,
                          priceBeforeDiscount: basePrice,
                          finalPrice: finalPrice,
                          discountAmount:
                            currentDisplayType === "System" || appliedCoupon
                              ? discountAmount ?? 0
                              : 0,
                          // 🔥 Coupon products: never send oldPrice or OldPrice type
                          oldPrice: hasCouponAvailable ? null : (oldPriceValue ?? null),

                          displayDiscountType: hasCouponAvailable ? "None" : currentDisplayType,

                          hasSystemDiscount:
                            selectedVariant?.hasSystemDiscount ??
                            product.hasSystemDiscount ??
                            false,

                          systemDiscountAmount:
                            currentSystemDiscountAmount,
                          appliedDiscountId: appliedCoupon?.id ?? null,
                          couponCode: appliedCoupon?.couponCode ?? null,

                          image: activeMainImage,

                          vatRate: vatRate ?? null,
                          vatExempt: product.vatExempt,

                          sku: selectedVariant?.sku ?? product.sku,

                          stockQuantity:
                            selectedVariant?.stockQuantity ??
                            product.stockQuantity ??
                            null,
                          productData: JSON.parse(JSON.stringify(product)),

                          // 🔥 OPTIONAL BUT IMPORTANT
                          orderMaximumQuantity: product.orderMaximumQuantity ?? null,
                          orderMinimumQuantity: product.orderMinimumQuantity ?? null,
                        });
                        toast.success(isInWishlist(wishlistId) ? "Removed from wishlist" : "Added to wishlist!");
                      }}
                      className={`absolute top-3 right-3 z-20
    bg-gray-50 hover:bg-red-50 rounded border-1 border-gray-50 shadow-none
    ${product.disableWishlistButton
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                    >
                      <Heart className={`h-10 w-10 transition-colors ${isInWishlist(selectedVariant ? selectedVariant.id : product.id) ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
                    </Button>
                  </div>
                  {product.images.length > 1 && (
                    <>
                      <Button size="icon" variant="secondary" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
bg-white/80 hover:bg-white shadow-md rounded-full p-2 backdrop-blur-sm transition" onClick={handlePrevImage}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
bg-white/80 hover:bg-white shadow-md rounded-full p-2 backdrop-blur-sm transition" onClick={handleNextImage}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="secondary" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-xs" onClick={() => setShowImageModal(true)}>
                    Fullscreen
                  </Button>
                </div>
              </div>
              {/* end main image */}

            </div>
            {/* end inner row */}
            {/* 🔥 GROUPED PRODUCTS + BUNDLE OFFER (SINGLE BOX) */}
            {purchaseType === "one" && isGroupedProduct && product.groupedProducts && (
              <div className="hidden md:block mb-1 mt-0 border border-orange-100 bg-white rounded p-3">
                <div className="flex items-center gap-3 mb-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-black cursor-pointer"
                    checked={groupEnabled}
                    disabled={
                      product.automaticallyAddProducts || hasOutOfStockGroupedProduct
                    }
                    onChange={(e) => setGroupEnabled(e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    PAIR IT WITH :
                    {product.automaticallyAddProducts && (
                      <span className="text-xs text-gray-500">(required)</span>
                    )}
                  </span>
                </div>
                {hasOutOfStockGroupedProduct && (
                  <p className="text-xs text-red-600 mb-1">
                    One or more required products are currently out of stock.
                  </p>
                )}
                {/* 🔥 BUNDLE OFFER MESSAGE */}
                {product.groupBundleDiscountType &&
                  product.groupBundleDiscountType !== "None" && (
                    <div className="mb-2 bg-orange-50 border rounded p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#f38918] flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#f38918] leading-tight">
                            Bundle Offer: Save {product.savingsPercentage}% when purchased together
                          </span>
                          {product.totalSavings && (
                            <span className="text-[10px] font-semibold text-red-500 leading-tight">
                              You save £{product.totalSavings.toFixed(2)} on this bundle
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* GROUPED ITEMS */}
                <div className="space-y-2">
                  {product.groupedProducts.map(gp => {
                    const state = groupedSelections[gp.productId];
                    if (!state) return null;
                    return (
                      <div
                        key={gp.productId}
                        className="flex items-center justify-between gap-2 bg-white rounded p-2 border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* PRODUCT INFO */}
                          {/* PRODUCT IMAGE */}
                          <div className="w-10 h-10 flex-shrink-0 rounded border bg-white overflow-hidden p-0.5">
                            <Link href={`/product/${gp.slug}`}>
                              <img
                                src={
                                  gp.mainImageUrl
                                    ? gp.mainImageUrl.startsWith("http")
                                      ? gp.mainImageUrl
                                      : `${process.env.NEXT_PUBLIC_API_URL}${gp.mainImageUrl}`
                                    : "/placeholder-product.png"
                                }
                                alt={"no img"}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            </Link>
                          </div>
                          <div className="min-w-0 pr-1">
                            <Link href={`/product/${gp.slug}`}>
                              <p className="text-xs font-semibold text-gray-900 truncate">{gp.name}</p>
                            </Link>
                            <p className="text-xs font-bold text-gray-900 mt-0.5">
                              £{((gp.bundlePrice ?? gp.price) * normalQty).toFixed(2)} GBP
                            </p>
                            {gp.hasBundleDiscount && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-[10px] text-gray-400 line-through">
                                  £{(gp.price * normalQty).toFixed(2)}
                                </p>
                                {typeof gp.individualSavings === "number" && (
                                  <p className="text-[10px] font-medium text-green-600">
                                    Save £{(gp.individualSavings * normalQty).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* QUANTITY */}
                        <div className="flex items-center justify-center border rounded px-2 py-1 bg-gray-50 flex-shrink-0">
                          <span className="text-[11px] font-bold text-gray-800 whitespace-nowrap">
                            Qty: {normalQty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 🔥 BUNDLE TOTAL SUMMARY */}
                <div className="mt-2 pt-2 border-t space-y-0.5">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Individual total</span>
                    <span>£{bundleIndividualTotal.toFixed(2)}</span>
                  </div>
                  {bundleTotalSavings > 0 && (
                    <div className="flex justify-between text-xs text-orange-800 font-medium">
                      <span>You save</span>
                      <span>£{bundleTotalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-red-500 pt-0.5">
                    <span>Bundle price</span>
                    <span>£{bundleTotalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Product Info */}
          <div>
            {/* TITLE */}
            <div className="mb-2">
              <h1 className="text-xl md:text-2xl lg:text-[26px] font-bold text-gray-900 leading-tight tracking-tight">
                {selectedVariant
                  ? `${product.name} (${[
                    selectedOptions.option1,
                    selectedOptions.option2,
                    selectedOptions.option3
                  ].filter(Boolean).join(", ")})`
                  : product.name}
              </h1>
              {(selectedVariant?.sku || product.sku || soldText) && (
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {(selectedVariant?.sku || product.sku) && (
                    <p className="text-xs md:text-sm text-gray-500">
                      Sku: {selectedVariant?.sku ?? product.sku}
                    </p>
                  )}
                  {soldText && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[#e17b07] bg-orange-50 border border-orange-200/60 rounded-full text-xs font-semibold shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f38918] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f38918]" />
                      </span>
                      <span>{soldText} this month</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-2">
              {/* Brand */}
              {product.brandName && (
                <p className="text-sm text-gray-600">
                  by{" "}
                  {product.brandSlug ? (
                    <Link
                      href={`/brands/${product.brandSlug}`}
                      className="font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                    >
                      {product.brandName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-800">{product.brandName}</span>
                  )}
                </p>
              )}
              {/* Rating + Reviews */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => {
                    const rating = product.averageRating || 0;
                    if (rating >= i + 1) {
                      return <Star key={i} className="h-4 w-4 fill-[#f2ad43] text-[#f2ad43] flex-shrink-0" />;
                    } else if (rating > i && rating < i + 1) {
                      return <StarHalf key={i} className="h-4 w-4 fill-[#f2ad43] text-[#f2ad43] flex-shrink-0" />;
                    }
                    return <Star key={i} className="h-4 w-4 text-gray-300 flex-shrink-0" />;
                  })}
                </div>
                <div
                  className="relative group inline-block"
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span className="text-sm text-gray-500 hover:text-black cursor-pointer underline transition-colors">
                    {product.reviewCount || 0} Reviews
                  </span>
                  {/* ✅ HOVER TOOLTIP */}
                  <div
                    className="absolute left-0 top-full z-50 hidden lg:group-hover:block w-80 bg-white border rounded-xl shadow-lg p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 🔥 HEADING */}
                    <div className="mb-2 pb-2 border-b">
                      <p className="text-sm font-semibold text-gray-800">
                        Recent Reviews
                      </p>
                    </div>
                    {recentReviews.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No reviews yet
                      </p>
                    ) : (
                      <>
                        {recentReviews.map((r) => (
                          <div
                            key={r.id}
                            className="border-b last:border-b-0 py-2 cursor-pointer hover:bg-gray-50 rounded-md transition"
                            onClick={() => {
                              setHighlightReviewId(null);
                              setTimeout(() => setHighlightReviewId(r.id), 10);
                            }}
                          >
                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                              {"★".repeat(r.rating)}
                              <span className="text-gray-300">
                                {"☆".repeat(5 - r.rating)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-800">
                              {r.customerName}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {r.comment}
                            </p>
                          </div>
                        ))}

                        {/* 🔥 VIEW ALL REVIEWS CTA */}
                        {product.reviewCount > recentReviews.length && (
                          <button
                            className="mt-2 w-full text-sm font-semibold text-[#f38918] hover:text-black"
                            onClick={() => {
                              const el = document.getElementById("reviews-list");
                              el?.scrollIntoView({ behavior: "instant" });
                            }}
                          >
                            View all reviews
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* BADGES WRAP SAFELY BELOW ON MOBILE */}
              <div className="flex flex-wrap items-center gap-2 sm:ml-3">
                {/* VAT Exempt / Relief */}
                {(product.vatExempt || (product as any).vatRate === 0) && (
                  <div className="flex items-center gap-1 text-[#f38918] bg-orange-50 border border-orange-200 px-1 py-1 rounded text-[9px] font-semibold">
                    <BadgePercent className="h-2.5 w-2.5" />
                    VAT Relief
                  </div>
                )}
                {/* Unisex */}
                {/* <GenderBadge
                  gender={product.gender}
                  absolute={false}
                  className="bg-gray-100 text-gray-700 border border-purple-200 px-2 py-0 rounded text-xs font-semibold gap-1 shadow-none"
                /> */}
                {/* Pharma Product */}
                {product.isPharmaProduct && (
                  <div className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded text-xs font-semibold">
                    <Pill className="h-3 w-3" />
                    Pharma Product
                  </div>
                )}
              </div>
            </div>

            {/* 🔥 LIVE CART ACTIVITY BANNER */}
            <LiveCartActivityBanner activity={cartActivity?.productId === product.id ? cartActivity : null} />
            {isUKUser && effectiveNextDayEnabled && nextDayTimeLeft && (
              <div className="mt-2 mb-3 rounded-md border border-[#fdecd2] bg-[#fdf8f0] px-4 py-2.5 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between">
                  {/* ORDER WITHIN */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2ad43] shadow-sm">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Order within
                    </p>
                    <p className="text-xs font-extrabold text-amber-900">
                      {nextDayTimeLeft}
                    </p>
                  </div>
                  {/* LINE */}
                  <div className="mx-2 h-px flex-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />
                  {/* SHIPS */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2ad43] shadow-sm">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Ships
                    </p>
                    <p className="text-xs font-extrabold text-amber-900">
                      {shipDate}
                    </p>
                  </div>
                  {/* LINE */}
                  <div className="mx-2 h-px flex-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />

                  {/* DELIVERS */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2ad43] shadow-sm">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Delivers
                    </p>
                    <p className="text-xs font-extrabold text-amber-900">
                      {deliveryDate}
                    </p>
                  </div>
                </div>

                {/* 🎉 FREE Next Day Delivery Badge */}
                {effectiveNextDayFree && (
                  <div className="mt-2.5 -mx-4 -mb-2.5 px-4 py-2 bg-black flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f38918] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f38918]" />
                    </span>
                    <p className="text-white text-[10px] md:text-[11px] font-bold tracking-wide uppercase">
                      🎉 Next Day Delivery is FREE on this product!
                    </p>
                  </div>
                )}
              </div>
            )}
            {product.disableBuyButton && (
              <div className="mb-3 flex">
                <div className="inline-flex items-center rounded-lg border border-red-300 bg-yellow-50 px-4 py-2">
                  <p className="text-sm font-medium text-red-800 whitespace-nowrap">
                    This product is currently not available for purchase.
                  </p>
                </div>
              </div>
            )}
            {/* VARIANTS UI */}
            {product.variants && product.variants?.length > 0 && (
              <div className="space-y-4 mb-5">
                {/* OPTION 1 */}
                {product.variants?.[0]?.option1Name && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-gray-950">
                      <span className="font-bold">{product.variants?.[0]?.option1Name}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ...new Set(
                          [...(product.variants ?? [])]
                            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                            .map(v => v.option1Value)
                        ),
                      ].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateSelection(1, opt)}
                          className={`px-2 py-1 rounded-md border text-sm font-medium transition-all duration-150 ${selectedOptions.option1 === opt
                            ? "border-black ring-1 ring-black text-black font-bold bg-white"
                            : "border-gray-200 text-gray-800 hover:border-gray-400 bg-white"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* OPTION 2 */}
                {product.variants?.[0]?.option2Name && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-gray-950">
                      <span className="font-bold">{product.variants?.[0]?.option2Name}</span> <span className="text-gray-700 capitalize ml-1">{selectedOptions.option2}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(
                        product.variants
                          ?.filter(v => v.option1Value === selectedOptions.option1)
                          .map(v => v.option2Value)
                      )].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateSelection(2, opt)}
                          className={`px-2 py-1 rounded-md border text-sm font-medium transition-all duration-150 ${selectedOptions.option2 === opt
                            ? "border-black ring-1 ring-black text-black font-bold bg-white"
                            : "border-gray-200 text-gray-800 hover:border-gray-400 bg-white"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* OPTION 3 */}
                {product.variants?.some(v => v.option3Name && v.option3Value) && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-gray-950">
                      <span className="font-bold">{product.variants?.[0]?.option3Name}</span> <span className="text-gray-700 capitalize ml-1">{selectedOptions.option3}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(
                        product.variants
                          ?.filter(v =>
                            v.option1Value === selectedOptions.option1 &&
                            v.option2Value === selectedOptions.option2
                          )
                          .map(v => v.option3Value)
                      )].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateSelection(3, opt)}
                          className={`px-2 py-1 rounded-md border text-sm font-medium transition-all duration-150 ${selectedOptions.option3 === opt
                            ? "border-black ring-1 ring-black text-black font-bold bg-white"
                            : "border-gray-200 text-gray-800 hover:border-gray-400 bg-white"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Price Card (Flattened/No-Border for Houszy look) */}
            <div className="mb-4">
              <div className="p-0">
                {/* PURCHASE MODE CARDS SIDE BY SIDE */}
                {product.isRecurring ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
                    {/* LEFT NORMAL PURCHASE CARD */}
                    <div
                      id="normal-purchase-card"
                      onClick={() => setPurchaseType("one")}
                      className={`w-full transition-all duration-300 rounded-2xl  ${purchaseType === "one"
                        ? "border-2 border-[#f38918] bg-[#f8faf9] shadow-md"
                        : "border border-gray-200 bg-white"
                        }`}
                    >
                      {/* <<< Your current full card starts here >>> */}
                      <Card className="shadow-sm bg-transparent border-none">
                        <CardContent className="px-3 pt-3 pb-2">
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="radio"
                              name="purchaseType"
                              value="one"
                              checked={purchaseType === "one"}
                              onChange={() => setPurchaseType("one")}
                              className="h-4 w-4 accent-[#f38918] cursor-pointer"
                            />
                            <span className="font-semibold text-sm">One-Time Purchase</span>
                          </label>
                          {/* Price + VAT + Loyalty — all compact inline */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {/* 🔥 CASE 1: DISCOUNT */}
                            {(appliedCoupon || activeAutoDiscount) ? (
                              <span className="text-xs text-gray-400 line-through">
                                £{basePrice.toFixed(2)} GBP
                              </span>
                            ) : (!appliedCoupon && !activeAutoDiscount && oldPriceData) ? (
                              <span className="text-xs text-gray-400 line-through">
                                £{oldPriceData.oldPrice.toFixed(2)} GBP
                              </span>
                            ) : null}

                            <span className="text-sm font-medium text-[#e57e25]">
                              £{finalPrice.toFixed(2)} GBP
                            </span>
                            {discountPercentage > 0 && (
                              <span className="bg-[#E31B23] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm leading-none flex items-center justify-center">
                                -{discountPercentage}%
                              </span>
                            )}
                            {loyaltyPoints && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md">
                                <AwardIcon className="h-3 w-3 text-orange-600" />
                                Earn {loyaltyPoints} pts
                              </span>
                            )}
                          </div>

                          {/* 🔥 OFFER PAGE BADGE — show when product has assigned discount */}
                          {discountSlug && (
                            <Link
                              href={`/offers/${discountSlug}`}
                              className="inline-flex items-center gap-1.5 mt-1.5 mb-2 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm hover:shadow transition-all duration-150 group w-fit"
                            >
                              <Zap className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                              <span>Qualifying Items — View Offer</span>
                              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          )}

                          {/* Qty + Stock — same row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <QuantitySelector
                              quantity={normalQty}
                              setQuantity={setNormalQty}
                              maxStock={groupedMaxQty}
                              stockError={normalStockError}
                              setStockError={setNormalStockError}
                              minQty={product.orderMinimumQuantity ?? 1}
                              maxQty={product.orderMaximumQuantity}
                            />
                            {vatRate !== null && vatRate > 0 && !product.vatExempt && (
                              <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                {vatRate}% VAT
                              </span>
                            )}
                            {stockDisplay.show && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold border whitespace-nowrap ${stockDisplay.type === "out"
                                  ? "bg-red-50 border-red-200 text-red-700"
                                  : stockDisplay.type === "low"
                                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                                    : "bg-orange-50 border-orange-200 text-orange-700"
                                  }`}
                              >
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full ${stockDisplay.type === "out"
                                    ? "bg-red-600"
                                    : stockDisplay.type === "low"
                                      ? "bg-yellow-600"
                                      : "bg-[#f38918]"
                                    }`}
                                ></span>
                                {stockDisplay.text}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* ADD TO CART */}
                            {purchaseType === "one" && backorderState.canBuy && (
                              <Button
                                onClick={handleAddToCart}
                                disabled={product.disableBuyButton || (isGroupedProduct && !allRequiredSelected)}
                                className="flex-1 h-10 rounded-md text-sm font-bold uppercase bg-black hover:bg-gray-900 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Add to Cart
                              </Button>
                            )}
                            {/* BUY NOW */}
                            {purchaseType === "one" && backorderState.canBuy && (
                              <Button
                                onClick={handleBuyNow}
                                disabled={product.disableBuyButton}
                                className="flex-1 h-10 rounded-md text-sm font-bold uppercase bg-[#f2ad43] hover:bg-[#eba73a] text-black disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Buy Now &gt;&gt;
                              </Button>
                            )}
                            {purchaseType === "one" && !backorderState.canBuy && (
                              <Button
                                onClick={() => setShowNotifyModal(true)}
                                className="flex-1 h-10 rounded-md text-sm font-bold uppercase bg-white border border-orange-200 hover:bg-orange-50 text-orange-500 flex items-center justify-center gap-2"
                              >
                                <Bell className="h-4 w-4 animate-pulse text-amber-200" />
                                Notify me
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* RIGHT SUBSCRIPTION CARD */}
                    <div
                      id="subscription-card"
                      onClick={() => setPurchaseType("subscription")}
                      className={`w-full transition-all duration-300 rounded-2xl ${purchaseType === "subscription"
                        ? "border-2 border-[#f38918] bg-[#f8faf9] shadow-md"
                        : "border border-gray-200 bg-white"
                        }`}
                    >
                      <SubscriptionPurchaseCard
                        product={product}
                        selectedVariant={selectedVariant}
                        selectedPurchaseType={purchaseType}
                        setSelectedPurchaseType={setPurchaseType}
                        quantity={subscriptionQty}
                        setQuantity={setSubscriptionQty}
                        stockError={subscriptionStockError}
                        setStockError={setSubscriptionStockError}
                        vatRate={vatRate}   // 🟢 Add this
                        backorderState={backorderState}   // ⭐ REQUIRED
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2">
                      <div className="p-0">

                        <div className="mb-4">
                          {/* Price Section */}
                          <div className="flex flex-col gap-1 mb-4">
                            <div className="flex flex-wrap items-baseline gap-2.5">
                              {/* Old Prices */}
                              {(appliedCoupon || activeAutoDiscount) ? (
                                <span className="text-lg md:text-xl font-medium text-gray-400 line-through">
                                  £{basePrice.toFixed(2)} GBP
                                </span>
                              ) : (!appliedCoupon && !activeAutoDiscount && oldPriceData) ? (
                                <span className="text-lg md:text-xl font-medium text-gray-400 line-through">
                                  £{oldPriceData.oldPrice.toFixed(2)} GBP
                                </span>
                              ) : null}

                              {/* Sale Price */}
                              <span className="text- md:text-2xl font-medium text-[#e57e25]">
                                £{finalPrice.toFixed(2)} GBP
                              </span>

                              {/* Discount Percentage Pill */}
                              {discountPercentage > 0 && (
                                <span className="bg-[#d0021b] text-white text-sm font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider ml-1">
                                  {discountPercentage}% OFF
                                </span>
                              )}

                              {/* 🎫 Apply Coupon inline button — shown in price row when coupon available */}
                              {hasCouponAvailable && (
                                <button
                                  type="button"
                                  onClick={() => { if (appliedCoupon) { handleRemoveCoupon(); } else { setShowCouponModal(true); } }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all ${appliedCoupon
                                    ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                                    : "bg-[#d0021b] border-[#d0021b] text-white hover:bg-[#b0011a] animate-pulse"
                                    }`}
                                >
                                  <BadgePercent className="h-3.5 w-3.5" />
                                  {appliedCoupon ? "Remove Coupon" : "Apply Coupon"}
                                </button>
                              )}
                            </div>

                            {/* 🔥 OFFER PAGE BADGE — show when product has assigned discount */}
                            {discountSlug && (
                              <Link
                                href={`/offers/${discountSlug}`}
                                className="inline-flex items-center gap-1.5 mt-1.5 mb-2 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm hover:shadow transition-all duration-150 group w-fit"
                              >
                                <Zap className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                                <span>Qualifying Items — View Offer</span>
                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            )}

                            {/* Delivery Truck Line */}
                            {(() => {
                              const standardThresholdOpt = product.freeShippingThresholds?.find((x: any) => {
                                const name = (x.name || x.displayName || "").toLowerCase();
                                return name.includes("standard");
                              });
                              const isFree = !standardThresholdOpt || standardThresholdOpt.threshold === 0;
                              if (isFree) {
                                return (
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mt-2">
                                    <Truck className="h-5 w-5 text-[#e57e25]" />
                                    <span>Free Standard Delivery</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mt-2">
                                    <Truck className="h-5 w-5 text-[#e57e25]" />
                                    <span>Free Standard Delivery over £{standardThresholdOpt.threshold}</span>
                                  </div>
                                );
                              }
                            })()}

                            {/* VAT, Loyalty and Stock */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {vatRate !== null && vatRate > 0 && !product.vatExempt && (
                                <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md font-semibold">
                                  {vatRate}% VAT
                                </span>
                              )}
                              {loyaltyPoints && (
                                <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                  <AwardIcon className="h-3 w-3 text-orange-600" />
                                  Earn {loyaltyPoints} points
                                </span>
                              )}
                              {stockDisplay.show && (
                                <div
                                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${stockDisplay.type === "out"
                                    ? "bg-red-50 border border-red-200 text-red-700"
                                    : stockDisplay.type === "low"
                                      ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                                      : "bg-orange-50 border border-orange-200 text-orange-700"
                                    }`}
                                >
                                  <span
                                    className={`inline-block w-1.5 h-1.5 rounded-full ${stockDisplay.type === "out"
                                      ? "bg-red-600"
                                      : stockDisplay.type === "low"
                                        ? "bg-yellow-600"
                                        : "bg-orange-600"
                                      }`}
                                  ></span>
                                  {stockDisplay.text}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity & CTA Buttons Section */}
                          <div className="space-y-4 mb-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quantity</label>
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">

                                {/* Quantity Selector Container */}
                                <div className="flex items-center border border-gray-300 rounded-md bg-[#f3f4f6] h-10 w-32 justify-between flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-full px-3 text-gray-600 hover:bg-transparent"
                                    onClick={() => {
                                      const minQty = (selectedVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
                                      if (normalQty <= minQty) {
                                        toast.error(`Minimum order quantity is ${minQty}`);
                                        return;
                                      }
                                      setNormalQty(normalQty - 1);
                                    }}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <input
                                    type="number"
                                    className="w-10 text-center font-bold outline-none bg-transparent text-sm text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={normalQty === 0 ? "" : normalQty}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      if (!/^\d*$/.test(val)) return;
                                      if (val === "") {
                                        setNormalQty(0);
                                        return;
                                      }
                                      let num = parseInt(val, 10);
                                      const minQty = (selectedVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
                                      const maxStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
                                      const maxQty = (selectedVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? maxStock;
                                      const limit = Math.min(maxQty, maxStock);
                                      if (num < minQty) {
                                        toast.error(`Minimum order quantity is ${minQty}`);
                                        setNormalQty(minQty);
                                        return;
                                      }
                                      if (num > limit) {
                                        toast.error(`only ${limit} quantity left in stock `);
                                        setNormalQty(limit);
                                        return;
                                      }
                                      setNormalQty(num);
                                    }}
                                    onBlur={() => {
                                      const minQty = (selectedVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
                                      const maxStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
                                      const maxQty = (selectedVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? maxStock;
                                      const limit = Math.min(maxQty, maxStock);
                                      let val = normalQty;
                                      if (!val || val < minQty) val = minQty;
                                      if (val > limit) val = limit;
                                      setNormalQty(val);
                                    }}
                                    inputMode="numeric"
                                    min={1}
                                    max={selectedVariant?.stockQuantity ?? product.stockQuantity}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-full px-3 text-gray-600 hover:bg-transparent"
                                    onClick={() => {
                                      const maxStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
                                      const maxQty = (selectedVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? maxStock;
                                      const limit = Math.min(maxQty, maxStock);
                                      if (normalQty >= limit) {
                                        toast.error(`only ${limit} quantity left in stock`);
                                        return;
                                      }
                                      setNormalQty(normalQty + 1);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Action Buttons: Add to Cart & Buy Now */}
                                <div className="flex flex-row items-center gap-3 flex-1 w-full">
                                  {/* ADD TO CART */}
                                  {purchaseType === "one" && backorderState.canBuy && (
                                    <Button
                                      onClick={handleAddToCart}
                                      disabled={product.disableBuyButton}
                                      className="flex-1 h-10 rounded font-bold tracking-wider text-sm uppercase bg-black hover:bg-gray-900 text-white transition-colors"
                                    >
                                      Add to Cart
                                    </Button>
                                  )}

                                  {/* BUY NOW */}
                                  {purchaseType === "one" && backorderState.canBuy && (
                                    <Button
                                      onClick={handleBuyNow}
                                      disabled={product.disableBuyButton}
                                      className="flex-1 h-10 rounded font-bold tracking-wider text-sm uppercase bg-[#f2ad43] hover:bg-[#eba73a] text-black transition-colors"
                                    >
                                      BUY NOW &gt;&gt;
                                    </Button>
                                  )}

                                  {purchaseType === "one" && !backorderState.canBuy && (
                                    <Button
                                      onClick={() => setShowNotifyModal(true)}
                                      className="flex-1 h-12 rounded-md bg-white border border-[#f38918] hover:bg-orange-50 text-[#f38918] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                      <Bell className="h-4 w-4 animate-pulse text-[#f38918]" />
                                      Notify me
                                    </Button>

                                  )}
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 🔥 GROUPED PRODUCTS + BUNDLE OFFER (SINGLE BOX) */}
                        {purchaseType === "one" && isGroupedProduct && product.groupedProducts && (
                          <div className="block md:hidden mb-1 mt-0 border border-orange-100 bg-white rounded p-3">
                            <div className="flex items-center gap-3 mb-1">
                              <input
                                type="checkbox"
                                className="w-5 h-5 accent-black cursor-pointer"
                                checked={groupEnabled}
                                disabled={
                                  product.automaticallyAddProducts || hasOutOfStockGroupedProduct
                                }
                                onChange={(e) => setGroupEnabled(e.target.checked)}
                              />
                              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                                PAIR IT WITH :
                                {product.automaticallyAddProducts && (
                                  <span className="text-xs text-gray-500">(required)</span>
                                )}
                              </span>
                            </div>
                            {hasOutOfStockGroupedProduct && (
                              <p className="text-xs text-red-600 mb-1">
                                One or more required products are currently out of stock.
                              </p>
                            )}
                            {/* 🔥 BUNDLE OFFER MESSAGE */}
                            {product.groupBundleDiscountType &&
                              product.groupBundleDiscountType !== "None" && (
                                <div className="mb-2 bg-orange-50 border rounded p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                                  <div className="flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-[#f38918] flex-shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-[#f38918] leading-tight">
                                        Bundle Offer: Save {product.savingsPercentage}% when purchased together
                                      </span>
                                      {product.totalSavings && (
                                        <span className="text-[10px] font-semibold text-red-500 leading-tight">
                                          You save £{product.totalSavings.toFixed(2)} on this bundle
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* GROUPED ITEMS */}
                            <div className="space-y-2">
                              {product.groupedProducts.map(gp => {
                                const state = groupedSelections[gp.productId];
                                if (!state) return null;
                                return (
                                  <div
                                    key={gp.productId}
                                    className="flex items-center justify-between gap-2 bg-white rounded p-2 border"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {/* PRODUCT INFO */}
                                      {/* PRODUCT IMAGE */}
                                      <div className="w-10 h-10 flex-shrink-0 rounded border bg-white overflow-hidden p-0.5">
                                        <Link href={`/product/${gp.slug}`}>
                                          <img
                                            src={
                                              gp.mainImageUrl
                                                ? gp.mainImageUrl.startsWith("http")
                                                  ? gp.mainImageUrl
                                                  : `${process.env.NEXT_PUBLIC_API_URL}${gp.mainImageUrl}`
                                                : "/placeholder-product.png"
                                            }
                                            alt={"no img"}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                          />
                                        </Link>
                                      </div>
                                      <div className="min-w-0 pr-1">
                                        <Link href={`/product/${gp.slug}`}>
                                          <p className="text-xs font-semibold text-gray-900 truncate">{gp.name}</p>
                                        </Link>
                                        <p className="text-xs font-bold text-gray-900 mt-0.5">
                                          £{((gp.bundlePrice ?? gp.price) * normalQty).toFixed(2)} GBP
                                        </p>
                                        {gp.hasBundleDiscount && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <p className="text-[10px] text-gray-400 line-through">
                                              £{(gp.price * normalQty).toFixed(2)}
                                            </p>
                                            {typeof gp.individualSavings === "number" && (
                                              <p className="text-[10px] font-medium text-green-600">
                                                Save £{(gp.individualSavings * normalQty).toFixed(2)}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* QUANTITY */}
                                    <div className="flex items-center justify-center border rounded px-2 py-1 bg-gray-50 flex-shrink-0">
                                      <span className="text-[11px] font-bold text-gray-800 whitespace-nowrap">
                                        Qty: {normalQty}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* 🔥 BUNDLE TOTAL SUMMARY */}
                            <div className="mt-2 pt-2 border-t space-y-0.5">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Individual total</span>
                                <span>£{bundleIndividualTotal.toFixed(2)}</span>
                              </div>
                              {bundleTotalSavings > 0 && (
                                <div className="flex justify-between text-xs text-orange-800 font-medium">
                                  <span>You save</span>
                                  <span>£{bundleTotalSavings.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold text-red-500 pt-0.5">
                                <span>Bundle price</span>
                                <span>£{bundleTotalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Secure Checkout Box */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-[#f9fafb] mt-4">
                          <p className="text-center text-xs italic text-gray-500 mb-3">
                            Guarantee safe & secure checkout
                          </p>

                          <div className="flex justify-center items-center gap-4 opacity-95 flex-wrap">
                            <Image
                              src="/payments/visa.png"
                              alt="Payment Methods"
                              width={600}
                              height={60}
                              className="h-auto w-full max-w-[500px] object-contain"
                            />

                          </div>
                        </div>

                        {/* Action Links Row */}
                        <div className="flex items-center border-b gap-8 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setActiveTab("delivery");
                              const el = document.getElementById("product-tabs-section");
                              el?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-700 transition"
                          >
                            <Package className="h-4 w-4" />
                            <span>Delivery & Return</span>
                          </button>

                          <div className="relative">
                            <button
                              onClick={handleShareClick}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 text-base font-semibold text-black hover:text-gray-700 transition"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>

                            {showShare && (
                              <div className="absolute left-0 top-full mt-2 z-[999]">
                                <ShareMenu
                                  url={shareUrl}
                                  title={shareTitle}
                                  onClose={() => setShowShare(false)}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </>
                )}
                {/* About This Product */}
                <h3 className="text-lg font-semibold text-gray-900 mt-1 mb-1">
                  About This Product
                </h3>

                {/* Short description */}
                {product.shortDescription && (
                  <div className="mb-1 mt-0 p-0 bg-white rounded-lg">
                    <div
                      className="prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-h3:mt-0 prose-h3:mb-2"
                      dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Features Section */}
        <ProductFeatures features={product.features} />

        {/* CROSS-SELL PRODUCTS SLIDER */}
        {crossSellProducts.length > 0 && (
          <section className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Cross Sell Products
              </h2>
            </div>
            <div className="relative">
              {shouldShowCrossNav && (
                <>
                  <button
                    id="cross-prev"
                    className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20"
                  >
                    <ChevronLeft className="w-7 h-7 text-gray-700" />
                  </button>
                  <button
                    id="cross-next"
                    className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20"
                  >
                    <ChevronRight className="w-7 h-7 text-gray-700" />
                  </button>
                </>
              )}
              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                onSwiper={(swiper) => { crossSwiperRef.current = swiper; }}
                navigation={{ prevEl: "#cross-prev", nextEl: "#cross-next" }}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
                loop
                spaceBetween={16}
                slidesPerView={2}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 16 },
                  768: { slidesPerView: 3, spaceBetween: 20 },
                  1024: { slidesPerView: 4, spaceBetween: 22 },
                  1280: { slidesPerView: 5, spaceBetween: 24 },
                }}
                className="pb-10"
              >
                {crossSellProducts.map((p) => (
                  <SwiperSlide key={p.id}>
                    <CrossSellProductCard product={p as any} getImageUrl={getImageUrl} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}
        {/* RELATED PRODUCTS */}
        <section
          ref={relatedSectionRef}
          className={(hasTriggeredRelatedFetch && (isLoadingRelated || relatedProducts.length > 0)) ? "mt-10 scroll-mt-24" : "h-px opacity-0 overflow-hidden"}
        >
          {(isLoadingRelated || relatedProducts.length > 0) && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Related Products
                </h2>
              </div>

              {isLoadingRelated ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <RelatedProductSkeleton />
                  <RelatedProductSkeleton />
                  <div className="hidden sm:block">
                    <RelatedProductSkeleton />
                  </div>
                  <div className="hidden md:block">
                    <RelatedProductSkeleton />
                  </div>
                  <div className="hidden lg:block">
                    <RelatedProductSkeleton />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Desktop-only prev/next chevrons */}
                  {shouldShowRelatedNav && (
                    <>
                      <button
                        id="related-prev"
                        className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20"
                      >
                        <ChevronLeft className="w-7 h-7 text-gray-700" />
                      </button>

                      <button
                        id="related-next"
                        className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20"
                      >
                        <ChevronRight className="w-7 h-7 text-gray-700" />
                      </button>
                    </>
                  )}
                  <Swiper
                    modules={[Autoplay, Pagination, Navigation]}
                    onSwiper={(swiper) => { relatedSwiperRef.current = swiper; }}
                    navigation={{ prevEl: "#related-prev", nextEl: "#related-next" }}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    autoplay={{ delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    loop
                    spaceBetween={16}
                    slidesPerView={2}
                    breakpoints={{
                      640: { slidesPerView: 2, spaceBetween: 16 },
                      768: { slidesPerView: 3, spaceBetween: 20 },
                      1024: { slidesPerView: 4, spaceBetween: 22 },
                      1280: { slidesPerView: 5, spaceBetween: 24 },
                    }}
                    className="pb-10"
                  >
                    {relatedProducts.map((p) => (
                      <SwiperSlide key={p.id}>
                        <RelatedProductCard product={p} getImageUrl={getImageUrl} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </>
          )}
        </section>

        {/* recently viewed product section */}
        <RecentlyViewedSlider
          getImageUrl={getImageUrl}
          currentProductId={product.id}
        />
        {/* TABS, RELATED PRODUCTS and rest remain unchanged */}
        <Card id="product-tabs-section" className="mb-0 mt-5">
          <CardContent className="p-0">
            <div className="flex overflow-x-auto scrollbar-hide border-b">
              <button onClick={() => setActiveTab("description")} className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-bold whitespace-nowrap transition ${activeTab === "description" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}>
                Product Description
              </button>

              <button onClick={() => setActiveTab("delivery")} className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-bold whitespace-nowrap transition ${activeTab === "delivery" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}>
                Delivery
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === "description" && (
                <div>
                  {parsedDescription.sections.length > 0 ? (
                    <div className="space-y-4">
                      {parsedDescription.introduction && (
                        <div
                          className="prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-5 mb-5"
                          dangerouslySetInnerHTML={{ __html: parsedDescription.introduction }}
                        />
                      )}

                      {/* First H2 section: rendered statically without accordion */}
                      <div className="mb-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                          {parsedDescription.sections[0].title}
                        </h3>
                        <div
                          className="prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-5"
                          dangerouslySetInnerHTML={{ __html: parsedDescription.sections[0].html }}
                        />
                      </div>

                      {/* Subsequent H2 sections: rendered as accordions */}
                      {parsedDescription.sections.length > 1 && (
                        <div className="border-b border-gray-150">
                          {parsedDescription.sections.slice(1).map((section, index) => {
                            const sectionIndex = index + 1;
                            const isOpen = !!openDescriptionSections[sectionIndex];
                            return (
                              <div key={sectionIndex} className="border-t border-gray-150 py-3.5">
                                <button
                                  onClick={() => {
                                    setOpenDescriptionSections(prev => ({
                                      ...prev,
                                      [sectionIndex]: !prev[sectionIndex]
                                    }));
                                  }}
                                  className="flex items-center justify-between w-full text-left font-bold text-gray-900 hover:text-black py-1 focus:outline-none transition-colors"
                                >
                                  <span className="text-base sm:text-lg">{section.title}</span>
                                  {isOpen ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  )}
                                </button>
                                {isOpen && (
                                  <div
                                    className="mt-3 prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-5 transition-all duration-300"
                                    dangerouslySetInnerHTML={{ __html: section.html }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-5" dangerouslySetInnerHTML={{ __html: product.description }} />
                  )}
                  {(product.aPlusTemplateId || aplusTemplate) && aplusContent && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <APlusContentRenderer
                        aPlusTemplateId={product.aPlusTemplateId || aplusTemplate?.id}
                        aPlusContent={aplusContent}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "delivery" && (
                <div className="space-y-8">

                  {/* Delivery Information */}
                  <div className="border-l-4 border-black pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-black" />
                      <h3 className="font-bold text-lg">Delivery Information</h3>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      For all orders placed on the Houszy website, you can select from the following delivery options:
                    </p>

                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                      {allowedOptions.length > 0 ? (
                        allowedOptions.map((opt) => {
                          const name = (opt.displayName || opt.name || "");
                          const isNextDay = name.toLowerCase().includes("next");
                          const isFree = isNextDay && product.nextDayDeliveryFree;
                          const priceStr = isFree ? "FREE" : (opt.price !== undefined ? `£${opt.price.toFixed(2)}` : "");

                          return (
                            <li key={opt.id}>
                              <strong>{name}:</strong> {priceStr ? priceStr : "Available"}
                              {opt.description ? ` - ${opt.description}` : ""}
                            </li>
                          );
                        })
                      ) : (
                        <>
                          {product.standardDeliveryEnabled && (
                            <li>
                              <strong>Standard Delivery:</strong> £2.95
                              {(() => {
                                const standardOpt = product.freeShippingThresholds?.find((x: any) => {
                                  const name = (x.name || x.displayName || "").toLowerCase();
                                  return name.includes("standard");
                                });
                                if (standardOpt && standardOpt.threshold > 0) {
                                  return ` (Free over £${standardOpt.threshold})`;
                                }
                                return "";
                              })()}
                            </li>
                          )}

                          {product.nextDayDeliveryEnabled && (
                            <li>
                              <strong>Next Day Delivery:</strong> {product.nextDayDeliveryFree ? "FREE" : "£3.49"}
                            </li>
                          )}

                          {product.sameDayDeliveryEnabled && (
                            <li>
                              <strong>Same Day Delivery</strong>
                            </li>
                          )}
                        </>
                      )}
                    </ul>

                    <p className="text-sm text-gray-700 mt-4">
                      Deliveries usually take place between 10 AM and 8 PM. All estimated delivery times are calculated from the moment you place your order and do not include weekends or Bank Holidays. A customer signature may be required in some cases.
                    </p>

                    {product.nextDayDeliveryEnabled && (
                      <p className="text-sm text-gray-700 mt-3">
                        <strong>Next Day Delivery:</strong> Orders placed before {product.nextDayDeliveryCutoffTime || "1 PM"} Monday to Friday are dispatched the same day and delivered the next working day. Orders placed after {product.nextDayDeliveryCutoffTime || "1 PM"} on Friday or during the weekend will be delivered on the next available working day.
                      </p>
                    )}
                  </div>

                  {/* Return & Refund Policy */}
                  <div className="border-l-4 border-black pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-black" />
                      <h3 className="font-bold text-lg">Return & Refund Policy</h3>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      Your satisfaction is important to us. If the product you ordered is not what you were looking for, you may return the item in an unused condition within <strong>30 working days</strong> of receiving it.
                    </p>

                    <p className="text-sm text-gray-700 mb-3">
                      Items may be inspected or tried, but they must not be damaged, show signs of wear, and must be returned in their original packaging with all manufacturer labels attached.
                    </p>

                    <p className="text-sm text-gray-700 mb-3">
                      If a returned item is damaged, washed, or shows signs of regular use, the refund will not be processed.
                    </p>

                    <p className="text-sm text-gray-700">
                      Refunds are automatically processed once the returned item reaches our warehouse and successfully passes inspection.
                    </p>
                  </div>

                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {product.allowCustomerReviews && (
          <RatingReviews
            productId={product.id}
            allowCustomerReviews={product.allowCustomerReviews}
            highlightReviewId={highlightReviewId}
          />
        )}
        {showPharmaModal && (
          <PharmaQuestionsModal
            open={showPharmaModal}
            productId={product.id} // ✅ MAIN PRODUCT ID
            mode="add"
            onClose={() => {
              setShowPharmaModal(false);
              setPendingAction(null);
            }}
            onSuccess={() => {
              pharmaApprovedRef.current = true; // 🔥 VERY IMPORTANT
              setShowPharmaModal(false);
              if (pendingAction === "cart") {
                handleAddToCart();
              }
              if (pendingAction === "buy") {
                handleBuyNow();
              }
              setPendingAction(null);
              // 🔄 reset for next product / next flow
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
            variantId={selectedVariant?.id ?? null}
            onClose={() => setShowNotifyModal(false)}
          />
        )}
        {showCouponModal && (
          <CouponModal
            open={showCouponModal}
            onClose={() => setShowCouponModal(false)}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            appliedCoupon={appliedCoupon}
            offers={product.assignedDiscounts?.filter(d => d.requiresCouponCode) || []}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
            orderSubtotal={basePrice}
            productIds={[product.id]}
            categoryIds={product.categories?.map(c => c.categoryId)}
          />
        )}
        {showImageModal && (
          <ProductImageModal
            images={sortedImages}
            activeIndex={selectedImage}
            onClose={() => setShowImageModal(false)}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            getImageUrl={getImageUrl}
          />
        )}
      </main>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
