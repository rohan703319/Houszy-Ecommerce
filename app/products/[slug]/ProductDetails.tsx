// app/products/[slug]/ProductDetails.tsx
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RatingReviews from "@/components/product/RatingReviews";
import { Review, getRecentApprovedReviews } from "@/components/product/RatingReviews";
import RelatedProductCard from "@/components/product/RelatedProductCard";
import CrossSellProductCard from "@/components/product/CrossSellProductCard";
import SubscriptionPurchaseCard from "@/components/product/SubscriptionPurchaseCard";
import QuantitySelector from "@/components/shared/QuantitySelector";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import RecentlyViewedSlider from "@/components/recently-viewed/RecentlyViewedSlider";
import { getBackorderUIState } from "@/app/lib/backorderHelpers";
import BackInStockModal from "@/components/backorder/BackInStockModal";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ShoppingCart, Heart, Star, Minus, Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Truck, RotateCcw, ShieldCheck, Pause, Play, Package, Bike, Users, BadgePercent, Zap, BellRing, Share2, Gift, AwardIcon, MapPin, Clock, TruckElectric, TruckElectricIcon, Pill, Share, Share2Icon, LucideShare2, ShareIcon } from "lucide-react";
import ShareMenu from "@/components/share/ShareMenu";
import { Card, CardContent } from "@/components/ui/card";
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
import GenderBadge from "@/components/shared/GenderBadge";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import { useVatRates } from "@/app/hooks/useVatRates";
import { useCartActivity } from "@/context/CartContext";
// ---------- Types ----------
interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isMain: boolean;
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
     vatRateId?: string | null;
gender?: string;
 isRecurring?: boolean;
  recurringCycleLength?: number;
  recurringCyclePeriod?: string;
  recurringTotalCycles?: number;
  subscriptionDiscountPercentage?: number;
  allowCustomerReviews?: boolean;
    allowBackorder?: boolean;
  backorderMode?: string;
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
}
interface ProductDetailsProps {
  product: Product | null;
  initialVariantId?: string | null;
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

// ---------- Component ----------
export default function ProductDetails({ product, initialVariantId }: ProductDetailsProps & { initialVariantId?: string }) {
if (!product) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Product unavailable</p>
    </div>
  );
}

console.log("🧪 productType:", product.productType);
console.log("🧪 requireOtherProducts:", product.requireOtherProducts);
console.log("🧪 groupedProducts:", product.groupedProducts);
  const toast = useToast();
 const { addToCart, cart } = useCart();
 
  const router = useRouter();
  useCartActivity(product.id);
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const sliderRef = useRef<HTMLDivElement>(null);
  // Normal purchase quantity state
const [normalQty, setNormalQty] = useState(
  product.orderMinimumQuantity ?? 1
);
const [normalStockError, setNormalStockError] = useState<string | null>(null);
// Subscription purchase quantity state
const [subscriptionQty, setSubscriptionQty] = useState(1);
const [subscriptionStockError, setSubscriptionStockError] = useState<string | null>(null); 
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
const [thumbVisible, setThumbVisible] = useState(5);
useEffect(() => {
  const update = () => setThumbVisible(window.innerWidth < 768 ? 4 : 6);
  update();
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}, []);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
const [crossSellProducts, setCrossSellProducts] = useState<CrossSellProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "delivery">("description");
const [purchaseType, setPurchaseType] = useState<"one" | "subscription">("one");
const vatRates = useVatRates();
const [vatRate, setVatRate] = useState<number | null>(null);
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
const [shipDate, setShipDate] = useState<string | null>(null);
const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
const [nextDayTimeLeft, setNextDayTimeLeft] = useState<string | null>(null);
useEffect(() => {
  if (
    !isUKUser ||
    !product.nextDayDeliveryEnabled ||
    !product.nextDayDeliveryCutoffTime
  ) {
    setNextDayTimeLeft(null);
    setShipDate(null);
    setDeliveryDate(null);
    return;
  }
  const calculateTimeLeft = () => {
    const now = new Date();
    const [h, m] = product.nextDayDeliveryCutoffTime!.split(":").map(Number);
    const cutoff = new Date();
    cutoff.setHours(h, m, 0, 0);
    if (now >= cutoff) {
      setNextDayTimeLeft(null);
      setShipDate(null);
      setDeliveryDate(null);
      return;
    }
    const diffMs = cutoff.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    setNextDayTimeLeft(
      `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`
    );
    const ship = new Date();
    setShipDate(formatUKDate(ship));
    const deliver = new Date();
    deliver.setDate(deliver.getDate() + 1);
    setDeliveryDate(formatUKDate(deliver));
  };
  calculateTimeLeft();
  const interval = setInterval(calculateTimeLeft, 60_000);
  return () => clearInterval(interval);
}, [
  isUKUser,
  product.nextDayDeliveryEnabled,
  product.nextDayDeliveryCutoffTime,
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
  if (!product.groupedProducts) return 0;
  return product.groupedProducts.reduce(
    (sum, gp) => sum + gp.price * normalQty,
    0
  );
}, [product.groupedProducts, normalQty]);

const bundleTotalPrice = useMemo(() => {
  if (!product.groupedProducts) return 0;
  return product.groupedProducts.reduce(
    (sum, gp) => sum + (gp.bundlePrice ?? gp.price) * normalQty,
    0
  );
}, [product.groupedProducts, normalQty]);
const bundleTotalSavings = bundleIndividualTotal - bundleTotalPrice;
  // Discount & coupon states
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AssignedDiscount | null>(null);
const [finalPrice, setFinalPrice] = useState<number>(() => product?.price ?? 0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
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
  const currentSlug = pathname.split("/products/")[1];

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
  if (product.variants && product.variants.length  > 0)
 {
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
    const newPath = `/products/${variant.slug}`;
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
    .catch(() => {});
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
    window.history.replaceState(null, '', `/products/${selectedVariant.slug}`);
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
  updateVariantInUrl(autoMatch);
}
};
//vat dikhane ke liye
// useEffect(() => {
//   const fetchVatRates = async () => {
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/VATRates?activeOnly=true`);
//       const json = await res.json();
//       setVatRates(json.data || []);
//     } catch (err) {
//       console.error("VAT fetch error:", err);
//     }
//   };
//   fetchVatRates();
// }, []);
//vat dikhane ke liye
useEffect(() => {
  if (!product || !product.vatRateId || product.vatExempt) return;

  const rateValue = vatRates.find(r => r.id === product.vatRateId)?.rate;
  setVatRate(rateValue ?? null);
}, [vatRates, product]);
  // Reset state when product changes
useEffect(() => {
setSelectedImage(0);
  setNormalQty(product.orderMinimumQuantity ?? 1);
  setShowImageModal(false); 
  setActiveTab("description");
  setRelatedProducts([]);
  setCouponCode("");
  setAppliedCoupon(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
// ✅ STOCK (variant aware)
const stock = useMemo(() => {
  return selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
}, [selectedVariant, product.stockQuantity]);
// ✅ STOCK DISPLAY LOGIC (backend driven)
const stockDisplay = useMemo(() => {
  // ❌ Always dominant
 if (stock === 0) {
  return {
    show: false, // 🔥 HIDE BADGE
    text: "",
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
    setDiscountAmount(+totalDiscount.toFixed(2));
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
    setDiscountAmount(+autoAmount.toFixed(2));
    return;
  }

  // 🥉 NO DISCOUNT
  setFinalPrice(basePrice);
  setDiscountAmount(0);

}, [basePrice, appliedCoupon, activeAutoDiscount]);

 const allRequiredSelected = useMemo(() => {
  if (!isGroupedProduct) return true;
  return requiredProductIds.every(
    id => groupedSelections[id]?.selected === true
  );
}, [isGroupedProduct, requiredProductIds, groupedSelections]);
  // Fetch related products
  useEffect(() => {
    if (product.relatedProductIds) {
      fetchRelatedProducts(product.relatedProductIds);
    }
  }, [product.relatedProductIds]);
// Fetch cross-sell products
useEffect(() => {
  if (product.crossSellProductIds) {
    fetchCrossSellProducts(product.crossSellProductIds);
  }
}, [product.crossSellProductIds]);

  const fetchRelatedProducts = async (relatedIds: string) => {
    try {
      const ids = relatedIds.split(',').map(id => id.trim());
      const promises = ids.slice(0, 8).map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Products/${id}`, {
           next: { revalidate: 60 }
        }).then(res => res.json())
      );
      const results = await Promise.all(promises);
    const validProducts = results
  .filter((r: any) => r.success && r.data?.isPublished === true)
  .map((r: any) => r.data);    
      setRelatedProducts(
        validProducts.filter(
          (p: any, index: number, self: any[]) => index === self.findIndex(x => x.id === p.id)
        )
      );

    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };
  // Fetch cross-sell products
const fetchCrossSellProducts = async (crossIds: string) => {
  try {
    const ids = crossIds.split(',').map(id => id.trim());
    const promises = ids.slice(0, 8).map(id =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Products/${id}`, {
         next: { revalidate: 60 }
      }).then(res => res.json())
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
  const baseImages = [...(product.images ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  // 🔥 If variant selected & has image → inject as first thumbnail
  if (selectedVariant?.imageUrl) {
    return [
      {
        id: `variant-${selectedVariant.id}`,
        imageUrl: selectedVariant.imageUrl,
        altText: product.name,
        sortOrder: -1,
        isMain: true,
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
  return baseImages;
}, [product.images, selectedVariant, product.name]);

const activeMainImage = useMemo(() => {
  return getImageUrl(sortedImages[selectedImage]?.imageUrl);
}, [sortedImages, selectedImage, getImageUrl]);

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

const mainMin = product.orderMinimumQuantity ?? 1;

// 🔥 MAX ORDER CHECK (IMPORTANT FIX)
const mainMax = product.orderMaximumQuantity ?? Infinity;

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
    isUKUser && product.nextDayDeliveryEnabled === true;
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
      discountAmount: discountAmount ?? 0,
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
      nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
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
      discountAmount: discountAmount ?? 0,
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
      nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
      sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,

      productData: JSON.parse(JSON.stringify(product)),
    });
  }
 toast.success(
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm font-medium">
      {normalQty} × {product.name} added to cart!
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
  const mainMin = product.orderMinimumQuantity ?? 1;
  const mainMax = product.orderMaximumQuantity ?? Infinity;
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
    isUKUser && product.nextDayDeliveryEnabled === true;
  const buyNowItem = {
    id: `${product.id}-${selected?.id ?? "base"}-one`,
    type: "one-time",
    productId: product.id,
    name: `${product.name}${
      selected
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
    discountAmount: discountAmount ?? 0,
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
    nextDayDeliveryEnabled: product.nextDayDeliveryEnabled ?? false,
    // 🔥🔥🔥 MOST IMPORTANT FIX
// 🔥 FINAL CORRECT
nextDayDeliveryFree:
  product.nextDayDeliveryFree ?? false,
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
      {/* Breadcrumb */}
      <div className="hidden md:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav
      aria-label="Breadcrumb"
      className="flex flex-nowrap items-center gap-1 text-xs text-gray-600 overflow-hidden" >
      {/* Home */}
      <Link href="/" className="hover:text-[#445D41] whitespace-nowrap flex-shrink-0">
        Home
      </Link>
      {/* Categories */}
      {buildCategoryBreadcrumb(product.categories).map(cat => (
        <span key={cat.slug} className="flex items-center gap-1 flex-shrink-0">
          <span className="text-gray-400">/</span>
          <Link
            href={`/category/${cat.slug}`}
            className="hover:text-[#445D41] whitespace-nowrap" >
            {cat.name}
          </Link>
        </span>
      ))}
      {/* Product */}
      <span className="text-gray-400 flex-shrink-0">/</span>
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
          <div className="flex gap-2 items-start">

            {/* Vertical Thumbnail Strip */}
            <div className="flex flex-col items-center gap-1.5 w-[54px] md:w-[70px] flex-shrink-0">
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
              <div className="flex flex-col gap-1.5">
                {sortedImages
                  .slice(thumbStart, thumbStart + thumbVisible)
                  .map((img, idx) => {
                    const realIndex = thumbStart + idx;
                    return (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(realIndex)}
                        className={`cursor-pointer rounded-xl overflow-hidden w-[50px] h-[50px] md:w-[66px] md:h-[66px] flex-shrink-0 transition-all duration-200 border-2 bg-white
                          ${selectedImage === realIndex
                            ? "border-[#445D41] shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                          }`}
                      >
                        <div className="relative w-full h-full bg-white p-1">
                          <Image
                            src={getImageUrl(img.imageUrl)}
                            alt={img.altText || product.name}
                            fill
                            className="object-contain p-1"
                          />
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
            <div className="flex-1 relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
   <div className="relative bg-white overflow-hidden h-[250px] md:h-[390px] lg:h-[460px] flex items-center justify-center">

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
      onClick={() => setShowImageModal(true)}
      className="absolute inset-0 z-10 cursor-zoom-in"
    />

    <Image
      src={activeMainImage}
      alt={product.name}
      fill
      className="object-contain p-1 pointer-events-none"
      priority
      sizes="(max-width: 768px) 100vw, 50vw"
    />

    {/* 🔥 ZOOM OVERLAY */}
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
  </div>

<div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
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
      variantName: selectedVariant?.name,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      slug: product.slug,
      price: finalPrice,
      image: activeMainImage,
      vatRate: vatRate ?? null,
      vatExempt: product.vatExempt,
      sku: selectedVariant?.sku ?? product.sku,
      stockQuantity:
    selectedVariant?.stockQuantity ?? product.stockQuantity,
    });
    toast.success(isInWishlist(wishlistId) ? "Removed from wishlist" : "Added to wishlist!");
  }}
  className={`absolute top-3 right-3 z-20
    bg-white border border-gray-200 shadow-md
    hover:bg-white
    ${product.disableWishlistButton
      ? "opacity-50 cursor-not-allowed"
      : ""
    }`}
>
  <Heart className={`h-5 w-5 transition-colors ${isInWishlist(selectedVariant ? selectedVariant.id : product.id) ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
</Button>
  {/* Share */}
  <div className="relative">
   <Button
  size="icon"
  variant="ghost"
  onClick={handleShareClick}
   className="absolute top-14 right-3 z-20 
             bg-white hover:bg-white 
             border border-gray-200 
             shadow-md"
>
  <ShareIcon className="h-5 w-5 text-gray-700" />
</Button>
  {showShare && !isMobile && (
  <ShareMenu
    url={shareUrl}
    title={shareTitle}
    onClose={() => setShowShare(false)}
  />
)}
  </div>
</div>
                    {/* discount badge (from oldPrice percent) */}
    {(() => {
  // 🥇 PRIORITY 1: COUPON APPLIED → % OFF
// 🥇 PRIORITY 1: COUPON APPLIED → TOTAL % OFF (STACK SAFE)
if (appliedCoupon) {
  const totalPercent =
    basePrice > 0
      ? Math.round((discountAmount / basePrice) * 100)
      : 0;

  return (
    <div className="absolute top-3 left-4 z-20">
      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
        <div className="flex flex-col items-center leading-none">
          <span className="text-lg md:text-xl font-extrabold">
            {totalPercent}%
          </span>
          <span className="text-[10px] md:text-sm font-semibold">
            OFF
          </span>
        </div>
      </div>
    </div>
  );
}
  // 🥈 PRIORITY 2: AUTO DISCOUNT (NO COUPON REQUIRED)
  const activeAutoDiscount = product.assignedDiscounts?.find(
    d =>
      d.isActive &&
      d.requiresCouponCode === false &&
      new Date() >= new Date(d.startDate) &&
      new Date() <= new Date(d.endDate)
  );
  if (activeAutoDiscount) {
    const percent = activeAutoDiscount.usePercentage
      ? activeAutoDiscount.discountPercentage
      : Math.round(
          (activeAutoDiscount.discountAmount /
            (selectedVariant?.price ?? product.price)) * 100
        );
    return (
      <div className="absolute top-3 left-4 z-20">
        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
          <div className="flex flex-col items-center leading-none">
            <span className="text-lg md:text-xl font-extrabold">
              {percent}%
            </span>
            <span className="text-[10px] md:text-sm font-semibold">
              OFF
            </span>
          </div>
        </div>
      </div>
    );
  }
// 🥉 PRIORITY 3: COUPON AVAILABLE (NOT APPLIED)
if (hasCouponAvailable) {
  return (
    <div className="absolute top-3 left-4 z-20">
      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[11px] md:text-sm font-extrabold tracking-wide">
            COUPON
          </span>
          <span className="text-[9px] md:text-xs font-semibold">
            Available
          </span>
        </div>
      </div>
    </div>
  );
}
  return null;
})()}
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

          </div>

          {/* RIGHT: Product Info */}
          <div>
  {/* TITLE + BADGES (same line on desktop, stacked on mobile) */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-0">
    {/* PRODUCT NAME */}
 <h1 className="text-base md:text-xl font-semibold">
  {selectedVariant
    ? `${product.name} (${[
        selectedOptions.option1,
        selectedOptions.option2,
        selectedOptions.option3
      ].filter(Boolean).join(", ")})`
    : product.name}
</h1>
     </div>
 <div className="flex flex-wrap items-center gap-3 mb-2">
  {/* Brand */}
  {product.brandName && (
    <p className="text-sm text-gray-600">
      by <span className="font-semibold text-[#445D41]">{product.brandName}</span>
    </p>
  )}
{/* Rating + Reviews */}
<div className="flex items-center gap-2">
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= product.averageRating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))}
  </div>
  <span className="text-sm font-medium">
    {(product.averageRating ?? 0).toFixed(1)}
  </span>
  <div
    className="relative group inline-block"
    onClick={() => {
      const el = document.getElementById("reviews-section");
      el?.scrollIntoView({ behavior: "smooth" });
    }}
  >
    <span className="text-sm text-[#445D41] cursor-pointer">
      ({product.reviewCount || 0} reviews)
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
                setHighlightReviewId(r.id); // 🔥 PASS REVIEW ID
                const el = document.getElementById("reviews-list");
                el?.scrollIntoView({ behavior: "instant" });
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
              className="mt-2 w-full text-sm font-semibold text-[#445D41] hover:text-black"
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
    {/* VAT Exempt */}
    {product.vatExempt && (
      <div className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded text-xs font-semibold">
        <BadgePercent className="h-3 w-3" />
        VAT Exempt
      </div>
    )}
    {/* Unisex */}
    <GenderBadge
  gender={product.gender}
  absolute={false}
  className="bg-gray-100 text-gray-700 border border-purple-200 px-2 py-0 rounded text-xs font-semibold gap-1 shadow-none"
/>
{/* Pharma Product */}
{product.isPharmaProduct && (
  <div className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded text-xs font-semibold">
    <Pill className="h-3 w-3" />
    Pharma Product
  </div>
)}
  </div>
</div>
{isUKUser && product.nextDayDeliveryEnabled && nextDayTimeLeft && (
  <div className="mt-2 mb-3 rounded-xl border border-white bg-gradient-to-r from-green-50 via-white to-green-50 px-4 py-1 shadow-sm">
    <div className="flex items-center justify-between">
      {/* ORDER WITHIN */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#445D41] shadow-sm">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <p className="mt-1 text-[11px] font-medium text-[#445D41]">
          Order within
        </p>
        <p className="text-xs font-semibold text-emerald-900">
          {nextDayTimeLeft}
        </p>
      </div>
      {/* LINE */}
      <div className="mx-2 h-px flex-1 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />
      {/* SHIPS */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#445D41] shadow-sm">
          <Truck className="h-6 w-6 text-white" />
        </div>
        <p className="mt-1 text-[11px] font-medium text-[#445D41]">
          Ships
        </p>
       <p className="text-xs font-semibold text-[#445D41]">
  Today • {shipDate}
</p>
      </div>
      {/* LINE */}
      <div className="mx-2 h-px flex-1 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />

      {/* DELIVERS */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#445D41] shadow-sm">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <p className="mt-1 text-[11px] font-medium text-[#445D41]">
          Delivers
        </p>
       <p className="text-xs font-semibold text-[#445D41]">
  Tomorrow • {deliveryDate}
</p>
      </div>
    </div>   
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
  <>
    {/* OPTION 1 */}
    {product.variants?.[0]?.option1Name && (
      <div className="flex flex-wrap items-center gap-3 mb-4">
    <p className="text-sm font-semibold">
          {product.variants?.[0]?.option1Name}
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
      className={`px-3 py-1 rounded border text-sm ${
        selectedOptions.option1 === opt
          ? "bg-[#445D41] text-white border-[#445D41]"
          : "border-gray-300"
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
    <p className="text-sm font-semibold">
          {product.variants?.[0]?.option2Name}
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
              className={`px-3 py-1 rounded border text-sm ${
                selectedOptions.option2 === opt
                  ? "bg-[#445D41] text-white border-[#445D41]"
                  : "border-gray-300"
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
    <p className="text-sm font-semibold">
          {product.variants?.[0]?.option3Name}
        </p>

        <div className="flex flex-wrap gap-2">
          {[...new Set(
            product.variants
              ?.filter(v =>
                v.option1Value === selectedOptions.option1 &&
                v.option2Value === selectedOptions.option2
              )
                .filter(v =>
      v.option1Value === selectedOptions.option1 &&
      v.option2Value === selectedOptions.option2
  )
  .map(v => v.option3Value)

          )].map((opt) => (
            <button
              key={opt}
              onClick={() => updateSelection(3, opt)}
              className={`px-3 py-1 rounded border text-sm ${
                selectedOptions.option3 === opt
                  ? "bg-[#445D41] text-white border-[#445D41]"
                  : "border-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )}
  </>
)}
            {/* Price Card */}
            <Card className="mb-4">
              <CardContent className="p-4">
                {/* PURCHASE MODE CARDS SIDE BY SIDE */}
{product.isRecurring ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
    {/* LEFT NORMAL PURCHASE CARD */}
    <div
  id="normal-purchase-card"
   onClick={() => setPurchaseType("one")}
  className={`w-full transition-all duration-300 rounded-2xl  ${
    purchaseType === "one"
      ? "border-2 border-[#445D41] bg-[#f8faf9] shadow-md"
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
    className="h-4 w-4"
  />
  <span className="font-semibold text-sm">One-Time Purchase</span>
</label>
{/* Price + VAT + Loyalty — all compact inline */}
<div className="flex flex-wrap items-center gap-1.5 mb-2">
  <span className="text-lg font-bold text-[#445D41]">
    £{(finalPrice * normalQty).toFixed(2)}
  </span>
  {discountAmount > 0 && (
    <span className="text-xs text-gray-400 line-through">
      £{(basePrice * normalQty).toFixed(2)}
    </span>
  )}
  {vatRate !== null && (
    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md font-semibold">
      {vatRate}% VAT
    </span>
  )}
  {loyaltyPoints && (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
      <AwardIcon className="h-3 w-3 text-green-600" />
      Earn {loyaltyPoints} pts
    </span>
  )}
</div>

{/* Qty + Stock — same row */}
<div className="flex items-center gap-2 mb-2 flex-wrap">
  <QuantitySelector
    quantity={normalQty}
    setQuantity={setNormalQty}
    maxStock={groupedMaxQty}
    stockError={normalStockError}
    setStockError={setNormalStockError}
    minQty={product.orderMinimumQuantity ?? 1}
    maxQty={product.orderMaximumQuantity}
  />
  {stockDisplay.show && (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${
      stockDisplay.type === "out" ? "bg-red-100 text-red-700"
      : stockDisplay.type === "low" ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-700"
    }`}>
      <span className={`inline-block w-2 h-2 rounded-full ${
        stockDisplay.type === "out" ? "bg-red-600"
        : stockDisplay.type === "low" ? "bg-yellow-600"
        : "bg-green-600"
      }`}></span>
      {stockDisplay.text}
    </div>
  )}
  {product.assignedDiscounts?.some(d => d.requiresCouponCode) && (
    <button
      type="button"
      onClick={() => { if (appliedCoupon) { handleRemoveCoupon(); } else { setShowCouponModal(true); } }}
      className={`text-xs font-semibold flex items-center gap-1 ${appliedCoupon ? "text-red-600" : "text-[#445D41]"}`}
    >
      <BadgePercent className="h-3.5 w-3.5" />
      {appliedCoupon ? "Remove coupon" : "Apply coupon"}
    </button>
  )}
</div>

<div className="flex items-center gap-2">
  {/* ADD TO CART */}
  {purchaseType === "one" && backorderState.canBuy && (
    <Button
      onClick={handleAddToCart}
      disabled={product.disableBuyButton || (isGroupedProduct && !allRequiredSelected)}
      className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 bg-[#445D41] hover:bg-black text-white disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="h-4 w-4" />
      Add to Cart
    </Button>
  )}
  {/* BUY NOW */}
  {purchaseType === "one" && backorderState.canBuy && (
    <Button
      onClick={handleBuyNow}
      disabled={product.disableBuyButton}
      className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 bg-[#445D41] hover:bg-black text-white disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Zap className="h-4 w-4" />
      Buy Now
    </Button>
  )}
  {purchaseType === "one" && !backorderState.canBuy && !backorderState.showNotify && (
    <Button disabled className="flex-1 py-2 rounded-xl bg-red-400 cursor-not-allowed opacity-70 text-white text-sm">
      Out of Stock
    </Button>
  )}
  {purchaseType === "one" && backorderState.showNotify && (
    <Button variant="outline" className="flex-1 py-2 rounded-xl border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-sm" onClick={() => setShowNotifyModal(true)}>
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
  className={`w-full transition-all duration-300 rounded-2xl ${
    purchaseType === "subscription"
      ? "border-2 border-[#445D41] bg-[#f8faf9] shadow-md"
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
   <Card className="mb-2 border border-gray-200 rounded-2xl shadow-sm">
  <CardContent className="p-3">
    {/* Price + VAT + Loyalty — all compact inline */}
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      <span className="text-lg md:text-2xl font-bold text-[#445D41]">
        £{(finalPrice * normalQty).toFixed(2)}
      </span>
      {discountAmount > 0 && (
        <span className="text-xs text-gray-400 line-through">
        £{(basePrice * normalQty).toFixed(2)}
        </span>
      )}
      {vatRate !== null && (
        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded font-semibold">
          {vatRate}% VAT
        </span>
      )}
     {loyaltyPoints && (
  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
    <AwardIcon className="h-3 w-3 text-[#445D41]" />
    Earn {loyaltyPoints} pts
  </span>
)}
    </div>
            {/* Quantity + Stock — same row, no label */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
<div className="flex items-center border border-gray-300 rounded-lg">
  {/* - Button */}
<Button
  variant="ghost"
  size="sm"
  className="px-2"
  onClick={() => {
    const minQty = product.orderMinimumQuantity ?? 1;
    if (normalQty <= minQty) {
      toast.error(`Minimum order quantity is ${minQty}`);
      return;
    }
    setNormalQty(normalQty - 1);
  }}
>
    <Minus className="h-3 w-3" />
  </Button>
  {/* Quantity Input */}
 <input
  type="number"
  className="w-8 text-center font-semibold outline-none border-l border-r border-gray-300 text-sm"
  value={normalQty === 0 ? "" : normalQty}
 onChange={(e) => {
  let val = e.target.value;
  if (!/^\d*$/.test(val)) return;
  if (val === "") {
    setNormalQty(0);
    return;
  }
  let num = parseInt(val, 10);
  const minQty = product.orderMinimumQuantity ?? 1;
  const maxStock =
    selectedVariant?.stockQuantity ?? product.stockQuantity;
  const maxQty =
    product.orderMaximumQuantity ?? maxStock;
  const limit = Math.min(maxQty, maxStock);
  if (num < minQty) {
    toast.error(`Minimum order quantity is ${minQty}`);
    setNormalQty(minQty);
    return;
  }
  if (num > limit) {
    toast.error(`Maximum order quantity is ${limit}`);
    setNormalQty(limit);
    return;
  }
  setNormalQty(num);
}}
  onBlur={() => {
  const minQty = product.orderMinimumQuantity ?? 1;
  const maxStock =
    selectedVariant?.stockQuantity ?? product.stockQuantity;
  const maxQty =
    product.orderMaximumQuantity ?? maxStock;
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
  {/* + Button */}
 <Button
  variant="ghost"
  size="sm"
  className="px-2"
  onClick={() => {
    const maxStock =
      selectedVariant?.stockQuantity ?? product.stockQuantity;
    const maxQty =
      product.orderMaximumQuantity ?? maxStock;
    const limit = Math.min(maxQty, maxStock);
    if (normalQty >= limit) {
      toast.error(`Maximum order quantity is ${limit}`);
      return;
    }
    setNormalQty(normalQty + 1);
  }}
>
    <Plus className="h-3 w-3" />
  </Button>
  </div>


 {normalStockError && (
  <p className="text-red-600 text-xs mt-1">{normalStockError}</p>
)}
                    {/* ⭐ PREMIUM Stock Badge */}
   {stockDisplay.show && (
  <div
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${
      stockDisplay.type === "out"
        ? "bg-red-100 text-red-700"
        : stockDisplay.type === "low"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-50 border border-green-200 text-green-700"
    }`}
  >
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        stockDisplay.type === "out"
          ? "bg-red-600"
          : stockDisplay.type === "low"
          ? "bg-yellow-600"
          : "bg-green-600"
      }`}
    ></span>
    {stockDisplay.text}
  </div>
)}
{product.assignedDiscounts?.some(d => d.requiresCouponCode) && (
  <button
    type="button"
    onClick={() => {
      if (appliedCoupon) {
        handleRemoveCoupon();
      } else {
        setShowCouponModal(true);
      }
    }}
    className={`mt-0 text-sm font-semibold flex items-center gap-1 leading-none
      ${appliedCoupon ? "text-red-600 hover:text-red-800" : "text-[#445D41] hover:text-black"}
    `}
  >
    <BadgePercent className="h-4 w-4" />
    {appliedCoupon ? "Click to remove coupon" : "Click to apply coupon"}
  </button>
)}
  {/* Buttons — same row as qty+stock on desktop, wrap on mobile */}
  <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
    {/* ADD TO CART */}
    {purchaseType === "one" && backorderState.canBuy && (
      <Button
        onClick={handleAddToCart}
        disabled={product.disableBuyButton}
        className="flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2
          bg-[#445D41] hover:bg-black text-white
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-4 w-4" />
        Add to Cart
      </Button>
    )}
    {/* BUY NOW */}
    {purchaseType === "one" && backorderState.canBuy && (
      <Button
        onClick={handleBuyNow}
        disabled={product.disableBuyButton}
        className="flex-1 py-2 rounded-xl font-semibold
          bg-[#445D41] hover:bg-black text-white
          flex items-center justify-center gap-2
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Zap className="h-4 w-4" />
        Buy Now
      </Button>
    )}
    {/* OUT OF STOCK (NO BACKORDER, NO NOTIFY) */}
    {purchaseType === "one" && !backorderState.canBuy && !backorderState.showNotify && (
      <Button
        disabled
        className="flex-1 py-2 rounded-xl bg-red-400 cursor-not-allowed opacity-70 text-white"
      >
        Out of Stock
      </Button>
    )}
    {/* NOTIFY MODE */}
    {purchaseType === "one" && backorderState.showNotify && (
      <Button
        variant="outline"
        className="flex-1 px-3 py-2 rounded-lg border-green-600 text-green-700 hover:bg-green-50 text-sm flex items-center justify-center gap-2"
        onClick={() => setShowNotifyModal(true)}
      >
        <BellRing className="h-4 w-4" />
        Notify me when available
      </Button>
    )}
  </div>
</div>
      </CardContent>
    </Card>
  </>
)}
{/* Trust Badges — below buy buttons, inside right column card */}
<div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-gray-100">
  <div className="flex flex-col items-center text-center gap-0.5">
    <Truck className="h-6 w-6 text-[#445D41]" />
    <p className="text-[12px] font-semibold">Free Shipping</p>
    <p className="text-[12px] text-gray-500">Over £35</p>
  </div>
  <div className="flex flex-col items-center text-center gap-0.5">
    <RotateCcw className={`h-6 w-6 ${product.notReturnable ? "text-red-700" : "text-[#445D41]"}`} />
    <p className={`text-[12px] font-semibold ${product.notReturnable ? "text-red-700" : ""}`}>
      {product.notReturnable ? "Non-Returnable" : "Easy Returns"}
    </p>
    <p className="text-[12px] text-gray-500">
      {product.notReturnable ? "Cannot return" : "30 Days"}
    </p>
  </div>
  <div className="flex flex-col items-center text-center gap-0.5">
    <ShieldCheck className="h-6 w-6 text-[#445D41]" />
    <p className="text-[12px] font-semibold">Secure Payment</p>
    <p className="text-[12px] text-gray-500">SSL Encrypted</p>
  </div>
</div>
{/* 🔥 GROUPED PRODUCTS + BUNDLE OFFER (SINGLE BOX) */}
{purchaseType === "one" && isGroupedProduct && product.groupedProducts && (
  <div className="mb-1 mt-3 border border-green-2 bg-white rounded-xl p-4">
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
    Include required products
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
        <div className="mb-3 bg-green-50 border rounded-lg p-3">
         <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
  <Gift className="w-8 h-8 text-green-700" />
  <span>
    Bundle Offer: Save {product.savingsPercentage}% when purchased together
  </span>
</p>
          {product.groupBundleSavingsMessage && (
            <p className="text-xs text-green-700 mt-1">
              {product.groupBundleSavingsMessage}
            </p>
          )}
          {product.totalSavings && (
            <p className="text-xs text-green-700 mt-1">
              You save £{product.totalSavings.toFixed(2)} on this bundle
            </p>
          )}
        </div>
      )}
    {/* TITLE */}
    <p className="text-sm font-semibold text-yellow-800 mb-3">
      This product must be purchased with:
    </p>
    {/* GROUPED ITEMS */}
    <div className="space-y-3">
      {product.groupedProducts.map(gp => {
        const state = groupedSelections[gp.productId];
        if (!state) return null;
        return (
          <div
            key={gp.productId}
            className="flex items-center justify-between gap-3 bg-white rounded-lg p-3 border"
          >
            <div className="flex items-center gap-2">
              {/* PRODUCT INFO */}
              {/* PRODUCT IMAGE */}
<div className="w-14 h-16 flex-shrink-0 rounded-lg border bg-white overflow-hidden">
  <Link href={`/products/${gp.slug}`}>
  <img
    src={
      gp.mainImageUrl
        ? gp.mainImageUrl.startsWith("http")
          ? gp.mainImageUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${gp.mainImageUrl}`
        : "/placeholder-product.png"
    }
    alt={"no img"}
    className="w-full h-full object-contain p-1 mt-2"
    loading="lazy"
  />
  </Link>
</div>
              <div>
               <Link href={`/products/${gp.slug}`}>
                <p className="text-sm font-semibold">{gp.name}</p>
                </Link>
                <p className="text-sm font-semibold text-gray-900">
                  £{((gp.bundlePrice ?? gp.price) * normalQty).toFixed(2)}
                </p>
                {gp.hasBundleDiscount && (
                  <>
                    <p className="text-xs text-gray-400 line-through">
  £{(gp.price * normalQty).toFixed(2)}
</p>
                   {typeof gp.individualSavings === "number" && (
  <p className="text-xs text-green-700">
  You save £{(gp.individualSavings * normalQty).toFixed(2)}
</p>

)}
                  </>
                )}
              </div>
            </div>
            {/* QUANTITY */}
    <div className="flex items-center justify-center border rounded-lg px-3 py-1.5 bg-gray-50 min-w-[110px]">
  <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
    Quantity: {normalQty}
  </span>
</div>
          </div>
        );
      })} 
    </div>
  {/* 🔥 BUNDLE TOTAL SUMMARY */}
   <div className="mt-4 pt-3 border-t space-y-1">
  <div className="flex justify-between text-sm text-gray-600">
    <span>Individual total</span>
    <span>£{bundleIndividualTotal.toFixed(2)}</span>
  </div>
 {bundleTotalSavings > 0 && (
    <div className="flex justify-between text-sm text-green-800 font-medium">
      <span>You save</span>
      <span>£{bundleTotalSavings.toFixed(2)}</span>
    </div>
  )}
  <div className="flex justify-between text-base font-semibold text-green-700">
    <span>Bundle price</span>
    <span>£{bundleTotalPrice.toFixed(2)}</span>
  </div>
</div>
  </div>
)}
              {/* Short description */}
{product.shortDescription && (
  <div className="mb-1 mt-1 p-2 bg-white rounded-lg">
    <div
      className=" prose prose-sm max-w-none text-gray-700 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-h3:mt-0 prose-h3:mb-2 " dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
  </div>
)}
              </CardContent>
            </Card>
          </div>
        </div>

 {/* RELATED PRODUCTS */}
 {relatedProducts.length > 0 && (
<section className="mt-10">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
      Related Products
    </h2>
  </div>
  <div className="relative">
    {/* Desktop-only prev/next chevrons */}
    <button
      onClick={() => relatedSwiperRef.current?.slidePrev()}
      className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0"
    >
      <ChevronLeft className="w-8 h-8 text-gray-700" />
    </button>
    <button
      onClick={() => relatedSwiperRef.current?.slideNext()}
      className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0"
    >
      <ChevronRight className="w-8 h-8 text-gray-700" />
    </button>
    <Swiper
      modules={[Autoplay, Pagination]}
      onSwiper={(swiper) => { relatedSwiperRef.current = swiper; }}
      pagination={{ clickable: true, dynamicBullets: true }}
      autoplay={{ delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true, }}
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
</section>
)}
{/* CROSS-SELL PRODUCTS */}
 {crossSellProducts.length > 0 && (
<section className="mt-10">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
      Frequently Bought Together
    </h2>
  </div>
  <div className="relative">
    {/* Desktop-only prev/next chevrons */}
    <button
      onClick={() => crossSwiperRef.current?.slidePrev()}
      className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0"
    >
      <ChevronLeft className="w-8 h-8 text-gray-700" />
    </button>
    <button
      onClick={() => crossSwiperRef.current?.slideNext()}
      className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-0 m-0"
    >
      <ChevronRight className="w-8 h-8 text-gray-700" />
    </button>
    <Swiper
      modules={[Autoplay, Pagination]}
      onSwiper={(swiper) => { crossSwiperRef.current = swiper; }}
      pagination={{ clickable: true, dynamicBullets: true }}
      autoplay={{ delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true, }}
      loop
      spaceBetween={16}
      slidesPerView={2}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 22 },
          1280: { slidesPerView: 5, spaceBetween: 24 },
      }}
      className="pb-10" >
      {crossSellProducts.map((crossProduct) => (
        <SwiperSlide key={crossProduct.id}>
          <CrossSellProductCard
            product={crossProduct}
            getImageUrl={getImageUrl}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>
)}
{/* recently viewed product section */}
<RecentlyViewedSlider
  getImageUrl={getImageUrl}
  currentProductId={product.id}
/>
        {/* TABS, RELATED PRODUCTS and rest remain unchanged */}
        <Card className="mb-0 mt-5">
          <CardContent className="p-0">
            <div className="flex overflow-x-auto scrollbar-hide border-b">
              <button onClick={() => setActiveTab("description")} className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap transition ${activeTab === "description" ? "border-b-2 border-[#445D41] text-[#445D41]" : "text-gray-600 hover:text-[#445D41]"}`}>
                Product Description
              </button>
              <button onClick={() => setActiveTab("specifications")} className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap transition ${activeTab === "specifications" ? "border-b-2 border-[#445D41] text-[#445D41]" : "text-gray-600 hover:text-[#445D41]"}`}>
                Specifications
              </button>
              <button onClick={() => setActiveTab("delivery")} className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold whitespace-nowrap transition ${activeTab === "delivery" ? "border-b-2 border-[#445D41] text-[#445D41]" : "text-gray-600 hover:text-[#445D41]"}`}>
                Delivery
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === "description" && (
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
              )}
             {activeTab === "specifications" && (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {(product.attributes && product.attributes.length > 0 ? (
      product.attributes
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((attr, idx) => (
          <div
            key={attr.id}
            className={`flex items-start sm:items-center justify-between gap-4 px-4 py-3
              ${idx !== product.attributes!.length - 1 ? "border-b" : ""}
              hover:bg-gray-50 transition`}
          >
            <span className="text-sm font-semibold text-gray-700">
              {attr.displayName || attr.name}
            </span>
            <span className="text-sm text-gray-600 text-right max-w-[60%]">
              {attr.value}
            </span>
          </div>
        ))
    ) : (
      <>
        <div className="flex justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-gray-700">Weight</span>
          <span className="text-sm text-gray-600">
            {product.weight} {product.weightUnit}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">SKU</span>
          <span className="text-sm text-gray-600">{product.sku}</span>
        </div>
      </>
    ))}
  </div>
)}
              {activeTab === "delivery" && (
                <div className="space-y-6">
                  <div className="border-l-4 border-[#445D41] pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-[#445D41]" />
                      <h3 className="font-bold text-lg">Standard Delivery</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">We offer a reliable Standard Delivery service for just <strong>£2.99</strong>. Enjoy free standard delivery on orders over <strong>£35</strong>.</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Orders processed between 10 AM and 8 PM</li>
                      <li>Estimated delivery: 1-2 working days</li>
                      <li>Excludes weekends and Bank Holidays</li>
                    </ul>
                  </div>
                  {/* other delivery options... */}
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
