"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Gift,
  Target,
  Percent,
  Calendar,
  AlertCircle,
  Package,
  Edit,
  ChevronDown,
  Search,
  FilterX,
  Clock,
  CalendarRange,
  TrendingUp,
  Users,
  History,
  Infinity as InfinityIcon,
  X,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
} from "lucide-react";
import Select from "react-select";
import { ProductDescriptionEditor } from "../_components/SelfHostedEditor";
import { Discount, DiscountType, DiscountLimitationType, DiscountUsageHistory } from "@/lib/services/discounts";
import { Product, productsService } from "@/lib/services";
import { Category } from "@/lib/services/categories";
import { formatDate, getImageUrl, getProductImage } from "../_utils/formatUtils";
import ImagePreviewModal from "../_components/ImagePreviewModal";

// ========== INTERFACES ==========
interface SelectOption {
  value: string;
  label: string;
}

interface FormData {
  name: string;
  isActive: boolean;
  discountType: DiscountType;
  usePercentage: boolean;
  discountAmount: number;
  discountPercentage: number;
  maximumDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  requiresCouponCode: boolean;
  couponCode: string;
  isCumulative: boolean;
  discountLimitation: DiscountLimitationType;
  limitationTimes: number | null;
  maximumDiscountedQuantity: number | null;
  appliedToSubOrders: boolean;
  adminComment: string;
  assignedProductIds: string[];
  assignedCategoryIds: string[];
  assignedManufacturerIds: string[];
  desktopBannerImageUrl: string | null;
  mobileBannerImageUrl: string | null;
}

interface DiscountModalsProps {
    discounts?: Discount[]; // Add this line
    getProductDiscount: (product: any) => any;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  viewingDiscount: Discount | null;
  setViewingDiscount: (discount: Discount | null) => void;
  usageHistoryModal: boolean;
  setUsageHistoryModal: (show: boolean) => void;
  isProductSelectionModalOpen: boolean;
  setIsProductSelectionModalOpen: (show: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  editingDiscount: Discount | null;
  products: Product[];
  categories: Category[];
  productsLoading: boolean;
  categoryOptions: SelectOption[];
  brandOptions: SelectOption[];
  filteredProductOptions: SelectOption[];
  categoryFilteredProductOptions: SelectOption[];
  productCategoryFilter: string;
  setProductCategoryFilter: (filter: string) => void;
  productBrandFilter: string;
  setProductBrandFilter: (filter: string) => void;
  productSearchTerm: string;
  setProductSearchTerm: (term: string) => void;
  customSelectStyles: any;
  handleSubmit: (e: React.FormEvent) => void;
  handleDiscountTypeChange: (type: DiscountType) => void;
  resetForm: () => void;
  handleEdit: (discount: Discount) => void;
  getDiscountTypeIcon: (type: DiscountType) => string;
  getDiscountTypeLabel: (type: DiscountType) => string;
  isDiscountActive: (discount: Discount) => boolean;
  selectedDiscountHistory: Discount | null;
  usageHistory: DiscountUsageHistory[];
  loadingHistory: boolean;
  dateRangeFilter: { startDate: string; endDate: string };
  setDateRangeFilter: (filter: { startDate: string; endDate: string }) => void;
  handleViewUsageHistory?: (discount: Discount) => void;
desktopFile: File | null;
mobileFile: File | null;
setDesktopFile: (file: File | null) => void;
setMobileFile: (file: File | null) => void;
  handleUploadBannerImage: (discountId: string, file: File, type: "desktop" | "mobile") => Promise<void>;
  handleDeleteBannerImage: (discountId: string, type: "desktop" | "mobile") => Promise<void>;
}

export default function DiscountModals(props: DiscountModalsProps) {
  const {
    showModal,
    setShowModal,
    getProductDiscount,
    viewingDiscount,
    setViewingDiscount,
    usageHistoryModal,
    setUsageHistoryModal,
    isProductSelectionModalOpen,
    setIsProductSelectionModalOpen,
    formData,
    productsLoading,
    setFormData,
    editingDiscount,
    products,
    categories,
    categoryOptions,
    brandOptions,
    filteredProductOptions,
    categoryFilteredProductOptions,
    productCategoryFilter,
    setProductCategoryFilter,
    productBrandFilter,
    setProductBrandFilter,
    productSearchTerm,
    setProductSearchTerm,
    customSelectStyles,
    handleSubmit,
    handleDiscountTypeChange,
    resetForm,
    handleEdit,
    getDiscountTypeIcon,
    getDiscountTypeLabel,
    isDiscountActive,
    selectedDiscountHistory,
    usageHistory,
    loadingHistory,
    dateRangeFilter,
    setDateRangeFilter,
    handleViewUsageHistory,
    handleUploadBannerImage,
    handleDeleteBannerImage,
    desktopFile,
mobileFile,
setDesktopFile,
setMobileFile,
  } = props;

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  
  const filteredProducts = useMemo(() => {
  const seen = new Set();


  return categoryFilteredProductOptions.filter(opt => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}, [categoryFilteredProductOptions]);
  useEffect(() => {
  if (editingDiscount?.assignedProductIds) {
    const ids = editingDiscount.assignedProductIds.split(",").map(id => id.trim());

    const fetchSelected = async () => {
      try {
        const res = await Promise.all(
          ids.map(id => productsService.getById(id))
        );

      const data: Product[] = res
  .map(r => r?.data?.data)
  .filter((p): p is Product => Boolean(p));

        setSelectedProducts(data);
      } catch (e) {
        console.error("Failed to fetch selected products", e);
      }
    };

    fetchSelected();
  }
}, [editingDiscount]);

const productMap = useMemo(() => {
  const map = new Map();

  [...products, ...selectedProducts].forEach(p => {
    map.set(p.id, p);
  });

  return map;
}, [products, selectedProducts]);

const findCategoryById = (
  categories: any[],
  id: string
): any | null => {
  for (const category of categories) {

    if (String(category.id).trim() === String(id).trim()) {
      return category;
    }

    // 🔥 recursive children check
    const children =
      category.children ||
      category.subCategories ||
      category.subcategories ||
      [];

    if (children.length > 0) {
      const found = findCategoryById(children, id);

      if (found) return found;
    }
  }

  return null;
};

const checkProductConflicts = React.useCallback((productIdStr: string) => {
  const allDiscounts = (props.discounts || []) as any[];
  const product = productMap.get(productIdStr);
  
  if (!product) return { hasConflict: false, uniqueConflicts: [], isAssignedToCurrentDiscount: false };

  // // A. Check Backend Assigned Discounts
  // const otherDiscounts = Array.isArray((product as any).assignedDiscounts) 
  //   ? (product as any).assignedDiscounts.filter((d: any) => d.id !== editingDiscount?.id && d.isActive)
  //   : [];
  
  // B. Check Manual Overlaps
  const productCategoryIds = [
    (product as any).categoryId, 
    ...(((product as any).categories || []) as any[]).map((c: any) => c.categoryId || c.id).filter(Boolean)
  ].map(String);

  const manualConflicts = allDiscounts.filter((d: any) => {
    if (d.id === editingDiscount?.id || !d.isActive || d.isDeleted) return false;
    
    const now = new Date();
    if (d.startDate && new Date(d.startDate) > now) return false;
    if (d.endDate && new Date(d.endDate) < now) return false;

    if (d.discountType === "AssignedToProducts") {
      return d.assignedProductIds?.split(',').map((s: string) => s.trim()).includes(productIdStr);
    }

if (d.discountType === "AssignedToCategories") {
  const dCatIds = (d.assignedCategoryIds || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (!productCategoryIds.some(cid => dCatIds.includes(cid))) return false;

  // ✅ ADD THIS LINE
if (d.isCumulative && formData.isCumulative) return false;

  const assignedIds = (d.assignedProductIds || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (assignedIds.length > 0) {
    return assignedIds.includes(productIdStr);
  }

  return true;
}
    return false;
  });
  
  const uniqueConflicts = [ ...manualConflicts].filter((v, i, a) => 
    a.findIndex(t => t.id === v.id) === i
  );
  
  const isAssignedToCurrentDiscount = !!(editingDiscount?.id && 
    editingDiscount.assignedProductIds?.split(',').map((s: string) => s.trim()).includes(productIdStr));

  return {
    hasConflict: uniqueConflicts.length > 0,
    uniqueConflicts,
    isAssignedToCurrentDiscount
  };
}, [productMap, props.discounts, editingDiscount]);

useEffect(() => {
  if (!viewingDiscount?.assignedProductIds) return;

  const ids = viewingDiscount.assignedProductIds
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);

  const missingIds = ids.filter(id => !productMap.has(id));

  if (missingIds.length === 0) return;

  const fetchViewProducts = async () => {
    try {
      const res = await Promise.all(
        missingIds.map(id => productsService.getById(id))
      );

      const fetched: Product[] = res
        .map(r => r?.data?.data)
        .filter((p): p is Product => Boolean(p));

      setSelectedProducts(prev => {
        const map = new Map(prev.map(p => [p.id, p]));

        fetched.forEach(p => {
          map.set(p.id, p);
        });

        return Array.from(map.values());
      });

    } catch (e) {
      console.error("Failed to fetch viewing products", e);
    }
  };

  fetchViewProducts();

}, [viewingDiscount, productMap]);

const mergedOptions = useMemo(() => {
  const map = new Map();

  // current filtered API products
  products.forEach((p) => {
    const conflicts = checkProductConflicts(p.id);
    map.set(p.id, {
      value: p.id,
      label: p.name,
     isDisabled: conflicts.hasConflict && !conflicts.isAssignedToCurrentDiscount,
    });
  });

  // only keep selected items that user already selected
  selectedProducts.forEach((p) => {
    if (formData.assignedProductIds.includes(p.id)) {
      const conflicts = checkProductConflicts(p.id);
      map.set(p.id, {
        value: p.id,
        label: p.name,
        isDisabled: conflicts.hasConflict,
      });
    }
  });

  return Array.from(map.values());
}, [products, selectedProducts, formData.assignedProductIds, checkProductConflicts]);

useEffect(() => {
  const missingIds = formData.assignedProductIds.filter(
    id => !productMap.has(id)
  );

  if (missingIds.length === 0) return;

  const fetchMissing = async () => {
    try {
      const res = await Promise.all(
        missingIds.map(id => productsService.getById(id))
      );

      const newProducts: Product[] = res
        .map(r => r?.data?.data)
        .filter((p): p is Product => Boolean(p));

      setSelectedProducts(prev => {
        const map = new Map(prev.map(p => [p.id, p]));
        newProducts.forEach(p => map.set(p.id, p));
        return Array.from(map.values());
      });

    } catch (e) {
      console.error("Failed to fetch missing selected products", e);
    }
  };

  fetchMissing();
}, [formData.assignedProductIds, productMap]);
// 🔥 PREVIEW (TOP OF COMPONENT)
const desktopPreview = useMemo(() => {
  if (!desktopFile) return null;
  return URL.createObjectURL(desktopFile);
}, [desktopFile]);

const mobilePreview = useMemo(() => {
  if (!mobileFile) return null;
  return URL.createObjectURL(mobileFile);
}, [mobileFile]);

useEffect(() => {
  return () => {
    if (desktopPreview) URL.revokeObjectURL(desktopPreview);
  };
}, [desktopPreview]);

useEffect(() => {
  return () => {
    if (mobilePreview) URL.revokeObjectURL(mobilePreview);
  };
}, [mobilePreview]);

const stats = useMemo(() => {
  let conflictCount = 0;
  let availableCount = 0;

  filteredProducts.forEach(opt => {
    const conflicts = checkProductConflicts(opt.value);
    
    if (conflicts.hasConflict) conflictCount++;
    else availableCount++;
  });

  return {
    total: filteredProducts.length,
    conflictCount,
    availableCount,
    selectedCount: formData.assignedProductIds.length
  };
}, [filteredProducts, checkProductConflicts, formData.assignedProductIds.length]);

  // ========== HELPER FUNCTIONS FOR USAGE HISTORY ==========
  const getFilteredUsageHistory = () => {
    if (!dateRangeFilter.startDate && !dateRangeFilter.endDate) return usageHistory;

    return usageHistory.filter((history) => {
      const usedDate = new Date(history.usedAt);
      const startDate = dateRangeFilter.startDate ? new Date(dateRangeFilter.startDate) : null;
      const endDate = dateRangeFilter.endDate ? new Date(dateRangeFilter.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      const afterStart = !startDate || usedDate >= startDate;
      const beforeEnd = !endDate || usedDate <= endDate;

      return afterStart && beforeEnd;
    });
  };
  // Add this useEffect in DiscountModals component (around line 100)
useEffect(() => {
  if (isProductSelectionModalOpen) {
    console.log("🟢 Modal opened - Selected product IDs:", formData.assignedProductIds);
    console.log("🟢 Available products from props:", props.categoryFilteredProductOptions?.length);
    console.log("🟢 Category filtered options:", props.categoryFilteredProductOptions);
  }
}, [isProductSelectionModalOpen, formData.assignedProductIds, props.categoryFilteredProductOptions]);


// Add this in DiscountModals component (around line 100-150)
useEffect(() => {
  // When product selection modal opens, log selected products for debugging
  if (props.isProductSelectionModalOpen) {
    console.log("🟢 Modal opened - Selected product IDs:", props.formData.assignedProductIds);
    console.log("🟢 Available products:", props.categoryFilteredProductOptions.length);
  }
}, [props.isProductSelectionModalOpen, props.formData.assignedProductIds]);
  const calculateFilteredStats = () => {
    const filtered = getFilteredUsageHistory();
    if (!filtered.length) return { totalUsage: 0, totalRevenue: 0, uniqueCustomers: 0, averageDiscount: 0 };

    const totalUsage = filtered.length;
    const totalRevenue = filtered.reduce((sum, h) => sum + h.discountAmount, 0);
    const uniqueCustomers = new Set(filtered.map((h) => h.customerEmail)).size;
    const averageDiscount = totalRevenue / totalUsage;

    return { totalUsage, totalRevenue, uniqueCustomers, averageDiscount };
  };

  const setQuickDateRange = (preset: "today" | "week" | "month" | "all") => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    switch (preset) {
      case "today":
        setDateRangeFilter({
          startDate: startOfDay.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        });
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setDateRangeFilter({
          startDate: weekAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        });
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        setDateRangeFilter({
          startDate: monthAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        });
        break;
      case "all":
        setDateRangeFilter({ startDate: "", endDate: "" });
        break;
    }
  };

  const clearDateFilters = () => {
    setDateRangeFilter({ startDate: "", endDate: "" });
  };

  const hasDateFilters = dateRangeFilter.startDate || dateRangeFilter.endDate;

  const formatDiscountValue = (discount: Discount): string => {
    if (discount.usePercentage) {
      return `${discount.discountPercentage}%`;
    }
    return `£${discount.discountAmount}`;
  };

  const calculateRemainingUses = (discount: Discount): number | string => {
    if (discount.discountLimitation === 'Unlimited') return '∞';
    const used = usageHistory.length;
    const limit = discount.limitationTimes || 0;
    const remaining = limit - used;
    return remaining > 0 ? remaining : 0;
  };

  const calculateDaysUntilExpiry = (discount: Discount): number => {
    const now = new Date();
    const end = new Date(discount.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      {/* ========== ADD/EDIT DISCOUNT MODAL ========== */}
{showModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
    
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-violet-500/10">
      
      {/* ================= HEADER ================= */}
      <div className="p-4 border-b shrink-0 border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              {editingDiscount ? "Edit Discount" : "Create New Discount"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {editingDiscount ? "Update discount information" : "Add a new discount to your store"}
            </p>
          </div>

        <button
  type="button"
  onClick={() => {
    setShowModal(false);
    resetForm();
  }}
  className="
    group
    relative
    w-10 h-10
    flex items-center justify-center
    rounded-xl
    border border-slate-700/60
    bg-slate-800/60
    text-slate-400
    hover:text-white
    hover:bg-red-500/15
    hover:border-red-500/40
    active:scale-95
    transition-all duration-200
  "
>
  <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
</button>
        </div>
      </div>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

        {/* 🔥 SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-sm">1</span>
                  <span>Basic Information</span>
                </h3>
                
                <div className={`grid gap-4 ${
                  formData.discountType === "AssignedToCategories" 
                    ? "grid-cols-1 md:grid-cols-3" 
                    : "grid-cols-1 md:grid-cols-2"
                }`}>
                  
                  {/* Discount Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Name    <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter discount name"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  {/* Discount Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Type     <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={formData.discountType}
                      onChange={(e) => handleDiscountTypeChange(e.target.value as DiscountType)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    >
                      <option value="AssignedToOrderTotal">Assigned to order total</option>
                      <option value="AssignedToProducts">Assigned to products</option>
                      <option value="AssignedToCategories">Assigned to categories</option>
                      <option value="AssignedToShipping">Assigned to shipping</option>
                      <option value="UptoXPercent">Up to X% Discount</option>
                    </select>
                  </div>

                  {/* Category Selector (Third Column) */}
                  {formData.discountType === "AssignedToCategories" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Category     <span className="text-red-500">*</span>
                        <span className="text-xs text-slate-400 ml-2">Choose one category</span>
                      </label>
                      <Select
                        isClearable
                        options={categoryOptions}
                        value={categoryOptions.find(opt => 
                          formData.assignedCategoryIds.length > 0 && 
                          opt.value === formData.assignedCategoryIds[0]
                        ) || null}
                     onChange={(selectedOption) => {
  const categoryId = selectedOption?.value || "";

  setProductSearchTerm(""); // add
  setProductBrandFilter(""); // add if needed

  setFormData({
    ...formData,
    assignedCategoryIds: categoryId ? [categoryId] : [],
    assignedProductIds: [],
  });
}}
                        placeholder="Select a category..."
                        isSearchable
                        styles={customSelectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        noOptionsMessage={() => "No categories found"}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: ASSIGNMENT SETTINGS */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-sm">2</span>
                  <span>Assignment Settings</span>
                </h3>

                <div className="space-y-4">
                  
                  {/* FOR ASSIGNED TO PRODUCTS */}
                  {formData.discountType === "AssignedToProducts" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Products     <span className="text-red-500">*</span>
                        <span className="text-xs text-slate-400 ml-2">Choose which products this discount applies to</span>
                      </label>



                      {/* Select All / Clear All Controls removed from here and moved inside dropdown */}

{/* INPUT BOX TO OPEN MODAL */}
<div
  onClick={() => setIsProductSelectionModalOpen(true)}
  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-400 cursor-pointer hover:border-violet-500 transition-all flex items-center justify-between"
>
  <span>
    {formData.assignedProductIds.length > 0
      ? `${formData.assignedProductIds.length} product${formData.assignedProductIds.length !== 1 ? 's' : ''} selected`
      : 'Select products...'
    }
  </span>
  <ChevronDown className="h-5 w-5" />
</div>

<div className="flex items-center justify-between mt-2">
  <p className="text-xs text-slate-400">
    Click to view and select products
  </p>
  <p className="text-xs text-blue-400">
    {mergedOptions.length} product{mergedOptions.length !== 1 ? 's' : ''} available
  </p>
</div>

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-400">
                          {formData.assignedProductIds.length > 0
                            ? `${formData.assignedProductIds.length} product${formData.assignedProductIds.length !== 1 ? "s" : ""} selected`
                            : "No products selected"}
                        </p>
                        {(productCategoryFilter || productBrandFilter) && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductCategoryFilter("");
                              setProductBrandFilter("");
                            }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            <FilterX className="h-3 w-3" />
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FOR ASSIGNED TO CATEGORIES */}
                  {formData.discountType === "AssignedToCategories" && (
                    <>
                      {formData.assignedCategoryIds.length > 0 ? (
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Additional Products     <span className="text-red-500">*</span>
                            <span className="text-xs text-slate-400 ml-2">Select specific products from selected categories</span>
                          </label>
                          
                          {/* INPUT BOX TO OPEN MODAL */}
                          <div
                            onClick={() => setIsProductSelectionModalOpen(true)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-400 cursor-pointer hover:border-violet-500 transition-all flex items-center justify-between"
                          >
                            <span>
                              {formData.assignedProductIds.length > 0
                                ? `${formData.assignedProductIds.length} product${formData.assignedProductIds.length !== 1 ? 's' : ''} selected`
                                : 'Add products...'
                              }
                            </span>
                            <ChevronDown className="h-5 w-5" />
                          </div>

                          {/* Product Count */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-400">
                              Click to view and select products
                            </p>
                            <p className="text-xs text-blue-400">
                              {categoryFilteredProductOptions.length} product{categoryFilteredProductOptions.length !== 1 ? 's' : ''} available
                            </p>
                          </div>

                          {/* 📊 CATEGORY DISCOUNT IMPACT SUMMARY */}
                          {(() => {
                            const allDiscounts = (props.discounts || []) as any[];
                            const total = categoryFilteredProductOptions.length;
                            if (total === 0) return null;

                            if (formData.assignedProductIds.length > 0) {
                              return (
                                <div className="mt-3 bg-violet-500/10 border border-violet-500/30 rounded-xl p-3">
                                  <p className="text-violet-400 text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4 shrink-0" />
                                    Discount will apply only to <span className="font-bold mx-1">{formData.assignedProductIds.length}</span> selected product{formData.assignedProductIds.length !== 1 ? 's' : ''}, not the entire category
                                  </p>
                                </div>
                              );
                            }

                            // Compute conflicts for each product in this category
                            const conflictedProducts: { name: string; discountName: string }[] = [];
                      

                            const cleanCount = total - conflictedProducts.length;

                            if (conflictedProducts.length === 0) {
                              return (
                                <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                                  <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                                    <span className="text-base">✓</span>
                                    This discount will apply to ALL {total} products in this category
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="mt-3 space-y-2">
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                                  <p className="text-amber-400 text-sm font-semibold flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {conflictedProducts.length} product{conflictedProducts.length !== 1 ? 's' : ''} already {conflictedProducts.length === 1 ? 'has' : 'have'} an active discount:
                                  </p>
                                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                    {conflictedProducts.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs gap-2">
                                        <span className="text-slate-300 truncate">{item.name.length > 38 ? item.name.slice(0, 38) + '...' : item.name}</span>
                                        <span className="text-amber-400 font-medium shrink-0">"{item.discountName}"</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {cleanCount > 0 && (
                                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                                    <p className="text-blue-400 text-sm flex items-center gap-2">
                                      <span className="text-base">→</span>
                                      This discount will apply to the remaining <span className="font-bold mx-1">{cleanCount}</span> product{cleanCount !== 1 ? 's' : ''} in this category
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                          <p className="text-blue-400 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Select a category first to choose specific products
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Settings Checkboxes */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-white font-medium">Active</p>
                          <p className="text-slate-400 text-xs">Enable this discount</p>
                        </div>
                      </label>
                    </div>

                

                    <div>
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.appliedToSubOrders}
                          onChange={(e) => setFormData({ ...formData, appliedToSubOrders: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-white font-medium">Apply to Sub Orders</p>
                          <p className="text-slate-400 text-xs">Apply discount to sub orders as well</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Admin Comment */}
         <div className="mt-6">
  <label className="block text-sm font-medium text-slate-300 mb-2">
    Admin Comment <span className="text-red-500">*</span>
  </label>

  <ProductDescriptionEditor
    value={formData.adminComment}
    onChange={(content) =>
      setFormData({ ...formData, adminComment: content })
    }
    placeholder="Add internal notes about this discount..."
    height={250}
    maxLength={40}
  />

</div>
                </div>
              </div>

              {/* SECTION 3: DISCOUNT VALUE */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm">3</span>
                  <span>Discount Value</span>
                </h3>
                
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

  {/* Percentage */}
  <label
    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border
      ${
        formData.usePercentage
          ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40"
          : "border-slate-600 bg-slate-900/50 hover:border-violet-500"
      }`}
  >
    <input
      type="radio"
      name="discountValueType"
      checked={formData.usePercentage}
      onChange={() =>
        setFormData({ ...formData, usePercentage: true })
      }
      className="w-5 h-5 text-violet-500 focus:ring-2 focus:ring-violet-500"
    />
    <div>
      <p className="text-white font-medium">Percentage</p>
      <p className="text-slate-400 text-xs">
        Discount by percentage
      </p>
    </div>
  </label>

  {/* Fixed Amount */}
  <label
    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border
      ${
        !formData.usePercentage
          ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40"
          : "border-slate-600 bg-slate-900/50 hover:border-violet-500"
      }`}
  >
    <input
      type="radio"
      name="discountValueType"
      checked={!formData.usePercentage}
      onChange={() =>
        setFormData({ ...formData, usePercentage: false })
      }
      className="w-5 h-5 text-violet-500 focus:ring-2 focus:ring-violet-500"
    />
    <div>
      <p className="text-white font-medium">Fixed Amount</p>
      <p className="text-slate-400 text-xs">
        Discount by fixed amount
      </p>
    </div>
  </label>

</div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.usePercentage ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Discount Percentage <span className="text-red-500">*</span></label>
                      <div className="relative">
                       <input
  type="number"
  min="0"
  max="100"
  step="0.01"
  value={formData.discountPercentage}
  onChange={(e) => {
    const value = Math.min(100, Math.max(0, Number(e.target.value)));
    setFormData({ ...formData, discountPercentage: value });
  }}
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-12"

/>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Discount Amount *</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pl-12"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Discount Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maximumDiscountAmount || ''}
                        onChange={(e) => setFormData({...formData, maximumDiscountAmount: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="No limit"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Discounted Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maximumDiscountedQuantity || ''}
                      onChange={(e) => setFormData({...formData, maximumDiscountedQuantity: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="No limit"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: VALID PERIOD */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">4</span>
                  <span>Valid Period</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Date & Time     <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Date & Time     <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

<div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm">
      5
    </span>
    <span>Coupon & Combination Settings</span>
  </h3>

  {/* REQUIRE COUPON TOGGLE */}
  <div className="mb-6">
    <label className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all">
      <input
        type="checkbox"
        checked={formData.requiresCouponCode}
        onChange={(e) => {
          const checked = e.target.checked;

          setFormData({
            ...formData,
            requiresCouponCode: checked,
            couponCode: checked ? formData.couponCode : "",
            isCumulative: checked ? formData.isCumulative : false, // 🔥 force false when off
          });
        }}
        className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500"
      />
      <div>
        <p className="text-white font-medium">Requires Coupon Code</p>
        <p className="text-slate-400 text-xs">
          Customer must enter a coupon to activate this discount
        </p>
      </div>
    </label>
  </div>

  {/* ONLY SHOW WHEN COUPON IS ENABLED */}
  {formData.requiresCouponCode && (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">

      {/* LEFT: COUPON CODE */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Coupon Code     <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.couponCode}
          onChange={(e) =>
            setFormData({
              ...formData,
              couponCode: e.target.value.toUpperCase(),
            })
          }
          placeholder="ENTER-CODE"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono"
        />
      </div>

      {/* RIGHT: CUMULATIVE (Only when coupon enabled) */}
      <div>
        <label className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all h-full">
          <input
            type="checkbox"
            checked={formData.isCumulative}
            onChange={(e) =>
              setFormData({
                ...formData,
                isCumulative: e.target.checked,
              })
            }
            className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500"
          />
          <div>
            <p className="text-white font-medium">Cumulative</p>
            <p className="text-slate-400 text-xs">
              Can combine with other discounts
            </p>
          </div>
        </label>
      </div>

    </div>
  )}
</div>




              {/* SECTION 6: USAGE LIMITATIONS */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-sm">6</span>
                  <span>Usage Limitations</span>
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Limitation Type</label>
                  <select
                    value={formData.discountLimitation}
                    onChange={(e) => setFormData({...formData, discountLimitation: e.target.value as DiscountLimitationType})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  >
                    <option value="Unlimited">Unlimited</option>
                    <option value="NTimesOnly">Limited number of uses total</option>
                    <option value="NTimesPerCustomer">Limited number of uses per customer</option>
                  </select>
                </div>

                {formData.discountLimitation !== "Unlimited" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Uses *
                      <span className="text-xs text-slate-400 ml-2">
                        {formData.discountLimitation === "NTimesOnly" 
                          ? "(Total uses across all customers)"
                          : "(Uses per individual customer)"
                        }
                      </span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.limitationTimes || ''}
                      onChange={(e) => setFormData({...formData, limitationTimes: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="Enter number of uses"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

<div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-sm">🖼</span>
    <span>Banner Images</span>
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* ================= DESKTOP ================= */}
<div>
  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
    <Monitor size={16} className="text-violet-400" /> Desktop Banner
  </label>

  {desktopPreview ? (
    <div className="relative rounded-xl overflow-hidden border border-green-500 group">
      <img
        src={desktopPreview}
        className="w-full h-32 object-cover"
      />
      <p className="text-green-400 text-xs text-center mt-1">
        ✅ {desktopFile?.name}
      </p>
      {/* ✅ DELETE BUTTON - Clear selected file */}
      <button
        type="button"
        onClick={() => setDesktopFile(null)}
        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
) : formData.desktopBannerImageUrl ? (
  <div className="relative rounded-xl overflow-hidden border border-slate-600 group">
    <img
      src={`${process.env.NEXT_PUBLIC_API_URL}${formData.desktopBannerImageUrl}`}
      className="w-full h-32 object-cover"
    />

    {/* 🔥 DELETE BUTTON */}
    {editingDiscount && (
      <button
        type="button"
        onClick={() =>
          handleDeleteBannerImage(editingDiscount.id, "desktop")
        }
        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
) : (
    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all bg-slate-900/50">
      <Upload size={20} className="text-slate-400 mb-1" />
      <span className="text-xs text-slate-400">
        Click to upload desktop image
      </span>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (editingDiscount) {
            handleUploadBannerImage(editingDiscount.id, file, "desktop");
          } else {
            setDesktopFile(file);
          }
        }}
      />
    </label>
  )}
</div>

{/* ================= MOBILE ================= */}
<div>
  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
    <Smartphone size={16} className="text-cyan-400" /> Mobile Banner
  </label>

  {mobilePreview ? (
    <div className="relative rounded-xl overflow-hidden border border-green-500 group">
      <img
        src={mobilePreview}
        className="w-full h-32 object-cover"
      />
      <p className="text-green-400 text-xs text-center mt-1">
        ✅ {mobileFile?.name}
      </p>
      {/* ✅ DELETE BUTTON - Clear selected file */}
      <button
        type="button"
        onClick={() => setMobileFile(null)}
        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
) : formData.mobileBannerImageUrl ? (
  <div className="relative rounded-xl overflow-hidden border border-slate-600 group">
    <img
      src={`${process.env.NEXT_PUBLIC_API_URL}${formData.mobileBannerImageUrl}`}
      className="w-full h-32 object-cover"
    />

    {editingDiscount && (
      <button
        type="button"
        onClick={() =>
          handleDeleteBannerImage(editingDiscount.id, "mobile")
        }
        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
) : (
    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-cyan-500 transition-all bg-slate-900/50">
      <Upload size={20} className="text-slate-400 mb-1" />
      <span className="text-xs text-slate-400">
        Click to upload mobile image
      </span>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (editingDiscount) {
            handleUploadBannerImage(editingDiscount.id, file, "mobile");
          } else {
            setMobileFile(file);
          }
        }}
      />
    </label>
  )}
</div>

  </div>

  <p className="text-slate-500 text-xs mt-3">
    Recommended: Desktop 1200×400px, Mobile 600×300px
  </p>
</div>
     

        </div>

        {/* ================= FOOTER (FIXED) ================= */}
        <div className="shrink-0 bg-slate-900 border-t border-slate-700/50 px-4 py-3 flex justify-end gap-3">
          
          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 text-white rounded-xl hover:shadow-xl hover:shadow-violet-500/50 transition-all font-semibold"
          >
            {editingDiscount ? "✓ Update Discount" : "+ Create Discount"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}


{/* ========== PRODUCT SELECTION MODAL ========== */}
{isProductSelectionModalOpen && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
      
      {/* Modal Header */}
      <div className="p-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-200 text-base font-semibold">
              {formData.discountType === "AssignedToCategories" 
                ? "Choose products from the selected category" 
                : "Choose products to apply discount"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsProductSelectionModalOpen(false);
              setProductSearchTerm("");
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm"
              />
              {productsLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {formData.discountType === "AssignedToProducts" && (
              <div className="flex items-center gap-2">
                <div className="w-[260px]">
                  <Select
                    isClearable
                    options={categoryOptions}
                    value={categoryOptions.find(opt => opt.value === productCategoryFilter) || null}
                    onChange={(selectedOption) => setProductCategoryFilter(selectedOption?.value || "")}
                    placeholder="Category..."
                    isSearchable
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="w-[160px]">
                  <Select
                    isClearable
                    options={brandOptions}
                    value={brandOptions.find(opt => opt.value === productBrandFilter) || null}
                    onChange={(selectedOption) => setProductBrandFilter(selectedOption?.value || "")}
                    placeholder="Brand..."
                    isSearchable
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
            )}

            {(productSearchTerm || productCategoryFilter || productBrandFilter) && (
              <button
                type="button"
                onClick={() => {
                  setProductSearchTerm("");
                  setProductCategoryFilter("");
                  setProductBrandFilter("");
                }}
                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                title="Clear all filters"
              >
                <FilterX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    const availableOptions = filteredProducts.filter(opt => {
                      const conflicts = checkProductConflicts(opt.value);
                      return !(conflicts.hasConflict && !conflicts.isAssignedToCurrentDiscount);
                    });
                    const availableIds = availableOptions.map(opt => opt.value);
                    const isAllSelected = availableIds.length > 0 && availableIds.every((id: string) => formData.assignedProductIds.includes(id));

                    if (isAllSelected) {
                      const newIds = formData.assignedProductIds.filter((id: string) => !availableIds.includes(id));
                      setFormData({ ...formData, assignedProductIds: newIds });
                    } else {
                      const newIds = Array.from(new Set([...formData.assignedProductIds, ...availableIds]));
                      setFormData({ ...formData, assignedProductIds: newIds });
                    }
                  }}
                  className={(() => {
                    const availableIds = filteredProducts.filter(opt => {
                      const conflicts = checkProductConflicts(opt.value);
                      return !(conflicts.hasConflict && !conflicts.isAssignedToCurrentDiscount);
                    }).map(opt => opt.value);
                    const isAllSelected = availableIds.length > 0 && availableIds.every((id: string) => formData.assignedProductIds.includes(id));
                    
                    return `w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isAllSelected 
                        ? "bg-violet-500 border-violet-500 shadow-lg shadow-violet-500/20" 
                        : "bg-slate-900 border-slate-600 group-hover:border-violet-400"
                    }`;
                  })()}
                >
                  {(() => {
                    const availableIds = filteredProducts.filter(opt => {
                      const conflicts = checkProductConflicts(opt.value);
                      return !(conflicts.hasConflict && !conflicts.isAssignedToCurrentDiscount);
                    }).map(opt => opt.value);
                    const isAllSelected = availableIds.length > 0 && availableIds.every((id: string) => formData.assignedProductIds.includes(id));
                    
                    return isAllSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    );
                  })()}
                </div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider group-hover:text-violet-400 transition-colors">Select All Available</span>
              </label>

              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

              <div className="hidden lg:flex items-center gap-5 text-[11px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Total:</span>
                  <span className="text-slate-300">{stats.total}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Discounted:</span>
                  <span className="text-red-400">{stats.conflictCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Available:</span>
                  <span className="text-green-400">{stats.availableCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Selected:</span>
                  <span className="text-violet-400">{formData.assignedProductIds.length}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const filteredIds = filteredProducts.map(opt => opt.value);
                const newIds = formData.assignedProductIds.filter((id: string) => !filteredIds.includes(id));
                setFormData({ ...formData, assignedProductIds: newIds });
              }}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-all uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 rounded-lg group"
            >
              <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              Clear All From List
            </button>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="p-2.5 overflow-y-auto max-h-[calc(80vh-200px)]">
        {(() => {
  
          const allDiscounts = (props.discounts || []) as any[]; // Pass discounts array from parent
          
          if (filteredProducts.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-1">
                  {productSearchTerm ? "No products found" : "No products available"}
                </p>
                <p className="text-sm text-slate-500">
                  {productSearchTerm 
                    ? `No products match "${productSearchTerm}"`
                    : "There are no products available in this category"
                  }
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-1.5">
              {filteredProducts.map((productOption) => {
                // 🎯 CONFLICT CHECKING LOGIC
                const productIdStr = productOption.value;
                const product = productMap.get(productIdStr);
                
                const { hasConflict, uniqueConflicts, isAssignedToCurrentDiscount } = checkProductConflicts(productIdStr);
                const primaryConflict = uniqueConflicts[0];
                
                const isSelected = formData.assignedProductIds.includes(productIdStr);
           const isDisabled = hasConflict && !isAssignedToCurrentDiscount;
          const isChecked = isSelected;
               const imageUrl = getProductImage(product?.images || []);
                return (
                  <button
                    type="button"
                    key={productOption.value}
                    className={`relative flex items-center gap-3 p-1.5 rounded-xl border transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                      isDisabled
                        ? 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-violet-500/20 border-violet-500/50 cursor-pointer'
                        : 'bg-slate-800/50 border-slate-700 hover:border-violet-500/50 cursor-pointer'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isDisabled) {
                        const newIds = isSelected
                          ? formData.assignedProductIds.filter(id => id !== productOption.value)
                          : [...formData.assignedProductIds, productOption.value];
                        setFormData({ ...formData, assignedProductIds: newIds });
                      }
                    }}
                  >
                    <input
                      type="checkbox"                    
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => {}} // Handled by button click
                      className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none"
                      readOnly
                    />

                  <div className="flex items-center gap-2 flex-1 min-w-0">

  {/* IMAGE */}
<div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
  {imageUrl ? (
    <img
      src={imageUrl}
      alt={product?.name || "product"}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
      No Img
    </div>
  )}
</div>

  {/* DETAILS */}
<div className="flex flex-col min-w-0 flex-1">

  {/* NAME */}
  <p className={`text-sm font-medium truncate ${
    isDisabled ? "text-slate-500" : "text-white"
  }`}>
    {productOption.label}
  </p>

  {/* SKU */}
  <p className="text-[11px] text-slate-500 truncate">
    SKU: {product?.sku ?? "N/A"}
  </p>

  <div className="flex items-center gap-2">

  {/* PRICE */}
  <span className="text-xs text-cyan-400 font-semibold">
    £{product?.price ?? "0.00"}
  </span>

  {/* STOCK */}
  <span className={`text-[11px] font-medium ${
    (product?.stockQuantity ?? 0) > 0
      ? "text-green-400"
      : "text-red-400"
  }`}>
    {(product?.stockQuantity ?? 0) > 0
      ? `In Stock (${product?.stockQuantity})`
      : "Out of Stock"}
  </span>

</div>

</div>
</div>

                    {/* 🎯 CASE 1: CURRENT DISCOUNT - Show for assigned products */}
                    {isAssignedToCurrentDiscount && editingDiscount && (
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                          <p className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                   
                            {editingDiscount.usePercentage 
                              ? `${editingDiscount.discountPercentage} % OFF`
                              : `£${editingDiscount.discountAmount} OFF`
                            }
                          </p>
                        </div>
                        <div className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 rounded-lg text-xs font-semibold text-blue-400">
                          Current Discount
                        </div>
                      </div>
                    )}

                    {/* 🎯 CASE 2: CONFLICTING DISCOUNT - Show for products with other active discounts */}
                    {hasConflict && !isAssignedToCurrentDiscount && primaryConflict && (
                      <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg">
                        <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5" />
                          {primaryConflict.usePercentage 
                            ? `${primaryConflict.discountPercentage}% OFF`
                            : `£${primaryConflict.discountAmount} OFF`
                          }
                        </p>
                        <p className="text-[10px] text-red-300/70 mt-0.5 flex items-center gap-1">
                          <span>Active • {primaryConflict.name}</span>
                          {primaryConflict.discountType === "AssignedToCategories" ? 
                            "(Category)" : "(Product)"}
                        </p>
                        {uniqueConflicts.length > 1 && (
                          <p className="text-[10px] text-red-300/50 mt-0.5">
                            +{uniqueConflicts.length - 1} more discount(s)
                          </p>
                        )}
                      </div>
                    )}

                    {/* 🎯 CASE 3: SELECTED BADGE - For manually selected products with no conflicts */}
                    {isSelected && !isAssignedToCurrentDiscount && !hasConflict && (
                      <div className="px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-lg text-xs font-semibold text-green-400">
                        ✓ Selected
                      </div>
                    )}

                    {/* 🎯 CASE 4: AVAILABLE FOR SELECTION - No conflicts, not selected */}
                    {!hasConflict && !isSelected && !isAssignedToCurrentDiscount && (
                      <div className="px-2.5 py-1 bg-slate-600/20 border border-slate-600/40 rounded-lg text-xs font-semibold text-slate-400">
                        Available
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Modal Footer */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        {(() => {
          const allDiscounts = (props.discounts || []) as any[];
          let conflictCount = 0;
          let availableCount = 0;

      

          const selectedCount = formData.assignedProductIds.length;

          return (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsProductSelectionModalOpen(false);
                  setProductSearchTerm("");
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium shrink-0"
              >
                Done
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  </div>
)}

      {/* ========== VIEW DISCOUNT DETAILS MODAL ========== */}
      {viewingDiscount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  {viewingDiscount.name}
                  </h2>
                  <p className="text-slate-300 text-xs mt-1 font-medium" title={viewingDiscount.id}>
                    View discount information
                  </p>
                </div>
              <button
  onClick={() => setViewingDiscount(null)}
  className="
    group
    w-10 h-10
    flex items-center justify-center
    rounded-xl
    border border-slate-700/60
    bg-slate-800/50
    text-slate-400
    hover:text-white
    hover:bg-red-500/15
    hover:border-red-500/40
    transition-all duration-200
  "
>
  <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
</button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Left Column */}
                <div className="space-y-4">

                  {/* Type, Status & Limitation */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Discount Type:
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                        viewingDiscount.discountType === 'AssignedToProducts' ? 'bg-blue-500/10 text-blue-400' :
                        viewingDiscount.discountType === 'AssignedToCategories' ? 'bg-green-500/10 text-green-400' :
                        viewingDiscount.discountType === 'AssignedToManufacturers' ? 'bg-purple-500/10 text-purple-400' :
                        viewingDiscount.discountType === 'AssignedToOrderTotal' ? 'bg-orange-500/10 text-orange-400' :
                        viewingDiscount.discountType === 'AssignedToOrderSubTotal' ? 'bg-pink-500/10 text-pink-400' :
                        viewingDiscount.discountType === 'UptoXPercent' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {getDiscountTypeIcon(viewingDiscount.discountType)}
                        {getDiscountTypeLabel(viewingDiscount.discountType)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Status:</span>
                      {isDiscountActive(viewingDiscount) ? (
                        <span className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-bold flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          Active Now
                        </span>
                      ) : viewingDiscount.isActive ? (
                        <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-sm font-bold flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          Scheduled
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Limitation:</span>
                      <span className="text-white font-bold">{viewingDiscount.discountLimitation}</span>
                    </div>

                    {viewingDiscount.limitationTimes && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 font-semibold">Limitation Times:</span>
                        <span className="text-white font-bold">{viewingDiscount.limitationTimes}</span>
                      </div>
                    )}
                  </div>

                  {/* Discount Value */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount Value
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Use Percentage:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        viewingDiscount.usePercentage ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {viewingDiscount.usePercentage ? 'Yes' : 'No'}
                      </span>
                    </div>

                    {viewingDiscount.usePercentage ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 font-semibold">Discount Percentage:</span>
                        <span className="text-green-400 font-extrabold text-2xl">{viewingDiscount.discountPercentage}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 font-semibold">Discount Amount:</span>
                        <span className="text-blue-400 font-extrabold text-2xl">£{viewingDiscount.discountAmount}</span>
                      </div>
                    )}

                    {viewingDiscount.maximumDiscountAmount && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-sm text-slate-300 font-semibold">Maximum Discount:</span>
                        <span className="text-orange-400 font-bold text-lg">£{viewingDiscount.maximumDiscountAmount}</span>
                      </div>
                    )}

                    {viewingDiscount.maximumDiscountedQuantity && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-sm text-slate-300 font-semibold">Max Discounted Qty:</span>
                        <span className="text-purple-400 font-bold text-lg">{viewingDiscount.maximumDiscountedQuantity} items</span>
                      </div>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Requires Coupon Code:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        viewingDiscount.requiresCouponCode ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {viewingDiscount.requiresCouponCode ? 'Yes' : 'No'}
                      </span>
                    </div>

                    {viewingDiscount.requiresCouponCode && viewingDiscount.couponCode && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-300 font-semibold mb-2">Coupon Code:</p>
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-green-400 font-mono font-bold text-xl text-center tracking-wider">
                            {viewingDiscount.couponCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Options */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <h3 className="text-sm font-bold text-white mb-2">Additional Options</h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Is Cumulative:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        viewingDiscount.isCumulative ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {viewingDiscount.isCumulative ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-semibold">Applied to Sub-Orders:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        viewingDiscount.appliedToSubOrders ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {viewingDiscount.appliedToSubOrders ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  {(viewingDiscount.desktopBannerImageUrl || viewingDiscount.mobileBannerImageUrl) && (
  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-3">
    
    <h3 className="text-sm font-bold text-white flex items-center gap-2">
      🖼 Banner Images
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* DESKTOP */}
      {viewingDiscount.desktopBannerImageUrl && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Desktop</p>

         <img
  src={getImageUrl(viewingDiscount.desktopBannerImageUrl)}
  className="w-full h-40 object-cover rounded-lg border border-slate-600 cursor-pointer"
  onClick={() => setPreviewImage(viewingDiscount.desktopBannerImageUrl)}
/>
        </div>
      )}

      {/* MOBILE */}
      {viewingDiscount.mobileBannerImageUrl && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Mobile</p>

         <img
  src={getImageUrl(viewingDiscount.mobileBannerImageUrl)}
  className="w-full h-40 object-cover rounded-lg border border-slate-600 cursor-pointer"
  onClick={() => setPreviewImage(viewingDiscount.mobileBannerImageUrl)}
/>
        </div>
      )}

    </div>
  </div>
)}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Valid Period */}
             {/* Valid Period */}
<div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">

  {(() => {
    const now = new Date();

    const start = new Date(viewingDiscount.startDate);
    const end = new Date(viewingDiscount.endDate);

    let status = "Active";
    let statusClasses =
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

    let dotClasses = "bg-emerald-400";

    if (now < start) {
      status = "Scheduled";

      statusClasses =
        "bg-amber-500/15 text-amber-400 border-amber-500/30";

      dotClasses = "bg-amber-400";
    }

    if (now > end) {
      status = "Expired";

      statusClasses =
        "bg-red-500/15 text-red-400 border-red-500/30";

      dotClasses = "bg-red-400";
    }

    return (
      <>
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">

          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-400" />
            Valid Period
          </h3>

          {/* STATUS */}
          <div
            className={`
              inline-flex items-center gap-2
              px-3 py-1.5
              rounded-xl
              border
              text-[11px]
              font-bold
              tracking-wide
              ${statusClasses}
            `}
          >
            <span
              className={`w-2 h-2 rounded-full ${dotClasses}`}
            />

            {status}
          </div>
        </div>

        {/* DATES */}
        <div className="space-y-3">

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-300 font-semibold">
              Start Date:
            </span>

            <span className="text-slate-100 text-sm font-medium">
              {formatDate(viewingDiscount.startDate)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-300 font-semibold">
              End Date:
            </span>

            <span className="text-slate-100 text-sm font-medium">
              {formatDate(viewingDiscount.endDate)}
            </span>
          </div>

        </div>
      </>
    );
  })()}
</div>

                  {/* Assignments */}
                  {(viewingDiscount.assignedProductIds || viewingDiscount.assignedCategoryIds || viewingDiscount.assignedManufacturerIds) && (
                    <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        Assignments
                      </h3>
                      <div className="space-y-4">
                        
                        {/* FOR ASSIGNED TO PRODUCTS */}
                        {viewingDiscount.discountType === 'AssignedToProducts' && viewingDiscount.assignedProductIds && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Package className="h-4 w-4 text-blue-400" />
                              </div>
                              <p className="text-sm text-blue-400 font-bold">Discount Applied on Products:</p>
                            </div>
                      <div className="flex flex-col gap-2 pl-10">
  {viewingDiscount.assignedProductIds
    .split(",")
    .filter((id) => id.trim())
    .map((productId, index) => {
      const product = productMap.get(productId.trim());

      // ✅ Same image fallback logic
      const variantImg =
        product?.variants?.find((v: any) => v.imageUrl)?.imageUrl || "";

      const productImg =
        product?.images?.find((img: any) => img.isMain)?.imageUrl ||
        product?.images?.[0]?.imageUrl ||
        "";

      const imgUrl = getImageUrl(variantImg || productImg);

      return (
        <div
          key={index}
          className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-2"
        >
          {/* Index */}
          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[10px] flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
            {index + 1}
          </span>

          {/* Image */}
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product?.name || "Product"}
              className="w-6 h-6 rounded object-cover flex-shrink-0 border border-blue-400/20"
              onError={(e) =>
                (e.currentTarget.src = "/placeholder.png")
              }
            />
          ) : (
            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Package className="h-3 w-3 text-slate-400" />
            </div>
          )}

          {/* Name */}
          <span className="truncate">
            {product ? product.name : `Product ${index + 1}`}
          </span>
        </div>
      );
    })}
</div>
                          </div>
                        )}
                        
                   {/* FOR ASSIGNED TO CATEGORIES */}
{viewingDiscount.discountType === 'AssignedToCategories' && (
  <>
    {viewingDiscount.assignedCategoryIds && (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-400" />
          </div>

          <div>
            <p className="text-sm text-green-400 font-bold">
              Category Discount Applied on:
            </p>

            <p className="text-xs text-slate-400 mt-0.5">
              {viewingDiscount.assignedProductIds &&
              viewingDiscount.assignedProductIds.trim() !== ""
                ? "This discount applies only to selected products from this category"
                : "This discount applies to all products inside this category"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pl-10">
          {viewingDiscount.assignedCategoryIds
            .split(',')
            .filter(id => id.trim())
            .map((categoryId, index) => {
           const category = findCategoryById(
  categories,
  categoryId
);

              return (
                <span
                  key={index}
                  className="
                    px-3 py-2
                    bg-green-500/10
                    text-green-400
                    rounded-lg
                    text-xs
                    font-semibold
                    border border-green-500/30
                    hover:bg-green-500/20
                    transition-all
                    flex items-center gap-2
                  "
                >
                  <span className="text-base">📁</span>

                  {category
                    ? category.name
                    : `Category ${index + 1}`}
                </span>
              );
            })}
        </div>
      </div>
    )}

    {/* SPECIFIC PRODUCTS */}
    {viewingDiscount.assignedProductIds &&
      viewingDiscount.assignedProductIds.trim() !== "" && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">

          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-violet-400" />
            </div>

            <div>
              <p className="text-sm text-violet-400 font-bold">
                Selected Products:
              </p>

              <p className="text-xs text-slate-400 mt-0.5">
                Only these products receive the category discount
              </p>
            </div>
          </div>

        <div className="flex flex-wrap gap-2 pl-10">
  {viewingDiscount.assignedProductIds
    .split(',')
    .filter(id => id.trim())
    .map((productId, index) => {
      const product = productMap.get(productId.trim());

      return (
        <div
          key={index}
          className="
            flex items-center gap-2
            px-3 py-2
            bg-violet-500/10
            text-violet-400
            rounded-xl
            text-xs
            font-semibold
            border border-violet-500/30
            hover:bg-violet-500/20
            transition-all

          "
        >
          {/* COUNT */}
          <div
            className="
              w-5 h-5
              rounded-full
              bg-violet-500/20
              border border-violet-500/30
              flex items-center justify-center
              text-[10px]
              font-bold
              shrink-0
            "
          >
            {index + 1}
          </div>

          {/* IMAGE */}
          <div
            className="
              w-8 h-8
              rounded-lg
              overflow-hidden
              bg-slate-800
              border border-violet-500/20
              shrink-0
            "
          >
          {(() => {
  const productImage =
    product?.mainImageUrl ||
    product?.images?.find((i: any) => i.isMain)?.imageUrl ||
    product?.images?.[0]?.imageUrl ||
    product?.variants?.find((v: any) => v.imageUrl)?.imageUrl;

  return productImage ? (
    <img
      src={productImage}
      alt={product?.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <Package className="h-3 w-3 text-violet-400" />
    </div>
  );
})()}
          </div>

          {/* NAME */}
          <span
            className="truncate"
            title={product?.name}
          >
            {product
              ? product.name
              : `Product ${index + 1}`}
          </span>
        </div>
      );
    })}
</div>
        </div>
      )}
  </>
)}

                        {/* FOR ORDER TOTAL / SHIPPING */}
                        {(viewingDiscount.discountType === 'AssignedToOrderTotal' || 
                          viewingDiscount.discountType === 'AssignedToShipping' ||
                          viewingDiscount.discountType === 'AssignedToOrderSubTotal') && (
                          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                            <p className="text-cyan-400 text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              This discount applies to {' '}
                              <span className="font-bold">
                                {viewingDiscount.discountType === 'AssignedToOrderTotal' ? 'entire order total' :
                                 viewingDiscount.discountType === 'AssignedToShipping' ? 'shipping charges' :
                                 'order subtotal'}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Comment */}
                  {viewingDiscount.adminComment && (
                    <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                      <h3 className="text-base font-bold text-white mb-3">Admin Comment</h3>
                      <div
                        className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: viewingDiscount.adminComment || "No comment available",
                        }}
                      />
                    </div>
                  )}

                  {/* Audit Information */}
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-violet-400" />
                      Audit Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-slate-300 font-semibold">Created At:</span>
                        <span className="text-slate-100 text-sm font-medium">
                           {formatDate(viewingDiscount.createdAt)}
                        </span>
                      </div>
  <div className="py-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-slate-300 font-semibold whitespace-nowrap">Created By:</span>
                          <span className="text-slate-100 text-sm font-medium text-right break-all">
                            {(viewingDiscount as any).createdBy || 'Unknown'}
                          </span>
                        </div>
                      </div>
                     

                      <div className="border-t border-slate-700/50 my-3"></div>

                     <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-slate-300 font-semibold">Updated At:</span>
                        <span className="text-slate-100 text-sm font-medium">
                      {formatDate(viewingDiscount.updatedAt)}
                        </span>
                      </div>

                      <div className="py-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-slate-300 font-semibold whitespace-nowrap">Updated By:</span>
                          <span className="text-slate-100 text-sm font-medium text-right break-all">
                            {(viewingDiscount as any).updatedBy || 'Never updated'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
              <button
                onClick={() => {
                  if (handleViewUsageHistory) {
                    setViewingDiscount(null);
                    handleViewUsageHistory(viewingDiscount);
                  }
                }}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/40"
              >
                <History className="h-4 w-4" />
                Usage History
              </button>
              <button
                onClick={() => {
                  setViewingDiscount(null);
                  handleEdit(viewingDiscount);
                }}
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/40"
              >
                <Edit className="h-4 w-4" />
                Edit Discount
              </button>
              <button
                onClick={() => setViewingDiscount(null)}
                className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ✅ ULTRA COMPACT USAGE HISTORY MODAL ========== */}
      {usageHistoryModal && selectedDiscountHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-5xl w-full max-h-[97vh] overflow-hidden shadow-2xl">
            
            {/* Compact Header - Inline */}
     <div className="p-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
  <div className="flex items-start justify-between gap-3">

    {/* LEFT */}
    <div className="flex items-start gap-3 min-w-0">

      {/* ICON */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20 shrink-0">
        {getDiscountTypeIcon(selectedDiscountHistory.discountType)}
      </div>

      {/* CONTENT */}
      <div className="min-w-0">

        {/* TITLE */}
        <h2 className="text-lg font-bold text-white leading-tight truncate">
          {selectedDiscountHistory.name}
        </h2>

        {/* HELPER TEXT */}
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          Track discount usage activity, customer redemptions,
          and order-level analytics for this promotion.
        </p>

        {/* COUPON */}
        {selectedDiscountHistory.couponCode && (
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">
              Coupon
            </span>

            <span className="text-green-300 font-mono text-xs font-semibold">
              {selectedDiscountHistory.couponCode}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* CLOSE BUTTON */}
    <button
      onClick={() => {
        setUsageHistoryModal(false);
        clearDateFilters();
      }}
      className="
        group
        relative
        w-10 h-10
        flex items-center justify-center
        rounded-xl
        border border-slate-700/60
        bg-slate-800/60
        text-slate-400
        hover:text-white
        hover:bg-red-500/15
        hover:border-red-500/40
        active:scale-95
        transition-all duration-200
        shrink-0
      "
    >
      <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
    </button>

  </div>
</div>

            {/* ✅ COMPACT DATE FILTER - INLINE */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/30">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">Filter:</span>

                {/* Quick Presets */}
                <button
                  onClick={() => setQuickDateRange('today')}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    dateRangeFilter.startDate === new Date().toISOString().split('T')[0] &&
                    dateRangeFilter.endDate === new Date().toISOString().split('T')[0]
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setQuickDateRange('week')}
                  className="px-2 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md font-medium transition-all"
                >
                  7D
                </button>
                <button
                  onClick={() => setQuickDateRange('month')}
                  className="px-2 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md font-medium transition-all"
                >
                  30D
                </button>
                <button
                  onClick={() => setQuickDateRange('all')}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    !hasDateFilters
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All
                </button>

                <span className="text-slate-600 mx-1">|</span>

                {/* Custom Dates */}
                <input
                  type="date"
                  value={dateRangeFilter.startDate}
                  onChange={(e) => setDateRangeFilter({...dateRangeFilter, startDate: e.target.value})}
                  className="px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 w-32"
                />
                <span className="text-slate-500">→</span>
                <input
                  type="date"
                  value={dateRangeFilter.endDate}
                  onChange={(e) => setDateRangeFilter({...dateRangeFilter, endDate: e.target.value})}
                  className="px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 w-32"
                />
                
                {hasDateFilters && (
                  <>
                    <button
                      onClick={clearDateFilters}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                      title="Clear Filter"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-blue-400 ml-auto">
                      {getFilteredUsageHistory().length}/{usageHistory.length} shown
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ✅ ULTRA COMPACT STATS */}
            <div className="p-3 border-b border-slate-800">
              <div className="grid grid-cols-4 gap-2">
                {/* Value */}
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <Percent className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] text-slate-400">Value</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    {formatDiscountValue(selectedDiscountHistory)}
                  </p>
                  {selectedDiscountHistory.maximumDiscountAmount && (
                    <p className="text-[10px] text-slate-400">Max £{selectedDiscountHistory.maximumDiscountAmount}</p>
                  )}
                </div>

                {/* Times Used */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] text-slate-400">Used</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    {calculateFilteredStats().totalUsage}
                  </p>
                  {selectedDiscountHistory.limitationTimes && (
                    <p className="text-[10px] text-slate-400">
                      / {selectedDiscountHistory.limitationTimes}
                    </p>
                  )}
                </div>

                {/* Remaining */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <Target className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10px] text-slate-400">Left</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight flex items-center gap-1">
                    {selectedDiscountHistory.discountLimitation === 'Unlimited' ? (
                      <InfinityIcon className="w-5 h-5" />
                    ) : (
                      calculateRemainingUses(selectedDiscountHistory)
                    )}
                  </p>
                </div>

                {/* Expires */}
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-slate-400">Expires</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    {(() => {
                      const days = calculateDaysUntilExpiry(selectedDiscountHistory);
                      return days < 0 ? "Expired" : days === 0 ? "Today" : `${days}d`;
                    })()}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(selectedDiscountHistory.endDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})}
                  </p>
                </div>

                {/* Total Saved */}
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-[10px] text-slate-400">Saved</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    £{calculateFilteredStats().totalRevenue.toFixed(2)}
                  </p>
                </div>

                {/* Customers */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-slate-400">Users</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    {calculateFilteredStats().uniqueCustomers}
                  </p>
                </div>

                {/* Avg Discount */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] text-slate-400">Avg</span>
                  </div>
                  <p className="text-lg font-bold text-white leading-tight">
                    £{calculateFilteredStats().averageDiscount.toFixed(2)}
                  </p>
                </div>

                {/* Type */}
                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-slate-400">Type</span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">
                    {selectedDiscountHistory.discountLimitation === "Unlimited" 
                      ? "∞" 
                      : selectedDiscountHistory.discountLimitation === "NTimesOnly"
                      ? "Limited"
                      : "Per User"}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ COMPACT TABLE */}
            <div className="p-3 overflow-y-auto max-h-[calc(92vh-380px)]">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-400 text-sm">Loading...</p>
                  </div>
                </div>
              ) : getFilteredUsageHistory().length === 0 ? (
                <div className="text-center py-10">
                  <History className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-1">
                    {hasDateFilters ? "No transactions in range" : "No usage yet"}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {hasDateFilters ? "Try adjusting filters" : "Discount hasn't been used"}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">#</th>
                        <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Order</th>
                        <th className="text-left py-2 px-3 text-slate-400 font-medium text-xs">Customer</th>
                        <th className="text-center py-2 px-3 text-slate-400 font-medium text-xs">Saved</th>
                        <th className="text-center py-2 px-3 text-slate-400 font-medium text-xs">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredUsageHistory().map((history, index) => (
                        <tr
                          key={history.id}
                          className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Index */}
                          <td className="py-2 px-3">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                          </td>

                          {/* Order */}
                          <td className="py-2 px-3">
                            <div className="flex flex-col">
                              <span className="text-white font-medium text-xs">
                                {(history as any).orderNumber}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {history.orderId.substring(0, 8)}...
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span className="text-white text-xs truncate max-w-[200px]">
                                {history.customerEmail}
                              </span>
                            </div>
                          </td>

                          {/* Discount */}
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-xs font-semibold">
                              £{history.discountAmount.toFixed(2)}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-medium">
                                {formatDate(history.usedAt)}
                              </span>
                             
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/50 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {hasDateFilters 
                  ? `${getFilteredUsageHistory().length}/${usageHistory.length} shown`
                  : `${usageHistory.length} total`
                }
              </span>
              <button
                onClick={() => {
                  setUsageHistoryModal(false);
                  clearDateFilters();
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-500 transition-all font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ImagePreviewModal
  imageUrl={previewImage}
  onClose={() => setPreviewImage(null)}
/>
    </>
  );
}
