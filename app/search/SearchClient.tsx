// app/search/SearchClient.tsx
"use client";

import { useState, useMemo, useTransition, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import Link from "next/link";
import { Star, SlidersHorizontal, X, Search, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";
import { getDiscountedPrice } from "@/app/lib/discountHelpers";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import ProductCard from "@/components/ProductCard";
import { trackViewItemList } from "@/lib/analytics";

// ---------- Types ----------
interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  subCategories: Category[];
  productCount?: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isPublished: boolean;
  productCount: number;
}

interface SearchClientProps {
  query: string;
  initialProducts: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  initialSortBy: string;
  initialSortDirection: string;
  brands: Brand[];
  categories: Category[];
}

export default function SearchClient({
  query,
  initialProducts,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  initialSortBy,
  initialSortDirection,
  brands,
  categories,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<any[]>(initialProducts ?? []);
  const [page, setPage] = useState(currentPage ?? 1);
  const [hasMore, setHasMore] = useState(
    totalPages ? currentPage < totalPages : true
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const fetchCbRef = useRef<() => void>(() => { });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all matching products (up to 250 items) to extract relevant category and brand filters
  const [unfilteredProducts, setUnfilteredProducts] = useState<any[]>(initialProducts ?? []);

  useEffect(() => {
    const fetchAllMatches = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Products?page=1&pageSize=250&searchTerm=${encodeURIComponent(query)}&isPublished=true&isActive=true&isDeleted=false`
        );
        const json = await res.json();
        if (json.success) {
          setUnfilteredProducts(json.data.items || []);
        }
      } catch (err) {
        console.error("Error fetching unfiltered products for aggregations:", err);
      }
    };
    if (query) {
      fetchAllMatches();
    }
  }, [query, initialProducts]);

  const [sortBy, setSortBy] = useState((initialSortBy ?? "name").toLowerCase());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (initialSortDirection as "asc" | "desc") || "asc"
  );

  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const brandsParam = searchParams.get("brands");
    if (!brandsParam) return [];
    const slugs = brandsParam.split(",").filter(Boolean);
    return brands.filter((b) => slugs.includes(b.slug)).map((b) => b.id);
  });

  // Flattened categories for checkbox state resolution and mapping
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const stack = [...cats];
    while (stack.length > 0) {
      const current = stack.pop()!;
      result.push(current);
      if (current.subCategories && current.subCategories.length > 0) {
        stack.push(...current.subCategories);
      }
    }
    return result;
  };

  const allFlatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const categoryParam = searchParams.get("categorySlug");
    if (!categoryParam) return [];
    const slugs = categoryParam.split(",").filter(Boolean);
    return allFlatCategories.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
  });

  const [minRating, setMinRating] = useState(() => {
    const ratingParam = searchParams.get("minRating");
    return ratingParam ? Number(ratingParam) : 0;
  });

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    selectedBrands.length + selectedCategories.length + (minRating > 0 ? 1 : 0);

  // Sync state with URL params on URL change
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const urlSortBy = params.get("sortBy") || initialSortBy;
    const urlSortDirection =
      (params.get("sortDirection") as "asc" | "desc") || initialSortDirection;

    setSortBy(urlSortBy.toLowerCase());
    setSortDirection(urlSortDirection);

    const brandsParam = params.get("brands");
    if (brandsParam) {
      const slugs = brandsParam.split(",").filter(Boolean);
      setSelectedBrands(brands.filter((b) => slugs.includes(b.slug)).map((b) => b.id));
    } else {
      setSelectedBrands([]);
    }

    const categoryParam = params.get("categorySlug");
    if (categoryParam) {
      const slugs = categoryParam.split(",").filter(Boolean);
      setSelectedCategories(allFlatCategories.filter((c) => slugs.includes(c.slug)).map((c) => c.id));
    } else {
      setSelectedCategories([]);
    }

    const ratingParam = params.get("minRating");
    setMinRating(ratingParam ? Number(ratingParam) : 0);
  }, [searchParamsString, initialSortBy, initialSortDirection, brands, allFlatCategories]);

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

  // Price range committed bounds
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

  // Filter display lists based on search result products (rather than listing all options in the store)
  const availableBrands = useMemo(() => {
    const brandIds = new Set<string>();
    unfilteredProducts.forEach((p) => {
      if (p.brandId) {
        brandIds.add(p.brandId);
      }
    });
    return brands.filter((b) => brandIds.has(b.id));
  }, [brands, unfilteredProducts]);

  const availableCategories = useMemo(() => {
    const catIds = new Set<string>();
    unfilteredProducts.forEach((p) => {
      p.categories?.forEach((c: any) => {
        catIds.add(c.categoryId);
      });
    });
    return allFlatCategories.filter((c) => catIds.has(c.id));
  }, [allFlatCategories, unfilteredProducts]);

  // Apply sorting and deduplication
  const flattenedProducts = useMemo(() => {
    const flat = flattenProductsForListing(products);

    // Frontend price filtering overlay
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    if (urlPriceParam) {
      const parts = urlPriceParam.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        priceMin = parts[0];
        priceMax = parts[1];
      }
    }

    const priceFiltered = (priceMin !== null && priceMax !== null)
      ? flat.filter((item: any) => {
        const rawPrice = typeof item.variantForCard?.price === "number" && item.variantForCard.price > 0
          ? item.variantForCard.price
          : item.productData.price ?? 0;
        return rawPrice >= priceMin! && rawPrice <= priceMax!;
      })
      : flat;

    // Remove duplicates
    const seen = new Set<string>();
    const unique = priceFiltered.filter((item: any) => {
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
      return getDiscountedPrice(item.productData, basePrice);
    };

    // Sorting
    const sorted = [...unique].sort((a, b) => {
      // Stock Priority
      const stockA = a.variantForCard?.stockQuantity ?? a.productData.stockQuantity ?? 0;
      const stockB = b.variantForCard?.stockQuantity ?? b.productData.stockQuantity ?? 0;

      const isOutA = stockA <= 0;
      const isOutB = stockB <= 0;

      if (isOutA !== isOutB) {
        return isOutA ? 1 : -1;
      }

      if (sortBy === "name") {
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

      return 0;
    });

    return sorted;
  }, [products, sortBy, sortDirection, urlPriceParam]);

  // Fetch more products on scroll
  const fetchMoreProducts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(page + 1));
      queryParams.set("pageSize", String(pageSize));
      queryParams.set("sortBy", sortBy);
      queryParams.set("sortDirection", sortDirection);
      queryParams.set("isPublished", "true");
      queryParams.set("isActive", "true");
      queryParams.set("isDeleted", "false");
      queryParams.set("searchTerm", query);

      const catParam = searchParams.get("categorySlug");
      if (catParam) {
        queryParams.set("categorySlug", catParam);
      }

      const brandParam = searchParams.get("brands");
      if (brandParam) {
        const slugs = brandParam.split(",").filter(Boolean);
        const ids = brands
          .filter((b) => slugs.includes(b.slug))
          .map((b) => b.id)
          .join(",");
        if (ids) {
          queryParams.set("brandIds", ids);
        }
      }

      const priceParam = searchParams.get("price");
      if (priceParam) {
        const [pMin, pMax] = priceParam.split("-");
        if (pMin) queryParams.set("minPrice", pMin);
        if (pMax) queryParams.set("maxPrice", pMax);
      }

      const ratingParam = searchParams.get("minRating");
      if (ratingParam) queryParams.set("minRating", ratingParam);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${queryParams.toString()}`
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
  }, [page, hasMore, searchParams, sortBy, sortDirection, query, brands, pageSize]);

  // Sync scroll loaders
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
  }, [hasMore]);

  // Sync products when initialProducts change
  useEffect(() => {
    setProducts(initialProducts ?? []);
    setPage(currentPage ?? 1);
    setHasMore(totalPages ? currentPage < totalPages : true);
  }, [initialProducts, currentPage, totalPages]);

  // Tracking view list on change
  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, `Search: ${query}`);
    }
  }, [products, query]);

  // URL State Updates
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

      if (query) {
        params.set("q", query);
      }

      startTransition(() => {
        router.push(`/search?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams, query]
  );

  const handleSortChange = useCallback((value: string) => {
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
  }, [updateServerFilters]);

  const resetFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMinRating(0);
    setSortBy(initialSortBy);
    setSortDirection(initialSortDirection as "asc" | "desc");
    setDragRange(null);

    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    router.push(`/search?${params.toString()}`);
  }, [router, query, initialSortBy, initialSortDirection]);

  const handleCategoryChange = useCallback((cat: Category, checked: boolean) => {
    const newSelected = checked
      ? [...selectedCategories, cat.id]
      : selectedCategories.filter((c) => c !== cat.id);

    setSelectedCategories(newSelected);

    const slugs = newSelected
      .map((id) => allFlatCategories.find((c) => c.id === id)?.slug ?? "")
      .filter(Boolean)
      .join(",");

    updateServerFilters({ categorySlug: slugs });
  }, [selectedCategories, allFlatCategories, updateServerFilters]);

  const handleBrandChange = useCallback((brandId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedBrands, brandId]
      : selectedBrands.filter((b) => b !== brandId);

    setSelectedBrands(newSelected);

    const slugs = newSelected
      .map((id) => availableBrands.find((b) => b.id === id)?.slug ?? "")
      .filter(Boolean)
      .join(",");

    updateServerFilters({ brands: slugs });
  }, [selectedBrands, availableBrands, updateServerFilters]);

  const handleRatingChange = useCallback((rating: number) => {
    setMinRating(rating);
    updateServerFilters({ minRating: rating > 0 ? String(rating) : "" });
  }, [updateServerFilters]);

  const handlePriceChange = useCallback((v: number[]) => {
    setDragRange(v as [number, number]);
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      updateServerFilters({ price: `${v[0]}-${v[1]}` });
    }, 600);
  }, [updateServerFilters]);

  const [showPharmaModal, setShowPharmaModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  // 🔒 double-submit protection
  const pharmaApprovedRef = useRef(false);

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
      <main className="max-w-8xl mx-auto px-4 md:px-8 py-4 md:py-6">
        
        {/* Topbar: Breadcrumb + Sort */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <nav className="flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-600">
            <Link href="/" className="hover:text-[#f38918] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">
              Search Results
            </span>
          </nav>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilters(true)}
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
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f38918]"
            >
              <option value="name-asc">Default Sorting</option>
              <option value="price-asc">Sort by price: Low-High</option>
              <option value="price-desc">Sort by price: High-Low</option>
              <option value="rating-desc">Sort by: Popularity⭐</option>
            </select>
          </div>
        </div>

        {/* Outer Shell Grid */}
        <div className="flex gap-8">
          
          {/* Sidebar FILTERS (DESKTOP) */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">
            
            {/* Filter Header */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Filters</span>
              <button
                onClick={resetFilters}
                disabled={isPending}
                className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition"
              >
                Reset
              </button>
            </div>

            {/* Categories checklist */}
            {categories.length > 0 && (
              <details className="group border-b border-gray-200" open>
                <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Categories</span>
                  <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                  <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                </summary>
                
                <div className="pb-3 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                  {availableCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={(e) => handleCategoryChange(cat, e.target.checked)}
                      />
                      <span className={`text-[13px] truncate transition ${selectedCategories.includes(cat.id)
                        ? "font-semibold text-black"
                        : "text-gray-600 group-hover/item:text-black"
                        }`}>
                        {cat.name}
                      </span>
                    </label>
                  ))}
                  {availableCategories.length === 0 && (
                    <div className="text-xs text-gray-400 py-2">No categories found</div>
                  )}
                </div>
              </details>
            )}

            {/* Brands checklist */}
            {availableBrands.length > 0 && (
              <details className="group border-b border-gray-200" open>
                <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brands</span>
                  <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                  <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                </summary>

                <div className="pb-3 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                  {availableBrands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={(e) => handleBrandChange(brand.id, e.target.checked)}
                      />
                      <span className={`text-[13px] truncate transition ${selectedBrands.includes(brand.id)
                        ? "font-semibold text-black"
                        : "text-gray-600 group-hover/item:text-black"
                        }`}>
                        {brand.name}
                      </span>
                    </label>
                  ))}
                  {availableBrands.length === 0 && (
                    <div className="text-xs text-gray-400 py-2">No brands found</div>
                  )}
                </div>
              </details>
            )}

            {/* Price slider */}
            <details className="group border-b border-gray-200" open>
              <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Price</span>
                <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
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

            {/* Rating Filter */}
            <details className="group border-b border-gray-200" open>
              <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Rating</span>
                <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
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
                              <Star key={i} className="h-3 w-3 fill-[#f38918] text-[#f38918]" />
                            ))}
                          </div>
                          <span className={`text-[13px] transition ${minRating === rating ? "font-semibold text-black" : "text-gray-600"
                            }`}>
                            {rating}+ Stars
                          </span>
                        </>
                      ) : (
                        <span className={`text-[13px] transition ${minRating === rating ? "font-semibold text-black" : "text-gray-600"
                          }`}>
                          All Ratings
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </details>

          </aside>

          {/* MAIN PRODUCT GRID VIEW */}
          <div className="flex-1">
            
            {/* Header / Results title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Search results for:
              <span className="text-[#f38918]"> &quot;{query}&quot;</span>
            </h1>

            {/* Mobile Drawer filter view */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl">
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Filters</span>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:text-black transition"
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

                  {/* Drawer Scrollable Content */}
                  <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
                    
                    {/* Drawer Categories */}
                    {categories.length > 0 && (
                      <details className="group border-b border-gray-200" open>
                        <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Categories</span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                        </summary>
                        
                        <div className="pb-3 max-h-52 overflow-y-auto space-y-0">
                          {availableCategories.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer py-2">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                                checked={selectedCategories.includes(cat.id)}
                                onChange={(e) => handleCategoryChange(cat, e.target.checked)}
                              />
                              <span className={`text-[13px] transition ${selectedCategories.includes(cat.id) ? "font-semibold text-black" : "text-gray-600"
                                }`}>{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Drawer Brands */}
                    {availableBrands.length > 0 && (
                      <details className="group border-b border-gray-200" open>
                        <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brands</span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                        </summary>
                        
                        <div className="pb-3 max-h-52 overflow-y-auto space-y-0">
                          {availableBrands.map((brand) => (
                            <label key={brand.id} className="flex items-center gap-3 cursor-pointer py-2">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                                checked={selectedBrands.includes(brand.id)}
                                onChange={(e) => handleBrandChange(brand.id, e.target.checked)}
                              />
                              <span className={`text-[13px] transition ${selectedBrands.includes(brand.id) ? "font-semibold text-black" : "text-gray-600"
                                }`}>{brand.name}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Drawer Price Range */}
                    {minPrice < maxPrice && (
                      <details className="group border-b border-gray-200" open>
                        <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Price</span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
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

                    {/* Drawer Rating */}
                    <details className="group border-b border-gray-200" open>
                      <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Rating</span>
                        <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                        <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                      </summary>
                      <div className="pb-4 space-y-0">
                        {[4, 3, 2, 1, 0].map((rating) => (
                          <label key={rating} className="flex items-center gap-3 cursor-pointer py-2">
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
                                    {Array.from({ length: rating }).map((_, i) => (
                                      <Star key={i} className="h-3.5 w-3.5 fill-[#f38918] text-[#f38918]" />
                                    ))}
                                  </div>
                                  <span className={`text-[13px] ${minRating === rating ? "font-semibold text-black" : "text-gray-600"
                                    }`}>
                                    {rating}+ Stars
                                  </span>
                                </>
                              ) : (
                                <span className={`text-[13px] ${minRating === rating ? "font-semibold text-black" : "text-gray-600"
                                  }`}>
                                  All Ratings
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </details>

                  </div>

                  {/* Drawer Footer Show Results Button */}
                  <div className="border-t px-5 py-4">
                    <button
                      className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg text-sm tracking-wide transition"
                      onClick={() => setShowFilters(false)}
                    >
                      Show Results ({flattenedProducts.length})
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 bg-black/50"
                  onClick={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* Grid Container */}
            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 z-10 bg-white/60 rounded-xl flex items-center justify-center min-h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#f38918]" />
                    <span className="text-sm text-[#f38918] font-medium">Filtering...</span>
                  </div>
                </div>
              )}

              {/* Grid of Product Cards */}
              <div
                className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 ${
                  isPending ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {flattenedProducts.map((item) => (
                  <ProductCard
                    key={`${item.productData.id}-${item.variantForCard?.id ?? "parent"}`}
                    product={item.productData}
                    variantForCard={item.variantForCard}
                    cardSlug={item.cardSlug}
                  />
                ))}
              </div>

              {/* No results Card */}
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
                      <p className="text-gray-500 text-sm mb-4">
                        Try modifying your filter selections or keyword.
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

            {/* Scroll Triggers / Loader Skeletals */}
            {hasMore && <div ref={loadMoreRef} />}
            {isLoadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-white animate-pulse overflow-hidden">
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

          </div>

        </div>
        
        {/* Pharma questions modal */}
        {showPharmaModal && pendingProduct && (
          <PharmaQuestionsModal
            open={showPharmaModal}
            productId={pendingProduct.product.id}
            mode="add"
            onClose={() => {
              setShowPharmaModal(false);
              setPendingProduct(null);
            }}
            onSuccess={() => {
              pharmaApprovedRef.current = true;
              setShowPharmaModal(false);
              setPendingProduct(null);
              // Wait list handles add inside ProductCard, but this keeps modal synced
              setTimeout(() => {
                pharmaApprovedRef.current = false;
              }, 0);
            }}
          />
        )}

        {/* Custom scrollbar css styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </main>
    </div>
  );
}
