"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Eye,
  Search,
  X,
  Calendar,
  ShoppingBag,  
  User,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  Truck,
  Package,
  Download,
  ChevronDown,
  Crown,
  UserCheck,
  UserX,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  Award,
  Clock,
  LogIn,
  ShoppingCart,
  UserPlus,
  PoundSterling,
  CheckCircle,
  Ban,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/app/admin/_components/CustomToast";
import { Customer, CustomerQueryParams, customersService, CustomerStats } from "@/lib/services/customers";
import ConfirmDialog from "../_components/ConfirmDialog";
import { useDebounce } from "../_hooks/useDebounce";
import { formatDate, getOrderProductImage } from "../_utils/formatUtils";

type CustomerTier = "all" | "gold" | "silver" | "bronze";

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-green-500/15 text-green-400 border border-green-500/30";
    case "processing":
      return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    case "pending":
      return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
    case "cancelled":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
    default:
      return "bg-slate-700/40 text-slate-300 border border-slate-600/40";
  }
};

const getPaymentColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "text-green-400";
    case "pending":
      return "text-yellow-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
};

export default function CustomersPage() {
  const toast = useToast();

  // ✅ State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<Customer | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderCustomer, setSelectedOrderCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // ✅ Only 3 Filters (Backend)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [tierFilter, setTierFilter] = useState<CustomerTier>("all");

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

  const getTier = (customer: Customer): CustomerTier => {
    return (customer.tierLevel?.toLowerCase() as CustomerTier) || "bronze";
  };

  

  // ✅ Fetch Customers - ONLY BACKEND FILTERING
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setFilterLoading(true);

      const params: CustomerQueryParams = {
        page: currentPage,
        pageSize,
      };

      if (debouncedSearchTerm) {
        params.searchTerm = debouncedSearchTerm;
      }

      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active";
      }

      if (tierFilter !== "all") {
        params.tierLevel = tierFilter.toUpperCase();
      }

      const response = await customersService.getAll(params);

      if (response?.data?.success) {
        const resData = response.data.data;
        setCustomers(resData.items || []);
        setStats(resData.stats);
        setTotalCount(resData.totalCount);
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, tierFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ✅ Bulk Selection
  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c.id));
    }
  };

  const toggleSelectCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  // ✅ Export Functions
  const generateExcel = (customersToExport: Customer[]) => {
    if (!customersToExport?.length) return;

    const excelData = customersToExport.map((customer) => {
      const tier = customer.tierLevel || "Bronze";
      const totalOrders = customer.totalOrders ?? 0;
      const totalSpent = customer.totalSpent ?? 0;
      const avgOrderValue = totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00";
      const lastOrderDate = customer.orders?.[0]?.orderDate;
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : "N/A";

      return {
        "Customer Name": customer.fullName || "N/A",
        Email: customer.email || "N/A",
        Phone: customer.phoneNumber || "N/A",
        Gender: customer.gender || "N/A",
        "Account Type": customer.accountType || "Personal",
        "Total Orders": totalOrders,
        "Total Spent (£)": totalSpent.toFixed(2),
        "Avg Order Value (£)": avgOrderValue,
        Status: customer.isActive ? "Active" : "Inactive",
        Tier: tier.toUpperCase(),
        "Registration Date": customer.createdAt ? formatDate(customer.createdAt) : "N/A",
        "Last Login": customer.lastLoginAt ? formatDate(customer.lastLoginAt) : "Never",
        "Days Since Last Order": daysSinceLastOrder,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const keys = Object.keys(excelData[0] || {});
    worksheet["!cols"] = keys.map((key) => ({
      wch: Math.max(key.length, ...excelData.map((row: any) => String(row[key] ?? "").length)),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `customers_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    if (selectedCustomers.length === 0) {
      toast.warning("Please select customers to export");
      return;
    }
    const customersToExport = customers.filter((c) => selectedCustomers.includes(c.id));
    generateExcel(customersToExport);
    toast.success(`${customersToExport.length} customers exported successfully`);
    setSelectedCustomers([]);
    setShowExportMenu(false);
  };

  const handleExportCurrentPage = () => {
    if (customers.length === 0) {
      toast.warning("No customers on current page");
      return;
    }
    generateExcel(customers);
    toast.success(`${customers.length} customers exported successfully`);
    setShowExportMenu(false);
  };

// Replace this line (around line where modalTier is defined):


// With this (more explicit):
const modalTier = selectedCustomer 
  ? (selectedCustomer.tierLevel?.toLowerCase() as CustomerTier) || "bronze"
  : "loading";
  
  // ✅ Clear Filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTierFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || tierFilter !== "all" || searchTerm.trim();

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatRelativeDate = (date?: string) => {
    if (!date) return "Never";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    return `${diffMonths} months ago`;
  };

  const formatExactDate = (date?: string) => {
    if (!date) return "No login activity";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      setIsToggling(true);
      await customersService.toggleStatus(customer.id);
      setCustomers(prev =>
        prev.map(c => c.id === customer.id ? { ...c, isActive: !c.isActive } : c)
      );
      setToggleConfirm(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const getTierBadge = (tier: CustomerTier) => {
    const badges = {
      gold: { label: "Gold", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
      silver: { label: "Silver", icon: Award, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
      bronze: { label: "Bronze", icon: Target, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
      all: { label: "All", icon: Users, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" }
    };
    const badge = badges[tier];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${badge.bg} ${badge.color} border ${badge.border}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customer Management</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Manage and analyze your customer base</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-[12px] transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export
              <ChevronDown className={`h-3 w-3 ${showExportMenu ? "rotate-180" : ""}`} />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg z-20 overflow-hidden">
                  <button onClick={handleExportCurrentPage} className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 text-[12px]">
                    Current Page ({customers.length})
                  </button>
                  <button onClick={handleExportSelected} className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 text-[12px]">
                    Selected ({selectedCustomers.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Total Revenue</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Avg. Order Value</p>
              <p className="text-lg font-semibold text-white">£{stats?.averageOrderValue?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Total Customers</p>
              <p className="text-lg font-semibold text-white">{stats?.totalCustomers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">New (30d)</p>
              <p className="text-lg font-semibold text-white">{stats?.newCustomersLast30Days || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Size & Info */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[11px] text-slate-500">per page</span>
          </div>
          <div className="text-[11px] text-slate-500">
            <span className="text-white font-medium">{startIndex + 1}</span> – <span className="text-white font-medium">{endIndex}</span> of <span className="text-white font-medium">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {filterLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />}
          </div>

          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value as CustomerTier); setCurrentPage(1); }}
            className={`px-3 py-2 bg-slate-800/90 border rounded-lg text-white text-xs font-medium ${tierFilter !== "all" ? "border-yellow-500 bg-yellow-500/10" : "border-slate-600"}`}
          >
            <option value="all">All Tiers</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "inactive"); setCurrentPage(1); }}
            className={`px-3 py-2 bg-slate-800/90 border rounded-lg text-white text-xs font-medium ${statusFilter !== "all" ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50" : "border-slate-600"}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-semibold flex items-center gap-1.5">
              <FilterX className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="h-14 w-14 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No customers found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2">
                    <input type="checkbox" checked={selectedCustomers.length === customers.length && customers.length > 0} onChange={toggleSelectAll} className="rounded bg-slate-800 border-slate-600 text-violet-500" />
                  </th>
                  <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-medium">Customer</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Orders</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Account Type</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Spent</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Avg</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Tier</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-[11px] text-slate-500 font-medium">Last</th>
                  <th className="text-center py-2 px-2 text-[11px] text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const tier = getTier(customer);
                  const isSelected = selectedCustomers.includes(customer.id);
                  const avgOrderValue = customer.totalOrders > 0 ? (customer.totalSpent / customer.totalOrders).toFixed(2) : "0.00";
                  return (
                    <tr key={customer.id} className={`border-b border-slate-800 transition-all ${isSelected ? "bg-violet-500/10" : "hover:bg-slate-800/40"}`}>
                      <td className="py-2 px-2">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectCustomer(customer.id)} className="rounded bg-slate-800 border-slate-600 text-violet-500" />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(customer.firstName, customer.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{customer.fullName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="text-[11px] text-slate-400 truncate">{customer.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-xs">{customer.totalOrders}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {customer.accountType ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${customer.accountType === "Business" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}>
                            {customer.accountType}
                          </span>
                        ) : <span className="text-slate-500 text-xs">N/A</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-green-400 text-sm font-medium">{formatCurrency(customer.totalSpent)}</span>
                      </td>
                      <td className="py-2 px-2 text-center text-sm text-white">£{avgOrderValue}</td>
                      <td className="py-2 px-2 text-center">{getTierBadge(getTier(customer))}</td>
                      <td className="py-2 px-2 text-center">
                        <button onClick={() => setToggleConfirm(customer)}>{getStatusBadge(customer.isActive)}</button>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-[11px] text-slate-300" title={formatExactDate(customer.lastLoginAt)}>{formatRelativeDate(customer.lastLoginAt)}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }} className="p-1 text-violet-400 hover:bg-violet-500/10 rounded-md">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setSelectedOrderCustomer(customer); setIsOrderModalOpen(true); }} className="p-1 text-green-400 hover:bg-green-500/10 rounded-md">
                            <ShoppingBag className="h-4 w-4" />
                          </button>
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

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
          <div className="flex justify-center px-2">
            <div className="pointer-events-auto mx-auto w-fit max-w-[95%] rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                    <span className="font-semibold text-white">{selectedCustomers.length}</span>
                    <span className="text-slate-300">customers selected</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Bulk actions: export selected customers.</p>
                </div>
                <div className="h-5 w-px bg-slate-700 hidden md:block" />
                <button onClick={handleExportSelected} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700">
                  <Download className="h-4 w-4" /> Export ({selectedCustomers.length})
                </button>
                <button onClick={() => setSelectedCustomers([])} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all">Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={goToFirstPage} disabled={currentPage === 1} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <button key={page} onClick={() => goToPage(page)} className={`px-3 py-2 text-sm rounded-lg transition-all ${currentPage === page ? "bg-violet-500 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>{page}</button>
                ))}
              </div>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={goToLastPage} disabled={currentPage === totalPages} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"><ChevronsRight className="h-4 w-4" /></button>
            </div>
            <div className="text-sm text-slate-400">Total: {totalCount} items</div>
          </div>
        </div>
      )}

      {isOrderModalOpen && selectedOrderCustomer && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-cyan-500/20 rounded-2xl w-full max-w-[85vw] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

      {/* HEADER */}
      <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">
            Order History ({selectedOrderCustomer.orders.length})
          </h2>
          <p className="text-xs text-slate-400">
            {selectedOrderCustomer.fullName}
          </p>
        </div>

        <button
          onClick={() => setIsOrderModalOpen(false)}
          className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* BODY */}
      <div className="overflow-y-auto p-4 space-y-5">

        {selectedOrderCustomer.orders.map((order) => {
          const MAX_ITEMS = 3;
          const isExpanded = expandedOrderId === order.id;
          const visibleItems = isExpanded
            ? order.items
            : order.items?.slice(0, MAX_ITEMS);

          return (
            <div key={order.id} className="border border-slate-700 rounded-xl overflow-hidden">

              {/* ORDER HEADER */}
              <div className="p-3 flex justify-between items-center bg-gradient-to-r from-slate-800/60 to-slate-900">
                <div>
                  <p className="text-white font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(order.orderDate)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-cyan-400 font-bold">
                    {formatCurrency(order.totalAmount)}
                  </p>

                  <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(order.status)}`}>
                    {order.statusName || order.status}
                  </span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* ITEMS */}
                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Items</h4>

                  <div className="space-y-2">
                    {visibleItems?.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">

                        <img
                          src={getOrderProductImage(item.productImageUrl)}
                          className="w-11 h-11 rounded-md object-cover border border-slate-700"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.variantName || " "}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-300">x{item.quantity}</p>
                          <p className="text-xs text-cyan-400">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SHOW MORE */}
                  {order.items?.length > MAX_ITEMS && (
                    <button
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      className="text-xs text-violet-400 hover:text-violet-300 mt-2"
                    >
                      {isExpanded
                        ? "Show less"
                        : `+${order.items.length - MAX_ITEMS} more items`}
                    </button>
                  )}
                </div>

                {/* PAYMENT */}
                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Payment</h4>

                  <div className="space-y-1 text-white text-sm">
                    <p>Method: <span className="text-white">{order.payment?.paymentMethod}</span></p>
                    <p>Status: <span className={getPaymentColor(order.paymentStatus)}>{order.paymentStatus}</span></p>
                    <p>Paid: <span className="text-green-400">{formatCurrency(order.totalPaidAmount)}</span></p>

                    {order.payment?.transactionId && (
                      <p className="text-xs text-slate-400">
                        TXN: {order.payment.transactionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* SHIPPING */}
                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Shipping</h4>

                  <p className="text-sm text-slate-300">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>

                  <p className="text-xs text-slate-400">
                    {order.shippingAddress.addressLine1}
                  </p>

                  <p className="text-xs text-slate-400">
                    {order.shippingAddress.city}, {order.shippingAddress.country}
                  </p>

                  <p className="text-xs text-slate-500">
                    {order.shippingAddress.phoneNumber}
                  </p>
                </div>

                {/* SUMMARY */}
                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Summary</h4>

                  <div className="text-sm text-white space-y-1">
                    <p>Subtotal: {formatCurrency(order.subtotalAmount)}</p>
                    <p>Tax: {formatCurrency(order.taxAmount)}</p>
                    <p>Shipping: {formatCurrency(order.shippingAmount)}</p>

                    {order.discountAmount > 0 && (
                      <p className="text-red-400">
                        Discount: -{formatCurrency(order.discountAmount)}
                      </p>
                    )}

                    <p className="text-cyan-400 font-semibold">
                      Total: {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>

              </div>

              {/* PENDING SHIPMENT */}
              {order.unshippedItems?.length > 0 && (
                <div className="p-4 border-t border-slate-700">
                  <h4 className="text-sm text-orange-400 mb-2">
                    Pending Shipment
                  </h4>

                  {order.unshippedItems.map((item) => (
                    <p key={item.orderItemId} className="text-xs text-slate-400">
                      {item.productName} ({item.unshippedQuantity})
                    </p>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
{/* ✅ Customer Details Modal */}
{isModalOpen && selectedCustomer && (
  
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-[80vw] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-500/10">
      
      {/* Modal Header */}
      <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
              {getInitials(selectedCustomer.firstName, selectedCustomer.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{selectedCustomer.fullName}</h2>
           {modalTier === "loading" ? (
  <span className="text-xs text-slate-500">Loading...</span>
) : (
  getTierBadge(modalTier)
)}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">{selectedCustomer.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(false);
              setSelectedCustomer(null);
              setExpandedOrderId(null);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="overflow-y-auto p-4 space-y-4">
        
        {/* ✅ Customer Metrics Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-white">{selectedCustomer.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Spent</p>
                <p className="text-xl font-bold text-white">{formatCurrency(selectedCustomer.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Avg Order Value</p>
                <p className="text-xl font-bold text-white">
                  £{selectedCustomer.totalOrders > 0 
                    ? (selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Status</p>
                <p className="text-lg font-bold text-white capitalize">
                  {selectedCustomer.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ HORIZONTAL TIMELINE - NEW VERSION */}
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Customer Timeline
          </h3>
          
          {/* Horizontal Timeline Container */}
          <div className="relative">
            {/* Timeline Line (Connecting Line) */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-green-500 to-yellow-500"></div>
            
            {/* Timeline Nodes */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Node 1: Registered */}
              <div className="relative">
                <div className="relative z-10 flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
                    <UserPlus className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-cyan-500/30 hover:border-cyan-500/60 transition-all">
                  <p className="text-sm text-cyan-400 font-semibold mb-1">Registered</p>
                  <p className="text-xs text-white font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.floor((new Date().getTime() - new Date(selectedCustomer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
              </div>

              {/* Node 2: First Order */}
              <div className="relative">
                <div className="relative z-10 flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform ${
                    selectedCustomer.orders.length > 0
                      ? "bg-green-500/20 border-green-500"
                      : "bg-slate-700/20 border-slate-600"
                  }`}>
                    <ShoppingCart className={`h-5 w-5 ${
                      selectedCustomer.orders.length > 0 ? "text-green-400" : "text-slate-500"
                    }`} />
                  </div>
                </div>
                <div className={`bg-slate-900/50 rounded-lg p-3 border hover:border-green-500/60 transition-all ${
                  selectedCustomer.orders.length > 0
                    ? "border-green-500/30"
                    : "border-slate-700/30"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    selectedCustomer.orders.length > 0 ? "text-green-400" : "text-slate-500"
                  }`}>
                    First Order
                  </p>
                  {selectedCustomer.orders.length > 0 ? (
                    <>
                      <p className="text-xs text-white font-medium">
                        {formatDate(selectedCustomer.orders[selectedCustomer.orders.length - 1].orderDate)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {selectedCustomer.orders[selectedCustomer.orders.length - 1].orderNumber}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">No orders yet</p>
                  )}
                </div>
              </div>

              {/* Node 3: Latest Order */}
              <div className="relative">
                <div className="relative z-10 flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform ${
                    selectedCustomer.orders.length > 0
                      ? "bg-violet-500/20 border-violet-500"
                      : "bg-slate-700/20 border-slate-600"
                  }`}>
                    <Package className={`h-5 w-5 ${
                      selectedCustomer.orders.length > 0 ? "text-violet-400" : "text-slate-500"
                    }`} />
                  </div>
                </div>
                <div className={`bg-slate-900/50 rounded-lg p-3 border hover:border-violet-500/60 transition-all ${
                  selectedCustomer.orders.length > 0
                    ? "border-violet-500/30"
                    : "border-slate-700/30"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    selectedCustomer.orders.length > 0 ? "text-violet-400" : "text-slate-500"
                  }`}>
                    Latest Order
                  </p>
                  {selectedCustomer.orders.length > 0 ? (
                    <>
                      <p className="text-xs text-white font-medium">
                        {formatDate(selectedCustomer.orders[0].orderDate)}
                      </p>
                      <p className="text-xs text-cyan-400 font-semibold mt-1">
                        {formatCurrency(selectedCustomer.orders[0].totalAmount)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">No orders yet</p>
                  )}
                </div>
              </div>

              {/* Node 4: Last Login */}
              <div className="relative">
                <div className="relative z-10 flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform ${
                    selectedCustomer.lastLoginAt
                      ? "bg-yellow-500/20 border-yellow-500"
                      : "bg-slate-700/20 border-slate-600"
                  }`}>
                    <LogIn className={`h-5 w-5 ${
                      selectedCustomer.lastLoginAt ? "text-yellow-400" : "text-slate-500"
                    }`} />
                  </div>
                </div>
                <div className={`bg-slate-900/50 rounded-lg p-3 border hover:border-yellow-500/60 transition-all ${
                  selectedCustomer.lastLoginAt
                    ? "border-yellow-500/30"
                    : "border-slate-700/30"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    selectedCustomer.lastLoginAt ? "text-yellow-400" : "text-slate-500"
                  }`}>
                    Last Login
                  </p>
                  {selectedCustomer.lastLoginAt ? (
                    <>
                      <p className="text-xs text-white font-medium">
                        {formatExactDate(selectedCustomer.lastLoginAt)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatRelativeDate(selectedCustomer.lastLoginAt)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Never logged in</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner - Dormant Customer */}
          {selectedCustomer.orders.length > 0 && (() => {
            const daysSinceLastOrder = Math.floor(
              (new Date().getTime() - new Date(selectedCustomer.orders[0].orderDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceLastOrder > 90 ? (
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-orange-400 font-semibold">⚠️ Dormant Customer Alert</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    No orders in <span className="font-semibold text-white">{daysSinceLastOrder} days</span> • Consider sending a re-engagement campaign
                  </p>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* ✅ Personal Information */}
        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-violet-400" />
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="text-slate-400 min-w-[80px]">Email:</span>
              <span className="text-white font-medium truncate">{selectedCustomer.email}</span>
            </div>

            {selectedCustomer.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="text-slate-400 min-w-[80px]">Phone:</span>
                <span className="text-white font-medium">{selectedCustomer.phoneNumber}</span>
              </div>
            )}

            {selectedCustomer.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="text-slate-400 min-w-[80px]">DOB:</span>
                <span className="text-white font-medium">{formatDate(selectedCustomer.dateOfBirth)}</span>
              </div>
            )}

            {selectedCustomer.gender && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="text-slate-400 min-w-[80px]">Gender:</span>
                <span className="text-white font-medium capitalize">{selectedCustomer.gender}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="text-slate-400 min-w-[80px]">Joined:</span>
              <span className="text-white font-medium">{formatDate(selectedCustomer.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="text-slate-400 min-w-[80px]">Last Active:</span>
              <span className="text-white font-medium">
                {selectedCustomer.lastLoginAt ? formatRelativeDate(selectedCustomer.lastLoginAt) : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Saved Addresses */}
        {selectedCustomer.addresses.length > 0 && (
          <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-pink-400" />
              Saved Addresses ({selectedCustomer.addresses.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedCustomer.addresses.map((address, index) => (
                <div key={index} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-white">
                        {address.firstName} {address.lastName}
                      </p>
                      {address.company && (
                        <p className="text-xs text-slate-400 mt-0.5">{address.company}</p>
                      )}
                      <p className="text-xs text-slate-300 mt-1">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-xs text-slate-300">{address.addressLine2}</p>
                      )}
                      <p className="text-xs text-slate-300">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-xs text-slate-300">{address.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       
      </div>
    </div>
  </div>
)}

      {/* Modals - Keep as is (Order Modal, Customer Modal, Confirm Dialog) */}
      {/* ... (Order Modal, Customer Modal, Confirm Dialog code remains same as before) ... */}

      <ConfirmDialog
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => toggleConfirm && handleToggleStatus(toggleConfirm)}
        title={toggleConfirm?.isActive ? "Deactivate Customer" : "Activate Customer"}
        message={`Are you sure you want to ${toggleConfirm?.isActive ? "deactivate" : "activate"} "${toggleConfirm?.fullName}"?`}
        confirmText={toggleConfirm?.isActive ? "Deactivate" : "Activate"}
        isLoading={isToggling}
        icon={toggleConfirm?.isActive ? Ban : CheckCircle}
        iconColor={toggleConfirm?.isActive ? "text-red-400" : "text-green-400"}
      />
    </div>
  );
}