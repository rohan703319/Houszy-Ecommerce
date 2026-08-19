"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  ArrowLeft,
  Save,
  Tag,
  Info,
} from "lucide-react";
import Select from "react-select";
import { useTheme } from "@/app/admin/_context/theme-provider";
import { ProductDescriptionEditor } from "../_components/SelfHostedEditor";
import { useToast } from "@/app/admin/_components/CustomToast";
import { Discount, DiscountType, DiscountLimitationType, discountsService } from "@/lib/services/discounts";
import { Product, productsService, brandsService } from "@/lib/services";
import { Category, categoriesService } from "@/lib/services/categories";
import { getSelectStyles } from "../_utils/styles";
import { getImageUrl, getProductImage } from "../_utils/formatUtils";

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

interface CategoryNode {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryNode[];
  subCategories?: CategoryNode[];
}

interface DiscountFormProps {
  initialData?: Discount | null;
  isEdit?: boolean;
}

const defaultFormData: FormData = {
  name: "",
  isActive: true,
  discountType: "AssignedToProducts",
  usePercentage: true,
  discountAmount: 0,
  discountPercentage: 0,
  maximumDiscountAmount: null,
  startDate: "",
  endDate: "",
  requiresCouponCode: false,
  couponCode: "",
  isCumulative: false,
  discountLimitation: "Unlimited",
  limitationTimes: null,
  maximumDiscountedQuantity: null,
  appliedToSubOrders: false,
  adminComment: "",
  assignedProductIds: [],
  assignedCategoryIds: [],
  assignedManufacturerIds: [],
  desktopBannerImageUrl: null,
  mobileBannerImageUrl: null,
};

// ========== CATEGORY HELPER FUNCTIONS ==========
const formatCategoryLabel = (path: string[]): string => {
  if (path.length <= 2) return path.join(" → ");
  const head = path.slice(0, -1).join(" → ");
  const tail = path[path.length - 1];
  return `${head} → ${tail}`;
};

const buildCategoryTree = (flatCategories: CategoryNode[]): CategoryNode[] => {
  if (!Array.isArray(flatCategories) || flatCategories.length === 0) return [];
  const map: { [key: string]: CategoryNode } = {};
  const roots: CategoryNode[] = [];

  flatCategories.forEach((cat) => {
    map[cat.id] = { ...cat, children: cat.children || cat.subCategories || [] };
  });

  flatCategories.forEach((cat) => {
    if (cat.parentId) {
      if (map[cat.parentId]) {
        map[cat.parentId].children!.push(map[cat.id]);
      }
    } else {
      roots.push(map[cat.id]);
    }
  });

  return roots;
};

const flattenCategoryTree = (nodes: CategoryNode[]): SelectOption[] => {
  const result: SelectOption[] = [];
  const walk = (node: CategoryNode, path: string[]) => {
    const currentPath = [...path, node.name];
    result.push({ value: node.id, label: formatCategoryLabel(currentPath) });
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => walk(child, currentPath));
    }
  };
  nodes.forEach((node) => walk(node, []));
  return result;
};

const normalizeCategory = (cat: any): CategoryNode => ({
  id: cat.id,
  name: cat.name,
  parentId: cat.parentCategoryId ?? null,
  children: (cat.subCategories || cat.children || []).map(normalizeCategory),
});

const processCategoryData = (categories: any[]): SelectOption[] => {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const hasSubTree = categories.some(
    (cat) =>
      (cat.subCategories && cat.subCategories.length) ||
      (cat.children && cat.children.length)
  );

  if (hasSubTree) {
    const normalizedTree = categories.map(normalizeCategory);
    return flattenCategoryTree(normalizedTree);
  }

  const hasParentId = categories.some(
    (cat) => cat.parentId !== undefined && cat.parentId !== null
  );

  if (hasParentId) {
    const tree = buildCategoryTree(categories as CategoryNode[]);
    return flattenCategoryTree(tree);
  }

  return categories.map((cat) => ({ value: cat.id, label: cat.name }));
};

const extractProducts = (res: any): Product[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

export default function DiscountForm({ initialData = null, isEdit = false }: DiscountFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { theme } = useTheme();
  const customSelectStyles = useMemo(() => getSelectStyles(theme === 'dark'), [theme]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("basic-info");

  // Form states
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        name: initialData.name || "",
        isActive: initialData.isActive !== false,
        discountType: initialData.discountType || "AssignedToProducts",
        usePercentage: initialData.usePercentage !== false,
        discountAmount: initialData.discountAmount || 0,
        discountPercentage: initialData.discountPercentage || 0,
        maximumDiscountAmount: initialData.maximumDiscountAmount ?? null,
        startDate: initialData.startDate ? initialData.startDate.slice(0, 16) : "",
        endDate: initialData.endDate ? initialData.endDate.slice(0, 16) : "",
        requiresCouponCode: initialData.requiresCouponCode === true,
        couponCode: initialData.couponCode || "",
        isCumulative: initialData.isCumulative === true,
        discountLimitation: initialData.discountLimitation || "Unlimited",
        limitationTimes: initialData.limitationTimes ?? null,
        maximumDiscountedQuantity: initialData.maximumDiscountedQuantity ?? null,
        appliedToSubOrders: initialData.appliedToSubOrders === true,
        adminComment: initialData.adminComment || "",
        assignedProductIds: initialData.assignedProductIds
          ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        assignedCategoryIds: initialData.assignedCategoryIds
          ? initialData.assignedCategoryIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        assignedManufacturerIds: initialData.assignedManufacturerIds
          ? initialData.assignedManufacturerIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        desktopBannerImageUrl: initialData.desktopBannerImageUrl || null,
        mobileBannerImageUrl: initialData.mobileBannerImageUrl || null,
      };
    }
    return defaultFormData;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Files
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);

  // Data lists
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [allDiscounts, setAllDiscounts] = useState<Discount[]>([]);

  // Product Selection/Picker states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState("");

  // Debounce search term changes to prevent screen flicker and lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setProductSearchTerm(localSearchTerm);
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchTerm]);

  // Populate form on edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        isActive: initialData.isActive !== false,
        discountType: initialData.discountType || "AssignedToProducts",
        usePercentage: initialData.usePercentage !== false,
        discountAmount: initialData.discountAmount || 0,
        discountPercentage: initialData.discountPercentage || 0,
        maximumDiscountAmount: initialData.maximumDiscountAmount ?? null,
        startDate: initialData.startDate ? initialData.startDate.slice(0, 16) : "",
        endDate: initialData.endDate ? initialData.endDate.slice(0, 16) : "",
        requiresCouponCode: initialData.requiresCouponCode === true,
        couponCode: initialData.couponCode || "",
        isCumulative: initialData.isCumulative === true,
        discountLimitation: initialData.discountLimitation || "Unlimited",
        limitationTimes: initialData.limitationTimes ?? null,
        maximumDiscountedQuantity: initialData.maximumDiscountedQuantity ?? null,
        appliedToSubOrders: initialData.appliedToSubOrders === true,
        adminComment: initialData.adminComment || "",
        assignedProductIds: initialData.assignedProductIds
          ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        assignedCategoryIds: initialData.assignedCategoryIds
          ? initialData.assignedCategoryIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        assignedManufacturerIds: initialData.assignedManufacturerIds
          ? initialData.assignedManufacturerIds.split(",").map(id => id.trim()).filter(Boolean)
          : [],
        desktopBannerImageUrl: initialData.desktopBannerImageUrl || null,
        mobileBannerImageUrl: initialData.mobileBannerImageUrl || null,
      });

      // Load initial selected products
      const ids = initialData.assignedProductIds
        ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
        : [];
      if (ids.length > 0) {
        Promise.all(ids.map(id => productsService.getById(id)))
          .then(results => {
            const validProducts = results.map(res => res?.data?.data).filter((p): p is Product => !!p);
            setSelectedProducts(validProducts);
          })
          .catch(err => console.error("Error loading assigned products detail:", err));
      }
    }
  }, [initialData]);

  // Load dropdown lists and other active discounts for conflict checks
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [catsRes, brandsRes, discountsRes] = await Promise.all([
          categoriesService.getAll(),
          brandsService.getAll(),
          discountsService.getAll(),
        ]);
        setCategories((catsRes?.data?.data as any)?.items || catsRes?.data?.data || catsRes || []);
        setBrands((brandsRes?.data?.data as any)?.items || brandsRes?.data?.data || brandsRes || []);
        setAllDiscounts((discountsRes?.data?.data || discountsRes || []) as any);
      } catch (err) {
        console.error("Error loading categories/brands:", err);
      }
    };
    loadStaticData();
  }, []);

  // Format selects
  const categoryOptions = useMemo(() => processCategoryData(categories), [categories]);
  const brandOptions = useMemo(() => brands.map(b => ({ value: b.id, label: b.name })), [brands]);

  // Normal maps
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    selectedProducts.forEach(p => map.set(p.id, p));
    return map;
  }, [products, selectedProducts]);

  // check conflicts logic
  const checkProductConflicts = useCallback((productIdStr: string) => {
    const product = productMap.get(productIdStr);
    if (!product) return { hasConflict: false, uniqueConflicts: [], isAssignedToCurrentDiscount: false };

    const productCategoryIds = [
      (product as any).categoryId,
      ...(((product as any).categories || []) as any[]).map((c: any) => c.categoryId || c.id).filter(Boolean)
    ].map(String);

    const manualConflicts = allDiscounts.filter((d: any) => {
      if (d.id === initialData?.id || !d.isActive || d.isDeleted) return false;
      const now = new Date();
      if (d.startDate && new Date(d.startDate) > now) return false;
      if (d.endDate && new Date(d.endDate) < now) return false;

      if (d.discountType === "AssignedToProducts") {
        return d.assignedProductIds?.split(',').map((s: string) => s.trim()).includes(productIdStr);
      }

      if (d.discountType === "AssignedToCategories") {
        const dCatIds = (d.assignedCategoryIds || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        if (!productCategoryIds.some(cid => dCatIds.includes(cid))) return false;
        if (d.isCumulative && formData.isCumulative) return false;

        const assignedIds = (d.assignedProductIds || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        if (assignedIds.length > 0) {
          return assignedIds.includes(productIdStr);
        }
        return true;
      }
      return false;
    });

    const uniqueConflicts = [...manualConflicts].filter((v, i, a) =>
      a.findIndex(t => t.id === v.id) === i
    );

    const isAssignedToCurrentDiscount = !!(initialData?.id &&
      initialData.assignedProductIds?.split(',').map((s: string) => s.trim()).includes(productIdStr));

    return {
      hasConflict: uniqueConflicts.length > 0,
      uniqueConflicts,
      isAssignedToCurrentDiscount
    };
  }, [productMap, allDiscounts, initialData, formData.isCumulative]);

  // Product Query parameters constructor
  const fetchProductsList = useCallback(async (page: number, append: boolean) => {
    setProductsLoading(true);
    try {
      const params: any = {
        page: page,
        pageSize: 20,
        isPublished: true,
        sortBy: "name",
        outOfStockLast: false,
      };

      if (formData.discountType === "AssignedToCategories" && formData.assignedCategoryIds.length > 0) {
        params.categoryId = formData.assignedCategoryIds[0];
      } else if (productCategoryFilter) {
        params.categoryId = productCategoryFilter;
      }

      if (productBrandFilter) {
        params.brandId = productBrandFilter;
      }
      if (productSearchTerm.trim()) {
        params.searchTerm = productSearchTerm.trim();
      }

      // ONLY apply percentage filters if Requires Coupon is FALSE
      if (!formData.requiresCouponCode) {
        const campaignPercent = Number(formData.discountPercentage) || 0;
        if ((formData.discountType === "AssignedToProducts" || formData.discountType === "AssignedToCategories") && campaignPercent > 0) {
          params.exactDiscountPercentage = campaignPercent;
        } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
          params.maxDiscountPercentage = campaignPercent;
        }
      }

      const response = await productsService.getAll(params);
      const fetchedItems = extractProducts(response?.data || response);

      if (append) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = fetchedItems.filter((p: Product) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      } else {
        setProducts(fetchedItems);
      }

      if (fetchedItems.length < 20) {
        setHasMoreProducts(false);
      } else {
        setHasMoreProducts(true);
      }
    } catch (err) {
      console.error("Error fetching products list:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [productCategoryFilter, productBrandFilter, productSearchTerm, formData.discountType, formData.discountPercentage, formData.requiresCouponCode, formData.assignedCategoryIds.join(",")]);

  // Debounce discount percentage so rapid typing doesn't fire multiple API calls
  const discountPctRef = useRef(formData.discountPercentage);
  discountPctRef.current = formData.discountPercentage;
  const [debouncedPct, setDebouncedPct] = useState(initialData ? initialData.discountPercentage || 0 : 0);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPct(discountPctRef.current), 600);
    return () => clearTimeout(t);
  }, [formData.discountPercentage]);

  // Reset pagination on filter or discount criteria changes
  useEffect(() => {
    setProductPage(1);
    fetchProductsList(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategoryFilter, productBrandFilter, productSearchTerm, formData.discountType, debouncedPct, formData.requiresCouponCode, formData.assignedCategoryIds.join(",")]);

  // Handle page scrolling/loading more
  const handleLoadMore = () => {
    const nextPage = productPage + 1;
    setProductPage(nextPage);
    fetchProductsList(nextPage, true);
  };

  // Toggle selection
  const handleProductSelect = (product: Product) => {
    const isSelected = formData.assignedProductIds.includes(product.id);
    let newIds: string[];
    let newSelected: Product[];

    if (isSelected) {
      newIds = formData.assignedProductIds.filter(id => id !== product.id);
      newSelected = selectedProducts.filter(p => p.id !== product.id);
    } else {
      newIds = [...formData.assignedProductIds, product.id];
      newSelected = [...selectedProducts, product];
    }

    setFormData({ ...formData, assignedProductIds: newIds });
    setSelectedProducts(newSelected);
  };

  const selectAllShown = () => {
    const newIds = [...formData.assignedProductIds];
    const newSelected = [...selectedProducts];

    products.forEach(p => {
      if (!newIds.includes(p.id)) {
        newIds.push(p.id);
        newSelected.push(p);
      }
    });

    setFormData({ ...formData, assignedProductIds: newIds });
    setSelectedProducts(newSelected);
  };

  const clearAllSelected = () => {
    setFormData({ ...formData, assignedProductIds: [] });
    setSelectedProducts([]);
  };

  // Banner Actions
  const handleUploadBannerImage = async (discountId: string, file: File, type: "desktop" | "mobile") => {
    try {
      const res = await discountsService.uploadBannerImage(discountId, file, type);
      const json = res?.data as { success?: boolean; data?: string };
      if (json?.success && json?.data) {
        setFormData(prev => ({
          ...prev,
          [type === "desktop" ? "desktopBannerImageUrl" : "mobileBannerImageUrl"]: json.data,
        }));
      }
    } catch (err) {
      console.error("Banner upload failed:", err);
    }
  };

  const handleDeleteBannerImage = async (discountId: string, type: "desktop" | "mobile") => {
    try {
      const res = await discountsService.deleteBannerImage(discountId, type);
      const json = res?.data as { success?: boolean };
      if (json?.success) {
        setFormData(prev => ({
          ...prev,
          [type === "desktop" ? "desktopBannerImageUrl" : "mobileBannerImageUrl"]: null,
        }));
        if (type === "desktop") setDesktopFile(null);
        if (type === "mobile") setMobileFile(null);
      }
    } catch (err) {
      console.error("Banner delete failed:", err);
    }
  };

  // Previews
  const desktopPreview = useMemo(() => desktopFile ? URL.createObjectURL(desktopFile) : null, [desktopFile]);
  const mobilePreview = useMemo(() => mobileFile ? URL.createObjectURL(mobileFile) : null, [mobileFile]);

  // Submit Handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Discount name is required");
      setActiveTab("basic-info");
      return;
    }

    if ((formData.discountType === "AssignedToProducts" || formData.discountType === "UptoXPercent") && formData.assignedProductIds.length === 0) {
      toast.error("Please select at least one product");
      setActiveTab("assignment-value");
      return;
    }

    if (formData.requiresCouponCode && !formData.couponCode.trim()) {
      toast.error("Coupon code is required");
      setActiveTab("coupon-settings");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        assignedProductIds: formData.assignedProductIds.join(","),
        assignedCategoryIds: formData.assignedCategoryIds.join(","),
        assignedManufacturerIds: formData.assignedManufacturerIds.join(","),
      };

      if (isEdit && initialData) {
        // Upload images if changed during edit
        if (desktopFile) {
          await handleUploadBannerImage(initialData.id, desktopFile, "desktop");
        }
        if (mobileFile) {
          await handleUploadBannerImage(initialData.id, mobileFile, "mobile");
        }

        await discountsService.update(initialData.id, payload);
        toast.success("Discount updated successfully!");
      } else {
        const res = await discountsService.create(payload);
        const discountId = res?.data?.data?.id;

        if (!discountId) {
          toast.error("Failed to get discount ID");
          setIsSubmitting(false);
          return;
        }

        if (desktopFile) {
          await handleUploadBannerImage(discountId, desktopFile, "desktop");
        }
        if (mobileFile) {
          await handleUploadBannerImage(discountId, mobileFile, "mobile");
        }

        toast.success("Discount created successfully!");
      }

      router.push("/admin/discounts");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save discount");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hide coupon tab if requires coupon code is false
  const activeTabsList = useMemo(() => {
    const list = [
      { id: "basic-info", label: "Basic Information", icon: Info },
      { id: "assignment-value", label: "Assignment & Value", icon: Target },
      { id: "limits-validity", label: "Limits & Validity", icon: Calendar },
      { id: "banner-images", label: "Banner Images", icon: Monitor },
    ];
    if (formData.requiresCouponCode) {
      // Insert coupon-settings before banner-images
      list.splice(3, 0, { id: "coupon-settings", label: "Coupon Settings", icon: Tag });
    }
    return list;
  }, [formData.requiresCouponCode]);

  // Form validity validator to prevent invalid API calls
  const isFormInvalid = useMemo(() => {
    // 1. Basic name validation
    if (!formData.name.trim()) return true;

    // 2. Discount value validation
    if (formData.usePercentage) {
      const pct = Number(formData.discountPercentage) || 0;
      if (pct <= 0 || pct > 100) return true;
    } else {
      const amt = Number(formData.discountAmount) || 0;
      if (amt <= 0) return true;
    }

    // 3. Assignment selection validations
    if (formData.discountType === "AssignedToProducts" || formData.discountType === "UptoXPercent") {
      if (formData.assignedProductIds.length === 0) return true;
    }
    if (formData.discountType === "AssignedToCategories") {
      if (formData.assignedCategoryIds.length === 0) return true;
    }

    // 4. Coupon settings validation
    if (formData.requiresCouponCode && !formData.couponCode.trim()) return true;

    return false;
  }, [formData]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 px-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 py-3 px-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <h1 className="text-base font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <ArrowLeft
              className="h-4 w-4 text-slate-400 cursor-pointer hover:text-white transition-colors"
              onClick={() => router.push('/admin/discounts')}
            />
            {isEdit ? "Edit Discount" : "Create Discount"}
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isEdit ? "Modify discount details and assignments" : "Add a new discount to your store"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/discounts')}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isFormInvalid}
            className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none"
          >
            <Save className="h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Discount"}
          </button>
        </div>
      </div>

      {/* Tabs Menu Row */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        {activeTabsList.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${isActive
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* PANEL 1: BASIC INFO */}
        {activeTab === "basic-info" && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-400" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requires Coupon Code */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                    <Tag className="h-3.5 w-3.5 text-violet-400" />
                    Requires Coupon Code
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Must enter a coupon code during checkout to apply.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.requiresCouponCode}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        requiresCouponCode: checked,
                        couponCode: checked ? prev.couponCode : "",
                      }));
                      if (!checked && (activeTab as string) === "coupon-settings") {
                        setActiveTab("basic-info");
                      }
                    }}
                    className="sr-only"
                  />

                  <div
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 ${formData.requiresCouponCode ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                  >
                    <div
                      className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${formData.requiresCouponCode ? "translate-x-4" : ""
                        }`}
                    />
                  </div>
                </label>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                    <Info className="h-3.5 w-3.5 text-violet-400" />
                    Active Status
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Publish and enable this discount program.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                    className="sr-only"
                  />

                  <div
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 ${formData.isActive ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                  >
                    <div
                      className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${formData.isActive ? "translate-x-4" : ""
                        }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Discount Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Discount Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Winter Holiday Blowout"
                className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>

            {/* Admin Comment Editor */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Admin Comment (Internal description/rules)</label>
              <div className="border border-slate-750 rounded-xl overflow-hidden min-h-[150px]">
                <ProductDescriptionEditor
                  value={formData.adminComment}
                  onChange={(val) => setFormData({ ...formData, adminComment: val })}
                />
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: ASSIGNMENT & VALUE */}
        {activeTab === "assignment-value" && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-400" />
              Assignment & Value
            </h2>

            {/* Helper alert matching senior's screenshot text */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl text-xs text-slate-300">
              Set the discount value first — the product picker below will only show items (or variants) that already match it.
            </div>

            {/* Value mode (Percentage vs Fixed) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, usePercentage: true, discountAmount: 0 })}
                className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all ${formData.usePercentage
                  ? "bg-violet-600/10 border-violet-500 text-white shadow-lg shadow-violet-500/10"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.usePercentage ? "border-violet-500 bg-violet-600" : "border-slate-600"}`}>
                  {formData.usePercentage && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                </div>
                <div>
                  <p className="font-semibold text-sm">Percentage</p>
                  <p className="text-[11px] text-slate-500">Discount by percentage</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, usePercentage: false, discountPercentage: 0 })}
                className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all ${!formData.usePercentage
                  ? "bg-violet-600/10 border-violet-500 text-white shadow-lg shadow-violet-500/10"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${!formData.usePercentage ? "border-violet-500 bg-violet-600" : "border-slate-600"}`}>
                  {!formData.usePercentage && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                </div>
                <div>
                  <p className="font-semibold text-sm">Fixed Amount</p>
                  <p className="text-[11px] text-slate-500">Discount by fixed amount</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Discount Type *</label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) => {
                    const val = e.target.value as DiscountType;
                    setFormData(prev => ({
                      ...prev,
                      discountType: val,
                      assignedProductIds: [],
                      assignedCategoryIds: [],
                      assignedManufacturerIds: []
                    }));
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  <option value="AssignedToProducts">Assigned to products</option>
                  <option value="AssignedToCategories">Assigned to categories</option>
                  <option value="UptoXPercent">Up to X% Discount</option>
                </select>
              </div>

              {/* Discount Value Inputs */}
              {formData.usePercentage ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Discount Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formData.discountPercentage || ""}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) || 0 })}
                      placeholder="e.g. 20"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Discount Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">£</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountAmount || ""}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) || 0 })}
                      placeholder="e.g. 10.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category selection */}
            {formData.discountType === "AssignedToCategories" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Categories *</label>
                <Select
                  isMulti
                  options={categoryOptions}
                  value={categoryOptions.filter(opt => formData.assignedCategoryIds.includes(opt.value))}
                  onChange={(selectedOptions) => setFormData({
                    ...formData,
                    assignedCategoryIds: selectedOptions ? selectedOptions.map(opt => opt.value) : [],
                    assignedProductIds: [] // clear products
                  })}
                  placeholder="Select categories..."
                  isSearchable
                  styles={customSelectStyles}
                  className="react-select-container text-xs"
                  classNamePrefix="react-select"
                />
              </div>
            )}

            {(formData.discountType === "AssignedToProducts" || formData.discountType === "UptoXPercent" || (formData.discountType === "AssignedToCategories" && formData.assignedCategoryIds.length > 0)) && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-305">
                  Select Products <span className="text-xs text-slate-500 font-normal">* Choose which products this discount applies to</span>
                </label>

                {/* Wide Matching products container card */}
                <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 space-y-3">
                  {/* Top line header info */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div>
                      <h3 className="text-xs font-semibold text-white">Matching products</h3>
                      <p className="text-[10px] text-slate-500">Check the products (or variants) this discount should apply to.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-violet-400 font-bold shrink-0 mr-2">
                        {products.length} products
                      </span>
                      <button
                        type="button"
                        onClick={selectAllShown}
                        className="text-[10px] text-violet-405 hover:text-violet-300 transition-colors font-medium border border-violet-500/20 px-2 py-0.5 rounded-lg bg-violet-500/5"
                      >
                        Select all shown
                      </button>
                      <button
                        type="button"
                        onClick={clearAllSelected}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium border border-red-500/20 px-2 py-0.5 rounded-lg bg-red-500/5"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Filters / Search bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        placeholder="Search matching products by name..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-950/40 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.discountType !== "AssignedToCategories" && (
                        <Select
                          isClearable
                          options={categoryOptions}
                          value={categoryOptions.find(opt => opt.value === productCategoryFilter) || null}
                          onChange={(opt) => setProductCategoryFilter(opt?.value || "")}
                          placeholder="Category..."
                          styles={customSelectStyles}
                          className="react-select-container text-[11px]"
                          classNamePrefix="react-select"
                        />
                      )}
                      <Select
                        isClearable
                        options={brandOptions}
                        value={brandOptions.find(opt => opt.value === productBrandFilter) || null}
                        onChange={(opt) => setProductBrandFilter(opt?.value || "")}
                        placeholder="Brand..."
                        styles={customSelectStyles}
                        className={`react-select-container text-[11px] ${formData.discountType === "AssignedToCategories" ? "col-span-2" : ""}`}
                        classNamePrefix="react-select"
                      />
                    </div>
                  </div>

                  {/* Product Scroll List with compact full-width rows */}
                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1.5">
                    {productsLoading && productPage === 1 ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-500">Loading products list...</p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-900/10 border border-slate-900 rounded-xl">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No matching products found</p>
                        <p className="text-xs text-slate-600">Try adjusting your filters or discount percentage</p>
                      </div>
                    ) : (
                      <>
                        {products.flatMap(product => {
                          const { hasConflict, uniqueConflicts, isAssignedToCurrentDiscount } = checkProductConflicts(product.id);
                          const isDisabled = false; // Bypass disabling for campaign conflicts

                          if (product.variants && product.variants.length > 0) {
                            return product.variants.map((v: any) => {
                              const isSelected = formData.assignedProductIds.includes(product.id);
                              const imageUrl = v.imageUrl || getProductImage(product.images || []);
                              const hasVarDiscount = v.discountPercentage > 0 || (v.sellPrice && v.price > v.sellPrice);

                              return (
                                <div
                                  key={v.id}
                                  onClick={(e) => {
                                    if (isDisabled) return;
                                    if ((e.target as HTMLElement).tagName === "INPUT") return;
                                    handleProductSelect(product);
                                  }}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                                    ? "bg-violet-950/20 border-violet-500/40"
                                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => handleProductSelect(product)}
                                    className="w-4 h-4 rounded border-slate-700 text-violet-500 focus:ring-violet-500 bg-slate-950 cursor-pointer shrink-0"
                                  />

                                  <div className="w-9 h-9 rounded overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                                    {imageUrl ? (
                                      <img src={getImageUrl(imageUrl)} alt={v.name || product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600 font-medium">No Img</div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{v.name || product.name}</p>
                                    <p className="text-[10px] text-slate-500">SKU: {v.sku || product.sku || "N/A"}</p>
                                  </div>

                                  {/* Stock & Pricing aligned right */}
                                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                                    {isAssignedToCurrentDiscount && isEdit && (
                                      <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded text-[9px] font-bold">
                                        Current
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-semibold">
                                      Stock {v.stockQuantity ?? 0}
                                    </span>
                                    {hasVarDiscount ? (
                                      <>
                                        <span className="text-[11px] text-red-500 line-through">£{v.price}</span>
                                        <span className="text-xs font-semibold text-emerald-400">£{v.sellPrice}</span>
                                        <span className="px-1.5 py-0.5 bg-orange-600 text-white border border-orange-700 rounded text-[9px] font-bold dark:bg-orange-400 dark:text-slate-950 dark:border-orange-300">
                                          {v.discountPercentage}% OFF
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-semibold text-emerald-400">£{v.price}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          }

                          // Simple product
                          const isSelected = formData.assignedProductIds.includes(product.id);
                          const imageUrl = getProductImage(product.images || []);

                          return (
                            <div
                              key={product.id}
                              onClick={(e) => {
                                if (isDisabled) return;
                                if ((e.target as HTMLElement).tagName === "INPUT") return;
                                handleProductSelect(product);
                              }}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                                ? "bg-violet-950/20 border-violet-500/40"
                                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => handleProductSelect(product)}
                                className="w-4 h-4 rounded border-slate-700 text-violet-500 focus:ring-violet-500 bg-slate-950 cursor-pointer shrink-0"
                              />

                              <div className="w-9 h-9 rounded overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                                {imageUrl ? (
                                  <img src={getImageUrl(imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600 font-medium">No Img</div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                                <p className="text-[10px] text-slate-500">SKU: {product.sku || "N/A"}</p>
                              </div>

                              {/* Stock & Pricing aligned right */}
                              <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                                {isAssignedToCurrentDiscount && isEdit && (
                                  <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded text-[9px] font-bold">
                                    Current
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-semibold">
                                  Stock {product.stockQuantity ?? 0}
                                </span>
                                {product.discountPercentage > 0 ? (
                                  <>
                                    <span className="text-[11px] text-red-500 line-through">£{product.price}</span>
                                    <span className="text-xs font-semibold text-emerald-400">£{product.sellPrice}</span>
                                    <span className="px-1.5 py-0.5 bg-orange-600 text-white border border-orange-700 rounded text-[9px] font-bold dark:bg-orange-400 dark:text-slate-950 dark:border-orange-300">
                                      {product.discountPercentage}% OFF
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-400">£{product.price}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {hasMoreProducts && (
                          <div className="pt-2 flex justify-center">
                            <button
                              type="button"
                              onClick={handleLoadMore}
                              disabled={productsLoading}
                              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              {productsLoading && (
                                <div className="w-3.5 h-3.5 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
                              )}
                              Load More Products
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: LIMITS & VALIDITY */}
        {activeTab === "limits-validity" && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-400" />
              Limits & Validity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Start Date *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-955/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">End Date *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-955/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Limitation Type *</label>
                <select
                  value={formData.discountLimitation}
                  onChange={(e) => setFormData({ ...formData, discountLimitation: e.target.value as DiscountLimitationType, limitationTimes: null })}
                  className="w-full px-3 py-2.5 bg-slate-955/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                >
                  <option value="Unlimited">Unlimited</option>
                  <option value="NTimesOnly">N Times Only</option>
                  <option value="NTimesPerCustomer">N Times Per Customer</option>
                </select>
              </div>
            </div>

            {formData.discountLimitation !== "Unlimited" && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Limitation Times *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.limitationTimes || ""}
                  onChange={(e) => setFormData({ ...formData, limitationTimes: Number(e.target.value) || null })}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2.5 bg-slate-955/40 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: COUPON SETTINGS (Only visible if requiresCouponCode is true) */}
        {activeTab === "coupon-settings" && formData.requiresCouponCode && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-violet-400" />
              Coupon Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full px-3 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl self-end h-[46px]">
                <label htmlFor="isCumulative" className="text-sm font-semibold text-white cursor-pointer select-none">
                  Cumulative (Can combine with other discounts)
                </label>
                <input
                  type="checkbox"
                  id="isCumulative"
                  checked={formData.isCumulative}
                  onChange={(e) => setFormData({ ...formData, isCumulative: e.target.checked })}
                  className="w-4 h-4 text-violet-600 bg-slate-955 border-slate-750 rounded focus:ring-violet-500 focus:ring-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* PANEL 5: BANNER IMAGES */}
        {activeTab === "banner-images" && (
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Monitor className="h-4 w-4 text-violet-400" />
              Banner Images
            </h2>

            <div className="space-y-4">
              {/* DESKTOP BANNER */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Desktop Banner Image</label>
                {desktopPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-violet-500 bg-slate-950 p-1.5">
                    <img src={desktopPreview} alt="Desktop Preview" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setDesktopFile(null)}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : formData.desktopBannerImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5">
                    <img src={getImageUrl(formData.desktopBannerImageUrl)} alt="Desktop Banner" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleDeleteBannerImage(initialData!.id, "desktop")}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all bg-slate-955/20">
                    <Upload size={18} className="text-slate-500 mb-0.5" />
                    <span className="text-[10px] text-slate-500">Upload Desktop Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (isEdit && initialData) {
                            handleUploadBannerImage(initialData.id, file, "desktop");
                          } else {
                            setDesktopFile(file);
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* MOBILE BANNER */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Mobile Banner Image</label>
                {mobilePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-violet-500 bg-slate-955 p-1.5">
                    <img src={mobilePreview} alt="Mobile Preview" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setMobileFile(null)}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : formData.mobileBannerImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5">
                    <img src={getImageUrl(formData.mobileBannerImageUrl)} alt="Mobile Banner" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleDeleteBannerImage(initialData!.id, "mobile")}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 transition-all bg-slate-955/20">
                    <Upload size={18} className="text-slate-500 mb-0.5" />
                    <span className="text-[10px] text-slate-500">Upload Mobile Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (isEdit && initialData) {
                            handleUploadBannerImage(initialData.id, file, "mobile");
                          } else {
                            setMobileFile(file);
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <p className="text-[9px] text-slate-550">Recommended sizes: Desktop 1200×400px, Mobile 600×300px</p>
          </div>
        )}
      </div>
    </div>
  );
}
