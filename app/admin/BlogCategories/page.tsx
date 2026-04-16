"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, FolderTree, Eye, Upload, Filter, FilterX,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle,
  CheckCircle, Tag, FileText, Clock, ChevronDown, ChevronRight as ChevronRightIcon,
  MessageSquare, RotateCcw, X, Globe , Settings, Image as ImageIcon,
  LayoutList, 
  ExternalLink
} from "lucide-react";
import { ProductDescriptionEditor } from "../_components/SelfHostedEditor";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
 
import { blogCategoriesService, BlogCategory } from "@/lib/services/blogCategories";
import { useRouter } from "next/navigation";
import { extractFilename, formatDate, generateSlug, getImageUrl } from "../_utils/formatUtils";

interface BlogCategoryStats {
  totalCategories: number;
  totalSubCategories: number;
  totalPosts: number;
  activeCategories: number;
}

export default function BlogCategoriesPage() {
  const toast = useToast();
  const router = useRouter();
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBlogCategory, setEditingBlogCategory] = useState<BlogCategory | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [viewingBlogCategory, setViewingBlogCategory] = useState<BlogCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "archived">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [statusConfirm, setStatusConfirm] = useState<BlogCategory | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [stats, setStats] = useState<BlogCategoryStats>({
    totalCategories: 0,
    totalSubCategories: 0,
    totalPosts: 0,
    activeCategories: 0,
  });
  const [imageDeleteConfirm, setImageDeleteConfirm] = useState<{
    categoryId: string;
    imageUrl: string;
    categoryName: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    imageUrl: "",
    isActive: true,
    displayOrder: 1,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    searchEngineFriendlyPageName: "",
    parentCategoryId: "",
  });

  /* ─── helpers ─────────────────────────────────────────────────── */
  const toggleCategoryExpansion = (id: string) => {
    setExpandedCategories(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };



  /* ─── data fetching ───────────────────────────────────────────── */
  const fetchBlogCategories = async () => {
    try {
      setLoading(true);
      const params: any = { includeSubCategories: true };
      if (visibilityFilter === "archived") {
        params.isDeleted = true;
        params.includeInactive = true;
      } else {
        params.isDeleted = false;
        params.includeInactive = true;
        if (statusFilter === "active") { params.isActive = true; params.includeInactive = false; }
        if (statusFilter === "inactive") { params.isActive = false; }
      }
      const response = await blogCategoriesService.getAll(params);
      const data = response.data?.data || [];
      setBlogCategories(data);
      calculateStats(data);
    } catch {
      toast.error("Failed to load blog categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogCategories(); }, []);
  useEffect(() => { fetchBlogCategories(); }, [statusFilter, visibilityFilter]);

  useEffect(() => {
    const h = () => { if (!showModal) fetchBlogCategories(); };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, [showModal]);

  const calculateStats = (data: BlogCategory[]) => {
    setStats({
      totalCategories: data.filter(c => !c.parentCategoryId).length,
      totalSubCategories: data.filter(c => c.parentCategoryId).length,
      totalPosts: data.reduce((s, c) => s + (c.blogPostCount || 0), 0),
      activeCategories: data.filter(c => c.isActive).length,
    });
  };

  /* ─── filtering & pagination ──────────────────────────────────── */
  const filteredBlogCategories = useMemo(() =>
    blogCategories
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(c => ({
        ...c,
        subCategories: c.subCategories?.filter(s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [],
      })),
    [blogCategories, searchTerm]
  );

  const getFlattenedCategories = () => {
    const flat: Array<BlogCategory & { level: number; parentId?: string }> = [];
    filteredBlogCategories.forEach(cat => {
      flat.push({ ...cat, level: 0 });
      if (expandedCategories.has(cat.id) && cat.subCategories?.length) {
        cat.subCategories.forEach(sub => {
          if (typeof sub === "object" && sub !== null)
            flat.push({ ...(sub as BlogCategory), level: 1, parentId: cat.id });
        });
      }
    });
    return flat;
  };

  const totalItems = filteredBlogCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = getFlattenedCategories().slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  const getPageNumbers = () => {
    const max = 5, half = Math.floor(max / 2);
    let s = Math.max(1, currentPage - half), e = Math.min(totalPages, currentPage + half);
    if (e - s < max - 1) { if (s === 1) e = Math.min(totalPages, max); else s = Math.max(1, e - max + 1); }
    const pages = [];
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const hasActiveFilters = statusFilter !== "all" || visibilityFilter !== "all" || searchTerm.trim() !== "";
  const clearFilters = () => { setStatusFilter("all"); setVisibilityFilter("all"); setSearchTerm(""); setCurrentPage(1); };

  /* ─── handlers ────────────────────────────────────────────────── */
  const handleImageFileChange = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success("Image selected! Click save to upload.");
  };

  const handleStatusToggle = async () => {
    if (!statusConfirm) return;
    try {
      setIsUpdatingStatus(true);
      await blogCategoriesService.update(statusConfirm.id, { ...statusConfirm, isActive: !statusConfirm.isActive });
      toast.success(`Category ${statusConfirm.isActive ? "deactivated" : "activated"} successfully`);
      fetchBlogCategories();
    } catch { toast.error("Failed to update status"); }
    finally { setIsUpdatingStatus(false); setStatusConfirm(null); }
  };

  const handleDeleteImage = async (categoryId: string, imageUrl: string) => {
    setIsDeletingImage(true);
    try {
      await blogCategoriesService.deleteImage(extractFilename(imageUrl));
      toast.success("Image deleted successfully");
      setBlogCategories(prev => prev.map(c => c.id === categoryId ? { ...c, imageUrl: "" } : c));
      if (editingBlogCategory?.id === categoryId) setFormData(p => ({ ...p, imageUrl: "" }));
      if (viewingBlogCategory?.id === categoryId) setViewingBlogCategory(p => p ? { ...p, imageUrl: "" } : null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete image");
    } finally { setIsDeletingImage(false); setImageDeleteConfirm(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryName = formData.name.trim();
    if (!categoryName) { toast.error("Blog category name is required"); return; }
    if (categoryName.length < 2 || categoryName.length > 100) { toast.error(`Category name must be 2–100 characters`); return; }
    if (!/^[A-Za-z0-9\s\-&/()]+$/.test(categoryName)) { toast.error("Category name: letters, numbers, spaces, -, &, /, () only"); return; }
    if (blogCategories.some(c => c.name.toLowerCase().trim() === categoryName.toLowerCase() && c.id !== editingBlogCategory?.id)) {
      toast.error("A category with this name already exists"); return;
    }
    const description = formData.description.trim();
    if (description.length < 10) { toast.error(`Description must be at least 10 characters`); return; }
    if (description.length > 1000) { toast.error(`Description cannot exceed 1000 characters`); return; }
    const slug = generateSlug(formData.slug || formData.name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { toast.error("Slug must be lowercase with hyphens only"); return; }
    if (slug.length < 2 || slug.length > 100) { toast.error(`Slug must be 2–100 characters`); return; }
    if (blogCategories.some(c => c.slug === slug && c.id !== editingBlogCategory?.id)) { toast.error("A category with this slug already exists"); return; }
    if (formData.parentCategoryId) {
      const parent = blogCategories.find(c => c.id === formData.parentCategoryId);
      if (!parent) { toast.error("Selected parent category does not exist"); return; }
      if (!parent.isActive) { toast.error("Cannot add subcategory to an inactive parent"); return; }
      if (editingBlogCategory && formData.parentCategoryId === editingBlogCategory.id) { toast.error("Category cannot be its own parent"); return; }
    }
    if (isNaN(formData.displayOrder) || !Number.isInteger(formData.displayOrder)) { toast.error("Display order must be a whole number"); return; }
    if (formData.displayOrder < 1 || formData.displayOrder > 1000) { toast.error("Display order must be 1–1000"); return; }
    if (formData.metaTitle && formData.metaTitle.trim().length > 60) { toast.error(`Meta title must be under 60 characters`); return; }
    if (formData.metaDescription && formData.metaDescription.trim().length > 160) { toast.error(`Meta description must be under 160 characters`); return; }
    if (formData.metaKeywords && formData.metaKeywords.trim().length > 255) { toast.error(`Meta keywords must be under 255 characters`); return; }
    if (formData.searchEngineFriendlyPageName) {
      const seoName = formData.searchEngineFriendlyPageName.trim();
      if (seoName.length > 200) { toast.error("SEO page name must be under 200 characters"); return; }
      if (!/^[a-z0-9\-]+$/.test(seoName)) { toast.error("SEO page name: lowercase alphanumeric + hyphens only"); return; }
    }
    if (imageFile) {
      if (imageFile.type !== "image/webp") { toast.error("Only WebP images are allowed"); return; }
      if (imageFile.size > 10 * 1024 * 1024) { toast.error("Image size must be under 10MB"); return; }
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image(), url = URL.createObjectURL(imageFile);
          img.onload = () => {
            URL.revokeObjectURL(url);
            if (img.width < 200 || img.width > 5000) { reject(`Width must be 200–5000px`); return; }
            if (img.height < 200 || img.height > 5000) { reject(`Height must be 200–5000px`); return; }
            resolve();
          };
          img.onerror = () => { URL.revokeObjectURL(url); reject("Invalid or corrupted image"); };
          img.src = url;
        });
      } catch (err: any) { toast.error(err); return; }
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const r = await blogCategoriesService.uploadImage(imageFile, { title: formData.name });
        if (!r.data?.success || !r.data?.data) throw new Error(r.data?.message || "Image upload failed");
        finalImageUrl = r.data.data;
        if (editingBlogCategory?.imageUrl && editingBlogCategory.imageUrl !== finalImageUrl) {
          try { await blogCategoriesService.deleteImage(extractFilename(editingBlogCategory.imageUrl)); } catch {}
        }
      }
      const payload = {
        name: categoryName, description, slug,
        imageUrl: finalImageUrl,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
        parentCategoryId: formData.parentCategoryId || null,
        metaTitle: formData.metaTitle?.trim() || undefined,
        metaDescription: formData.metaDescription?.trim() || undefined,
        metaKeywords: formData.metaKeywords?.trim() || undefined,
        searchEngineFriendlyPageName: formData.searchEngineFriendlyPageName?.trim() || undefined,
        ...(editingBlogCategory && { id: editingBlogCategory.id }),
      };
      if (editingBlogCategory) {
        await blogCategoriesService.update(editingBlogCategory.id, payload);
        toast.success("Blog category updated successfully");
      } else {
        await blogCategoriesService.create(payload);
        toast.success("Blog category created successfully");
      }
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null); setImagePreview(null);
      await fetchBlogCategories();
      setShowModal(false); resetForm();
    } catch (err: any) {
      const s = err?.response?.status;
      toast.error(
        s === 400 ? (err?.response?.data?.message || "Invalid data") :
        s === 401 ? "Session expired. Please login again" :
        s === 409 ? "Category with this name or slug already exists" :
        s === 500 ? "Server error. Please try again" :
        err?.message || "Failed to save blog category"
      );
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const r = await blogCategoriesService.delete(id);
      if (!r.error && (r.status === 200 || r.status === 204)) {
        toast.success("Blog category deleted");
        await fetchBlogCategories();
      } else toast.error(r.error || "Failed to delete");
    } catch (e: any) {
      toast.error(e?.response?.status === 401 ? "Please login again" : "Failed to delete blog category");
    } finally { setIsDeleting(false); setDeleteConfirm(null); }
  };

  const handleEdit = (cat: BlogCategory) => {
    setEditingBlogCategory(cat);
    setFormData({
      name: cat.name, description: cat.description, slug: cat.slug,
      imageUrl: cat.imageUrl || "", isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      metaTitle: cat.metaTitle || "", metaDescription: cat.metaDescription || "",
      metaKeywords: cat.metaKeywords || "",
      searchEngineFriendlyPageName: cat.searchEngineFriendlyPageName || "",
      parentCategoryId: cat.parentCategoryId || "",
    });
    setImageFile(null); setImagePreview(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", slug: "", imageUrl: "", isActive: true, displayOrder: 1, metaTitle: "", metaDescription: "", metaKeywords: "", searchEngineFriendlyPageName: "", parentCategoryId: "" });
    setEditingBlogCategory(null); setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null); setSeoOpen(false);
  };

  const getParentCategoryOptions = () =>
    blogCategories.filter(c => !editingBlogCategory || c.id !== editingBlogCategory.id);

  const handleRestore = async (id: string) => {
    try {
      await blogCategoriesService.restore(id);
      toast.success("Category restored");
      fetchBlogCategories();
    } catch { toast.error("Failed to restore category"); }
  };

  /* ─── loading state ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading categories...</p>
      </div>
    );
  }

  const inactiveCount = blogCategories.filter(c => !c.isActive).length;

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Blog Categories
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage categories &amp; hierarchies</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/admin/BlogPosts")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-violet-500/50 rounded-lg transition-all"
          >
            <FileText className="h-3.5 w-3.5" /> Go To Blog Post Page
          </button>
          <button
            onClick={() => router.push("/admin/comments")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-pink-500/50 rounded-lg transition-all"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Go To Blog Comment Page
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-violet-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add Category
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800">
          {/* Total */}
          <div className="flex items-center gap-3 pr-6">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <FolderTree className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{stats.totalCategories}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Total <span className="text-violet-400/70">· {stats.totalSubCategories} sub</span>
              </p>
            </div>
          </div>
          {/* Active */}
          <div className="flex items-center gap-3 px-6">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{stats.activeCategories}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Active {inactiveCount > 0
                  ? <span className="text-amber-400/80">· {inactiveCount} inactive</span>
                  : <span className="text-green-400/60">· all active</span>}
              </p>
            </div>
          </div>
          {/* Total Posts */}
          <div className="flex items-center gap-3 px-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{stats.totalPosts}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Posts <span className="text-cyan-400/70">· {stats.totalCategories > 0 ? `avg ${(stats.totalPosts / stats.totalCategories).toFixed(1)}` : "—"}</span>
              </p>
            </div>
          </div>
          {/* Subcategories */}
          <div className="flex items-center gap-3 pl-6">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
              <LayoutList className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{stats.totalSubCategories}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Subcategories <span className="text-pink-400/70">· {stats.totalCategories} parent{stats.totalCategories !== 1 ? "s" : ""}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500/50 transition-all"
            />
          </div>

          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="all">Active Records</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {[25, 50, 75, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-all"
            >
              <FilterX className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
            {totalItems} {totalItems !== 1 ? "categories" : "category"}
          </span>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderTree className="h-10 w-10 text-slate-600" />
            <p className="text-slate-500 text-sm">No blog categories found</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm rounded-lg hover:bg-violet-500/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Add first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="text-left py-2.5 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide">Category</th>
                  <th className="text-center py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Posts</th>
                  <th className="text-center py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="text-center py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Display Order</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Created</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Updated By</th>
                  <th className="text-center py-2.5 px-3 text-slate-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(cat => {
                  const hasSubs = cat.level === 0 && cat.subCategories && cat.subCategories.length > 0;
                  const isExpanded = expandedCategories.has(cat.id);
                  const isSub = cat.level === 1;
                  const isInactive = !cat.isActive;
                  const parentCat = isSub
                    ? blogCategories.find(c => c.id === (cat.parentCategoryId || (cat as any).parentId))
                    : null;

                  return (
                    <tr
                      key={`${cat.id}-${cat.level}-${(cat as any).parentId || "root"}`}
                      className={`border-b border-slate-800/60 transition-all ${isSub ? "bg-slate-800/10" : ""} ${isInactive ? "opacity-50" : "hover:bg-slate-800/20"}`}
                    >
                      {/* Category Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {/* Expand toggle or indent */}
                          {hasSubs ? (
                            <button
                              onClick={() => toggleCategoryExpansion(cat.id)}
                              className="p-1 rounded-md hover:bg-slate-700/50 transition-all shrink-0"
                              disabled={isInactive}
                            >
                              {isExpanded
                                ? <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
                                : <ChevronRightIcon className="h-3.5 w-3.5 text-slate-500" />}
                            </button>
                          ) : isSub ? (
                            <div className="flex items-center shrink-0" style={{ width: 24 }}>
                              <div className="w-px h-4 bg-cyan-500/30 ml-3" />
                              <div className="w-2 h-px bg-cyan-500/30" />
                            </div>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}

                          {/* Image */}
                          {cat.imageUrl ? (
                            <div
                              className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:ring-1 hover:ring-violet-500 transition-all shrink-0"
                              onClick={() => !isInactive && setSelectedImageUrl(getImageUrl(cat.imageUrl))}
                            >
                              <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className={`w-full h-full object-cover ${isInactive ? "grayscale" : ""}`} />
                            </div>
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isInactive ? "bg-slate-700/50" : isSub ? "bg-gradient-to-br from-cyan-500/60 to-blue-500/60" : "bg-gradient-to-br from-violet-500 to-pink-500"}`}>
                              <FolderTree className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}

                          {/* Name + slug */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setViewingBlogCategory(cat)}
                                className={`font-medium text-sm transition-colors ${isInactive ? "text-slate-500" : isSub ? "text-cyan-300 hover:text-cyan-200" : "text-white hover:text-violet-400"}`}
                              >
                                {cat.name}
                              </button>
                              {hasSubs && (
                                <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-xs">
                                  {cat.subCategories?.length}
                                </span>
                              )}
                              {isInactive && (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-xs">Archived</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isSub && parentCat && (
                                <span className="text-xs text-slate-500">in <span className="text-cyan-500/70">{parentCat.name}</span> · </span>
                              )}
                              <span className="text-xs text-slate-600 font-mono">{cat.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Posts count */}
                    {/* Posts count */}
<td className="py-3 px-3 text-center">
  {isInactive ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-700/30 text-slate-600">
      {cat.blogPostCount || 0}
    </span>
  ) : (
    <a
      href={`/blog/category/${cat.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
        (cat.blogPostCount || 0) > 0
          ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
          : "bg-slate-700/30 text-slate-500 hover:bg-slate-700/50"
      }`}
      title="View category posts"
    >
      {cat.blogPostCount || 0}
      <ExternalLink className="h-3 w-3" />
    </a>
  )}
</td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setStatusConfirm(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border transition-all ${cat.isActive ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? "bg-green-400" : "bg-red-400"}`} />
                          {cat.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Order */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono text-sm ${isInactive ? "text-slate-600" : "text-slate-400"}`}>{cat.displayOrder}</span>
                      </td>

                      {/* Created */}
                      <td className="py-3 px-3">
                        {cat.createdAt ? (
                          <div>
                            <p className={`text-xs font-medium ${isInactive ? "text-slate-600" : "text-slate-300"}`}>
                               {formatDate(cat.createdAt)}
                            </p>
                          </div>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>

                      {/* Updated By */}
                      <td className="py-3 px-3">
                        {cat.updatedBy ? (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isInactive ? "bg-slate-600" : "bg-gradient-to-br from-violet-500 to-cyan-500"}`}>
                              {cat.updatedBy.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-xs truncate max-w-[100px] ${isInactive ? "text-slate-600" : "text-slate-400"}`} title={cat.updatedBy}>
                              {cat.updatedBy}
                            </span>
                          </div>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewingBlogCategory(cat)} className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all" title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleEdit(cat)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {(cat as any).isDeleted ? (
                            <button onClick={() => handleRestore(cat.id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-all" title="Restore">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => setDeleteConfirm({ id: cat.id, name: cat.name })} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

      {/* ── Pagination ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-1">
          <span className="text-xs text-slate-500">
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {getPageNumbers().map(p => (
              <button
                key={p} onClick={() => goToPage(p)}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all ${currentPage === p ? "bg-violet-500 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30">
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs text-slate-500">Page {currentPage}/{totalPages}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW DETAILS MODAL
      ══════════════════════════════════════════════════════════ */}
      {viewingBlogCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-start gap-4 p-5 border-b border-slate-800">
              {viewingBlogCategory.imageUrl ? (
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all shrink-0"
                  onClick={() => setSelectedImageUrl(getImageUrl(viewingBlogCategory.imageUrl))}
                >
                  <img src={getImageUrl(viewingBlogCategory.imageUrl)}
                   onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    alt={viewingBlogCategory.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                  <FolderTree className="h-7 w-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{viewingBlogCategory.name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">/blog/{viewingBlogCategory.slug}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${viewingBlogCategory.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewingBlogCategory.isActive ? "bg-green-400" : "bg-red-400"}`} />
                    {viewingBlogCategory.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-xs font-medium">
                    <FileText className="h-3 w-3" /> {viewingBlogCategory.blogPostCount || 0} posts
                  </span>
                  {viewingBlogCategory.parentCategoryName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md text-xs">
                      in {viewingBlogCategory.parentCategoryName}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingBlogCategory(null)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: "thin" }}>
              {/* Description */}
              {viewingBlogCategory.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                  <div
                    className="text-slate-300 text-sm bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 prose prose-sm max-w-none prose-invert"
                    dangerouslySetInnerHTML={{ __html: viewingBlogCategory.description }}
                  />
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Display Order</p>
                  <p className="text-white font-bold text-lg">{viewingBlogCategory.displayOrder}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Parent Category</p>
                  <p className="text-white font-medium text-sm">{viewingBlogCategory.parentCategoryName || "Root"}</p>
                </div>
              </div>

              {/* SEO */}
              {(viewingBlogCategory.metaTitle || viewingBlogCategory.metaDescription || viewingBlogCategory.metaKeywords) && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> SEO
                  </p>
                  <div className="space-y-2">
                    {viewingBlogCategory.metaTitle && (
                      <div><p className="text-xs text-slate-600 mb-0.5">Meta Title</p><p className="text-slate-300 text-sm">{viewingBlogCategory.metaTitle}</p></div>
                    )}
                    {viewingBlogCategory.metaDescription && (
                      <div><p className="text-xs text-slate-600 mb-0.5">Meta Description</p><p className="text-slate-400 text-xs">{viewingBlogCategory.metaDescription}</p></div>
                    )}
                    {viewingBlogCategory.metaKeywords && (
                      <div>
                        <p className="text-xs text-slate-600 mb-0.5">Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {viewingBlogCategory.metaKeywords.split(",").map((k, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">{k.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs">
{viewingBlogCategory.createdAt && (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Created At </p>
                    <p className="text-slate-300">{formatDate(viewingBlogCategory.createdAt)}</p>
                   {/* {formatDate(viewingBlogCategory.createdAt)} */}
                    {viewingBlogCategory.createdBy && <p className="text-slate-500 mt-0.5">by {viewingBlogCategory.createdBy}</p>}
                  </div>
                )}
                {viewingBlogCategory.updatedAt && (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Updated</p>
                    <p className="text-slate-300">{formatDate(viewingBlogCategory.updatedAt)}</p>
                    {viewingBlogCategory.updatedBy && <p className="text-slate-500 mt-0.5">by {viewingBlogCategory.updatedBy}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800">
              <button onClick={() => setViewingBlogCategory(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                Close
              </button>
              <button
                onClick={() => { handleEdit(viewingBlogCategory); setViewingBlogCategory(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingBlogCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingBlogCategory ? "Update the category details below" : "Fill in the details for the new category"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body — 2-column grid */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-800">

                {/* ── Left (2/3): Main fields ─── */}
                <div className="col-span-2 p-5 space-y-5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

                  {/* Basic Info */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Basic Information
                    </p>
                    <div className="space-y-3">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Category Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => {
                            const v = e.target.value;
                            setFormData(p => ({
                              ...p, name: v,
                              slug: !editingBlogCategory ? generateSlug(v) : p.slug,
                            }));
                          }}
                          placeholder="e.g. Health & Wellness"
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500/50 transition-all"
                        />
                      </div>

                      {/* Slug + Order in 2 cols */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">URL Slug</label>
                          <div className={`flex items-center bg-slate-800 border rounded-lg overflow-hidden transition-all focus-within:ring-1 border-slate-700 focus-within:border-violet-500/50 focus-within:ring-violet-500`}>
                            <span className="px-2.5 py-2.5 bg-slate-700/50 border-r border-slate-700 text-slate-500 text-xs font-mono whitespace-nowrap select-none">/blog/</span>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                              placeholder="auto-generated"
                              className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs font-mono placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Order <span className="text-red-400">*</span></label>
                          <input
                            type="number"
                            required
                            value={formData.displayOrder}
                            onChange={e => setFormData(p => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
                            min="1" max="1000"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Parent Category */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Parent Category</label>
                        <select
                          value={formData.parentCategoryId}
                          onChange={e => setFormData(p => ({ ...p, parentCategoryId: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        >
                          <option value="">None (Root Category)</option>
                          {getParentCategoryOptions().map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <ProductDescriptionEditor
                      value={formData.description}
                      onChange={v => setFormData(p => ({ ...p, description: v }))}
                      placeholder="Enter category description..."
                      height={250}
                      required={false}
                    />
                    <p className="text-xs text-slate-600 mt-1">{formData.description.length}/1000 characters</p>
                  </div>
                </div>

                {/* ── Right (1/3): Image + Status + SEO ─── */}
                <div className="col-span-1 p-5 space-y-5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

                  {/* Image Upload */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" /> Category Image
                    </p>
                    {(imagePreview || formData.imageUrl) ? (
                      <div className="space-y-2">
                        <div
                          className="w-full aspect-video rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:ring-1 hover:ring-violet-500 transition-all"
                          onClick={() => setSelectedImageUrl(imagePreview || getImageUrl(formData.imageUrl))}
                        >
                          <img
                            src={imagePreview || getImageUrl(formData.imageUrl)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-center">{imagePreview ? "New image selected" : "Current image"}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="px-3 py-2 text-xs font-medium cursor-pointer text-center bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 transition-all">
                            Change
                            <input type="file" accept="image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f); }} />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); setImageFile(null); }
                              else if (formData.imageUrl) setImageDeleteConfirm({ categoryId: editingBlogCategory?.id || "", imageUrl: formData.imageUrl, categoryName: formData.name });
                            }}
                            className="px-3 py-2 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
                        <Upload className="h-6 w-6 text-slate-500 mb-2" />
                        <p className="text-xs text-slate-500">WebP only · max 10MB</p>
                        <p className="text-xs text-slate-600 mt-1">200–5000px dimensions</p>
                        <input type="file" accept="image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f); }} />
                      </label>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" /> Settings
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`relative w-10 h-5 rounded-full transition-all ${formData.isActive ? "bg-green-500" : "bg-slate-600"}`}
                        onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.isActive ? "left-5" : "left-0.5"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                          {formData.isActive ? "Active" : "Inactive"}
                        </p>
                        <p className="text-xs text-slate-500">Category visibility</p>
                      </div>
                    </label>
                  </div>

                  {/* SEO (collapsible) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setSeoOpen(o => !o)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 hover:text-slate-300 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> SEO Settings</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
                    </button>

                    {seoOpen && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Meta Title</label>
                          <input
                            type="text"
                            value={formData.metaTitle}
                            onChange={e => setFormData(p => ({ ...p, metaTitle: e.target.value }))}
                            placeholder="50–60 characters recommended"
                            maxLength={60}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                          <p className={`text-xs mt-0.5 ${formData.metaTitle.length > 50 ? "text-amber-400" : "text-slate-600"}`}>{formData.metaTitle.length}/60</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Meta Description</label>
                          <textarea
                            value={formData.metaDescription}
                            onChange={e => setFormData(p => ({ ...p, metaDescription: e.target.value }))}
                            placeholder="150–160 characters recommended"
                            rows={3}
                            maxLength={160}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                          />
                          <p className={`text-xs mt-0.5 ${formData.metaDescription.length > 150 ? "text-amber-400" : "text-slate-600"}`}>{formData.metaDescription.length}/160</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Meta Keywords</label>
                          <input
                            type="text"
                            value={formData.metaKeywords}
                            onChange={e => setFormData(p => ({ ...p, metaKeywords: e.target.value }))}
                            placeholder="keyword1, keyword2"
                            maxLength={255}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">SEO Page Name</label>
                          <input
                            type="text"
                            value={formData.searchEngineFriendlyPageName}
                            onChange={e => setFormData(p => ({ ...p, searchEngineFriendlyPageName: e.target.value }))}
                            placeholder="seo-friendly-name"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {editingBlogCategory ? "Updating..." : "Creating..."}</>
                  ) : (
                    <>{editingBlogCategory ? <><CheckCircle className="h-3.5 w-3.5" /> Update Category</> : <><Plus className="h-3.5 w-3.5" /> Create Category</>}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm dialogs ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        title="Delete Blog Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        confirmText="Delete" cancelText="Cancel"
        icon={AlertCircle} iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500"
        isLoading={isDeleting}
      />
      <ConfirmDialog
        isOpen={!!imageDeleteConfirm} onClose={() => setImageDeleteConfirm(null)}
        onConfirm={() => imageDeleteConfirm && handleDeleteImage(imageDeleteConfirm.categoryId, imageDeleteConfirm.imageUrl)}
        title="Delete Image"
        message={`Delete image for "${imageDeleteConfirm?.categoryName}"?`}
        confirmText="Delete Image" cancelText="Cancel"
        icon={AlertCircle} iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500"
        isLoading={isDeletingImage}
      />
      <ConfirmDialog
        isOpen={!!statusConfirm} onClose={() => setStatusConfirm(null)}
        onConfirm={handleStatusToggle}
        title="Change Status"
        message={`${statusConfirm?.isActive ? "Deactivate" : "Activate"} "${statusConfirm?.name}"?`}
        confirmText={statusConfirm?.isActive ? "Deactivate" : "Activate"} cancelText="Cancel"
        icon={AlertCircle} iconColor="text-yellow-400"
        confirmButtonStyle="bg-gradient-to-r from-yellow-500 to-orange-500"
        isLoading={isUpdatingStatus}
      />

      {/* ── Image Preview ─────────────────────────────────────────── */}
      {selectedImageUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedImageUrl(null)}>
          <div className="relative max-w-4xl max-h-[85vh]">
            <img src={selectedImageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setSelectedImageUrl(null)} className="absolute top-3 right-3 p-2 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 transition-all border border-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
