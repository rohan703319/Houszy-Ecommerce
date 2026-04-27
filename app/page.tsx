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
import { ShoppingCart, Star, TrendingUp, Zap, Gift, Shield, } from "lucide-react";
import WhyChooseUs from "@/components/WhyChooseUs";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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
      cache: "no-store",
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
      `${baseUrl}/api/Products?page=1&pageSize=10000&sortDirection=asc&isPublished=true&showOnHomepage=true&isDeleted=false`,
      {
        cache: "no-store",
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

async function getBrands(baseUrl: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/Brands?includeUnpublished=false&isActive=true&isDeleted=false`,
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

return dataArray
  .filter((b: Brand) => b.showOnHomepage)
  .sort((a: Brand, b: Brand) => a.displayOrder - b.displayOrder);
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  metadataBase: new URL("https://www.direct-care.co.uk"),

  title: "Direct Care UK - Buy Medicines & Healthcare Products Online",
  
  description:
    "Shop medicines, healthcare, beauty, and personal care products online in the UK. Fast delivery, trusted brands, and best prices at Direct Care.",

  keywords: [
    "buy medicines online UK",
    "online pharmacy UK",
    "healthcare products UK",
    "personal care UK",
    "Direct Care UK",
  ],

  openGraph: {
    title: "Direct Care UK - Healthcare & Personal Care Online",
    description:
      "Order medicines and healthcare products online in the UK with fast delivery and trusted brands.",
    url: "https://www.direct-care.co.uk",
    siteName: "Direct Care",
    locale: "en_GB", // ✅ VERY IMPORTANT
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://www.direct-care.co.uk",
  },
};
// ✅ MAIN PAGE
export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;

  const [products, categories, brands, banners] = await Promise.all([
  getProducts(baseUrl),
  getCategories(baseUrl),
  getBrands(baseUrl),
  getBanners(baseUrl),
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
      name: "Direct Care",
      url: "https://www.direct-care.co.uk",
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
      url: "https://www.direct-care.co.uk",
      name: "Direct Care",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.direct-care.co.uk/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }),
  }}
/>
  <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-x-hidden">
<h1 className="sr-only">
  Buy Medicines & Healthcare Products Online in the UK - Direct Care
</h1>
    {/* ===== HERO SLIDER ===== */}
    <section className="w-full">
      <HomeBannerSlider banners={homeBanners} baseUrl={baseUrl} />

    </section>

  
{/* ===== CATEGORY OFFERS (NEW) ===== */}
<CategoryOffersSlider categories={categories} baseUrl={baseUrl} />
    {/* ===== PROMO BANNER ===== */}
 {seasonalBanners.length > 0 && (
  <section className="w-full py-4 bg-white">
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


    {/* ===== FEATURED PRODUCTS ===== */}
    <section className="w-full bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
       <FeaturedProductsSlider products={homeProducts} baseUrl={baseUrl} />

      </div>
    </section>

    {/* ===== CATEGORIES ===== */}
    {/* ===== CATEGORIES ===== */}
<section className="w-full bg-gray-100 py-4">
  <div className="max-w-7xl mx-auto px-4">

    <div className="relative mb-3 md:mb-8">

      {/* View All Button - Right Side */}
      <Link
        href="/category"
        className="absolute right-0 top-0 text-xs md:text-base font-medium text-[#445D41] bg-green-50 border border-green-200 px-1 md:px-2 py-1 rounded hover:text-green-700 transition"
      >
        View All →
      </Link>

      {/* Centered Heading */}
      <div className="text-center">
        <h2 className="text-lg md:text-3xl font-bold mb-1">
          Shop by Category
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Browse our wide range of products
        </p>
      </div>

    </div>

    <CategorySlider categories={homeCategories} baseUrl={baseUrl} />

  </div>
</section>
{/* ===== NEW ARRIVALS ===== */}
<section className="w-full bg-gray-50 py-4">
  <div className="max-w-7xl mx-auto px-4">
    <NewArrivalsProductsSlider baseUrl={baseUrl} />
  </div>
</section>
   {/* ===== TOP BRANDS ===== */}
<section className="w-full bg-white py-4">
  <div className="max-w-7xl mx-auto px-4">
   <div className="relative mb-4 md:mb-8">

  {/* View All Button - Right Side */}
  <Link
    href="/brands"
    className="absolute right-0 top-0 text-xs md:text-base font-medium text-[#445D41] bg-green-50 border border-green-200 px-2 py-1 rounded hover:text-green-700 transition"
  >
    View All →
  </Link>

  {/* Centered Heading */}
  <div className="text-center">
    <h2 className="text-xl md:text-3xl font-bold mb-1">
      Top Brands
    </h2>
    <p className="text-gray-600 text-sm md:text-base">
      Explore popular brands you can trust
    </p>
  </div>

</div>

    {brands.length === 0 ? (
      <p className="text-center text-gray-500">No brands available.</p>
    ) : (
      <TopBrandsSlider brands={brands} baseUrl={baseUrl} />
    )}
  </div>
</section>
  {/* ===== WHY CHOOSE US ===== */}
    <section className="w-full bg-gray-100 py-0">
      <div className="max-w-7xl mx-auto px-4">
        <WhyChooseUs />
      </div>
    </section>
  </div>
   </>
);

}
