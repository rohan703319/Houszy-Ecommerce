// components/admin/GroupedProductModal.tsx - WITH SEARCHABLE BRAND & CATEGORY FILTERS
import { brandsService, Product, productsService, SimpleProduct } from '@/lib/services';
import { categoriesService } from '@/lib/services/categories';
import { X, Package, Gift, TrendingDown, PoundSterling, Calculator, AlertCircle, Search, Filter, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

interface GroupedProductModalProps {
  isOpen: boolean;
  onClose: () => void;

  selectedGroupedProducts: string[];
  automaticallyAddProducts: boolean;
  
  mainProductPrice?: number;
  mainProductName?: string;
  
  bundleDiscountType?: 'None' | 'Percentage' | 'FixedAmount' | 'SpecialPrice';
  bundleDiscountPercentage?: number;
  bundleDiscountAmount?: number;
  bundleSpecialPrice?: number;
  bundleSavingsMessage?: string;
  showIndividualPrices?: boolean;
  applyDiscountToAllItems?: boolean;
  
  onProductsChange: (selectedProductIds: string[]) => void;
  onAutoAddChange: (checked: boolean) => void;
  
  onBundleDiscountChange: (discount: {
    type: 'None' | 'Percentage' | 'FixedAmount' | 'SpecialPrice';
    percentage?: number;
    amount?: number;
    specialPrice?: number;
    savingsMessage?: string;
  }) => void;
  
  onDisplaySettingsChange: (settings: {
    showIndividualPrices: boolean;
    applyDiscountToAllItems: boolean;
  }) => void;
}

export const GroupedProductModal = ({
  isOpen,
  onClose,
  selectedGroupedProducts,
  automaticallyAddProducts,
  mainProductPrice = 0,
  mainProductName = 'Main Product',
  bundleDiscountType = 'None',
  bundleDiscountPercentage = 0,
  bundleDiscountAmount = 0,
  bundleSpecialPrice = 0,
  bundleSavingsMessage = '',
  showIndividualPrices = true,
  applyDiscountToAllItems = false,
  onProductsChange,
  onAutoAddChange,
  onBundleDiscountChange,
  onDisplaySettingsChange
}: GroupedProductModalProps) => {
  // DISCOUNT STATE
  const [localDiscountType, setLocalDiscountType] = useState(bundleDiscountType);
  const [localPercentage, setLocalPercentage] = useState(bundleDiscountPercentage);
  const [localAmount, setLocalAmount] = useState(bundleDiscountAmount);
  const [localSpecialPrice, setLocalSpecialPrice] = useState(bundleSpecialPrice);
  const [localMessage, setLocalMessage] = useState(bundleSavingsMessage);
  const [localShowPrices, setLocalShowPrices] = useState(showIndividualPrices);
  const [localApplyToAll, setLocalApplyToAll] = useState(applyDiscountToAllItems);

  

  // ⭐⭐⭐ FILTER STATE ⭐⭐⭐
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(selectedGroupedProducts);

  // ⭐⭐⭐ SEARCHABLE DROPDOWN STATE ⭐⭐⭐
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

const [products, setProducts] = useState<Product[]>([]);
const [brands, setBrands] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);

const [loadingProducts, setLoadingProducts] = useState(false);
const [page, setPage] = useState(1);

const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);


useEffect(() => {
  const t = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 400);

  return () => clearTimeout(t);
}, [searchTerm]);

useEffect(() => {
  const fetchDropdowns = async () => {
    const [brandRes, categoryRes] = await Promise.all([
      brandsService.getAll({ includeInactive: true }),
      categoriesService.getAll({
        includeInactive: true,
        includeSubCategories: true
      })
    ]);

    const brandData = brandRes.data?.data?.items || [];

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

    setBrands(brandData);
    setCategories(flatten(rawCategories));
  };

  fetchDropdowns();
}, []);


const fetchProducts = async () => {
  setLoadingProducts(true);

  try {
    const isSearchMode = debouncedSearch.length >= 3;

    const params: any = {
      // ✅ ALWAYS APPLY
      productType: "Simple",
      isPublished: true,

      // ✅ OPTIONAL FILTERS
      brandId: selectedBrand !== "all" ? selectedBrand : undefined,
      categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
    };

    if (isSearchMode) {
      params.searchTerm = debouncedSearch;
    } else {
      params.page = page;
      params.pageSize = 250;
    }

    const res = await productsService.getAll(params);

    const items = res.data?.data?.items || [];

    setProducts(items);

  } catch (e) {
    console.error(e);
    setProducts([]);
  } finally {
    setLoadingProducts(false);
  }
};
  // VALIDATION ERRORS STATE
  const [errors, setErrors] = useState({
    percentage: '',
    amount: '',
    specialPrice: ''
  });

  useEffect(() => {
  fetchProducts();
}, [debouncedSearch, selectedBrand, selectedCategory, page]);

  useEffect(() => {
    setLocalDiscountType(bundleDiscountType);
    setLocalPercentage(bundleDiscountPercentage);
    setLocalAmount(bundleDiscountAmount);
    setLocalSpecialPrice(bundleSpecialPrice);
    setLocalMessage(bundleSavingsMessage);
    setLocalShowPrices(showIndividualPrices);
    setLocalApplyToAll(applyDiscountToAllItems);
  }, [bundleDiscountType, bundleDiscountPercentage, bundleDiscountAmount, bundleSpecialPrice, bundleSavingsMessage, showIndividualPrices, applyDiscountToAllItems]);

  useEffect(() => {
    setSelectedProducts(selectedGroupedProducts);
  }, [selectedGroupedProducts]);

  // ⭐ CLOSE DROPDOWNS ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // ⭐⭐⭐ HANDLE BRAND SELECTION ⭐⭐⭐
  const handleBrandSelect = (brandId: string, brandName: string) => {
    setSelectedBrand(brandId);
    setBrandSearchTerm(brandName);
    setShowBrandDropdown(false);
  };

  // ⭐⭐⭐ HANDLE CATEGORY SELECTION ⭐⭐⭐
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setCategorySearchTerm(categoryName);
    setShowCategoryDropdown(false);
  };

  // ⭐⭐⭐ GET DISPLAY NAMES ⭐⭐⭐
  const selectedBrandName = useMemo(() => {
    if (selectedBrand === 'all') return '';
    return brands.find(b => b.id === selectedBrand)?.name || '';
  }, [selectedBrand, brands]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return '';
    return categories.find(c => c.id === selectedCategory)?.name || '';
  }, [selectedCategory, categories]);

  // Update search terms when selection changes
  useEffect(() => {
    setBrandSearchTerm(selectedBrandName);
  }, [selectedBrandName]);

  useEffect(() => {
    setCategorySearchTerm(selectedCategoryName);
  }, [selectedCategoryName]);

  // ⭐⭐⭐ HANDLE PRODUCT SELECTION ⭐⭐⭐
  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleDeselectAll = () => {
    setSelectedProducts([]);
  };

  // CALCULATE BUNDLE PRICE
  const calculateBundlePrice = () => {
    const selected = products.filter(p => selectedProducts.includes(p.id));
    
    const bundleItemsTotal = selected.reduce((sum, p) => 
      sum + parseFloat(p.price.toString()), 0
    );
    
    let discount = 0;
    let finalBundlePrice = bundleItemsTotal;
    
    if (localDiscountType === 'Percentage' && localPercentage > 0) {
      discount = (bundleItemsTotal * localPercentage) / 100;
      finalBundlePrice = bundleItemsTotal - discount;
    } else if (localDiscountType === 'FixedAmount' && localAmount > 0) {
      discount = localAmount;
      finalBundlePrice = Math.max(0, bundleItemsTotal - localAmount);
    } else if (localDiscountType === 'SpecialPrice' && localSpecialPrice > 0) {
      discount = Math.max(0, bundleItemsTotal - localSpecialPrice);
      finalBundlePrice = localSpecialPrice;
    }
    
    const totalWithMainProduct = finalBundlePrice + mainProductPrice;
    
    return { 
      mainProductPrice,
      bundleItemsTotal,
      discount,
      finalBundlePrice,
      totalWithMainProduct,
      savingsPercentage: bundleItemsTotal > 0 ? ((discount / bundleItemsTotal) * 100) : 0,
      selectedProducts: selected
    };
  };

  const priceData = calculateBundlePrice();

  // VALIDATION
  const validateInputs = () => {
    const newErrors = {
      percentage: '',
      amount: '',
      specialPrice: ''
    };

    if (localDiscountType === 'Percentage') {
      if (!localPercentage || localPercentage === 0) {
        newErrors.percentage = 'Please enter a percentage value';
      } else if (localPercentage < 0) {
        newErrors.percentage = 'Percentage cannot be negative';
      } else if (localPercentage > 100) {
        newErrors.percentage = 'Percentage cannot exceed 100%';
      }
    }

    if (localDiscountType === 'FixedAmount') {
      if (!localAmount || localAmount === 0) {
        newErrors.amount = 'Please enter a discount amount';
      } else if (localAmount < 0) {
        newErrors.amount = 'Amount cannot be negative';
      } else if (localAmount > priceData.bundleItemsTotal) {
        newErrors.amount = `Cannot exceed bundle total (£${priceData.bundleItemsTotal.toFixed(2)})`;
      }
    }

    if (localDiscountType === 'SpecialPrice') {
      if (!localSpecialPrice || localSpecialPrice === 0) {
        newErrors.specialPrice = 'Please enter a special price';
      } else if (localSpecialPrice < 0) {
        newErrors.specialPrice = 'Price cannot be negative';
      } else if (localSpecialPrice >= priceData.bundleItemsTotal) {
        newErrors.specialPrice = `Must be less than original (£${priceData.bundleItemsTotal.toFixed(2)})`;
      }
    }

    setErrors(newErrors);
    return !newErrors.percentage && !newErrors.amount && !newErrors.specialPrice;
  };

  useEffect(() => {
    if (selectedProducts.length > 0) {
      validateInputs();
    }
  }, [localDiscountType, localPercentage, localAmount, localSpecialPrice, selectedProducts]);

  const handleSave = () => {
    if (!validateInputs()) {
      return;
    }

    onProductsChange(selectedProducts);
    
    onBundleDiscountChange({
      type: localDiscountType,
      percentage: localDiscountType === 'Percentage' ? localPercentage : undefined,
      amount: localDiscountType === 'FixedAmount' ? localAmount : undefined,
      specialPrice: localDiscountType === 'SpecialPrice' ? localSpecialPrice : undefined,
      savingsMessage: localMessage
    });
    
    onDisplaySettingsChange({
      showIndividualPrices: localShowPrices,
      applyDiscountToAllItems: localApplyToAll
    });
    
    onClose();
  };

  const hasValidationErrors = errors.percentage || errors.amount || errors.specialPrice;
  const canSave = selectedProducts.length > 0 && !hasValidationErrors;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/10 rounded-lg">
              <Package className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Configure Grouped Product</h2>
              <p className="text-xs text-slate-400">Filter and select required products with bundle pricing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* ⭐⭐⭐ FILTERS SECTION WITH SEARCHABLE DROPDOWNS ⭐⭐⭐ */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-3">
       

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div>
  <label className="block text-xs font-medium text-slate-300 mb-1.5">Search</label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search by name or SK (min 3 chars)..."
      className="w-full pl-9 pr-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
    />
  </div>

  {/* 🔥 ADD THIS */}
  {searchTerm.length > 0 && searchTerm.length < 3 && (
    <p className="mt-1 text-[11px] text-amber-400">
      Type at least 3 characters to search
    </p>
  )}
</div>

              {/* ⭐ SEARCHABLE BRAND FILTER ⭐ */}
              <div className="relative" ref={brandDropdownRef}>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Brand</label>
                <div className="relative">
                  <input
                    type="text"
                    value={brandSearchTerm}
                    onChange={(e) => {
                      setBrandSearchTerm(e.target.value);
                      setShowBrandDropdown(true);
                    }}
                    onFocus={() => setShowBrandDropdown(true)}
                    placeholder={`Search brands... (${brands.length})`}
                    className="w-full px-3 py-2 pr-8 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <ChevronDown 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  />
                </div>

                {/* Brand Dropdown */}
                {showBrandDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div
                      onClick={() => handleBrandSelect('all', '')}
                      className="px-3 py-2 text-sm text-slate-300 hover:bg-violet-500/20 cursor-pointer border-b border-slate-700"
                    >
                      All Brands ({brands.length})
                    </div>
                    {brands.length > 0 ? (
                      brands.map(brand => (
                        <div
                          key={brand.id}
                          onClick={() => handleBrandSelect(brand.id, brand.name)}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-violet-500/20 ${
                            selectedBrand === brand.id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300'
                          }`}
                        >
                          {brand.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500 italic">No brands found</div>
                    )}
                  </div>
                )}
              </div>

              {/* ⭐ SEARCHABLE CATEGORY FILTER ⭐ */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => {
                      setCategorySearchTerm(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder={`Search categories... (${categories.length})`}
                    className="w-full px-3 py-2 pr-8 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <ChevronDown 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  />
                </div>

                {/* Category Dropdown */}
                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div
                      onClick={() => handleCategorySelect('all', '')}
                      className="px-3 py-2 text-sm text-slate-300 hover:bg-violet-500/20 cursor-pointer border-b border-slate-700"
                    >
                      All Categories ({categories.length})
                    </div>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <div
                          key={category.id}
                          onClick={() => handleCategorySelect(category.id, category.name)}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-violet-500/20 ${
                            selectedCategory === category.id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300'
                          }`}
                        >
                          {category.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500 italic">No categories found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-slate-400">
                  Showing <span className="text-white font-semibold">{products.length}</span> of <span className="text-white font-semibold">{products.length}</span> products
                </p>
                {selectedBrand !== 'all' && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                    Brand: {selectedBrandName}
                    <button
                      onClick={() => {
                        setSelectedBrand('all');
                        setBrandSearchTerm('');
                      }}
                      className="ml-1 text-cyan-400 hover:text-cyan-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs">
                    Category: {selectedCategoryName}
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setCategorySearchTerm('');
                      }}
                      className="ml-1 text-violet-400 hover:text-violet-200"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={handleDeselectAll}
                disabled={selectedProducts.length === 0}
                className="px-2.5 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deselect All
              </button>
            </div>
          </div>


          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Select Required Products <span className="text-red-500">*</span>
              </label>
              {selectedProducts.length > 0 && (
                <span className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg text-xs font-semibold text-violet-300">
                  {selectedProducts.length} Selected
                </span>
              )}
            </div>

            {products.length === 0 ? (
              <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-400">No products found</p>
                <p className="text-xs text-amber-300/80 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="border border-slate-700 rounded-xl bg-slate-900/50 max-h-90 h-64 overflow-y-auto">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
           
                  
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-3 border-b border-slate-800 last:border-b-0 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-violet-500/10 hover:bg-violet-500/15' 
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleProductToggle(product.id)}
                          className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-900 text-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                        />
                        {isSelected && (
                          <Check className="absolute left-0.5 top-0.5 w-4 h-4 text-white pointer-events-none" />
                        )}
                      </div>

                      {/* Product Image */}
                      {product.images && product.images.length > 0 && (
                       <img
  src={
    product.images?.find((img: any) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    "/placeholder.png"
  }
  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
/>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate" title={product.name}>
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">SKU: {product.sku}</span>
                              {product.brandName && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-xs text-cyan-400">{product.brandName}</span>
                                </>
                              )}
                             
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-green-400">£{parseFloat(product.price.toString()).toFixed(2)}</p>
                            {product.stockQuantity !== undefined && (
                              <p className={`text-xs ${
                                product.stockQuantity > 10 
                                  ? 'text-green-400' 
                                  : product.stockQuantity > 0 
                                  ? 'text-amber-400' 
                                  : 'text-red-400'
                              }`}>
                                Stock: {product.stockQuantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Selection Message */}
            {selectedProducts.length === 0 ? (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs font-medium text-amber-300">
                    Please select at least one product to create a bundle/grouped product
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2.5 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400" />
                  <p className="text-xs font-medium text-violet-300">
                    Selected: <span className="text-white font-semibold">{selectedProducts.length}</span> product{selectedProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BUNDLE DISCOUNT SETTINGS */}
          {selectedProducts.length > 0 && (
            <div className="p-3 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 rounded-xl border border-violet-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Bundle Discount Settings</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Discount Type</label>
                  <select
                    value={localDiscountType}
                    onChange={(e) => setLocalDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="None">No Bundle Discount</option>
                    <option value="Percentage">Percentage Off (%)</option>
                    <option value="FixedAmount">Fixed Amount Off (£)</option>
                    <option value="SpecialPrice">Special Bundle Price (£)</option>
                  </select>
                </div>

                <div>
                  {localDiscountType === 'Percentage' && (
                    <>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Discount Percentage (%) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={localPercentage}
                          onChange={(e) => setLocalPercentage(parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="15"
                          className={`w-full px-3 py-2 pr-9 bg-slate-900/70 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 ${
                            errors.percentage ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-violet-500'
                          }`}
                        />
                        <TrendingDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.percentage && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.percentage}
                        </p>
                      )}
                    </>
                  )}

                  {localDiscountType === 'FixedAmount' && (
                    <>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Discount Amount (£) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={localAmount}
                          onChange={(e) => setLocalAmount(parseFloat(e.target.value) || 0)}
                          min="0"
                          max={priceData.bundleItemsTotal}
                          step="0.01"
                          placeholder="10"
                          className={`w-full px-3 py-2 pr-9 bg-slate-900/70 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 ${
                            errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-violet-500'
                          }`}
                        />
                        <PoundSterling className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.amount}
                        </p>
                      )}
                    </>
                  )}

                  {localDiscountType === 'SpecialPrice' && (
                    <>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Bundle Special Price (£) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={localSpecialPrice}
                          onChange={(e) => setLocalSpecialPrice(parseFloat(e.target.value) || 0)}
                          min="0"
                          max={priceData.bundleItemsTotal - 0.01}
                          step="0.01"
                          placeholder="50"
                          className={`w-full px-3 py-2 pr-9 bg-slate-900/70 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 ${
                            errors.specialPrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-violet-500'
                          }`}
                        />
                        <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.specialPrice && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.specialPrice}
                        </p>
                      )}
                    </>
                  )}

                  {localDiscountType === 'None' && (
                    <div className="flex items-center justify-center h-full text-xs text-slate-500 italic">
                      No discount applied
                    </div>
                  )}
                </div>
              </div>

              {localDiscountType !== 'None' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Savings Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={localMessage}
                    onChange={(e) => setLocalMessage(e.target.value)}
                    placeholder="e.g., Save 15% when you buy this bundle!"
                    maxLength={100}
                    className="w-full px-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {localMessage.length}/100 characters
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Display & Cart Settings */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-700">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">Display & Cart Settings</h3>
              
              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2 bg-slate-800/30 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={localShowPrices}
                    onChange={(e) => setLocalShowPrices(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    Display each product's price separately
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-800/30 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={localApplyToAll}
                    onChange={(e) => setLocalApplyToAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">Apply discount to all items</span>
                    <p className="text-xs text-slate-400 mt-0.5">Distribute proportionally</p>
                  </div>
                </label>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-800/30 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={automaticallyAddProducts}
                  onChange={(e) => onAutoAddChange(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                />
                <div>
                  <span className="text-xs font-medium text-slate-200">Automatically Add to Cart</span>
                  <p className="text-xs text-slate-400 mt-0.5">Auto-add required products when main product is added</p>
                </div>
              </label>
            </div>
          )}

          {/* PRICING PREVIEW */}
{selectedProducts.length > 0 && (
  <div className="border border-slate-700 rounded-xl bg-slate-900 p-3 space-y-2">
    <div className="flex justify-between items-center">
      <h4 className="text-sm font-semibold text-white">💰 Pricing Breakdown</h4>
      <span className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg text-xs font-medium text-violet-300">
        📦 Bundle Preview
      </span>
    </div>

    {/* ✅ 1. MAIN PRODUCT - TOP */}
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-slate-300 pb-2 border-b border-dashed border-slate-700">
        <span className="text-emerald-400 font-medium">
          {mainProductName}
          <span className="ml-1 text-xs font-bold text-purple-500">(Main Product)</span>
        </span>
        <span className="text-white flex items-center gap-1">
          <span className="text-green-400 font-bold">+</span>
          £{priceData.mainProductPrice.toFixed(2)}
        </span>
      </div>
    </div>

    {/* ✅ 2. BUNDLE ITEMS LIST */}
    <div className="space-y-1 text-sm">
      <div className="text-cyan-400 font-medium">Bundle Items</div>

      {priceData.selectedProducts.map((p, i) => (
        <div key={p.id} className="flex justify-between text-slate-300">
          <span className="truncate">{i + 1}. {p.name}</span>
          <span className="text-white shrink-0 ml-2">£{parseFloat(p.price.toString()).toFixed(2)}</span>
        </div>
      ))}

      {/* ✅ 3. BUNDLE ITEMS SUBTOTAL - BELOW ITEMS */}
      <div className="flex justify-between pt-2 mt-2 border-t border-dashed border-slate-700">
        <span className="text-slate-400 font-medium">Bundle Items Subtotal</span>
        <span className="text-cyan-400 font-medium">
          £{priceData.bundleItemsTotal.toFixed(2)}
        </span>
      </div>
    </div>

    {/* ✅ 4. DISCOUNT (if applicable) */}
    {priceData.discount > 0 && (
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Discount ({localDiscountType})</span>
        <span className="text-red-400 font-medium">−£{priceData.discount.toFixed(2)}</span>
      </div>
    )}

    {/* ✅ 5. FINAL BUNDLE PRICE */}
    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
      <span className="text-base font-semibold text-white">
        Final Bundle Price
      </span>
      <span className="text-xl font-bold text-green-400">
        £{priceData.totalWithMainProduct.toFixed(2)}
      </span>
    </div>

    {/* ✅ 6. SAVINGS MESSAGE */}
    {priceData.discount > 0 && (
      <div className="text-center text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md py-1.5">
        🎉 You Save £{priceData.discount.toFixed(2)} ({priceData.savingsPercentage.toFixed(1)}% off)
      </div>
    )}
  </div>
)}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasValidationErrors ? 'Fix Errors to Save' : `Save Configuration (${selectedProducts.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
