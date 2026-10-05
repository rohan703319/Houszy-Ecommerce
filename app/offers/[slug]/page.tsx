// app/offers/[slug]/page.tsx
export const revalidate = 1800;

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
  if (d.discountType === "FixedPrice") return `FIXED £${(d.discountAmount ?? 0).toFixed(2)}`;
  if (d.discountType === "UptoXPrice") return `UP TO £${(d.discountAmount ?? 0).toFixed(2)}`;
  if (d.discountType === "UptoXPercent") return `UP TO ${d.discountPercentage ?? 0}% OFF`;
  if (d.discountType === "BuyXGetY") {
    const buy = d.buyQuantity || 1;
    const get = d.getQuantity || 1;
    const pct = d.discountPercentage || 0;
    if (pct === 100) return buy === 1 && get === 1 ? "BUY 1 GET 1 FREE" : `BUY ${buy} GET ${get} FREE`;
    if (buy === 1 && get === 1) return `BUY 1, GET 2ND AT ${pct}% OFF`;
    return `BUY ${buy} GET ${get} AT ${pct}% OFF`;
  }
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
    const res = await fetch(`${baseUrl}/api/Discounts/by-slug/${slug}`, { next: { revalidate: 1800 } });
    if (res.ok) {
      const json = await res.json();
      const d = json?.data;
      if (d) return { title: `${d.name} | Offers | Houszy`, description: `Save with ${d.name}` };
    }
  } catch { }
  return { title: "Offer | Houszy" };
}

export default async function DiscountProductsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");

  // Fetch discount info by slug
  let discount: any = null;
  try {
    const res = await fetch(`${baseUrl}/api/Discounts/by-slug/${slug}`, { next: { revalidate: 1800 } });
    if (res.ok) {
      const json = await res.json();
      discount = json?.data ?? null;
    } else {
      console.error(`Failed to fetch discount: status ${res.status}`);
    }
  } catch (err) {
    console.error("Error fetching discount by slug:", err);
  }

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
    const res = await fetch(`${baseUrl}/api/Products/discounted?${productParams.toString()}`, { next: { revalidate: 1800 } });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data?.items ?? [];
      initialItems = items;
      initialHasMore = items.length === PAGE_SIZE;
    }
  } catch { }

  const daysLeft = getDaysLeft(discount.endDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3;
  const bannerUrl = discount.desktopBannerImageUrl || discount.mobileBannerImageUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DISCOUNT HERO */}

      <main className="max-w-8xl mx-auto px-8 py-4">


        <DiscountProductsClient
          discountId={discount.id}
          initialItems={initialItems}
          initialHasMore={initialHasMore}
          pageSize={PAGE_SIZE}
          discountName={discount.name}
          discountType={discount.discountType}
          discountPercentage={discount.usePercentage ? discount.discountPercentage : undefined}
          discountAmount={discount.discountAmount}
          requiresCouponCode={discount.requiresCouponCode === true}
          assignedProductIds={discount.assignedProductIds ? discount.assignedProductIds.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
        />
      </main>
    </div>
  );
}
