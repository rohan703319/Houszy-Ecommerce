"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Factory, Eye, Upload, X, Calendar, User, Package, EyeOff, Filter, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api-config";
import { ProductDescriptionEditor } from "../products/SelfHostedEditor";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiClient } from "@/lib/api";

interface Manufacturer {
  id: string;
  name: string;
  description: string;
  slug: string;
  logoUrl?: string;
  isPublished: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export default function ManufacturersPage() {
  const toast = useToast();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [viewingManufacturer, setViewingManufacturer] = useState<Manufacturer | null>(null);
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [homepageFilter, setHomepageFilter] = useState<string>("all");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Image delete confirmation state
  const [imageDeleteConfirm, setImageDeleteConfirm] = useState<{
    manufacturerId: string;
    imageUrl: string;
    manufacturerName: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    isPublished: true,
    showOnHomepage: false,
    displayOrder: 1,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: ""
  });

  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  // Extract filename from image URL
  const extractFilename = (imageUrl: string) => {
    if (!imageUrl) return "";
    // Extract filename from path like "/images/manufacturers/manufacturer-87960061.png"
    const parts = imageUrl.split('/');
    return parts[parts.length - 1];
  };

  // Delete image function
  const handleDeleteImage = async (manufacturerId: string, imageUrl: string) => {
    setIsDeletingImage(true);
    
    try {
      const filename = extractFilename(imageUrl);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/api/ImageManagement/manufacturer/${filename}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Image deleted successfully! 🗑️');
        
        // Update the manufacturer's logoUrl to empty
        setManufacturers(prev => 
          prev.map(manufacturer => 
            manufacturer.id === manufacturerId 
              ? { ...manufacturer, logoUrl: "" }
              : manufacturer
          )
        );
        
        // Update form data if currently editing this manufacturer
        if (editingManufacturer?.id === manufacturerId) {
          setFormData(prev => ({ ...prev, logoUrl: "" }));
        }
        
        // Update viewing manufacturer if it's the same one
        if (viewingManufacturer?.id === manufacturerId) {
          setViewingManufacturer(prev => 
            prev ? { ...prev, logoUrl: "" } : null
          );
        }
        
      } else if (response.status === 401) {
        toast.error('Please login again');
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeletingImage(false);
      setImageDeleteConfirm(null);
    }
  };

  // NEW - Logo upload handler with manufacturer name (same as brand page)
// ✅ FIXED: Updated handleLogoUpload with auto-delete old image
const handleLogoUpload = async (file: File) => {
  if (!formData.name.trim()) {
    toast.error("Please enter manufacturer name before uploading logo");
    return;
  }

  setUploadingLogo(true);
  
  // ✅ Store old image URL to delete after successful upload
  const oldLogoUrl = editingManufacturer?.logoUrl || "";

  try {
    const formDataToUpload = new FormData();
    formDataToUpload.append('logo', file);
    const token = localStorage.getItem('authToken');

    const response = await fetch(
      `${API_BASE_URL}/api/Manufacturers/upload-logo?name=${encodeURIComponent(formData.name)}`,
      {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formDataToUpload,
      }
    );

    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        // ✅ Update form data with new logo
        setFormData(prev => ({ ...prev, logoUrl: result.data }));
        
        // ✅ Delete old logo if exists and is different from new one
        if (oldLogoUrl && oldLogoUrl !== result.data) {
          try {
            const filename = extractFilename(oldLogoUrl);
            const deleteResponse = await fetch(`${API_BASE_URL}/api/ImageManagement/manufacturer/${filename}`, {
              method: 'DELETE',
              headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
                'Content-Type': 'application/json',
              },
            });
            
            if (deleteResponse.ok) {
              console.log('✅ Old logo deleted successfully');
            }
          } catch (error) {
            console.log('❌ Failed to delete old logo:', error);
            // Don't show error to user as new logo is uploaded successfully
          }
        }
        
        // ✅ Update list instantly with cache busting
        setManufacturers(prev => 
          prev.map(manufacturer => 
            manufacturer.id === editingManufacturer?.id 
              ? { ...manufacturer, logoUrl: `${result.data}?v=${Date.now()}` }
              : manufacturer
          )
        );
        
        toast.success("Logo uploaded successfully! ✅");
        
      } else {
        toast.error("Failed to get logo URL from response");
      }
    } else {
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to upload logo');
    }
  } catch (error) {
    console.error('Error uploading logo:', error);
    toast.error('Failed to upload logo');
  } finally {
    setUploadingLogo(false);
  }
};


  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{data: Manufacturer[]}>('/api/manufacturers?includeUnpublished=true');
      
      if (response.error) {
        toast.error(response.error);
        return { success: false, error: response.error };
      }
      
      setManufacturers(response.data?.data || []);
      return { success: true, data: response.data?.data };
      
    } catch (error) {
      toast.error('Network error occurred');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = editingManufacturer 
        ? `/api/manufacturers/${editingManufacturer.id}`
        : '/api/manufacturers';
        
      const requestData = {
        ...formData,
        ...(editingManufacturer && { id: editingManufacturer.id })
      };

      const response = editingManufacturer
        ? await apiClient.put(endpoint, requestData)
        : await apiClient.post(endpoint, requestData);

      if (response.error) {
        console.error('API Error:', response.error);
        toast.error(response.error);
        return;
      }

      // Success handling
      toast.success(editingManufacturer ? 'Updated successfully! ✅' : 'Created successfully! 🎉');
      await fetchManufacturers();
      setShowModal(false);
      resetForm();
      
    } catch (error) {
      // Network errors or unexpected errors
      console.error('Unexpected error:', error);
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setFormData({
      name: manufacturer.name,
      description: manufacturer.description,
      logoUrl: manufacturer.logoUrl || "",
      isPublished: manufacturer.isPublished,
      showOnHomepage: manufacturer.showOnHomepage,
      displayOrder: manufacturer.displayOrder,
      metaTitle: manufacturer.metaTitle || "",
      metaDescription: manufacturer.metaDescription || "",
      metaKeywords: manufacturer.metaKeywords || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_ENDPOINTS.manufacturers}/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        toast.success('Manufacturer deleted successfully! 🗑️');
        await fetchManufacturers();
      } else if (response.status === 401) {
        toast.error('Please login again');
      } else {
        toast.error('Failed to delete manufacturer');
      }
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      toast.error('Failed to delete manufacturer');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logoUrl: "",
      isPublished: true,
      showOnHomepage: false,
      displayOrder: 1,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: ""
    });
    setEditingManufacturer(null);
  };

  const clearFilters = () => {
    setPublishedFilter("all");
    setHomepageFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = publishedFilter !== "all" || homepageFilter !== "all" || searchTerm.trim() !== "";

  // Filter data
  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manufacturer.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPublished = publishedFilter === "all" || 
                            (publishedFilter === "published" && manufacturer.isPublished) ||
                            (publishedFilter === "unpublished" && !manufacturer.isPublished);
    
    const matchesHomepage = homepageFilter === "all" ||
                           (homepageFilter === "yes" && manufacturer.showOnHomepage) ||
                           (homepageFilter === "no" && !manufacturer.showOnHomepage);

    return matchesSearch && matchesPublished && matchesHomepage;
  });

  // Pagination calculations
  const totalItems = filteredManufacturers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredManufacturers.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, publishedFilter, homepageFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading manufacturers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Manufacturer Management
          </h1>
          <p className="text-slate-400 mt-1">Manage your product manufacturers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all flex items-center gap-2 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Manufacturer
        </button>
      </div>

      {/* Items Per Page Selector */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-400">entries per page</span>
          </div>
          
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="search"
              placeholder="Search manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            
            {/* Published Filter */}
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className={`px-3 py-3 bg-slate-800/50 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all min-w-32 ${
                publishedFilter !== "all" 
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50" 
                  : "border-slate-600"
              }`}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>

            {/* Homepage Filter */}
            <select
              value={homepageFilter}
              onChange={(e) => setHomepageFilter(e.target.value)}
              className={`px-3 py-3 bg-slate-800/50 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all min-w-36 ${
                homepageFilter !== "all" 
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50" 
                  : "border-slate-600"
              }`}
            >
              <option value="all">All Homepage</option>
              <option value="yes">On Homepage</option>
              <option value="no">Not on Homepage</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <FilterX className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-slate-400 whitespace-nowrap ml-auto">
            {totalItems} manufacturer{totalItems !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Manufacturers List */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
        {currentData.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No manufacturers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Manufacturer Name</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Products</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Homepage</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Order</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Created At</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Updated At</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Updated By</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((manufacturer) => (
                  <tr key={manufacturer.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {manufacturer.logoUrl ? (
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all"
                            onClick={() => setSelectedImageUrl(getImageUrl(manufacturer.logoUrl))}
                          >
                            <img
                              src={getImageUrl(manufacturer.logoUrl)}
                              alt={manufacturer.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center"><svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                            <Factory className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p
                            className="text-white font-medium cursor-pointer hover:text-violet-400 transition-colors"
                            onClick={() => setViewingManufacturer(manufacturer)}
                          >
                            {manufacturer.name}
                          </p>
                          <p className="text-xs text-slate-500">{manufacturer.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm font-medium">
                        {manufacturer.productCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        manufacturer.isPublished
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {manufacturer.isPublished ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        manufacturer.showOnHomepage
                          ? 'bg-violet-500/10 text-violet-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {manufacturer.showOnHomepage ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-300">{manufacturer.displayOrder}</td>
                    <td className="py-4 px-4 text-slate-300 text-sm">
                      {manufacturer.createdAt ? new Date(manufacturer.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-sm">
                      {manufacturer.updatedAt ? new Date(manufacturer.updatedAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-sm">
                      {manufacturer.updatedBy || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingManufacturer(manufacturer)}
                          className="p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(manufacturer)}
                          className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ 
                            id: manufacturer.id, 
                            name: manufacturer.name 
                          })}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Manufacturer"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
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

              {/* Next Page */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
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

      {/* Create/Edit Modal - UPDATED WITH BRAND-STYLE UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="p-2 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    {editingManufacturer ? 'Edit Manufacturer' : 'Create New Manufacturer'}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {editingManufacturer ? 'Update manufacturer information' : 'Add a new manufacturer to your store'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-2 space-y-2 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm">1</span>
                  <span>Basic Information</span>
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Manufacturer Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter manufacturer name"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                      {!formData.name && (
                        <p className="text-xs text-amber-400 mt-1">⚠️ Manufacturer name is required before uploading logo</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <ProductDescriptionEditor
                      label="Description"
                      value={formData.description}
                      onChange={(content) => setFormData(prev => ({ 
                        ...prev, 
                        description: content 
                      }))}
                      placeholder="Enter manufacturer description with rich formatting..."
                      height={300}
                      required={false}
                    />
                  </div>
                </div>
              </div>

              {/* UPDATED: Manufacturer Logo Section with Brand-Style Upload */}
              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-sm">2</span>
                  <span>Manufacturer Logo</span>
                </h3>
                <div className="space-y-2">
                  {/* Current Image Display - UPDATED WITH DELETE BUTTON */}
                  {formData.logoUrl && (
                    <div className="flex items-center gap-4 p-3 bg-slate-900/30 rounded-xl border border-slate-600">
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden border-2 border-violet-500/30 cursor-pointer hover:border-violet-500 transition-all"
                        onClick={() => setSelectedImageUrl(getImageUrl(formData.logoUrl))}
                      >
                        <img
                          src={getImageUrl(formData.logoUrl)}
                          alt="Current logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Current Logo</p>
                        <p className="text-xs text-slate-400">Click to view full size</p>
                      </div>
                      
                      {/* Update Logo Button */}
                      <label className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                        !formData.name || uploadingLogo
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                      }`}>
                        {uploadingLogo ? 'Uploading...' : 'Update Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!formData.name || uploadingLogo}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleLogoUpload(file);
                            }
                          }}
                        />
                      </label>
                      
                      {/* DELETE IMAGE BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          if (editingManufacturer) {
                            setImageDeleteConfirm({
                              manufacturerId: editingManufacturer.id,
                              imageUrl: formData.logoUrl,
                              manufacturerName: editingManufacturer.name
                            });
                          }
                        }}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium flex items-center gap-2"
                        title="Delete Image"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Image
                      </button>
                    </div>
                  )}

                  {/* Upload Area */}
                  {!formData.logoUrl && (
                    <div className="flex items-center justify-center w-full">
                      <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-all ${
                        !formData.name || uploadingLogo
                          ? 'border-slate-700 bg-slate-900/20 cursor-not-allowed'
                          : 'border-slate-600 bg-slate-900/30 hover:bg-slate-800/50 cursor-pointer group'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Upload className={`w-6 h-6 transition-colors ${
                            !formData.name || uploadingLogo
                              ? 'text-slate-600'
                              : 'text-slate-500 group-hover:text-violet-400'
                          }`} />
                          <div>
                            <p className={`text-sm ${
                              !formData.name || uploadingLogo
                                ? 'text-slate-600'
                                : 'text-slate-400'
                            }`}>
                              {uploadingLogo ? (
                                'Uploading logo...'
                              ) : !formData.name ? (
                                'Enter manufacturer name first to upload'
                              ) : (
                                <><span className="font-semibold">Click to upload</span> or drag and drop</>
                              )}
                            </p>
                            {formData.name && !uploadingLogo && (
                              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            )}
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!formData.name || uploadingLogo}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleLogoUpload(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* URL Input */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-800 text-slate-400">OR</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    placeholder="Paste logo URL"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm">3</span>
                  <span>SEO Information</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                      placeholder="Enter meta title for SEO"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Description</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                      placeholder="Enter meta description for SEO"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
                      placeholder="Enter keywords separated by commas"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-sm">4</span>
                  <span>Settings</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Manufacturer visibility</label>
                    <label className="flex items-center gap-3 p-3.5 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all group">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-slate-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">Published</p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Homepage display</label>
                    <label className="flex items-center gap-3 p-3.5 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-all group">
                      <input
                        type="checkbox"
                        checked={formData.showOnHomepage}
                        onChange={(e) => setFormData({...formData, showOnHomepage: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-600 text-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-slate-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">Show on Homepage</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingLogo}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 text-white rounded-xl hover:shadow-xl hover:shadow-violet-500/50 transition-all font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingManufacturer ? '✓ Update Manufacturer' : '+ Create Manufacturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal - UPDATED WITH DELETE BUTTON */}
      {viewingManufacturer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="p-2 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    Manufacturer Details
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">View manufacturer information</p>
                </div>
                <button
                  onClick={() => setViewingManufacturer(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-2 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-2">
                {/* Image Section - UPDATED WITH DELETE BUTTON */}
                {viewingManufacturer.logoUrl && (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-violet-500/20 cursor-pointer hover:border-violet-500/50 transition-all">
                        <img
                          src={getImageUrl(viewingManufacturer.logoUrl)}
                          alt={viewingManufacturer.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          onClick={() => setSelectedImageUrl(getImageUrl(viewingManufacturer.logoUrl))}
                        />
                      </div>
                      {/* DELETE IMAGE BUTTON IN VIEW MODAL */}
                      <button
                        onClick={() => {
                          setImageDeleteConfirm({
                            manufacturerId: viewingManufacturer.id,
                            imageUrl: viewingManufacturer.logoUrl!,
                            manufacturerName: viewingManufacturer.name
                          });
                        }}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                        title="Delete Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm">ℹ</span>
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Name</p>
                        <p className="text-lg font-bold text-white">{viewingManufacturer.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Slug</p>
                          <p className="text-white text-sm font-mono">{viewingManufacturer.slug}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Display Order</p>
                          <p className="text-white font-semibold">{viewingManufacturer.displayOrder}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
  <p className="text-xs text-slate-400 mb-1">Description</p>
  {viewingManufacturer.description ? (
    <div
      className="text-white text-sm prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: viewingManufacturer.description }}
    />
  ) : (
    <p className="text-white text-sm">No description</p>
  )}
</div>

                    </div>
                  </div>

                  {/* SEO Info */}
                  <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-sm">🔍</span>
                      SEO Information
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Title</p>
                        <p className="text-white text-sm">{viewingManufacturer.metaTitle || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Description</p>
                        <p className="text-white text-sm">{viewingManufacturer.metaDescription || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Keywords</p>
                        <p className="text-white text-sm">{viewingManufacturer.metaKeywords || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Statistics */}
                  <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-2">
                    <h3 className="text-lg font-bold text-white mb-3">Statistics</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Products</span>
                        <span className="text-xl font-bold text-white">{viewingManufacturer.productCount}</span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          viewingManufacturer.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {viewingManufacturer.isPublished ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Homepage</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          viewingManufacturer.showOnHomepage ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {viewingManufacturer.showOnHomepage ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-3">Activity</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Created At</p>
                        <p className="text-white text-xs">{viewingManufacturer.createdAt ? new Date(viewingManufacturer.createdAt).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Created By</p>
                        <p className="text-white text-xs">{viewingManufacturer.createdBy || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Updated At</p>
                        <p className="text-white text-xs">{viewingManufacturer.updatedAt ? new Date(viewingManufacturer.updatedAt).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Updated By</p>
                        <p className="text-white text-xs">{viewingManufacturer.updatedBy || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setViewingManufacturer(null);
                      handleEdit(viewingManufacturer);
                    }}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all font-medium text-sm"
                  >
                    Edit Manufacturer
                  </button>
                  <button
                    onClick={() => setViewingManufacturer(null)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImageUrl}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Manufacturer Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        title="Delete Manufacturer"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and may affect related products.`}
        confirmText="Delete Manufacturer"
        cancelText="Cancel"
        icon={AlertCircle}
        iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50"
        isLoading={isDeleting}
      />

      {/* Image Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!imageDeleteConfirm}
        onClose={() => setImageDeleteConfirm(null)}
        onConfirm={() => {
          if (imageDeleteConfirm) {
            handleDeleteImage(imageDeleteConfirm.manufacturerId, imageDeleteConfirm.imageUrl);
          }
        }}
        title="Delete Image"
        message={`Are you sure you want to delete the image for "${imageDeleteConfirm?.manufacturerName}"? This action cannot be undone.`}
        confirmText="Delete Image"
        cancelText="Cancel"
        icon={AlertCircle}
        iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50"
        isLoading={isDeletingImage}
      />
    </div>
  );
}
