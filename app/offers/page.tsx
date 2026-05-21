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
      discounts = json?.data ?? [];
    }
  } catch { }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HERO BANNER - Exact Match Design */}
      <div className="relative w-full overflow-hidden border-b border-gray-200 min-h-[200px] bg-[#445D41]">

        {/* Geometric Square Grid Background using Tailwind Square Brackets */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Floating Background Icons - Left Side */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <BadgePercent className="absolute top-10 left-[5%] text-white opacity-10 h-12 w-12 transform -rotate-12" />

          <Tag className="absolute bottom-10 left-[5%] text-white opacity-10 h-16 w-16 transform rotate-45" />
          <Gift className="absolute top-1/3 left-[40%] text-white opacity-[0.06] h-32 w-32 transform -rotate-12" />
          <ShoppingBag className="absolute bottom-5 left-[35%] text-white opacity-10 h-10 w-10 transform rotate-12" />
        </div>

        {/* Smooth fade-out gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#445D41]/30 to-[#445D41] pointer-events-none z-0"></div>

        {/* Diagonal Black Section on the Right (Using Tailwind Square Brackets) */}
        <div
          className="hidden md:block absolute top-0 bottom-0 right-0 w-[55%] bg-[#0a0a0a] z-0 [clip-path:polygon(15%_0,100%_0,100%_100%,0%_100%)] overflow-hidden"
        >
          {/* Square Grid Pattern for Black Side */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

          {/* Floating Background Icons - Right Side */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <TrendingUp className="absolute top-1/4 left-[30%] text-white opacity-[0.04] h-20 w-20 transform rotate-12" />
            <Gift className="absolute bottom-1/4 left-[45%] text-white opacity-[0.04] h-24 w-24 transform -rotate-12" />
            <ShoppingBag className="absolute top-[10%] left-[60%] text-white opacity-[0.02] h-40 w-40 transform rotate-12" />
            <BadgePercent className="absolute bottom-[15%] left-[80%] text-white opacity-[0.03] h-32 w-32 transform -rotate-12" />
          </div>

          {/* Subtle glow inside the black area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#445D41]/10 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Floating dots */}
          <div className="absolute top-12 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
          <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full opacity-30"></div>
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-white rounded-full opacity-50"></div>
          <div className="absolute bottom-12 left-1/4 w-2.5 h-2.5 bg-white rounded-full opacity-60"></div>
        </div>

        {/* Mobile Black Background */}
        <div className="md:hidden absolute inset-0 top-[45%] bg-black"></div>

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 flex flex-col md:flex-row h-full min-h-[200px] z-10">

          {/* Left Content (Green Side) */}
          <div className="w-full md:w-[50%] flex flex-col justify-center py-6 md:py-6">
            <div className="relative">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs font-medium text-white/70 mb-8 hidden md:flex">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3 text-white/50" />
                <span className="text-white font-semibold">Offers</span>
              </nav>

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-white/10 rounded-full mb-3 w-max border border-white/20">
                <Gift className="h-3.5 w-3.5 text-white" />
                <span className="text-white font-bold text-[10px] uppercase tracking-widest">Exclusive Deals</span>
              </div>

              {/* Compact Typography */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight leading-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Today's</span>
                <span className="text-[#445D41] bg-white px-2 py-0.5 rounded-md transform -rotate-2 shadow-sm">Offers</span>
                <span>&amp; Deals</span>
              </h1>

              <p className="text-white/90 text-sm max-w-sm font-medium leading-snug">
                Save big on thousands of health &amp; beauty products. New deals added regularly.
              </p>
            </div>
          </div>

          {/* Right Content (Black Side) */}
          <div className="w-full md:w-[50%] flex items-center md:justify-end py-6 md:py-8 z-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md lg:mr-8">

              {/* Dark Card 1 */}
              <div className="flex items-center gap-3 bg-[#111111] border border-white/5 rounded-xl p-4 shadow-xl flex-1 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-center w-10 h-10 bg-[#222] rounded-full flex-shrink-0">
                  <BadgePercent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white leading-none">{discounts.length}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Deals</div>
                </div>
              </div>

              {/* Dark Card 2 */}
              <div className="flex items-center gap-3 bg-[#111111] border border-white/5 rounded-xl p-4 shadow-xl flex-1 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-center w-10 h-10 bg-[#222] rounded-full flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white leading-none">{discounts.reduce((acc, d) => acc + (d.productCount ?? 0), 0)}+</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Products</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-2 mt-2">

        {discounts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">No active offers right now</h2>
            <p className="text-gray-500 mt-2">Check back soon — new deals are added regularly!</p>
            <Link href="/" className="mt-8 inline-block px-8 py-3 bg-[#111827] text-white rounded-lg font-bold hover:bg-black transition-colors">
              Shop All Products
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-1">
              <div className="flex items-center justify-between mb-6 mt-2 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#445D41] rounded-full"></div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900">All Offers</h2>
                  <span className="px-2.5 py-0.5 bg-[#445D41]/10 text-[#445D41] text-[10px] font-black uppercase tracking-wider rounded">
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

  const isProductLevel = d.discountType === "AssignedToProducts" || d.discountType === "AssignedToCategories";
  const href = isProductLevel && d.slug ? `/offers/${d.slug}` : "#";

  return (
    <Link
      href={href}
      className={`group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 ${isProductLevel ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Banner Image */}
      <div className="relative w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {bannerUrl ? (
          <>
            <img
              src={`${apiBase}${bannerUrl}`}
              alt={d.name}
              className="w-full h-auto block group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
          </>
        ) : (
          <div className={`relative w-full aspect-[16/8] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"></div>
            <Percent className={`h-16 w-16 text-gray-200 opacity-50 transform group-hover:scale-110 transition-transform duration-500`} />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#445D41] transition-colors line-clamp-2 mb-3">
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
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-900 text-white px-2 py-1 rounded">
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
            <div className="text-xs font-bold text-gray-900 group-hover:text-[#445D41] transition-colors pt-2">
              View Deals &rarr;
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}