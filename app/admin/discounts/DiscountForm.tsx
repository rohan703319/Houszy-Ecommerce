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
  discountAmount: number | "";
  discountPercentage: number | "";
  maximumDiscountAmount: number | null | "";
  startDate: string;
  endDate: string;
  requiresCouponCode: boolean;
  couponCode: string;
  isCumulative: boolean;
  discountLimitation: DiscountLimitationType;
  limitationTimes: number | null | "";
  maximumDiscountedQuantity: number | null | "";
  appliedToSubOrders: boolean;
  buyQuantity?: number | null | "";
  getQuantity?: number | null | "";
  tiers?: { id?: string; quantity: number | ""; discountPercentage: number | "" }[];
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

const getNowDateTimeString = (offsetDays = 0): string => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const defaultFormData: FormData = {
  name: "",
  isActive: true,
  discountType: "AssignedToProducts",
  usePercentage: true,
  discountAmount: "",
  discountPercentage: "",
  maximumDiscountAmount: null,
  startDate: getNowDateTimeString(0),
  endDate: "",
  requiresCouponCode: false,
  couponCode: "",
  isCumulative: false,
  discountLimitation: "Unlimited",
  limitationTimes: null,
  maximumDiscountedQuantity: null,
  appliedToSubOrders: false,
  buyQuantity: "",
  getQuantity: "",
  tiers: [{ quantity: "", discountPercentage: "" }],
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
        discountAmount: (initialData.discountAmount !== undefined && initialData.discountAmount !== null) ? initialData.discountAmount : "",
        discountPercentage: (initialData.discountPercentage !== undefined && initialData.discountPercentage !== null) ? initialData.discountPercentage : "",
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
        buyQuantity: (initialData as any).buyQuantity ?? "",
        getQuantity: (initialData as any).getQuantity ?? "",
        tiers: (initialData as any).tiers && (initialData as any).tiers.length > 0
          ? (initialData as any).tiers.map((t: any) => ({
              ...(t.id ? { id: t.id } : {}),
              quantity: t.quantity ?? "",
              discountPercentage: t.discountPercentage ?? ""
            }))
          : [{ quantity: "", discountPercentage: "" }],
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
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
  const [onlyShowSelected, setOnlyShowSelected] = useState<boolean>(() => {
    return Boolean(isEdit && initialData?.assignedProductIds && initialData.assignedProductIds.trim().length > 0);
  });

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
        discountAmount: (initialData.discountAmount !== undefined && initialData.discountAmount !== null) ? initialData.discountAmount : "",
        discountPercentage: (initialData.discountPercentage !== undefined && initialData.discountPercentage !== null) ? initialData.discountPercentage : "",
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
        buyQuantity: (initialData as any).buyQuantity ?? "",
        getQuantity: (initialData as any).getQuantity ?? "",
        tiers: (initialData as any).tiers && (initialData as any).tiers.length > 0
          ? (initialData as any).tiers.map((t: any) => ({
              id: t.id,
              quantity: t.quantity ?? "",
              discountPercentage: t.discountPercentage ?? ""
            }))
          : [{ quantity: "", discountPercentage: "" }],
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
      if (initialData.id) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        fetch(`${baseUrl}/api/Products/discounted?discountId=${initialData.id}&page=1&pageSize=100`)
          .then(res => res.ok ? res.json() : null)
          .then(json => {
            const items = json?.data?.items || [];
            if (Array.isArray(items) && items.length > 0) {
              setAssignedProducts(items);
              setSelectedProducts(items);
            } else {
              const ids = initialData.assignedProductIds
                ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
                : [];
              if (ids.length > 0) {
                Promise.all(ids.map(id => productsService.getById(id).catch(() => null)))
                  .then(results => {
                    const validProducts = results.map(res => res?.data?.data).filter((p): p is Product => !!p);
                    if (validProducts.length > 0) {
                      setAssignedProducts(validProducts);
                      setSelectedProducts(validProducts);
                    }
                  })
                  .catch(err => console.error("Error loading assigned products fallback:", err));
              }
            }
          })
          .catch(err => {
            console.error("Error loading assigned products detail:", err);
            const ids = initialData.assignedProductIds
              ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
              : [];
            if (ids.length > 0) {
              Promise.all(ids.map(id => productsService.getById(id).catch(() => null)))
                .then(results => {
                  const validProducts = results.map(res => res?.data?.data).filter((p): p is Product => !!p);
                  if (validProducts.length > 0) {
                    setAssignedProducts(validProducts);
                    setSelectedProducts(validProducts);
                  }
                })
                .catch(e => console.error("Error loading assigned products fallback:", e));
            }
          });
      } else {
        const ids = initialData.assignedProductIds
          ? initialData.assignedProductIds.split(",").map(id => id.trim()).filter(Boolean)
          : [];
        if (ids.length > 0) {
          Promise.all(ids.map(id => productsService.getById(id).catch(() => null)))
            .then(results => {
              const validProducts = results.map(res => res?.data?.data).filter((p): p is Product => !!p);
              setSelectedProducts(validProducts);
              setAssignedProducts(validProducts);
            })
            .catch(err => console.error("Error loading assigned products detail:", err));
        }
      }
    }
  }, [initialData]);

  // When assigned products are loaded on edit, prioritize them at the top of the products list
  useEffect(() => {
    if (assignedProducts.length > 0) {
      setProducts(prev => {
        const assignedIds = new Set(assignedProducts.map(p => p.id));
        const nonAssignedPrev = prev.filter(p => !assignedIds.has(p.id));
        return [...assignedProducts, ...nonAssignedPrev];
      });
    }
  }, [assignedProducts]);

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
    assignedProducts.forEach(p => map.set(p.id, p));
    return map;
  }, [products, selectedProducts, assignedProducts]);

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

      // Apply percentage or max price filters
      const campaignPercent = Number(formData.discountPercentage) || 0;
      const campaignAmount = Number(formData.discountAmount) || 0;

      if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
        params.exactSellPrice = campaignAmount;
      } else if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
        params.maxSellPrice = campaignAmount;
      } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
        params.maxDiscountPercentage = campaignPercent;
      } else if (!formData.requiresCouponCode && campaignPercent > 0 && (formData.discountType === "AssignedToProducts" || formData.discountType === "AssignedToCategories")) {
        params.exactDiscountPercentage = campaignPercent;
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
        if (!productSearchTerm.trim() && !productCategoryFilter && !productBrandFilter && assignedProducts.length > 0) {
          const assignedIds = new Set(assignedProducts.map(p => p.id));
          const nonAssignedFetched = fetchedItems.filter((p: Product) => !assignedIds.has(p.id));
          setProducts([...assignedProducts, ...nonAssignedFetched]);
        } else {
          setProducts(fetchedItems);
        }
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
  }, [productCategoryFilter, productBrandFilter, productSearchTerm, formData.discountType, formData.discountPercentage, formData.discountAmount, formData.requiresCouponCode, formData.assignedCategoryIds.join(","), assignedProducts]);

  // Debounce discount percentage and discount amount so rapid typing doesn't fire multiple API calls
  const discountPctRef = useRef(formData.discountPercentage);
  discountPctRef.current = formData.discountPercentage;
  const [debouncedPct, setDebouncedPct] = useState<number | "">(initialData ? initialData.discountPercentage || 0 : 0);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPct(discountPctRef.current), 600);
    return () => clearTimeout(t);
  }, [formData.discountPercentage]);

  const discountAmtRef = useRef(formData.discountAmount);
  discountAmtRef.current = formData.discountAmount;
  const [debouncedAmt, setDebouncedAmt] = useState<number | "">(initialData ? initialData.discountAmount || 0 : 0);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmt(discountAmtRef.current), 600);
    return () => clearTimeout(t);
  }, [formData.discountAmount]);

  // Reset pagination on filter or discount criteria changes
  useEffect(() => {
    setProductPage(1);
    fetchProductsList(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategoryFilter, productBrandFilter, productSearchTerm, formData.discountType, debouncedPct, debouncedAmt, formData.requiresCouponCode, formData.assignedCategoryIds.join(",")]);

  // Handle page scrolling/loading more
  const handleLoadMore = () => {
    const nextPage = productPage + 1;
    setProductPage(nextPage);
    fetchProductsList(nextPage, true);
  };

  // Toggle selection for product or individual variant
  const handleItemSelect = (id: string, product: Product) => {
    const isSelected = formData.assignedProductIds.includes(id);
    let newIds: string[];
    let newSelected: Product[];

    if (isSelected) {
      newIds = formData.assignedProductIds.filter(assignedId => assignedId !== id);
      const hasOtherVariantSelected = product.variants?.some((v: any) => newIds.includes(v.id));
      if (!newIds.includes(product.id) && !hasOtherVariantSelected) {
        newSelected = selectedProducts.filter(p => p.id !== product.id);
      } else {
        newSelected = selectedProducts;
      }
    } else {
      // Validate item eligibility if UptoXPercent
      const campaignPercent = Number(formData.discountPercentage) || 0;
      if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
        const v = product.variants?.find((itemVar: any) => itemVar.id === id);
        const pct = v ? (v.discountPercentage ?? 0) : (product.discountPercentage ?? 0);
        if (pct < 1 || pct > campaignPercent) {
          toast.error(`This item has ${pct}% discount, which is not between 1% and ${campaignPercent}%`);
          return;
        }
      }

      newIds = [...formData.assignedProductIds, id];
      newSelected = selectedProducts.some(p => p.id === product.id)
        ? selectedProducts
        : [...selectedProducts, product];
    }

    setFormData({ ...formData, assignedProductIds: newIds });
    setSelectedProducts(newSelected);
  };

  // Prioritize products that have selected variants/products at the top of the list
  const sortedProductsToRender = useMemo(() => {
    const combined = [...products];
    const existingIds = new Set(combined.map(p => p.id));
    assignedProducts.forEach(p => {
      if (!existingIds.has(p.id)) {
        combined.unshift(p);
        existingIds.add(p.id);
      }
    });

    let list = combined;
    if (onlyShowSelected) {
      list = list.filter(p =>
        formData.assignedProductIds.includes(p.id) ||
        (p.variants && p.variants.some((v: any) => formData.assignedProductIds.includes(v.id)))
      );
    }
    return [...list].sort((a, b) => {
      const aHasSelected = formData.assignedProductIds.includes(a.id) ||
        (a.variants && a.variants.some((v: any) => formData.assignedProductIds.includes(v.id)));
      const bHasSelected = formData.assignedProductIds.includes(b.id) ||
        (b.variants && b.variants.some((v: any) => formData.assignedProductIds.includes(v.id)));

      if (aHasSelected && !bHasSelected) return -1;
      if (!aHasSelected && bHasSelected) return 1;
      return 0;
    });
  }, [products, assignedProducts, formData.assignedProductIds, onlyShowSelected]);

  const selectAllShown = () => {
    const newIds = [...formData.assignedProductIds];
    const newSelected = [...selectedProducts];
    const campaignAmount = Number(formData.discountAmount) || 0;
    const campaignPercent = Number(formData.discountPercentage) || 0;

    sortedProductsToRender.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        const eligibleVars = p.variants.filter((v: any) => {
          if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
            const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
            return vSell === campaignAmount;
          }
          if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
            const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
            return vSell <= campaignAmount;
          }
          if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
            const vPct = v.discountPercentage ?? 0;
            return vPct >= 1 && vPct <= campaignPercent;
          }
          return true;
        });
        eligibleVars.forEach((v: any) => {
          if (!newIds.includes(v.id)) {
            newIds.push(v.id);
          }
        });
        if (eligibleVars.length > 0 && !newSelected.some(sp => sp.id === p.id)) {
          newSelected.push(p);
        }
      } else {
        if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
          const pSell = (p.sellPrice !== undefined && p.sellPrice !== null && p.sellPrice > 0) ? p.sellPrice : (p.price ?? 0);
          if (pSell !== campaignAmount) return;
        } else if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
          const pSell = (p.sellPrice !== undefined && p.sellPrice !== null && p.sellPrice > 0) ? p.sellPrice : (p.price ?? 0);
          if (pSell > campaignAmount) return;
        } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
          const pPct = p.discountPercentage ?? 0;
          if (pPct < 1 || pPct > campaignPercent) return;
        }
        if (!newIds.includes(p.id)) {
          newIds.push(p.id);
        }
        if (!newSelected.some(sp => sp.id === p.id)) {
          newSelected.push(p);
        }
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

    if (formData.discountType === "FixedPrice" && (!formData.discountAmount || Number(formData.discountAmount) <= 0)) {
      toast.error("Please enter a valid price for Fixed Price discount");
      setActiveTab("assignment-value");
      return;
    }

    if (formData.discountType === "UptoXPrice" && (!formData.discountAmount || Number(formData.discountAmount) <= 0)) {
      toast.error("Please enter a valid price for Up to £X discount");
      setActiveTab("assignment-value");
      return;
    }

    if (formData.discountType === "BuyXGetY") {
      if (!formData.buyQuantity || Number(formData.buyQuantity) < 1) {
        toast.error("Please enter a valid Buy quantity (at least 1)");
        setActiveTab("assignment-value");
        return;
      }
      if (!formData.getQuantity || Number(formData.getQuantity) < 1) {
        toast.error("Please enter a valid Get quantity (at least 1)");
        setActiveTab("assignment-value");
        return;
      }
      if (!formData.discountPercentage || Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 100) {
        toast.error("Please enter a valid discount percentage (1-100%)");
        setActiveTab("assignment-value");
        return;
      }
    }

    if (formData.discountType === "TieredQuantity") {
      if (formData.assignedProductIds.length === 0) {
        toast.error("Please select at least one product for Tiered Quantity discount");
        setActiveTab("assignment-value");
        return;
      }
      if (!formData.tiers || formData.tiers.length === 0) {
        toast.error("Please add at least one quantity tier");
        setActiveTab("assignment-value");
        return;
      }
      for (let i = 0; i < formData.tiers.length; i++) {
        const tier = formData.tiers[i];
        if (!tier.quantity || Number(tier.quantity) < 1) {
          toast.error(`Tier #${i + 1}: Quantity must be at least 1`);
          setActiveTab("assignment-value");
          return;
        }
        if (tier.discountPercentage === undefined || tier.discountPercentage === "" || Number(tier.discountPercentage) <= 0 || Number(tier.discountPercentage) > 100) {
          toast.error(`Tier #${i + 1}: Discount percentage must be between 1% and 100%`);
          setActiveTab("assignment-value");
          return;
        }
      }
    }

    if (formData.requiresCouponCode && !formData.couponCode.trim()) {
      toast.error("Coupon code is required");
      setActiveTab("coupon-settings");
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizeDateTime = (val: string | null | undefined, isEnd = false): string | null => {
        if (!val) return null;
        const trimmed = val.trim();
        if (!trimmed) return null;
        if (trimmed.length === 10) {
          return isEnd ? `${trimmed}T23:59:59` : `${trimmed}T00:00:00`;
        }
        return trimmed;
      };

      const payload = {
        ...formData,
        discountAmount: Number(formData.discountAmount) || 0,
        discountPercentage: Number(formData.discountPercentage) || 0,
        usePercentage: (formData.discountType === "FixedPrice" || formData.discountType === "UptoXPrice") ? false : true,
        buyQuantity: formData.discountType === "BuyXGetY" ? (Number(formData.buyQuantity) || 1) : null,
        getQuantity: formData.discountType === "BuyXGetY" ? (Number(formData.getQuantity) || 1) : null,
        tiers: formData.discountType === "TieredQuantity"
          ? (formData.tiers || []).map(t => ({
              ...(t.id ? { id: t.id } : {}),
              quantity: Number(t.quantity),
              discountPercentage: Number(t.discountPercentage),
            }))
          : [],
        startDate: sanitizeDateTime(formData.startDate, false),
        endDate: sanitizeDateTime(formData.endDate, true),
        couponCode: formData.requiresCouponCode ? (formData.couponCode?.trim() || null) : null,
        limitationTimes: formData.discountLimitation === "Unlimited" ? null : (formData.limitationTimes ? Number(formData.limitationTimes) : null),
        maximumDiscountAmount: formData.maximumDiscountAmount ? Number(formData.maximumDiscountAmount) : null,
        maximumDiscountedQuantity: formData.maximumDiscountedQuantity ? Number(formData.maximumDiscountedQuantity) : null,
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

        const res = await discountsService.update(initialData.id, payload as any);
        if (res?.error || (res as any)?.status >= 400 || (res as any)?.data?.success === false) {
          const errMsg = res?.error || (res as any)?.data?.message || "Failed to update discount";
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }
        toast.success("Discount updated successfully!");
        router.push("/admin/discounts");
      } else {
        const res = await discountsService.create(payload as any);
        console.log("Create discount response:", res);

        if (res?.error || (res as any)?.status >= 400 || (res as any)?.data?.success === false) {
          const errMsg = res?.error || (res as any)?.data?.message || "Failed to create discount";
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }

        const discountId =
          (res as any)?.data?.data?.id ||
          (res as any)?.data?.data?.Id ||
          (res as any)?.data?.id ||
          (res as any)?.data?.Id ||
          (res as any)?.id ||
          (res as any)?.Id;

        if (!discountId) {
          const errMsg = (res as any)?.data?.message || (res as any)?.message || "Failed to get discount ID";
          toast.error(errMsg);
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
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to save discount";
      toast.error(errMsg);
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
    if (formData.discountType === "TieredQuantity") {
      if (!formData.tiers || formData.tiers.length === 0) return true;
      if (formData.tiers.some(t => t.quantity === "" || Number(t.quantity) < 1 || t.discountPercentage === "" || Number(t.discountPercentage) <= 0 || Number(t.discountPercentage) > 100)) return true;
      if (formData.assignedProductIds.length === 0) return true;
    } else if (formData.discountType === "BuyXGetY") {
      if (formData.buyQuantity === "" || Number(formData.buyQuantity) < 1) return true;
      if (formData.getQuantity === "" || Number(formData.getQuantity) < 1) return true;
      if (formData.discountPercentage === "" || Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 100) return true;
    } else if (formData.discountType === "FixedPrice" || formData.discountType === "UptoXPrice") {
      if (formData.discountAmount === "" || Number(formData.discountAmount) <= 0) return true;
    } else if (formData.usePercentage) {
      if (formData.discountPercentage === "" || Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 100) return true;
    } else {
      if (formData.discountAmount === "" || Number(formData.discountAmount) <= 0) return true;
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/40 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ArrowLeft
              className="h-4 w-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              onClick={() => router.push('/admin/discounts')}
            />
            {isEdit ? "Edit Discount" : "Create Discount"}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Modify discount details and assignments" : "Add a new discount to your store"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/discounts')}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all border border-slate-200 dark:border-slate-700/50 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isFormInvalid}
            className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-700 dark:disabled:to-slate-800 disabled:shadow-none"
          >
            <Save className="h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Discount"}
          </button>
        </div>
      </div>

      {/* Tabs Menu Row */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
        {activeTabsList.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${isActive
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/40"
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
          <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requires Coupon Code */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <Tag className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    Requires Coupon Code
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 ${formData.requiresCouponCode ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"
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
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    <Info className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    Active Status
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    className={`relative w-10 h-6 rounded-full transition-all duration-300 ${formData.isActive ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"
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
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Discount Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Winter Holiday Blowout"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
              />
            </div>

            {/* Admin Comment Editor */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Admin Comment (Internal description/rules)</label>
              <div className="border border-slate-300 dark:border-slate-750 rounded-xl overflow-hidden min-h-[150px]">
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
          <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Assignment & Value
            </h2>

            {/* Helper alert matching senior's screenshot text */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-950 dark:text-amber-200 font-semibold shadow-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Set the discount value first — the product picker below will only show items (or variants) that already match it.</span>
            </div>

            {/* Value mode (Percentage vs Fixed) - Only for standard product/category discounts */}
            {formData.discountType !== "UptoXPercent" && formData.discountType !== "UptoXPrice" && formData.discountType !== "FixedPrice" && formData.discountType !== "BuyXGetY" && formData.discountType !== "TieredQuantity" && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, usePercentage: true, discountAmount: "" })}
                  className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all ${formData.usePercentage
                    ? "bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-sm"
                    : "bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.usePercentage ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {formData.usePercentage && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Percentage</p>
                    <p className="text-[11px] text-slate-500">Discount by percentage</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, usePercentage: false, discountPercentage: "" })}
                  className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all ${!formData.usePercentage
                    ? "bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-sm"
                    : "bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${!formData.usePercentage ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {!formData.usePercentage && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Fixed Amount</p>
                    <p className="text-[11px] text-slate-500">Discount by fixed amount</p>
                  </div>
                </button>
              </div>
            )}

            <div className={`grid gap-4 ${(formData.discountType === "BuyXGetY" || formData.discountType === "TieredQuantity") ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Discount Type *</label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) => {
                    const val = e.target.value as DiscountType;
                    setFormData(prev => ({
                      ...prev,
                      discountType: val,
                      usePercentage: (val === "UptoXPrice" || val === "FixedPrice") ? false : true,
                      buyQuantity: val === "BuyXGetY" ? (prev.buyQuantity ?? "") : prev.buyQuantity,
                      getQuantity: val === "BuyXGetY" ? (prev.getQuantity ?? "") : prev.getQuantity,
                      tiers: val === "TieredQuantity" ? (prev.tiers && prev.tiers.length > 0 ? prev.tiers : [{ quantity: "", discountPercentage: "" }]) : prev.tiers,
                      discountPercentage: prev.discountPercentage,
                      assignedProductIds: [],
                      assignedCategoryIds: [],
                      assignedManufacturerIds: []
                    }));
                  }}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                >
                  <option value="AssignedToProducts">Assigned to products</option>
                  <option value="AssignedToCategories">Assigned to categories</option>
                  <option value="UptoXPercent">Up to X% (umbrella)</option>
                  <option value="UptoXPrice">Up to £X (price umbrella)</option>
                  <option value="FixedPrice">Fixed Price (e.g. "£10 Tuesday")</option>
                  <option value="BuyXGetY">Buy X Get Y % Off (e.g. "Buy 1 Get 2nd at 50% Off")</option>
                  <option value="TieredQuantity">Tiered Quantity Discount (e.g. "Buy More, Save More")</option>
                </select>
              </div>

              {/* Discount Value Inputs */}
              {formData.discountType === "TieredQuantity" ? (
                <div className="space-y-4">
                  {/* Callout Notice */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-bold text-sm">
                      <span>📦 Tiered Quantity Discount (&quot;Buy More, Save More&quot;)</span>
                    </div>
                    <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-medium">
                      Encourage bulk purchases with tiered quantity discounts (e.g., Buy 3+ get 10% off each, Buy 5+ get 20% off each). When a tier threshold is reached, all units of the eligible product receive that tier&apos;s discount percentage.
                    </p>
                  </div>

                  {/* Tiers Configuration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                        Quantity Tiers *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentTiers = formData.tiers || [];
                          setFormData({
                            ...formData,
                            tiers: [
                              ...currentTiers,
                              { quantity: "", discountPercentage: "" }
                            ]
                          });
                        }}
                        className="px-3 py-1 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 rounded-lg font-semibold transition-all flex items-center gap-1 shadow-sm"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(formData.tiers || []).map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 w-16">Tier #{idx + 1}</span>
                          <div className="flex-1">
                            <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1">Buy Quantity (min units) *</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={tier.quantity ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const newTiers = [...(formData.tiers || [])];
                                newTiers[idx] = { ...newTiers[idx], quantity: raw === "" ? "" : (parseInt(raw) || "") };
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                              placeholder="e.g. 3"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1">Discount % Off *</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="0.1"
                                value={tier.discountPercentage ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const newTiers = [...(formData.tiers || [])];
                                  newTiers[idx] = {
                                    ...newTiers[idx],
                                    discountPercentage: raw === "" ? "" : (parseFloat(raw) || "")
                                  };
                                  setFormData({ ...formData, tiers: newTiers });
                                }}
                                className="w-full pl-3 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                                placeholder="e.g. 10"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-semibold">%</span>
                            </div>
                          </div>
                          <div className="pt-5">
                            <button
                              type="button"
                              disabled={(formData.tiers || []).length <= 1}
                              onClick={() => {
                                const newTiers = (formData.tiers || []).filter((_, i) => i !== idx);
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-red-500/10 transition-all"
                              title="Remove tier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Preview Callout */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed shadow-sm">
                      <div className="text-amber-700 dark:text-amber-400 shrink-0 text-base">ℹ️</div>
                      <div>
                        <span className="font-bold text-amber-950 dark:text-amber-300">Customer experience: </span>
                        {(formData.tiers || []).some(t => t.quantity !== "" && t.discountPercentage !== "") ? (
                          (formData.tiers || []).filter(t => t.quantity !== "" && t.discountPercentage !== "").map((t, i, arr) => (
                            <span key={i} className="inline-block mr-2 font-bold text-amber-950 dark:text-amber-200">
                              Buy {t.quantity}+ get {t.discountPercentage}% off each{i < arr.length - 1 ? " • " : ""}
                            </span>
                          ))
                        ) : (
                          <span className="italic text-amber-800 dark:text-amber-400 font-medium">Configure quantity and discount % above to see live preview</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : formData.discountType === "BuyXGetY" ? (
                <div className="space-y-4">
                  {/* Callout Notice */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-bold text-sm">
                      <span>🎁 Buy X Get Y % Off (&quot;Buy 1 Get 2nd at 50% Off&quot;)</span>
                    </div>
                    <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-medium">
                      Applies automatically at checkout, no coupon needed. Each product is checked on its own — how many of THIS item the customer has decides its discount, nothing else in their basket affects it. Total items needed = Buy + Get. For &quot;Buy 1 Get 2nd at 50% Off&quot;, use Buy 1, Get 1, At 50%.
                    </p>
                  </div>

                  {/* 3 Value Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Buy *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={formData.buyQuantity ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setFormData({ ...formData, buyQuantity: raw === "" ? "" : (parseInt(raw) || "") });
                        }}
                        placeholder="e.g. 1"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Get *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={formData.getQuantity ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setFormData({ ...formData, getQuantity: raw === "" ? "" : (parseInt(raw) || "") });
                        }}
                        placeholder="e.g. 1"
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">At % Off *</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          step="0.01"
                          value={formData.discountPercentage ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setFormData({
                              ...formData,
                              discountPercentage: raw === "" ? "" : (parseFloat(raw) || ""),
                              usePercentage: true
                            });
                          }}
                          placeholder="e.g. 50"
                          className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Preview Callout */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
                    <div className="text-amber-700 dark:text-amber-400 shrink-0 text-base">✅</div>
                    <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-medium">
                      {(formData.buyQuantity !== "" && formData.getQuantity !== "" && formData.discountPercentage !== "") ? (
                        <>
                          <span className="font-bold text-amber-950 dark:text-amber-300">What the customer sees: </span>
                          to unlock this deal on an eligible product, they buy <strong className="font-bold text-amber-950 dark:text-amber-100">{Number(formData.buyQuantity) + Number(formData.getQuantity)}</strong> of it — <strong className="font-bold text-amber-950 dark:text-amber-100">{formData.buyQuantity}</strong> at full price and <strong className="font-bold text-amber-950 dark:text-amber-100">{formData.getQuantity}</strong> at <strong className="font-bold text-amber-950 dark:text-amber-100">{formData.discountPercentage}% off</strong>. Buying double that (<strong className="font-bold text-amber-950 dark:text-amber-100">{(Number(formData.buyQuantity) + Number(formData.getQuantity)) * 2}</strong>) repeats the deal twice, and so on.
                        </>
                      ) : (
                        <span className="italic text-amber-800 dark:text-amber-400 font-medium">Enter Buy, Get, and % Off above to preview how this deal will look to customers.</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : formData.discountType === "FixedPrice" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Fixed Price Amount (£) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">£</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.discountAmount ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFormData({
                          ...formData,
                          discountAmount: raw === "" ? "" : (parseFloat(raw) || ""),
                          usePercentage: false
                        });
                      }}
                      placeholder="e.g. 10.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Products & variants with exact sell price of £{(Number(formData.discountAmount) || 0).toFixed(2)} will qualify.</p>
                </div>
              ) : formData.discountType === "UptoXPrice" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Up to Price (£) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">£</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.discountAmount ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFormData({
                          ...formData,
                          discountAmount: raw === "" ? "" : (parseFloat(raw) || "")
                        });
                      }}
                      placeholder="e.g. 10.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Products & variants with sell price up to this amount will qualify.</p>
                </div>
              ) : formData.usePercentage ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Discount Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formData.discountPercentage ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFormData({
                          ...formData,
                          discountPercentage: raw === "" ? "" : (parseFloat(raw) || "")
                        });
                      }}
                      placeholder="e.g. 20"
                      className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Discount Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">£</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountAmount ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFormData({
                          ...formData,
                          discountAmount: raw === "" ? "" : (parseFloat(raw) || "")
                        });
                      }}
                      placeholder="e.g. 10.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category selection */}
            {(formData.discountType === "AssignedToCategories" || formData.discountType === "BuyXGetY") && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
                  Categories {formData.discountType === "BuyXGetY" ? "(optional — leave empty to pick specific products below instead)" : "*"}
                </label>
                <Select
                  isMulti
                  options={categoryOptions}
                  value={categoryOptions.filter(opt => formData.assignedCategoryIds.includes(opt.value))}
                  onChange={(selectedOptions) => setFormData({
                    ...formData,
                    assignedCategoryIds: selectedOptions ? selectedOptions.map(opt => opt.value) : [],
                    ...(formData.discountType === "AssignedToCategories" ? { assignedProductIds: [] } : {})
                  })}
                  placeholder="Select one or more categories..."
                  isSearchable
                  styles={customSelectStyles}
                  className="react-select-container text-xs"
                  classNamePrefix="react-select"
                />
              </div>
            )}

            {(formData.discountType === "AssignedToProducts" || formData.discountType === "UptoXPercent" || formData.discountType === "UptoXPrice" || formData.discountType === "FixedPrice" || formData.discountType === "BuyXGetY" || formData.discountType === "TieredQuantity" || (formData.discountType === "AssignedToCategories" && formData.assignedCategoryIds.length > 0)) && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300">
                  Select Products {(formData.discountType === "UptoXPrice" || formData.discountType === "FixedPrice" || formData.discountType === "BuyXGetY") ? (
                    <span className="text-xs text-amber-700 dark:text-amber-400/90 font-medium">(Optional: Leave empty to include all matching products)</span>
                  ) : formData.discountType === "TieredQuantity" ? (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">* Choose the products this tiered discount applies to</span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">* Choose which products this discount applies to</span>
                  )}
                </label>

                {/* Notice for TieredQuantity */}
                {formData.discountType === "TieredQuantity" && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-300">Product Assignment</p>
                      <p className="text-[11px] text-amber-950 dark:text-amber-200/90 font-medium">
                        Select the specific products or variants below that qualify for this tiered quantity discount.
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-Pick Notice for BuyXGetY */}
                {formData.discountType === "BuyXGetY" && formData.assignedProductIds.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-300">Matching products included automatically</p>
                      <p className="text-[11px] text-amber-950 dark:text-amber-200/90 font-medium">
                        Leave unchecked to include every matching product automatically, or check specific ones below to limit the discount to just those.
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-Pick Notice for FixedPrice */}
                {formData.discountType === "FixedPrice" && formData.assignedProductIds.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-300">Auto-Pick Active</p>
                      <p className="text-[11px] text-amber-950 dark:text-amber-200/90 font-medium">
                        No specific products are selected. All products & variants across the store with exact sell price of £{(Number(formData.discountAmount) || 0).toFixed(2)} will be automatically included in this offer. You can optionally select specific items below if you wish to restrict it manually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-Pick Notice for UptoXPrice */}
                {formData.discountType === "UptoXPrice" && formData.assignedProductIds.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-300">Auto-Pick Active</p>
                      <p className="text-[11px] text-amber-950 dark:text-amber-200/90 font-medium">
                        No specific products are selected. All products & variants across the store with sell price up to £{(Number(formData.discountAmount) || 0).toFixed(2)} will be automatically included in this offer. You can optionally select specific items below if you wish to restrict it manually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Wide Matching products container card */}
                <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  {/* Top line header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-850 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Matching products</h3>
                        {/* Filter Tabs: All vs Selected */}
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setOnlyShowSelected(false)}
                            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                              !onlyShowSelected
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnlyShowSelected(true)}
                            className={`px-2.5 py-0.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                              onlyShowSelected
                                ? "bg-amber-500 text-white shadow-sm font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <span>Selected</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              onlyShowSelected ? "bg-amber-600 text-white" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold"
                            }`}>
                              {formData.assignedProductIds.length}
                            </span>
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {onlyShowSelected
                          ? `Showing ${formData.assignedProductIds.length} currently selected products/variants for this discount.`
                          : "Check the products (or variants) this discount should apply to. Selected items are pinned at the top."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold shrink-0 mr-2">
                        {(() => {
                          const campaignAmount = Number(formData.discountAmount) || 0;
                          const campaignPercent = Number(formData.discountPercentage) || 0;
                          let count = 0;
                          sortedProductsToRender.forEach(p => {
                            if (p.variants && p.variants.length > 0) {
                              p.variants.forEach((v: any) => {
                                if (onlyShowSelected && !formData.assignedProductIds.includes(v.id)) return;
                                if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
                                  const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
                                  if (vSell === campaignAmount) count++;
                                } else if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
                                  const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
                                  if (vSell <= campaignAmount) count++;
                                } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
                                  const vPct = v.discountPercentage ?? 0;
                                  if (vPct >= 1 && vPct <= campaignPercent) count++;
                                } else {
                                  count++;
                                }
                              });
                            } else {
                              if (onlyShowSelected && !formData.assignedProductIds.includes(p.id)) return;
                              if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
                                const pSell = (p.sellPrice !== undefined && p.sellPrice !== null && p.sellPrice > 0) ? p.sellPrice : (p.price ?? 0);
                                if (pSell === campaignAmount) count++;
                              } else if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
                                const pSell = (p.sellPrice !== undefined && p.sellPrice !== null && p.sellPrice > 0) ? p.sellPrice : (p.price ?? 0);
                                if (pSell <= campaignAmount) count++;
                              } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
                                const pPct = p.discountPercentage ?? 0;
                                if (pPct >= 1 && pPct <= campaignPercent) count++;
                              } else {
                                count++;
                              }
                            }
                          });
                          return count;
                        })()} items
                      </span>
                      <button
                        type="button"
                        onClick={selectAllShown}
                        className="text-[10px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors font-semibold border border-amber-300 dark:border-amber-500/20 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/5 shadow-sm"
                      >
                        Select all shown
                      </button>
                      <button
                        type="button"
                        onClick={clearAllSelected}
                        className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-semibold border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/5 shadow-sm"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Filters / Search bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        placeholder="Search matching products by name, sku..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Loading products list...</p>
                      </div>
                    ) : sortedProductsToRender.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900 rounded-xl">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">
                          {onlyShowSelected ? "No products selected yet" : "No matching products found"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-600">
                          {onlyShowSelected
                            ? "Switch to 'All' or search above to find and select products for this discount"
                            : "Try adjusting your filters or discount percentage"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {sortedProductsToRender.flatMap(product => {
                          const { hasConflict, uniqueConflicts, isAssignedToCurrentDiscount } = checkProductConflicts(product.id);
                          const isDisabled = false; // Bypass disabling for campaign conflicts
                          const campaignAmount = Number(formData.discountAmount) || 0;
                          const campaignPercent = Number(formData.discountPercentage) || 0;

                          if (product.variants && product.variants.length > 0) {
                            const eligibleVariants = product.variants.filter((v: any) => {
                              if (onlyShowSelected && !formData.assignedProductIds.includes(v.id)) return false;
                              if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
                                const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
                                return vSell === campaignAmount;
                              }
                              if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
                                const vSell = (v.sellPrice !== undefined && v.sellPrice !== null && v.sellPrice > 0) ? v.sellPrice : (v.price ?? 0);
                                return vSell <= campaignAmount;
                              }
                              if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
                                const vPct = v.discountPercentage ?? 0;
                                return vPct >= 1 && vPct <= campaignPercent;
                              }
                              return true;
                            });

                            // Sort selected variants to the top within this product
                            eligibleVariants.sort((v1: any, v2: any) => {
                              const v1Sel = formData.assignedProductIds.includes(v1.id);
                              const v2Sel = formData.assignedProductIds.includes(v2.id);
                              if (v1Sel && !v2Sel) return -1;
                              if (!v1Sel && v2Sel) return 1;
                              return 0;
                            });

                            return eligibleVariants.map((v: any) => {
                              const isSelected = formData.assignedProductIds.includes(v.id);
                              const isVarCurrent = !!(initialData?.id && initialData.assignedProductIds?.split(',').map((s: string) => s.trim()).includes(v.id));
                              const imageUrl = v.imageUrl || getProductImage(product.images || []);
                              const hasVarDiscount = v.discountPercentage > 0 || (v.sellPrice && v.price > v.sellPrice);

                              return (
                                <div
                                  key={v.id}
                                  onClick={(e) => {
                                    if (isDisabled) return;
                                    if ((e.target as HTMLElement).tagName === "INPUT") return;
                                    handleItemSelect(v.id, product);
                                  }}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40"
                                    : "bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => handleItemSelect(v.id, product)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 bg-white dark:bg-slate-950 cursor-pointer shrink-0"
                                  />

                                  <div className="w-9 h-9 rounded overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
                                    {imageUrl ? (
                                      <img src={getImageUrl(imageUrl)} alt={v.name || product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-medium">No Img</div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{v.name || product.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {v.sku || product.sku || "N/A"}</p>
                                  </div>

                                  {/* Stock & Pricing aligned right */}
                                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                                    {(isVarCurrent || isSelected) && isEdit && (
                                      <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded text-[9px] font-bold">
                                        {isVarCurrent ? "Current" : "Selected"}
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-semibold">
                                      Stock {v.stockQuantity ?? 0}
                                    </span>
                                    {hasVarDiscount ? (
                                      <>
                                        <span className="text-[11px] text-red-500 line-through">£{v.price}</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">£{v.sellPrice}</span>
                                        <span className="px-1.5 py-0.5 bg-orange-600 text-white border border-orange-700 rounded text-[9px] font-bold dark:bg-orange-400 dark:text-slate-950 dark:border-orange-300">
                                          {v.discountPercentage}% OFF
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-bold text-slate-900 dark:text-emerald-400">£{v.price}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          }

                          // Simple product
                          if (onlyShowSelected && !formData.assignedProductIds.includes(product.id)) {
                            return [];
                          }
                          if (formData.discountType === "FixedPrice" && campaignAmount > 0) {
                            const pSell = (product.sellPrice !== undefined && product.sellPrice !== null && product.sellPrice > 0) ? product.sellPrice : (product.price ?? 0);
                            if (pSell !== campaignAmount) return [];
                          } else if (formData.discountType === "UptoXPrice" && campaignAmount > 0) {
                            const pSell = (product.sellPrice !== undefined && product.sellPrice !== null && product.sellPrice > 0) ? product.sellPrice : (product.price ?? 0);
                            if (pSell > campaignAmount) return [];
                          } else if (formData.discountType === "UptoXPercent" && campaignPercent > 0) {
                            const pPct = product.discountPercentage ?? 0;
                            if (pPct < 1 || pPct > campaignPercent) return [];
                          }

                          const isSelected = formData.assignedProductIds.includes(product.id);
                          const imageUrl = getProductImage(product.images || []);

                          return (
                            <div
                              key={product.id}
                              onClick={(e) => {
                                if (isDisabled) return;
                                if ((e.target as HTMLElement).tagName === "INPUT") return;
                                handleItemSelect(product.id, product);
                              }}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40"
                                : "bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => handleItemSelect(product.id, product)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 bg-white dark:bg-slate-950 cursor-pointer shrink-0"
                              />

                              <div className="w-9 h-9 rounded overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
                                {imageUrl ? (
                                  <img src={getImageUrl(imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-medium">No Img</div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {product.sku || "N/A"}</p>
                              </div>

                              {/* Stock & Pricing aligned right */}
                              <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                                {(isAssignedToCurrentDiscount || isSelected) && isEdit && (
                                  <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded text-[9px] font-bold">
                                    {isAssignedToCurrentDiscount ? "Current" : "Selected"}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-semibold">
                                  Stock {product.stockQuantity ?? 0}
                                </span>
                                {product.discountPercentage > 0 ? (
                                  <>
                                    <span className="text-[11px] text-red-500 line-through">£{product.price}</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">£{product.sellPrice}</span>
                                    <span className="px-1.5 py-0.5 bg-orange-600 text-white border border-orange-700 rounded text-[9px] font-bold dark:bg-orange-400 dark:text-slate-950 dark:border-orange-300">
                                      {product.discountPercentage}% OFF
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-slate-900 dark:text-emerald-400">£{product.price}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {hasMoreProducts && !onlyShowSelected && (
                          <div className="pt-2 flex justify-center">
                            <button
                              type="button"
                              onClick={handleLoadMore}
                              disabled={productsLoading}
                              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              {productsLoading && (
                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-amber-500 rounded-full animate-spin"></div>
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
          <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Limits & Validity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate ? formData.startDate.slice(0, 16) : ""}
                  onFocus={() => {
                    if (!formData.startDate) {
                      setFormData(prev => ({ ...prev, startDate: getNowDateTimeString(0) }));
                    }
                  }}
                  onPointerDown={() => {
                    if (!formData.startDate) {
                      setFormData(prev => ({ ...prev, startDate: getNowDateTimeString(0) }));
                    }
                  }}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate ? formData.endDate.slice(0, 16) : ""}
                  onFocus={() => {
                    if (!formData.endDate) {
                      setFormData(prev => ({ ...prev, endDate: getNowDateTimeString(1) }));
                    }
                  }}
                  onPointerDown={() => {
                    if (!formData.endDate) {
                      setFormData(prev => ({ ...prev, endDate: getNowDateTimeString(1) }));
                    }
                  }}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Limitation Type *</label>
                <select
                  value={formData.discountLimitation}
                  onChange={(e) => setFormData({ ...formData, discountLimitation: e.target.value as DiscountLimitationType, limitationTimes: null })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                >
                  <option value="Unlimited">Unlimited</option>
                  <option value="NTimesOnly">N Times Only</option>
                  <option value="NTimesPerCustomer">N Times Per Customer</option>
                </select>
              </div>
            </div>

            {formData.discountLimitation !== "Unlimited" && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Limitation Times *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.limitationTimes ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setFormData({ ...formData, limitationTimes: raw === "" ? "" : (parseInt(raw) || "") });
                  }}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder-slate-400"
                />
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: COUPON SETTINGS (Only visible if requiresCouponCode is true) */}
        {activeTab === "coupon-settings" && formData.requiresCouponCode && (
          <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Coupon Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl self-end h-[46px]">
                <label htmlFor="isCumulative" className="text-sm font-semibold text-slate-800 dark:text-white cursor-pointer select-none">
                  Cumulative (Can combine with other discounts)
                </label>
                <input
                  type="checkbox"
                  id="isCumulative"
                  checked={formData.isCumulative}
                  onChange={(e) => setFormData({ ...formData, isCumulative: e.target.checked })}
                  className="w-4 h-4 text-amber-600 bg-white dark:bg-slate-955 border-slate-300 dark:border-slate-750 rounded focus:ring-amber-500 focus:ring-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* PANEL 5: BANNER IMAGES */}
        {activeTab === "banner-images" && (
          <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-md space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              Banner Images
            </h2>

            <div className="space-y-4">
              {/* DESKTOP BANNER */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300">Desktop Banner Image (Recommended size: 662 x 413 px) webp only.</label>
                {desktopPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-500 bg-white dark:bg-slate-950 p-1.5 shadow-sm">
                    <img src={desktopPreview} alt="Desktop Preview" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setDesktopFile(null)}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : formData.desktopBannerImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-sm">
                    <img src={getImageUrl(formData.desktopBannerImageUrl)} alt="Desktop Banner" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleDeleteBannerImage(initialData!.id, "desktop")}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition-all bg-slate-50/50 dark:bg-slate-955/20">
                    <Upload size={18} className="text-slate-400 dark:text-slate-500 mb-0.5" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Upload Desktop Image</span>
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
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300">Mobile Banner Image (Recommended size: 662 x 413 px) webp only</label>
                {mobilePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-500 bg-white dark:bg-slate-955 p-1.5 shadow-sm">
                    <img src={mobilePreview} alt="Mobile Preview" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setMobileFile(null)}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : formData.mobileBannerImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-sm">
                    <img src={getImageUrl(formData.mobileBannerImageUrl)} alt="Mobile Banner" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleDeleteBannerImage(initialData!.id, "mobile")}
                      className="absolute top-3.5 right-3.5 bg-red-650 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition-all bg-slate-50/50 dark:bg-slate-955/20">
                    <Upload size={18} className="text-slate-400 dark:text-slate-500 mb-0.5" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Upload Mobile Image</span>
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

          </div>
        )}
      </div>
    </div>
  );
}
