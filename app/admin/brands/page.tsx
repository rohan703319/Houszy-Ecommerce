"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Tag, Eye, CheckCircle, Filter, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, Package, FolderTree, Copy, Loader2, HelpCircle } from "lucide-react";
import { useMemo, useCallback } from "react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { Brand, brandsService, BrandStats } from "@/lib/services/brands";
import { useRouter } from "next/navigation";
import BrandModals from "./BrandModals";
import { formatDate, getImageUrl } from "../_utils/formatUtils";

export default function BrandsPage() {
  const toast = useToast();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // ✅ UPDATED FILTERS - Using "all" | "true" | "false"
  const [initialTab, setInitialTab] = useState<'basic' | 'image' | 'seo' | 'settings' | 'faqs'>('basic');
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [deletedFilter, setDeletedFilter] = useState<string>("all");
  const [homepageFilter, setHomepageFilter] = useState<string>("all");
const [activeTab, setActiveTab] = useState<'basic' | 'image' | 'seo' | 'settings' | 'faqs'>('basic');
const [stats, setStats] = useState<BrandStats>({
  totalBrands: 0,

  totalPublished: 0,
  totalUnpublished: 0,

  totalActive: 0,
  totalInactive: 0,

  totalShowOnHomepage: 0,

  totalProducts: 0 // optional
});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
const [statusConfirm, setStatusConfirm] = useState<{
  id: string;
  name: string;
  currentStatus: boolean;
} | null>(null);
useEffect(() => {
  if (!searchTerm.trim()) {
    setDebouncedSearch("");
    setIsSearching(false);
    return;
  }

  setIsSearching(true);

  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
    setIsSearching(false);
  }, 400);

  return () => clearTimeout(timer);
}, [searchTerm]);
const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState<{
    id: string;
    name: string;
    isDeleted: boolean;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const openBrandActionModal = (brand: {
    id: string;
    name: string;
    isDeleted: boolean;
  }) => {
    setSelectedBrand({
      id: brand.id,
      name: brand.name,
      isDeleted: brand.isDeleted,
    });
  };

useEffect(() => {
  if (showModal && initialTab) {
    setActiveTab(initialTab);
  }
}, [initialTab, showModal]);
const handleStatusUpdate = async () => {
  if (!statusConfirm) return;

  setIsUpdatingStatus(true);

  try {
    // 🔎 Find full brand object from list
    const brand = brands.find(b => b.id === statusConfirm.id);

    if (!brand) {
      toast.error("Brand not found");
      return;
    }

    // 🛡 Build FULL payload (IMPORTANT)
    const payload = {
      id: brand.id, // ⚠ required to avoid ID mismatch
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logoUrl,
      isPublished: brand.isPublished,
      isActive: !brand.isActive, // ✅ only this changes
      showOnHomepage: brand.showOnHomepage,
      displayOrder: brand.displayOrder,
      metaTitle: brand.metaTitle || undefined,
      metaDescription: brand.metaDescription || undefined,
      metaKeywords: brand.metaKeywords || undefined,
    };

    await brandsService.update(brand.id, payload);

    toast.success(
      `Brand ${
        brand.isActive ? "deactivated" : "activated"
      } successfully`
    );

    await fetchBrands();

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to update status"
    );
  } finally {
    setIsUpdatingStatus(false);
    setStatusConfirm(null);
  }
};





  const handleConfirmBrandAction = async () => {
    if (!selectedBrand) return;

    setIsProcessing(true);

    try {
      if (selectedBrand.isDeleted) {
        await brandsService.restore(selectedBrand.id);
        toast.success('Brand restored successfully!');
      } else {
        await brandsService.delete(selectedBrand.id);
        toast.success('Brand deleted successfully!');
      }

      await fetchBrands();
    } catch (error: any) {
      console.error('Brand action error:', error);
      toast.error(
        selectedBrand.isDeleted
          ? 'Failed to restore brand'
          : 'Failed to delete brand'
      );
    } finally {
      setIsProcessing(false);
      setSelectedBrand(null);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [publishedFilter, activeFilter, deletedFilter,homepageFilter]); // ✅ Re-fetch when filters change

  
  // ✅ MODIFIED fetchBrands with API parameters
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const params: any = {};

      // ✅ Add API parameters based on filters
      if (publishedFilter !== "all") {
        params.includeUnpublished = publishedFilter === "false"; // true means include unpublished
      } else {
        params.includeUnpublished = true; // Show all
      }

      if (activeFilter !== "all") {
        params.isActive = activeFilter === "true";
      }

      if (deletedFilter !== "all") {
        params.isDeleted = deletedFilter === "true";
      }

      const response = await brandsService.getAll({ params });
      // ✅ SHOW BACKEND/API ERROR
if (response.error) {
  toast.error(response.error);
  setBrands([]);
  return;
}

const brandsData = response.data?.data?.items || [];
const statsData = response.data?.data?.stats;

      const sortedBrands = brandsData.sort((a: any, b: any) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
if (statsData) {
  setStats(statsData);
}
     setBrands(brandsData);
   
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

const handleEdit = (
  brand: Brand,
  tab: 'basic' | 'image' | 'seo' | 'settings' | 'faqs' = 'basic'
) => {
  setEditingBrand(brand);

  // 🔥 FORCE correct order
  setInitialTab(tab);

  // delay modal open
  setTimeout(() => {
    setShowModal(true);
  }, 0);
};


  const resetForm = () => {
    setEditingBrand(null);
  };

  const clearFilters = () => {
    setPublishedFilter("all");
    setActiveFilter("all");
    setDeletedFilter("all");
    setHomepageFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    publishedFilter !== "all" || 
    activeFilter !== "all" || 
    deletedFilter !== "all" || 
    homepageFilter !== "all" || 
    searchTerm.trim() !== "";

  // ✅ CLIENT-SIDE FILTERING (for search and homepage only)
const filteredBrands = useMemo(() => {
  return brands.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      brand.description.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesHomepage =
      homepageFilter === "all" ||
      (homepageFilter === "true" && brand.showOnHomepage) ||
      (homepageFilter === "false" && !brand.showOnHomepage);

    return matchesSearch && matchesHomepage;
  });
}, [brands, debouncedSearch, homepageFilter]);
const paginationData = useMemo(() => {
  const totalItems = filteredBrands.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentData = filteredBrands.slice(startIndex, endIndex);

  return {
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    currentData,
  };
}, [filteredBrands, currentPage, itemsPerPage]);
const { totalItems, totalPages, startIndex, endIndex, currentData } = paginationData;
const goToPage = useCallback((page: number) => {
  setCurrentPage((prev) => Math.max(1, Math.min(page, totalPages)));
}, [totalPages]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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
}, [debouncedSearch, homepageFilter]);

  return (
    <div className="space-y-2">
      {/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

  {/* LEFT */}
  <div>
    <h1 className="text-2xl font-semibold text-white">
      Brand Management
    </h1>
    <p className="text-[12px] text-slate-300">
      Manage your product brands
    </p>
  </div>

  {/* RIGHT BUTTONS */}
  <div className="flex flex-wrap items-center gap-2">

    {/* Categories */}
    <button
      title="Go to Categories page"
      onClick={() => router.push('/admin/categories')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-md text-[12px] hover:text-white hover:border-violet-500/40 transition-all"
    >
      <FolderTree className="h-3.5 w-3.5" />
      Go to Categories Page
    </button>

    {/* Products */}
    <button
      title="Go to Products page"
      onClick={() => router.push('/admin/products')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-md text-[12px] hover:text-white hover:border-cyan-500/40 transition-all"
    >
      <Package className="h-3.5 w-3.5" />
      Go to Product Page
    </button>

    {/* Add Brand */}
    <button
      title="Create a new brand"
      onClick={() => {
        resetForm();
        setShowModal(true);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[12px] transition-all"
    >
      <Plus className="h-3.5 w-3.5" />
      Add Brand
    </button>

  </div>
</div>

  
 {/* Stats Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">

  {/* Total */}
  <button
    type="button"
    onClick={clearFilters}
    className={`rounded-lg p-2.5 text-left border transition-all ${
      publishedFilter === "all" &&
      activeFilter === "all" &&
      deletedFilter === "all" &&
      homepageFilter === "all" &&
      searchTerm.trim() === ""
        ? "bg-slate-800/70 border-violet-500/50 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/10"
        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/50"
    }`}
  >
    <p className="text-[11px] text-slate-500">Total</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalBrands}
    </p>
  </button>

  {/* Published */}
  <button
    type="button"
    onClick={() =>
      setPublishedFilter(
        publishedFilter === "true" ? "all" : "true"
      )
    }
    className={`rounded-lg p-2.5 text-left border transition-all ${
      publishedFilter === "true"
        ? "bg-green-500/20 border-green-400 ring-2 ring-green-500/40 shadow-lg shadow-green-500/10"
        : "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
    }`}
  >
    <p className="text-[11px] text-green-400">Published</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalPublished}
    </p>
  </button>

  {/* Unpublished */}
  <button
    type="button"
    onClick={() =>
      setPublishedFilter(
        publishedFilter === "false" ? "all" : "false"
      )
    }
    className={`rounded-lg p-2.5 text-left border transition-all ${
      publishedFilter === "false"
        ? "bg-slate-400/20 border-slate-300 ring-2 ring-slate-400/40 shadow-lg shadow-slate-500/10"
        : "bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/15"
    }`}
  >
    <p className="text-[11px] text-slate-400">Unpublished</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalUnpublished}
    </p>
  </button>

  {/* Active */}
  <button
    type="button"
    onClick={() =>
      setActiveFilter(
        activeFilter === "true" ? "all" : "true"
      )
    }
    className={`rounded-lg p-2.5 text-left border transition-all ${
      activeFilter === "true"
        ? "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
        : "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
    }`}
  >
    <p className="text-[11px] text-green-400">Active</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalActive}
    </p>
  </button>

  {/* Inactive */}
  <button
    type="button"
    onClick={() =>
      setActiveFilter(
        activeFilter === "false" ? "all" : "false"
      )
    }
    className={`rounded-lg p-2.5 text-left border transition-all ${
      activeFilter === "false"
        ? "bg-red-500/20 border-red-400 ring-2 ring-red-500/40 shadow-lg shadow-red-500/10"
        : "bg-red-500/10 border-red-500/20 hover:bg-red-500/15"
    }`}
  >
    <p className="text-[11px] text-red-400">Inactive</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalInactive}
    </p>
  </button>

  {/* Homepage */}
  <button
    type="button"
    onClick={() =>
      setHomepageFilter(
        homepageFilter === "true" ? "all" : "true"
      )
    }
    className={`rounded-lg p-2.5 text-left border transition-all ${
      homepageFilter === "true"
        ? "bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10"
        : "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/15"
    }`}
  >
    <p className="text-[11px] text-cyan-400">Homepage</p>
    <p className="text-lg font-semibold text-white">
      {stats.totalShowOnHomepage}
    </p>
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
      <span className="text-white font-medium">{startIndex + 1}</span>
      {" – "}
      <span className="text-white font-medium">{Math.min(endIndex, totalItems)}</span>
      {" of "}
      <span className="text-white font-medium">{totalItems}</span>
    </div>

  </div>
</div>


{/* Search + Filters */}
<div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">

  <div className="flex flex-wrap items-center gap-2">

    {/* Search */}
    <div className="relative flex-1 min-w-[220px]">
   <div className="relative flex-1 min-w-[220px]">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />

  <input
    type="search"
    placeholder="Search brands..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-8 pr-8 py-1.5 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[12px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
  />

  {isSearching && (
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
    </div>
  )}
</div>
    </div>

    {/* Filters */}
    <div className="flex items-center gap-2 flex-wrap">

      {/* Published */}
      <select
        value={publishedFilter}
        onChange={(e) => setPublishedFilter(e.target.value)}
        className={`p-2 bg-slate-800/90 border rounded-md text-white text-[11px] ${
          publishedFilter !== "all"
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700"
        }`}
      >
        <option value="all">Published</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>

      {/* Status */}
      <select
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
          activeFilter !== "all"
            ? "border-green-500 bg-green-500/10"
            : "border-slate-700"
        }`}
      >
        <option value="all">Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      {/* Homepage */}
      <select
        value={homepageFilter}
        onChange={(e) => setHomepageFilter(e.target.value)}
        className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
          homepageFilter !== "all"
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-slate-700"
        }`}
      >
        <option value="all">Homepage</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>

      {/* Deleted */}
      <select
        value={deletedFilter}
        onChange={(e) => setDeletedFilter(e.target.value)}
        className={`p-2 bg-slate-800/90 border rounded-md text-white text-[11px] ${
          deletedFilter !== "all"
            ? "border-red-500 bg-red-500/10"
            : "border-slate-700"
        }`}
      >
        <option value="all">Records</option>
        <option value="false">Live</option>
        <option value="true">Deleted</option>
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="p-2  text-[11px] bg-red-500/10 border border-red-500/40 text-red-400 rounded-md hover:bg-red-500/20 flex items-center gap-1"
        >
          <FilterX className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>

    {/* Count */}
    <div className="ml-auto text-[11px] text-slate-500">
      <span className="text-white font-medium">{totalItems}</span> brands
    </div>

  </div>
</div>
      {/* Brands Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
{loading ? (
  <div className="text-center py-12">
    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
    <p className="text-slate-400 text-sm">Loading brands...</p>
  </div>
) : currentData.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No brands found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Brand</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Products</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Published</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Status</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Homepage</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Deleted</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Display Order</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Updated</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Updated By</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((brand) => {
                  const isBusy = isProcessing && selectedBrand?.id === brand.id;

                  return (
                    <tr
                      key={brand.id}
                      className={`border-b border-slate-800 transition-colors
                        ${brand.isDeleted ? 'opacity-60 grayscale bg-red-500/5' : 'hover:bg-slate-800/30'}
                        ${isBusy ? 'pointer-events-none' : ''}
                      `}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {brand.logoUrl ? (
                            <img
                              src={getImageUrl(brand.logoUrl)}
                              alt={brand.name}
                              className="w-9 h-9 rounded-md border border-slate-700 object-cover cursor-pointer"
                              onClick={() => setSelectedImageUrl(getImageUrl(brand.logoUrl))}
                               onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-white" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p
                              className="text-white font-medium truncate cursor-pointer hover:text-violet-400"
                              onClick={() => setViewingBrand(brand)}
                              title={brand.name}
                            >
                              {brand.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {brand.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-xs font-medium">
                          {brand.productCount}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            brand.isPublished
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {brand.isPublished ? 'Yes' : 'No'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                  <button
  onClick={() =>
    setStatusConfirm({
      id: brand.id,
      name: brand.name,
      currentStatus: brand.isActive,
    })
  }
  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
    brand.isActive
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
  }`}
>
  {brand.isActive ? "Active" : "Inactive"}
</button>

                      </td>

                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            brand.showOnHomepage
                              ? 'bg-violet-500/10 text-violet-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {brand.showOnHomepage ? 'Yes' : 'No'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            brand.isDeleted
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-green-500/10 text-green-400'
                          }`}
                        >
                          {brand.isDeleted ? 'Yes' : 'No'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center text-slate-300">
                        {brand.displayOrder}
                      </td>

                      <td className="py-2 px-3 text-slate-300 text-xs">
                          {formatDate(brand.updatedAt)}
                      </td>

                      <td className="py-2 px-3">
                        {brand.updatedBy ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center">
                              {brand.updatedBy.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className="text-xs truncate max-w-[100px] text-slate-300"
                              title={brand.updatedBy}
                            >
                              {brand.updatedBy}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingBrand(brand)}
                            className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-md"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
  onClick={() => handleEdit(brand, 'faqs')}
  className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-md"
  title="Manage FAQs"
>
  <HelpCircle className="h-4 w-4" />
</button>

                          <button
                            onClick={() => handleEdit(brand)}
                            className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-md"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() =>
                              openBrandActionModal({
                                id: brand.id,
                                name: brand.name,
                                isDeleted: brand.isDeleted,
                              })
                            }
                            className={`p-1.5 rounded-md transition-all ${
                              brand.isDeleted
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-red-400 hover:bg-red-500/10'
                            }`}
                            title={
                              brand.isDeleted ? 'Restore Brand' : 'Delete Brand'
                            }
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : brand.isDeleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
                        ? 'bg-violet-500 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

            <div className="text-sm text-slate-400">
              Total: {totalItems} items
            </div>
          </div>
        </div>
      )}

      {/* Reusable Modals Component */}
   <BrandModals
  initialTab={initialTab}
  showModal={showModal}
  setShowModal={setShowModal}
  editingBrand={editingBrand}
  setEditingBrand={setEditingBrand}
  viewingBrand={viewingBrand}
  setViewingBrand={setViewingBrand}
  selectedImageUrl={selectedImageUrl}
  setSelectedImageUrl={setSelectedImageUrl}
  brands={brands}
  fetchBrands={fetchBrands}
  getImageUrl={getImageUrl}
/>
<ConfirmDialog
  isOpen={!!statusConfirm}
  onClose={() => setStatusConfirm(null)}
  onConfirm={handleStatusUpdate}
  title={
    statusConfirm?.currentStatus
      ? "Deactivate Brand"
      : "Activate Brand"
  }
  message={`Are you sure you want to ${
    statusConfirm?.currentStatus ? "deactivate" : "activate"
  } "${statusConfirm?.name}"?`}
  confirmText={
    statusConfirm?.currentStatus ? "Deactivate" : "Activate"
  }
  cancelText="Cancel"
  icon={AlertCircle}
  iconColor={
    statusConfirm?.currentStatus
      ? "text-red-400"
      : "text-emerald-400"
  }
  confirmButtonStyle={
    statusConfirm?.currentStatus
      ? "bg-gradient-to-r from-red-500 to-rose-500"
      : "bg-gradient-to-r from-emerald-500 to-green-500"
  }
  isLoading={isUpdatingStatus}
/>

      {/* Brand Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        onConfirm={handleConfirmBrandAction}
        title={selectedBrand?.isDeleted ? 'Restore Brand' : 'Delete Brand'}
        message={
          selectedBrand?.isDeleted
            ? `Do you want to restore "${selectedBrand?.name}"?`
            : `Are you sure you want to delete "${selectedBrand?.name}"?`
        }
        confirmText={selectedBrand?.isDeleted ? 'Restore Brand' : 'Delete Brand'}
        cancelText="Cancel"
        icon={AlertCircle}
        iconColor={
          selectedBrand?.isDeleted ? 'text-emerald-400' : 'text-red-400'
        }
        confirmButtonStyle={
          selectedBrand?.isDeleted
            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
            : 'bg-gradient-to-r from-red-500 to-rose-500'
        }
        isLoading={isProcessing}
      />
    </div>
  );
}
