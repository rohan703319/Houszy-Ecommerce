export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";

/* =====================
   Types
===================== */

interface SearchParams {
  sortBy?: string;
  sortDirection?: string;
  page?: string;
  pageSize?: string;
  discount?: string;
   discountIds?: string;
  subCategorySlug?: string;
  brands?: string;    // brand slugs, comma-separated  e.g. "acme,bandaid"
  price?: string;     // price range e.g. "10-100"
  minRating?: string;
}
type BreadcrumbItem = {
  label: string;
  href: string;
};
/* =====================
   Helpers (CATEGORY TREE)
===================== */

function findCategoryBySlug(categories: any[], slug: string): any | null {
  if (!Array.isArray(categories)) return null; // 🔥 FIX
  for (const cat of categories) {
    if (cat.slug === slug) return cat;

    if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
      const found = findCategoryBySlug(cat.subCategories, slug);
      if (found) return found;
    }
  }
  return null;
}

function findCategoryPath(
  categories: any[],
  slug: string,
  path: any[] = []
): any[] | null {
  if (!Array.isArray(categories)) return null; // 🔥 FIX

  for (const cat of categories) {
    const newPath = [...path, cat];

    if (cat.slug === slug) {
      return newPath;
    }

    if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
      const result = findCategoryPath(cat.subCategories, slug, newPath);
      if (result) return result;
    }
  }
  return null;
}

/* ==================
   Products Fetch
===================== */

async function getProducts(
  params: SearchParams = {},
  categorySlug?: string,
  brandIds?: string   // pre-resolved brand IDs (mapped from slugs)
) {
  const {
    page = "1",
    pageSize = "20",
    sortBy = "name",
    sortDirection = "asc",
    price,
    minRating,
     discountIds,
  } = params;

  const query = new URLSearchParams({
    page,
    pageSize,
    sortBy,
    sortDirection,
      // ✅ ADD THESE FILTERS
  isPublished: "true",
  isActive: "true",
  isDeleted: "false",
  });

  if (categorySlug) query.set("categorySlug", categorySlug);
  if (brandIds)     query.set("brandIds", brandIds);

  if (price) {
    const [min, max] = price.split("-");
    if (min) query.set("minPrice", min);
    if (max) query.set("maxPrice", max);
  }

  if (minRating) query.set("minRating", minRating);
if (discountIds) {
  query.set("discountIds", discountIds);
}
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${query.toString()}`,
    { cache: "no-store" }
  );

  return res.json();
}

/* =====================
   Metadata
===================== */

export async function generateMetadata({ params, searchParams }: any) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const discount = resolvedSearchParams?.discount;

  const categoriesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Categories?includeInactive=false&includeSubCategories=true`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());
const categoriesArray = Array.isArray(categoriesRes.data)
  ? categoriesRes.data
  : categoriesRes.data?.items || [];

const category = findCategoryBySlug(categoriesArray, slug);

  if (!category) {
    return {
      title: "Category not found",
      description: "",
    };
  }

 return {
  title: discount
    ? `${category.name} – ${discount}% OFF`
    : category.metaTitle || category.name,

  description:
    category.metaDescription || category.description || "",

  keywords: category.metaKeywords || category.name,

  openGraph: {
    title: category.metaTitle || category.name,
    description: category.metaDescription,
    url: `https://direct-care.co.uk/category/${slug}`,
    siteName: "Direct Care",
    images: [
      {
        url: category.imageUrl || "/fallback.jpg",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: category.metaTitle || category.name,
    description: category.metaDescription,
    images: [category.imageUrl || "/fallback.jpg"],
  },

  alternates: {
    canonical: `https://direct-care.co.uk/category/${slug}`,
  },
};
}

/* =====================
   Loading UI
===================== */

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-[#445D41]" />
    </div>
  );
}

/* =====================
   Page
===================== */

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;

  const discount = searchParamsResolved.discount
    ? Number(searchParamsResolved.discount)
    : null;

  // ✅ Fetch category tree ONCE
  const categoriesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Categories?includeInactive=false&includeSubCategories=true`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

const categoriesArray = Array.isArray(categoriesRes.data)
  ? categoriesRes.data
  : categoriesRes.data?.items || [];

const category = findCategoryBySlug(categoriesArray, slug);
if (!category) return notFound();

const categoryPath =
  findCategoryPath(categoriesArray, slug) || [];

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  ...categoryPath.slice(0, -1).map((c: any) => ({
    label: c.name,
    href: `/category/${c.slug}`,
  })),
  {
    label: categoryPath.at(-1)?.name || category.name,
    href: `/category/${slug}`, // ✅ ALWAYS PRESENT
  },
];

  // Map brand slugs (from URL) → brand IDs (for API)
  const brandSlugs = searchParamsResolved.brands?.split(",").filter(Boolean) ?? [];
  const resolvedBrandIds = brandSlugs.length > 0
    ? (category.brands ?? [] as any[])
        .filter((b: any) => brandSlugs.includes(b.slug))
        .map((b: any) => b.id)
        .join(",")
    : undefined;

  // Subcategory filter — use subCategorySlug query param (stays on same page)
  const effectiveCategorySlug = searchParamsResolved.subCategorySlug || slug;

  const productsRes = await getProducts(searchParamsResolved, effectiveCategorySlug, resolvedBrandIds);

  const vatRatesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/VATRates?activeOnly=true`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

 return (
  <Suspense fallback={<Loading />}>

    {/* ✅ SEO: CATEGORY DESCRIPTION (SERVER SIDE) */}
    {category?.description && (
      <div style={{ display: "none" }}>
        <div dangerouslySetInnerHTML={{ __html: category.description }} />
      </div>
    )}

    {/* ✅ SEO: FAQ SCHEMA */}
    {(category as any)?.faqs?.length > 0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": (category as any).faqs
              .filter((f: any) => f.isActive)
              .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
              .map((faq: any) => ({
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
    <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.name,
      description: category.metaDescription || category.description,
      url: `https://direct-care.co.uk/category/${category.slug}`,
mainEntity: {
  "@type": "ItemList",
}
    }),
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
      item: `https://direct-care.co.uk${item.href}`,
      })),
    }),
  }}
/>
    {/* 🔥 EXISTING CODE (UNCHANGED) */}
    <CategoryClient
      category={category}
      breadcrumbs={breadcrumbs}
      initialProducts={productsRes.data?.items ?? []}
      totalCount={productsRes.data?.totalCount ?? 0}
      currentPage={productsRes.data?.page ?? 1}
      pageSize={productsRes.data?.pageSize ?? 20}
      totalPages={productsRes.data?.totalPages ?? 1}
      initialSortBy={searchParamsResolved.sortBy || "name"}
      initialSortDirection={searchParamsResolved.sortDirection || "asc"}
      brands={category.brands ?? []}
      vatRates={vatRatesRes.data || []}
      discount={discount}
    />

  </Suspense>
);
}
