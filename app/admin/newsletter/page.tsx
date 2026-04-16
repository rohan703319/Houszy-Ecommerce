// app/(dashboard)/newsletter/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Mail, CheckCircle, XCircle, FilterX, ChevronLeft, ChevronRight, AlertCircle, Loader2, UserPlus, Download, ChevronDown, FileSpreadsheet, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { newsletterService, NewsletterSubscription, NewsletterStats } from "@/lib/services/newsletter";
import * as XLSX from 'xlsx';
import { formatDate } from "../_utils/formatUtils";
import { useDebounce } from "../_hooks/useDebounce";
export default function NewsletterPage() {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [stats, setStats] = useState<NewsletterStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    inactiveSubscriptions: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [subscribeConfirm, setSubscribeConfirm] = useState<string | null>(null);
  const [unsubscribeConfirm, setUnsubscribeConfirm] = useState<string | null>(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  
  // Refs to track initial load and prevent double fetching
  const isInitialMount = useRef(true);
  const isFetching = useRef(false);

  // Fetch ALL subscriptions ONCE on mount (for export functionality)
  const fetchAllSubscriptions = useCallback(async () => {
    try {
      const response = await newsletterService.getSubscriptions({
        page: 1,
        pageSize: 1000,
      });
      const data = response.data?.data;
      
      if (data && data.items) {
        setAllSubscriptions(data.items);
      }
    } catch (error) {
      console.error("Error fetching all subscriptions:", error);
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await newsletterService.getStats();
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch subscriptions with server-side pagination
  const fetchSubscriptions = useCallback(async (showFullLoader = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      
      if (showFullLoader) {
        setPageLoading(true);
      } else {
        setTableLoading(true);
      }

      const params: any = {
        page: currentPage,
        pageSize: itemsPerPage,
      };

      if (activeFilter === "active") params.isActive = true;
      if (activeFilter === "inactive") params.isActive = false;
      if (debouncedSearch.trim()) params.searchEmail = debouncedSearch.trim();

      const response = await newsletterService.getSubscriptions(params);
      const data = response.data?.data;

      if (data && data.items) {
        setSubscriptions(data.items);
        setTotalItems(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setSubscriptions([]);
        setTotalItems(0);
        setTotalPages(0);
      }

    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
      setSubscriptions([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setPageLoading(false);
      setTableLoading(false);
      isFetching.current = false;
    }
  }, [currentPage, itemsPerPage, activeFilter, debouncedSearch, toast]);

  // Initial load - fetch all data once
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchStats(), fetchAllSubscriptions()]);
      await fetchSubscriptions(true);
    };
    init();
  }, []); // Empty dependency array - run once on mount

  // Fetch when dependencies change (except on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchSubscriptions(false);
    }
  }, [currentPage, itemsPerPage, activeFilter, debouncedSearch]);

  // Reset to page 1 when filters change (without fetching)
  useEffect(() => {
    if (!isInitialMount.current && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, activeFilter]);

  const toggleSelectAll = useCallback(() => {
    setSelectedSubscriptions(prev =>
      prev.length === subscriptions.length && subscriptions.length > 0
        ? []
        : subscriptions.map(s => s.id)
    );
  }, [subscriptions]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedSubscriptions(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }, []);

  const handleConfirmSubscribe = useCallback(() => {
    if (subscribeConfirm) handleSubscribe(subscribeConfirm);
  }, [subscribeConfirm]);

  const handleConfirmUnsubscribe = useCallback(() => {
    if (unsubscribeConfirm) handleUnsubscribe(unsubscribeConfirm);
  }, [unsubscribeConfirm]);

  const handleCloseSubscribe = useCallback(() => {
    setSubscribeConfirm(null);
  }, []);

  const handleCloseUnsubscribe = useCallback(() => {
    setUnsubscribeConfirm(null);
  }, []);

  const handleExportSelected = useCallback(() => {
    try {
      const selectedData = allSubscriptions.filter(sub =>
        selectedSubscriptions.includes(sub.id)
      );

      if (selectedData.length === 0) {
        toast.error("No subscriptions selected");
        return;
      }

      const excelData = selectedData.map((sub, index) => ({
        "S.No": index + 1,
        "Email": sub.email,
        "Status": sub.isActive ? "Active" : "Inactive",
        "Source": sub.source,
        "Subscribed At": new Date(sub.subscribedAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Selected");

      XLSX.writeFile(workbook, `Selected_Subscriptions.xlsx`);

      toast.success(`Exported ${selectedData.length} selected subscriptions`);
      setSelectedSubscriptions([]);
    } catch {
      toast.error("Export failed");
    }
  }, [allSubscriptions, selectedSubscriptions, toast]);

  const handleExport = useCallback((exportAll: boolean) => {
    try {
      let dataToExport = exportAll ? allSubscriptions : [];

      if (!exportAll) {
        dataToExport = allSubscriptions.filter(sub => {
          const matchesSearch = debouncedSearch.trim() 
            ? sub.email.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
          
          const matchesActive = activeFilter === "all" 
            ? true 
            : activeFilter === "active" 
              ? sub.isActive 
              : !sub.isActive;

          return matchesSearch && matchesActive;
        });
      }

      if (dataToExport.length === 0) {
        toast.error("No data to export");
        return;
      }

      const excelData = dataToExport.map((sub, index) => ({
        "S.No": index + 1,
        "Email": sub.email,
        "Status": sub.isActive ? "Active" : "Inactive",
        "Source": sub.source,
        "Subscribed At": new Date(sub.subscribedAt).toLocaleString(),
        "Created At": new Date(sub.createdAt).toLocaleString(),
        "ID": sub.id,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 35 }, // Email
        { wch: 10 }, // Status
        { wch: 12 }, // Source
        { wch: 20 }, // Subscribed At
        { wch: 20 }, // Created At
        { wch: 38 }, // ID
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Newsletter Subscriptions");

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Newsletter_Subscriptions_${exportAll ? 'All' : 'Filtered'}_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success(`✅ Exported ${dataToExport.length} subscriptions to Excel!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data");
    }
  }, [allSubscriptions, debouncedSearch, activeFilter, toast]);

  const handleSubscribe = useCallback(async (email: string) => {
    setIsSubscribing(true);
    try {
      const response = await newsletterService.subscribe(email);
      if (response.data?.success) {
        toast.success("User subscribed successfully! ✅");
        await Promise.all([fetchSubscriptions(false), fetchStats(), fetchAllSubscriptions()]);
      } else {
        toast.error(response.data?.message || "Failed to subscribe");
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast.error(error?.response?.data?.message || "Failed to subscribe user");
    } finally {
      setIsSubscribing(false);
      setSubscribeConfirm(null);
    }
  }, [toast, fetchSubscriptions, fetchStats, fetchAllSubscriptions]);

  const handleUnsubscribe = useCallback(async (email: string) => {
    setIsUnsubscribing(true);
    try {
      const response = await newsletterService.unsubscribe(email);
      if (response.data?.success) {
        toast.success("User unsubscribed successfully! 🗑️");
        await Promise.all([fetchSubscriptions(false), fetchStats(), fetchAllSubscriptions()]);
      } else {
        toast.error(response.data?.message || "Failed to unsubscribe");
      }
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      toast.error(error?.response?.data?.message || "Failed to unsubscribe user");
    } finally {
      setIsUnsubscribing(false);
      setUnsubscribeConfirm(null);
    }
  }, [toast, fetchSubscriptions, fetchStats, fetchAllSubscriptions]);

  const clearFilters = useCallback(() => {
    setActiveFilter("all");
    setSearchInput("");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = activeFilter !== "all" || debouncedSearch.trim() !== "";

  const filteredCount = useMemo(() => {
    if (!debouncedSearch && activeFilter === "all") {
      return allSubscriptions.length;
    }

    return allSubscriptions.filter(sub => {
      const matchesSearch = debouncedSearch
        ? sub.email.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true;

      const matchesActive = activeFilter === "all"
        ? true
        : activeFilter === "active"
        ? sub.isActive
        : !sub.isActive;

      return matchesSearch && matchesActive;
    }).length;
  }, [allSubscriptions, debouncedSearch, activeFilter]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + subscriptions.length;

  if (pageLoading) {
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
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Newsletter Management
          </h1>
          <p className="text-[11px] text-slate-500">
            Manage subscriptions
          </p>
        </div>

        {/* Export */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-3 py-1.5 text-[11px] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md flex items-center gap-1.5 hover:opacity-90"
          >
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    handleExport(false);
                    setShowExportMenu(false);
                  }}
                  disabled={filteredCount === 0}
                  className="w-full px-3 py-2 text-left text-[12px] text-white hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
                  Filtered ({filteredCount})
                </button>

                <button
                  onClick={() => {
                    handleExport(true);
                    setShowExportMenu(false);
                  }}
                  disabled={allSubscriptions.length === 0}
                  className="w-full px-3 py-2 text-left text-[12px] text-white hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  All ({allSubscriptions.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

  {/* TOTAL */}
  <div
    onClick={() => {
      setActiveFilter("all");
      setCurrentPage(1);
    }}
    className={`cursor-pointer bg-slate-900/40 border rounded-lg p-2.5 transition ${
      activeFilter === "all"
        ? "border-violet-500 ring-1 ring-violet-500/40"
        : "border-slate-800 hover:border-slate-600"
    }`}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-violet-500/10 rounded-md flex items-center justify-center">
        <Mail className="h-4 w-4 text-violet-400" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500">Total</p>
        <p className="text-lg font-semibold text-white">
          {stats.totalSubscriptions}
        </p>
      </div>
    </div>
  </div>

  {/* ACTIVE */}
  <div
    onClick={() => {
      setActiveFilter("active");
      setCurrentPage(1);
    }}
    className={`cursor-pointer bg-slate-900/40 border rounded-lg p-2.5 transition ${
      activeFilter === "active"
        ? "border-green-500 ring-1 ring-green-500/40"
        : "border-slate-800 hover:border-slate-600"
    }`}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-green-500/10 rounded-md flex items-center justify-center">
        <CheckCircle className="h-4 w-4 text-green-400" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500">Active</p>
        <p className="text-lg font-semibold text-white">
          {stats.activeSubscriptions}
        </p>
      </div>
    </div>
  </div>

  {/* INACTIVE */}
  <div
    onClick={() => {
      setActiveFilter("inactive");
      setCurrentPage(1);
    }}
    className={`cursor-pointer bg-slate-900/40 border rounded-lg p-2.5 transition ${
      activeFilter === "inactive"
        ? "border-red-500 ring-1 ring-red-500/40"
        : "border-slate-800 hover:border-slate-600"
    }`}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-red-500/10 rounded-md flex items-center justify-center">
        <XCircle className="h-4 w-4 text-red-400" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500">Inactive</p>
        <p className="text-lg font-semibold text-white">
          {stats.inactiveSubscriptions}
        </p>
      </div>
    </div>
  </div>

</div>

      {/* Items Per Page */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[11px]"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[11px] text-slate-500">per page</span>
          </div>

          <div className="text-[11px] text-slate-500">
            <span className="text-white font-medium">
              {totalItems > 0 ? startIndex + 1 : 0}
            </span>
            {" – "}
            <span className="text-white font-medium">
              {endIndex}
            </span>
            {" of "}
            <span className="text-white font-medium">
              {totalItems}
            </span>
          </div>
        </div>
      </div>
    

      {/* Search + Filters */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="search"
              placeholder="Search email..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[12px] placeholder:text-slate-500"
            />
            {tableLoading && debouncedSearch && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-violet-400" />
            )}
          </div>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className={`p-2 text-[11px] rounded-md border bg-slate-800/60 ${
              activeFilter !== "all"
                ? "border-blue-500 ring-1 ring-blue-500/40 text-white"
                : "border-slate-700 text-slate-300"
            }`}
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 text-[11px] bg-red-500/10 border border-red-500/40 text-red-400 rounded-md hover:bg-red-500/20 flex items-center gap-1"
            >
              <FilterX className="h-3 w-3" />
              Clear
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-500">
            {totalItems} subscriptions
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden relative min-h-[400px]">
        {tableLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
          </div>
        )}

        {subscriptions.length === 0 && !tableLoading ? (
          <div className="text-center py-10">
            <Mail className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/40">
                <tr className="border-b border-slate-800">
                  <th className="py-2 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        subscriptions.length > 0 &&
                        subscriptions.every(s => selectedSubscriptions.includes(s.id))
                      }
                      onChange={toggleSelectAll}
                      className="accent-violet-500"
                    />
                  </th>
                  <th className="text-left py-2 px-3 text-[11px] text-slate-400">Email</th>
                  <th className="text-center py-2 px-3 text-[11px] text-slate-400 w-20">Status</th>
                  <th className="text-left py-2 px-3 text-[11px] text-slate-400 w-24">Source</th>
                  <th className="text-left py-2 px-3 text-[11px] text-slate-400">Subscribed At</th>
                  <th className="text-left py-2 px-3 text-[11px] text-slate-400">Created On</th>
                  <th className="text-center py-2 px-3 text-[11px] text-slate-400 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className={`border-b border-slate-800 transition-colors ${
                      selectedSubscriptions.includes(subscription.id)
                        ? "bg-violet-500/10 ring-1 ring-violet-500/40"
                        : "hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.includes(subscription.id)}
                        onChange={() => toggleSelectOne(subscription.id)}
                        className="accent-violet-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="text-white text-[12px] truncate max-w-[300px]">
                          {subscription.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-medium ${
                          subscription.isActive
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {subscription.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-300 capitalize">
                      {subscription.source}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(subscription.subscribedAt)}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(subscription.createdAt)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {subscription.isActive ? (
                        <button
                          onClick={() => setUnsubscribeConfirm(subscription.email)}
                          className="px-2 py-1 text-[10px] bg-red-500/10 border border-red-500/40 text-red-400 rounded-md hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                          Unsubscribe
                        </button>
                      ) : (
                        <button
                          onClick={() => setSubscribeConfirm(subscription.email)}
                          className="px-2 py-1 text-[10px] bg-green-500/10 border border-green-500/40 text-green-400 rounded-md hover:bg-green-500/20 transition-colors whitespace-nowrap"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedSubscriptions.length > 0 && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
          <div className="flex justify-center px-2">
            <div className="pointer-events-auto mx-auto w-fit max-w-[95%] sm:max-w-[900px] rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                    <span className="font-semibold text-white">
                      {selectedSubscriptions.length}
                    </span>
                    <span className="text-slate-300">subscriptions selected</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Bulk actions: export selected subscriptions.
                  </p>
                </div>
                <div className="h-5 w-px bg-slate-700 hidden md:block" />
                <button
                  onClick={handleExportSelected}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Export ({selectedSubscriptions.length})
                </button>
                <button
                  onClick={() => setSelectedSubscriptions([])}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-3 w-3" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-3 w-3" />
              </button>
            </div>
            <span>{totalItems} items</span>
          </div>
        </div>
      )}

      {/* Subscribe/Reactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!subscribeConfirm}
        onClose={handleCloseSubscribe}
        onConfirm={handleConfirmSubscribe}
        title="Reactivate Subscription"
        message={`Are you sure you want to reactivate the subscription for ${subscribeConfirm}? They will start receiving newsletters again.`}
        confirmText="Reactivate"
        cancelText="Cancel"
        icon={UserPlus}
        iconColor="text-green-400"
        confirmButtonStyle="bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/50"
        isLoading={isSubscribing}
      />

      {/* Unsubscribe Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!unsubscribeConfirm}
        onClose={handleCloseUnsubscribe}
        onConfirm={handleConfirmUnsubscribe}
        title="Unsubscribe User"
        message={`Are you sure you want to unsubscribe "${unsubscribeConfirm}"? This action will mark them as inactive.`}
        confirmText="Unsubscribe"
        cancelText="Cancel"
        icon={AlertCircle}
        iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50"
        isLoading={isUnsubscribing}
      />
    </div>
  );
}