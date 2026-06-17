"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  CheckCircle,
  X,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Trash2,
  AlertCircle,
  Filter,
  Reply,
  ShoppingBag,
  TrendingUp,
  Award,
  MessageSquare,
  Plus,
  Package,
  ChevronDown,
  Download,
  RefreshCw,
  ImageIcon,
  Video,
  CloudCog,
} from "lucide-react";
import ExcelImportModal from "./ExcelImportModal";
import { Upload } from "lucide-react";

import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { API_BASE_URL } from "@/lib/api-config";
import {
  productReviewsService,
  ProductReview,
  ProductWithReviewSummary,
  CreateReviewDto,
  ReviewFilters,
} from "@/lib/services/productReviews";
import { formatDate, getImageUrl } from "../_utils/formatUtils";
export default function ProductReviewsPage() {
  const router = useRouter();
  const toast = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<ProductWithReviewSummary[]>([]);
  const [formProducts, setFormProducts] = useState<{ id: string; name: string; sku?: string; price?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [viewingReview, setViewingReview] = useState<ProductReview | null>(
    null
  );
  // ✅ Add these state variables with other states
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: ""
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [replyingTo, setReplyingTo] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState("");
  // Add these states at the top with other useState
  const [productSearch, setProductSearch] = useState('');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    customer: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approveConfirm, setApproveConfirm] = useState<{
    id: string;
    customer: string;
    title: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalReviews: 0,
    totalPending: 0,
    totalApproved: 0,
    totalVerified: 0,
    totalUnverified: 0,
  });
  const [isApproving, setIsApproving] = useState(false);

  // ✅ Add this useEffect for closing date picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search input — reset page when debounced value changes
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ✅ Fetch Products that have reviews (for filter dropdown)
  const fetchProducts = async (searchTerm?: string) => {
    setLoadingProducts(true);
    try {
      const response = await productReviewsService.getProductsWithReviews({
        pageSize: 100,
        searchTerm,
      });
      if (response.data?.success && Array.isArray(response.data?.data?.items)) {
        setProducts(response.data.data.items);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch all products for the create-review form (needs price/sku, all products not just reviewed ones)
  const fetchFormProducts = async () => {
    try {
      const response = await productReviewsService.getAllProducts(1, 5000);
      if (response.data?.success && Array.isArray(response.data?.data?.items)) {
        setFormProducts(response.data.data.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
        })));
      }
    } catch {
      // silently ignore — create form is non-critical
    }
  };

  // Add this before return statement (with other computed values)
  // ✅ Add this helper function
  const getDateRangeLabel = () => {
    if (!dateRange.startDate && !dateRange.endDate) return "Select Date Range";



    if (dateRange.startDate && dateRange.endDate) {
      return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
    } else if (dateRange.startDate) {
      return `From ${formatDate(dateRange.startDate)}`;
    } else if (dateRange.endDate) {
      return `Until ${formatDate(dateRange.endDate)}`;
    }
    return "Select Date Range";
  };


  // ✅ Fetch Reviews — all filtering done server-side
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const filters: ReviewFilters = {
        page: currentPage,
        pageSize: itemsPerPage,
      };
      if (statusFilter !== "all") filters.status = statusFilter as "pending" | "approved";
      if (ratingFilter !== "all") filters.rating = parseInt(ratingFilter);
      if (debouncedSearch.trim()) filters.searchTerm = debouncedSearch.trim();
      if (productFilter !== "all") filters.productId = productFilter;
      if (verifiedOnlyFilter) {
        filters.verifiedOnly = true;
      }

      const res = await productReviewsService.getAll(filters);
      console.log("ressssssssssssss", res);

      if (res.data?.success) {
        const paged = res.data.data;

        setReviews(paged.items ?? []);
        setServerTotal(paged.totalCount ?? 0);
        setServerTotalPages(paged.totalPages ?? 1);

        // ✅ ADD THIS
        if (paged.stats) {
          setStats(paged.stats);
        }
      } else {
        setReviews([]);
        setServerTotal(0);
        setServerTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [currentPage, verifiedOnlyFilter, itemsPerPage, statusFilter, ratingFilter, debouncedSearch, productFilter]);

  // ✅ Initial load — fetch products (for dropdown) and reviews simultaneously
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchFormProducts()]);
      setLoading(false);
    };
    init();
  }, []);

  // ✅ Fetch reviews whenever any server-side filter / page changes
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);





  // ✅ Approve Review
  const handleApprove = async (id: string) => {
    setIsApproving(true);
    try {
      const response = await productReviewsService.approve(id);
      if (response.data?.success) {
        toast.success("✅ Review approved successfully!");
        await fetchReviews();
        setApproveConfirm(null);
      }
    } catch (error: any) {
      console.error("Error approving review:", error);
      toast.error(
        error?.response?.data?.message || "Failed to approve review"
      );
    } finally {
      setIsApproving(false);
    }
  };
  // ✅ Reply to Review
  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setActionLoading(replyingTo.id);
    try {
      const response = await productReviewsService.reply(replyingTo.id, {
        reviewId: replyingTo.id,
        comment: replyText,
        isAdminReply: true,
      });

      if (response.data?.success) {
        toast.success("✅ Reply posted successfully!");
        setReplyingTo(null);
        setReplyText("");
        await fetchReviews();
      }
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast.error(error?.response?.data?.message || "Failed to post reply");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Delete Review
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await productReviewsService.delete(id);
      if (response.data?.success) {
        toast.success("🗑️ Review deleted successfully!");
        await fetchReviews();
      }
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(error?.response?.data?.message || "Failed to delete review");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const toggleSelectReview = (id: string) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === currentData.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(currentData.map((r) => r.id));
    }
  };

  // ✅ Update your existing clearFilters function
  const clearFilters = () => {
    setStatusFilter("all");
    setRatingFilter("all");
    setProductFilter("all");
    setVerifiedOnlyFilter(false);
    setSearchTerm("");
    setDebouncedSearch("");
    setProductSearchTerm("");
    setShowProductDropdown(false);
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    ratingFilter !== "all" ||
    productFilter !== "all" ||
    verifiedOnlyFilter ||
    searchTerm.trim() !== "" ||
    dateRange.startDate !== "" ||
    dateRange.endDate !== "";

  // Server handles all filtering — reviews is already the current page
  const filteredReviews = reviews;
  const currentData = reviews;

  // Pagination — driven by server response
  const totalItems = serverTotal;
  const totalPages = serverTotalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // triggers fetchReviews via useCallback dep change
  };
  // ✅ Create Review Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateReviewDto>({
    productId: "",
    title: "",
    comment: "",
    rating: 5
  });
  const [hoverRating, setHoverRating] = useState(0);
  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter dropdown products (ProductWithReviewSummary — uses productId/productName)
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.productSku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Filter form products (old Product shape — uses id/name)
  const filteredFormProducts = formProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ✅ Get selected product title
  const getSelectedProductTitle = () => {
    if (productFilter === "all") return "🛍️ All Products";
    const product = products.find(p => p.productId === productFilter);
    return product?.productName || "Unknown Product";
  };
  // Products are loaded once on mount via the init useEffect above

  // ✅ Handle Create Review
  const handleCreateReview = async () => {
    // Validation
    if (!formData.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a review title");
      return;
    }
    if (!formData.comment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }

    setCreating(true);
    try {
      console.log("📝 Creating review:", formData);
      const response = await productReviewsService.create(formData);

      if (response.data?.success) {
        toast.success("✅ Review created successfully!");

        // Reset form
        setFormData({
          productId: "",
          title: "",
          comment: "",
          rating: 5
        });

        // Close modal
        setShowCreateModal(false);

        // Refresh reviews list (add your fetch function here)
        // await fetchReviews();
      } else {
        toast.error(response.data?.message || "Failed to create review");
      }
    } catch (error: any) {
      console.error("❌ Error creating review:", error);
      toast.error(error?.response?.data?.message || "Failed to create review");
    } finally {
      setCreating(false);
    }
  };

  // ✅ Star Rating Component
  const StarRating = ({ value, onChange, size = "h-6 w-6" }: {
    value: number;
    onChange: (rating: number) => void;
    size?: string;
  }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${size} transition-colors ${star <= (hoverRating || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-600"
                }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-400">
          {value} / 5
        </span>
      </div>
    );
  };

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

  // Page resets are handled by wrapper setters and debounce effect above


  // ✅ COMPLETE: Download Reviews Function - All Messages in English
  const handleExportReviews = (type: string) => {
    let data: any[] = [];

    if (type === "all") {
      // ✅ All reviews from API (no filters)
      data = reviews;

    } else if (type === "filtered") {
      // ✅ Reviews after search/filter
      data = filteredReviews;
    }

    if (data.length === 0) {
      toast.error("No reviews available to download");
      setDownloadMenuOpen(false);
      return;
    }

    console.log(`📥 Exporting ${data.length} reviews...`);

    exportReviewsToExcel(data, type === "all" ? "all" : "filtered");
  };

  const exportReviewsToExcel = (data: ProductReview[], type: "all" | "filtered" | "selected") => {
    const rows = data.map((r) => ({
      "Product ID": r.productId,
      "Customer Name": r.customerName,
      "Title": r.title,
      "Comment": r.comment,
      "Rating": r.rating,
      "Approved": r.isApproved ? "Yes" : "No",
      "Verified Purchase": r.isVerifiedPurchase ? "Yes" : "No",
      "Image URLs": (r.imageUrls ?? []).join(", "),
      "Video URLs": (r.videoUrls ?? []).join(", "),
      "Created At": new Date(r.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
    }));

    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(rows);

      ws["!cols"] = [
        { wch: 15 }, // Product ID
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Title
        { wch: 50 }, // Comment
        { wch: 10 }, // Rating
        { wch: 12 }, // Approved
        { wch: 18 }, // Verified Purchase
        { wch: 40 }, // Image URLs
        { wch: 40 }, // Video URLs
        { wch: 25 }  // Created At
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reviews");

      const dateStr = new Date().toISOString().split('T')[0];
      const filename =
        type === "all"
          ? `Product_Reviews_All_${data.length}_${dateStr}.xlsx`
          : type === "selected"
            ? `Product_Reviews_Selected_${data.length}_${dateStr}.xlsx`
            : `Product_Reviews_Filtered_${data.length}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`✅ Successfully downloaded ${data.length} reviews!`);
      setDownloadMenuOpen(false);

    }).catch((err) => {
      console.error("❌ Excel export error:", err);
      toast.error("Failed to create Excel file. Please try again.");
    });
  };

  const handleExportSelectedReviews = () => {
    const selectedData = currentData.filter((review) => selectedReviews.includes(review.id));

    if (selectedData.length === 0) {
      toast.error("No selected reviews available to download");
      return;
    }

    exportReviewsToExcel(selectedData, "selected");
    setSelectedReviews([])
  };

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";

    // Already full URL
    if (/^https?:\/\//i.test(url)) return url;

    const cleanBase = API_BASE_URL.replace(/\/+$/, "");
    const cleanPath = url.replace(/^\/+/, "");

    return `${cleanBase}/${cleanPath}`;
  };

  const normalizeToArray = (data: any): string[] => {
    if (!data) return [];

    if (Array.isArray(data)) return data;

    if (typeof data === "string") {
      return data.split(",").map((i) => i.trim()).filter(Boolean);
    }

    return [];
  };

  const isPlayableVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  };



  const getSelectedProductName = () => {
    if (productFilter === "all") return "All Products";
    const product = products.find((p) => p.productId === productFilter);
    return product?.productName || "Unknown Product";
  };

  // Render Stars
  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-600"
              }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div >
      {selectedReviews.length > 0 && (
        <div className="fixed top-[69px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
          <div className="flex justify-center px-2 pt-2">
            <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{selectedReviews.length} review(s) selected</p>
                  <p className="text-xs text-slate-400">Export selected reviews or clear the current selection</p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700/80" />

              <button
                onClick={handleExportSelectedReviews}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                title={`Export ${selectedReviews.length} selected reviews`}
              >
                <Download className="h-3.5 w-3.5" />
                Export Selected ({selectedReviews.length})
              </button>

              <button
                onClick={() => setSelectedReviews([])}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                title="Clear selected reviews"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent leading-none">
              Product Reviews
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {serverTotal} reviews{productFilter !== "all" && <span className="text-violet-400"> · {getSelectedProductName()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { fetchProducts(); fetchReviews(); }}
              disabled={loadingReviews}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700/50 disabled:opacity-50"
              title="Refresh"
            >
              {loadingReviews ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setShowExcelImport(true)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 font-medium text-xs transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              Import Reviews
            </button>
            <div className="relative">
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 font-medium text-xs transition-all"
                onClick={() => handleExportReviews('all')}
              >
                <Download className="h-3.5 w-3.5" />
                Export Reviews

              </button>

            </div>
          </div>
        </div>



        {/* Stats strip */}
        {/* ✅ Stats strip (Backend Driven) */}
        <div className="grid grid-cols-5 gap-2">

          {/* Total Reviews */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Total</p>
              <p className="text-lg font-bold text-white">{stats.totalReviews}</p>
            </div>
          </div>

          {/* Pending */}
          <button
            onClick={() => {
              setStatusFilter("pending");
              setCurrentPage(1);
            }}
            className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${statusFilter === "pending"
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-slate-900/60 border-slate-800"
              }`}
          >
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Pending</p>
              <p className="text-lg font-bold text-white">{stats.totalPending}</p>
            </div>
          </button>

          {/* Approved */}
          <button
            onClick={() => {
              setStatusFilter("approved");
              setCurrentPage(1);
            }}
            className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${statusFilter === "approved"
                ? "bg-green-500/10 border-green-500/30"
                : "bg-slate-900/60 border-slate-800"
              }`}
          >
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Approved</p>
              <p className="text-lg font-bold text-white">{stats.totalApproved}</p>
            </div>
          </button>

          {/* Verified */}
          <button
            onClick={() => {
              setVerifiedOnlyFilter(true);
              setCurrentPage(1);
            }}
            className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${verifiedOnlyFilter
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-slate-900/60 border-slate-800"
              }`}
          >
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Award className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Verified</p>
              <p className="text-lg font-bold text-white">{stats.totalVerified}</p>
            </div>
          </button>

          {/* Unverified */}
          <button
            onClick={() => {
              setVerifiedOnlyFilter(false);
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-3 flex items-center gap-3 bg-slate-900/60 border-slate-800"
          >
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Unverified</p>
              <p className="text-lg font-bold text-white">{stats.totalUnverified}</p>
            </div>
          </button>

        </div>

        {/* Reviews Section */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
          {/* Compact toolbar */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[140px]" ref={productDropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={showProductDropdown ? productSearchTerm : getSelectedProductTitle()}
                    onChange={(e) => { setProductSearchTerm(e.target.value); if (!showProductDropdown) setShowProductDropdown(true); }}
                    onFocus={() => { setShowProductDropdown(true); setProductSearchTerm(""); }}
                    placeholder={loadingProducts ? "Loading..." : "All Products"}
                    disabled={loadingProducts || loadingReviews}
                    className={`w-full px-3 py-2 pl-8 pr-7 bg-slate-800 border rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${productFilter !== "all" ? "border-violet-500/60 bg-violet-500/10" : "border-slate-700 hover:border-slate-600"
                      } ${loadingProducts || loadingReviews ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <ShoppingBag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />

                  {productFilter !== "all" ? (
                    <button
                      onClick={() => {
                        setProductFilter("all");
                        setProductSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-all"
                    >
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                    </button>
                  ) : (
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform ${showProductDropdown ? "rotate-180" : ""
                        }`}
                    />
                  )}
                </div>

                {/* ✅ Dropdown Menu */}
                {showProductDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
                    {/* All Products Option */}
                    <button
                      onClick={() => {
                        setProductFilter("all");
                        setShowProductDropdown(false);
                        setProductSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-all ${productFilter === "all" ? "bg-purple-500/10 text-purple-400" : "text-white"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">All Products</span>
                      </div>
                    </button>

                    {/* Product List */}
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <button
                          key={product.productId}
                          onClick={() => {
                            setProductFilter(product.productId);
                            setShowProductDropdown(false);
                            setProductSearchTerm("");
                            setCurrentPage(1);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-all border-t border-slate-700 ${productFilter === product.productId ? "bg-purple-500/10 text-purple-400" : "text-white"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={getImageUrl(product.productImageUrl) || "/placeholder.png"}
                                alt={product.productName}
                                className="h-8 w-8 rounded-md object-cover border border-slate-700 flex-shrink-0"
                                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                              />

                              <span className="text-sm truncate">{product.productName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 flex-shrink-0">{product.totalReviews} reviews</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-slate-500 text-sm">
                        No products found for "{productSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Search */}
              <div className="relative flex-1 min-w-[120px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, title..."
                  className="w-full px-3 py-2 pl-8 pr-7 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded transition-all">
                    <X className="h-3 w-3 text-slate-400 hover:text-white" />
                  </button>
                )}
              </div>
              {/* Status Filter */}
              <div className="relative flex-1 min-w-[100px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className={`w-full px-3 py-2 pr-7 bg-slate-800 border rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer ${statusFilter !== "all" ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 hover:border-slate-600"
                    }`}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>
              {/* Rating Filter */}
              <div className="relative flex-1 min-w-[100px]">
                <select
                  value={ratingFilter}
                  onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
                  className={`w-full px-3 py-2 pr-7 bg-slate-800 border rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer ${ratingFilter !== "all" ? "border-yellow-500/60 bg-yellow-500/10" : "border-slate-700 hover:border-slate-600"
                    }`}
                >
                  <option value="all">All Ratings</option>
                  <option value="5">★★★★★ 5</option>
                  <option value="4">★★★★ 4</option>
                  <option value="3">★★★ 3</option>
                  <option value="2">★★ 2</option>
                  <option value="1">★ 1</option>
                </select>
                <Star className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>
              {/* Verified */}
              <label className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg cursor-pointer transition-all text-xs ${verifiedOnlyFilter ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                <input type="checkbox" checked={verifiedOnlyFilter} onChange={(e) => { setVerifiedOnlyFilter(e.target.checked); setCurrentPage(1); }} className="w-3 h-3 text-green-500 rounded" />
                Verified
              </label>


              {/* Date Range Filter */}
              <div className="relative flex-1 min-w-[130px]" ref={datePickerRef}>
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`w-full px-3 py-2 pl-7 pr-6 bg-slate-800 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all text-left whitespace-nowrap ${(dateRange.startDate || dateRange.endDate)
                        ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                        : "border-slate-700 hover:border-slate-600 text-slate-400"
                      }`}
                  >
                    {getDateRangeLabel()}
                  </button>

                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {(dateRange.startDate || dateRange.endDate) ? (
                    <button onClick={(e) => { e.stopPropagation(); setDateRange({ startDate: "", endDate: "" }); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded transition-all">
                      <X className="h-3 w-3 text-slate-400 hover:text-white" />
                    </button>
                  ) : (
                    <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
                  )}

                </div>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-4 z-50 min-w-[280px]">
                    <div className="space-y-3">
                      {/* From Date */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block">From Date</label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                            // Auto close after selecting both dates
                            if (dateRange.endDate && e.target.value) {
                              setTimeout(() => setShowDatePicker(false), 300);
                            }
                          }}
                          max={dateRange.endDate || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        />
                      </div>

                      {/* To Date */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1.5 block">To Date</label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => {
                            setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                            // Auto close after selecting both dates
                            if (dateRange.startDate && e.target.value) {
                              setTimeout(() => setShowDatePicker(false), 300);
                            }
                          }}
                          min={dateRange.startDate}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        />
                      </div>

                      {/* Quick Filter Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            const today = new Date();
                            const weekAgo = new Date(today);
                            weekAgo.setDate(today.getDate() - 7);
                            setDateRange({
                              startDate: weekAgo.toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                            });
                            setShowDatePicker(false);
                          }}
                          className="flex-1 px-3 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-lg text-xs font-medium transition-all border border-violet-500/30"
                        >
                          Last 7 Days
                        </button>

                        <button
                          onClick={() => {
                            const today = new Date();
                            const monthAgo = new Date(today);
                            monthAgo.setMonth(today.getMonth() - 1);
                            setDateRange({
                              startDate: monthAgo.toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                            });
                            setShowDatePicker(false);
                          }}
                          className="flex-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-medium transition-all border border-cyan-500/30"
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </div>
                  </div>
                )}


              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-2.5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-medium flex items-center gap-1">
                  <FilterX className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Entries info bar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {loadingReviews ? "Loading..." : `${totalItems > 0 ? startIndex + 1 : 0}–${Math.min(startIndex + reviews.length, totalItems)} of ${totalItems}`}
            </span>
          </div>

          {/* Loading State */}
          {loadingReviews ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading reviews...</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                {reviews.length === 0 ? "No reviews yet" : "No reviews found"}
              </p>
              <p className="text-slate-500 text-sm">
                {reviews.length === 0
                  ? productFilter === "all"
                    ? "Reviews will appear here when customers submit them"
                    : "This product has no reviews yet"
                  : "Try adjusting your search or filters"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="py-2 px-3 w-8">
                      <input type="checkbox" checked={selectedReviews.length === currentData.length && currentData.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 text-violet-500 rounded" />
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Review</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((review) => (

                    <tr key={review.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                      <td className="py-2 px-3">
                        <input type="checkbox" checked={selectedReviews.includes(review.id)} onChange={() => toggleSelectReview(review.id)} className="w-3.5 h-3.5 text-violet-500 rounded" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                            {review.customerName?.charAt(0).toUpperCase() || "C"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-white font-medium text-xs">{review.customerName}</p>
                              {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-[9px] font-medium">
                                  <CheckCircle className="h-2.5 w-2.5" />Verified
                                </span>
                              )}
                            </div>
                            <p className="text-violet-400 text-[10px] font-medium truncate max-w-[200px]">{review.title}</p>
                            <p className="text-slate-400 text-[11px] line-clamp-1 max-w-[280px]">{review.comment}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <button

                          className="flex items-center gap-2 text-left max-w-[220px]"
                        >
                          <img
                            src={getImageUrl(
                              products.find(p => p.productId === review.productId)?.productImageUrl
                            ) || "/placeholder.png"}
                            alt="product"
                            className="h-8 w-8 rounded-md object-cover border border-slate-700 flex-shrink-0"
                            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                          />

                          <div className="min-w-0">
                            {/* Product Name */}

                            <a
                              href={`/product/${review.productSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs truncate block"
                            >
                              {review.productName}
                            </a>

                            {/* ✅ SKU (NEW) */}
                            {review.productSku && (
                              <p className="text-[10px] text-slate-500 truncate">
                                SKU: {review.productSku}
                              </p>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {renderStars(review.rating)}
                        <p className="text-[10px] text-slate-500">{review.rating}/5</p>
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-slate-300 text-xs">  {formatDate(review.createdAt)}</p>

                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${review.isApproved ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                          {review.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-0.5">

                          {/* APPROVE (only if not approved) */}
                          {!review.isApproved && (
                            <button
                              onClick={() =>
                                setApproveConfirm({
                                  id: review.id,
                                  customer: review.customerName,
                                  title: review.title,
                                })
                              }
                              className="flex flex-col items-center gap-0.5 px-2 py-1 text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-medium leading-none">Approve</span>
                            </button>
                          )}

                          {/* REPLY (only if approved) */}
                          {review.isApproved && (
                            <button
                              onClick={() => setReplyingTo(review)}
                              className="flex flex-col items-center gap-0.5 px-2 py-1 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <Reply className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-medium leading-none">Reply</span>
                            </button>
                          )}

                          {/* VIEW (always visible) */}
                          <button
                            onClick={() => setViewingReview(review)}
                            className="flex flex-col items-center gap-0.5 px-2 py-1 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-medium leading-none">View</span>
                          </button>

                          {/* DELETE (always visible) */}
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                id: review.id,
                                customer: review.customerName,
                              })
                            }
                            className="flex flex-col items-center gap-0.5 px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-medium leading-none">Delete</span>
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

        {/* Pagination */}
        {totalPages > 1 && !loadingReviews && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>

              <div className="flex items-center gap-1">
                <button onClick={goToFirstPage} disabled={currentPage === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsLeft className="h-3.5 w-3.5" /></button>
                <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-3.5 w-3.5" /></button>
                {getPageNumbers().map((page) => (
                  <button key={page} onClick={() => goToPage(page)} className={`px-2.5 py-1 text-xs rounded-lg transition-all ${currentPage === page ? "bg-violet-500 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>{page}</button>
                ))}
                <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-3.5 w-3.5" /></button>
                <button onClick={goToLastPage} disabled={currentPage === totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsRight className="h-3.5 w-3.5" /></button>
              </div>
              <span className="text-xs text-slate-500">{totalItems} total</span>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {replyingTo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-blue-500/20 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-500/10">
              <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Reply to Review
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Replying to {replyingTo.customerName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(replyingTo.rating, "h-4 w-4")}
                  </div>
                  <p className="text-violet-400 text-sm font-medium mb-1">
                    {replyingTo.title}
                  </p>
                  <p className="text-white">{replyingTo.comment}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={
                      !replyText.trim() || actionLoading === replyingTo.id
                    }
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === replyingTo.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Reply className="h-4 w-4" />
                        Post Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Review Modal */}
        {viewingReview && (() => {
          const images = normalizeToArray(viewingReview?.imageUrls);
          const videos = normalizeToArray(viewingReview?.videoUrls);

          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
                <div className="p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                        Review Details
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        View review information
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingReview(null)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {viewingReview.customerName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {viewingReview.customerName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(viewingReview.rating, "h-4 w-4")}
                            <span className="text-slate-400 text-sm">
                              {viewingReview.rating}/5
                            </span>
                          </div>
                        </div>
                        <span
                          className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium ${viewingReview.isApproved
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                            }`}
                        >
                          {viewingReview.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Title</p>
                          <p className="text-violet-400 font-medium">
                            {viewingReview.title}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400 text-sm mb-1">Review</p>
                          <p className="text-white">{viewingReview.comment}</p>
                        </div>

                        {(images.length > 0 || videos.length > 0) && (
                          <div className="space-y-4">

                            {/* ================= IMAGES ================= */}
                            {images.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <ImageIcon className="h-4 w-4 text-cyan-400" />
                                  <p className="text-slate-400 text-sm">Images</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {images.map((img, index) => {
                                    const finalUrl = resolveMediaUrl(img);

                                    return (
                                      <a
                                        key={`${img}-${index}`}
                                        href={finalUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60"
                                      >
                                        <img
                                          src={finalUrl}
                                          alt={`Review image ${index + 1}`}
                                          onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                          className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ================= VIDEOS ================= */}
                            {videos.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Video className="h-4 w-4 text-violet-400" />
                                  <p className="text-slate-400 text-sm">Videos</p>
                                </div>

                                <div className="space-y-3">
                                  {videos.map((vid, index) => {
                                    const finalUrl = resolveMediaUrl(vid);

                                    return (
                                      <div
                                        key={`${vid}-${index}`}
                                        className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"
                                      >
                                        {isPlayableVideoUrl(finalUrl) ? (
                                          <video
                                            controls
                                            preload="metadata"
                                            className="w-full rounded-lg bg-black"
                                            src={finalUrl}
                                          />
                                        ) : (
                                          <a
                                            href={finalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-400 hover:underline"
                                          >
                                            Open video {index + 1}
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        <div>
                          <p className="text-slate-400 text-sm mb-1">Product</p>
                          <button
                            onClick={() => {
                              setProductFilter(viewingReview.productId);
                              setViewingReview(null);
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {viewingReview.productName || products.find((p) => p.productId === viewingReview.productId)?.productName || "Unknown Product"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Date</p>
                            <p className="text-white text-sm">
                              {formatDate(viewingReview.createdAt)}
                            </p>
                          </div>

                          {viewingReview.isVerifiedPurchase && (
                            <div>
                              <p className="text-slate-400 text-sm mb-1">
                                Purchase
                              </p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            </div>
                          )}
                        </div>

                        {viewingReview.approvedAt && (
                          <div>
                            <p className="text-slate-400 text-sm mb-1">
                              Approved At
                            </p>
                            <p className="text-white text-sm">
                              {formatDate(viewingReview.approvedAt)}
                            </p>
                            {viewingReview.approvedBy && (
                              <p className="text-slate-500 text-xs mt-1">
                                By: {viewingReview.approvedBy}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Helpful</p>
                            <p className="text-green-400 text-xl font-bold">
                              {viewingReview.helpfulCount}
                            </p>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">
                              Not Helpful
                            </p>
                            <p className="text-red-400 text-xl font-bold">
                              {viewingReview.notHelpfulCount}
                            </p>
                          </div>
                        </div>

                        {viewingReview.replies && viewingReview.replies.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-sm mb-2">
                              Replies ({viewingReview.replies.length})
                            </p>
                            <div className="space-y-2">
                              {viewingReview.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {reply.createdByName}
                                    </span>
                                    {reply.isAdminReply && (
                                      <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 rounded text-violet-400 text-xs font-medium">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-300 text-sm">
                                    {reply.comment}
                                  </p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    {formatDate(reply.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                      {!viewingReview.isApproved && (
                        <button
                          onClick={() => {
                            handleApprove(viewingReview.id);
                            setViewingReview(null);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                        >
                          Approve Review
                        </button>
                      )}
                      <button
                        onClick={() => setViewingReview(null)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-4xl w-full shadow-2xl shadow-violet-500/10 flex flex-col max-h-[90vh]">

              {/* ✅ Fixed Modal Header */}
              <div className="flex-shrink-0 p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                      Create Product Review
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Add a new review for a product
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        productId: "",
                        title: "",
                        comment: "",
                        rating: 5
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* ✅ Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Product Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Product <span className="text-red-400">*</span>
                  </label>

                  <div className="relative">
                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder="Search or select product..."
                      value={
                        formData.productId
                          ? `${formProducts.find(p => p.id === formData.productId)?.name || ''} ${formProducts.find(p => p.id === formData.productId)?.price ? `-£${formProducts.find(p => p.id === formData.productId)?.price}` : ''}`
                          : productSearch
                      }
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                        if (!e.target.value) {
                          setFormData({ ...formData, productId: '' });
                        }
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full px-4 py-3 pl-10 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />

                    {/* Icon */}
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />

                    {/* Dropdown List */}
                    {showProductDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-lg max-h-80 overflow-auto">
                        {filteredFormProducts.length > 0 ? (
                          filteredFormProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, productId: product.id });
                                setProductSearch('');
                                setShowProductDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-violet-500/20 transition-colors border-b border-slate-800 last:border-b-0 ${formData.productId === product.id
                                  ? 'bg-violet-500/30 text-violet-300'
                                  : 'text-white'
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  {product.sku && (
                                    <div className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</div>
                                  )}
                                </div>
                                {product.price && (
                                  <div className="text-emerald-400 font-semibold">£{product.price}</div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-slate-400 text-sm text-center">
                            No products found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Close dropdown overlay */}
                    {showProductDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProductDropdown(false)}
                      />
                    )}
                  </div>

                  {/* Helper text */}
                  {formData.productId && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Selected: {formProducts.find(p => p.id === formData.productId)?.name}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-1">
                    {productSearch
                      ? `Showing ${filteredFormProducts.length} of ${formProducts.length} products`
                      : `${formProducts.length} products available`
                    }
                  </p>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Review Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Excellent product, highly recommended!"
                    maxLength={100}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.title.length} / 100 characters
                  </p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Rating <span className="text-red-400">*</span>
                  </label>
                  <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                    <StarRating
                      value={formData.rating}
                      onChange={(rating) => setFormData({ ...formData, rating })}
                      size="h-8 w-8"
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Review Comment <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.comment.length} / 1000 characters
                  </p>
                </div>

                {/* Preview Card */}
                {formData.title && formData.comment && (
                  <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Preview:</p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-sm">Admin</p>
                          <div className="flex items-center">
                            {[...Array(formData.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-white font-medium text-sm mb-1">{formData.title}</p>
                        <p className="text-slate-400 text-xs line-clamp-2">{formData.comment}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Fixed Modal Footer */}
              <div className="flex-shrink-0 p-6 border-t border-slate-700/50 bg-slate-900/50 flex justify-end gap-3 rounded-b-3xl">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      productId: "",
                      title: "",
                      comment: "",
                      rating: 5
                    });
                  }}
                  className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReview}
                  disabled={creating || !formData.productId || !formData.title.trim() || !formData.comment.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Create Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Approve Confirmation Modal */}
        {approveConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-green-500/20 rounded-3xl max-w-md w-full shadow-2xl shadow-green-500/10">
              {/* Header */}
              <div className="p-6 border-b border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Approve Review</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Confirm review approval
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 mb-6">
                  <p className="text-slate-300 text-sm mb-3">
                    Are you sure you want to approve this review?
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 text-xs mt-0.5">👤</span>
                      <div>
                        <p className="text-xs text-slate-500">Customer</p>
                        <p className="text-white text-sm font-medium">
                          {approveConfirm.customer}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 text-xs mt-0.5">📝</span>
                      <div>
                        <p className="text-xs text-slate-500">Review Title</p>
                        <p className="text-white text-sm">
                          {approveConfirm.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-6">
                  <p className="text-green-400 text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    This review will be published and visible to customers
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setApproveConfirm(null)}
                    disabled={isApproving}
                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprove(approveConfirm.id)}
                    disabled={isApproving}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/50 text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
          title="Delete Review"
          message={`Are you sure you want to delete the review by "${deleteConfirm?.customer}"? This action cannot be undone.`}
          confirmText="Delete Review"
          cancelText="Cancel"
          icon={AlertCircle}
          iconColor="text-red-400"
          confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50"
          isLoading={isDeleting}
        />
      </div>
      {showExcelImport && (
        <ExcelImportModal
          onClose={() => setShowExcelImport(false)}
          onSuccess={() => fetchReviews()}
        />
      )}

    </div>
  );
}
