"use client";
import * as XLSX from "xlsx";
import { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import {
  Search,
  X,
 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  FilterX,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
 
  AlertCircle,
  Clock,
  User,
  Package,
  ShoppingCart,
  FileText,
  Trash2,
  RotateCcw,
  Database,
  Users,
  Layers,
  Shield,
  Settings,
  AlertTriangle,
} from "lucide-react";

import { useToast } from "@/app/admin/_components/CustomToast";
import {
  activityLogService,
  ActivityLog,
  ActivityLogQueryParams,
  ActivityLogType,
} from "@/lib/services/activityLog";
import { useDebounce } from "../_hooks/useDebounce";
import { formatRelativeDate } from "@/lib/services/loyaltyPoints";
import { formatValue } from "../_utils/formatUtils";

// ✅ Types
type SortField = "createdOnUtc" | "activityLogType" | "userName" | "entityName";
type SortDirection = "asc" | "desc";

// ✅ All Activity Types from Enum
const ACTIVITY_TYPES: { value: ActivityLogType | "all"; label: string }[] = [
  { value: "all", label: "All Activities" },
  { value: "AddProduct", label: "Add Product" },
  { value: "UpdateProduct", label: "Update Product" },
  { value: "DeleteProduct", label: "Delete Product" },
  { value: "AddCategory", label: "Add Category" },
  { value: "UpdateCategory", label: "Update Category" },
  { value: "DeleteCategory", label: "Delete Category" },
  { value: "AddBrand", label: "Add Brand" },
  { value: "UpdateBrand", label: "Update Brand" },
  { value: "DeleteBrand", label: "Delete Brand" },
  { value: "AddOrder", label: "Add Order" },
  { value: "UpdateOrder", label: "Update Order" },
  { value: "CancelOrder", label: "Cancel Order" },
  { value: "CreateShipment", label: "Create Shipment" },
  { value: "AddCustomer", label: "Add Customer" },
  { value: "UpdateCustomer", label: "Update Customer" },
  { value: "DeleteCustomer", label: "Delete Customer" },
  { value: "UserLogin", label: "User Login" },
  { value: "UserLogout", label: "User Logout" },
  { value: "UserRegister", label: "User Register" },
  { value: "AddBanner", label: "Add Banner" },
  { value: "UpdateBanner", label: "Update Banner" },
  { value: "DeleteBanner", label: "Delete Banner" },
  { value: "AddBlogPost", label: "Add Blog Post" },
  { value: "UpdateBlogPost", label: "Update Blog Post" },
  { value: "DeleteBlogPost", label: "Delete Blog Post" },
  { value: "AddBlogCategory", label: "Add Blog Category" },
  { value: "UpdateBlogCategory", label: "Update Blog Category" },
  { value: "DeleteBlogCategory", label: "Delete Blog Category" },
  { value: "AddBlogComment", label: "Add Blog Comment" },
  { value: "UpdateBlogComment", label: "Update Blog Comment" },
  { value: "DeleteBlogComment", label: "Delete Blog Comment" },
  { value: "AddProductReview", label: "Add Product Review" },
  { value: "UpdateProductReview", label: "Update Product Review" },
  { value: "DeleteProductReview", label: "Delete Product Review" },
  { value: "RejectProductReview", label: "Reject Product Review" },
  { value: "AddDiscount", label: "Add Discount" },
  { value: "UpdateDiscount", label: "Update Discount" },
  { value: "DeleteDiscount", label: "Delete Discount" },
  { value: "AddShippingZone", label: "Add Shipping Zone" },
  { value: "UpdateShippingZone", label: "Update Shipping Zone" },
  { value: "DeleteShippingZone", label: "Delete Shipping Zone" },
  { value: "AddShippingMethod", label: "Add Shipping Method" },
  { value: "UpdateShippingMethod", label: "Update Shipping Method" },
  { value: "DeleteShippingMethod", label: "Delete Shipping Method" },
  { value: "AddVATRate", label: "Add VAT Rate" },
  { value: "UpdateVATRate", label: "Update VAT Rate" },
  { value: "DeleteVATRate", label: "Delete VAT Rate" },
  { value: "AddNewsletterSubscription", label: "Add Newsletter Subscription" },
  { value: "DeleteNewsletterSubscription", label: "Delete Newsletter Subscription" },
  { value: "AddSubscription", label: "Add Subscription" },
  { value: "UpdateSubscription", label: "Update Subscription" },
  { value: "CancelSubscription", label: "Cancel Subscription" },
  { value: "AddLoyaltyPoints", label: "Add Loyalty Points" },
  { value: "RedeemLoyaltyPoints", label: "Redeem Loyalty Points" },
  { value: "BulkUpdateInventory", label: "Bulk update Inventory" },
  { value: "UpdateSettings", label: "Update Settings" },
  { value: "Other", label: "Other" },
];
const Info = ({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) => (
  <div>
    <p className="text-slate-400 text-xs mb-1">{label}</p>
    <p
      className={`text-white break-words ${
        mono ? "font-mono text-xs" : "font-medium"
      }`}
    >
      {children ?? "-"}
    </p>
  </div>
);

const formatLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());


// ✅ Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = true,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-red-500/20 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-red-500/10">
        {/* Modal Header */}
        <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-slate-400 text-sm">This action requires confirmation</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-white text-base leading-relaxed">{message}</p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              isDangerous
                ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-red-500/50"
                : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-violet-500/50"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ActivityLogsPage() {
  const toast = useToast();

  // ✅ State Management
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Bulk Selection
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  // ✅ Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // ✅ Advanced Filters
  const [filters, setFilters] = useState({
    activityType: "all" as string,
    entityType: "all",
    dateFrom: "",
    dateTo: "",
    userName: "all",
  });
// ✅ Helper function to check if date range matches preset
const isDateRangeEqual = (days: number) => {
  if (!filters.dateFrom || !filters.dateTo) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fromDate = new Date(filters.dateFrom);
  fromDate.setHours(0, 0, 0, 0);
  
  const toDate = new Date(filters.dateTo);
  toDate.setHours(0, 0, 0, 0);
  
  const expectedFrom = new Date(today);
  expectedFrom.setDate(today.getDate() - days);
  expectedFrom.setHours(0, 0, 0, 0);
  
  return (
    fromDate.getTime() === expectedFrom.getTime() &&
    toDate.getTime() === today.getTime()
  );
};
  // ✅ Sorting
  const [sortField, setSortField] = useState<SortField>("createdOnUtc");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ✅ UI States
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



// ✅ Fetch Activity Logs - FIXED
const fetchActivityLogs = useCallback(async () => {
  try {
    setLoading(true);

    const params: ActivityLogQueryParams = {
      page: 1,
      pageSize: 10000,
      sortDirection: "desc",
    };

    if (debouncedSearchTerm) {
      params.searchTerm = debouncedSearchTerm;
    }

    const response = await activityLogService.getAll(params);

    // ✅ FIXED: Handle potentially undefined response.data with optional chaining
    if (response?.data?.success) {
      const fetchedLogs = response.data.data.items || [];
      setAllActivityLogs(fetchedLogs);

      // Apply filters and sorting
      let filteredLogs = applyFilters(fetchedLogs);
      filteredLogs = applySorting(filteredLogs);

      setTotalCount(filteredLogs.length);

      // Pagination
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);
      setActivityLogs(paginatedLogs);
    } else {
      toast.error(response?.data?.message || "Failed to fetch activity logs");
      setActivityLogs([]);
      setAllActivityLogs([]);
    }
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    
    if (error?.response?.status === 401) {
      toast.error("Session expired. Please login again.");
    } else {
      toast.error(error?.response?.data?.message || "Failed to fetch activity logs");
    }
    
    setActivityLogs([]);
    setAllActivityLogs([]);
  } finally {
    setLoading(false);
  }
}, [currentPage, pageSize, debouncedSearchTerm, filters, sortField, sortDirection, toast]);


  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // ✅ Apply Advanced Filters
  const applyFilters = (logsList: ActivityLog[]) => {
    let filtered = [...logsList];

    // Activity Type Filter
    if (filters.activityType !== "all") {
      filtered = filtered.filter((log) => log.activityLogType === filters.activityType);
    }

    // Entity Type Filter
    if (filters.entityType !== "all") {
      filtered = filtered.filter((log) => log.entityName === filters.entityType);
    }

    // Date Range
    if (filters.dateFrom) {
      filtered = filtered.filter((log) => new Date(log.createdOnUtc) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => new Date(log.createdOnUtc) <= endDate);
    }

    // User Filter
    if (filters.userName !== "all") {
      filtered = filtered.filter((log) => log.userName === filters.userName);
    }

    return filtered;
  };

  // ✅ Apply Sorting
  const applySorting = (logsList: ActivityLog[]) => {
    const sorted = [...logsList];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "createdOnUtc":
          comparison = new Date(a.createdOnUtc).getTime() - new Date(b.createdOnUtc).getTime();
          break;
        case "activityLogType":
          comparison = a.activityLogType.localeCompare(b.activityLogType);
          break;
        case "userName":
          comparison = a.userName.localeCompare(b.userName);
          break;
        case "entityName":
          comparison = a.entityName.localeCompare(b.entityName);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  // ✅ Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // ✅ Get Sort Icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-400" />
    );
  };

  // ✅ Calculate Stats
  const calculateStats = () => {
    const total = allActivityLogs.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allActivityLogs.filter((log) => new Date(log.createdOnUtc) >= today).length;

    const activityTypes = new Set(allActivityLogs.map((log) => log.activityLogType));
    const uniqueActivityTypes = activityTypes.size;

    const entityTypes = new Set(allActivityLogs.map((log) => log.entityName));
    const uniqueEntities = entityTypes.size;

    return {
      total,
      todayCount,
      uniqueActivityTypes,
      uniqueEntities,
    };
  };

  const stats = calculateStats();

  // ✅ Get Unique Users
  const getUniqueUsers = () => {
    const users = new Set(allActivityLogs.map((log) => log.userName));
    return Array.from(users);
  };

  // ✅ Get Unique Entity Types
  const getUniqueEntityTypes = () => {
    const entities = new Set(allActivityLogs.map((log) => log.entityName));
    return Array.from(entities);
  };

  // ✅ Bulk Selection
  const toggleSelectAll = () => {
    if (selectedLogs.length === activityLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(activityLogs.map((log) => log.id));
    }
  };

  const toggleSelectLog = (logId: string) => {
    setSelectedLogs((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  // ✅ Export Functions
const generateExcel = (logs: any[]) => {
  try {
    const excelData = logs.map((log) => ({
      ID: log.id || "N/A",

      User: log.userName || "N/A",

      Action: log.activityLogType || "N/A",

      Module: log.entityName || "N/A",

      Description: log.comment || "N/A",

      "IP Address": log.ipAddress || "N/A",

      Status: log.entityDetails?.status || "N/A",

      "Order Number": log.entityDetails?.orderNumber || "N/A",

      "Total Amount": log.entityDetails?.totalAmount ?? "N/A",

      "Customer Email": log.entityDetails?.customerEmail || "N/A",

      "Order Date": log.entityDetails?.orderDate
        ? new Date(log.entityDetails.orderDate).toLocaleString()
        : "N/A",

      "Is Deleted": log.entityDetails?.isDeleted ?? "N/A",

      "Created At": log.createdOnUtc
        ? new Date(log.createdOnUtc).toLocaleString()
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

 const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
  wch: Math.max(
    key.length,
    ...excelData.map((row) => String((row as Record<string, any>)[key] ?? "").length)
  ),
}));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");

    XLSX.writeFile(workbook, `activity_logs_${Date.now()}.xlsx`);
  } catch (err) {
    console.error(err);
  }
};
const handleExportSelected = () => {
  if (selectedLogs.length === 0) {
    toast.warning("Please select logs to export");
    return;
  }

  const logsToExport = allActivityLogs.filter((log) =>
    selectedLogs.includes(log.id)
  );

  generateExcel(logsToExport);

  toast.success(`${logsToExport.length} logs exported successfully`);
  setSelectedLogs([]);
  setShowExportMenu(false);
};
const handleExportFiltered = () => {
  const filteredLogs = applyFilters(allActivityLogs);

  if (filteredLogs.length === 0) {
    toast.warning("No logs to export");
    return;
  }

  generateExcel(filteredLogs);

  toast.success(`${filteredLogs.length} logs exported successfully`);
  setShowExportMenu(false);
};

const handleExportAll = () => {
  if (allActivityLogs.length === 0) {
    toast.warning("No logs to export");
    return;
  }

  generateExcel(allActivityLogs);

  toast.success(`${allActivityLogs.length} logs exported successfully`);
  setShowExportMenu(false);
};

const handleExportCurrentPage = () => {
  if (activityLogs.length === 0) {
    toast.warning("No logs on current page");
    return;
  }

  generateExcel(activityLogs);

  toast.success(`${activityLogs.length} logs exported successfully`);
  setShowExportMenu(false);
};

// ✅ Clear All Logs with Confirmation - FIXED
const handleClearAllLogs = () => {
  setConfirmModal({
    isOpen: true,
    title: "Clear All Activity Logs",
    message: `Are you sure you want to permanently delete ALL ${allActivityLogs.length} activity logs? This action cannot be undone and will remove all historical data.`,
    onConfirm: async () => {
      try {
        const response = await activityLogService.clearAll();
        
        // ✅ FIXED: Handle potentially undefined response.data
        if (response?.data?.success) {
          toast.success("All activity logs cleared successfully");
          setSelectedLogs([]);
          fetchActivityLogs();
        } else {
          toast.error(response?.data?.message || "Failed to clear activity logs");
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else {
          toast.error(error?.response?.data?.message || "An error occurred while clearing logs");
        }
      }
    },
  });
};

// ✅ Delete Selected Logs with Confirmation - FIXED
const handleDeleteSelected = () => {
  if (selectedLogs.length === 0) {
    toast.warning("Please select logs to delete");
    return;
  }

  setConfirmModal({
    isOpen: true,
    title: "Delete Selected Logs",
    message: `Are you sure you want to delete ${selectedLogs.length} selected log(s)? This action cannot be undone.`,
    onConfirm: async () => {
      try {
        let successCount = 0;
        let failCount = 0;

        for (const logId of selectedLogs) {
          try {
            const response = await activityLogService.deleteById(logId);
            
            // ✅ FIXED: Handle potentially undefined response.data
            if (response?.data?.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} log(s) deleted successfully`);
        }
        if (failCount > 0) {
          toast.error(`${failCount} log(s) failed to delete`);
        }

        setSelectedLogs([]);
        fetchActivityLogs();
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else {
          toast.error(error?.response?.data?.message || "An error occurred while deleting logs");
        }
      }
    },
  });
};

// ✅ Delete Single Log with Confirmation - FIXED
const handleDeleteSingleLog = (log: ActivityLog) => {
  setConfirmModal({
    isOpen: true,
    title: "Delete Activity Log",
    message: `Are you sure you want to delete this activity log?\n\n"${log.comment}"\n\nThis action cannot be undone.`,
    onConfirm: async () => {
      try {
        const response = await activityLogService.deleteById(log.id);
        
        // ✅ FIXED: Handle potentially undefined response.data
        if (response?.data?.success) {
          toast.success("Activity log deleted successfully");
          fetchActivityLogs();
        } else {
          toast.error(response?.data?.message || "Failed to delete activity log");
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else {
          toast.error(error?.response?.data?.message || "An error occurred while deleting log");
        }
      }
    },
  });
};

  // ✅ Filter Functions
  const clearFilters = () => {
    setFilters({
      activityType: "all",
      entityType: "all",
      dateFrom: "",
      dateTo: "",
      userName: "all",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.activityType !== "all" ||
    filters.entityType !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.userName !== "all" ||
    searchTerm.trim();

  // ✅ Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  const getPageNumbers = () => {
    const pages = [];
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

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // ✅ Format Functions
  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatExactDate = (date?: string) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

 

  // ✅ Get Activity Type Badge
  const getActivityTypeBadge = (activityType: string) => {
    const typeMap: Record<string, { color: string; bg: string; border: string; icon: any }> = {
      AddProduct: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: Package },
      UpdateProduct: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Package },
      DeleteProduct: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Package },
      AddOrder: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: ShoppingCart },
      UpdateOrder: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: ShoppingCart },
      AddCustomer: { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: Users },
      UpdateCustomer: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Users },
      UserLogin: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Shield },
      UserLogout: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Shield },
    };

    const config = typeMap[activityType] || { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Activity };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
        <Icon className="h-3 w-3" />
        {activityType}
      </span>
    );
  };

  // ✅ Get Entity Badge
  const getEntityBadge = (entityName: string) => {
    const entityMap: Record<string, { color: string; bg: string; border: string; icon: any }> = {
      Product: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: Package },
      Order: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: ShoppingCart },
      Customer: { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: Users },
      Category: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Layers },
      Brand: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: FileText },
    };

    const config = entityMap[entityName] || { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Database };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
        <Icon className="h-3 w-3" />
        {entityName}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ✅ Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDangerous={true}
      />

      {/* ✅ Header with Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Activity Logs
          </h1>
          <p className="text-slate-400 mt-0.5">Monitor and track all system activities</p>
        </div>

        {/* Button Group: Export + Clear All */}
        <div className="flex items-center gap-2">
          {/* Export to Excel Button */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export logs to Excel"
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export to Excel</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Export Menu */}
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                

                  <button
                    onClick={handleExportCurrentPage}
                    className="w-full px-3 py-2.5 text-left text-white hover:bg-slate-700 transition-all flex items-center gap-2.5 border-b border-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium">Export Current Page</p>
                      <p className="text-xs text-slate-400">{activityLogs.length} logs</p>
                    </div>
                  </button>

                  {hasActiveFilters && (
                    <button
                      onClick={handleExportFiltered}
                      className="w-full px-3 py-2.5 text-left text-white hover:bg-slate-700 transition-all flex items-center gap-2.5 border-b border-slate-700"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="text-sm font-medium">Export Filtered Results</p>
                        <p className="text-xs text-slate-400">{totalCount} logs</p>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={handleExportAll}
                    className="w-full px-3 py-2.5 text-left text-white hover:bg-slate-700 transition-all flex items-center gap-2.5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Export All Logs</p>
                      <p className="text-xs text-slate-400">{allActivityLogs.length} logs</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete Selected Button */}
          {selectedLogs.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              title="Delete selected logs"
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-red-500/50 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Delete ({selectedLogs.length})</span>
            </button>
          )}

          {/* Clear All Button */}
          <button
            onClick={handleClearAllLogs}
            title="Clear all activity logs"
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm">Clear All</span>
          </button>
        </div>
      </div>

      {/* ✅ Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Total Logs */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-xl p-3 hover:border-violet-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Total Logs</p>
              <p className="text-white text-xl font-bold truncate">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 2. Today's Activity */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Today's Activity</p>
              <p className="text-white text-xl font-bold truncate">{stats.todayCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 3. Activity Types */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3 hover:border-green-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Activity Types</p>
              <p className="text-white text-xl font-bold truncate">{stats.uniqueActivityTypes}</p>
            </div>
          </div>
        </div>

        {/* 4. Entity Types */}
        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/20 rounded-xl p-3 hover:border-pink-500/50 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5 text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium">Entity Types</p>
              <p className="text-white text-xl font-bold truncate">{stats.uniqueEntities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Items Per Page */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-slate-400">entries per page</span>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="text-white font-semibold">{startIndex + 1}</span> to{" "}
            <span className="text-white font-semibold">{endIndex}</span> of{" "}
            <span className="text-white font-semibold">{totalCount}</span> entries
          </div>
        </div>
      </div>

 {/* ✅ Search and Filters */}
<div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5">
  {/* ========== FIRST ROW: Search + Select Filters ========== */}
  <div className="flex flex-wrap items-center gap-2">
    {/* Search */}
    <div className="relative flex-1 min-w-[280px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
      <input
        type="search"
        placeholder="Search by comment, user, or entity..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      />
    </div>

    {/* Activity Type Filter - React Select */}
    <div className="w-[200px]">
      <Select
        value={ACTIVITY_TYPES.find((type) => type.value === filters.activityType)}
        onChange={(option) => {
          setFilters({ ...filters, activityType: option?.value || "all" });
          setCurrentPage(1);
        }}
        options={ACTIVITY_TYPES}
        placeholder="All Activities"
        isClearable={false}
        isSearchable={true}
        menuPortalTarget={document.body}
        menuPosition="absolute"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: filters.activityType !== "all" ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.9)",
            borderColor: filters.activityType !== "all" ? "rgb(59, 130, 246)" : "rgb(71, 85, 105)",
            borderWidth: "1px",
            borderRadius: "0.5rem",
            padding: "0px 4px",
            minHeight: "38px",
            boxShadow: filters.activityType !== "all" ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
            cursor: "pointer",
            "&:hover": {
              borderColor: "rgb(139, 92, 246)",
            },
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "rgb(30, 41, 59)",
            border: "1px solid rgb(71, 85, 105)",
            borderRadius: "0.5rem",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            maxHeight: "300px",
            "::-webkit-scrollbar": {
              width: "8px",
            },
            "::-webkit-scrollbar-track": {
              background: "rgb(30, 41, 59)",
            },
            "::-webkit-scrollbar-thumb": {
              background: "rgb(71, 85, 105)",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "rgb(100, 116, 139)",
            },
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "rgb(139, 92, 246)"
              : state.isFocused
              ? "rgb(51, 65, 85)"
              : "transparent",
            color: "white",
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: "8px 12px",
            "&:active": {
              backgroundColor: "rgb(139, 92, 246)",
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
          }),
          input: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
          }),
          placeholder: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            fontSize: "0.75rem",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            padding: "4px",
            "&:hover": {
              color: "white",
            },
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
        }}
      />
    </div>

    {/* Entity Type Filter - React Select */}
    <div className="w-[180px]">
      <Select
        value={
          filters.entityType === "all"
            ? { value: "all", label: "All Entities" }
            : { value: filters.entityType, label: filters.entityType }
        }
        onChange={(option) => {
          setFilters({ ...filters, entityType: option?.value || "all" });
          setCurrentPage(1);
        }}
        options={[
          { value: "all", label: "All Entities" },
          ...getUniqueEntityTypes().map((entity) => ({
            value: entity,
            label: entity,
          })),
        ]}
        placeholder="All Entities"
        isClearable={false}
        isSearchable={true}
        menuPortalTarget={document.body}
        menuPosition="absolute"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: filters.entityType !== "all" ? "rgba(236, 72, 153, 0.1)" : "rgba(30, 41, 59, 0.9)",
            borderColor: filters.entityType !== "all" ? "rgb(236, 72, 153)" : "rgb(71, 85, 105)",
            borderWidth: "1px",
            borderRadius: "0.5rem",
            padding: "0px 4px",
            minHeight: "38px",
            boxShadow: filters.entityType !== "all" ? "0 0 0 2px rgba(236, 72, 153, 0.5)" : "none",
            cursor: "pointer",
            "&:hover": {
              borderColor: "rgb(139, 92, 246)",
            },
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "rgb(30, 41, 59)",
            border: "1px solid rgb(71, 85, 105)",
            borderRadius: "0.5rem",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            maxHeight: "300px",
            "::-webkit-scrollbar": {
              width: "8px",
            },
            "::-webkit-scrollbar-track": {
              background: "rgb(30, 41, 59)",
            },
            "::-webkit-scrollbar-thumb": {
              background: "rgb(71, 85, 105)",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "rgb(100, 116, 139)",
            },
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "rgb(236, 72, 153)"
              : state.isFocused
              ? "rgb(51, 65, 85)"
              : "transparent",
            color: "white",
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: "8px 12px",
            "&:active": {
              backgroundColor: "rgb(236, 72, 153)",
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
          }),
          input: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
          }),
          placeholder: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            fontSize: "0.75rem",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            padding: "4px",
            "&:hover": {
              color: "white",
            },
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
        }}
      />
    </div>

    {/* User Filter - React Select */}
    <div className="w-[180px]">
      <Select
        value={
          filters.userName === "all"
            ? { value: "all", label: "All Users" }
            : {
                value: filters.userName,
                label: filters.userName === "System" ? "System" : filters.userName,
              }
        }
        onChange={(option) => {
          setFilters({ ...filters, userName: option?.value || "all" });
          setCurrentPage(1);
        }}
        options={[
          { value: "all", label: "All Users" },
          ...getUniqueUsers().map((user) => ({
            value: user,
            label: user === "System" ? "System" : user,
          })),
        ]}
        placeholder="All Users"
        isClearable={false}
        isSearchable={true}
        menuPortalTarget={document.body}
        menuPosition="absolute"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: filters.userName !== "all" ? "rgba(34, 211, 238, 0.1)" : "rgba(30, 41, 59, 0.9)",
            borderColor: filters.userName !== "all" ? "rgb(34, 211, 238)" : "rgb(71, 85, 105)",
            borderWidth: "1px",
            borderRadius: "0.5rem",
            padding: "0px 4px",
            minHeight: "38px",
            boxShadow: filters.userName !== "all" ? "0 0 0 2px rgba(34, 211, 238, 0.5)" : "none",
            cursor: "pointer",
            "&:hover": {
              borderColor: "rgb(139, 92, 246)",
            },
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "rgb(30, 41, 59)",
            border: "1px solid rgb(71, 85, 105)",
            borderRadius: "0.5rem",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          }),
          menuList: (base) => ({
            ...base,
            padding: 0,
            maxHeight: "300px",
            "::-webkit-scrollbar": {
              width: "8px",
            },
            "::-webkit-scrollbar-track": {
              background: "rgb(30, 41, 59)",
            },
            "::-webkit-scrollbar-thumb": {
              background: "rgb(71, 85, 105)",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "rgb(100, 116, 139)",
            },
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "rgb(34, 211, 238)"
              : state.isFocused
              ? "rgb(51, 65, 85)"
              : "transparent",
            color: "white",
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: "8px 12px",
            "&:active": {
              backgroundColor: "rgb(34, 211, 238)",
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "500",
          }),
          input: (base) => ({
            ...base,
            color: "white",
            fontSize: "0.75rem",
          }),
          placeholder: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            fontSize: "0.75rem",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "rgb(148, 163, 184)",
            padding: "4px",
            "&:hover": {
              color: "white",
            },
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
        }}
      />
    </div>

    {/* Advanced Filters Toggle */}
    <button
      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
      className={`px-3 py-2 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${
        showAdvancedFilters
          ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
          : "bg-slate-800/50 border-slate-600 text-slate-400 hover:text-white hover:border-violet-500/50"
      }`}
    >
      <Filter className="h-3.5 w-3.5" />
      Advanced
      <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
    </button>

    {hasActiveFilters && (
      <button
        onClick={clearFilters}
        className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
      >
        <FilterX className="h-3.5 w-3.5" />
        Clear All
      </button>
    )}
  </div>

  {/* ========== SECOND ROW: Advanced Date Filters (All Inline) ========== */}
  {showAdvancedFilters && (
    <div className="mt-3 pt-3 border-t border-slate-700">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date From */}
        <div className="flex-1 min-w-[180px]">
          <input
            type="date"
            title="Date From"
            placeholder="Date From"
            value={filters.dateFrom}
            onChange={(e) => {
              setFilters({ ...filters, dateFrom: e.target.value });
              setCurrentPage(1);
            }}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-2.5 py-1.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Date To */}
        <div className="flex-1 min-w-[180px]">
          <input
            type="date"
            title="Date To"
            placeholder="Date To"
            value={filters.dateTo}
            onChange={(e) => {
              setFilters({ ...filters, dateTo: e.target.value });
              setCurrentPage(1);
            }}
            max={new Date().toISOString().split("T")[0]}
            min={filters.dateFrom}
            className="w-full px-2.5 py-1.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Quick Filters - Inline */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              setFilters({
                ...filters,
                dateFrom: weekAgo.toISOString().split("T")[0],
                dateTo: today.toISOString().split("T")[0],
              });
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.dateFrom && filters.dateTo && isDateRangeEqual(7)
                ? "bg-violet-500/20 border-2 border-violet-500/50 text-violet-400"
                : "bg-slate-800/50 border border-slate-600 text-slate-400 hover:text-white hover:border-violet-500/50"
            }`}
          >
            7 Days
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const daysAgo = new Date(today);
              daysAgo.setDate(today.getDate() - 15);
              setFilters({
                ...filters,
                dateFrom: daysAgo.toISOString().split("T")[0],
                dateTo: today.toISOString().split("T")[0],
              });
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.dateFrom && filters.dateTo && isDateRangeEqual(15)
                ? "bg-violet-500/20 border-2 border-violet-500/50 text-violet-400"
                : "bg-slate-800/50 border border-slate-600 text-slate-400 hover:text-white hover:border-violet-500/50"
            }`}
          >
            15 Days
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date(today);
              monthAgo.setMonth(today.getMonth() - 1);
              setFilters({
                ...filters,
                dateFrom: monthAgo.toISOString().split("T")[0],
                dateTo: today.toISOString().split("T")[0],
              });
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.dateFrom && filters.dateTo && isDateRangeEqual(30)
                ? "bg-violet-500/20 border-2 border-violet-500/50 text-violet-400"
                : "bg-slate-800/50 border border-slate-600 text-slate-400 hover:text-white hover:border-violet-500/50"
            }`}
          >
            30 Days
          </button>

          <button
            onClick={() => {
              const today = new Date();
              setFilters({
                ...filters,
                dateFrom: today.toISOString().split("T")[0],
                dateTo: today.toISOString().split("T")[0],
              });
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.dateFrom && filters.dateTo && isDateRangeEqual(0)
                ? "bg-violet-500/20 border-2 border-violet-500/50 text-violet-400"
                : "bg-slate-800/50 border border-slate-600 text-slate-400 hover:text-white hover:border-violet-500/50"
            }`}
          >
            Today
          </button>

          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => {
                setFilters({ ...filters, dateFrom: "", dateTo: "" });
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )}
</div>



      {/* ✅ Activity Logs Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
        {activityLogs.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="h-14 w-14 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No activity logs found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 sticky top-0 z-10">
                <tr className="border-b border-slate-700">
                  {/* Bulk Select */}
                  <th className="py-2 px-3">
                    <input
                      type="checkbox"
                     checked={
  activityLogs.length > 0 &&
  activityLogs.every(log => selectedLogs.includes(log.id))
}
                      onChange={toggleSelectAll}
                      className="rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>

                  {/* Date/Time - Sortable */}
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("createdOnUtc")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      Date/Time
                      {getSortIcon("createdOnUtc")}
                    </button>
                  </th>

                  {/* Activity Type - Sortable */}
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("activityLogType")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      Activity Type
                      {getSortIcon("activityLogType")}
                    </button>
                  </th>

                  {/* Entity - Sortable */}
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("entityName")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      Entity
                      {getSortIcon("entityName")}
                    </button>
                  </th>

                  {/* Comment */}
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">Comment</th>

                  {/* User - Sortable */}
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("userName")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      User
                      {getSortIcon("userName")}
                    </button>
                  </th>

                  {/* Actions */}
                  <th className="text-center py-2 px-3 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>

              <tbody>
                {activityLogs.map((log) => (
                  <tr
                    key={log.id}
        className={`border-b border-slate-800 transition-colors group
  ${
    selectedLogs.includes(log.id)
      ? "bg-violet-500/10 ring-1 ring-violet-500/40"
      : "hover:bg-slate-800/30"
  }
`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id)}
                        onChange={() => toggleSelectLog(log.id)}
                        className="rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>

                    {/* Date/Time */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500 group-hover:text-violet-400 transition-colors" />
                        <div>
                          <p className="text-white text-sm font-medium">{formatDate(log.createdOnUtc)}</p>
                          <p
                            className="text-xs text-slate-400 cursor-help"
                            title={formatExactDate(log.createdOnUtc)}
                          >
                            {formatRelativeDate(log.createdOnUtc)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Activity Type */}
                    <td className="py-2.5 px-3">{getActivityTypeBadge(log.activityLogType)}</td>

                    {/* Entity */}
                    <td className="py-2.5 px-3">{getEntityBadge(log.entityName)}</td>

                    {/* Comment */}
                    <td className="py-2.5 px-3">
                      <p className="text-white text-sm line-clamp-2 max-w-md" title={log.comment}>
                        {log.comment}
                      </p>
                    </td>

                    {/* User */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-500" />
                        <span className="text-white text-sm font-medium">
                          {log.userName === "System" ? "System" : log.userName.substring(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingleLog(log)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
                          title="Delete Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
{selectedLogs.length > 0 && (
  <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">

    <div className="flex justify-center px-2">

      <div className="pointer-events-auto mx-auto w-fit max-w-[95%] sm:max-w-[900px] 
        rounded-xl border border-slate-700 bg-slate-900/95 
        px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300">

        <div className="flex flex-wrap items-center gap-3">

          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
              <span className="font-semibold text-white">
                {selectedLogs.length}
              </span>
              <span className="text-slate-300">logs selected</span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Bulk actions: export selected logs or delete them permanently.
            </p>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700 hidden md:block" />

          {/* EXPORT */}
          <button
            onClick={handleExportSelected}
            className="inline-flex items-center gap-2 rounded-lg 
            bg-emerald-600 px-4 py-2 text-sm font-medium text-white 
            hover:bg-emerald-700 transition-all"
          >
            <Download className="h-4 w-4" />
            Export ({selectedLogs.length})
          </button>

          {/* DELETE */}
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 rounded-lg 
            bg-red-600 px-4 py-2 text-sm font-medium text-white 
            hover:bg-red-700 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          {/* CLEAR */}
          <button
            onClick={() => setSelectedLogs([])}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 
            text-white text-sm rounded-lg transition-all"
          >
            Clear
          </button>

        </div>
      </div>

    </div>
  </div>
)}
      {/* ✅ Pagination */}
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

            <div className="text-sm text-slate-400">Total: {totalCount} items</div>
          </div>
        </div>
      )}

   {/* ✅ Activity Log Details Modal */}
{isModalOpen && selectedLog && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-500/10">

      {/* Header */}
      <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  Activity Log Details
                </h2>
                {getActivityTypeBadge(selectedLog.activityLogTypeName)}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                {formatExactDate(selectedLog.createdOnUtc)}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(false);
              setSelectedLog(null);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-5 space-y-5">

        {/* Basic Info */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" />
            Basic Information
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Activity Type">
              {selectedLog.activityLogTypeName}
            </Info>

            <Info label="Entity Type">
              {selectedLog.entityName}
            </Info>

            {/* <Info label="User">
              {selectedLog.userName || "System"}
            </Info> */}

            {/* {selectedLog.entityId && (
              <Info label="Entity ID" mono>
                {selectedLog.entityId}
              </Info>
            )} */}

            {selectedLog.ipAddress && (
              <Info label="IP Address">
                {selectedLog.ipAddress}
              </Info>
            )}
          </div>
        </div>

        {/* Comment */}
        {selectedLog.comment && (
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              Activity Comment
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {selectedLog.comment}
            </p>
          </div>
        )}

        {/* Entity Details (Formatted View) */}
        {selectedLog.entityDetails && (
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-pink-400" />
              Entity Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(selectedLog.entityDetails).map(
                ([key, value]) => (
                  <Info
                    key={key}
                    label={formatLabel(key)}
                    mono={key.toLowerCase().includes("id")}
                  >
                    {formatValue(value)}
                  </Info>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

    </div>
  );
}
