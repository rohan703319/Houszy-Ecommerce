'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Package, ShoppingCart, X, ChevronDown } from 'lucide-react';
import { getProductImage } from '../_utils/formatUtils';
import { Product, productsService } from '@/lib/services/products';
import { brandsService } from '@/lib/services/brands';
import { categoriesService } from '@/lib/services/categories';



interface RelatedProductsSelectorProps {
  type: 'related' | 'cross-sell';
  selectedProductIds: string[];
  onProductsChange: (productIds: string[]) => void;
}

export default function RelatedProductsSelector({
  type,
  selectedProductIds,
  onProductsChange
}: RelatedProductsSelectorProps) {
  const [productSearch, setProductSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
 
  const [products, setProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(false);
const [page, setPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const [brands, setBrands] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);

const [debouncedSearch, setDebouncedSearch] = useState(productSearch);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const productRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Icons and colors based on type
  const config = {
    'related': {
      icon: Package,
      title: 'Related Products',
      description: 'These products will be shown on the product details page as recommended items'
    },
    'cross-sell': {
      icon: ShoppingCart,
      title: 'Cross-sell Products',
      description: 'These products will be shown in the shopping cart as additional items'
    }
  }[type];

  const Icon = config.icon;

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(productSearch);
  }, 400);

  return () => clearTimeout(timer);
}, [productSearch]);

const fetchDropdownData = async () => {
  try {
    const [brandRes, categoryRes] = await Promise.all([
      brandsService.getAll({ includeInactive: true }),
      categoriesService.getAll({
        includeInactive: true,
        includeSubCategories: true,
      }),
    ]);

    // 🔥 brands
    const brandsData = brandRes.data?.data?.items || [];

    // 🔥 categories (FLATTEN)
    const rawCategories = categoryRes.data?.data?.items || [];

    const flatten = (cats: any[]): any[] => {
      let res: any[] = [];
      for (const c of cats) {
        res.push(c);
        if (c.subCategories?.length) {
          res = res.concat(flatten(c.subCategories));
        }
      }
      return res;
    };

    const categoriesData = flatten(rawCategories);

    setBrands(brandsData);
    setCategories(categoriesData);

  } catch (e) {
    console.error("Dropdown fetch error", e);
  }
};
useEffect(() => {
  fetchDropdownData();
}, []);
// 🔥 Replace your useEffect with this



const fetchProducts = async () => {
  setLoadingProducts(true);

  try {
    const search = debouncedSearch.trim();
    const hasSearch = search.length >= 3;

    const params: any = {
      isPublished: true,
      page: 1,
      pageSize: 250,
    };

    // ✅ single-select filters
    if (selectedCategories.length > 0) {
      params.categoryId = selectedCategories[0];
    }

    if (selectedBrands.length > 0) {
      params.brandId = selectedBrands[0];
    }

    // ✅ search + filters together
    if (hasSearch) {
      params.searchTerm = search;
    }

    console.log("🔥 API PARAMS:", params);

    const res = await productsService.getAll(params);

    const items = res.data?.data?.items || [];
    const total = res.data?.data?.totalCount || items.length;

    setProducts(items);
    setTotalCount(total);

  } catch (e) {
    console.error("❌ fetchProducts error:", e);
    setProducts([]);
    setTotalCount(0);
  } finally {
    setLoadingProducts(false);
  }
};
useEffect(() => {
  setPage(1);
}, [debouncedSearch, selectedBrands, selectedCategories]);

useEffect(() => {
  fetchProducts();
}, [debouncedSearch, selectedBrands, selectedCategories, page]);
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


// ===============================
// ✅ FIX BRAND toggleBrand
// ===============================

const toggleBrand = (brandId: string) => {
  const selected = brands.find((x) => x.id === brandId);

  setSelectedBrands((prev) =>
    prev[0] === brandId ? [] : [brandId]
  );

  setBrandSearch((prev) =>
    selectedBrands[0] === brandId
      ? ""
      : selected?.name || ""
  );

  setShowBrandDropdown(false);
};



const toggleCategory = (categoryId: string) => {
  const selected = categories.find((x) => x.id === categoryId);

  setSelectedCategories((prev) =>
    prev[0] === categoryId ? [] : [categoryId]
  );

  setCategorySearch((prev) =>
    selectedCategories[0] === categoryId
      ? ""
      : selected?.name || ""
  );

  setShowCategoryDropdown(false);
};
  // Toggle product
  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onProductsChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProductIds, productId]);
    }
  };
const fetchSelectedProducts = async () => {
  if (selectedProductIds.length === 0) return;

  try {
    const res = await Promise.all(
      selectedProductIds.map(id => productsService.getById(id))
    );

    const data = res
      .map(r => r.data?.data)
      .filter((p): p is Product => Boolean(p));

    setProducts(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      data.forEach(p => map.set(p.id, p));
      return Array.from(map.values());
    });

  } catch (e) {
    console.error("Selected products fetch error", e);
  }
};
// 🔥 Add these useMemo filters after selectedProducts

const filteredBrands = useMemo(() => {
  const search = brandSearch.trim().toLowerCase();

  if (!search) return brands;

  return brands.filter((brand) =>
    brand.name?.toLowerCase().includes(search)
  );
}, [brands, brandSearch]);

const filteredCategories = useMemo(() => {
  const search = categorySearch.trim().toLowerCase();

  if (!search) return categories;

  return categories.filter((category) =>
    category.name?.toLowerCase().includes(search)
  );
}, [categories, categorySearch]);
useEffect(() => {
  fetchSelectedProducts();
}, [selectedProductIds]);
  // Get selected products
const selectedProducts = selectedProductIds
  .map(id => products.find(p => p.id === id))
  .filter(Boolean) as Product[];

  return (
    <div className="space-y-2">
      {/* Header */}
<div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">

  {/* Left Content */}
  <div>
    <h3 className="text-lg font-semibold text-white">
      {config.title}
    </h3>

    <p className="text-sm text-slate-400 mt-1">
      {config.description}
    </p>
  </div>

  {/* Right Button */}
  {(selectedBrands.length > 0 || selectedCategories.length > 0) && (
    <button
      type="button"
      onClick={() => {
        setSelectedBrands([]);
        setSelectedCategories([]);
        setBrandSearch("");
        setCategorySearch("");
      }}
      className="mt-0.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all whitespace-nowrap"
    >
      <X className="w-3.5 h-3.5" />
      Clear Filters
    </button>
  )}

</div>
      {/* Main Filter Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        
        {/* Category Filter - Right */}
        <div className="lg:col-span-1" ref={categoryRef}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filter by Category
          </label>
          <div className="relative">
            <input
              type="text"
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
              onClick={() => setShowCategoryDropdown(true)}
              placeholder="Select category..."

className={`w-full px-3 py-2.5 pr-10 rounded-xl text-white placeholder-slate-500 transition-all cursor-pointer ${
  selectedCategories.length > 0
    ? "bg-cyan-500/10 border border-cyan-400/50 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/10"
    : "bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
}`}
            />


<div className="absolute right-3 top-3 flex items-center gap-2">
  {selectedCategories.length > 0 ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedCategories([]);
        setCategorySearch("");
      }}
      className="text-slate-400 hover:text-red-400 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  ) : null}

  <ChevronDown className="h-5 w-5 text-slate-400 pointer-events-none" />
</div>

            {/* Category Dropdown */}
            {showCategoryDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Category List */}
                <div className="max-h-64 overflow-y-auto">
         

{filteredCategories.length > 0 ? (
  filteredCategories.map((category) => (
    <label
      key={category.id}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
    >


<input
  type="radio"
  name="categoryFilter"
  checked={selectedCategories.includes(category.id)}
  onChange={() => toggleCategory(category.id)}
/>
      <span className="text-sm text-slate-300">{category.name}</span>
    </label>
  ))
) : (
  <div className="px-4 py-8 text-center text-sm text-slate-400">
    No categories found
  </div>
)}
                </div>
              </div>
            )}
          </div>
        </div>

                {/* Brand Filter - Middle */}
        <div className="lg:col-span-1" ref={brandRef}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
             Filter by Brand
          </label>
          <div className="relative">
            <input
              type="text"
              value={brandSearch}
              onChange={e => setBrandSearch(e.target.value)}
              onClick={() => setShowBrandDropdown(true)}
              placeholder="Select brands.."


className={`w-full px-3 py-2.5 pr-10 rounded-xl text-white placeholder-slate-500 transition-all cursor-pointer ${
  selectedBrands.length > 0
    ? "bg-violet-500/10 border border-violet-400/50 ring-2 ring-violet-400/30 shadow-lg shadow-violet-500/10"
    : "bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
}`}      />


<div className="absolute right-3 top-3 flex items-center gap-2">
  {selectedBrands.length > 0 ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedBrands([]);
        setBrandSearch("");
      }}
      className="text-slate-400 hover:text-red-400 transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  ) : null}

  <ChevronDown className="h-5 w-5 text-slate-400 pointer-events-none" />
</div>

            {/* Brand Dropdown */}
            {showBrandDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {brands.length} brand{brands.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBrandDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Brand List */}
                <div className="max-h-64 overflow-y-auto">

{filteredBrands.length > 0 ? (
  filteredBrands.map((brand) => (
    <label
      key={brand.id}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
    >

<input
  type="radio"
  name="brandFilter"
  checked={selectedBrands.includes(brand.id)}
  onChange={() => toggleBrand(brand.id)}
/>
      <span className="text-sm text-slate-300">{brand.name}</span>
    </label>
  ))
) : (
  <div className="px-4 py-8 text-center text-sm text-slate-400">
    No brands found
  </div>
)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selector - Left */}
        <div className="lg:col-span-1" ref={productRef}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Add {config.title}
          </label>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              onClick={() => setShowProductDropdown(true)}
              placeholder="Search products by name or SKU..."
              className="w-full px-3 py-2.5 pr-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
            />
            <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />

            {/* Product Dropdown */}
            {showProductDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {products.length} product{products.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProductDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Product List */}
                <div className="max-h-64 overflow-y-auto">

  {/* 🔥 TYPE MESSAGE */}
  {debouncedSearch && debouncedSearch.length < 3 && (
    <div className="px-4 py-4 text-sm text-slate-400 text-center">
      Type at least 3 characters...
    </div>
  )}

  {/* 🔥 LOADER */}
  {loadingProducts && (
    <div className="px-4 py-4 text-sm text-slate-400 text-center">
      Loading products...
    </div>
  )}

  {/* 🔥 LIST */}
  {!loadingProducts && debouncedSearch.length >= 3 && products.length === 0 && (
    <div className="px-4 py-4 text-sm text-slate-500 text-center">
      No products found
    </div>
  )}



  {!loadingProducts && products.map(product => {
    const imageUrl = getProductImage(product.images || []);

    return (
      <label
        key={product.id}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/50"
      >
        <input
          type="checkbox"
          checked={selectedProductIds.includes(product.id)}
          onChange={() => toggleProduct(product.id)}
        />

        {/* IMAGE */}
       <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
  <img
    src={imageUrl || "/no-image.png"}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).src = "/no-image.png";
    }}
    className="w-full h-full object-cover"
  />
</div>

        {/* INFO */}
        <div className="flex-1">
          <p className="text-sm text-white">{product.name}</p>
          <p className="text-xs text-slate-400">
            SKU: {product.sku} • £{product.price.toFixed(2)}
          </p>
        </div>
      </label>
    );
  })}
</div>
              </div>
            )}
          </div>
        </div>


      </div>


      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-300">
              Selected Products ({selectedProducts.length})
            </label>
            <button
              type="button"
              onClick={() => onProductsChange([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
            Clear Selected
            </button>
          </div>
          <div className="border border-slate-700 rounded-xl p-4 space-y-2 bg-slate-800/30 max-h-64 overflow-y-auto">
      {selectedProducts.map(product => {
  const imageUrl = getProductImage(product?.images || []);

  return (
    <div
      key={product.id}
      className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">

        {/* 🔥 IMAGE */}
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
          <img
            src={imageUrl || "/no-image.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/no-image.png";
            }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* TEXT */}
        <div className="min-w-0 flex-1">
  {/* Product Name */}
  <p className="font-semibold text-sm text-white truncate tracking-wide">
    {product.name}
  </p>

  {/* SKU + Price */}
  <p className="text-xs mt-1 flex items-center gap-2 truncate">
    
    <span className="text-slate-400">
      SKU:
    </span>

    <span className="text-slate-200 font-medium">
      {product.sku}
    </span>

    <span className="text-slate-600">•</span>

    <span className="text-emerald-400 font-semibold">
      £{Number(product.price).toFixed(2)}
    </span>

  </p>
</div>
      </div>

      <button
        type="button"
        onClick={() => toggleProduct(product.id)}
        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all flex-shrink-0 ml-2"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
})}
          </div>
        </div>
      )}

  
    </div>
  );
}
