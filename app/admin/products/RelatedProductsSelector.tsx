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

const fetchProducts = async () => {
  setLoadingProducts(true);

  try {
    const isSearchMode = debouncedSearch.length >= 3;

    const params: any = {
      categoryId: selectedCategories[0],
      brandId: selectedBrands[0],
    };

    if (isSearchMode) {
      // 🔥 SEARCH MODE (NO PAGINATION)
      params.searchTerm = debouncedSearch;
    } else {
      // 🔥 NORMAL MODE
      params.page = page;
      params.pageSize = 250;
    }

    const res = await productsService.getAll(params);

    const items = res.data?.data?.items || [];

    setProducts(items);
    setTotalCount(res.data?.data?.totalCount || items.length);

  } catch (e) {
    console.error(e);
    setProducts([]);
    setTotalCount(0);
  } finally {
    setLoadingProducts(false);
  }
};
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

  // Toggle brand
  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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

useEffect(() => {
  fetchSelectedProducts();
}, [selectedProductIds]);
  // Get selected products
const selectedProducts = selectedProductIds
  .map(id => products.find(p => p.id === id))
  .filter(Boolean) as Product[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
          {config.title}
        </h3>
        <p className="text-sm text-slate-400 mt-2">{config.description}</p>
      </div>

      {/* Main Filter Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        
        {/* Category Filter - Right */}
        <div className="lg:col-span-1" ref={categoryRef}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            🔍 Filter by Category
          </label>
          <div className="relative">
            <input
              type="text"
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
              onClick={() => setShowCategoryDropdown(true)}
              placeholder="Select categories to filter products..."
              className="w-full px-3 py-2.5 pr-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
            />
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {selectedCategories.length > 0 && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                  {selectedCategories.length}
                </span>
              )}
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
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
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
            🔍 Filter by Brand
          </label>
          <div className="relative">
            <input
              type="text"
              value={brandSearch}
              onChange={e => setBrandSearch(e.target.value)}
              onClick={() => setShowBrandDropdown(true)}
              placeholder="Select brands to filter products..."
              className="w-full px-3 py-2.5 pr-10 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
            />
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {selectedBrands.length > 0 && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                  {selectedBrands.length}
                </span>
              )}
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
                  {brands.length > 0 ? (
                    brands.map(brand => (
                      <label
                        key={brand.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.id)}
                          onChange={() => toggleBrand(brand.id)}
                          className="rounded bg-slate-800/50 border-slate-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-900"
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

      {/* Active Filters */}
      {(selectedBrands.length > 0 || selectedCategories.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
          
          {selectedBrands.map(brandId => {
            const brand = brands.find(b => b.id === brandId);
            
            return brand ? (
              <span
                key={brandId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-lg border border-violet-500/30"
              >
                
                {brand.name}
                <button
                  type="button"
                  onClick={() => toggleBrand(brandId)}
                  className="hover:text-violet-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}

          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <span
                key={categoryId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg border border-cyan-500/30"
              >
                {category.name}
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryId)}
                  className="hover:text-cyan-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}

          <button
            type="button"
            onClick={() => {
              setSelectedBrands([]);
              setSelectedCategories([]);
            }}
            className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

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
              Clear All
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
          <p className="font-medium text-sm text-white truncate">
            {product.name}
          </p>
          <p className="text-xs text-slate-400 truncate">
            SKU: {product.sku} • £{Number(product.price).toFixed(2)}
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
