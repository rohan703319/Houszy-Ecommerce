// app/offers/page.tsx
import Link from "next/link";
import { Tag, Clock, Gift, ChevronRight, ShoppingBag, Percent, BadgePercent } from "lucide-react";

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

function getDiscountColor(d: Discount): { bg: string; badge: string; accent: string } {
  if (d.discountPercentage && d.discountPercentage >= 30)
    return { bg: "from-red-50 to-orange-50", badge: "bg-red-600", accent: "text-red-600" };
  if (d.discountPercentage && d.discountPercentage >= 15)
    return { bg: "from-emerald-50 to-teal-50", badge: "bg-[#445D41]", accent: "text-[#445D41]" };
  if (d.requiresCouponCode)
    return { bg: "from-purple-50 to-violet-50", badge: "bg-purple-600", accent: "text-purple-600" };
  return { bg: "from-blue-50 to-indigo-50", badge: "bg-blue-600", accent: "text-blue-600" };
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
  } catch {}


  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-[#445D41] via-[#3a5237] to-[#2d4029] text-white">
        <div className="max-w-7xl mx-auto px-6 py-2 md:py-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-5 w-5 text-white" />
                <span className="text-white font-semibold text-sm uppercase tracking-wider">Exclusive Deals</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                Today's Offers &amp; Deals
              </h1>
              <p className="mt-0 text-white/75 text-base max-w-md">
                Save big on thousands of health &amp; beauty products. New deals added regularly.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-black text-white">{discounts.length}</div>
                <div className="text-sm text-white/80">Active Deals</div>
              </div>
              <div className="text-center px-6 py-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-black text-white">
                  {discounts.reduce((acc, d) => acc + (d.productCount ?? 0), 0)}+
                </div>
                <div className="text-sm text-white/80">Products</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-2">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-0">
          <Link href="/" className="hover:text-[#445D41] transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-800">Offers</span>
        </nav>

        {discounts.length === 0 ? (
          <div className="text-center py-24">
            <Tag className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-500">No active offers right now</h2>
            <p className="text-gray-400 mt-1">Check back soon — new deals are added regularly!</p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 bg-[#445D41] text-white rounded-xl font-semibold hover:bg-[#3a5237] transition-colors">
              Shop All Products
            </Link>
          </div>
        ) : (
          <>
          <section className="mt-4">
  <div className="flex items-center gap-2 mb-5">
    <BadgePercent className="h-5 w-5 text-[#445D41]" />
    <h2 className="text-xl font-bold text-gray-900">All Offers</h2>
    <span className="ml-2 px-2.5 py-0.5 bg-[#445D41]/10 text-[#445D41] text-xs font-semibold rounded-full">
      {discounts.length}
    </span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
  const colors = getDiscountColor(d);
  const daysLeft = getDaysLeft(d.endDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
  const bannerUrl = d.desktopBannerImageUrl || d.mobileBannerImageUrl;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  const isProductLevel = d.discountType === "AssignedToProducts" || d.discountType === "AssignedToCategories";
  const href = isProductLevel && d.slug ? `/offers/${d.slug}` : "#";

  return (
    <Link
      href={href}
      className={`group block rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white ${isProductLevel ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Banner Image */}
{bannerUrl ? (
  <div className="relative w-full bg-white flex items-center justify-center">
    <img
      src={`${apiBase}${bannerUrl}`}
      alt={d.name}
      className="w-full h-full object-contain bg-white md:group-hover:scale-105 transition-transform duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
  </div>
) : (
  <div className={`h-28 bg-gradient-to-br ${colors.bg} flex items-center justify-center relative`}>
    <Percent className={`h-12 w-12 ${colors.accent} opacity-20`} />
  </div>
)}

      {/* Card Body */}
      <div className="p-4">
       <div className="flex items-start justify-between gap-3 mb-1">
  <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#445D41] transition-colors line-clamp-2">
    {d.name}
  </h3>

  <span className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
    {formatDiscount(d)}
  </span>
</div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {d.productCount != null && d.productCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <ShoppingBag className="h-3 w-3" />
              {d.productCount} products
            </span>
          )}
          {daysLeft !== null && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isExpiringSoon ? "bg-red-100 text-red-600 font-semibold" : "bg-gray-100 text-gray-500"}`}>
              <Clock className="h-3 w-3" />
              {daysLeft === 0 ? "Ends today!" : `${daysLeft}d left`}
            </span>
          )}
          {d.requiresCouponCode && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
              <Tag className="h-3 w-3" />
              Coupon
            </span>
          )}
        </div>

        {/* Dates */}
        {(d.startDate || d.endDate) && (
          <p className="text-xs text-gray-400 mt-2">
            {d.startDate && `From ${formatDate(d.startDate)}`}
            {d.startDate && d.endDate && " · "}
            {d.endDate && `Until ${formatDate(d.endDate)}`}
          </p>
        )}

        {/* CTA */}
        {isProductLevel && (
          <div className="mt-3 flex items-center justify-between text-sm font-semibold text-[#445D41] group-hover:gap-2 transition-all">
            <span>View Deals</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </Link>
  );
}