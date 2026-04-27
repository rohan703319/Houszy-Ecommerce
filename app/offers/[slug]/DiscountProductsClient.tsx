"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { useVatRates } from "@/app/hooks/useVatRates";
import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import { Star, SlidersHorizontal, X, Loader2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import { getDiscountedPrice } from "@/app/lib/discountHelpers";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
interface Props {
  discountId: string;
  initialItems: any[];
  initialHasMore: boolean;
  pageSize: number;
  discountName: string;
}

export default function DiscountProductsClient({ discountId, initialItems, initialHasMore, pageSize, discountName, }: Props) {
  const vatRates = useVatRates();
  const [products, setProducts] = useState<any[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

 const [sortBy, setSortBy] = useState<string>("default");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
const getFinalPrice = (item: any) => {
  const p = item.productData;

  const basePrice =
    typeof item.variantForCard?.price === "number" &&
    item.variantForCard.price > 0
      ? item.variantForCard.price
      : p.price ?? 0;

  // ✅ EXACT SAME AS ProductCard
  const finalPrice = getDiscountedPrice(p, basePrice);

  return finalPrice;
};
  // Load more
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
        discountId,
        sortBy,
        sortDirection,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Products/discounted?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const items = json?.data?.items ?? [];
        setProducts(prev => [...prev, ...items]);
        setPage(nextPage);
        setHasMore(items.length === pageSize);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize, discountId, sortBy, sortDirection]);

  // Price range
  useEffect(() => {
    if (!products.length) return;
    const flat = flattenProductsForListing(products);
 const prices = flat.map((item: any) => getFinalPrice(item));
    if (!prices.length) return;
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    setMinPrice(min); setMaxPrice(max);
    setPriceRange(prev =>
  prev[0] === 0 && prev[1] === 0 ? [min, max] : prev
);
  }, [products]);

  // Categories / Brands from loaded products
  const categories = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach(p => p.categories?.forEach((c: any) => {
      if (!map.has(c.categoryId)) map.set(c.categoryId, { id: c.categoryId, name: c.categoryName });
    }));
    return Array.from(map.values());
  }, [products]);

  const brands = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach(p => p.brands?.forEach((b: any) => {
      if (!map.has(b.brandId)) map.set(b.brandId, { id: b.brandId, name: b.brandName });
    }));
    return Array.from(map.values());
  }, [products]);

  // Filter + flatten + sort
  const flattenedProducts = useMemo(() => {
 const flat = flattenProductsForListing(products);
const filtered = flat.filter((item: any) => {
  const p = item.productData;

  // Category filter
  if (
    selectedCategories.length &&
    !p.categories?.some((c: any) =>
      selectedCategories.includes(c.categoryId)
    )
  )
    return false;

  // Brand filter
  if (
    selectedBrands.length &&
    !p.brands?.some((b: any) =>
      selectedBrands.includes(b.brandId)
    )
  )
    return false;

  // ✅ FIXED PRICE LOGIC (IMPORTANT)
const price = getFinalPrice(item);

  if (price < priceRange[0] || price > priceRange[1]) return false;

  // Rating
  if ((p.averageRating ?? 0) < minRating) return false;

  return true;
});
    const seen = new Set<string>();
   const unique = filtered.filter((item: any) => {
      const key = `${item.productData.id}-${item.variantForCard?.id ?? "parent"}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    return [...unique].sort((a, b) => {
  const stockA =
    a.variantForCard?.stockQuantity ??
    a.productData?.stockQuantity ??
    0;

  const stockB =
    b.variantForCard?.stockQuantity ??
    b.productData?.stockQuantity ??
    0;

  // ✅ STOCK PRIORITY
  if (stockA <= 0 && stockB > 0) return 1;
  if (stockA > 0 && stockB <= 0) return -1;

  // ⭐ TOP RATED
  if (sortBy === "rating") {
    const ratingA = a.productData.averageRating ?? 0;
    const ratingB = b.productData.averageRating ?? 0;
    return ratingB - ratingA;
  }

  // 💰 PRICE
  const priceA = getFinalPrice(a);
  const priceB = getFinalPrice(b);

  if (sortBy === "price") {
    const cmp = priceA - priceB;
    return sortDirection === "asc" ? cmp : -cmp;
  }

  // ✅ DEFAULT (MOST IMPORTANT)
  if (sortBy === "default") {
    return 0;
  }

  return 0;
});
  }, [products, selectedCategories, selectedBrands, priceRange, minRating, sortBy, sortDirection]);

  const resetFilters = () => {
    setSelectedCategories([]); setSelectedBrands([]); setMinRating(0); setPriceRange([minPrice, maxPrice]);
  };
  const activeFilterCount = selectedCategories.length + selectedBrands.length + (minRating > 0 ? 1 : 0);

const handleSortChange = (value: string) => {
  if (value === "default") {
    setSortBy("default");
    setSortDirection("asc");
    return;
  }

  const [by, dir] = value.split("-");

  setSortBy(by);

  if (by === "rating") {
    setSortDirection("desc"); // ⭐ always high → low
  } else {
    setSortDirection(dir as "asc" | "desc");
  }
};

  const filterContent = (
    <>
      <div className="flex items-center justify-between pb-4 border-b mb-4 px-4 pt-4 lg:px-6 lg:pt-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#445D41]" />
          <h2 className="font-bold text-base text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset All</button>
          <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-4 lg:px-6 space-y-6 overflow-y-auto flex-1">
        {categories.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3">Category</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition">
                  <input type="checkbox" className="w-4 h-4 text-[#445D41]"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={e => setSelectedCategories(e.target.checked ? [...selectedCategories, cat.id] : selectedCategories.filter(c => c !== cat.id))} />
                  <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {brands.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3">Brand</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {brands.map(brand => (
                <label key={brand.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition">
                  <input type="checkbox" className="w-4 h-4 text-[#445D41]"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={e => setSelectedBrands(e.target.checked ? [...selectedBrands, brand.id] : selectedBrands.filter(b => b !== brand.id))} />
                  <span className="text-sm text-gray-700">{brand.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-4">Price Range</h3>
          {minPrice < maxPrice && <PremiumPriceSlider value={priceRange} min={minPrice} max={maxPrice} onChange={v => setPriceRange(v)} />}
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">Minimum Rating</h3>
          {[4, 3, 2, 1, 0].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition">
              <input type="radio" className="w-4 h-4 text-[#445D41]" checked={minRating === rating} onChange={() => setMinRating(rating)} />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-700">{rating > 0 ? `${rating}+ Stars` : "All Ratings"}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="lg:hidden px-4 pb-4 pt-2 border-t mt-auto">
        <button onClick={() => setShowFilters(false)} className="w-full py-3 bg-[#445D41] text-white rounded-lg font-semibold text-sm">
          Show Results ({flattenedProducts.length})
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Sort/filter bar */}
  <div className="hidden md:flex items-center justify-between mb-3">

  {/* LEFT: Breadcrumb */}
  <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">

  <Link href="/" className="hover:text-[#445D41] transition-colors">
    Home
  </Link>

  <ChevronRight className="h-3.5 w-3.5" />

  <Link href="/offers" className="hover:text-[#445D41] transition-colors">
    Offers
  </Link>

  <ChevronRight className="h-3.5 w-3.5" />

  <span className="font-semibold text-gray-800 truncate max-w-[200px]">
    {discountName}
  </span>

</nav>

  {/* RIGHT: Sorting */}
  <select
    value={sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`}
    onChange={(e) => handleSortChange(e.target.value)}
    className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
  >
    <option value="default">Default Sorting</option>
    <option value="price-asc">Price: Low-High</option>
    <option value="price-desc">Price: High-Low</option>
    <option value="rating-desc">Sort by: Popularity⭐</option>
  </select>

</div>

      <div className="flex items-center justify-between gap-2 mb-3 lg:hidden">
        <button onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center bg-[#445D41] text-white text-xs rounded-full w-4 h-4">{activeFilterCount}</span>
          )}
        </button>
        <select value={sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`} onChange={e => handleSortChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700">
           <option value="default">Default Sorting</option>
<option value="price-asc">Price: Low-High</option>
<option value="price-desc">Price: High-Low</option>
<option value="rating-desc">Sort by: Popularity⭐</option>
        </select>
      </div>

      {/* Mobile drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl overflow-hidden">{filterContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setShowFilters(false)} />
        </div>
      )}

      <div className="flex gap-6 lg:gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">
          <Card className="shadow-sm flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">{filterContent}</CardContent>
          </Card>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {flattenedProducts.length === 0 && !loading ? (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No products found</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-sm text-[#445D41] hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 mb-8">
                {flattenedProducts.map(item => (
                  <ProductCard
                    key={item.variantForCard?.id ?? item.productData.id}
                    product={item.productData}
                    vatRates={vatRates}
                    variantForCard={item.variantForCard}
                    cardSlug={item.cardSlug}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="text-center pb-8">
                  <button onClick={loadMore} disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#445D41] text-white rounded-xl font-semibold hover:bg-[#3a5237] transition-colors disabled:opacity-60">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</> : "Load More Products"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
