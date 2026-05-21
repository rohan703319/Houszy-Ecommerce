"use client";

import { useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { useVatRates } from "@/app/hooks/useVatRates";
import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
import { Star, SlidersHorizontal, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";

interface OffersClientProps {
  initialItems: any[];
  initialHasMore: boolean;
}

export default function OffersClient({
  initialItems,
  initialHasMore,
}: OffersClientProps) {
  const vatRates = useVatRates();

const [products, setProducts] = useState<any[]>(initialItems);
const [filteredProducts, setFilteredProducts] = useState<any[]>(initialItems);

const [sortBy, setSortBy] = useState<"name" | "price">("name");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // 🔥 STOCK CHECK (MOST IMPORTANT)
  const getStock = (item: any) => {
    if (item.variantForCard) {
      return item.variantForCard.stockQuantity ?? 0;
    }
    return item.productData?.stockQuantity ?? 0;
  };

  const stockA = getStock(a);
  const stockB = getStock(b);

  const isOutA = stockA <= 0;
  const isOutB = stockB <= 0;

  // ✅ Out of stock always last
  if (isOutA && !isOutB) return 1;
  if (!isOutA && isOutB) return -1;

  // ===== EXISTING SORT LOGIC =====

  if (sortBy === "name") {
    const nameA = (a.cardSlug ?? a.productData.name).toLowerCase();
    const nameB = (b.cardSlug ?? b.productData.name).toLowerCase();

    const comparison = nameA.localeCompare(nameB);
    return sortDirection === "asc" ? comparison : -comparison;
  }

  if (sortBy === "price") {
    const getCardPrice = (item: any) => {
      return typeof item.variantForCard?.price === "number"
        ? item.variantForCard.price
        : item.productData.price;
    };

    const comparison = getCardPrice(a) - getCardPrice(b);
    return sortDirection === "asc" ? comparison : -comparison;
  }

  return 0;
});

  return sorted;

}, [filteredProducts, sortBy, sortDirection]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);


  const [showFilters, setShowFilters] = useState(false);


  const handleSortChange = (value: string) => {
    const [by, dir] = value.split("-");
    setSortBy(by as "name" | "price");
    setSortDirection(dir as "asc" | "desc");
  };

  // Categories
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

  // Brands
  const brands = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((p) => {
      p.brands?.forEach((b: any) => {
        if (!map.has(b.brandId)) {
          map.set(b.brandId, {
            id: b.brandId,
            name: b.brandName,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [products]);

  // Price range derive
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

  // Filtering + sorting
  // Backend already guarantees all products have active discounts — no need to re-check
  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (
        selectedCategories.length &&
        !product.categories?.some((c: any) =>
          selectedCategories.includes(c.categoryId)
        )
      )
        return false;

      if (
        selectedBrands.length &&
        !product.brands?.some((b: any) =>
          selectedBrands.includes(b.brandId)
        )
      )
        return false;

      if (product.price < priceRange[0] || product.price > priceRange[1])
        return false;

      if ((product.averageRating ?? 0) < minRating) return false;

      return true;
    });

return result;
  }, [
    products,
    selectedCategories,
    selectedBrands,
    priceRange,
    minRating,
   
  ]);

  useEffect(() => {
    setFilteredProducts(filtered);
  }, [filtered]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinRating(0);
    setPriceRange([minPrice, maxPrice]);
  };

  const activeFilterCount =
    selectedCategories.length + selectedBrands.length + (minRating > 0 ? 1 : 0);

  const filterPanelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-4 px-4 pt-4 lg:px-6 lg:pt-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#445D41]" />
          <h2 className="font-bold text-base text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset All
          </button>
          {/* X close button — mobile only */}
          <button
            onClick={() => setShowFilters(false)}
            className="lg:hidden p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 lg:px-6 space-y-6 overflow-y-auto flex-1">
        {/* Category */}
        {categories.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3">Category</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#445D41]"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      } else {
                        setSelectedCategories(
                          selectedCategories.filter((c) => c !== cat.id)
                        );
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Brand */}
        {brands.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-3">Brand</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#445D41]"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBrands([...selectedBrands, brand.id]);
                      } else {
                        setSelectedBrands(
                          selectedBrands.filter((b) => b !== brand.id)
                        );
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">{brand.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-4">Price Range</h3>
          {minPrice < maxPrice && (
            <PremiumPriceSlider
              value={priceRange}
              min={minPrice}
              max={maxPrice}
              onChange={(v) => setPriceRange(v)}
            />
          )}
        </div>

        {/* Rating */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-3">
            Minimum Rating
          </h3>
          {[4, 3, 2, 1, 0].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition"
            >
              <input
                type="radio"
                className="w-4 h-4 text-[#445D41]"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
              />
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-700">
                {rating > 0 ? `${rating}+ Stars` : "All Ratings"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Show Results button — mobile only */}
      <div className="lg:hidden px-4 pb-4 pt-2 border-t mt-auto">
        <button
          onClick={() => setShowFilters(false)}
          className="w-full py-3 bg-[#445D41] text-white rounded-lg font-semibold text-sm"
        >
          Show Results ({filteredProducts.length})
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumbs */}
       <div className="hidden md:flex items-center justify-between gap-4 mb-2">

  {/* LEFT: Breadcrumb */}
  <nav className="flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-600">
    <a href="/" className="hover:text-[#445D41] transition-colors">
      Home
    </a>
    <span className="mx-2 text-gray-400">/</span>
    <span className="font-semibold text-gray-900">Offers</span>
  </nav>

  {/* RIGHT: Sort */}
  <select
    value={`${sortBy}-${sortDirection}`}
    onChange={(e) => handleSortChange(e.target.value)}
    className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
  >
    <option value="name-asc">A-Z</option>
    <option value="name-desc">Z-A</option>
    <option value="price-asc">Low-High</option>
    <option value="price-desc">High-Low</option>
  </select>

</div>

        {/* Filter + Sort bar */}
       <div className="flex items-center justify-between gap-2 mb-3 lg:hidden">
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center bg-[#445D41] text-white text-xs rounded-full w-4 h-4 leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="hidden lg:block" />
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
          >
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Mobile left-side filter drawer */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="relative bg-white w-[78vw] max-w-xs h-full flex flex-col shadow-2xl overflow-hidden">
              {filterPanelContent}
            </div>
            <div
              className="flex-1 bg-black/50"
              onClick={() => setShowFilters(false)}
            />
          </div>
        )}

        <div className="flex gap-6 lg:gap-8">
          {/* Desktop left filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto overscroll-contain pr-2 hide-scrollbar">
          <Card className="shadow-sm flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">
              {filterPanelContent}
            </CardContent>
          </Card>
          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-3 mb-8">
             {flattenedProducts.map((item) => (
  <ProductCard
    key={item.variantForCard?.id ?? item.productData.id}
    product={item.productData}
    variantForCard={item.variantForCard}
    cardSlug={item.cardSlug}
  />
))}

            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No offers found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
