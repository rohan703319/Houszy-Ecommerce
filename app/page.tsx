//app/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HomeBannerSlider from "@/components/HomeBannerSlider";
import FeaturedProductsSlider from "@/components/FeaturedProductsSlider";
import NewArrivalsProductsSlider from "@/components/NewArrivalsProductsSlider";
import Image from "next/image";
import TopBrandsSlider from "@/components/TopBrandsSlider";
import CategorySlider from "@/components/CategorySlider";
import NewsletterWrapper from "@/components/NewsletterWrapper";
import CategoryOffersSlider from "@/components/CategoryOffersSlider";
import { getActiveBanners } from "@/lib/bannerUtils";
import Script from "next/script";
import { TrendingUp, Zap, Gift, Shield, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import type { BlogPost } from "@/components/LatestBlogs";
const WhyChooseUs = dynamic(() => import("@/components/WhyChooseUs"));
const LatestBlogs = dynamic(() => import("@/components/LatestBlogs"));
const DiscountedProductsSlider = dynamic(() => import("@/components/DiscountedProductsSlider"));
import type { Metadata } from "next";

export const revalidate = 60;

// ✅ Static feature section
const features = [
  { icon: Zap, title: "Fast Delivery", description: "Get your orders in 24-48 hours" },
  { icon: Shield, title: "Secure Payment", description: "100% secure transactions" },
  { icon: Gift, title: "Gift Cards", description: "Perfect for any occasion" },
  { icon: TrendingUp, title: "Best Prices", description: "Competitive pricing guaranteed" },
];
type BannerType = "Homepage" | "Seasonal" | string;

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  link?: string;
  bannerType: BannerType;
  offerText?: string;
  buttonText?: string;
  isActive: boolean;
  displayOrder: number;
  startDate: string;
  endDate: string;
}
// ✅ Types
interface Product {
  id: string;
  name: string;
  slug: string; // ✅ IMPORTANT: Need slug for routing
  price: number;
  showOnHomepage: boolean; // ✅ ADD THIS
  oldPrice?: number | null;
  averageRating?: number;
  reviewCount?: number;
  images?: { imageUrl: string }[];
  assignedDiscounts?: any[]; // ✅ ADD THIS
}
interface Discount {
  usePercentage: boolean;
  discountPercentage: number;
  requiresCouponCode: boolean;
  couponCode: string;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  productCount: number;
  showOnHomepage: boolean; // ✅ ADD THIS
  sortOrder: number;
  assignedDiscounts?: Discount[]; // ✅ ADD THIS
  subCategories?: Category[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  showOnHomepage: boolean;
  displayOrder: number;
  productCount: number;
}

interface HomeBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

// ✅ Fetch Functions
async function getBanners(baseUrl: string): Promise<Banner[]> {
  try {
    const res = await fetch(`${baseUrl}/api/Banners`, {
      next: { revalidate: 300 },
    });
    const result = await res.json();
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

async function getProducts(baseUrl: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/Products?page=1&pageSize=20&sortDirection=asc&isPublished=true&showOnHomepage=true&isDeleted=false`,
      {
        next: { revalidate: 60 },
      }
    );
    const result = await res.json();
    return result.success ? result.data.items : [];
  } catch {
    return [];
  }
}


async function getCategories(baseUrl: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/Categories?includeInactive=false&includeSubCategories=true&isDeleted=false`,
      {
        next: { revalidate: 60 },
      }
    );

    const result = await res.json();

    if (!result?.success) return [];

    // 🔥 FIX: सही array निकालो
    const dataArray = Array.isArray(result.data)
      ? result.data
      : result.data?.items || [];

    return dataArray.sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
  } catch {
    return [];
  }
}

async function getHomeBlogs(baseUrl: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `${baseUrl}/api/BlogPosts?includeUnpublished=false&isActive=true&onlyHomePage=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items: BlogPost[] = Array.isArray(json.data)
      ? json.data
      : (json.data?.items ?? []);
    return json.success ? items.slice(0, 7) : [];
  } catch {
    return [];
  }
}

async function getDiscountedProducts(baseUrl: string) {
  try {
    // No showOnHomepage filter — fetch ALL published products to find discounted ones
    const res = await fetch(
      `${baseUrl}/api/Products?page=1&pageSize=100&sortDirection=asc&isPublished=true&isDeleted=false`,
      { next: { revalidate: 60 } }
    );
    const result = await res.json();
    if (!result.success) return [];
    const items: any[] = result.data?.items ?? [];
    return items.filter(
      (p: any) => Array.isArray(p.assignedDiscounts) && p.assignedDiscounts.length > 0
    );
  } catch {
    return [];
  }
}



export const metadata: Metadata = {
  metadataBase: new URL("https://www.houszy.co.uk"),

  title: "Shop Kitchenware, Fitness Equipment, Home Essentials & Toys - Houszy",

  description:
    "Buy quality homeware, kitchenware, fitness gear, and toys. Find glass containers, cookware, gym gear, bedding, and games for everyone. Explore our wide range today!",

  keywords: [
    "buy homeware online UK",
    "online kitchenware UK",
    "buy fitness equipment UK",
    "buy toys UK",
    "Houszy UK",
  ],

  openGraph: {
    title: "Shop Kitchenware, Fitness Equipment, Home Essentials & Toys - Houszy",
    description:
      "Order medicines and healthcare products online in the UK with fast delivery and trusted brands.",
    url: "https://www.houszy.co.uk",
    siteName: "Houszy",
    locale: "en_GB", // ✅ VERY IMPORTANT
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://www.houszy.co.uk",
  },
};
// ✅ MAIN PAGE
export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;

  const [products, categories, banners, discountedProducts, blogs] = await Promise.all([
    getProducts(baseUrl),
    getCategories(baseUrl),
    getBanners(baseUrl),
    getDiscountedProducts(baseUrl),
    getHomeBlogs(baseUrl),
  ]);
  const activeBanners = getActiveBanners(banners);

  const homeBanners = activeBanners.filter(
    banner => banner.bannerType === "Homepage"
  );

  const seasonalBanners = activeBanners.filter(
    banner => banner.bannerType === "Seasonal"
  );
  const homeCategories = categories
    .filter((c: Category) => c.showOnHomepage)
    .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);

  const homeProducts = [...products].sort(
    (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  return (
    <>
      {/* 🔥 Newsletter Popup (client side) */}
      <NewsletterWrapper />
      {/* Organization Schema (already hai) */}
      <Script
        id="org-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Houszy",
            url: "https://www.houszy.co.uk",
            address: {
              "@type": "PostalAddress",
              addressCountry: "GB",
              addressLocality: "Birmingham",
            },
          }),
        }}
      />

      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: "https://www.houszy.co.uk",
            name: "Houszy",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.houszy.co.uk/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-x-hidden">
        <h1 className="sr-only">
          Buy Medicines & Healthcare Products Online in the UK - Houszy
        </h1>

        {/* ===== HERO SLIDER ===== */}
        <section className="w-full px-3 mt-4 lg:px-5 lg:mt-6 max-w-[1920px] mx-auto">
          <HomeBannerSlider banners={homeBanners} baseUrl={baseUrl} />
        </section>

        {/* ===== CATEGORY OFFERS (NEW) ===== */}
        <CategoryOffersSlider categories={categories} baseUrl={baseUrl} />
        {/* ===== PROMO BANNER ===== */}
        {seasonalBanners.length > 0 && (
          <section className="w-full py-10 md:py-14 bg-white">
            {seasonalBanners.map((banner) => {
              const desktopSrc = `${baseUrl}${banner.imageUrl}`;
              const mobileSrc = banner.mobileImageUrl ? `${baseUrl}${banner.mobileImageUrl}` : null;

              const pictureEl = (
                <picture className="block w-full">
                  {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
                  <Image
                    src={desktopSrc}
                    alt={banner.title || "Healthcare Banner"}
                    width={1200}
                    height={400}
                    priority
                    className="w-full h-auto object-contain"
                  />
                </picture>
              );

              return banner.link ? (
                <Link key={banner.id} href={banner.link} className="block cursor-pointer">
                  {pictureEl}
                </Link>
              ) : (
                <div key={banner.id}>{pictureEl}</div>
              );
            })}
          </section>
        )}

        {/* ===== OUR POPULAR COLLECTIONS ===== */}
        <section className="w-full bg-white pt-4 pb-4 md:py-14">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">

            {/* Heading */}
            <div className="relative flex items-center justify-center mb-1 md:mb-8 min-h-[40px] w-full px-1">
              <h2 className="text-[15px] md:text-[22px] font-bold text-black text-center">
                Our Popular Collections
              </h2>
              <div className="absolute right-0 md:right-1">
                <Link href="/category">
                  <Button
                    variant="outline"
                    className="text-[9px] md:text-[13px] font-bold border border-gray-300 text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all duration-300 rounded px-1 py-0 md:px-4 md:py-2 flex items-center gap-1 shadow-sm bg-white"
                  >
                    <span className="md:hidden">View All</span>
                    <span className="hidden md:inline">View All Collections</span>
                    <ChevronRight className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Category Slider for dynamic Swiper support across devices */}
            <CategorySlider categories={homeCategories} baseUrl={baseUrl} />

          </div>
        </section>
        {/* ===== FEATURED PRODUCTS ===== */}
        <section className="w-full bg-white py-10">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
            <FeaturedProductsSlider products={homeProducts} baseUrl={baseUrl} title="Our Top Selling Products" />
          </div>
        </section>

        {/* <section className="w-full bg-white py-10 md:py-14">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
            <NewArrivalsProductsSlider baseUrl={baseUrl} />
          </div>
        </section> */}

        {/* ===== WHY CHOOSE US ===== */}
        <section className="w-full bg-white py-10 md:py-12">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
            <WhyChooseUs />
          </div>
        </section>

        {/* ===== DISCOUNTED PRODUCTS (FITNESS HOT DEALS) ===== */}
        <section className="w-full bg-white pt-0 pb-10">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
            <DiscountedProductsSlider products={discountedProducts} baseUrl={baseUrl} />
          </div>
        </section>

        {/* ===== LATEST BLOGS ===== */}
        {blogs.length > 0 && (
          <section className="w-full bg-white py-10 md:py-14">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
              <LatestBlogs blogs={blogs} />
            </div>
          </section>
        )}
      </div>
    </>
  );

}
