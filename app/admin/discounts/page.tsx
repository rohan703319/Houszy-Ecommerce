"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Percent, Eye, Filter, History, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, Calendar, Gift, Target, Clock, TrendingUp, Users, Infinity as InfinityIcon, CalendarRange, ChevronDown, Package, RotateCcw, X, ExternalLink, FolderTree, Clock3, } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import {
  Discount,
  DiscountLimitationType,
  discountsService,
  DiscountType,
} from "@/lib/services/discounts";
import { categoriesService, Category } from "@/lib/services/categories";
import { Brand, brandsService, Product, productsService } from "@/lib/services";
import { DiscountUsageHistory } from "@/lib/services/discounts";
import DiscountModals from "./DiscountModals";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { useDebounce } from "../_hooks/useDebounce";
import { getImageUrl } from "../_utils/formatUtils";
import ImagePreviewModal from "../_components/ImagePreviewModal";
import { getBackendMessage} from "@/app/admin/_utils/errorUtils";
import { getSelectStyles } from "../_utils/styles";
import { useTheme } from "@/app/admin/_context/theme-provider";

const extractProducts = (res: any): Product[] => {
  if (Array.isArray(res)) return res;

  if (Array.isArray(res?.items)) return res.items;

  if (Array.isArray(res?.data)) return res.data;

  if (Array.isArray(res?.data?.items)) return res.data.items;

  return [];
};
// ========== INTERFACES ==========
interface SelectOption {
  value: string;
  label: string;
}

interface CategoryNode {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryNode[];
  subCategories?: CategoryNode[];
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


// ========== MAIN COMPONENT ==========
export default function DiscountsPage() {
  const router = useRouter();
  const toast = useToast();
  const { theme } = useTheme();
  const customSelectStyles = useMemo(() => getSelectStyles(theme === 'dark'), [theme]);

  // State
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [viewingDiscount, setViewingDiscount] = useState<Discount | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("");
  const [productBrandFilter, setProductBrandFilter] = useState<string>("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [assignedItemsPopup, setAssignedItemsPopup] = useState<string | null>(null); // discount id
  const popupRef = useRef<HTMLDivElement>(null);
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [usageHistoryModal, setUsageHistoryModal] = useState(false);
  const [selectedDiscountHistory, setSelectedDiscountHistory] = useState<Discount | null>(null);
  const [usageHistory, setUsageHistory] = useState<DiscountUsageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dateRangeFilter, setDateRangeFilter] = useState({ startDate: "", endDate: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<"notDeleted" | "deleted">("notDeleted");
const [statusConfirm, setStatusConfirm] = useState<Discount | null>(null);
const [restoreConfirm, setRestoreConfirm] = useState<Discount | null>(null);
const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
const [isRestoring, setIsRestoring] = useState(false);
const [imageModal, setImageModal] = useState<Discount | null>(null);
const debouncedSearch = useDebounce(searchTerm, 400);
const [allSelectedProducts, setAllSelectedProducts] = useState<Product[]>([]);
const [productsLoading, setProductsLoading] = useState(false);
const [categoriesLoading, setCategoriesLoading] = useState(false);
const [desktopFile, setDesktopFile] = useState<File | null>(null);
const [mobileFile, setMobileFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<FormData>({
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
  });

const fetchAssignedProducts = async (ids: string[]) => {
  try {
    const results = await Promise.allSettled(
      ids.map(id => productsService.getById(id))
    );

    const data: Product[] = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value?.data?.data)
      .filter((p): p is Product => Boolean(p));

    return data;
  } catch {
    return [];
  }
};

const productOptions = useMemo(() => {
  return products.map(p => ({
    value: p.id,
    label: p.name
  }));
}, [products]);




const fetchProducts = async () => {
  try {
    setProductsLoading(true);

    const params: any = {
      pageSize: 1000,
      isPublished: true,
      sortBy: "name",
      outOfStockLast: false,
    };

    // ===============================
    // ASSIGNED TO CATEGORIES
    // ===============================
    if (formData.discountType === "AssignedToCategories") {
      // jo category selected hai wahi force karo
      const selectedCategoryId = formData.assignedCategoryIds?.[0];

      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId;
      }

      // optional search inside selected category only
      if (productSearchTerm?.trim()) {
        params.searchTerm = productSearchTerm.trim();
      }

      // optional brand filter
      if (productBrandFilter) {
        params.brandId = productBrandFilter;
      }
    }

    // ===============================
    // ASSIGNED TO PRODUCTS
    // ===============================
    if (formData.discountType === "AssignedToProducts") {
      // category filter
      if (productCategoryFilter) {
        params.categoryId = productCategoryFilter;
      }

      // brand filter
      if (productBrandFilter) {
        params.brandId = productBrandFilter;
      }

      // search filter
      if (productSearchTerm?.trim()) {
        params.searchTerm = productSearchTerm.trim();
      }

      if (formData.discountPercentage > 0) {
        params.exactDiscountPercentage = formData.discountPercentage;
      }
    }

    if (formData.discountType === "UptoXPercent") {
      // category filter
      if (productCategoryFilter) {
        params.categoryId = productCategoryFilter;
      }

      // brand filter
      if (productBrandFilter) {
        params.brandId = productBrandFilter;
      }

      // search filter
      if (productSearchTerm?.trim()) {
        params.searchTerm = productSearchTerm.trim();
      }

      if (formData.discountPercentage > 0) {
        params.maxDiscountPercentage = formData.discountPercentage;
      }
    }

    console.log("🔥 API PARAMS:", params);

    const res = await productsService.getAll(params);

    const productsArray = extractProducts(res?.data);

    setProducts(productsArray);
  } catch (err) {
    console.error("❌ Failed to fetch products:", err);
  } finally {
    setProductsLoading(false);
  }
};
useEffect(() => {
  if (showModal) {
    fetchProducts();
  }
}, [
  showModal,
  formData.discountType,
  formData.assignedCategoryIds,
  formData.discountPercentage,
  productCategoryFilter,
  productBrandFilter,
  productSearchTerm
]);
useEffect(() => {
  fetchDiscounts();
  fetchDropdownData();
}, []);

  // Fetch dropdown data
const fetchDropdownData = async () => {
  try {
    setCategoriesLoading(true);

    const [categoriesRes, brandsRes] = await Promise.all([
      categoriesService.getAll(),
      brandsService.getAll(),
    ]);

    setCategories(categoriesRes?.data?.data?.items || []);
    setBrands(brandsRes?.data?.data?.items || []);

  } catch (error) {
    console.error(error);
  } finally {
    setCategoriesLoading(false);
  }
};

  // Fetch discounts
const fetchDiscounts = async () => {
  setLoading(true);
  try {
    const response = await discountsService.getAll({
      params: {
        includeInactive: true, // always fetch both active/inactive
        isDeleted: deletedFilter === "deleted", // backend control
      },
    });

    setDiscounts(response.data?.data || []);
  } catch (error) {
    console.error("Error fetching discounts:", error);
    setDiscounts([]);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchDiscounts();
}, [deletedFilter]);


useEffect(() => {
  setCurrentPage(1);
}, [debouncedSearch, activeFilter, typeFilter, deletedFilter]);


const handleStatusToggle = async () => {
  if (!statusConfirm) return;

  setIsUpdatingStatus(true);

  try {
    const payload = {
      ...statusConfirm,
      id: statusConfirm.id, // ✅ MUST match URL id
      isActive: !statusConfirm.isActive,

      // null → undefined fix
      couponCode: statusConfirm.couponCode ?? undefined,
      maximumDiscountAmount: statusConfirm.maximumDiscountAmount ?? undefined,
      limitationTimes: statusConfirm.limitationTimes ?? undefined,
      maximumDiscountedQuantity:
        statusConfirm.maximumDiscountedQuantity ?? undefined,
    };

    await discountsService.update(statusConfirm.id, payload);

    toast.success("Status updated successfully!");
    await fetchDiscounts();

  } catch (error: any) {
    toast.error(getBackendMessage(error));
  } finally {
    setIsUpdatingStatus(false);
    setStatusConfirm(null);
  }
};





const handleRestore = async () => {
  if (!restoreConfirm) return;

  setIsRestoring(true);
  try {
    await discountsService.restore(restoreConfirm.id);

    toast.success("Discount restored successfully");
    await fetchDiscounts();
  } catch (error: any) {
    toast.error(getBackendMessage(error));
  } finally {
    setIsRestoring(false);
    setRestoreConfirm(null);
  }
};


  // Handle discount type change
  const handleDiscountTypeChange = (newType: DiscountType) => {
    const hasAssignments =
      formData.assignedProductIds.length > 0 || formData.assignedCategoryIds.length > 0;

    if (hasAssignments && newType !== formData.discountType) {
      const productCount = formData.assignedProductIds.length;
      const categoryCount = formData.assignedCategoryIds.length;
      let warningMessage = "Discount type changed! Cleared: ";
      const cleared: string[] = [];

      if (productCount > 0)
        cleared.push(`${productCount} product${productCount > 1 ? "s" : ""}`);
      if (categoryCount > 0)
        cleared.push(`${categoryCount} ${categoryCount > 1 ? "categories" : "category"}`);

      warningMessage += cleared.join(", ");
      toast.warning(warningMessage);

      setFormData({
        ...formData,
        discountType: newType,
        assignedProductIds: [],
        assignedCategoryIds: [],
      });
    } else {
      setFormData({ ...formData, discountType: newType });
    }

    setProductCategoryFilter("");
    setProductBrandFilter("");
  };

  // Category options
  const categoryOptions: SelectOption[] = useMemo(
    () => processCategoryData(categories as any[]),
    [categories]
  );

const brandOptions: SelectOption[] = useMemo(() => {
  return brands.map((b) => ({
    value: b.id,
    label: b.name,
  }));
}, [brands]);

const getProductDiscount = (product: any) => {
  if (!product?.assignedDiscounts?.length) return null;

  const now = new Date();

  const active = product.assignedDiscounts.find((d: any) => {
    if (!d.isActive) return false;
    if (new Date(d.startDate) > now) return false;
    if (new Date(d.endDate) < now) return false;

    // category discount + specific products selected
    if (d.discountType === "AssignedToCategories") {
      const ids = (d.assignedProductIds || "")
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean);

      if (ids.length > 0) {
        return ids.includes(product.id); // only selected products
      }
    }

    return true;
  });

  return active || null;
};
// Handle submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if(formData.discountType==="AssignedToProducts"){
    if(formData.assignedProductIds.length===0){
      toast.error("Please select at least one product");
      return;
    }
  } 

  // ✅ FIX: Allow long comments that already exist during edit, only validate on create or if being modified
  if (formData.adminComment && formData.adminComment.length > 50) {
    // Skip validation during edit if comment hasn't changed
    if (!editingDiscount || formData.adminComment !== editingDiscount.adminComment) {
      toast.error("Admin comment must be 50 characters or less");
      return;
    }
}   

  if (!formData.discountPercentage) {
    toast.error("Discount percentage is required");
    return;
  }

// ✅ FIX: Make banner images optional during CREATE, required during EDIT
if (editingDiscount) {
  // EDIT mode: At least one image must exist (either new file or existing URL)
  if (
    (!desktopFile && !formData.desktopBannerImageUrl) ||
    (!mobileFile && !formData.mobileBannerImageUrl)
  ) {
    toast.error("Desktop and Mobile banner images are required");
    return;
  }
}
// CREATE mode: Banners are optional - can be added after creation


  try {
    const payload = {
      ...formData,
      assignedProductIds: formData.assignedProductIds.join(","),
      assignedCategoryIds: formData.assignedCategoryIds.join(","),
      assignedManufacturerIds: formData.assignedManufacturerIds.join(","),
      ...(editingDiscount && { id: editingDiscount.id }),
    };

    if (editingDiscount) {
      // ✅ EDIT: Upload new files if provided
      if (desktopFile) {
        await handleUploadBannerImage(editingDiscount.id, desktopFile, "desktop");
      }
      if (mobileFile) {
        await handleUploadBannerImage(editingDiscount.id, mobileFile, "mobile");
      }
      
      await discountsService.update(editingDiscount.id, payload);
      toast.success("Discount updated successfully!");
    } else {
      const res = await discountsService.create(payload);

      const discountId = res?.data?.data?.id;

      if (!discountId) {
        toast.error("Failed to get discount ID");
        return;
      }

      // ✅ CREATE: Upload banner images if provided (optional)
      if (desktopFile) {
        await handleUploadBannerImage(discountId, desktopFile, "desktop");
      }
      if (mobileFile) {
        await handleUploadBannerImage(discountId, mobileFile, "mobile");
      }

      toast.success("Discount created successfully!");
    }

    await fetchDiscounts();
    setShowModal(false);
    resetForm();

  } catch (error: any) {
    console.error(error);
    toast.error("Failed to save discount");
  }
};
const handleEdit = (discount: Discount) => {
  router.push(`/admin/discounts/edit/${discount.id}`);
};

  // Reset form
  const resetForm = () => {
    setFormData({
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
      
      
    });
    setDesktopFile(null);
setMobileFile(null);
    setEditingDiscount(null);
    setProductCategoryFilter("");
    setProductBrandFilter("");
  };

const handleUploadBannerImage = async (
  discountId: string,
  file: File,
  type: "desktop" | "mobile"
) => {
  try {
    const res = await discountsService.uploadBannerImage(discountId, file, type);

    const json = res?.data as { success?: boolean; data?: string };

    if (json?.success && json?.data) {
      setFormData((prev) => ({
        ...prev,
        [type === "desktop"
          ? "desktopBannerImageUrl"
          : "mobileBannerImageUrl"]: json.data,
      }));

      fetchDiscounts(); // only once
    }
  } catch (err) {
    console.error(err);
  }
};

const handleDeleteBannerImage = async (
  discountId: string,
  type: "desktop" | "mobile"
) => {
  try {
    const res = await discountsService.deleteBannerImage(discountId, type);
const json = res?.data as { success?: boolean };

if (json?.success){
      setFormData((prev) => ({
        ...prev,
        [type === "desktop"
          ? "desktopBannerImageUrl"
          : "mobileBannerImageUrl"]: null,
      }));
      fetchDiscounts();
    }
  } catch (err) {
    console.error(err);
  }
};
  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await discountsService.delete(id);
      if (!response.error && (response.status === 200 || response.status === 204)) {
        toast.success("Discount deleted successfully!");
        await fetchDiscounts();
      } else {
        toast.error(response.error || "Failed to delete discount");
      }
    } catch (error: any) {
      console.error("Error deleting discount:", error);
      toast.error(error?.response?.data?.message || "Failed to delete discount");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

// Close popup when clicking outside
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      setAssignedItemsPopup(null);
    }
  };
  if (assignedItemsPopup) document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [assignedItemsPopup]);

// Get assigned products/categories for a discount
const getAssignedProducts = useCallback((discount: Discount) => {
  const ids =
    typeof discount.assignedProductIds === "string"
      ? discount.assignedProductIds.split(",").map(s => s.trim()).filter(Boolean)
      : (discount.assignedProductIds as string[]) || [];

  return allSelectedProducts.filter(p => ids.includes(p.id));
}, [allSelectedProducts]);
useEffect(() => {
  const allIds = discounts
    .flatMap(d => d.assignedProductIds?.split(",") || [])
    .map(id => id.trim())
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(allIds));

  if (uniqueIds.length) {
    fetchAssignedProducts(uniqueIds).then(setAllSelectedProducts);
  }
}, [discounts]);

const getAssignedCategories = useCallback(
  (discount: Discount) => {

    const ids =
      typeof discount.assignedCategoryIds === "string"
        ? discount.assignedCategoryIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : (discount.assignedCategoryIds as string[]) || [];

    // flatten all levels
    const flattenCategories = (cats: Category[]): Category[] => {
      let result: Category[] = [];

      cats.forEach((cat) => {
        result.push(cat);

        if (cat.subCategories?.length) {
          result = result.concat(
            flattenCategories(cat.subCategories)
          );
        }
      });

      return result;
    };

    const allCategories =
      flattenCategories(categories);

    return allCategories.filter((c) =>
      ids.includes(c.id)
    );
  },
  [categories]
);

const handleViewUsageHistory = async (discount: Discount) => {
  setSelectedDiscountHistory(discount);
  setUsageHistoryModal(true);
  setLoadingHistory(true);
  try {
    const response = await discountsService.getUsageHistory(discount.id);
    setUsageHistory(response.data?.data || []);
  } catch (error) {
    console.error("Error fetching usage history:", error);
    setUsageHistory([]);
  } finally {
    setLoadingHistory(false);
  }
};

const clearFilters = () => {
  setActiveFilter("all");
  setTypeFilter("all");
  setDeletedFilter("notDeleted"); // ✅ reset deleted filter
  setSearchTerm("");
  setExpiryFilter("all");
  setCurrentPage(1);
};

const hasActiveFilters =
  activeFilter !== "all" ||
  expiryFilter !== "all" ||
  typeFilter !== "all" ||
  deletedFilter !== "notDeleted" ||   // ✅ ADD THIS
  searchTerm.trim() !== "";


  const getDiscountTypeLabel = (type: DiscountType): string => {
    const labels: Record<DiscountType, string> = {
      AssignedToOrderTotal: "Order Total",
      AssignedToProducts: "Products",
      AssignedToCategories: "Categories",
      AssignedToShipping: "Shipping",
      AssignedToManufacturers: "",
      AssignedToOrderSubTotal: "",
      UptoXPercent: "Up to X% Off",
    };
    return labels[type];
  };

  const getDiscountTypeIcon = (type: DiscountType): string => {
    const icons: Record<DiscountType, string> = {
      AssignedToOrderTotal: "💰",
      AssignedToProducts: "📦",
      AssignedToCategories: "📁",
      AssignedToShipping: "🚚",
      AssignedToManufacturers: "🏭",
      AssignedToOrderSubTotal: "💵",
      UptoXPercent: "⚡",
    };
    return icons[type];
  };

  const formatDiscountValue = (discount: Discount): string => {
    if (discount.usePercentage) {
      return `${discount.discountPercentage}%`;
    }
    return `£${discount.discountAmount}`;
  };
const getDiscountStatus = (discount: Discount) => {
  const now = new Date();
  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);

  if (!discount.isActive) {
    return { label: "Inactive", color: "red" };
  }

  if (now > end) {
    return { label: "Expired", color: "gray" };
  }

  if (now < start) {
    return { label: "Scheduled", color: "orange" };
  }

  return { label: "Active", color: "green" };
};

  const isDiscountActive = (discount: Discount): boolean => {
    if (!discount.isActive) return false;
    const now = new Date();
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);
    return now >= start && now <= end;
  };

  // Filter data
const filteredDiscounts = discounts.filter((discount) => {
  const search = debouncedSearch.toLowerCase();

  const matchesSearch =
    (discount.name ?? "").toLowerCase().includes(search) ||
    (discount.adminComment ?? "").toLowerCase().includes(search) ||
    (discount.couponCode ?? "").toLowerCase().includes(search);

  const matchesActive =
    activeFilter === "all" ||
    (activeFilter === "active" && discount.isActive) ||
    (activeFilter === "inactive" && !discount.isActive);
    const matchesExpiry =
  expiryFilter === "all" ||
  (expiryFilter === "expiring" &&
    (() => {
      const end = new Date(discount.endDate);
      const now = new Date();

      const diffDays = Math.ceil(
        (end.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return diffDays <= 7 && diffDays > 0;
    })());

  const matchesType =
    typeFilter === "all" || discount.discountType === typeFilter;

 return (
  matchesSearch &&
  matchesActive &&
  matchesType &&
  matchesExpiry
);
});


  // Pagination
  const totalItems = filteredDiscounts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredDiscounts.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage < maxVisiblePages - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, typeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading discounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
{/* Header */}
<div className="flex flex-wrap items-center justify-between gap-3">

  <div>
    <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
      Discount Management
    </h1>
    <p className="text-[11px] text-slate-500">
      Manage your store discounts
    </p>
  </div>

  <Link
    href="/admin/discounts/add"
    className="px-3 py-1.5 text-[11px] bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-md hover:opacity-90 transition-all flex items-center gap-1.5"
  >
    <Plus className="h-3 w-3" />
    Add Discount
  </Link>
</div>




<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">

  {/* Total */}
  <button
    title="Show all discounts and clear every active filter"
    onClick={() => {
      setActiveFilter("all");
      setTypeFilter("all");
      setDeletedFilter("notDeleted");
      setExpiryFilter("all");
      setSearchTerm("");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-violet-500/40
      active:scale-[0.98]

      ${
        activeFilter === "all" &&
        typeFilter === "all" &&
        expiryFilter === "all"
          ? "border-violet-500 bg-violet-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-violet-500/10 rounded-md flex items-center justify-center">
        <Percent className="h-4 w-4 text-violet-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Total
        </p>

        <p className="text-lg font-semibold text-white">
          {discounts.length}
        </p>
      </div>
    </div>
  </button>

  {/* Active */}
  <button
    title="Show only active discounts"
    onClick={() => {
      setActiveFilter("active");
      setExpiryFilter("all");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-green-500/40
      active:scale-[0.98]

      ${
        activeFilter === "active"
          ? "border-green-500 bg-green-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-green-500/10 rounded-md flex items-center justify-center">
        <Gift className="h-4 w-4 text-green-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Active
        </p>

        <p className="text-lg font-semibold text-white">
          {discounts.filter((d) => d.isActive).length}
        </p>
      </div>
    </div>
  </button>

  {/* Products */}
  <button
    title="Show discounts assigned to products"
    onClick={() => {
      setTypeFilter("AssignedToProducts");
      setExpiryFilter("all");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-cyan-500/40
      active:scale-[0.98]

      ${
        typeFilter === "AssignedToProducts"
          ? "border-cyan-500 bg-cyan-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-cyan-500/10 rounded-md flex items-center justify-center">
        <Target className="h-4 w-4 text-cyan-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Products
        </p>

        <p className="text-lg font-semibold text-white">
          {
            discounts.filter(
              (d) =>
                d.discountType ===
                "AssignedToProducts"
            ).length
          }
        </p>
      </div>
    </div>
  </button>

  {/* Categories */}
  <button
    title="Show discounts assigned to categories"
    onClick={() => {
      setTypeFilter("AssignedToCategories");
      setExpiryFilter("all");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-emerald-500/40
      active:scale-[0.98]

      ${
        typeFilter === "AssignedToCategories"
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center">
        <FolderTree className="h-4 w-4 text-emerald-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Categories
        </p>

        <p className="text-lg font-semibold text-white">
          {
            discounts.filter(
              (d) =>
                d.discountType ===
                "AssignedToCategories"
            ).length
          }
        </p>
      </div>
    </div>
  </button>

  {/* Expiring */}
  <button
    title="Show discounts expiring within 7 days"
    onClick={() => {
      setExpiryFilter("expiring");
      setActiveFilter("all");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-orange-500/40
      active:scale-[0.98]

      ${
        expiryFilter === "expiring"
          ? "border-orange-500 bg-orange-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-orange-500/10 rounded-md flex items-center justify-center">
        <Calendar className="h-4 w-4 text-orange-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Expiring
        </p>

        <p className="text-lg font-semibold text-white">
          {
            discounts.filter((d) => {
              const end = new Date(d.endDate);
              const now = new Date();

              const diffDays = Math.ceil(
                (end.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                diffDays <= 7 &&
                diffDays > 0
              );
            }).length
          }
        </p>
      </div>
    </div>
  </button>

  {/* Expired */}
  <button
    title="Show expired discounts"
    onClick={() => {
      setExpiryFilter("expired");
      setActiveFilter("all");
    }}
    className={`
      bg-slate-900/40
      border
      rounded-lg
      p-2.5
      text-left
      transition-all
      hover:bg-slate-800/60
      hover:border-red-500/40
      active:scale-[0.98]

      ${
        expiryFilter === "expired"
          ? "border-red-500 bg-red-500/10"
          : "border-slate-800"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-red-500/10 rounded-md flex items-center justify-center">
        <Clock3 className="h-4 w-4 text-red-400" />
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          Expired
        </p>

        <p className="text-lg font-semibold text-white">
          {
            discounts.filter((d) => {
              const end = new Date(d.endDate);
              return end < new Date();
            }).length
          }
        </p>
      </div>
    </div>
  </button>

</div>

{/* Items Per Page */}
<div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">

  <div className="flex items-center justify-between gap-2 flex-wrap">

    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500">Show</span>

      <select
        value={itemsPerPage}
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        className="px-2 py-1 bg-slate-800/90 border border-slate-700 rounded-md text-white text-[11px]"
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={75}>75</option>
        <option value={100}>100</option>
      </select>

      <span className="text-[11px] text-slate-500">per page</span>
    </div>

    <div className="text-[11px] text-slate-500">
      <span className="text-white font-medium">{startIndex + 1}</span>
      {" – "}
      <span className="text-white font-medium">{Math.min(endIndex, totalItems)}</span>
      {" of "}
      <span className="text-white font-medium">{totalItems}</span>
    </div>

  </div>
</div>
{/* ================= SEARCH + FILTER ================= */}
<div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-xl px-3 py-2.5">
  <div className="flex flex-wrap items-center gap-3">

    {/* SEARCH */}
    <div className="relative flex-1 min-w-[240px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

      <input
        type="search"
        placeholder="Search discounts, comments, coupon codes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-9 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
      />

      {searchTerm !== debouncedSearch && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>

    {/* FILTERS */}
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-slate-400" />

      <select
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className={`px-3 py-2 bg-slate-800 border rounded-lg text-white text-xs ${
          activeFilter !== "all"
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600"
        }`}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className={`px-3 py-2 bg-slate-800 border rounded-lg text-white text-xs ${
          typeFilter !== "all"
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600"
        }`}
      >
        <option value="all">All Types</option>
        <option value="AssignedToOrderTotal">Order Total</option>
        <option value="AssignedToProducts">Products</option>
        <option value="AssignedToCategories">Categories</option>
      </select>

      <select
        value={deletedFilter}
        onChange={(e) => setDeletedFilter(e.target.value as any)}
        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs"
      >
        <option value="notDeleted">Live Discounts</option>
        <option value="deleted">Deleted Discounts</option>
      </select>
      <select
  value={expiryFilter}
  onChange={(e) => setExpiryFilter(e.target.value)}
  className={`px-3 py-2 bg-slate-800 border rounded-lg text-white text-xs ${
    expiryFilter !== "all"
      ? "border-orange-500 bg-orange-500/10"
      : "border-slate-600"
  }`}
>
  <option value="all">All Expiry</option>
  <option value="expiring">Expiring Soon</option>
  <option value="expired">Expired</option>
</select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="px-2.5 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-md hover:bg-red-500/20 text-xs flex items-center gap-1"
        >
          <FilterX className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>

    {/* COUNT */}
    <div className="text-xs text-slate-400 ml-auto whitespace-nowrap">
      {totalItems} discount{totalItems !== 1 ? "s" : ""}
    </div>

  </div>
</div>



      {/* Discounts list */}
  {/* ================= DISCOUNTS TABLE ================= */}
<div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
  {currentData.length === 0 ? (
    <div className="text-center py-12">
      <Percent className="h-12 w-12 text-slate-600 mx-auto mb-2" />
      <p className="text-slate-400 text-sm">No discounts found</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="bg-slate-800/60 border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th className="text-left py-2.5 px-3">Discount Name</th>
            <th className="text-center py-2.5 px-3">Discount Type</th>
            <th className="text-center py-2.5 px-3">Discount Value</th>
            <th className="text-center py-2.5 px-3">Discount Status</th>
            <th className="text-center py-2.5 px-3">Validity</th>
            <th className="text-center py-2.5 px-3">Usage</th>
            <th className="text-center py-2.5 px-3">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y divide-slate-800">
          {currentData.map((discount) => {
            const start = new Date(discount.startDate);
            const end = new Date(discount.endDate);
            const today = new Date();

            const totalDays = Math.ceil(
              (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isExpired = today > end;

            return (
              <tr key={discount.id} className="hover:bg-slate-800/40 transition">

                {/* NAME */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
<div className="flex items-center gap-2">
  {/* Thumbnail */}
  <div
    className="w-8 h-8 rounded-md overflow-hidden border border-slate-600 cursor-pointer hover:border-violet-400 transition-all"
    onClick={() => setImageModal(discount)}
    title="View Banner"
  >
    {discount.desktopBannerImageUrl ? (
      <img
        src={getImageUrl(discount.desktopBannerImageUrl)}
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
    ) : discount.mobileBannerImageUrl ? (
      <img
        src={getImageUrl(discount.mobileBannerImageUrl)}
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-xs text-white">
        {getDiscountTypeIcon(discount.discountType)}
      </div>
    )}
  </div>

  {/* View on Store */}

{!discount.isDeleted && (
  <a
    href={`/offers/${discount.slug}`}
    target="_blank"
    rel="noopener noreferrer"
    title="View Offer on Store"
    className="
      w-8 h-8 rounded-md
      border border-emerald-500/30
      bg-emerald-500/10
      text-emerald-400
      hover:bg-emerald-500/20
      hover:text-emerald-300
      transition-all
      flex items-center justify-center
    "
  >
    <ExternalLink className="w-3.5 h-3.5" />
  </a>
)}
</div>

                    <div className="min-w-0">
               <p
  className={`
    text-white text-xs font-medium truncate
    ${
      discount.isDeleted
        ? "cursor-not-allowed opacity-60"
        : "cursor-pointer hover:text-violet-400"
    }
  `}
  onClick={() => {
    if (!discount.isDeleted) {
      setViewingDiscount(discount);
    }
  }}
>
  {discount.name}
</p>

                      {discount.couponCode && (
                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded mt-0.5 inline-block">
                          {discount.couponCode}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* TYPE (FULL LOGIC SAME) */}
<td className="py-2.5 px-3 text-center">
  {(() => {
    const isCategories =
      discount.discountType === "AssignedToCategories";

    const isProducts =
      discount.discountType === "AssignedToProducts";

    const isOrderTotal =
      discount.discountType === "AssignedToOrderTotal";

    const isShipping =
      discount.discountType === "AssignedToShipping";

    const assignedCats = isCategories
      ? getAssignedCategories(discount)
      : [];

    const assignedProducts = isProducts
      ? getAssignedProducts(discount)
      : [];

    // CATEGORY DISCOUNT
    if (isCategories) {
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap justify-center gap-1 max-w-[240px] mx-auto">
            {assignedCats.map((cat) => (
              <span
                key={cat.id}
               title={`Category Name : ${cat.name}`}
                className="
                  px-2 py-0.5
                  rounded-md
                  bg-emerald-500/10
                  border border-emerald-500/20
                  text-emerald-300
                  text-[10px]
                  truncate
                  max-w-[180px]
                "
                >
             Assigned to Categories
              </span>
            ))}
          </div>
        </div>
      );
    }

    // PRODUCT DISCOUNT
    if (isProducts) {
      return (
        <div className="space-y-1">
          <div
            title="Discount on Products"
            className="
              inline-flex items-center gap-1
              px-2 py-1 rounded-md
              bg-blue-500/10
              border border-blue-500/20
              text-blue-300 text-[10px]
            "
          >
         Assigned to Products
          </div>
        </div>
      );
    }

    // ORDER TOTAL DISCOUNT
    if (isOrderTotal) {
      return (
        <div
          title="Discount on Order Total"
          className="
            inline-flex items-center gap-1
            px-2 py-1 rounded-md
            bg-violet-500/10
            border border-violet-500/20
            text-violet-300
            text-[10px]
            font-medium
          "
        >
         Assigned to Order Total
        </div>
      );
    }

    // SHIPPING DISCOUNT
    if (isShipping) {
      return (
        <div
          title="Discount on Shipping"
          className="
            inline-flex items-center gap-1
            px-2 py-1 rounded-md
            bg-amber-500/10
            border border-amber-500/20
            text-amber-300
            text-[10px]
            font-medium
          "
        >
        Assign to   Shipping
        </div>
      );
    }

    // OTHER TYPES
    return (
      <div
        title={getDiscountTypeLabel(discount.discountType)}
        className="
          inline-flex items-center gap-1
          px-2 py-1 rounded-md
          bg-slate-500/10
          text-slate-400
          text-[10px]
          font-medium
        "
      >
        {getDiscountTypeLabel(discount.discountType)}
      </div>
    );
  })()}
</td>

                {/* VALUE */}
                <td className="py-2.5 px-3 text-center text-xs">
                <span className="text-emerald-500 font-semibold">
  {formatDiscountValue(discount)}
</span>

                  {discount.maximumDiscountAmount && (
                    <p className="text-[10px] text-slate-500">
                      max £{discount.maximumDiscountAmount}
                    </p>
                  )}
                </td>

                {/* STATUS (UNCHANGED LOGIC) */}
             <td className="py-2.5 px-3 text-center text-xs">
  {(() => {
    const status = getDiscountStatus(discount);

    const statusStyles: Record<string, string> = {
      green:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",

      red:
        "bg-red-500/15 text-red-300 border border-red-500/30",

      orange:
        "bg-amber-500/15 text-amber-300 border border-amber-500/30",

      gray:
        "bg-slate-500/15 text-slate-300 border border-slate-500/30",
    };

    const statusTitles: Record<string, string> = {
      green: "Discount is currently active",
      red: "Discount has been manually disabled",
      orange: "Discount is scheduled for future activation",
      gray: "Discount validity period has expired",
    };

    return (
      <span
        title={statusTitles[status.color]}
        className={`
          inline-flex items-center justify-center
          min-w-[82px]
          px-2.5 py-1
          rounded-full
          text-[10px]
          font-semibold
          tracking-wide
          shadow-sm
          backdrop-blur-sm
          transition-all duration-200
          hover:scale-105
          ${statusStyles[status.color]}
        `}
      >
        {status.label}
      </span>
    );
  })()}
</td>

                {/* ✅ VALIDITY WITH TOOLTIP */}
                <td
                  className="py-2.5 px-3 text-center text-xs cursor-help"
                  title={`Start: ${start.toLocaleDateString()} | End: ${end.toLocaleDateString()}`}
                >
                  <div>
                    {isExpired ? (
                      <span className="text-red-400">Expired</span>
                    ) : totalDays > 0 ? (
                      <span className="text-emerald-400">
                        {totalDays} day{totalDays !== 1 ? "s" : ""} left
                      </span>
                    ) : (
                      <span className="text-orange-400">Ends Today</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {start.toLocaleDateString()} – {end.toLocaleDateString()}
                  </p>
                </td>

                {/* USAGE */}
                <td className="py-2.5 px-3 text-center text-xs">
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
                    {discount.discountLimitation}
                  </span>

                  {discount.limitationTimes && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {discount.limitationTimes} uses
                    </p>
                  )}
                </td>

                {/* ✅ ACTIONS (UNCHANGED) */}
<td className="py-2.5 px-3">
  <div className="flex items-center justify-center gap-1">

    {/* LIVE DISCOUNTS */}
    {!discount.isDeleted && (
      <>
        <button
          onClick={() => setViewingDiscount(discount)}
          className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => handleViewUsageHistory(discount)}
          className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded"
        >
          <History className="h-3.5 w-3.5" />
        </button>

        <Link
          href={`/admin/discounts/edit/${discount.id}`}
          className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded"
        >
          <Edit className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={() =>
            setDeleteConfirm({
              id: discount.id,
              name: discount.name,
            })
          }
          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </>
    )}

    {/* DELETED DISCOUNTS */}
    {discount.isDeleted && (
      <>
        <button
          onClick={() => handleViewUsageHistory(discount)}
          className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded"
        >
          <History className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => setRestoreConfirm(discount)}
          className="p-1.5 text-green-400 hover:bg-green-500/10 rounded"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </>
    )}

  </div>
</td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  )}
</div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-violet-500 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-slate-400">Total {totalItems} items</div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        title="Delete Discount"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

<DiscountModals
  key={`${showModal}-${editingDiscount?.id}`}
  discounts={discounts}
  getProductDiscount={getProductDiscount}
  showModal={showModal}
  productsLoading={productsLoading}
  setShowModal={setShowModal}
  viewingDiscount={viewingDiscount}
  setViewingDiscount={setViewingDiscount}
  usageHistoryModal={usageHistoryModal}
  setUsageHistoryModal={setUsageHistoryModal}
  isProductSelectionModalOpen={isProductSelectionModalOpen}
  setIsProductSelectionModalOpen={setIsProductSelectionModalOpen}
  formData={formData}
  setFormData={setFormData}
  editingDiscount={editingDiscount}
  products={products}
  categories={categories}
  categoryOptions={categoryOptions}
  brandOptions={brandOptions}
  filteredProductOptions={[
    ...productOptions,
    ...allSelectedProducts
      .filter(p => !productOptions.some(opt => opt.value === p.id))
      .map(p => ({
        value: p.id,
        label: p.name
      }))
  ]}
  categoryFilteredProductOptions={[
    ...productOptions,
    ...allSelectedProducts
      .filter(p => !productOptions.some(opt => opt.value === p.id))
      .map(p => ({
        value: p.id,
        label: p.name
      }))
  ]}
  productCategoryFilter={productCategoryFilter}
  setProductCategoryFilter={setProductCategoryFilter}
  productBrandFilter={productBrandFilter}
  setProductBrandFilter={setProductBrandFilter}
  productSearchTerm={productSearchTerm}
  setProductSearchTerm={setProductSearchTerm}
  customSelectStyles={customSelectStyles}
  handleSubmit={handleSubmit}
  handleDiscountTypeChange={handleDiscountTypeChange}
  resetForm={resetForm}
  handleEdit={handleEdit}
  getDiscountTypeIcon={getDiscountTypeIcon}
  getDiscountTypeLabel={getDiscountTypeLabel}
  isDiscountActive={isDiscountActive}
  selectedDiscountHistory={selectedDiscountHistory}
  usageHistory={usageHistory}
  loadingHistory={loadingHistory}
  dateRangeFilter={dateRangeFilter}
  setDateRangeFilter={setDateRangeFilter}
  handleViewUsageHistory={handleViewUsageHistory}
  handleUploadBannerImage={handleUploadBannerImage}
  handleDeleteBannerImage={handleDeleteBannerImage}

  // 🔥 ADD THIS (MOST IMPORTANT)
  desktopFile={desktopFile}
  mobileFile={mobileFile}
  setDesktopFile={setDesktopFile}
  setMobileFile={setMobileFile}
/>
      <ConfirmDialog
  isOpen={!!statusConfirm}
  onClose={() => setStatusConfirm(null)}
  onConfirm={handleStatusToggle}
  title="Change Status"
  message={`Are you sure you want to ${
    statusConfirm?.isActive ? "deactivate" : "activate"
  } "${statusConfirm?.name}"?`}
  confirmText="Confirm"
  cancelText="Cancel"
  isLoading={isUpdatingStatus}
/>
<ConfirmDialog
  isOpen={!!restoreConfirm}
  onClose={() => setRestoreConfirm(null)}
  onConfirm={handleRestore}
  title="Restore Discount"
  message={`Are you sure you want to restore "${restoreConfirm?.name}"?`}
  confirmText="Restore"
  cancelText="Cancel"
  isLoading={isRestoring}
/>


{imageModal && (
  <div
    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[40] flex items-center justify-center p-4"
    onClick={() => setImageModal(null)}
  >
    <div
      className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full p-4 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-white font-semibold text-lg">
          {imageModal.name}
        </h2>

        <button
          onClick={() => setImageModal(null)}
          className="p-2 hover:bg-red-500/20 bg-red-500/20 text-white rounded-lg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* IMAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* DESKTOP */}
        <div>
          <p className="text-sm text-slate-400 mb-2">Desktop Banner</p>

          {imageModal.desktopBannerImageUrl ? (
          <img
  src={getImageUrl(imageModal.desktopBannerImageUrl)}
  className="w-full h-56 object-cover rounded-lg border border-slate-600 cursor-pointer hover:scale-105 transition"
  onClick={() => setPreviewImage(imageModal.desktopBannerImageUrl)}
  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
/>
          ) : (
            <div className="h-56 flex items-center justify-center bg-slate-800 rounded-lg text-slate-500">
              No Desktop Image
            </div>
          )}
        </div>

        {/* MOBILE */}
        <div>
          <p className="text-sm text-slate-400 mb-2">Mobile Banner</p>

          {imageModal.mobileBannerImageUrl ? (
          <img
  src={getImageUrl(imageModal.mobileBannerImageUrl)}
  className="w-full h-56 object-cover rounded-lg border border-slate-600 cursor-pointer hover:scale-105 transition"
  onClick={() => setPreviewImage(imageModal.mobileBannerImageUrl)}
  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
/>
          ) : (
            <div className="h-56 flex items-center justify-center bg-slate-800 rounded-lg text-slate-500">
              No Mobile Image
            </div>
          )}
        </div>

      </div>
    </div>
  </div>
)}
<ImagePreviewModal
  imageUrl={previewImage}
  onClose={() => setPreviewImage(null)}
/>
    </div>
  );
}
