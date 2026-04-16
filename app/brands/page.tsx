// ISR: regenerate every 5 minutes — serves static HTML from CDN under high traffic
export const revalidate = 300;

import BrandsClient from "@/components/BrandsClient";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  showOnHomepage?: boolean;
}

async function getAllBrands(baseUrl: string): Promise<Brand[]> {
  try {
    const res = await fetch(
      `${baseUrl}/api/Brands?includeUnpublished=false&isActive=true&isDeleted=false`,
      { next: { revalidate: 300 } }
    );

    // ✅ response fail handle
    if (!res.ok) {
      console.error("Brands API failed:", res.status);
      return [];
    }

    // ✅ safe parsing
    const text = await res.text();

    if (!text) {
      console.error("Empty brands response");
      return [];
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON from Brands API:", text);
      return [];
    }

    // ✅ FINAL FIX (IMPORTANT)
    if (result?.success) {
      // case 1: direct array
      if (Array.isArray(result.data)) return result.data;

      // case 2: { items: [] }
      if (Array.isArray(result.data?.items)) return result.data.items;
    }

    return [];
  } catch (err) {
    console.error("Brands fetch failed:", err);
    return [];
  }
}

export default async function BrandsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  const brands = await getAllBrands(baseUrl);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* ===== HERO HEADER ===== */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-2 text-center">

          <h1 className="text-3xl md:text-4xl font-semibold mb-0 tracking-tight">
            Explore Our Brands
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Discover premium and trusted brands curated specially for you.
          </p>

        </div>
      </div>

      {/* ===== BRANDS SECTION ===== */}
      <div className="max-w-7xl mx-auto px-4 py-4">

        {brands.length === 0 ? (
          <p className="text-center text-gray-500">
            No brands available.
          </p>
        ) : (
          <BrandsClient brands={brands} baseUrl={baseUrl} />
        )}

      </div>

    </div>
  );
}