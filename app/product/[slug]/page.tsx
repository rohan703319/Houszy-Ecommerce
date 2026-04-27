// app/products/[slug]/page.tsx
import { Suspense } from 'react';
import ProductClient from './ProductDetails';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  price: number;
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
}

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Products/by-slug/${slug}`,
      {
       cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success) return null;

    const product = json.data;
// ✅ PRODUCTION SAFE CHECK
if (
  !product ||
  product.status !== "Active" ||
  product.isPublished !== true
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

    return {
      product,
      selectedVariantId,
    };
  } catch (err) {
    console.error("getProduct error:", err);
    return null;
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

  const description = (product.shortDescription ?? "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 160);

  const imageUrl = product.images?.[0]?.imageUrl
    ? product.images[0].imageUrl.startsWith("http")
      ? product.images[0].imageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${product.images[0].imageUrl}`
    : undefined;

return {
  title: `${product.name} | Direct Care`,

  description,

  keywords: product.tags || product.name,

  openGraph: {
    title: product.name,
    description: description || product.name,
    url: `https://www.direct-care.co.uk/products/${product.slug}`,
    siteName: "Direct Care",
    images: imageUrl
      ? [
          {
            url: imageUrl,
           width: 1200,
height: 630,
          },
        ]
      : [],
  type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: product.name,
    description: description,
    images: imageUrl ? [imageUrl] : [],
  },

  alternates: {
    canonical: `https://www.direct-care.co.uk/products/${product.slug}`,
  },
};
}

// ⭐ FIX: params is now Promise
export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const data = await getProduct(slug);

 if (!data?.product) notFound();

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
          : `${process.env.NEXT_PUBLIC_API_URL}${img?.imageUrl || ""}`
      ),

      description: (data.product.shortDescription || "")
        .replace(/<[^>]*>/g, "")
       .slice(0, 155),

      sku: data.product.sku,

      brand: {
        "@type": "Brand",
        name: data.product.brandName,
      },

      category: data.product.categoryName, // ✅ ADD

      offers: {
        "@type": "Offer",
      url: `https://www.direct-care.co.uk/products/${data.product.slug}`,
        priceCurrency: "GBP",
        price: data.product.price,
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
    />
  </>
);
}