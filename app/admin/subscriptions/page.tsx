"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Package,

  CheckCircle,
  X,
  Search,

  Eye,

  AlertCircle,

  Pause,
  Play,
  Ban,

  PoundSterling,

  User,

  ShoppingBag,
  SkipForward,

  RefreshCw,
} from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { subscriptionsService, Subscription } from "@/lib/services/subscriptions";

import { formatDate, getImageUrl } from "../_utils/formatUtils";
import ImagePreviewModal from "../_components/ImagePreviewModal";

// ✅ Product interface
interface Product {
  id: string;
  name: string;
  sku: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all"); // ✅ NEW

  // ✅ Product dropdown states
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);


  const [viewingSubscription, setViewingSubscription] = useState<Subscription | null>(null);

  // ✅ Confirmation modal states
  const [pausingSubscription, setPausingSubscription] = useState<Subscription | null>(null);
  const [resumingSubscription, setResumingSubscription] = useState<Subscription | null>(null);
  const [skippingSubscription, setSkippingSubscription] = useState<Subscription | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

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

  // ✅ Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // ✅ Get selected product title
  const getSelectedProductTitle = () => {
    if (productFilter === "all") return "All Products";
    const product = products.find(p => p.id === productFilter);
    return product?.name || "Unknown Product";
  };

  // Fetch Subscriptions
  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const response = await subscriptionsService.getAll();
      if (response.data?.success && Array.isArray(response.data.data)) {
        setSubscriptions(response.data.data);

        // ✅ Extract unique products from subscriptions
        const uniqueProducts = new Map<string, Product>();
        response.data.data.forEach((sub: Subscription) => {
          if (sub.productId && sub.productName) {
            uniqueProducts.set(sub.productId, {
              id: sub.productId,
              name: sub.productName,
              sku: sub.productSku || ''
            });
          }
        });
        setProducts(Array.from(uniqueProducts.values()));

        console.log("✅ Subscriptions loaded:", response.data.data.length);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
      setSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSubscriptions();
      setLoading(false);
    };
    loadData();
  }, []);

  // Calculate stats
  const calculateStats = (subscriptionsData: Subscription[]) => {
    const total = subscriptionsData.length;

    const active = subscriptionsData.filter((s) => s.status === "Active").length;
    const paused = subscriptionsData.filter((s) => s.status === "Paused").length;
    const cancelled = subscriptionsData.filter((s) => s.status === "Cancelled").length;

    const totalRevenue = subscriptionsData
      .filter((s) => s.status === "Active")
      .reduce((sum, s) => sum + s.discountedPrice * s.quantity, 0);

    setStats({ total, active, paused, cancelled, totalRevenue });
  };

  useEffect(() => {
    if (subscriptions.length > 0) {
      const filtered = subscriptions.filter((subscription) => {
        const matchesSearch =
          subscription.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.shippingFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.productSku?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && subscription.status === "Active") ||
          (statusFilter === "paused" && subscription.status === "Paused") ||
          (statusFilter === "cancelled" && subscription.status === "Cancelled");
        const matchesFrequency =
          frequencyFilter === "all" ||
          subscription.frequency === frequencyFilter;

        // ✅ NEW: Product filter
        const matchesProduct =
          productFilter === "all" || subscription.productId === productFilter;

        return matchesSearch && matchesStatus && matchesFrequency && matchesProduct;
      });

      calculateStats(filtered);
    } else {
      setStats({ total: 0, active: 0, paused: 0, cancelled: 0, totalRevenue: 0 });
    }
  }, [subscriptions, searchTerm, statusFilter, frequencyFilter, productFilter]);

  // ✅ Action Handlers with Confirmation
  const handlePauseConfirm = async () => {
    if (!pausingSubscription) return;

    setActionLoading(pausingSubscription.id);
    try {
      const response = await subscriptionsService.pause(pausingSubscription.id);
      if (response.data?.success) {
        toast.success("Subscription paused successfully! ⏸️");
        setPausingSubscription(null);
        await fetchSubscriptions();
      }
    } catch (error: any) {
      console.error("Error pausing subscription:", error);
      toast.error(error?.response?.data?.message || "Failed to pause subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeConfirm = async () => {
    if (!resumingSubscription) return;

    setActionLoading(resumingSubscription.id);
    try {
      const response = await subscriptionsService.resume(resumingSubscription.id);
      if (response.data?.success) {
        toast.success("Subscription resumed successfully! ▶️");
        setResumingSubscription(null);
        await fetchSubscriptions();
      }
    } catch (error: any) {
      console.error("Error resuming subscription:", error);
      toast.error(error?.response?.data?.message || "Failed to resume subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipConfirm = async () => {
    if (!skippingSubscription) return;

    setActionLoading(skippingSubscription.id);
    try {
      const response = await subscriptionsService.skip(skippingSubscription.id);
      if (response.data?.success) {
        toast.success("Next delivery skipped! ⏩");
        setSkippingSubscription(null);
        await fetchSubscriptions();
      }
    } catch (error: any) {
      console.error("Error skipping delivery:", error);
      toast.error(error?.response?.data?.message || "Failed to skip delivery");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancellingSubscription || !cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setActionLoading(cancellingSubscription.id);
    try {
      const response = await subscriptionsService.cancel(cancellingSubscription.id, {
        cancellationReason: cancelReason,
      });

      if (response.data?.success) {
        toast.success("Subscription cancelled! 🚫");
        setCancellingSubscription(null);
        setCancelReason("");
        await fetchSubscriptions();
      }
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error?.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter("all");
    setFrequencyFilter("all");
    setProductFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    frequencyFilter !== "all" ||
    productFilter !== "all" ||
    searchTerm.trim() !== "";

  // Filter data
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      subscription.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.shippingFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.productSku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && subscription.status === "Active") ||
      (statusFilter === "paused" && subscription.status === "Paused") ||
      (statusFilter === "cancelled" && subscription.status === "Cancelled");

    const matchesFrequency =
      frequencyFilter === "all" || subscription.frequency === frequencyFilter;
    const matchesProduct =
      productFilter === "all" || subscription.productId === productFilter;

    return matchesSearch && matchesStatus && matchesFrequency && matchesProduct;
  });

  // Pagination
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredSubscriptions.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, frequencyFilter, productFilter]);

  // Get Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">
            Active
          </span>
        );

      case "Paused":
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400">
            Paused
          </span>
        );

      case "Cancelled":
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400">
            Cancelled
          </span>
        );

      default:
        return (
          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400">
            {status}
          </span>
        );
    }
  };
  // Get Frequency Badge
  const getFrequencyBadge = (frequency: string) => {
    return frequency || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="space-y-2">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Subscriptions Management
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage and monitor customer subscriptions
            </p>
          </div>

          <button
            onClick={fetchSubscriptions}
            disabled={loadingSubscriptions}
            className="px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-lg transition flex items-center gap-2 text-sm border border-slate-700/50"
          >
            {loadingSubscriptions ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Package, color: "blue" },
            { label: "Active", value: stats.active, icon: CheckCircle, color: "green" },
            { label: "Paused", value: stats.paused, icon: Pause, color: "yellow" },
            { label: "Cancelled", value: stats.cancelled, icon: Ban, color: "red" },
            { label: "Revenue", value: `££{stats.totalRevenue.toFixed(2)}`, icon: PoundSterling, color: "violet" }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex items-center gap-3 hover:border-slate-600 transition"
            >
              <div className={`w-9 h-9 rounded-lg bg-£{item.color}-500/10 flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 text-£{item.color}-400`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-white font-semibold text-sm">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ================= ITEMS PER PAGE ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-white text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div>
              {loadingSubscriptions
                ? "Loading..."
                : `Showing £{totalItems > 0 ? startIndex + 1 : 0} to £{Math.min(endIndex, totalItems)} of £{totalItems}`}
            </div>
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2">
          <div className="flex flex-col xl:flex-row gap-2 xl:items-center">

            {/* LEFT FILTERS */}
            <div className="flex flex-col lg:flex-row gap-2 flex-1 min-w-0">

              {/* STATUS */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white min-w-[145px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* FREQUENCY */}
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white min-w-[170px]"
              >
                <option value="all">All Frequencies</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>

              {/* PRODUCT */}
              <div
                className="relative flex-1 min-w-[240px]"
                ref={productDropdownRef}
              >
                <input
                  type="text"
                  value={
                    showProductDropdown
                      ? productSearchTerm
                      : getSelectedProductTitle()
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductSearchTerm(value);
                    setShowProductDropdown(true);

                    const matched = products.find(
                      (p) =>
                        p.name.toLowerCase().includes(value.toLowerCase()) ||
                        p.sku.toLowerCase().includes(value.toLowerCase())
                    );

                    setProductFilter(matched ? matched.id : "all");
                  }}
                  onFocus={() => {
                    setShowProductDropdown(true);
                    setProductSearchTerm("");
                  }}
                  placeholder="All Products"
                  className="w-full h-10 px-3 pl-9 pr-8 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white"
                />

                <ShoppingBag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                {showProductDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-56 overflow-y-auto z-50 shadow-xl">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setProductFilter(product.id);
                          setShowProductDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-white text-left hover:bg-slate-700 text-xs"
                      >
                        {product.name}
                        {product.sku && (
                          <span className="text-xs text-slate-400">
                            {" "}({product.sku})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex gap-2 w-full xl:w-auto">

              {/* SEARCH */}
              <div className="relative flex-1 xl:w-72">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subscriptions..."
                  className="w-full h-10 px-3 pl-9 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* CLEAR */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-10 px-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-slate-800/60 border-b border-slate-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 text-left">Product</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-center">Frequency</th>
                  <th className="py-2.5 px-3 text-center">Price</th>
                  <th className="py-2.5 px-3 text-left">Next</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {currentData.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-slate-800/40">

                    <td className="py-2.5 px-3">
                      <div className="flex gap-2">

                        {/* IMAGE */}
                        <div
                          onClick={() =>
                            subscription.productImageUrl &&
                            setPreviewImage(subscription.productImageUrl)
                          }
                          className="w-14 h-14 bg-slate-700 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all"
                        >
                          {subscription.productImageUrl ? (
                            <img
                              src={getImageUrl(subscription.productImageUrl)}
                              alt="Product"
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                            />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-slate-500" />
                          )}
                        </div>

                        {/* INFO */}
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium truncate">
                            {subscription.productName}
                          </p>

                          {/* SKU + Qty Inline */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[12px] text-sky-400 truncate">
                              SKU: {subscription.productSku}
                            </p>

                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold leading-none">
                              Qty {subscription.quantity}
                            </span>
                          </div>

                          {/* Variant */}
                          {subscription.variantName && (
                            <p className="text-[10px] text-violet-400 truncate">
                              {subscription.variantName}
                            </p>
                          )}
                        </div>

                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5 min-w-0">

                        {/* Customer Name */}
                        <p className="text-sm font-medium text-white truncate">
                          {subscription.shippingFullName}
                        </p>

                        {/* City / State */}
                        <p className="text-[12px] text-slate-400 truncate">
                          {subscription.shippingCity}, {subscription.shippingState}
                        </p>

                        {/* Full Address */}
                        {subscription.shippingFullAddress && (
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 max-w-[240px]">
                            {subscription.shippingFullAddress}
                          </p>
                        )}

                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-white text-xs">
                      {subscription.frequencyDisplay}
                    </td>

                    <td className="py-2.5 px-3 text-center text-xs">
                      <p className="text-white font-semibold">£{subscription.discountedPrice.toFixed(2)}</p>
                      {subscription.discountPercentage > 0 && (
                        <>
                          <p className="line-through text-slate-500 text-[10px]">£{subscription.price.toFixed(2)}</p>
                          <p className="text-green-400 text-[10px]">-{subscription.discountPercentage}%</p>
                        </>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-xs text-slate-400">
                      {formatDate(subscription.nextDeliveryDate)}
                    </td>

                    <td className="py-2.5 px-3 text-center text-xs">
                      {getStatusBadge(subscription.status)}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex justify-center gap-1">

                        {/* ACTIVE */}
                        {subscription.status === "Active" && (
                          <>
                            <button
                              onClick={() => setPausingSubscription(subscription)}
                              className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setSkippingSubscription(subscription)}
                              className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                            >
                              <SkipForward className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        {/* PAUSED */}
                        {subscription.status === "Paused" && (
                          <button
                            onClick={() => setResumingSubscription(subscription)}
                            className="p-1.5 text-green-400 hover:bg-green-500/10 rounded"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* ✅ CANCEL (ONLY ACTIVE + PAUSED) */}
                        {(subscription.status === "Active" || subscription.status === "Paused") && (
                          <button
                            onClick={() => setCancellingSubscription(subscription)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* ALWAYS AVAILABLE */}
                        <button
                          onClick={() => setViewingSubscription(subscription)}
                          className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>

      {/* Pause Confirmation Modal */}
      {pausingSubscription && (
        <ConfirmDialog
          isOpen={!!pausingSubscription}
          onClose={() => setPausingSubscription(null)}
          onConfirm={handlePauseConfirm}
          title="Pause Subscription"
          message={`Are you sure you want to pause the subscription for £{pausingSubscription.productName}?`}
          confirmText="Pause"
          confirmButtonClass="bg-yellow-600 hover:bg-yellow-700"
          isLoading={actionLoading === pausingSubscription.id}
        />
      )}

      {/* Resume Confirmation Modal */}
      {resumingSubscription && (
        <ConfirmDialog
          isOpen={!!resumingSubscription}
          onClose={() => setResumingSubscription(null)}
          onConfirm={handleResumeConfirm}
          title="Resume Subscription"
          message={`Are you sure you want to resume the subscription for £{resumingSubscription.productName}?`}
          confirmText="Resume"
          confirmButtonClass="bg-green-600 hover:bg-green-700"
          isLoading={actionLoading === resumingSubscription.id}
        />
      )}

      {/* Skip Confirmation Modal */}
      {skippingSubscription && (
        <ConfirmDialog
          isOpen={!!skippingSubscription}
          onClose={() => setSkippingSubscription(null)}
          onConfirm={handleSkipConfirm}
          title="Skip Next Delivery"
          message={`Are you sure you want to skip the next delivery for £{skippingSubscription.productName}?`}
          confirmText="Skip"
          confirmButtonClass="bg-blue-600 hover:bg-blue-700"
          isLoading={actionLoading === skippingSubscription.id}
        />
      )}

      {/* Cancel Subscription Modal - Custom */}
      {cancellingSubscription && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-red-500/20 rounded-3xl max-w-2xl w-full shadow-2xl shadow-red-500/10">
            <div className="p-6 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Cancel Subscription</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Cancelling {cancellingSubscription.productName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCancellingSubscription(null);
                    setCancelReason("");
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
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-white font-medium">Are you sure?</p>
                </div>
                <p className="text-slate-300 text-sm">
                  This will cancel the subscription for{" "}
                  <span className="font-medium text-white">{cancellingSubscription.shippingFullName}</span>.
                  This action cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
              <button
                onClick={() => {
                  setCancellingSubscription(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason.trim() || actionLoading === cancellingSubscription.id}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === cancellingSubscription.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Cancel Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Subscription Modal */}
      {viewingSubscription && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    Subscription Details
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    View subscription information
                  </p>
                </div>
                <button
                  onClick={() => setViewingSubscription(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Product Info */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-violet-400" />
                    Product Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Product</p>
                      <p className="text-white font-medium">
                        {viewingSubscription.productName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">SKU</p>
                      <p className="text-white">{viewingSubscription.productSku}</p>
                    </div>
                    {viewingSubscription.variantName && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Variant</p>
                        <p className="text-white">
                          {viewingSubscription.variantName}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Quantity</p>
                      <p className="text-white">{viewingSubscription.quantity}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    Customer Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Name</p>
                      <p className="text-white">
                        {viewingSubscription.shippingFullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Shipping Address
                      </p>
                      <p className="text-white">
                        {viewingSubscription.shippingFullAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-400" />
                    Subscription Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Status</p>
                      {getStatusBadge(viewingSubscription.status)}
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Frequency</p>
                      <p className="text-white">
                        {viewingSubscription.frequencyDisplay ||
                          getFrequencyBadge(viewingSubscription.frequency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Start Date</p>
                      <p className="text-white">
                        {formatDate(viewingSubscription.startDate)}
                      </p>
                    </div>
                    {viewingSubscription.nextDeliveryDate && (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">
                          Next Delivery
                        </p>
                        <p className="text-white">
                          {formatDate(viewingSubscription.nextDeliveryDate)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Total Deliveries
                      </p>
                      <p className="text-white">
                        {viewingSubscription.totalDeliveries}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Skipped Deliveries
                      </p>
                      <p className="text-white">
                        {viewingSubscription.skippedDeliveries}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-yellow-400" />
                    Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Original Price
                      </p>
                      <p className="text-white">
                        £{viewingSubscription.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Discounted Price
                      </p>
                      <p className="text-green-400 font-bold">
                        £{viewingSubscription.discountedPrice.toFixed(2)}
                      </p>
                    </div>
                    {viewingSubscription.discountPercentage > 0 && (
                      <>
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Discount</p>
                          <p className="text-white">
                            {viewingSubscription.discountPercentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm mb-1">
                            Total Savings
                          </p>
                          <p className="text-green-400">
                            £{viewingSubscription.totalSavings.toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cancellation Info */}
                {viewingSubscription.status === "Cancelled" && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Cancellation Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">
                          Cancelled At
                        </p>
                        <p className="text-white text-sm">
                          {formatDate(viewingSubscription.cancelledAt)}
                        </p>
                      </div>
                      {viewingSubscription.cancellationReason && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Reason</p>
                          <p className="text-white text-sm">
                            {viewingSubscription.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Paused Info */}
                {viewingSubscription.status === "Paused" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Paused Information
                    </h3>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Paused At</p>
                      <p className="text-white text-sm">
                        {viewingSubscription.pausedAt &&
                          new Date(
                            viewingSubscription.pausedAt
                          ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-700/50">
              <button
                onClick={() => setViewingSubscription(null)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>

  );
}
