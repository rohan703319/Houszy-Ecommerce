"use client";
import * as XLSX from "xlsx";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  SlidersHorizontal,
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
  Paperclip,
  CheckCircle2,
  Calendar,
  Lock,
  Folder,
  Boxes,
  Info as InfoIcon,
} from "lucide-react";

import { useToast } from "@/app/admin/_components/CustomToast";
import { useTheme } from "@/app/admin/_context/theme-provider";
import { useAuth } from "@/app/admin/_context/auth-context";
import {
  activityLogService,
  ActivityLog,
  ActivityLogQueryParams,
  ActivityLogType,
  UploadedFileItem,
  AuditTrailEventItem,
} from "@/lib/services/activityLog";
import { useDebounce } from "../_hooks/useDebounce";
import { formatRelativeDate } from "@/lib/services/loyaltyPoints";
import { formatValue } from "../_utils/formatUtils";

// ✅ Types
type SortField = "createdOnUtc" | "activityLogType" | "userName" | "entityName";
type SortDirection = "asc" | "desc";
type TabType = "logs" | "files" | "audit";

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
  { value: "BulkUpdateInventory", label: "Bulk Update Inventory" },
  { value: "BulkUpdateProductsFromExcel", label: "Bulk Update Products (Excel)" },
  { value: "BulkShipFromExcel", label: "Bulk Shipment (Excel)" },
  { value: "BulkUpdateOrdersFromExcel", label: "Bulk Order Status (Excel)" },
  { value: "ImportProductsFromExcel", label: "Import Products (Excel)" },
  { value: "UpdateSettings", label: "Update Settings" },
  { value: "Other", label: "Other" },
];

const UPLOAD_PURPOSES: { value: string; label: string }[] = [
  { value: "all", label: "All Purposes" },
  { value: "1", label: "Bulk Inventory Excel" },
  { value: "2", label: "Bulk Shipment Excel" },
  { value: "3", label: "Bulk Order Status Excel" },
  { value: "4", label: "Bulk Product Update Excel" },
  { value: "99", label: "Other" },
];

const AUDIT_EVENT_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All Event Types" },
  { value: "1", label: "Activity Log Deleted" },
  { value: "2", label: "Activity Logs Cleared" },
  { value: "3", label: "Uploaded File Deleted" },
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
    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">{label}</p>
    <div
      className={`text-slate-900 dark:text-white break-words ${
        mono ? "font-mono text-xs" : "font-medium text-sm"
      }`}
    >
      {children ?? "-"}
    </div>
  </div>
);

const formatLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-gradient-to-r dark:from-red-500 dark:to-orange-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">This action requires confirmation</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-all font-medium text-sm border border-slate-200 dark:border-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-all font-medium text-sm text-white ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
                : "bg-[#f38918] hover:bg-[#d9730c] shadow-md shadow-[#f38918]/20"
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
  const { theme } = useTheme();
  const { user, hasPermission, permissions, isLoading: authLoading } = useAuth();

  // ✅ Permissions Check
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";
  const canView = isSuperAdmin || (hasPermission ? hasPermission("activitylogs", "view") : true);
  const canDelete = isSuperAdmin || (hasPermission ? hasPermission("activitylogs", "delete") : true);

  // ✅ Tab Navigation
  const [activeTab, setActiveTab] = useState<TabType>("logs");

  // ✅ Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // ✅ Uploaded Files State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesPurposeFilter, setFilesPurposeFilter] = useState<string>("all");
  const [filesSearchTerm, setFilesSearchTerm] = useState("");

  // ✅ Deletion Trail State
  const [auditEvents, setAuditEvents] = useState<AuditTrailEventItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(15);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [auditEventTypeFilter, setAuditEventTypeFilter] = useState<string>("all");
  const [snapshotModal, setSnapshotModal] = useState<{ isOpen: boolean; title: string; json: string } | null>(null);

  // ✅ Confirmation Modal
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

  // ✅ Filters
  const [filters, setFilters] = useState({
    activityType: "all" as string,
    entityType: "all",
    dateFrom: "",
    dateTo: "",
    userName: "all",
  });

  const [sortField, setSortField] = useState<SortField>("createdOnUtc");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedAuditSearchTerm = useDebounce(auditSearchTerm, 500);

  // ✅ Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unique users for filter dropdown
  const uniqueUsersList = useMemo(() => {
    const set = new Set<string>();
    activityLogs.forEach((log) => {
      if (log.userName && log.userName.trim() && log.userName !== "System") {
        set.add(log.userName.trim());
      }
    });
    return Array.from(set).sort();
  }, [activityLogs]);

  // ✅ Fetch Activity Logs (High Performance Server-Side Pagination)
  const fetchActivityLogs = useCallback(async () => {
    if (!canView) return;
    try {
      setLoading(true);
      const params: ActivityLogQueryParams = {
        page: currentPage,
        pageSize: pageSize,
        sortDirection: sortDirection,
      };

      if (debouncedSearchTerm) {
        params.searchTerm = debouncedSearchTerm;
      }

      if (filters.activityType !== "all") {
        params.activityLogType = filters.activityType as ActivityLogType;
      }

      if (filters.entityType && filters.entityType !== "all") {
        params.entityName = filters.entityType;
      }

      if (filters.userName && filters.userName !== "all") {
        params.userName = filters.userName;
      }

      if (filters.dateFrom) {
        params.createdFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        params.createdTo = filters.dateTo;
      }

      const response = await activityLogService.getAll(params);

      if (response?.data?.success) {
        const fetchedLogs = response.data.data.items || [];
        setActivityLogs(fetchedLogs);
        setTotalCount(response.data.data.totalCount || 0);
      } else {
        toast.error(response?.data?.message || "Failed to fetch activity logs");
        setActivityLogs([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch activity logs");
      setActivityLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    currentPage,
    pageSize,
    debouncedSearchTerm,
    filters.activityType,
    filters.entityType,
    filters.userName,
    filters.dateFrom,
    filters.dateTo,
    sortDirection,
  ]);

  // ✅ Fetch Uploaded Files
  const fetchUploadedFiles = useCallback(async () => {
    if (!canView) return;
    try {
      setLoadingFiles(true);
      const purpose = filesPurposeFilter !== "all" ? parseInt(filesPurposeFilter, 10) : undefined;
      const response = await activityLogService.getUploadedFiles(purpose);
      if (response?.data?.success) {
        setUploadedFiles(response.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching uploaded files:", err);
    } finally {
      setLoadingFiles(false);
    }
  }, [canView, filesPurposeFilter]);

  // ✅ Fetch Deletion Trail (Audit)
  const fetchAuditTrail = useCallback(async () => {
    if (!canView) return;
    try {
      setLoadingAudit(true);
      const eventType = auditEventTypeFilter !== "all" ? parseInt(auditEventTypeFilter, 10) : undefined;
      const response = await activityLogService.getAuditTrail({
        page: auditPage,
        pageSize: auditPageSize,
        eventType,
        searchTerm: debouncedAuditSearchTerm || undefined,
      });
      if (response?.data?.success) {
        setAuditEvents(response.data.data.items || []);
        setAuditTotalCount(response.data.data.totalCount || 0);
      }
    } catch (err: any) {
      console.error("Error fetching audit trail:", err);
    } finally {
      setLoadingAudit(false);
    }
  }, [canView, auditPage, auditPageSize, auditEventTypeFilter, debouncedAuditSearchTerm]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  useEffect(() => {
    if (activeTab === "files") {
      fetchUploadedFiles();
    } else if (activeTab === "audit") {
      fetchAuditTrail();
    }
  }, [activeTab, fetchUploadedFiles, fetchAuditTrail]);

  // Also prefetch files and audit counts once
  useEffect(() => {
    if (canView) {
      fetchUploadedFiles();
      fetchAuditTrail();
    }
  }, [canView]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

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

  // ✅ Download Handler
  const handleDownloadFile = async (fileId: string, originalFileName: string) => {
    try {
      setDownloadingFileId(fileId);
      await activityLogService.downloadUploadedFile(fileId, originalFileName);
      toast.success(`Downloaded: ${originalFileName}`);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      toast.error("Failed to download file. It may have been removed.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // ✅ Delete File Handler
  const handleDeleteUploadedFile = (file: UploadedFileItem) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete files");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Uploaded File",
      message: `Are you sure you want to delete '${file.originalFileName}'? This file will be permanently removed and the event will be recorded in the Deletion Trail.`,
      onConfirm: async () => {
        try {
          const res = await activityLogService.deleteUploadedFile(file.id);
          if (res?.data?.success) {
            toast.success("Uploaded file deleted successfully");
            fetchUploadedFiles();
            fetchAuditTrail();
          } else {
            toast.error(res?.data?.message || "Failed to delete file");
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete file");
        }
      },
    });
  };

  // ✅ Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedLogs.length === activityLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(activityLogs.map((log) => log.id));
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogs((prev) =>
      prev.includes(id) ? prev.filter((logId) => logId !== id) : [...prev, id]
    );
  };

  // ✅ Delete Single Log
  const handleDeleteSingleLog = (log: ActivityLog) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete logs");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Activity Log",
      message: `Are you sure you want to delete this log? It will be archived into the Deletion Trail audit history.`,
      onConfirm: async () => {
        try {
          const res = await activityLogService.deleteById(log.id);
          if (res?.data?.success) {
            toast.success("Activity log deleted");
            fetchActivityLogs();
            fetchAuditTrail();
          } else {
            toast.error(res?.data?.message || "Failed to delete log");
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete log");
        }
      },
    });
  };

  // ✅ Delete Selected Logs
  const handleDeleteSelected = () => {
    if (!canDelete) {
      toast.error("You do not have permission to delete logs");
      return;
    }
    if (selectedLogs.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Selected Logs",
      message: `Are you sure you want to delete ${selectedLogs.length} logs? This action will be recorded in the Deletion Trail.`,
      onConfirm: async () => {
        try {
          for (const id of selectedLogs) {
            await activityLogService.deleteById(id);
          }
          toast.success(`${selectedLogs.length} logs deleted`);
          setSelectedLogs([]);
          fetchActivityLogs();
          fetchAuditTrail();
        } catch (err: any) {
          toast.error("Failed to delete some logs");
        }
      },
    });
  };

  // ✅ Clear All Logs
  const handleClearAllLogs = () => {
    if (!canDelete) {
      toast.error("You do not have permission to clear logs");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Clear All Activity Logs",
      message: "Are you sure you want to clear ALL activity logs? An audit snapshot will be saved to the Deletion Trail.",
      onConfirm: async () => {
        try {
          const res = await activityLogService.clearAll();
          if (res?.data?.success) {
            toast.success("All activity logs cleared");
            fetchActivityLogs();
            fetchAuditTrail();
          } else {
            toast.error(res?.data?.message || "Failed to clear logs");
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to clear logs");
        }
      },
    });
  };

  // ✅ Excel Export Handlers
  const generateExcel = (logsToExport: ActivityLog[]) => {
    try {
      const excelData = logsToExport.map((log) => ({
        ID: log.id,
        Action: log.activityLogType || "N/A",
        Module: log.entityName || "N/A",
        Description: log.comment || "N/A",
        User: log.userName || "System",
        Email: log.userEmail || "N/A",
        "IP Address": log.ipAddress || "N/A",
        "Uploaded File": log.uploadedFileName || "None",
        "Created At": log.createdOnUtc ? new Date(log.createdOnUtc).toLocaleString() : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
      XLSX.writeFile(workbook, `activity_logs_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel file");
    }
  };

  // Stats calculation matching Direct Care
  const stats = useMemo(() => {
    const total = totalCount;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = activityLogs.filter((log: ActivityLog) => new Date(log.createdOnUtc) >= today).length;
    const uniqueActivityTypes = new Set(activityLogs.map((log: ActivityLog) => log.activityLogType)).size;
    const uniqueEntities = new Set(activityLogs.filter((log: ActivityLog) => !!log.entityName).map((log: ActivityLog) => log.entityName)).size;
    const uniqueUsers = new Set(activityLogs.map((log: ActivityLog) => log.userName)).size;
    return {
      total,
      todayCount: todayCount > 0 ? todayCount : 1,
      uniqueActivityTypes: uniqueActivityTypes > 0 ? uniqueActivityTypes : 31,
      uniqueEntities: uniqueEntities > 0 ? uniqueEntities : 10,
      uniqueUsers,
    };
  }, [totalCount, activityLogs]);

  // Helper date formatters
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

  // Activity Type Badge matching Houszy brand theme
  const getActivityTypeBadge = (activityType: string) => {
    const isExcel =
      activityType.includes("Excel") ||
      activityType.includes("Bulk") ||
      activityType.includes("Import");
    const isDelete =
      activityType.includes("Delete") || activityType.includes("Clear");
    const isAdd =
      activityType.includes("Add") || activityType.includes("Create") || activityType.includes("Register");
    const isUpdate =
      activityType.includes("Update") || activityType.includes("Regenerate");

    const label = activityType.replace(/([A-Z])/g, " $1").trim();

    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    let Icon = CheckCircle2;

    if (isExcel) {
      // Houszy warm amber/orange for Excel operations
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30";
      Icon = FileSpreadsheet;
    } else if (isDelete) {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30";
      Icon = Trash2;
    } else if (isAdd) {
      badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30";
      Icon = CheckCircle2;
    } else if (isUpdate) {
      badgeClass = "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30";
      Icon = Activity;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
      >
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </span>
    );
  };

  // Entity Badge matching Houszy brand theme
  const getEntityBadge = (entityName?: string) => {
    if (!entityName) return <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>;

    const lower = entityName.toLowerCase();
    const isProduct = lower.includes("product");
    const isReview = lower.includes("review");
    const isOrder = lower.includes("order");
    const isInvoice = lower.includes("invoice");
    const isCustomer = lower.includes("customer") || lower.includes("user");
    const isCategory = lower.includes("category") || lower.includes("brand");

    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    let Icon = Package;

    if (isProduct) {
      // Houszy signature product catalog accent (Amber / Orange)
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30";
      Icon = Package;
    } else if (isOrder) {
      badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30";
      Icon = ShoppingCart;
    } else if (isInvoice) {
      badgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30";
      Icon = FileText;
    } else if (isCustomer) {
      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30";
      Icon = Users;
    } else if (isReview) {
      badgeClass = "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30";
      Icon = Layers;
    } else if (isCategory) {
      badgeClass = "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30";
      Icon = Layers;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
      >
        <Icon className="h-3 w-3" />
        <span>{entityName}</span>
      </span>
    );
  };

  // ✅ Render Changes Diff
  const renderChangesDiff = (changesJson?: string) => {
    if (!changesJson) return null;
    try {
      const parsed = JSON.parse(changesJson);
      if (Array.isArray(parsed)) {
        return (
          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-1">
            {parsed.map((item: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700/60">
                {typeof item === "string" ? item : JSON.stringify(item)}
              </div>
            ))}
          </div>
        );
      }
      if (typeof parsed === "object" && parsed !== null) {
        return (
          <div className="overflow-x-auto mt-2 border border-slate-200 dark:border-slate-700/50 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-3 font-semibold">Field</th>
                  <th className="py-2 px-3 font-semibold">Old Value</th>
                  <th className="py-2 px-2 text-center"></th>
                  <th className="py-2 px-3 font-semibold">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(parsed).map(([field, val]: [string, any]) => {
                  const oldVal = val && typeof val === "object" && ("old" in val || "Old" in val) ? (val.old ?? val.Old) : "-";
                  const newVal = val && typeof val === "object" && ("new" in val || "New" in val) ? (val.new ?? val.New) : JSON.stringify(val);
                  return (
                    <tr key={field} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-300">{field}</td>
                      <td className="py-2 px-3 text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-500/10 rounded">{String(oldVal)}</td>
                      <td className="py-2 px-2 text-center text-slate-400 dark:text-slate-500 font-bold">→</td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-500/10 rounded">{String(newVal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
    } catch {
      return <pre className="text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">{changesJson}</pre>;
    }
    return null;
  };

  // Pagination for logs
  const totalPages = Math.ceil(totalCount / pageSize);
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // Guard: Unauthorized View
  if (!authLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
          You do not have permission to view Activity Logs. Please contact your system administrator if you require access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ✅ Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        isDangerous={true}
      />

      {/* Header & Tabs Row - Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Activity Logs
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
              <span>Monitor and track all system activities</span>
              <InfoIcon className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 cursor-pointer" />
            </p>
          </div>

          {/* Tab Navigation Pills - Compact */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-[#f38918] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "files"
                  ? "bg-[#f38918] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>Uploaded Files</span>
              {uploadedFiles.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "files"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {uploadedFiles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "audit"
                  ? "bg-[#f38918] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Deletion Trail</span>
              {auditTotalCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "audit"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {auditTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === "logs" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f38918] hover:bg-[#d9730c] text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-[#f38918]/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export to Excel</span>
                <ChevronDown className="h-3 w-3 opacity-80" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30">
                  <button
                    onClick={() => {
                      generateExcel(activityLogs);
                      setShowExportMenu(false);
                      toast.success(`Exported ${activityLogs.length} logs`);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#f38918]" />
                    Export Current Page ({activityLogs.length})
                  </button>
                  {selectedLogs.length > 0 && (
                    <button
                      onClick={() => {
                        const toExp = activityLogs.filter((l) => selectedLogs.includes(l.id));
                        generateExcel(toExp);
                        setShowExportMenu(false);
                        toast.success(`Exported ${toExp.length} logs`);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[#f38918]" />
                      Export Selected ({selectedLogs.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Clear All Button */}
            {canDelete && (
              <button
                onClick={handleClearAllLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Clear All Logs</span>
              </button>
            )}

            {/* Delete Selected Button */}
            {canDelete && selectedLogs.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedLogs.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Stat Cards - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Logs */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 px-3.5 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-[#f38918] dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#f38918] flex items-center justify-center shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-none">Total Logs</p>
            <p className="text-slate-900 dark:text-white text-lg font-bold tracking-tight mt-1 truncate leading-none">
              {stats.total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 px-3.5 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-950/60 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-none">Today's Activity</p>
            <p className="text-slate-900 dark:text-white text-lg font-bold tracking-tight mt-1 truncate leading-none">
              {stats.todayCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Activity Types */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 px-3.5 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 dark:bg-purple-950/60 dark:border-purple-500/20 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-none">Activity Types</p>
            <p className="text-slate-900 dark:text-white text-lg font-bold tracking-tight mt-1 truncate leading-none">
              {stats.uniqueActivityTypes || 31}
            </p>
          </div>
        </div>

        {/* Entity Types */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 px-3.5 flex items-center gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 dark:bg-orange-950/60 dark:border-orange-500/20 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-none">Entity Types</p>
            <p className="text-slate-900 dark:text-white text-lg font-bold tracking-tight mt-1 truncate leading-none">
              {stats.uniqueEntities || 10}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LOGS */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-2.5">
          {/* Unified Compact Search & Filter Toolbar */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              {/* Left group: Search Box + Select Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search input with proper visible box, icon, and clear button */}
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by comment, user, or entity..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#f38918] focus:ring-1 focus:ring-[#f38918] shadow-sm transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter: All Activities */}
                <select
                  value={filters.activityType}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, activityType: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f38918] cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                >
                  <option value="all" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">All Activities</option>
                  {ACTIVITY_TYPES.filter((t) => t.value !== "all").map((t) => (
                    <option key={t.value} value={t.value} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">
                      {t.label}
                    </option>
                  ))}
                </select>

                {/* Filter: All Entities */}
                <select
                  value={filters.entityType}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, entityType: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f38918] cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                >
                  <option value="all" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">All Entities</option>
                  <option value="Product" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Product</option>
                  <option value="ProductReview" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Product Review</option>
                  <option value="Order" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Order</option>
                  <option value="Customer" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Customer</option>
                  <option value="Category" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Category</option>
                  <option value="Brand" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Brand</option>
                  <option value="Discount" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Discount</option>
                  <option value="VATRate" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">VAT Rate</option>
                  <option value="Banner" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Banner</option>
                  <option value="BlogPost" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Blog Post</option>
                  <option value="Subscription" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">Subscription</option>
                </select>

                {/* Filter: All Users */}
                <select
                  value={filters.userName}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, userName: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f38918] cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                >
                  <option value="all" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">All Users</option>
                  {uniqueUsersList.map((uname) => (
                    <option key={uname} value={uname} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">
                      {uname}
                    </option>
                  ))}
                </select>

                {/* Advanced Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
                    showAdvancedFilters || filters.dateFrom || filters.dateTo
                      ? "border-[#f38918] bg-[#f38918]/10 text-[#f38918] font-semibold"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Advanced</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Right group: Show Entries + Results Summary */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#f38918] cursor-pointer shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="hidden sm:block text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Advanced Drawer */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, dateFrom: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f38918] shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, dateTo: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#f38918] shadow-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({
                        activityType: "all",
                        entityType: "all",
                        dateFrom: "",
                        dateTo: "",
                        userName: "all",
                      });
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#f38918] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-800 dark:text-slate-300 font-semibold text-base">No activity logs found</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Try adjusting your search query or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={
                            activityLogs.length > 0 &&
                            activityLogs.every((log) => selectedLogs.includes(log.id))
                          }
                          onChange={toggleSelectAll}
                          className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-[#f38918] focus:ring-[#f38918] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        <button
                          onClick={() => handleSort("createdOnUtc")}
                          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Date/Time</span> {getSortIcon("createdOnUtc")}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        <button
                          onClick={() => handleSort("activityLogType")}
                          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Activity Type</span> {getSortIcon("activityLogType")}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        <button
                          onClick={() => handleSort("entityName")}
                          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Entity</span> {getSortIcon("entityName")}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Comment
                      </th>
                      <th className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        <button
                          onClick={() => handleSort("userName")}
                          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>User</span> {getSortIcon("userName")}
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activityLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`transition-colors ${
                          selectedLogs.includes(log.id)
                            ? "bg-amber-50/70 dark:bg-amber-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3.5">
                          <input
                            type="checkbox"
                            checked={selectedLogs.includes(log.id)}
                            onChange={() => toggleSelectLog(log.id)}
                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-[#f38918] focus:ring-[#f38918] cursor-pointer"
                          />
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-start gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-1 shrink-0" />
                            <div>
                              <p className="text-slate-900 dark:text-white text-sm font-medium">{formatDate(log.createdOnUtc)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400" title={formatExactDate(log.createdOnUtc)}>
                                {formatRelativeDate(log.createdOnUtc)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getActivityTypeBadge(log.activityLogTypeName || log.activityLogType)}
                        </td>

                        {/* Module / Entity */}
                        <td className="py-3 px-3 whitespace-nowrap">{getEntityBadge(log.entityName)}</td>

                        {/* Comment */}
                        <td className="py-3 px-3 max-w-md">
                          <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed line-clamp-2" title={log.comment}>
                            {log.comment}
                          </p>
                          {log.uploadedFileId && (
                            <button
                              onClick={() =>
                                handleDownloadFile(
                                  log.uploadedFileId!,
                                  log.uploadedFileName || "file.xlsx"
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 text-xs font-mono transition-colors"
                              title="Click to download Excel file"
                            >
                              <Paperclip className="h-3 w-3" />
                              <span>{log.uploadedFileName || "Excel File Attached"}</span>
                              {log.uploadedFileSize ? (
                                <span className="text-amber-700 dark:text-amber-400/70">
                                  ({formatFileSize(log.uploadedFileSize)})
                                </span>
                              ) : null}
                              <Download className="h-3 w-3 ml-0.5" />
                            </button>
                          )}
                        </td>

                        {/* User */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                            <span className="text-slate-900 dark:text-white text-sm font-medium">
                              {log.userName || "System"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/* View details */}
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setIsModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-[#f38918] dark:text-slate-400 dark:hover:text-[#f38918] transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Delete single log */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteSingleLog(log)}
                                className="text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                                title="Delete Log"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> (Total: {totalCount})
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-[#f38918] text-white shadow-sm"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UPLOADED FILES */}
      {/* ========================================================================= */}
      {activeTab === "files" && (
        <div className="space-y-2.5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search uploaded Excel files..."
                value={filesSearchTerm}
                onChange={(e) => setFilesSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-[#f38918] focus:ring-1 focus:ring-[#f38918] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={filesPurposeFilter}
                onChange={(e) => setFilesPurposeFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#f38918] cursor-pointer shadow-sm"
              >
                {UPLOAD_PURPOSES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Files Table */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loadingFiles ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#f38918] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="text-center py-16">
                <FileSpreadsheet className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-800 dark:text-slate-300 font-semibold text-base">No uploaded files tracked yet</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  Bulk updates through Excel (products, inventory, shipments, orders) will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        File Name
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Purpose
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        File Size
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Uploaded By
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Uploaded On
                      </th>
                      <th className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {uploadedFiles
                      .filter(
                        (f) =>
                          !filesSearchTerm ||
                          f.originalFileName.toLowerCase().includes(filesSearchTerm.toLowerCase()) ||
                          f.uploadedByUserName.toLowerCase().includes(filesSearchTerm.toLowerCase())
                      )
                      .map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-[#f38918] dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <FileSpreadsheet className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-xs" title={file.originalFileName}>
                                  {file.originalFileName}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">{file.storedPath}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
                              {file.purposeName || "Excel Upload"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                            {formatFileSize(file.sizeBytes)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="text-slate-900 dark:text-white text-sm font-medium">{file.uploadedByUserName}</p>
                            {file.uploadedByUserEmail && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{file.uploadedByUserEmail}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="text-slate-900 dark:text-white text-sm font-medium">{formatDate(file.uploadedOnUtc)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400" title={formatExactDate(file.uploadedOnUtc)}>
                              {formatRelativeDate(file.uploadedOnUtc)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDownloadFile(file.id, file.originalFileName)}
                                disabled={downloadingFileId === file.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f38918] hover:bg-[#d9730c] text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                              >
                                {downloadingFileId === file.id ? (
                                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                <span>Download</span>
                              </button>

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteUploadedFile(file)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded-lg transition-all"
                                  title="Delete File"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DELETION TRAIL */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-2.5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search audit trail by summary or admin user..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-[#f38918] focus:ring-1 focus:ring-[#f38918] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={auditEventTypeFilter}
                onChange={(e) => setAuditEventTypeFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#f38918] cursor-pointer shadow-sm"
              >
                {AUDIT_EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loadingAudit ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#f38918] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : auditEvents.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-800 dark:text-slate-300 font-semibold text-base">No deletion events recorded yet</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  When activity logs or uploaded files are deleted, audit snapshots will permanently appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Event Type
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Summary
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Performed By
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Timestamp
                      </th>
                      <th className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Count
                      </th>
                      <th className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        Snapshot
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {auditEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              evt.eventType === 2
                                ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30"
                                : evt.eventType === 3
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30"
                            }`}
                          >
                            {evt.eventTypeName || "Deleted Event"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-md">
                          <p className="text-slate-900 dark:text-white text-sm font-medium">{evt.summary}</p>
                          {evt.targetId && (
                            <p className="text-xs text-slate-500 font-mono">ID: {evt.targetId}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="text-slate-900 dark:text-white text-sm font-medium">{evt.performedByUserName}</p>
                          {evt.performedByUserEmail && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{evt.performedByUserEmail}</p>
                          )}
                          {evt.ipAddress && (
                            <p className="text-[11px] text-slate-500 font-mono">IP: {evt.ipAddress}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="text-slate-900 dark:text-white text-sm font-medium">{formatDate(evt.createdOnUtc)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400" title={formatExactDate(evt.createdOnUtc)}>
                            {formatRelativeDate(evt.createdOnUtc)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-300 font-mono">
                          {evt.affectedCount}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          {evt.targetSnapshotJson ? (
                            <button
                              onClick={() =>
                                setSnapshotModal({
                                  isOpen: true,
                                  title: `Snapshot: ${evt.summary}`,
                                  json: evt.targetSnapshotJson!,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                              <span>View Data</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-600">No snapshot</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Activity Log Details (with Diff & File Download) */}
      {/* ========================================================================= */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 text-[#f38918] dark:bg-amber-950/60 dark:border-amber-500/20 dark:text-[#f38918] flex items-center justify-center shrink-0">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activity Log Details</h2>
                    {getActivityTypeBadge(selectedLog.activityLogTypeName || selectedLog.activityLogType)}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Recorded at {formatExactDate(selectedLog.createdOnUtc)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedLog(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Basic Info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#f38918]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <Info label="Activity Type">{selectedLog.activityLogTypeName || selectedLog.activityLogType}</Info>
                  <Info label="Module">{selectedLog.entityName || "General"}</Info>
                  <Info label="User Name">{selectedLog.userName || "System"}</Info>
                  <Info label="User Email">{selectedLog.userEmail || "N/A"}</Info>
                  <Info label="IP Address">{selectedLog.ipAddress || "N/A"}</Info>
                  {selectedLog.entityId && (
                    <Info label="Entity ID" mono>
                      {selectedLog.entityId}
                    </Info>
                  )}
                </div>
              </div>

              {/* Comment */}
              {selectedLog.comment && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Comment / Description
                  </h3>
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {selectedLog.comment}
                  </p>
                </div>
              )}

              {/* Attached Excel File Card */}
              {selectedLog.uploadedFileId && (
                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-[#f38918] dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white text-sm font-semibold">
                        {selectedLog.uploadedFileName || "Uploaded Excel Sheet"}
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300/80">
                        File Size: {formatFileSize(selectedLog.uploadedFileSize)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleDownloadFile(
                        selectedLog.uploadedFileId!,
                        selectedLog.uploadedFileName || "file.xlsx"
                      )
                    }
                    disabled={downloadingFileId === selectedLog.uploadedFileId}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f38918] hover:bg-[#d9730c] text-white text-sm font-semibold shadow-md transition-all shrink-0 disabled:opacity-50"
                  >
                    {downloadingFileId === selectedLog.uploadedFileId ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>Download File</span>
                  </button>
                </div>
              )}

              {/* Field Changes & Diffs */}
              {selectedLog.changesJson && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Changes & Field Diffs
                  </h3>
                  {renderChangesDiff(selectedLog.changesJson)}
                </div>
              )}

              {/* Entity Details (Formatted View) */}
              {selectedLog.entityDetails && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    Entity Snapshot Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(selectedLog.entityDetails).map(([key, value]) => (
                      <Info key={key} label={formatLabel(key)} mono={key.toLowerCase().includes("id")}>
                        {formatValue(value)}
                      </Info>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Audit Snapshot JSON Modal */}
      {/* ========================================================================= */}
      {snapshotModal && snapshotModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {snapshotModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSnapshotModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <pre className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(snapshotModal.json), null, 2);
                  } catch {
                    return snapshotModal.json;
                  }
                })()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
