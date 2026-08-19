// app/category/[slug]/CategoryClient.tsx
"use client";

import { useState, useMemo, useTransition, useEffect, useCallback, useRef, } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, useParams } from "next/navigation";

import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import Link from "next/link";
import { Star, SlidersHorizontal, X, Search, ChevronRight, Loader2, } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/toast/CustomToast";
import { getDiscountBadge, getDiscountedPrice, } from "@/app/lib/discountHelpers";
import GenderBadge from "@/components/shared/GenderBadge";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import PharmaQuestionsModal from "@/components/pharma/PharmaQuestionsModal";
import ProductCard from "@/components/ProductCard";
import { trackViewItemList } from "@/lib/analytics";

// ---------- Types ----------
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
  images: ProductImage[];
  averageRating: number;
  reviewCount: number;
  tags: string;
  vatExempt?: boolean;
  gender?: string;
  brands?: {
    brandId: string;
    brandName: string;
    isPrimary: boolean;
  }[];
  categories?: {
    categoryId: string;
    categorySlug: string;
    isPrimary: boolean;
  }[];
  disableBuyButton?: boolean;
  excludeFromLoyaltyPoints?: boolean;
  loyaltyPointsEarnable?: number;
  loyaltyPointsMessage?: string;
  shipSeparately?: boolean;
  orderMinimumQuantity?: number;
  orderMaximumQuantity?: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  productCount: number;
  subCategories: Category[];
  bannerImageUrl?: string | null;
}
type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isPublished: boolean;
  productCount: number;
}

interface CategoryClientProps {
  category: Category | null;
  // 🧭 Breadcrumbs (NEW)
  breadcrumbs: BreadcrumbItem[];
  initialProducts: Product[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  initialSortBy: string;
  initialSortDirection: string;
  brands: Brand[];
  discount?: number | null; // ✅ ADD THIS
}

// ---------- Debounce hook ----------

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ---------- Component ----------

export default function CategoryClient({
  category,
  breadcrumbs,
  initialProducts,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  initialSortBy,
  initialSortDirection,
  brands,
  discount, // ✅ ADD THIS
}: CategoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const urlSortBy = params.get("sortBy") || initialSortBy;
    const urlSortDirection =
      (params.get("sortDirection") as "asc" | "desc") ||
      initialSortDirection;

    setSortBy(urlSortBy.toLowerCase());
    setSortDirection(urlSortDirection);
  }, [searchParams.toString(), initialSortBy, initialSortDirection]);
  const routeParams = useParams();
  // ✅ Always use URL slug (not category.slug which may differ from URL)
  const urlSlug = (routeParams?.slug as string) ?? category?.slug ?? "";
  const isOfferPage = searchParams.get("offer") === "true";
  const offerDiscountIds = useMemo(
    () =>
      (searchParams.get("discountIds") || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    [searchParams]
  );
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [page, setPage] = useState(currentPage ?? 1);
  const [hasMore, setHasMore] = useState(
    totalPages ? currentPage < totalPages : true
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const fetchCbRef = useRef<() => void>(() => { });
  const [sortBy, setSortBy] = useState((initialSortBy ?? "name").toLowerCase());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialSortDirection as "asc" | "desc"
  );

  const flattenSubCategories = useCallback((cat: Category | null): Category[] => {
    if (!cat) return [];
    const result: Category[] = [];
    const stack = [...(cat.subCategories || [])];

    while (stack.length > 0) {
      const current = stack.pop()!;
      result.push(current);
      if (current.subCategories && current.subCategories.length > 0) {
        stack.push(...current.subCategories);
      }
    }

    return result;
  }, []);

  const allSubCategories = useMemo(() => flattenSubCategories(category), [category, flattenSubCategories]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const brandsParam = searchParams.get("brands");
    if (!brandsParam) return [];
    const slugs = brandsParam.split(",").filter(Boolean);
    return brands.filter(b => slugs.includes(b.slug)).map(b => b.id);
  });

  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(() => {
    const subParam = searchParams.get("subCategorySlug");
    if (!subParam) return [];
    const slugs = subParam.split(",").filter(Boolean);
    return allSubCategories.filter(s => slugs.includes(s.slug)).map(s => s.id);
  });

  const [displayBrands, setDisplayBrands] = useState<Brand[]>(() => {
    return [...brands]
      .filter(b => b.productCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  const [displaySubCategories, setDisplaySubCategories] = useState<Category[]>(() => {
    return [...allSubCategories]
      .filter(sub => sub.productCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  const [filtersLoading, setFiltersLoading] = useState(false);

  // Sync selected filters state when searchParams URL changes (handles browser Back/Forward navigation)
  useEffect(() => {
    const brandsParam = searchParams.get("brands");
    if (!brandsParam) {
      setSelectedBrands([]);
    } else {
      const slugs = brandsParam.split(",").filter(Boolean);
      const ids = brands.filter(b => slugs.includes(b.slug)).map(b => b.id);
      setSelectedBrands(ids);
    }

    const subParam = searchParams.get("subCategorySlug");
    if (!subParam) {
      setSelectedSubCategories([]);
    } else {
      const slugs = subParam.split(",").filter(Boolean);
      const ids = allSubCategories.filter(s => slugs.includes(s.slug)).map(s => s.id);
      setSelectedSubCategories(ids);
    }
  }, [searchParams, brands, allSubCategories]);

  // Fetch dynamic filter options from API whenever selections change
  useEffect(() => {
    let active = true;

    const fetchFilterOptions = async () => {
      setFiltersLoading(true);
      try {
        const query = new URLSearchParams();
        query.set("categorySlug", urlSlug);

        const subSlugs = selectedSubCategories
          .map((id) => allSubCategories.find((s) => s.id === id)?.slug ?? "")
          .filter(Boolean)
          .join(",");
        if (subSlugs) {
          query.set("subCategorySlug", subSlugs);
        }

        const brandSlugs = selectedBrands
          .map(id => brands.find(b => b.id === id)?.slug ?? "")
          .filter(Boolean)
          .join(",");
        if (brandSlugs) {
          query.set("brands", brandSlugs);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Products/filter-options?${query.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch filter options");
        const json = await res.json();

        if (json?.success && json.data && active) {
          const apiBrands: any[] = json.data.brands || [];
          const apiSubCats: any[] = json.data.subCategories || [];

          // Map and sort brands
          const updatedBrands = apiBrands.map(ab => {
            const matchedBrand = brands.find(b => b.id === ab.id);
            return {
              id: ab.id,
              name: ab.name,
              slug: ab.slug,
              logoUrl: ab.logoUrl || matchedBrand?.logoUrl || "",
              isPublished: matchedBrand?.isPublished ?? true,
              productCount: ab.productCount
            };
          }).sort((a, b) => a.name.localeCompare(b.name));

          setDisplayBrands(updatedBrands);

          // Map and sort subcategories
          const updatedSubCats = apiSubCats.map(asc => {
            const matchedSub = allSubCategories.find(s => s.id === asc.id);
            return {
              id: asc.id,
              name: asc.name,
              slug: asc.slug,
              description: matchedSub?.description || "",
              imageUrl: matchedSub?.imageUrl || "",
              isActive: matchedSub?.isActive ?? true,
              sortOrder: asc.sortOrder,
              productCount: asc.productCount,
              subCategories: matchedSub?.subCategories || []
            };
          }).sort((a, b) => a.name.localeCompare(b.name));

          setDisplaySubCategories(updatedSubCats as Category[]);
        }
      } catch (err) {
        console.error("Filter options fetch error:", err);
      } finally {
        if (active) setFiltersLoading(false);
      }
    };

    fetchFilterOptions();

    return () => {
      active = false;
    };
  }, [selectedSubCategories, selectedBrands, urlSlug, brands, allSubCategories]);

  // dragRange: local override while user is actively dragging (cleared after debounce commits)
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);

  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const availableBrands = useMemo(
    () => brands.filter((b) => b.productCount > 0),
    [brands]
  );

  // ---------- Compute slider bounds (min/max track) from all loaded products ----------
  // NOTE: priceRange (user selection) is NEVER touched here.
  // It is derived from URL on every render (see committedRange below).
  useEffect(() => {
    if (!products || products.length === 0) return;

    const flat = flattenProductsForListing(products as any);
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

    // Expand bounds only — never shrink (so slider track accommodates all products seen so far)
    setMinPrice((prev) => (prev === 0 ? newMin : Math.min(prev, newMin)));
    setMaxPrice((prev) => Math.max(prev, newMax));
  }, [products]);

  // ---------- Price range (URL is single source of truth) ----------
  // committedRange = what the server is actually filtering by (from URL)
  // dragRange = user's in-progress drag (overrides committedRange visually until debounce commits)
  const urlPriceParam = searchParams.get("price");
  const committedRange = useMemo<[number, number]>(() => {
    if (urlPriceParam && maxPrice > 0) {
      const parts = urlPriceParam.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], Math.min(parts[1], maxPrice)];
      }
    }
    return [minPrice, maxPrice]; // default: full range
  }, [urlPriceParam, minPrice, maxPrice]);

  // What the slider shows: drag in progress → dragRange, else committed URL value
  const displayRange: [number, number] = dragRange ?? committedRange;

  // ---------- Filtering + sorting ----------
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // 🔥 OFFER DISCOUNT FILTER (NON-BREAKING)
      // 🔥 OFFER / DISCOUNT FILTER (HYBRID – OPTION 3)

      // Case 1: exact discount selected (chip click)
      if (typeof discount === "number") {
        const now = new Date();

        const hasExactDiscount = (product as any).assignedDiscounts?.some(
          (d: any) =>
            d.isActive === true &&
            d.usePercentage === true &&
            d.discountPercentage === discount &&
            (!d.startDate || now >= new Date(d.startDate)) &&
            (!d.endDate || now <= new Date(d.endDate))
        );

        if (!hasExactDiscount) return false;
      }


      // Case 2: offer page → show ALL discounted products
      else if (isOfferPage) {
        const now = new Date();

        const hasValidDiscount = (product as any).assignedDiscounts?.some(
          (d: any) => {
            if (!d.isActive) return false;

            const start = d.startDate ? new Date(d.startDate) : null;
            const end = d.endDate ? new Date(d.endDate) : null;

            const started = !start || now >= start;
            const notEnded = !end || now <= end;

            if (!started || !notEnded) return false;

            // ✅ ONLY ALLOW URL DISCOUNT IDS
            if (
              offerDiscountIds.length > 0 &&
              !offerDiscountIds.includes(d.id)
            ) {
              return false;
            }

            return true;
          }
        );

        if (!hasValidDiscount) return false;
      }



      // Brand, price, rating filters are handled server-side — no client-side filter needed

      return true;
    });
    const getEffectivePrice = (product: any) => {
      const defaultVariant =
        product.variants?.find((v: any) => v.isDefault) ??
        product.variants?.[0];

      const basePrice =
        typeof defaultVariant?.price === "number" &&
          defaultVariant.price > 0
          ? defaultVariant.price
          : product.price;

      return getDiscountedPrice(product, basePrice);
    };

    return filtered;
  }, [
    products,
    selectedBrands,
    minRating,
    selectedSubCategories,
    discount,
    isOfferPage,
    offerDiscountIds,
  ]);

  const flattenedProducts = useMemo(() => {
    const flat = flattenProductsForListing(filteredAndSortedProducts);

    // Parse price range from URL — filter individual variant cards precisely
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

    // 🔥 REMOVE DUPLICATES
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

    // 🔥 SORT AFTER UNIQUE
    const sorted = [...unique].sort((a, b) => {
      // ✅ STEP 1: STOCK PRIORITY (MOST IMPORTANT)
      const stockA =
        a.variantForCard?.stockQuantity ??
        a.productData.stockQuantity ??
        0;

      const stockB =
        b.variantForCard?.stockQuantity ??
        b.productData.stockQuantity ??
        0;

      const isOutA = stockA <= 0;
      const isOutB = stockB <= 0;

      // 👉 in-stock first
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

        // ✅ always high → low
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

  // ---------- Helpers ----------

  const getMainImage = useCallback((images: ProductImage[]) => {
    const mainImage = images.find((img) => img.isMain) || images[0];
    return mainImage?.imageUrl
      ? mainImage.imageUrl.startsWith("http")
        ? mainImage.imageUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${mainImage.imageUrl}`
      : "/placeholder-product.jpg";
  }, []);

  const fetchMoreProducts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      // Build API params the same way page.tsx getProducts() does —
      // so all active filters are correctly forwarded on scroll pages.
      const query = new URLSearchParams();
      query.set("page", String(page + 1));
      query.set("pageSize", String(pageSize));
      query.set("sortBy", sortBy);
      query.set("sortDirection", sortDirection);
      query.set("isPublished", "true");
      query.set("isActive", "true");
      query.set("isDeleted", "false");
      // subCategorySlug (comma-separated) → categorySlug, else main slug
      const subSlug = searchParams.get("subCategorySlug");
      query.set("categorySlug", subSlug || urlSlug);

      // price "X-Y" → minPrice + maxPrice  (page.tsx does same conversion)
      const priceParam = searchParams.get("price");
      if (priceParam) {
        const [pMin, pMax] = priceParam.split("-");
        if (pMin) query.set("minPrice", pMin);
        if (pMax) query.set("maxPrice", pMax);
      }

      // brands: selectedBrands state already holds IDs (resolved from slugs on mount)
      if (selectedBrands.length > 0) {
        query.set("brandIds", selectedBrands.join(","));
      }

      // rating
      const ratingParam = searchParams.get("minRating");
      if (ratingParam) query.set("minRating", ratingParam);
      const discountIdsParam = searchParams.get("discountIds");

      if (discountIdsParam) {
        query.set("discountIds", discountIdsParam);
      }
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
  }, [page, hasMore, searchParams, sortBy, sortDirection, urlSlug, selectedBrands]);


  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Always keep ref pointing to latest fetchMoreProducts (no observer dep on it)
  useEffect(() => {
    fetchCbRef.current = fetchMoreProducts;
  }, [fetchMoreProducts]);

  // Observer only recreates when hasMore or page changes
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

  // Reset products whenever the server provides new initialProducts (covers both URL changes
  // and the delayed server re-render after a filter change like subcategory multi-select)
  useEffect(() => {
    setProducts(initialProducts ?? []);
    setPage(currentPage ?? 1);
    setHasMore(totalPages ? currentPage < totalPages : true);
  }, [initialProducts, currentPage, totalPages]);

  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(products, category?.name ?? "Category");
    }
  }, [products, category?.name]);


  const getDefaultVariant = (product: any, cardSlug?: string) => {
    if (product.variants?.length > 0) {
      return product.variants.find((v: any) => v.isDefault) ?? product.variants[0];
    }
    return null;
  };


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
        // same pattern as /products page
        router.push(`/category/${urlSlug}?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams, urlSlug]
  );

  const handleSortChange = useCallback((value: string) => {
    const [newSortBy, newDirection] = value.split("-");

    const finalDirection =
      newSortBy === "rating" ? "desc" : (newDirection as "asc" | "desc");

    setSortBy(newSortBy);
    setSortDirection(finalDirection);

    // ✅ DEFAULT CASE → REMOVE FROM URL
    if (newSortBy === "name" && finalDirection === "asc") {
      updateServerFilters({
        sortBy: "",
        sortDirection: "",
      });
      return;
    }

    // ✅ NORMAL CASE
    updateServerFilters({
      sortBy: newSortBy,
      sortDirection: finalDirection,
    });
  }, [updateServerFilters]);
  const [showPharmaModal, setShowPharmaModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<{
    product: any;
    cardSlug?: string;
  } | null>(null);

  // 🔒 double-submit protection
  const pharmaApprovedRef = useRef(false);
  const handlePharmaGuard = (
    product: any,
    cardSlug?: string
  ): boolean => {
    // already approved → allow
    if (pharmaApprovedRef.current) return true;

    if (product.isPharmaProduct) {
      setPendingProduct({ product, cardSlug });
      setShowPharmaModal(true);
      return false;
    }

    return true;
  };
  const getInitialQty = (product: any) => {
    return product.orderMinimumQuantity ?? 1;
  };

  const resetFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedSubCategories([]);
    setMinRating(0);
    setSortBy(initialSortBy);
    setSortDirection(initialSortDirection as "asc" | "desc");
    setDragRange(null); // clear any in-progress drag

    const params = new URLSearchParams();

    if (discount) {
      params.set("discount", String(discount));
    }

    if (isOfferPage) {
      params.set("offer", "true");

      const discountIdsParam = searchParams.get("discountIds");

      if (discountIdsParam) {
        params.set("discountIds", discountIdsParam);
      }
    }

    router.push(`/category/${urlSlug}?${params.toString()}`);
  }, [router, urlSlug, discount, isOfferPage, searchParams]);

  // Subcategory toggle — pass all selected slugs comma-separated to backend
  // Backend already supports comma-separated categorySlug (splits & OR-filters by all)
  const handleSubCategoryChange = useCallback((sub: Category, checked: boolean) => {
    const newSelected = checked
      ? [...selectedSubCategories, sub.id]
      : selectedSubCategories.filter((s) => s !== sub.id);

    setSelectedSubCategories(newSelected);

    const slugs = newSelected
      .map((id) => allSubCategories.find((s) => s.id === id)?.slug ?? "")
      .filter(Boolean)
      .join(",");

    updateServerFilters({ subCategorySlug: slugs });
  }, [selectedSubCategories, allSubCategories, updateServerFilters]);

  // Brand toggle — server-side refetch with SEO-friendly slugs in URL
  const handleBrandChange = useCallback((brandId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedBrands, brandId]
      : selectedBrands.filter((b) => b !== brandId);

    setSelectedBrands(newSelected);

    // Use brand slugs in URL (not GUIDs)
    const slugs = newSelected
      .map(id => availableBrands.find(b => b.id === id)?.slug ?? "")
      .filter(Boolean);

    updateServerFilters({ brands: slugs.join(",") });
  }, [selectedBrands, availableBrands, updateServerFilters]);

  // Price slider — local drag feedback + debounced URL commit
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePriceChange = useCallback((v: number[]) => {
    setDragRange(v as [number, number]); // immediate visual feedback
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      // clear drag override — URL will drive the slider now
      updateServerFilters({ price: `${v[0]}-${v[1]}` });
    }, 600);
  }, [updateServerFilters]);

  // Rating radio — server-side refetch
  const handleRatingChange = useCallback((rating: number) => {
    setMinRating(rating);
    updateServerFilters({ minRating: rating > 0 ? String(rating) : "" });
  }, [updateServerFilters]);

  const { addToCart, cart } = useCart();
  const handleAddToCart = useCallback(
    (product: any, cardSlug?: string) => {
      // if (product.disableBuyButton) return;

      // 🔥 PHARMA GUARD
      if (!handlePharmaGuard(product, cardSlug)) return;
      const defaultVariant: any = getDefaultVariant(product);

      const basePrice =
        typeof defaultVariant?.price === "number" && defaultVariant.price > 0
          ? defaultVariant.price
          : product.price;

      const finalPrice = getDiscountedPrice(product, basePrice);

      const imageUrl = defaultVariant?.imageUrl
        ? defaultVariant.imageUrl.startsWith("http")
          ? defaultVariant.imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${defaultVariant.imageUrl}`
        : product.images?.[0]?.imageUrl
          ? product.images[0].imageUrl.startsWith("http")
            ? product.images[0].imageUrl
            : `${process.env.NEXT_PUBLIC_API_URL}${product.images[0].imageUrl}`
          : "/placeholder-product.jpg";

      // ============================
      // ⭐ MIN / MAX / STOCK LOGIC
      // ============================
      const maxQty = (defaultVariant?.orderMaximumQuantity ?? product.orderMaximumQuantity) ?? Infinity;
      const finalQty = (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;


      const variantId = defaultVariant?.id ?? null;

      const existingCartQty = cart
        .filter(
          (c) =>
            c.productId === product.id &&
            (c.variantId ?? null) === variantId
        )
        .reduce((sum, c) => sum + (c.quantity ?? 0), 0);

      const stockQty =
        defaultVariant?.stockQuantity ?? product.stockQuantity ?? 0;

      const allowedMaxQty = Math.min(stockQty, maxQty);

      if (existingCartQty + finalQty > allowedMaxQty) {
        toast.error(`Maximum allowed quantity is ${allowedMaxQty}`);
        return;
      }
      const vatRate: number | null = (product as any).vatRate ?? null;

      // ============================
      // ⭐ ADD TO CART
      // ============================

      const hasActiveCoupon = product.assignedDiscounts?.some((d: any) => {
        if (!d.isActive) return false;
        if (!d.requiresCouponCode) return false;

        const now = new Date();
        if (d.startDate && now < new Date(d.startDate)) return false;
        if (d.endDate && now > new Date(d.endDate)) return false;

        return true;
      });

      const nextDayDeliveryEnabled = defaultVariant
        ? defaultVariant.nextDayDeliveryEnabled === true
        : !!product.nextDayDeliveryEnabled;

      const nextDayDeliveryFree = defaultVariant
        ? defaultVariant.nextDayDeliveryFree === true
        : !!product.nextDayDeliveryFree;

      const discountPercentageToShow =
        product.variants && product.variants.length > 0
          ? (defaultVariant?.discountPercentage ?? 0)
          : (product.discountPercentage ?? 0);
      const hasDiscount = discountPercentageToShow > 0 && basePrice > finalPrice;

      addToCart({
        id: `${variantId ?? product.id}-one`,
        productId: product.id,
        name: defaultVariant
          ? `${product.name} (${[
            defaultVariant.option1Value,
            defaultVariant.option2Value,
            defaultVariant.option3Value,
          ]
            .filter(Boolean)
            .join(", ")})`
          : product.name,
        price: basePrice,
        sellPrice: finalPrice,
        discountPercentage: discountPercentageToShow,
        priceBeforeDiscount: basePrice,
        finalPrice: finalPrice,
        oldPrice: hasDiscount ? basePrice : undefined,
        displayDiscountType: hasDiscount ? "OldPrice" : "None",
        discountAmount: 0,
        quantity: finalQty,
        image: imageUrl,
        sku: defaultVariant?.sku ?? product.sku,
        variantId: variantId,
        vatRate: vatRate,
        vatIncluded: vatRate !== null,

        slug: cardSlug ?? product.slug,
        variantOptions: {
          option1: defaultVariant?.option1Value ?? null,
          option2: defaultVariant?.option2Value ?? null,
          option3: defaultVariant?.option3Value ?? null,
        },
        shipSeparately: product.shipSeparately,
        nextDayDeliveryEnabled: nextDayDeliveryEnabled ?? false,
        nextDayDeliveryFree: nextDayDeliveryFree ?? false,
        sameDayDeliveryEnabled: product.sameDayDeliveryEnabled ?? false,
        productData: JSON.parse(JSON.stringify(product)),
      });

      const minOrderQty = (defaultVariant?.orderMinimumQuantity ?? product.orderMinimumQuantity) ?? 1;
      if (minOrderQty > 1) {
        toast.warning(
          `Minimum order quantity is ${minOrderQty}. Added ${finalQty} items to cart.`
        );
      }


    },
    [toast, addToCart, cart]
  );
  // ---------- JSX ----------
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

          {/* LEFT: Breadcrumb */}
          <nav className="flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1 flex-shrink-0">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                )}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#f38918] transition-colors truncate max-w-[80px] md:max-w-none">
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
              Showing {flattenedProducts.length} product{flattenedProducts.length !== 1 ? "s" : ""}
            </span>
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs md:text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f38918]"
            >
              <option value="name-asc">
                Default Sorting
              </option>
              <option value="price-asc">Sort by price: Low-High</option>
              <option value="price-desc">Sort by price: High-Low</option>
              <option value="rating-desc">Sort by: Popularity⭐</option>
            </select>
          </div>

        </div>

        {/* Filter + Sort bar — below breadcrumbs */}
        <div className="flex items-center justify-between gap-2 mb-3 lg:hidden">
          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {(selectedBrands.length > 0 || selectedSubCategories.length > 0 || minRating > 0) && (
              <span className="ml-0.5 bg-[#f38918] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {selectedBrands.length + selectedSubCategories.length + (minRating > 0 ? 1 : 0)}
              </span>
            )}
          </button>
          {/* Desktop spacer */}
          <div className="hidden lg:block" />
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-2 md:px-4 py-2 border border-gray-300 rounded-lg bg-white text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f38918]"
          >
            <option value="name-asc">
              Default Sorting
            </option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="rating-desc">Sort by: Popularity⭐</option>
          </select>
        </div>
        {/* Category header */}
        <div className="flex gap-8">

          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">

            {/* ─── FILTER HEADER ─── */}
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

            {/* ─── SUBCATEGORIES ─── */}
            {displaySubCategories.length > 0 && (
              <details className="group border-b border-gray-200">
                <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Subcategories</span>
                  <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                  <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                </summary>
                <div className="pb-3 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                  {displaySubCategories.map((sub) => (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-black transition group/item"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black flex-shrink-0"
                        checked={selectedSubCategories.includes(sub.id)}
                        onChange={(e) => handleSubCategoryChange(sub, e.target.checked)}
                      />
                      <span className={`text-[13px] truncate transition ${selectedSubCategories.includes(sub.id)
                        ? "font-semibold text-black"
                        : "text-gray-600 group-hover/item:text-black"
                        }`}>
                        {sub.name}
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            )}

            {/* ─── BRANDS ─── */}
            {displayBrands.length > 0 && (
              <details className="group border-b border-gray-200">
                <summary className="flex items-center justify-between py-3 cursor-pointer list-none select-none">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brands</span>
                  <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                  <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                </summary>
                <div className="pb-3 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                  {displayBrands.map((brand) => (
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
                </div>
              </details>
            )}

            {/* ─── PRICE ─── */}
            <details className="group border-b border-gray-200">
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

            {/* ─── RATING ─── */}
            <details className="group border-b border-gray-200">
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

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* ─── CATEGORY BANNER ─── */}
            {category?.bannerImageUrl && (
              <div className="w-full mb-6">
                <img
                  src={category.bannerImageUrl.startsWith("http") ? category.bannerImageUrl : `${process.env.NEXT_PUBLIC_API_URL || ""}${category.bannerImageUrl}`}
                  alt={`${category.name} banner`}
                  className="w-full h-auto md:max-h-[270px] object-cover rounded shadow-md"
                  onError={(e) => { (e.currentTarget as any).style.display = "none"; }}
                />
              </div>
            )}

            {/* Mobile Filter — Left Side Drawer */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                {/* Left panel */}
                <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl">

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
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable filters */}
                  <div className="overflow-y-auto flex-1 px-5">

                    {/* Subcategories */}
                    {displaySubCategories.length > 0 && (
                      <details className="group border-b border-gray-200">
                        <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Subcategories</span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                        </summary>
                        <div className="pb-4 max-h-52 overflow-y-auto pr-1 hide-scrollbar space-y-0">
                          {displaySubCategories.map((sub) => (
                            <label key={sub.id} className="flex items-center gap-3 cursor-pointer py-2">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded-sm border-gray-400 accent-black"
                                checked={selectedSubCategories.includes(sub.id)}
                                onChange={(e) => handleSubCategoryChange(sub, e.target.checked)}
                              />
                              <span className={`text-[13px] transition ${selectedSubCategories.includes(sub.id) ? "font-semibold text-black" : "text-gray-600"
                                }`}>{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Brands */}
                    {displayBrands.length > 0 && (
                      <details className="group border-b border-gray-200">
                        <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Brands</span>
                          <span className="text-gray-400 text-base leading-none group-open:hidden">+</span>
                          <span className="text-gray-400 text-base leading-none hidden group-open:inline">−</span>
                        </summary>
                        <div className="pb-4 max-h-52 overflow-y-auto space-y-0">
                          {displayBrands.map((brand) => (
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

                    {/* Price Range */}
                    {minPrice < maxPrice && (
                      <details className="group border-b border-gray-200">
                        <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
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

                    {/* Rating */}
                    <details className="group border-b border-gray-200">
                      <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
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

                  {/* Apply button */}
                  <div className="border-t px-5 py-4">
                    <button
                      className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg text-sm tracking-wide transition"
                      onClick={() => setShowFilters(false)}
                    >
                      Show Results ({filteredAndSortedProducts.length})
                    </button>
                  </div>
                </div>

                {/* Right backdrop — tap to close */}
                <div
                  className="flex-1 bg-black/50"
                  onClick={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* PRODUCT GRID */}
            <div className="relative">
              {/* Filter loading overlay */}
              {isPending && (
                <div className="absolute inset-0 z-10 bg-white/60 rounded-xl flex items-center justify-center min-h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#f38918]" />
                    <span className="text-sm text-[#f38918] font-medium">Filtering...</span>
                  </div>
                </div>
              )}
              <div
                className={`grid grid-cols-2 ${gridCols === 3 ? "md:grid-cols-4" : "md:grid-cols-2"
                  } gap-2 md:gap-4 mb-6 md:mb-8 ${isPending ? "opacity-40 pointer-events-none" : ""}`}
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
            </div>
            {/* Load more trigger + skeleton cards */}
            {hasMore && <div ref={loadMoreRef} />}
            {isLoadingMore && (
              <div className={`grid grid-cols-2 ${gridCols === 3 ? "md:grid-cols-4" : "md:grid-cols-2"} gap-2 md:gap-4 mb-8`}>
                {Array.from({ length: gridCols === 3 ? 4 : 2 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-white animate-pulse overflow-hidden">
                    {/* Image — matches h-44 md:h-56 */}
                    <div className="h-44 md:h-56 bg-gray-200 rounded-t-lg" />

                    {/* Content — matches p-2 md:p-4 */}
                    <div className="p-2 md:p-4 space-y-2">
                      {/* Title 2 lines */}
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5 mb-1" />

                      {/* Rating + badge row */}
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                        <div className="h-3 w-8 bg-gray-200 rounded" />
                      </div>

                      {/* Price */}
                      <div className="h-4 bg-gray-200 rounded w-2/5" />

                      {/* Add to Cart button */}
                      <div className="h-9 bg-gray-200 rounded-md w-full mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {filteredAndSortedProducts.length === 0 && !isPending && (
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
        {/* ================= CATEGORY DESCRIPTION + FAQ ================= */}
        {(category?.description || (category as any)?.faqs?.length > 0) && (
          <div className="mt-10 space-y-6">

            {/* 🔥 DESCRIPTION */}
            {category?.description && (
              <div className="bg-white border rounded-xl p-4 md:p-5 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                  About {category.name}
                </h2>

                <div
                  className=" text-gray-600 text-sm leading-snug [&_ul]:pl-5 [&_ul]:mt-1 [&_ul]:space-y-1 [&_li]:m-0 " dangerouslySetInnerHTML={{ __html: category.description }} />
              </div>
            )}

            {/* 🔥 FAQ */}
            {(category as any)?.faqs?.filter((f: any) => f.isActive)?.length > 0 && (
              <div className="bg-white border rounded-xl p-4 md:p-5 shadow-sm">

                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                  Frequently Asked Questions
                </h2>

                <div className="divide-y">
                  {(category as any).faqs
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
        {showPharmaModal && pendingProduct && (
          <PharmaQuestionsModal
            open={showPharmaModal}
            productId={pendingProduct.product.id}
            mode="add"
            onClose={() => {
              setShowPharmaModal(false);
              setPendingProduct(null);
            }}
            onSuccess={(messageFromBackend) => {
              // 🔒 mark approved
              pharmaApprovedRef.current = true;



              setShowPharmaModal(false);

              // 🔁 resume original add-to-cart
              handleAddToCart(
                pendingProduct.product,
                pendingProduct.cardSlug
              );

              setPendingProduct(null);

              // reset for next product
              setTimeout(() => {
                pharmaApprovedRef.current = false;
              }, 0);
            }}
          />
        )}

        {/* Custom scrollbar + dual slider CSS */}
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

         .dual-range-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 0;
  background: transparent;
  position: absolute;
  top: 2px;
  outline: none;
  z-index: 10;
}


          .dual-range-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: #f38918;
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: all;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
            position: relative;
            z-index: 3;
          }
            .dual-range-slider:last-of-type::-webkit-slider-thumb {
  z-index: 20;
}


          .dual-range-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          }

          .dual-range-slider::-webkit-slider-thumb:active {
            transform: scale(1.1);
            background: #334a2c;
          }

          .dual-range-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #f38918;
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: all;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
            position: relative;
            z-index: 3;
          }

          .dual-range-slider::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          }

          .dual-range-slider::-moz-range-thumb:active {
            transform: scale(1.1);
            background: #334a2c;
          }

          .dual-range-slider:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 4px rgba(68, 93, 65, 0.15);
          }

          .dual-range-slider:focus::-moz-range-thumb {
            box-shadow: 0 0 0 4px rgba(68, 93, 65, 0.15);
          }
        `}</style>
      </main>
    </div>
  );
}
