// app/offers/[slug]/page.tsx
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import DiscountProductsClient from "./DiscountProductsClient";
import { ChevronRight, Clock, ShoppingBag, Tag, BadgePercent } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 24;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatDiscount(d: any): string {
  if (d.usePercentage && d.discountPercentage) return `${d.discountPercentage}% OFF`;
  if (d.discountAmount > 0) return `£${d.discountAmount.toFixed(2)} OFF`;
  return "Special Offer";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getDaysLeft(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  try {
    const res = await fetch(`${baseUrl}/api/Discounts/by-slug/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const d = json?.data;
      if (d) return { title: `${d.name} | Offers | Direct Care`, description: `Save with ${d.name}` };
    }
  } catch {}
  return { title: "Offer | Direct Care" };
}

export default async function DiscountProductsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  // Fetch discount info by slug
  let discount: any = null;
  try {
    const res = await fetch(`${baseUrl}/api/Discounts/by-slug/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      discount = json?.data ?? null;
    }
  } catch {}

  if (!discount || discount.isDeleted) notFound();

  // Fetch initial products for this discount
  const productParams = new URLSearchParams({
    page: "1",
    pageSize: String(PAGE_SIZE),
    discountId: discount.id,
    sortDirection: (sp.sortDirection as string) ?? "asc",
  });
  if (sp.sortBy) productParams.append("sortBy", sp.sortBy as string);

  let initialItems: any[] = [];
  let initialHasMore = false;
  try {
    const res = await fetch(`${baseUrl}/api/Products/discounted?${productParams.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data?.items ?? [];
      initialItems = items;
      initialHasMore = items.length === PAGE_SIZE;
    }
  } catch {}

  const daysLeft = getDaysLeft(discount.endDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
  const bannerUrl = discount.desktopBannerImageUrl || discount.mobileBannerImageUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DISCOUNT HERO */}
      {bannerUrl ? (
<div className="w-full h-52 overflow-hidden">
  <img
    src={`${baseUrl}${bannerUrl}`}
    alt={discount.name}
    className="w-full h-full object-cover"
  />
</div>
      ) : (
        <div className="bg-gradient-to-r from-[#445D41] via-[#3a5237] to-[#2d4029] text-white">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-bold px-3 py-1.5 rounded-xl mb-3">
              <BadgePercent className="h-4 w-4" />
              {formatDiscount(discount)}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{discount.name}</h1>
            <div className="flex flex-wrap gap-4 mt-3">
              {discount.productCount != null && discount.productCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <ShoppingBag className="h-4 w-4" />
                  {discount.productCount} products
                </span>
              )}
              {daysLeft !== null && (
                <span className={`inline-flex items-center gap-1.5 text-sm ${isExpiringSoon ? "text-yellow-300 font-semibold" : "text-white/80"}`}>
                  <Clock className="h-4 w-4" />
                  {daysLeft === 0 ? "Ends today!" : `${daysLeft} days left`}
                </span>
              )}
              {discount.requiresCouponCode && (
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <Tag className="h-4 w-4" />
                  Requires coupon code
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-2">
     

        <DiscountProductsClient
          discountId={discount.id}
          initialItems={initialItems}
          initialHasMore={initialHasMore}
          pageSize={PAGE_SIZE}
          discountName={discount.name}
        />
      </main>
    </div>
  );
}
