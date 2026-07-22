import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import SearchTracker from "./SearchTracker";
import SearchClient from "./SearchClient";
import type { Metadata } from "next";

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  return {
    title: query ? `Search results for "${query}" | Houszy` : "Search | Houszy",
    description: `Browse search results for "${query}" at Houszy. Shop quality homeware, kitchenware, fitness equipment, and toys.`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

interface SearchParams {
  q?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: string;
  pageSize?: string;
  brands?: string;      // brand slugs, comma-separated
  price?: string;       // price range e.g. "10-100"
  minRating?: string;
  categorySlug?: string; // category slugs, comma-separated
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const searchParamsResolved = await searchParams;
  const query = searchParamsResolved.q ?? "";

  let apiProducts: any[] = [];
  let products: any[] = [];
  let errorMessage = "";
  let json: any = null;

  // 1. Fetch all Brands and Categories for filter sidebars
  const brandsPromise = fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

  const categoriesPromise = fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Categories?includeInactive=false&includeSubCategories=true`,
    { next: { revalidate: 600 } }
  ).then((r) => r.json());

  const [brandsRes, categoriesRes] = await Promise.all([
    brandsPromise,
    categoriesPromise,
  ]);

  const allBrands = (Array.isArray(brandsRes.data)
    ? brandsRes.data
    : brandsRes.data?.items || [])
    .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

  const allCategories = (Array.isArray(categoriesRes.data)
    ? categoriesRes.data
    : categoriesRes.data?.items || [])
    .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

  const sortBy = searchParamsResolved.sortBy || "name";
  const sortDirection = searchParamsResolved.sortDirection || "asc";

  if (query.length > 1) {
    try {
      // 2. Map brand slugs from URL parameter to brand IDs
      const brandSlugs = searchParamsResolved.brands?.split(",").filter(Boolean) ?? [];
      const resolvedBrandIds = brandSlugs.length > 0
        ? allBrands
          .filter((b: any) => brandSlugs.includes(b.slug))
          .map((b: any) => b.id)
          .join(",")
        : undefined;

      const page = searchParamsResolved.page ?? "1";
      const pageSize = searchParamsResolved.pageSize ?? "20";
      const price = searchParamsResolved.price;
      const minRating = searchParamsResolved.minRating;
      const categorySlug = searchParamsResolved.categorySlug;

      // 3. Build API parameters
      const queryParams = new URLSearchParams({
        page,
        pageSize,
        sortBy,
        sortDirection,
        isPublished: "true",
        isActive: "true",
        isDeleted: "false",
        searchTerm: query,
      });

      if (resolvedBrandIds) {
        queryParams.set("brandIds", resolvedBrandIds);
      }

      if (categorySlug) {
        queryParams.set("categorySlug", categorySlug);
      }

      if (price) {
        const [min, max] = price.split("-");
        if (min) queryParams.set("minPrice", min);
        if (max) queryParams.set("maxPrice", max);
      }

      if (minRating) {
        queryParams.set("minRating", minRating);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${queryParams.toString()}`,
        { cache: "no-store" }
      );

      json = await res.json();

      if (json.success) {
        apiProducts = json?.data?.items || [];
        products = flattenProductsForListing(apiProducts);
      } else {
        errorMessage = json.message;
      }
    } catch (err) {
      errorMessage = "Something went wrong. Please try again.";
    }
  }

  return (
    <>
      {/* Existing Search Tracker (DO NOT REMOVE OR ALTER) */}
      <SearchTracker products={products} query={query} />

      {query.length < 2 ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Search results for:
            <span className="text-[#f38918]"> &quot;{query}&quot;</span>
          </h1>
          <p className="text-gray-600 text-sm">
            Please enter at least 2 characters to search.
          </p>
        </div>
      ) : errorMessage ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Search results for:
            <span className="text-[#f38918]"> &quot;{query}&quot;</span>
          </h1>
          <p className="text-red-600 font-medium mt-4">
            {errorMessage}
          </p>
        </div>
      ) : (
        <SearchClient
          query={query}
          initialProducts={apiProducts}
          totalCount={json?.data?.totalCount ?? 0}
          currentPage={json?.data?.page ?? 1}
          pageSize={json?.data?.pageSize ?? 20}
          totalPages={json?.data?.totalPages ?? 1}
          initialSortBy={sortBy}
          initialSortDirection={sortDirection}
          brands={allBrands}
          categories={allCategories}
        />
      )}
    </>
  );
}
