// app/offers/page.tsx
import Link from "next/link";
import { Tag, Clock, Gift, ChevronRight, ShoppingBag, Percent, BadgePercent, Sparkles, Calendar, Star, TrendingUp, Award, Zap } from "lucide-react";

interface Discount {
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
  desktopBannerImageUrl?: string;
  mobileBannerImageUrl?: string;
  productCount?: number;
  adminComment?: string;
}

function formatDiscount(d: Discount): string {
  if (d.discountType === "UptoXPercent" && d.discountPercentage) {
    return `UP TO ${d.discountPercentage}% OFF`;
  }
  if (d.usePercentage && d.discountPercentage) return `${d.discountPercentage}% OFF`;
  if (d.discountAmount > 0) return `£${d.discountAmount.toFixed(2)} OFF`;
  return "Special Offer";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getDaysLeft(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function OffersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  let discounts: Discount[] = [];
  try {
    const res = await fetch(
      `${baseUrl}/api/Discounts/public`,
      {
        cache: "no-store",
      }
    );
    if (res.ok) {
      const json = await res.json();
      const rawDiscounts: Discount[] = json?.data ?? [];
      discounts = rawDiscounts.filter(d => !d.requiresCouponCode);
    }
  } catch { }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* COMPACT CLEAN HERO BANNER */}
      <div className="bg-white border-b border-gray-200 py-4 md:py-8 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Subtle orange glow top right */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f38918]/10 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-5 hidden md:flex">
            <Link href="/" className="hover:text-gray-800 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-gray-900 font-bold">Offers</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3.5 md:gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 bg-[#f38918]/10 text-[#f38918] rounded-md mb-1 md:mb-2 border border-[#f38918]/20">
                <Gift className="h-3.5 w-3.5" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Exclusive Deals</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 tracking-tight">
                Houszy <span className="text-[#f38918]">Offers</span> & Deals
              </h1>

              <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
                Shop exclusive discounts across Kitchenware, Homeware, Fitness and Everyday Essentials. Don't miss our latest deals and special offers available for a limited time.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-0">
              <div className="flex flex-col justify-center bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-5 md:py-4 min-w-[110px] md:min-w-[130px] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1 md:mb-1.5">
                  <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-50">
                    <BadgePercent className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#f38918]" />
                  </div>
                  <span className="text-lg md:text-2xl font-black text-gray-900 leading-none">{discounts.length}</span>
                </div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Active Deals</span>
              </div>

              <div className="flex flex-col justify-center bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl px-3 py-2.5 md:px-5 md:py-4 min-w-[110px] md:min-w-[130px] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1 md:mb-1.5">
                  <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-50">
                    <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#f38918]" />
                  </div>
                  <span className="text-lg md:text-2xl font-black text-gray-900 leading-none">{discounts.reduce((acc, d) => acc + (d.productCount ?? 0), 0)}+</span>
                </div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-2 mt-2">

        {discounts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-900">No active offers right now</h2>
            <p className="text-gray-500 mt-2">Check back soon — new deals are added regularly!</p>
            <Link href="/" className="mt-8 inline-block px-8 py-3 bg-[#111827] text-white rounded-lg font-bold hover:bg-black transition-colors">
              Shop All Products
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-0">
              <div className="flex items-center justify-between mb-2 mt-2 border-b  border-gray-200 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#f38918] rounded-full"></div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900">All Offers</h2>
                  <span className="px-2.5 py-0.5 bg-[#f38918]/10 text-[#f38918] text-[10px] font-black uppercase tracking-wider rounded">
                    {discounts.length} Live
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {discounts.map(d => (
                  <DiscountCard key={d.id} discount={d} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function DiscountCard({ discount: d }: { discount: Discount }) {
  const daysLeft = getDaysLeft(d.endDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
  const bannerUrl = d.desktopBannerImageUrl || d.mobileBannerImageUrl;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  const isProductLevel = d.discountType === "AssignedToProducts" || d.discountType === "AssignedToCategories" || d.discountType === "UptoXPercent";
  const href = isProductLevel && d.slug ? `/offers/${d.slug}` : "#";

  return (
    <Link
      href={href}
      className={`group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 ${isProductLevel ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Banner Image */}
      <div className="relative w-full h-48 md:h-52 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {bannerUrl ? (
          <>
            <img
              src={`${apiBase}${bannerUrl}`}
              alt={d.name}
              className="w-full h-full object-contain block group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"></div>
            <Percent className="h-16 w-16 text-gray-200 opacity-50 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#f38918] transition-colors line-clamp-2 mb-3">
          {d.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4 mt-auto">
          {/* New RED Offer Badge */}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-500 text-white px-2 py-1 rounded shadow-sm">
            <Tag className="h-3 w-3" />
            {formatDiscount(d)}
          </span>

          {d.productCount != null && d.productCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200/60">
              <ShoppingBag className="h-3 w-3" />
              {d.productCount} Items
            </span>
          )}
          {daysLeft !== null && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border ${isExpiringSoon ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
              <Clock className="h-3 w-3" />
              {daysLeft === 0 ? "Ends today!" : `${daysLeft}d left`}
            </span>
          )}
          {d.requiresCouponCode && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#f38918] text-white px-2 py-1 rounded">
              <Tag className="h-3 w-3" />
              Coupon
            </span>
          )}
        </div>

        <div className="mt-1">
          {/* Dates */}
          {(d.startDate || d.endDate) && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-3 pt-3 border-t border-gray-100">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {d.startDate && `${formatDate(d.startDate)}`}
                {d.startDate && d.endDate && " - "}
                {d.endDate && `${formatDate(d.endDate)}`}
              </span>
            </div>
          )}

          {/* CTA */}
          {isProductLevel && (
            <div className="text-xs font-bold text-gray-900 group-hover:text-[#f38918] transition-colors pt-2">
              View Deals &rarr;
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}