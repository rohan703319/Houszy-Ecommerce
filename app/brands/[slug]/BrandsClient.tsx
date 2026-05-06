"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { useVatRates } from "@/app/hooks/useVatRates";
import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";

const PAGE_SIZE = 20;

interface BrandsClientProps {
  brandSlug: string;
  initialItems: any[];
  totalPages: number;
}

export default function BrandsClient({
  brandSlug,
  initialItems,
  totalPages,
}: BrandsClientProps) {
  const vatRates = useVatRates();

  const [products, setProducts] = useState<any[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(totalPages > 1);
  
const [isLoadingMore, setIsLoadingMore] = useState(false);
const isFetchingRef = useRef(false);
const fetchCbRef = useRef<() => void>(() => {});
const loadMoreRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  setProducts(initialItems ?? []);
  setPage(1);
  setHasMore(totalPages > 1);
}, [initialItems, totalPages]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [brandInfo, setBrandInfo] = useState<any>(null);
const [brandLoading, setBrandLoading] = useState(false);
const [showFilters, setShowFilters] = useState(false);
const activeFilterCount =
  selectedCategories.length + (minRating > 0 ? 1 : 0);
 const [sortBy, setSortBy] = useState<string>("default");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

const handleSortChange = (value: string) => {
  if (value === "default") {
    setSortBy("default");
    setSortDirection("asc");
    return;
  }

  const [by, dir] = value.split("-");

  setSortBy(by);

  if (by === "rating") {
    setSortDirection("desc"); // 🔥 always high → low
  } else {
    setSortDirection(dir as "asc" | "desc");
  }
};

  const categories = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((p) => {
      p.categories?.forEach((c: any) => {
        if (!map.has(c.categoryId)) {
          map.set(c.categoryId, {
            id: c.categoryId,
            name: c.categoryName,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [products]);

useEffect(() => {
  if (!products || products.length === 0) return;

  const flat = flattenProductsForListing(products);

  const prices = flat.map((item: any) => {
    const variantPrice =
      typeof item.variantForCard?.price === "number" &&
      item.variantForCard.price > 0
        ? item.variantForCard.price
        : item.productData.price ?? 0;

    return variantPrice;
  });

  if (prices.length === 0) return;

  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));

  setMinPrice(min);
  setMaxPrice(max);
  setPriceRange([min, max]);
}, [products]);

useEffect(() => {
  const fetchBrandInfo = async () => {
    try {
      setBrandLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Brands?includeUnpublished=false`
      );

  const json = await res.json();

if (json?.success) {
  // 🔥 FIX: सही array निकालो
  const dataArray = Array.isArray(json.data)
    ? json.data
    : json.data?.items || [];

  const brand = dataArray.find(
    (b: any) => b.slug === brandSlug
  );

  setBrandInfo(brand || null);
}
    } catch (err) {
      console.error("Brand fetch error:", err);
    } finally {
      setBrandLoading(false);
    }
  };

  if (brandSlug) fetchBrandInfo();
}, [brandSlug]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      if (selectedCategories.length > 0) {
        const ids = product.categories?.map((c: any) => c.categoryId) ?? [];
        if (!ids.some((id: string) => selectedCategories.includes(id)))
          return false;
      }

      if (product.price < priceRange[0] || product.price > priceRange[1])
        return false;

      if ((product.averageRating ?? 0) < minRating) return false;

      return true;
    });

  return result;
  }, [
    products,
    selectedCategories,
    priceRange,
    minRating,
   
  ]);
const flattenedProducts = useMemo(() => {

  const flat = flattenProductsForListing(filteredProducts);

  const seen = new Set<string>();

  const unique = flat.filter((item: any) => {
    const key = `${item.productData.id}-${item.variantForCard?.id ?? "parent"}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  const getCardPrice = (item: any) => {
    const basePrice =
      typeof item.variantForCard?.price === "number"
        ? item.variantForCard.price
        : item.productData.price;

    return basePrice;
  };

  const sorted = [...unique].sort((a, b) => {
  // ✅ STEP 1: STOCK PRIORITY
  const stockA =
    a.variantForCard?.stockQuantity ??
    a.productData?.stockQuantity ??
    0;

  const stockB =
    b.variantForCard?.stockQuantity ??
    b.productData?.stockQuantity ??
    0;

  const isOutA = stockA <= 0;
  const isOutB = stockB <= 0;

  // 👉 in-stock first
  if (isOutA !== isOutB) {
    return isOutA ? 1 : -1;
  }

// ⭐ TOP RATED
if (sortBy === "rating") {
  const ratingA = a.productData.averageRating ?? 0;
  const ratingB = b.productData.averageRating ?? 0;

  return ratingB - ratingA; // high → low
}
    if (sortBy === "price") {

      const comparison = getCardPrice(a) - getCardPrice(b);

      return sortDirection === "asc" ? comparison : -comparison;
    }

    return 0;
  });

  return sorted;

}, [filteredProducts, sortBy, sortDirection]);

const fetchMoreProducts = useCallback(async () => {
  if (isFetchingRef.current || !hasMore) return;

  isFetchingRef.current = true;
  setIsLoadingMore(true);

  try {
    const nextPage = page + 1;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Products/by-brand/${brandSlug}?page=${nextPage}&pageSize=${PAGE_SIZE}&sortDirection=${sortDirection}&isPublished=true`
    );

    const data = await res.json();

    setProducts((prev) => [...prev, ...(data.data.items ?? [])]);
    setPage(nextPage);
    setHasMore(nextPage < data.data.totalPages);
  } catch (err) {
    console.error(err);
  } finally {
    isFetchingRef.current = false;
    setIsLoadingMore(false);
  }
}, [page, hasMore, brandSlug, sortDirection]);

useEffect(() => {
  fetchCbRef.current = fetchMoreProducts;
}, [fetchMoreProducts]);

useEffect(() => {
  if (!loadMoreRef.current || !hasMore || isFetchingRef.current) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fetchCbRef.current();
      }
    },
    { rootMargin: "200px" }
  );

  observer.observe(loadMoreRef.current);

  return () => observer.disconnect();
}, [hasMore]);
  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setPriceRange([minPrice, maxPrice]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Mobile Filter Drawer */}
{showFilters && (
  <div className="lg:hidden fixed inset-0 z-50 flex">

    <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl overflow-hidden">

      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold">Filters</h2>

        <div className="flex items-center gap-3">

    <button
      className="text-xs text-[#445D41] font-semibold underline"
      onClick={resetFilters}
    >
      Reset All
    </button>

    <button
      onClick={() => setShowFilters(false)}
      className="p-1 rounded-full hover:bg-gray-100"
    >
      <X className="h-5 w-5 text-gray-500" />
    </button>

  </div>
      </div>

    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3">Category</h3>

            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 p-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={(e) =>
                    setSelectedCategories(
                      e.target.checked
                        ? [...selectedCategories, cat.id]
                        : selectedCategories.filter((c) => c !== cat.id)
                    )
                  }
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        )}

        {minPrice < maxPrice && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-3">Price Range</h3>

            <PremiumPriceSlider
              value={priceRange}
              min={minPrice}
              max={maxPrice}
              onChange={setPriceRange}
            />
          </div>
        )}

      </div>
{/* Show Results Button */}
<div className="border-t px-5 py-4">
  <Button
    className="w-full bg-[#445D41] hover:bg-[#334a2c] text-white font-semibold py-3"
    onClick={() => setShowFilters(false)}
  >
    Show Results ({flattenedProducts.length})
  </Button>
</div>
    </div>

    <div
      className="flex-1 bg-black/50"
      onClick={() => setShowFilters(false)}
    />

  </div>
)}
        {/* TOP BAR – Breadcrumb + Sort (Offers page style) */}
<div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">

  {/* Mobile Filter Button */}
<button
  onClick={() => setShowFilters(true)}
  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 active:bg-gray-50"
>
  <SlidersHorizontal className="h-4 w-4" />
  <span>Filters</span>

  {activeFilterCount > 0 && (
    <span className="ml-0.5 bg-[#445D41] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {activeFilterCount}
    </span>
  )}
</button>

  {/* Breadcrumb */}
  <nav className="hidden md:flex items-center flex-wrap gap-1 text-sm text-gray-600">
    <a href="/" className="hover:text-[#445D41] transition-colors">
      Home
    </a>
    <span className="mx-1 text-gray-400">/</span>
    <a href="/brands" className="hover:text-[#445D41] transition-colors">
      Brands
    </a>
    <span className="mx-1 text-gray-400">/</span>
    <span className="font-semibold text-gray-900 capitalize">
      {brandSlug.replace(/-/g, " ")}
    </span>
  </nav>

  {/* Sort */}
  <select
   value={sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`} 
    onChange={(e) => handleSortChange(e.target.value)}
   className="w-auto max-w-[160px] px-2 py-2 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
  >
   <option value="default">Default Sorting</option>
<option value="price-asc">Price: Low-High</option>
<option value="price-desc">Price: High-Low</option>
<option value="rating-desc">Sort by: Popularity⭐</option>
  </select>

</div>

        <div className="flex gap-8">
          {/* FILTERS */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto overscroll-contain pr-2 hide-scrollbar">
  <Card className="shadow-sm flex flex-col h-full">
    <CardContent className="p-0 flex flex-col h-full">

      {/* HEADER (FIXED) */}
      <div className="flex justify-between items-center border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#445D41]" />
          <h2 className="font-bold">Filters</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-xs text-blue-600"
        >
          Reset
        </Button>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <h3 className="font-bold text-sm mb-3">Category</h3>

            {/* 👇 INTERNAL SCROLL (IMPORTANT) */}
           <div className="max-h-60 overflow-y-auto pr-1 hide-scrollbar">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) =>
                      setSelectedCategories(
                        e.target.checked
                          ? [...selectedCategories, cat.id]
                          : selectedCategories.filter((c) => c !== cat.id)
                      )
                    }
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        {minPrice < maxPrice && (
          <div>
            <h3 className="font-bold text-sm mb-3">Price Range</h3>
            <PremiumPriceSlider
              value={priceRange}
              min={minPrice}
              max={maxPrice}
              onChange={setPriceRange}
            />
          </div>
        )}

        {/* Rating */}
        <div>
          <h3 className="font-bold text-sm mb-3">Minimum Rating</h3>
          {[4, 3, 2, 1, 0].map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
            >
              <input
                type="radio"
                checked={minRating === r}
                onChange={() => setMinRating(r)}
              />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">
                {r === 0 ? "All Ratings" : `${r}+ Stars`}
              </span>
            </label>
          ))}
        </div>

      </div>
    </CardContent>
  </Card>
</aside>

          {/* PRODUCTS */}
          <div className="flex-1">
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
  {flattenedProducts.map((item) => (
    <ProductCard
      key={item.variantForCard?.id ?? item.productData.id}
      product={item.productData}
      vatRates={vatRates}
      variantForCard={item.variantForCard}
      cardSlug={item.cardSlug}
    />
  ))}
</div>


            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No products found
              </div>
            )}

          {hasMore && <div ref={loadMoreRef} />}
          {isLoadingMore && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6 mb-8">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border bg-white animate-pulse">
        <div className="h-44 bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-4/5" />
          <div className="h-3 bg-gray-200 rounded w-3/5" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/5" />
        </div>
      </div>
    ))}
  </div>
)}
          </div>
          
        </div>
        {(brandInfo?.description || brandInfo?.faqs?.length > 0) && (
  <div className="mt-16 space-y-5">

    {/* 🔥 DESCRIPTION */}
{brandInfo?.description && (
  <div className="bg-white border rounded-2xl p-3 md:p-6 shadow-sm">
    <h2 className="text-2xl font-bold text-gray-900 mb-0">
      About {brandInfo.name}
    </h2>

 <div className=" text-gray-700 text-sm md:text-base leading-snug [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-1 [&_ul]:space-y-1 [&_li]:m-0 " dangerouslySetInnerHTML={{ __html: brandInfo.description }} />
  </div>
)}

    {/* 🔥 FAQ */}
    {brandInfo?.faqs?.filter((f: any) => f.isActive)?.length > 0 && (
      <div className="bg-white border rounded-2xl p-6 md:p-10 shadow-sm">

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y">
          {brandInfo.faqs
            .filter((f: any) => f.isActive)
            .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
            .map((faq: any) => (
              <details key={faq.id} className="group py-4">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <span className="font-semibold text-gray-800 text-sm md:text-base">
                    {faq.question}
                  </span>

                  <span className="ml-4 text-black group-open:rotate-180 transition">
                    ⌄
                  </span>
                </summary>

                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
        </div>
      </div>
    )}
  </div>
)}
      </main>
    </div>
  );
}
