"use client";

import { useEffect, useMemo, useState, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import { SlidersHorizontal, Star, X, Search, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import { getDiscountedPrice } from "@/app/lib/discountHelpers";
import { trackViewItemList } from "@/lib/analytics";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface BrandsClientProps {
  brand: any;
  breadcrumbs: BreadcrumbItem[];
  initialProducts: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  initialSortBy: string;
  initialSortDirection: string;
  categories: Category[];
}

export default function BrandsClient({
  brand,
  breadcrumbs,
  initialProducts,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  initialSortBy,
  initialSortDirection,
  categories,
}: BrandsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<any[]>(initialProducts ?? []);
  const [page, setPage] = useState(currentPage ?? 1);
  const [hasMore, setHasMore] = useState(totalPages ? currentPage < totalPages : true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);
  const fetchCbRef = useRef<() => void>(() => { });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [sortBy, setSortBy] = useState((initialSortBy ?? "name").toLowerCase());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (initialSortDirection as "asc" | "desc") || "asc"
  );

  // Sync sorting from URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const urlSortBy = params.get("sortBy") || initialSortBy;
    const urlSortDirection =
      (params.get("sortDirection") as "asc" | "desc") || initialSortDirection;

    setSortBy(urlSortBy.toLowerCase());
    setSortDirection(urlSortDirection);
  }, [searchParams.toString(), initialSortBy, initialSortDirection]);

  // Sync products when server initialProducts changes
  useEffect(() => {
    setProducts(initialProducts ?? []);
    setPage(currentPage ?? 1);
    setHasMore(totalPages ? currentPage < totalPages : true);
  }, [initialProducts, currentPage, totalPages]);

  // Analytics view track
  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, brand?.name ?? "Brand");
    }
  }, [products, brand?.name]);

  // Active filters count
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const categoriesParam = searchParams.get("categorySlug");
    if (!categoriesParam) return [];
    const slugs = categoriesParam.split(",").filter(Boolean);
    return categories.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
  });

  const [minRating, setMinRating] = useState(() => {
    const param = searchParams.get("minRating");
    return param ? Number(param) : 0;
  });

  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);

  // Sync selectedCategories when categorySlug search parameter changes
  useEffect(() => {
    const categoriesParam = searchParams.get("categorySlug");
    if (!categoriesParam) {
      setSelectedCategories([]);
      return;
    }
    const slugs = categoriesParam.split(",").filter(Boolean);
    setSelectedCategories(
      categories.filter((c) => slugs.includes(c.slug)).map((c) => c.id)
    );
  }, [searchParams.toString(), categories]);

  // Sync minRating when URL changes
  useEffect(() => {
    const param = searchParams.get("minRating");
    setMinRating(param ? Number(param) : 0);
  }, [searchParams.toString()]);

  // Compute slider bounds from all loaded products
  useEffect(() => {
    if (!products || products.length === 0) return;

    const flat = flattenProductsForListing(products);
    const prices = flat
      .map((item: any) => {
        const v = item.variantForCard;
        return typeof v?.price === "number" && v.price > 0
          ? v.price
          : (item.productData.price ?? 0);
      })
      .filter((p: number) => p > 0);

    if (prices.length === 0) return;

    const newMin = Math.floor(Math.min(...prices));
    const newMax = Math.ceil(Math.max(...prices));

    setMinPrice((prev) => (prev === 0 ? newMin : Math.min(prev, newMin)));
    setMaxPrice((prev) => Math.max(prev, newMax));
  }, [products]);

  // Price range Single Source of Truth: URL
  const urlPriceParam = searchParams.get("price");
  const committedRange = useMemo<[number, number]>(() => {
    if (urlPriceParam && maxPrice > 0) {
      const parts = urlPriceParam.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], Math.min(parts[1], maxPrice)];
      }
    }
    return [minPrice, maxPrice];
  }, [urlPriceParam, minPrice, maxPrice]);

  const displayRange: [number, number] = dragRange ?? committedRange;

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredAndSortedProducts = useMemo(() => {
    // Categories, rating, and price bounds filters are applied server-side.
    return products;
  }, [products]);

  const flattenedProducts = useMemo(() => {
    const flat = flattenProductsForListing(filteredAndSortedProducts);

    // Apply local price filtering to individual variant cards precisely
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    if (urlPriceParam) {
      const parts = urlPriceParam.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        priceMin = parts[0];
        priceMax = parts[1];
      }
    }

    const priceFiltered =
      priceMin !== null && priceMax !== null
        ? flat.filter((item: any) => {
          const rawPrice =
            typeof item.variantForCard?.price === "number" &&
              item.variantForCard.price > 0
              ? item.variantForCard.price
              : item.productData.price ?? 0;
          return rawPrice >= priceMin! && rawPrice <= priceMax!;
        })
        : flat;

    // De-duplicate
    const seen = new Set<string>();
    const unique = priceFiltered.filter((item: any) => {
      const key = `${item.productData.id}-${item.variantForCard?.id ?? "parent"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const getCardPrice = (item: any) => {
      const defaultVariant =
        item.variantForCard ??
        item.productData.variants?.find((v: any) => v.isDefault) ??
        item.productData.variants?.[0] ??
        null;

      const hasVariants = item.productData.variants && item.productData.variants.length > 0;

      return hasVariants
        ? (defaultVariant?.sellPrice ?? defaultVariant?.price ?? 0)
        : (item.productData.sellPrice ?? item.productData.price ?? 0);
    };

    // Sort after unique logic
    const sorted = [...unique].sort((a, b) => {
      // Stock status priority
      const stockA =
        a.variantForCard?.stockQuantity ?? a.productData.stockQuantity ?? 0;
      const stockB =
        b.variantForCard?.stockQuantity ?? b.productData.stockQuantity ?? 0;

      const isOutA = stockA <= 0;
      const isOutB = stockB <= 0;

      if (isOutA !== isOutB) {
        return isOutA ? 1 : -1;
      }

      if (sortBy === "name") {
        const saleA = a.variantForCard?.saleCount ?? a.productData.saleCount ?? 0;
        const saleB = b.variantForCard?.saleCount ?? b.productData.saleCount ?? 0;
        if (saleA !== saleB) {
          return saleB - saleA;
        }
        const nameA = (a.cardSlug ?? a.productData.name).toLowerCase();
        const nameB = (b.cardSlug ?? b.productData.name).toLowerCase();
        const comparison = nameA.localeCompare(nameB);
        return sortDirection === "asc" ? comparison : -comparison;
      }
      if (sortBy === "rating") {
        const ratingA = a.productData.averageRating ?? 0;
        const ratingB = b.productData.averageRating ?? 0;
        return ratingB - ratingA;
      }
      if (sortBy === "price") {
        const comparison = getCardPrice(a) - getCardPrice(b);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      const saleA = a.variantForCard?.saleCount ?? a.productData.saleCount ?? 0;
      const saleB = b.variantForCard?.saleCount ?? b.productData.saleCount ?? 0;
      return saleB - saleA;
    });

    return sorted;
  }, [filteredAndSortedProducts, sortBy, sortDirection, urlPriceParam]);

  const updateServerFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      startTransition(() => {
        router.push(`/brands/${brand.slug}?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams, brand.slug]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [newSortBy, newDirection] = value.split("-");
      const finalDirection =
        newSortBy === "rating" ? "desc" : (newDirection as "asc" | "desc");

      setSortBy(newSortBy);
      setSortDirection(finalDirection);

      if (newSortBy === "name" && finalDirection === "asc") {
        updateServerFilters({
          sortBy: "",
          sortDirection: "",
        });
        return;
      }

      updateServerFilters({
        sortBy: newSortBy,
        sortDirection: finalDirection,
      });
    },
    [updateServerFilters]
  );

  const resetFilters = useCallback(() => {
    setSelectedCategories([]);
    setMinRating(0);
    setSortBy(initialSortBy);
    setSortDirection(initialSortDirection as "asc" | "desc");
    setDragRange(null);

    startTransition(() => {
      router.push(`/brands/${brand.slug}`, { scroll: false });
    });
  }, [router, brand.slug, initialSortBy, initialSortDirection]);

  const handleCategoryChange = useCallback(
    (catId: string, checked: boolean) => {
      const newSelected = checked
        ? [...selectedCategories, catId]
        : selectedCategories.filter((c) => c !== catId);

      setSelectedCategories(newSelected);

      const slugs = newSelected
        .map((id) => categories.find((c) => c.id === id)?.slug ?? "")
        .filter(Boolean)
        .join(",");

      updateServerFilters({ categorySlug: slugs });
    },
    [selectedCategories, categories, updateServerFilters]
  );

  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePriceChange = useCallback(
    (v: number[]) => {
      setDragRange(v as [number, number]);
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
      priceDebounceRef.current = setTimeout(() => {
        updateServerFilters({ price: `${v[0]}-${v[1]}` });
      }, 600);
    },
    [updateServerFilters]
  );

  const handleRatingChange = useCallback(
    (rating: number) => {
      setMinRating(rating);
      updateServerFilters({ minRating: rating > 0 ? String(rating) : "" });
    },
    [updateServerFilters]
  );

  const fetchMoreProducts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const query = new URLSearchParams();
      query.set("page", String(page + 1));
      query.set("pageSize", String(pageSize));
      query.set("sortBy", sortBy);
      query.set("sortDirection", sortDirection);
      query.set("isPublished", "true");
      query.set("isActive", "true");
      query.set("isDeleted", "false");
      query.set("brandId", brand.id);

      const catSlug = searchParams.get("categorySlug");
      if (catSlug) query.set("categorySlug", catSlug);

      const priceParam = searchParams.get("price");
      if (priceParam) {
        const [pMin, pMax] = priceParam.split("-");
        if (pMin) query.set("minPrice", pMin);
        if (pMax) query.set("maxPrice", pMax);
      }

      const ratingParam = searchParams.get("minRating");
      if (ratingParam) query.set("minRating", ratingParam);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${query.toString()}`
      );

      if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);

      const json = await res.json();

      setProducts((prev) => [...prev, ...json.data.items]);
      setPage(json.data.page);
      setHasMore(json.data.hasNext);
    } catch (e) {
      console.error(e);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [page, hasMore, searchParams, sortBy, sortDirection, brand.id, pageSize]);

  useEffect(() => {
    fetchCbRef.current = fetchMoreProducts;
  }, [fetchMoreProducts]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

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
  }, [hasMore, page]);

  const activeFilterCount =
    selectedCategories.length +
    (minRating > 0 ? 1 : 0) +
    (urlPriceParam ? 1 : 0);

  return (
    <div className="min-h-screen bg-white">
      {isPending && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div
            className="h-full bg-[#f38918] animate-pulse"
            style={{ width: "70%" }}
          />
        </div>
      )}

      <main className="max-w-8xl mx-auto px-8 py-4 md:py-6">
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          {/* LEFT: Breadcrumbs */}
          <nav className="flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1 flex-shrink-0">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#f38918] transition-colors truncate max-w-[80px] md:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-900 truncate max-w-[120px] md:max-w-none">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* RIGHT: Sort & Count */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">
              Showing {flattenedProducts.length} product
              {flattenedProducts.length !== 1 ? "s" : ""}
            </span>
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs md:text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f38918]"
            >
              <option value="name-asc">Default Sorting</option>
              <option value="price-asc">Sort by price: Low-High</option>
              <option value="price-desc">Sort by price: High-Low</option>
              <option value="rating-desc">Sort by: Popularity⭐</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 lg:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-[#f38918] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-2 md:px-4 py-2 border border-gray-300 rounded-lg bg-white text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f38918]"
          >
            <option value="name-asc">Default Sorting</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="rating-desc">Sort by: Popularity⭐</option>
          </select>
        </div>

        <div className="flex gap-8">
          {/* DESKTOP FILTERS */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">
            {/* FILTER HEADER */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                Filters
              </span>
              <button
                onClick={resetFilters}
                disabled={isPending || activeFilterCount === 0}
                className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Reset
              </button>
            </div>

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <details className="group border-b border-gray-200">
                <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Categories
                  </span>
                  <span className="text-gray-400 text-base leading-none group-open:hidden">
                    +
                  </span>
                  <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                    −
                  </span>
                </summary>
                <div className="pb-3 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                  {sortedCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={(e) =>
                          handleCategoryChange(cat.id, e.target.checked)
                        }
                      />
                      <span
                        className={`text-[13px] truncate transition ${selectedCategories.includes(cat.id)
                            ? "font-semibold text-black"
                            : "text-gray-600 group-hover/item:text-black"
                          }`}
                      >
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            )}

            {/* PRICE */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                  Price
                </span>
                <span className="text-gray-400 text-base leading-none group-open:hidden">
                  +
                </span>
                <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                  −
                </span>
              </summary>
              <div className="pb-4 px-2.5">
                {minPrice < maxPrice ? (
                  <PremiumPriceSlider
                    value={[
                      Math.max(displayRange[0], minPrice),
                      Math.min(displayRange[1], maxPrice),
                    ]}
                    min={minPrice}
                    max={maxPrice}
                    onChange={handlePriceChange}
                  />
                ) : (
                  <p className="text-xs text-gray-400">Loading prices…</p>
                )}
              </div>
            </details>

            {/* RATING */}
            <details className="group border-b border-gray-200">
              <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                  Rating
                </span>
                <span className="text-gray-400 text-base leading-none group-open:hidden">
                  +
                </span>
                <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                  −
                </span>
              </summary>
              <div className="pb-3 space-y-0">
                {[4, 3, 2, 1, 0].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2.5 cursor-pointer py-1.5 group/item"
                  >
                    <input
                      type="radio"
                      name="rating"
                      className="w-3.5 h-3.5 accent-black flex-shrink-0"
                      checked={minRating === rating}
                      onChange={() => handleRatingChange(rating)}
                    />
                    <div className="flex items-center gap-1.5">
                      {rating > 0 ? (
                        <>
                          <div className="flex">
                            {Array.from({ length: rating }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-[#f38918] text-[#f38918]"
                              />
                            ))}
                          </div>
                          <span
                            className={`text-[13px] transition ${minRating === rating
                                ? "font-semibold text-black"
                                : "text-gray-600"
                              }`}
                          >
                            {rating}+ Stars
                          </span>
                        </>
                      ) : (
                        <span
                          className={`text-[13px] transition ${minRating === rating
                              ? "font-semibold text-black"
                              : "text-gray-600"
                            }`}
                        >
                          All Ratings
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </details>
          </aside>

          {/* MAIN PRODUCT LIST */}
          <div className="flex-1">
            {/* ─── BRAND BANNER ─── */}
            {brand?.bannerImageUrl && (
              <div className="w-full mb-6">
                <img
                  src={brand.bannerImageUrl.startsWith("http") ? brand.bannerImageUrl : `${process.env.NEXT_PUBLIC_API_URL || ""}${brand.bannerImageUrl}`}
                  alt={`${brand.name} banner`}
                  className="w-full h-auto md:max-h-[270px] object-cover rounded shadow-md"
                  onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            )}

            {/* Mobile Filter Drawer */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                      Filters
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition disabled:opacity-40 disabled:pointer-events-none"
                        onClick={resetFilters}
                        disabled={isPending || activeFilterCount === 0}
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

                  {/* Scrollable Filters */}
                  <div className="overflow-y-auto flex-1 px-5">
                    {/* Categories */}
                    {categories.length > 0 && (
                      <details className="group border-b border-gray-200">
                        <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                            Categories
                          </span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">
                            +
                          </span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                            −
                          </span>
                        </summary>
                        <div className="pb-4 space-y-0">
                          {sortedCategories.map((cat) => (
                            <label
                              key={cat.id}
                              className="flex items-center gap-3 cursor-pointer py-2"
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                                checked={selectedCategories.includes(cat.id)}
                                onChange={(e) =>
                                  handleCategoryChange(cat.id, e.target.checked)
                                }
                              />
                              <span
                                className={`text-[13px] transition ${selectedCategories.includes(cat.id)
                                    ? "font-semibold text-black"
                                    : "text-gray-600"
                                  }`}
                              >
                                {cat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Price Range */}
                    {minPrice < maxPrice && (
                      <details className="group border-b border-gray-200">
                        <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                            Price
                          </span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">
                            +
                          </span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                            −
                          </span>
                        </summary>
                        <div className="pb-4">
                          <PremiumPriceSlider
                            value={[
                              Math.max(displayRange[0], minPrice),
                              Math.min(displayRange[1], maxPrice),
                            ]}
                            min={minPrice}
                            max={maxPrice}
                            onChange={handlePriceChange}
                          />
                        </div>
                      </details>
                    )}

                    {/* Rating */}
                    <details className="group border-b border-gray-200">
                      <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                          Rating
                        </span>
                        <span className="text-gray-400 text-base leading-none group-open:hidden">
                          +
                        </span>
                        <span className="text-gray-400 text-base leading-none hidden group-open:inline">
                          −
                        </span>
                      </summary>
                      <div className="pb-4 space-y-0">
                        {[4, 3, 2, 1, 0].map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center gap-3 cursor-pointer py-2"
                          >
                            <input
                              type="radio"
                              name="rating-mobile"
                              className="w-3.5 h-3.5 accent-black"
                              checked={minRating === rating}
                              onChange={() => handleRatingChange(rating)}
                            />
                            <div className="flex items-center gap-1.5">
                              {rating > 0 ? (
                                <>
                                  <div className="flex">
                                    {Array.from({ length: rating }).map(
                                      (_, i) => (
                                        <Star
                                          key={i}
                                          className="h-3.5 w-3.5 fill-[#f38918] text-[#f38918]"
                                        />
                                      )
                                    )}
                                  </div>
                                  <span
                                    className={`text-[13px] ${minRating === rating
                                        ? "font-semibold text-black"
                                        : "text-gray-600"
                                      }`}
                                  >
                                    {rating}+ Stars
                                  </span>
                                </>
                              ) : (
                                <span
                                  className={`text-[13px] ${minRating === rating
                                      ? "font-semibold text-black"
                                      : "text-gray-600"
                                    }`}
                                >
                                  All Ratings
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* Show Results Button */}
                  <div className="border-t px-5 py-4">
                    <button
                      className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg text-sm tracking-wide transition"
                      onClick={() => setShowFilters(false)}
                    >
                      Show Results ({flattenedProducts.length})
                    </button>
                  </div>
                </div>

                {/* Drawer Backdrop */}
                <div
                  className="flex-1 bg-black/50"
                  onClick={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* PRODUCT GRID */}
            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 z-10 bg-white/60 rounded-xl flex items-center justify-center min-h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#f38918]" />
                    <span className="text-sm text-[#f38918] font-medium">
                      Filtering...
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`grid grid-cols-2 ${gridCols === 3 ? "md:grid-cols-4" : "md:grid-cols-2"
                  } gap-2 md:gap-4 mb-6 md:mb-8 ${isPending ? "opacity-40 pointer-events-none" : ""
                  }`}
              >
                {flattenedProducts.map((item) => (
                  <ProductCard
                    key={`${item.productData.id}-${item.variantForCard?.id ?? "parent"
                      }`}
                    product={item.productData}
                    variantForCard={item.variantForCard}
                    cardSlug={item.cardSlug}
                  />
                ))}
              </div>
            </div>

            {/* Pagination / Infinite Scroll Trigger */}
            {hasMore && <div ref={loadMoreRef} />}
            {isLoadingMore && (
              <div
                className={`grid grid-cols-2 ${gridCols === 3 ? "md:grid-cols-4" : "md:grid-cols-2"
                  } gap-2 md:gap-4 mb-8`}
              >
                {Array.from({ length: gridCols === 3 ? 4 : 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white animate-pulse overflow-hidden"
                  >
                    <div className="h-44 md:h-56 bg-gray-200 rounded-t-lg" />
                    <div className="p-2 md:p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5 mb-1" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                        <div className="h-3 w-8 bg-gray-200 rounded" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-2/5" />
                      <div className="h-9 bg-gray-200 rounded-md w-full mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {flattenedProducts.length === 0 && !isPending && (
              <Card className="shadow-sm">
                <CardContent className="p-6 md:p-12 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-700 text-lg font-semibold mb-2">
                      No products found
                    </p>
                  </div>
                  <Button
                    onClick={resetFilters}
                    className="bg-[#f38918] hover:bg-black text-white"
                  >
                    Reset All Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* BRAND DESCRIPTION & FAQs */}
        {(brand?.description ||
          brand?.faqs?.filter((f: any) => f.isActive)?.length > 0) && (
            <div className="mt-10 space-y-6">
              {brand?.description && (
                <div className="bg-white border rounded-xl p-4 md:p-5 shadow-sm">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                    About {brand.name}
                  </h2>
                  <div
                    className="text-gray-600 text-sm leading-snug [&_ul]:pl-5 [&_ul]:mt-1 [&_ul]:space-y-1 [&_li]:m-0"
                    dangerouslySetInnerHTML={{ __html: brand.description }}
                  />
                </div>
              )}

              {brand?.faqs?.filter((f: any) => f.isActive)?.length > 0 && (
                <div className="bg-white border rounded-xl p-4 md:p-5 shadow-sm">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                    Frequently Asked Questions
                  </h2>
                  <div className="divide-y">
                    {brand.faqs
                      .filter((f: any) => f.isActive)
                      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                      .map((faq: any) => (
                        <details key={faq.id} className="group py-3">
                          <summary className="flex justify-between items-center cursor-pointer list-none">
                            <span className="font-medium text-gray-800 text-sm md:text-base">
                              {faq.question}
                            </span>
                            <span className="ml-4 text-gray-400 group-open:rotate-180 transition">
                              ⌄
                            </span>
                          </summary>
                          <p className="mt-2 text-gray-600 text-sm leading-relaxed">
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
