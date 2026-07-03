// app/brands/[slug]/page.tsx

import { notFound } from "next/navigation";
import BrandsClient from "./BrandsClient";

interface SearchParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDirection?: string;
  price?: string;
  minRating?: string;
  categorySlug?: string;
}

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<SearchParams>;
}

type BreadcrumbItem = {
  label: string;
  href?: string;
};

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
      description: brand.metaDescription || `Shop ${brand.name} products online.`,
      url: `https://www.houszy.co.uk/brands/${slug}`,
      siteName: "Houszy",
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
      description: brand.metaDescription || `Shop ${brand.name} products online.`,
      images: [brand.logoUrl || "/fallback.jpg"],
    },

    // ✅ CANONICAL (VERY IMPORTANT)
    alternates: {
      canonical: `https://www.houszy.co.uk/brands/${slug}`,
    },
  };
}

function collectCategoriesForBrand(categories: any[], brandId: string): any[] {
  const collected = new Map<string, any>();

  const recurse = (cat: any) => {
    const hasBrand = cat.brands?.some((b: any) => b.id === brandId);
    if (hasBrand) {
      collected.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat.productCount,
      });
    }
    if (cat.subCategories && Array.isArray(cat.subCategories)) {
      cat.subCategories.forEach(recurse);
    }
  };

  categories.forEach(recurse);
  return Array.from(collected.values());
}

async function getProductsByBrand(
  slug: string,
  searchParams: SearchParams
) {
  // 🔥 fetch all brands to get ID
  const brandsRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`
  ).then((r) => r.json());

  const dataArray = Array.isArray(brandsRes.data)
    ? brandsRes.data
    : brandsRes.data?.items || [];

  const brand = dataArray.find((b: any) => b.slug === slug);

  if (!brand?.id) return { data: { items: [], totalPages: 1 } };

  const {
    page = "1",
    pageSize = "20",
    sortBy = "name",
    sortDirection = "asc",
    price,
    minRating,
    categorySlug,
  } = searchParams;

  const query = new URLSearchParams({
    page,
    pageSize,
    sortBy,
    sortDirection,
    isPublished: "true",
    isActive: "true",
    isDeleted: "false",
  });

  // ✅ BRAND FILTER (IMPORTANT)
  query.set("brandId", brand.id);

  // ✅ CATEGORY FILTER
  if (categorySlug) {
    query.set("categorySlug", categorySlug);
  }

  // ✅ PRICE FILTER
  if (price) {
    const [min, max] = price.split("-");
    if (min) query.set("minPrice", min);
    if (max) query.set("maxPrice", max);
  }

  // ✅ RATING FILTER
  if (minRating) {
    query.set("minRating", minRating);
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${query.toString()}`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  // ✅ NEXT 15 FIX
  const { slug } = await params;
  const searchParamsResolved = (await searchParams) ?? {};

  const productsRes = await getProductsByBrand(
    slug,
    searchParamsResolved
  );

  // ✅ FETCH ALL BRANDS (for SEO and details)
  const brandsRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

  const dataArray = Array.isArray(brandsRes.data)
    ? brandsRes.data
    : brandsRes.data?.items || [];

  const brand =
    dataArray.find((b: any) => b.slug === slug) || null;

  if (!brand) return notFound();

  // ✅ FETCH ALL CATEGORIES
  const categoriesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Categories?includeInactive=false&includeSubCategories=true`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

  const categoriesArray = Array.isArray(categoriesRes.data)
    ? categoriesRes.data
    : categoriesRes.data?.items || [];

  const brandCategories = collectCategoriesForBrand(categoriesArray, brand.id);

  const faqs =
    brand?.faqs
      ?.filter((f: any) => f.isActive)
      ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder) ?? [];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: brand.name },
  ];

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

      {/* ItemList of products — enables Product / Merchant-listing rich results on the brand page */}
      {Array.isArray(productsRes?.data?.items) && productsRes.data.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": `https://www.houszy.co.uk/brands/${slug}/#productlist`,
              "url": `https://www.houszy.co.uk/brands/${slug}/`,
              "name": brand.name,
              "numberOfItems": productsRes.data.items.length,
              "itemListElement": productsRes.data.items.map((p: any, i: number) => {
                const img = p.images?.[0]?.imageUrl;
                const imageUrl = img
                  ? (img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_API_URL}${img}`)
                  : undefined;
                const inStock = p.manageInventoryMethod === "donttrack" || (p.stockQuantity ?? 0) > 0;
                const productObj: any = {
                  "@type": "Product",
                  "name": p.name,
                  "url": `https://www.houszy.co.uk/product/${p.slug}/`,
                  ...(imageUrl ? { "image": imageUrl } : {}),
                  "offers": {
                    "@type": "Offer",
                    "price": Number(p.price ?? 0).toFixed(2),
                    "priceCurrency": "GBP",
                    "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "url": `https://www.houszy.co.uk/product/${p.slug}/`
                  }
                };
                if ((p.reviewCount ?? 0) > 0 && (p.averageRating ?? 0) > 0) {
                  productObj.aggregateRating = {
                    "@type": "AggregateRating",
                    "ratingValue": Number(p.averageRating).toFixed(1),
                    "reviewCount": p.reviewCount
                  };
                }
                return {
                  "@type": "ListItem",
                  "position": i + 1,
                  "item": productObj
                };
              })
            })
          }}
        />
      )}

      {/* 🔥 BRAND CLIENT */}
      <BrandsClient
        brand={brand}
        breadcrumbs={breadcrumbs}
        initialProducts={productsRes?.data?.items ?? []}
        totalCount={productsRes?.data?.totalCount ?? 0}
        currentPage={productsRes?.data?.page ?? 1}
        pageSize={productsRes?.data?.pageSize ?? 20}
        totalPages={productsRes?.data?.totalPages ?? 1}
        initialSortBy={searchParamsResolved.sortBy || "name"}
        initialSortDirection={searchParamsResolved.sortDirection || "asc"}
        categories={brandCategories}
      />
    </>
  );
}

