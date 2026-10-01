"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  Clock,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Percent,
  Flame,
} from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export interface OfferDiscount {
  id: string;
  name: string;
  slug: string;
  discountType: string;
  usePercentage: boolean;
  discountAmount: number;
  discountPercentage?: number;
  maximumDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  requiresCouponCode: boolean;
  couponCode?: string;
  desktopBannerImageUrl?: string;
  mobileBannerImageUrl?: string;
  productCount?: number;
  adminComment?: string;
  buyQuantity?: number;
  getQuantity?: number;
  tiers?: {
    id?: string;
    quantity: number;
    discountPercentage: number;
  }[];
}

interface HomeOffersSectionProps {
  discounts: OfferDiscount[];
  baseUrl: string;
}

export default function HomeOffersSection({ discounts, baseUrl }: HomeOffersSectionProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!discounts || discounts.length === 0) {
    return null;
  }

  // Filter only valid discounts with a slug or name
  const validDiscounts = discounts.filter((d) => Boolean(d.name));

  if (validDiscounts.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gradient-to-b from-white via-slate-50/50 to-white py-6 md:py-12 border-y border-slate-100/80">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">

        {/* ===== TOP HEADER: Standard Section Heading (Matches All Homepage Sections) ===== */}
        <div className="relative flex items-center justify-between md:justify-center mb-5 md:mb-8 min-h-[40px] w-full px-1 gap-2">
          <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[34px] font-extrabold text-black tracking-tight text-left md:text-center">
            Featured <span className="text-[#f38918]">Offers & Deals</span>
          </h2>

          <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 shrink-0">
            <Link href="/offers">
              <button
                type="button"
                className="group inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-white bg-[#f38918] hover:bg-[#e07a10] rounded-md px-3 sm:px-4 py-1.5 md:py-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
              >
                <span className="sm:hidden">View All</span>
                <span className="hidden sm:inline">View All Offers</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>

        {/* ===== CARDS CAROUSEL / GRID WITH SIDE CHEVRONS (CategorySlider Pattern) ===== */}
        {mounted ? (
          <div className="relative">
            {/* Left Chevron Button */}
            {validDiscounts.length > 2 && (
              <button
                id="offerPrev"
                aria-label="Previous Offer"
                className="hidden md:flex absolute -left-3 lg:-left-6 top-[50%] -translate-y-1/2 z-30 w-10 h-10 lg:w-11 lg:h-11 items-center justify-center bg-white hover:bg-[#f38918] text-slate-700 hover:text-white rounded-md shadow-md hover:shadow-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Chevron Button */}
            {validDiscounts.length > 2 && (
              <button
                id="offerNext"
                aria-label="Next Offer"
                className="hidden md:flex absolute -right-3 lg:-right-6 top-[50%] -translate-y-1/2 z-30 w-10 h-10 lg:w-11 lg:h-11 items-center justify-center bg-white hover:bg-[#f38918] text-slate-700 hover:text-white rounded-md shadow-md hover:shadow-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              loop={validDiscounts.length > 2}
              navigation={
                validDiscounts.length > 2
                  ? {
                    prevEl: "#offerPrev",
                    nextEl: "#offerNext",
                  }
                  : false
              }
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                el: ".offers-swiper-pagination",
                bulletClass: "offers-pagination-bullet",
                bulletActiveClass: "offers-pagination-bullet-active",
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  spaceBetween: 16,
                },
                480: {
                  slidesPerView: 1.15,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              className="!pb-2"
            >
              {validDiscounts.map((discount, idx) => (
                <SwiperSlide key={discount.id || idx} className="h-auto">
                  <OfferCard discount={discount} baseUrl={baseUrl} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Mobile Pagination Dots */}
            <div className="offers-swiper-pagination flex items-center justify-center gap-1.5 mt-5 md:hidden"></div>
          </div>
        ) : (
          /* Server fallback / Skeleton while Swiper mounts */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validDiscounts.slice(0, 3).map((discount, idx) => (
              <OfferCard key={discount.id || idx} discount={discount} baseUrl={baseUrl} />
            ))}
          </div>
        )}

      </div>

      {/* Embedded Swiper Custom Pagination Styles */}
      <style jsx global>{`
        .offers-pagination-bullet {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background-color: #cbd5e1;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .offers-pagination-bullet-active {
          width: 24px;
          height: 8px;
          background-color: #f38918;
          border-radius: 9999px;
        }
      `}</style>
    </section>
  );
}

/* ================= CARD COMPONENT ================= */

function OfferCard({ discount, baseUrl }: { discount: OfferDiscount; baseUrl: string }) {
  const bannerUrl = discount.desktopBannerImageUrl || discount.mobileBannerImageUrl;
  const fullBannerUrl = bannerUrl
    ? bannerUrl.startsWith("http")
      ? bannerUrl
      : `${baseUrl}${bannerUrl}`
    : null;

  const daysLeft = getDaysLeft(discount.endDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
  const href = discount.slug ? `/offers/${discount.slug}` : "/offers";

  // Discount highlight label
  const discountLabel = formatDiscountBadge(discount);

  return (
    <Link
      href={href}
      className="group relative flex flex-col bg-gradient-to-b from-white via-white to-amber-50/25 rounded-2xl overflow-hidden border border-slate-200/90 hover:border-[#f38918] shadow-xs hover:shadow-[0_12px_28px_-6px_rgba(243,137,24,0.18)] transition-all duration-300 h-full cursor-pointer select-none"
    >
      {/* 1. TOP HEADER STRIP (Colorful, compact, cleanly above image) */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-rose-50/80 border-b border-orange-100/60 flex items-center justify-between gap-2">
        {/* Main Discount Highlight Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-500 to-[#f38918] text-white shadow-xs">
          <Flame className="w-3 h-3 fill-current shrink-0" />
          <span className="truncate">{discountLabel}</span>
        </span>

        {/* Expiry Countdown (or Product Count if no expiry) */}
        {daysLeft !== null && daysLeft <= 14 ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shrink-0 shadow-2xs ${isExpiringSoon
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-white/90 text-orange-700 border border-orange-200/80"
              }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>{daysLeft === 0 ? "Ends Today!" : `${daysLeft}d left`}</span>
          </span>
        ) : discount.productCount != null && discount.productCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
            <ShoppingBag className="w-3 h-3 text-slate-400" />
            <span>{discount.productCount} {discount.productCount === 1 ? "Item" : "Items"}</span>
          </span>
        ) : null}
      </div>

      {/* 2. BANNER IMAGE CONTAINER (Cross-browser GPU stable ambient fill for Chrome & Firefox) */}
      <div
        className="relative w-full aspect-[16/9] overflow-hidden isolate flex items-center justify-center border-b border-slate-100 bg-slate-900/5"
        style={{ transform: "translateZ(0)" }}
      >
        {fullBannerUrl ? (
          <>
            {/* Ambient Blurred Fill: GPU accelerated for zero flickering across all browsers */}
            <img
              src={fullBannerUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-75 pointer-events-none select-none transform-gpu"
              style={{ willChange: "transform", transform: "translateZ(0) scale(1.15)" }}
            />
            {/* Subtle soft tint layer (without backdrop-blur to eliminate Firefox WebRender bug) */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />

            {/* Foreground Contained Banner: 100% fully visible, sharp, smooth hover without blinking */}
            <img
              src={fullBannerUrl}
              alt={discount.name}
              loading="lazy"
              className="relative z-10 w-full h-full object-contain drop-shadow-xs group-hover:scale-[1.02] transition-transform duration-300 ease-out transform-gpu"
              style={{ willChange: "transform" }}
            />
          </>
        ) : (
          /* High-end Styled Abstract Gradient Fallback */
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#f38918]/25 rounded-md blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-amber-500/20 rounded-md blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center p-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner mb-1.5 group-hover:scale-105 transition-transform duration-300">
                <Percent className="w-5 h-5 text-[#f38918]" />
              </div>
              <span className="text-white font-black text-xs tracking-wide uppercase">
                {discount.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. CARD BODY (Ultra Compact & Clean: No Instant Deal, No Explore Collection, No bottom line) */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-extrabold text-[#f38918] group-hover:text-[#d97706] text-[15px] sm:text-[17px] leading-snug line-clamp-1 transition-colors mb-1">
          {discount.name}
        </h3>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-[13px] text-slate-500 line-clamp-1 leading-normal font-normal mb-2">
          {discount.adminComment || getOfferSummary(discount)}
        </p>

        {/* Badges Row: Product count & Tier preview pills (Instant Deal removed) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {discount.productCount != null && discount.productCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              <ShoppingBag className="w-3 h-3 text-slate-400" />
              <span>{discount.productCount} {discount.productCount === 1 ? "Product" : "Products"}</span>
            </span>
          )}

          {discount.discountType === "TieredQuantity" && discount.tiers && discount.tiers.length > 0 && (
            discount.tiers.slice(0, 2).map((tier, tIdx) => (
              <span
                key={tIdx}
                className="text-[9px] font-bold text-amber-900 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-md"
              >
                Buy {tier.quantity}+ → {tier.discountPercentage}% Off
              </span>
            ))
          )}
        </div>

        {/* Shop Now Button: Full-width vibrant orange button matching user reference image */}
        <div className="mt-auto pt-1">
          <div className="w-full py-2 sm:py-2.5 px-4 bg-[#f38918] hover:bg-[#e07a10] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 group-hover:shadow-md">
            <span>Shop Now</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ================= HELPER FUNCTIONS ================= */

function formatDiscountBadge(d: OfferDiscount): string {
  if (d.discountType === "FixedPrice" && d.discountAmount) {
    return `Fixed £${d.discountAmount.toFixed(2)}`;
  }
  if (d.discountType === "UptoXPercent" && d.discountPercentage) {
    return `Up to ${d.discountPercentage}% Off`;
  }
  if (d.discountType === "UptoXPrice" && d.discountAmount) {
    return `Up to £${d.discountAmount.toFixed(2)}`;
  }
  if (d.discountType === "BuyXGetY") {
    const buy = d.buyQuantity || 1;
    const get = d.getQuantity || 1;
    const pct = d.discountPercentage || 0;
    if (pct === 100) {
      return buy === 1 && get === 1 ? "Buy 1 Get 1 Free" : `Buy ${buy} Get ${get} Free`;
    }
    if (buy === 1 && get === 1) {
      return `Buy 1 Get 2nd at ${pct}% Off`;
    }
    return `Buy ${buy} Get ${get} at ${pct}% Off`;
  }
  if (d.discountType === "TieredQuantity") {
    if (d.tiers && d.tiers.length > 0) {
      const maxPct = Math.max(...d.tiers.map((t) => t.discountPercentage));
      const minQty = Math.min(...d.tiers.map((t) => t.quantity));
      return `Buy ${minQty}+ Get Up to ${maxPct}% Off`;
    }
    return "Tiered Savings";
  }
  if (d.usePercentage && d.discountPercentage) {
    return `${d.discountPercentage}% Off`;
  }
  if (d.discountAmount > 0) {
    return `£${d.discountAmount.toFixed(2)} Off`;
  }
  return "Special Deal";
}


function getOfferSummary(d: OfferDiscount): string {
  if (d.discountType === "BuyXGetY") {
    return `Add ${d.buyQuantity || 1} eligible items to get ${d.getQuantity || 1} at a special discount automatically at checkout.`;
  }
  if (d.discountType === "TieredQuantity") {
    return "Save progressively more per unit as your order quantity increases.";
  }
  if (d.discountType === "FixedPrice") {
    return `All qualifying products available for just £${(d.discountAmount || 0).toFixed(2)} each.`;
  }
  if (d.discountType === "UptoXPrice") {
    return `Special pricing umbrella with products priced up to £${(d.discountAmount || 0).toFixed(2)}.`;
  }
  return "Limited-time promotional discount applied directly on qualifying items.";
}

function getDaysLeft(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
