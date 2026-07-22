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
  // Categories / Brands from loaded products (Sorted A-Z)
  const categories = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach(p => p.categories?.forEach((c: any) => {
      if (!map.has(c.categoryId)) map.set(c.categoryId, { id: c.categoryId, name: c.categoryName });
    }));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Brands (Sorted A-Z, filtered by selected categories)
  const brands = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach(p => {
      if (selectedCategories.length > 0) {
        const matchesCategory = p.categories?.some((c: any) => selectedCategories.includes(c.categoryId));
        if (!matchesCategory) return;
      }
      p.brands?.forEach((b: any) => {
        if (!map.has(b.brandId)) map.set(b.brandId, { id: b.brandId, name: b.brandName });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategories]);

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
        const saleA = a.variantForCard?.saleCount ?? a.productData.saleCount ?? 0;
        const saleB = b.variantForCard?.saleCount ?? b.productData.saleCount ?? 0;
        return saleB - saleA;
      }

      const saleA = a.variantForCard?.saleCount ?? a.productData.saleCount ?? 0;
      const saleB = b.variantForCard?.saleCount ?? b.productData.saleCount ?? 0;
      return saleB - saleA;
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

  // ─── Desktop filter sidebar content (Houszy-style accordion) ───
  const desktopFilterContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Filters</span>
        <button
          onClick={resetFilters}
          className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition"
        >
          Reset
        </button>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <details className="group border-b border-gray-200">
          <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Category</span>
            <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
            <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
          </summary>
          <div className="pb-3 space-y-0 max-h-56 overflow-y-auto">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={e => setSelectedCategories(e.target.checked ? [...selectedCategories, cat.id] : selectedCategories.filter(c => c !== cat.id))}
                />
                <span className={`text-[13px] truncate transition ${selectedCategories.includes(cat.id) ? "font-semibold text-black" : "text-gray-600 group-hover/item:text-black"}`}>
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </details>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <details className="group border-b border-gray-200" open>
          <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brand</span>
            <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
            <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
          </summary>
          <div className="pb-3 space-y-0 max-h-56 overflow-y-auto">
            {brands.map(brand => (
              <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={e => setSelectedBrands(e.target.checked ? [...selectedBrands, brand.id] : selectedBrands.filter(b => b !== brand.id))}
                />
                <span className={`text-[13px] truncate transition ${selectedBrands.includes(brand.id) ? "font-semibold text-black" : "text-gray-600 group-hover/item:text-black"}`}>
                  {brand.name}
                </span>
              </label>
            ))}
          </div>
        </details>
      )}

      {/* Price */}
      <details className="group border-b border-gray-200">
        <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Price</span>
          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
        </summary>
        <div className="pb-4 px-2.5">
          {minPrice < maxPrice ? (
            <PremiumPriceSlider value={priceRange} min={minPrice} max={maxPrice} onChange={v => setPriceRange(v)} />
          ) : (
            <p className="text-xs text-gray-400">Loading prices…</p>
          )}
        </div>
      </details>

      {/* Rating */}
      <details className="group border-b border-gray-200">
        <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Rating</span>
          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
        </summary>
        <div className="pb-3 space-y-0">
          {[4, 3, 2, 1, 0].map(rating => (
            <label key={rating} className="flex items-center gap-2.5 cursor-pointer py-1.5 group/item">
              <input
                type="radio"
                name="rating-desktop"
                className="w-3.5 h-3.5 accent-black flex-shrink-0"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
              />
              <div className="flex items-center gap-1.5">
                {rating > 0 ? (
                  <>
                    <div className="flex">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-[#f38918] text-[#f38918]" />
                      ))}
                    </div>
                    <span className={`text-[13px] transition ${minRating === rating ? "font-semibold text-black" : "text-gray-600"}`}>
                      {rating}+ Stars
                    </span>
                  </>
                ) : (
                  <span className={`text-[13px] transition ${minRating === rating ? "font-semibold text-black" : "text-gray-600"}`}>
                    All Ratings
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </details>
    </>
  );

  // ─── Mobile drawer filter content ───
  const mobileFilterContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Filters</span>
        <div className="flex items-center gap-3">
          <button
            className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition"
            onClick={resetFilters}
          >
            Reset All
          </button>
          <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-5">

        {/* Category */}
        {categories.length > 0 && (
          <details className="group border-b border-gray-200">
            <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Category</span>
              <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
              <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
            </summary>
            <div className="pb-4 space-y-0 max-h-48 overflow-y-auto">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={e => setSelectedCategories(e.target.checked ? [...selectedCategories, cat.id] : selectedCategories.filter(c => c !== cat.id))}
                  />
                  <span className={`text-[13px] transition ${selectedCategories.includes(cat.id) ? "font-semibold text-black" : "text-gray-600"}`}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}

        {/* Brand */}
        {brands.length > 0 && (
          <details className="group border-b border-gray-200">
            <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brand</span>
              <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
              <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
            </summary>
            <div className="pb-4 space-y-0 max-h-48 overflow-y-auto">
              {brands.map(brand => (
                <label key={brand.id} className="flex items-center gap-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={e => setSelectedBrands(e.target.checked ? [...selectedBrands, brand.id] : selectedBrands.filter(b => b !== brand.id))}
                  />
                  <span className={`text-[13px] transition ${selectedBrands.includes(brand.id) ? "font-semibold text-black" : "text-gray-600"}`}>
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}

        {/* Price */}
        {minPrice < maxPrice && (
          <details className="group border-b border-gray-200">
            <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Price</span>
              <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
              <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
            </summary>
            <div className="pb-4">
              <PremiumPriceSlider value={priceRange} min={minPrice} max={maxPrice} onChange={v => setPriceRange(v)} />
            </div>
          </details>
        )}

        {/* Rating */}
        <details className="group border-b border-gray-200">
          <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Rating</span>
            <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
            <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
          </summary>
          <div className="pb-4 space-y-0">
            {[4, 3, 2, 1, 0].map(rating => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer py-2">
                <input
                  type="radio"
                  name="rating-mobile"
                  className="w-3.5 h-3.5 accent-black"
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                />
                <div className="flex items-center gap-1.5">
                  {rating > 0 ? (
                    <>
                      <div className="flex">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-[#f38918] text-[#f38918]" />
                        ))}
                      </div>
                      <span className={`text-[13px] ${minRating === rating ? "font-semibold text-black" : "text-gray-600"}`}>
                        {rating}+ Stars
                      </span>
                    </>
                  ) : (
                    <span className={`text-[13px] ${minRating === rating ? "font-semibold text-black" : "text-gray-600"}`}>
                      All Ratings
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </details>

      </div>

      {/* Apply button */}
      <div className="border-t px-5 py-4">
        <button
          className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg text-sm tracking-wide transition"
          onClick={() => setShowFilters(false)}
        >
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
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/offers" className="hover:text-black transition-colors">Offers</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-800 truncate max-w-[200px]">{discountName}</span>
        </nav>

        {/* RIGHT: Sorting */}
        <select
          value={sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="default">Default Sorting</option>
          <option value="price-asc">Price: Low-High</option>
          <option value="price-desc">Price: High-Low</option>
          <option value="rating-desc">Sort by: Popularity⭐</option>
        </select>
      </div>

      {/* Mobile: filter + sort row */}
      <div className="flex items-center justify-between gap-2 mb-3 lg:hidden">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center bg-black text-white text-xs rounded-full w-4 h-4">{activeFilterCount}</span>
          )}
        </button>
        <select
          value={sortBy === "default" ? "default" : `${sortBy}-${sortDirection}`}
          onChange={e => handleSortChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700"
        >
          <option value="default">Default Sorting</option>
          <option value="price-asc">Price: Low-High</option>
          <option value="price-desc">Price: High-Low</option>
          <option value="rating-desc">Sort by: Popularity⭐</option>
        </select>
      </div>

      {/* Mobile drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl overflow-hidden">
            {mobileFilterContent}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setShowFilters(false)} />
        </div>
      )}

      <div className="flex gap-6 lg:gap-8">
        {/* Desktop filters — Houszy-style accordion */}
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">
          {desktopFilterContent}
        </aside>

        {/* Products */}
        <div className="flex-1">
          {flattenedProducts.length === 0 && !loading ? (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No products found</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-sm text-black hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8">
                {flattenedProducts.map(item => (
                  <ProductCard
                    key={item.variantForCard?.id ?? item.productData.id}
                    product={item.productData}
                    variantForCard={item.variantForCard}
                    cardSlug={item.cardSlug}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="text-center pb-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors disabled:opacity-60"
                  >
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


