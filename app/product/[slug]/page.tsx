// app/products/[slug]/page.tsx
import { Suspense } from 'react';
import ProductClient from './ProductDetails';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cookies } from 'next/headers';

interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isMain: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  sku: string;
  gtin?: string;
  price: number;
  sellPrice?: number;
  oldPrice: number;
  stockQuantity: number;
  categoryName: string;
  brandName: string;
  manufacturerName: string;
  images: ProductImage[];
  averageRating: number;
  reviewCount: number;
  tags: string;
  weight: number;
  weightUnit: string;
  specificationAttributes: string;
  relatedProductIds: string;
  crossSellProductIds: string; // ✅ ADD THIS
  brandId?: string;
  brandSlug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: string;
  isPublished?: boolean;
}


async function getProduct(slug: string, isAdmin: boolean = false) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Products/by-slug/${slug}`,
      {
        cache: 'no-store',
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success) return null;

    const product = json.data;

    // Fetch brand slug if brandId is present
    if (product && product.brandId) {
      try {
        const brandsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`,
          { next: { revalidate: 600 } }
        ).then((r) => r.json());
        const dataArray = Array.isArray(brandsRes.data)
          ? brandsRes.data
          : brandsRes.data?.items || [];
        const matchedBrand = dataArray.find((b: any) => b.id === product.brandId);
        if (matchedBrand) {
          product.brandSlug = matchedBrand.slug;
        }
      } catch (err) {
        console.error("Failed to fetch brand slug on server:", err);
      }
    }

    // ✅ PRODUCTION SAFE CHECK — Admin can bypass published check
    if (
      !product ||
      (
        (product.status !== "Active" || product.isPublished !== true)
        && !isAdmin
      )
    ) {
      return null;
    }

    // ✅ IMPORTANT: Variant logic preserve
    let selectedVariantId: string | undefined = undefined;

    if (product?.variants?.length) {
      const matchedVariant = product.variants.find(
        (v: any) => v.slug === slug
      );
      if (matchedVariant) {
        selectedVariantId = matchedVariant.id;
      }
    }

    let aplusTemplate = null;
    if (product?.aPlusTemplateId) {
      try {
        const tRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/APlusTemplates/${product.aPlusTemplateId}`,
          {
            cache: 'no-store',
          }
        );
        if (tRes.ok) {
          const tJson = await tRes.json();
          if (tJson.success) {
            aplusTemplate = tJson.data;
          }
        }
      } catch (err) {
        console.error("Failed to fetch A+ Template on server side:", err);
      }
    }

    return {
      product,
      selectedVariantId,
      aplusTemplate,
    };
  } catch (err) {
    console.error("getProduct error:", err);
    return null;
  }
}

// ✅ Helper: Check if token belongs to Admin role (server-side)
function isAdminToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = payload[roleKey] ?? "";
    return Array.isArray(role) ? role.includes("Admin") : role === "Admin";
  } catch {
    return false;
  }
}


// ⭐ FIX: params is now Promise
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getProduct(slug);

  if (!data?.product) {
    return {
      title: "Product Not Found",
      description: "Product not found",
    };
  }

  const product = data.product;

  // Clean fallback description if metaDescription is empty
  const fallbackDescription = (product.shortDescription || product.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const metaTitle = product.metaTitle?.trim();
  const metaDescription = product.metaDescription?.trim() || fallbackDescription;
  const metaKeywords = product.metaKeywords?.trim() || product.tags || product.name;

  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage?.imageUrl
    ? primaryImage.imageUrl.startsWith("http")
      ? primaryImage.imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.houszy.co.uk'}${primaryImage.imageUrl}`
    : undefined;

  const allImages = product.images?.length
    ? product.images.map((img: any) => ({
        url: img.imageUrl?.startsWith("http")
          ? img.imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.houszy.co.uk'}${img.imageUrl || ""}`,
        alt: img.altText || product.name,
        width: 1200,
        height: 630,
      }))
    : imageUrl
    ? [
        {
          url: imageUrl,
          alt: primaryImage?.altText || product.name,
          width: 1200,
          height: 630,
        },
      ]
    : [];

  const productUrl = `https://houszy.co.uk/product/${product.slug}`;
  const effectivePrice = product.sellPrice ?? product.price ?? 0;

  return {
    title: metaTitle ? { absolute: metaTitle } : { absolute: `${product.name} | Houszy` },

    description: metaDescription,

    keywords: metaKeywords,

    openGraph: {
      title: metaTitle || `${product.name} | Houszy`,
      description: metaDescription || product.name,
      url: productUrl,
      siteName: "Houszy",
      locale: "en_GB",
      type: "website",
      images: allImages,
    },

    twitter: {
      card: "summary_large_image",
      title: metaTitle || `${product.name} | Houszy`,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },

    alternates: {
      canonical: productUrl,
    },

    robots: {
      index: product.isPublished !== false && product.status === "Active",
      follow: product.isPublished !== false && product.status === "Active",
      googleBot: {
        index: product.isPublished !== false && product.status === "Active",
        follow: product.isPublished !== false && product.status === "Active",
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    other: {
      "product:price:amount": effectivePrice.toString(),
      "product:price:currency": "GBP",
      "product:availability": (product.stockQuantity ?? 0) > 0 ? "in stock" : "out of stock",
      "product:brand": product.brandName || "",
      "product:retailer_item_id": product.sku || product.id,
      "product:condition": "new",
    },
  };
}

// ⭐ FIX: params is now Promise
export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ✅ Read authToken cookie server-side to check if admin
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value ?? '';
  const isAdmin = token ? isAdminToken(token) : false;

  const data = await getProduct(slug, isAdmin);

  if (!data?.product) notFound();

  // ✅ Show preview banner only when admin & product is unpublished
  const isAdminPreview = isAdmin && !data.product.isPublished;

 return (
  <>
    {/* ✅ PRODUCT SCHEMA (SEO BOOST) */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          name: data.product.name,

          image: data.product.images?.map((img: any) =>
            img?.imageUrl?.startsWith("http")
              ? img.imageUrl
              : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.houszy.co.uk'}${img?.imageUrl || ""}`
          ),

          description: (
            data.product.metaDescription ||
            data.product.shortDescription ||
            data.product.description ||
            ""
          )
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),

          sku: data.product.sku,
          ...(data.product.gtin ? { gtin: data.product.gtin } : {}),

          brand: {
            "@type": "Brand",
            name: data.product.brandName || "Houszy",
          },

          category: data.product.categoryName,

          offers: {
            "@type": "Offer",
            url: `https://houszy.co.uk/product/${data.product.slug}`,
            priceCurrency: "GBP",
            price: data.product.sellPrice ?? data.product.price,
            itemCondition: "https://schema.org/NewCondition",
            availability:
              data.product.stockQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },

          aggregateRating:
            data.product.averageRating > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: data.product.averageRating,
                  reviewCount: data.product.reviewCount || 1,
                }
              : undefined,
        }),
      }}
    />

    {/* 🔥 EXISTING UI */}
    <ProductClient 
      product={data.product}
      initialVariantId={data.selectedVariantId}
      aplusTemplate={data.aplusTemplate}
      aplusContent={data.product.aPlusContent}
      isAdminPreview={isAdminPreview}
    />
  </>
);
}