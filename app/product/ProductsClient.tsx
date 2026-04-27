// "use client";
// import { useState, useMemo, useEffect, useCallback, useRef, useTransition, } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import ProductCard from "@/components/ProductCard";
// import PremiumPriceSlider from "@/components/filters/PremiumPriceSlider";
// import { SlidersHorizontal, Star } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { useVatRates } from "@/app/hooks/useVatRates";

// function useDebounce<T>(value: T, delay = 700): T {
//   const [debounced, setDebounced] = useState(value);

//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);

//   return debounced;
// }

// export default function ProductsClient({
//   initialProducts,
//   currentPage,
//   totalPages,
//   initialSortBy,
//   initialSortDirection,
// }: {
//   initialProducts: any[];
//   currentPage: number;
//   totalPages: number;
//   initialSortBy: string;
//   initialSortDirection: string;
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [isPending, startTransition] = useTransition();
//   const [showMobileFilters, setShowMobileFilters] = useState(false);

//   /* ---------------- SERVER STATE ---------------- */
//   const [products, setProducts] = useState(initialProducts);
//  const vatRates = useVatRates();


//   const [page, setPage] = useState(currentPage ?? 1);
//   const [hasMore, setHasMore] = useState(
//     totalPages ? page < totalPages : true
//   );
//   const [isLoadingMore, setIsLoadingMore] = useState(false);


//   /* ---------------- SORT ---------------- */
//   const [sortBy, setSortBy] = useState(initialSortBy);
//   const [sortDirection, setSortDirection] = useState<
//     "asc" | "desc"
//   >(initialSortDirection as any);

//   /* ---------------- FILTER STATE (CLIENT ONLY) ---------------- */
//   const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
//  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
// const debouncedPriceRange = useDebounce(priceRange, 400);
// const [minPrice, setMinPrice] = useState(0);
// const [maxPrice, setMaxPrice] = useState(0);
// const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
// const categories = useMemo(() => {
//   const map = new Map<string, any>();

//   products.forEach((p: any) => {
//     (p.categories ?? []).forEach((c: any) => {
//       if (!map.has(c.categoryId)) {
//         map.set(c.categoryId, c);
//       }
//     });
//   });

//   return Array.from(map.values());
// }, [products]);

//   const [minRating, setMinRating] = useState(0);
//   /* ---------------- DERIVED PRICE RANGE ---------------- */
//   const resetFilters = useCallback(() => {
//   setSelectedCategories([]);
//   setSelectedBrands([]);
//   setMinRating(0);

//   if (priceRange && minPrice < maxPrice) {
//     setPriceRange([minPrice, maxPrice]);
//   }
// }, [priceRange, minPrice, maxPrice]);
//   useEffect(() => {
//   if (!initialProducts || initialProducts.length === 0) return;

//   const prices = initialProducts.map((p) => p.price ?? 0);
//   const min = Math.floor(Math.min(...prices));
//   const max = Math.ceil(Math.max(...prices));

//   if (min < max) {
//     setMinPrice(min);
//     setMaxPrice(max);
//     setPriceRange([min, max]);
//   }
// }, [initialProducts]);
// useEffect(() => {
//   if (!debouncedPriceRange) return;

//   setProducts(initialProducts);
//   setPage(1);
//   setHasMore(true);
// }, [debouncedPriceRange, initialProducts]);


//   /* ---------------- CLIENT FILTERING ---------------- */
//   const filteredProducts = useMemo(() => {
//     return products.filter((product) => {
//       // CATEGORY FILTER
    
// if (selectedCategories.length > 0) {
//   const productCategoryIds =
//     product.categories?.map((c: any) => c.categoryId) ?? [];

//   const match = productCategoryIds.some((id: string) =>
//     selectedCategories.includes(id)
//   );

//   if (!match) return false;
// }

//       // brand
//       if (selectedBrands.length > 0) {
//         const ids =
//           product.brands?.map((b: any) => b.brandId) ?? [];
//         if (!ids.some((id: string) => selectedBrands.includes(id)))
//           return false;
//       }


//       // price
//    if (debouncedPriceRange) {
//   if (
//     product.price < debouncedPriceRange[0] ||
//     product.price > debouncedPriceRange[1]
//   ) {
//     return false;
//   }
// }

//       // rating
//       if ((product.averageRating ?? 0) < minRating) return false;

//       return true;
//     });
//   }, [products, selectedCategories, selectedBrands, debouncedPriceRange, minRating]);

// const finalProducts = useMemo(() => {
//   const list = [...filteredProducts];

//   if (sortBy === "price") {
//     list.sort((a: any, b: any) =>
//       sortDirection === "asc"
//         ? a.price - b.price
//         : b.price - a.price
//     );
//   }

//   if (sortBy === "name") {
//     list.sort((a: any, b: any) =>
//       sortDirection === "asc"
//         ? a.name.localeCompare(b.name)
//         : b.name.localeCompare(a.name)
//     );
//   }

//   return list;
// }, [filteredProducts, sortBy, sortDirection]);
// const isEmptyState =
//   finalProducts.length === 0 &&
//   (selectedCategories.length > 0 ||
//     selectedBrands.length > 0 ||
//     minRating > 0 ||
//     debouncedPriceRange !== null);

//   /* ---------------- LOAD MORE (SERVER PAGINATION) ---------------- */
//   const fetchMoreProducts = useCallback(async () => {
//     if (isLoadingMore || !hasMore) return;

//     setIsLoadingMore(true);

//     try {
//       const params = new URLSearchParams(searchParams.toString());
//       params.set("page", String(page + 1));

//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${params.toString()}`
//       );

//       const json = await res.json();

//       setProducts((prev) => {
//   const map = new Map<string, any>();

//   [...prev, ...json.data.items].forEach((p: any) => {
//     map.set(p.id, p);
//   });

//   return Array.from(map.values());
// });

//       setPage(json.data.page);
//       setHasMore(json.data.hasNext);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   }, [page, hasMore, isLoadingMore, searchParams]);

//   /* ---------------- OBSERVER ---------------- */
//   const loadMoreRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!loadMoreRef.current || !hasMore || isLoadingMore) return;

//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) fetchMoreProducts();
//       },
//       { rootMargin: "200px" }
//     );

//     observer.observe(loadMoreRef.current);
//     return () => observer.disconnect();
//   }, [fetchMoreProducts, hasMore, isLoadingMore]);

//   /* ---------------- SORT CHANGE (SERVER) ---------------- */
//   const handleSortChange = (value: string) => {
//   const [sb, sd] = value.split("-");

//   setSortBy(sb);
//   setSortDirection(sd as any);

//   // 🔥 reset client data so new order feels clean
//   setProducts(initialProducts);
//   setPage(1);
//   setHasMore(true);

//   const params = new URLSearchParams(searchParams.toString());
//   params.set("sortBy", sb);
//   params.set("sortDirection", sd);

//   startTransition(() => {
//     router.push(`/products?${params.toString()}`, {
//       scroll: false,
//     });
//   });
// };


//   /* ---------------- UI ---------------- */
//   return (
//     <main className="max-w-7xl mx-auto px-4 py-4">
//         {/* 🧭 Breadcrumbs */}
// <div className="mb-2 flex items-center justify-between gap-2">
//   {/* Breadcrumbs */}
//   <nav className="hidden md:flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-600">
//     <a href="/" className="hover:text-[#445D41] transition-colors">Home</a>
//     <span className="mx-1 text-gray-400">/</span>
//     <span className="font-semibold text-gray-900">Products</span>
//   </nav>
//   <div className="flex items-center gap-2 flex-shrink-0">
//     {/* Mobile filter button */}
//     <button
//       onClick={() => setShowMobileFilters(!showMobileFilters)}
//       className="lg:hidden flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700"
//     >
//       <SlidersHorizontal className="h-4 w-4" />
//       <span className="hidden sm:inline">Filters</span>
//     </button>
//     <select
//       value={`${sortBy}-${sortDirection}`}
//       onChange={(e) => handleSortChange(e.target.value)}
//       className="px-2 md:px-4 py-1 border border-gray-300 rounded-lg bg-white text-xs md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#445D41]"
//     >
//       <option value="name-asc">A-Z</option>
//       <option value="name-desc">Z-A</option>
//       <option value="price-asc">Low-High</option>
//       <option value="price-desc">High-Low</option>
//     </select>
//   </div>
// </div>

// {/* Mobile Filter Panel */}
// {showMobileFilters && (
//   <Card className="mb-4 shadow-sm lg:hidden">
//     <CardContent className="p-4 space-y-4">
//       <div className="flex items-center justify-between pb-2 border-b">
//         <div className="flex items-center gap-2">
//           <SlidersHorizontal className="h-4 w-4 text-[#445D41]" />
//           <h2 className="font-bold text-sm text-gray-900">Filters</h2>
//         </div>
//         <button onClick={resetFilters} className="text-xs text-blue-600">Reset</button>
//       </div>
//       {categories.length > 0 && (
//         <div>
//           <h4 className="font-semibold text-sm mb-2">Category</h4>
//           <div className="space-y-1 max-h-40 overflow-y-auto">
//             {categories.map((cat: any) => (
//               <label key={cat.categoryId} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded">
//                 <input type="checkbox" checked={selectedCategories.includes(cat.categoryId)}
//                   onChange={(e) => { const next = e.target.checked ? [...selectedCategories, cat.categoryId] : selectedCategories.filter(id => id !== cat.categoryId); setSelectedCategories(next); setProducts(initialProducts); setPage(1); setHasMore(true); }} />
//                 <span className="truncate">{cat.categoryName}</span>
//               </label>
//             ))}
//           </div>
//         </div>
//       )}
//       <div>
//         <h4 className="font-semibold text-sm mb-2">Brand</h4>
//         <div className="space-y-1 max-h-40 overflow-y-auto">
//           {Array.from(new Map(products.flatMap((p) => p.brands ?? []).map((b: any) => [b.brandId, b])).values()).map((brand: any) => (
//             <label key={brand.brandId} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded">
//               <input type="checkbox" checked={selectedBrands.includes(brand.brandId)}
//                 onChange={(e) => { const next = e.target.checked ? [...selectedBrands, brand.brandId] : selectedBrands.filter(b => b !== brand.brandId); setSelectedBrands(next); setProducts(initialProducts); setPage(1); setHasMore(true); }} />
//               <span className="truncate">{brand.brandName}</span>
//             </label>
//           ))}
//         </div>
//       </div>
//       <div>
//         <h4 className="font-semibold text-sm mb-2">Rating</h4>
//         {[4, 3, 2, 1, 0].map((r) => (
//           <label key={r} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded">
//             <input type="radio" checked={minRating === r} onChange={() => { setMinRating(r); setProducts(initialProducts); setPage(1); setHasMore(true); }} />
//             <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//             <span>{r > 0 ? `${r}+ Stars` : "All"}</span>
//           </label>
//         ))}
//       </div>
//     </CardContent>
//   </Card>
// )}

//        <div className="flex gap-8">
       
//           <aside className="hidden lg:block w-64 flex-shrink-0">
//   <div className="sticky top-24">
//  <Card className="sticky top-24 shadow-sm">
//               <CardContent className="p-6">
//     {/* HEADER + RESET */}
//     <div className="flex items-center justify-between pb-4 border-b mb-6">
//                   <div className="flex items-center gap-2">
//                     <SlidersHorizontal className="h-5 w-5 text-[#445D41]" />
//                     <h2 className="font-bold text-base text-gray-900">
//                       Filters
//                     </h2>
//                   </div>
//       <button
//         onClick={resetFilters}
//         className="text-xs text-blue-600 hover:text-blue-700"
//       >
//         Reset
//       </button>
//     </div>

//     {/* CATEGORY */}
//     {categories.length > 0 && (
//       <div>
//         <h4 className="font-semibold text-sm mb-2">Category</h4>
//         <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
//           {categories.map((cat: any) => (
//             <label
//               key={cat.categoryId}
//               className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
//             >
//               <input
//                 type="checkbox"
//                 checked={selectedCategories.includes(cat.categoryId)}
//                onChange={(e) => {
//   const next = e.target.checked
//     ? [...selectedCategories, cat.categoryId]
//     : selectedCategories.filter(id => id !== cat.categoryId);

//   setSelectedCategories(next);

//   // 🔥 RESET PAGINATION STATE
//   setProducts(initialProducts);
//   setPage(1);
//   setHasMore(true);
// }}

//               />
//               <span className="truncate">{cat.categoryName}</span>
//             </label>
//           ))}
//         </div>
//       </div>
//     )}

//     {/* BRAND */}
//     <div>
//       <h4 className="font-semibold text-sm mb-2">Brand</h4>
//       <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
//         {Array.from(
//           new Map(
//             products
//               .flatMap((p) => p.brands ?? [])
//               .map((b: any) => [b.brandId, b])
//           ).values()
//         ).map((brand: any) => (
//           <label
//             key={brand.brandId}
//             className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
//           >
//             <input
//               type="checkbox"
//               checked={selectedBrands.includes(brand.brandId)}
//              onChange={(e) => {
//   const next = e.target.checked
//     ? [...selectedBrands, brand.brandId]
//     : selectedBrands.filter(b => b !== brand.brandId);

//   setSelectedBrands(next);

//   // 🔥 RESET
//   setProducts(initialProducts);
//   setPage(1);
//   setHasMore(true);
// }}

//             />
//             <span className="truncate">{brand.brandName}</span>
//           </label>
//         ))}
//       </div>
//     </div>

//     {/* PRICE */}
//     {priceRange && minPrice < maxPrice && (
//       <div>
//         <h4 className="font-semibold text-sm mb-2">Price</h4>
//         <PremiumPriceSlider
//           min={minPrice}
//           max={maxPrice}
//           value={priceRange}
//      onChange={(v) => {
//   setPriceRange(v); // sirf local change
// }}


//         />
//       </div>
//     )}

//     {/* RATING */}
//     <div>
//       <h4 className="font-semibold text-sm mb-2">Rating</h4>
//       {[4, 3, 2, 1, 0].map((r) => (
//         <label
//           key={r}
//           className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
//         >
//           <input
//             type="radio"
//             checked={minRating === r}
//            onChange={() => {
//   setMinRating(r);
//   setProducts(initialProducts);
//   setPage(1);
//   setHasMore(true);
// }}

//           />
//            <div className="flex items-center gap-2">
//                                     <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
//                                     <span className="text-sm text-gray-700">
//           {r > 0 ? `${r}+ Stars` : "All Ratings"}
//           </span>
//           </div>
//         </label>
//       ))}
//     </div>
//      </CardContent>
//                 </Card>
//   </div>
// </aside>
// {/* PRODUCTS GRID / EMPTY STATE */}
// <div className="flex-1">
//   {isEmptyState ? (
//     <div className="flex flex-col items-center justify-center py-20 text-center border  rounded-xl bg-white">
    

//       <h3 className="text-lg font-semibold text-gray-900 mb-1">
//         No products found
//       </h3>

//       <p className="text-sm text-gray-600 max-w-md mb-5">
//         We couldn’t find any products matching your selected filters.
//         Try adjusting or clearing the filters to see more results.
//       </p>

//       <button
//         onClick={resetFilters}
//         className="px-6 py-2 rounded-lg bg-[#445D41] text-white text-sm font-semibold hover:bg-black transition"
//       >
//         Clear all filters
//       </button>
//     </div>
//   ) : (
//     <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6 items-start">
//       {finalProducts.map((product) => (
//         <ProductCard
//           key={product.id}
//           product={product}
//           vatRates={vatRates} cardSlug={""}        />
//       ))}
//     </div>
//   )}
// </div>
//       </div>
//      {hasMore && !isEmptyState && (
//   <div ref={loadMoreRef} className="py-6 text-center text-sm">
//     {isLoadingMore && "Loading more products…"}
//   </div>
// )}
//     </main>
//   );
// }
