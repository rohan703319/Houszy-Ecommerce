// app/brands/[slug]/page.tsx
export const dynamic = "force-dynamic";

import BrandsClient from "./BrandsClient";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
}
export async function generateMetadata({ params }: BrandPageProps) {
  const { slug } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

  const dataArray = Array.isArray(res.data)
    ? res.data
    : res.data?.items || [];

  const brand =
    dataArray.find((b: any) => b.slug === slug) || null;

  if (!brand) {
    return {
      title: "Brand Not Found",
      description: "Brand not found",
    };
  }

  return {
    // ✅ MAIN SEO
    title: brand.metaTitle || brand.name,
    description:
      brand.metaDescription ||
      `Shop ${brand.name} products online.`,

    keywords: brand.metaKeywords || brand.name,

    // ✅ SOCIAL SHARE SEO
    openGraph: {
      title: brand.metaTitle || brand.name,
      description: brand.metaDescription,
      url: `https://yourdomain.com/brands/${slug}`,
      siteName: "Your Store Name",
      images: [
        {
          url: brand.logoUrl || "/fallback.jpg",
          width: 800,
          height: 600,
        },
      ],
      type: "website",
    },

    // ✅ TWITTER SEO
    twitter: {
      card: "summary_large_image",
      title: brand.metaTitle || brand.name,
      description: brand.metaDescription,
      images: [brand.logoUrl || "/fallback.jpg"],
    },

    // ✅ CANONICAL (VERY IMPORTANT)
    alternates: {
      canonical: `https://directcare.knowledgemarkg.com/brands/${slug}`,
    },
  };
}
async function getBrandProductsBySlug(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Products/by-brand/${slug}?page=1&pageSize=50&sortDirection=asc&isPublished=true`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Brand products fetch failed");
  }

  return res.json();
}

export default async function BrandPage({ params }: BrandPageProps) {
  // ✅ NEXT 15 FIX
  const { slug } = await params;

  const productsRes = await getBrandProductsBySlug(slug);
// ✅ FETCH ALL BRANDS (for SEO)
const brandsRes = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`,
  { next: { revalidate: 600 } }
).then((r) => r.json());

const dataArray = Array.isArray(brandsRes.data)
  ? brandsRes.data
  : brandsRes.data?.items || [];

const brand =
  dataArray.find((b: any) => b.slug === slug) || null;

const faqs =
  brand?.faqs
    ?.filter((f: any) => f.isActive)
    ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder) ?? [];
 return (
  <>
    {/* ✅ SEO: BRAND DESCRIPTION (SERVER SIDE) */}
    {brand?.description && (
      <div style={{ display: "none" }}>
        <div dangerouslySetInnerHTML={{ __html: brand.description }} />
      </div>
    )}

    {/* ✅ SEO: FAQ SCHEMA */}
    {faqs.length > 0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((faq: any) => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
              },
            })),
          }),
        }}
      />
    )}

    {/* 🔥 EXISTING UI (UNCHANGED) */}
    <BrandsClient
      brandSlug={slug}
      initialItems={productsRes?.data?.items ?? []}
      totalPages={productsRes?.data?.totalPages ?? 1}
    />
  </>
);
}
