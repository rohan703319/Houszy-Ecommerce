"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Search, FolderTree, Eye, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, CheckCircle, ChevronDown, ChevronRight as ChevronRightIcon, X, Award, Package, Copy, RotateCcw, MessageCircle, HelpCircle } from "lucide-react";

import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";

import { categoriesService, Category, CategoryStats } from "@/lib/services/categories";
import { useRouter } from "next/navigation";
import CategoryModal from "./CategoryModal";
import { categoryFaqsService, Faq } from "@/lib/services/categoryFaqs";
import { extractFilename, formatDate, getImageUrl } from "../_utils/formatUtils";

export default function CategoriesPage() {
  const toast = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
const [pendingFaqs, setPendingFaqs] = useState<Faq[]>([]);
  const [homepageFilter, setHomepageFilter] = useState<'all' | 'yes' | 'no'>('all');
const [deletedFilter, setDeletedFilter] = useState<'all' | 'deleted' | 'notDeleted'>('all');
const handleRestore = async (category: Category) => {
  setIsRestoring(true);

  try {
    const response = await categoriesService.restore(category.id);

    if (!response.error) {
      toast.success("Category restored successfully! 🎉");
      await fetchCategories();
    } else {
      toast.error(response.error || "Failed to restore category");
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Restore failed"
    );
  } finally {
    setIsRestoring(false);
    setRestoreConfirm(null);
  }
};
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
// Add after other useState declarations
const [homepageCategories, setHomepageCategories] = useState<Category[]>([]); 

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
const [stats, setStats] = useState({
  totalCategories: 0,
  totalActive: 0,
  totalInactive: 0,
  totalShowOnHomepage: 0,
  totalProducts: 0
});

const [openFaqCategory, setOpenFaqCategory] = useState<Category | null>(null);
  const [imageDeleteConfirm, setImageDeleteConfirm] = useState<{
    categoryId: string;
    imageUrl: string;
    categoryName: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    isActive: true,
    showOnHomepage: false,  // ✅ ADD THIS LINE
   sortOrder: "" as number | "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    parentCategoryId: ""
  });

const toggleCategoryExpansion = (categoryId: string) => {
  setExpandedCategories(prev => {
    const newSet = new Set(prev);

    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);

      // 🔥 ADD THIS (key logic)
      const category = findCategoryById(categoryId, categories);
      if (category) {
        const parents = getParentChain(category, categories);
        parents.forEach(p => newSet.add(p.id));
      }
    }

    return newSet;
  });
};



// Add this NEW helper function after getCategoryLevel
const getMaxDepthOfSubtree = (category: Category, allCategories: Category[]): number => {
  if (!category.subCategories || category.subCategories.length === 0) {
    return 0; // No children = depth 0
  }
  
  let maxDepth = 0;
  category.subCategories.forEach(child => {
    const childDepth = getMaxDepthOfSubtree(child, allCategories);
    maxDepth = Math.max(maxDepth, childDepth + 1);
  });
  
  return maxDepth;
};

useEffect(() => {
  fetchCategories();
}, [statusFilter, homepageFilter, levelFilter, debouncedSearch, deletedFilter]);



const fetchCategories = async () => {
  try {
    setLoading(true);

    const params: any = {
      includeSubCategories: true,
      includeInactive: true,
      isActive: true,
    };

    // Deleted filter
    if (deletedFilter === "deleted") {
      params.isDeleted = true;
      delete params.isActive;
    } else if (deletedFilter === "notDeleted") {
      params.isDeleted = false;
    }

    // Status filter
    if (statusFilter === "active") {
      params.isActive = true;
    } else if (statusFilter === "inactive") {
      params.isActive = false;
    } else if (statusFilter === "all") {
      delete params.isActive;
    }

    // Homepage filter
    if (homepageFilter === "yes") {
      params.showOnHomepage = true;
    } else if (homepageFilter === "no") {
      params.showOnHomepage = false;
    }

 

    // Level
    if (levelFilter !== "all") {
      params.level = Number(levelFilter.replace("level", ""));
    }

    // API CALL
    const response = await categoriesService.getAll({ params });

    const categoriesData: Category[] = Array.isArray(response.data?.data?.items)
      ? response.data.data.items
      : [];

    const statsData = response.data?.data?.stats;

    // ✅ SAFE MAPPING (fix error permanently)
    if (statsData) {
      setStats({
        totalCategories: statsData.totalCategories || 0,
        totalActive: statsData.totalActive || 0,
        totalInactive: statsData.totalInactive || 0,
        totalShowOnHomepage: statsData.totalShowOnHomepage || 0,
        totalProducts: statsData.totalProducts || 0
      });
    }

    // SORT
    const sortRecursive = (cats: Category[]): Category[] => {
      return cats
        .map(cat => ({
          ...cat,
          subCategories:
            cat.subCategories && cat.subCategories.length > 0
              ? sortRecursive(cat.subCategories)
              : [],
        }))
        .sort((a, b) => {
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }

          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        });
    };

    const sortedCategories = sortRecursive(categoriesData);

    setCategories(sortedCategories);

  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    setLoading(false);
  }
};


  const findCategoryById = (id: string, categories: Category[]): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = findCategoryById(id, cat.subCategories);
        if (found) return found;
      }
    }
    return null;
  };

  const getCategoryLevel = (category: Category, allCategories: Category[]): number => {
    let level = 0;
    let currentId = category.parentCategoryId;
    
    while (currentId) {
      level++;
      const parent = findCategoryById(currentId, allCategories);
      if (!parent) break;
      currentId = parent.parentCategoryId;
    }
    
    return level;
  };

  const isDescendantOf = (
    category: Category, 
    ancestorId: string, 
    allCategories: Category[]
  ): boolean => {
    let currentId = category.parentCategoryId;
    
    while (currentId) {
      if (currentId === ancestorId) return true;
      const parent = findCategoryById(currentId, allCategories);
      if (!parent) break;
      currentId = parent.parentCategoryId;
    }
    
    return false;
  };

  const getAvailableParents = (
    categories: Category[], 
    currentCategoryId?: string
  ): Category[] => {
    const availableParents: Category[] = [];
    
    const addIfValid = (cat: Category, level: number) => {
      if (currentCategoryId && cat.id === currentCategoryId) return;
      if (currentCategoryId && isDescendantOf(cat, currentCategoryId, categories)) return;
      
      if (level < 2) {
        availableParents.push({ ...cat, level } as any);
      }
      
      if (cat.subCategories && cat.subCategories.length > 0) {
        cat.subCategories.forEach(subCat => addIfValid(subCat, level + 1));
      }
    };
    
    categories.forEach(cat => addIfValid(cat, 0));
    return availableParents;
  };

  // useEffect(() => {
  //   const handleFocus = () => {
  //     fetchCategories();
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, []);



  const handleAddSubcategory = (parentId: string, parentName: string) => {
    const parent = findCategoryById(parentId, categories);
    if (!parent) {
      toast.error('Parent category not found');
      return;
    }
    
    const parentLevel = getCategoryLevel(parent, categories);
    
    if (parentLevel >= 2) {
      toast.error('🚫 Maximum 3 levels allowed! Cannot create subcategory here.');
      return;
    }
    
    setSelectedParentId(parentId);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
      showOnHomepage: false,  // ✅ ADD THIS LINE
     sortOrder: "" as number | "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      parentCategoryId: parentId
    });
    setShowModal(true);
  };
// Calculate homepage categories count
useEffect(() => {
  const categoriesOnHomepage = categories.filter(cat => cat.showOnHomepage);
  setHomepageCategories(categoriesOnHomepage);
}, [categories]);

 const handleDeleteImage = async (categoryId: string, imageUrl: string) => {
  setIsDeletingImage(true);
  try {
    const filename = extractFilename(imageUrl);
    await categoriesService.deleteImage(filename);
    toast.success("✅ Image deleted successfully! 🗑️");

    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? { ...c, imageUrl: "" } : c
      )
    );
    if (editingCategory?.id === categoryId) {
      setFormData(prev => ({ ...prev, imageUrl: "" }));
    }
    if (viewingCategory?.id === categoryId) {
      setViewingCategory(prev =>
        prev ? { ...prev, imageUrl: "" } : null
      );
    }
  } catch (error: any) {
    console.error("❌ Error deleting image:", error);
    if (error.response?.status === 401) {
      toast.error("Please login again");
    } else {
      toast.error(error.response?.data?.message || "Failed to delete image");
    }
  } finally {
    setIsDeletingImage(false);
    setImageDeleteConfirm(null);
  }
};

const isDuplicateCategory = (
  categories: Category[],
  name: string,
  editingId?: string
): boolean => {
  for (const cat of categories) {
    // check current
    if (
      cat.name.trim().toLowerCase() === name.toLowerCase() &&
      cat.id !== editingId
    ) {
      return true;
    }

    // check children recursively
    if (cat.subCategories?.length) {
      const found = isDuplicateCategory(
        cat.subCategories,
        name,
        editingId
      );
      if (found) return true;
    }
  }

  return false;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  

const name = formData.name?.trim();

if (!name) {
  toast.error("❌ Category name is required");
  return;
}

// ✅ DUPLICATE CHECK
const isDuplicate = isDuplicateCategory(
  categories,
  name,
  editingCategory?.id
);

if (isDuplicate) {
  toast.error("❌ Category with same name already exists");
  return;
}

  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    let finalImageUrl = formData.imageUrl;

    // =========================
    // IMAGE UPLOAD
    // =========================
    if (imageFile) {
      const uploadRes = await categoriesService.uploadImage(imageFile, { name });

      console.log("📦 Upload Response:", uploadRes);

      if (!uploadRes.data?.success || !uploadRes.data?.data) {
        throw new Error("Image upload failed");
      }

      finalImageUrl = uploadRes.data.data;
    }
console.log("imageFile:", imageFile);

if (!imageFile) {
  console.log("Image file missing");
}
    // =========================
    // PAYLOAD
    // =========================
   const payload = {
  id: editingCategory?.id, // ✅ ADD THIS

  name,
  description: formData.description?.trim() || "",

  imageUrl: finalImageUrl || "",

  isActive: !!formData.isActive,
  showOnHomepage: !!formData.showOnHomepage,
sortOrder: formData.sortOrder === "" ? 0 : formData.sortOrder,

  parentCategoryId: formData.parentCategoryId || null,

  metaTitle: formData.metaTitle || "",
  metaDescription: formData.metaDescription || "",
  metaKeywords: formData.metaKeywords || "",
};

    console.log("📤 Payload:", payload);

    // =========================
    // CREATE / UPDATE
    // =========================
    let categoryId = editingCategory?.id;

    if (editingCategory) {
      console.log("✏️ EDIT MODE");

      await categoriesService.update(editingCategory.id, payload);

      // 🔥 FAQ UPDATE / CREATE
      console.log("📦 Pending FAQs (EDIT):", pendingFaqs);

      if (pendingFaqs?.length) {
        await Promise.all(
          pendingFaqs.map((faq: any) => {
            console.log("➡️ Processing FAQ:", faq);

            if (faq.id) {
              return categoryFaqsService.update(
                editingCategory.id,
                faq.id,
                faq
              );
            } else {
              return categoryFaqsService.create(categoryId!, {
  question: faq.question,
  answer: faq.answer,
  displayOrder: faq.displayOrder,
  isActive: faq.isActive,
});
            }
          })
        );
      }

      toast.success("✅ Category updated");

    } else {
      console.log("🆕 CREATE MODE");

      const res = await categoriesService.create(payload);

      console.log("📥 CREATE RESPONSE:", res);

      // 🔥 FIXED ID EXTRACTION
     categoryId = res.data?.data?.id;

      console.log("🆔 Extracted Category ID:", categoryId);

      if (!categoryId) {
        console.error("❌ Category ID missing. FULL RESPONSE:", res);
        throw new Error("Category ID missing");
      }

      // 🔥 CREATE FAQs
      console.log("📦 Pending FAQs (CREATE):", pendingFaqs);

      if (pendingFaqs?.length) {
        await Promise.all(
          pendingFaqs.map((faq: any) => {
            console.log("➡️ Creating FAQ:", faq);

            return categoryFaqsService.create(categoryId!, {
              question: faq.question,
              answer: faq.answer,
              displayOrder: faq.displayOrder,
              isActive: faq.isActive,
            });
          })
        );
      } else {
        console.warn("⚠️ No FAQs found in pendingFaqs");
      }

      toast.success("✅ Category created");
    }

    // =========================
    // CLEANUP
    // =========================
    await fetchCategories();

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(null);
    setImagePreview(null);
    setPendingFaqs([]);
    setShowModal(false);
    resetForm();

  } catch (err: any) {
    console.error("❌ ERROR:", err);
    toast.error(err?.message || "Failed");
  } finally {
    setIsSubmitting(false);
  }
};




  const handleDelete = async (id: string) => {
    setIsDeleting(true);

    try {
      const response = await categoriesService.delete(id);

      if (!response.error && (response.status === 200 || response.status === 204)) {
        toast.success("Category deleted successfully! 🗑️");
        await fetchCategories();
      } else {
        toast.error(response.error || "Failed to delete category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (error?.response?.status === 401) {
        toast.error("Please login again");
      } else {
        toast.error("Failed to delete category");
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

const handleEdit = (category: Category) => {
  setEditingCategory(category);
  
  const currentLevel = getCategoryLevel(category, categories);
  
  setFormData({
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl || "",
    isActive: category.isActive,
    showOnHomepage: category.showOnHomepage || false,  // ✅ CATEGORY KI ACTUAL VALUE USE KARO
    sortOrder: category.sortOrder,
    metaTitle: category.metaTitle || "",
    metaDescription: category.metaDescription || "",
    metaKeywords: category.metaKeywords || "",
    parentCategoryId: category.parentCategoryId || "",
  })
  
  setImageFile(null);
  setImagePreview(null);
  
  // ✅ Show warning if editing Level 3 category
  if (currentLevel === 2) {
    toast.info('ℹ️ Editing Level 3 category - Cannot change parent to create Level 4');
  }
  
  setShowModal(true);
};


  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
        showOnHomepage: false,  // ✅ ADD THIS LINE
      sortOrder: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      parentCategoryId: "",
    });
    setEditingCategory(null);
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };


// ✅ NEW IMPROVED FUNCTION
const getParentCategoryOptions = () => {
  // Use the sophisticated getAvailableParents function
  const availableParents = getAvailableParents(
    categories,
    editingCategory?.id
  );
  
  return availableParents;
};

const parentOptions = getParentCategoryOptions();

const clearFilters = () => {
  setStatusFilter("all");
  setLevelFilter("all");
  setHomepageFilter("all");
  setDeletedFilter("all");   // ✅ ADD THIS
  setSearchTerm("");
  setCurrentPage(1);
  setExpandedCategories(new Set());
};

  // CategoryRow Component
  type CategoryRowProps = {
    category: Category;
    level: number;
    allCategories: Category[];
    expandedCategories: Set<string>;
    onToggleExpand: (id: string) => void;
    onEdit: (cat: Category) => void;
    onDelete: (id: string, name: string) => void;
    onView: (cat: Category) => void;
    onAddSubcategory: (parentId: string, parentName: string) => void;
    getImageUrl: (url?: string) => string;
    setImageDeleteConfirm: (data: any) => void;
    onStatusToggle: (category: Category) => void; // ✅ NEW
    onRestore: (category: Category) => void;
      onOpenFaq: (cat: Category) => void;
      
  };
const [statusConfirm, setStatusConfirm] = useState<Category | null>(null);
const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
const [restoreConfirm, setRestoreConfirm] = useState<Category | null>(null);
const [isRestoring, setIsRestoring] = useState(false);

const handleStatusToggle = (category: Category) => {
  setStatusConfirm(category);
};

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  level,
  expandedCategories,
  onToggleExpand,
  onEdit,
  onDelete,
  onView,
  onAddSubcategory,
  getImageUrl,
  onStatusToggle,
   onOpenFaq ,// 🔥 missing था
  onRestore
}) => {
  const hasChildren =
    category.subCategories && category.subCategories.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isInactive = !category.isActive;
  const indent = level * 18;

  const totalSubCategories = getTotalSubCategories(category);
  const levelLabel = `L${level + 1}`;

  const MAX_LEVEL = 2;
  const canAddSubcategory = level < MAX_LEVEL;

  return (
    <tr
      className={`border-b border-slate-800 text-sm transition-all ${
        isInactive
          ? "opacity-50 hover:opacity-70"
          : "hover:bg-slate-800/20"
      }`}
    >
      {/* CATEGORY */}
      <td className="py-2 px-3">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${indent}px` }}
        >
          {/* Expand */}
          {!searchTerm && hasChildren ? (
            <button
              onClick={() => onToggleExpand(category.id)}
              className="p-1 rounded hover:bg-slate-700/40"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Image */}
          {category.imageUrl ? (
            <img    
             onClick={() => setSelectedImageUrl(getImageUrl(category.imageUrl))}
              src={getImageUrl(category.imageUrl)}
              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
              className="w-7 h-7 rounded-md object-cover border border-slate-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-violet-500/20 flex items-center justify-center">
              <FolderTree className="h-3.5 w-3.5 text-violet-400" />
            </div>
          )}

          {/* Name + Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                onClick={() => onView(category)}
                className={`font-medium truncate cursor-pointer ${
                  isInactive ? "text-slate-500" : "text-white"
                }`}
              >
                {category.name}
              </p>

              {/* Level */}
              <span className="px-1.5 py-0.5 text-[10px] rounded border bg-slate-800 text-slate-400 border-slate-700">
                {levelLabel}
              </span>

              {/* Sub count */}
              {totalSubCategories > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {totalSubCategories}
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 truncate">
              {category.slug}
            </p>
          </div>
        </div>
      </td>

      {/* PRODUCTS */}
      <td className="py-2 px-3 text-center text-[12px] text-cyan-400 font-medium">
        {category.productCount}
      </td>

      {/* STATUS */}
      <td className="py-2 px-3 text-center">
        <button
          onClick={() => onStatusToggle(category)}
          className={`px-2 py-0.5 text-[10px] rounded-md border transition-all ${
            category.isActive
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {category.isActive ? "Active" : "Inactive"}
        </button>
      </td>

      {/* SORT */}
      <td className="py-2 px-3 text-center text-[11px] text-slate-400">
        {category.sortOrder}
      </td>

      {/* CREATED */}
      <td className="py-2 px-3 text-[11px] text-slate-500">
        {formatDate(category.createdAt)}
      </td>

      {/* UPDATED */}
      <td className="py-2 px-3 text-[11px] text-slate-500">
        {formatDate(category.updatedAt)}
      </td>

      {/* UPDATED BY */}
      <td className="py-2 px-3 text-[11px] text-slate-400">
        {category.updatedBy || "-"}
      </td>

      {/* ACTIONS */}
      <td className="py-2 px-3">
        <div className="flex justify-center gap-1">

          {/* Add */}
          <button
            onClick={() =>
              canAddSubcategory &&
              onAddSubcategory(category.id, category.name)
            }
            disabled={!canAddSubcategory}
              title="Add Subcategory"
            className="p-1 text-green-400 hover:bg-green-500/10 rounded-md disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
<button
  onClick={() => onOpenFaq(category)}
   title="Manage FAQs"
  className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-md"
>
  <HelpCircle className="h-4 w-4" />
</button>

          {/* View */}
          <button
            onClick={() => onView(category)}
            className="p-1 text-violet-400 hover:bg-violet-500/10 rounded-md"
            title="View Category"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-cyan-400 hover:bg-cyan-500/10 rounded-md"
            title="Edit Category"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>

          {/* Delete / Restore */}
          {category.isDeleted ? (
            <button
              onClick={() => onRestore(category)}
              className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md"
               title="Restore Category"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onDelete(category.id, category.name)}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded-md"
              title="Delete Category"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};


  // ✅ FIXED - Only ONE filteredCategories definition
const hasActiveFilters =
  searchTerm ||
  levelFilter !== 'all' ||
  statusFilter !== 'all' ||
  homepageFilter !== 'all' ||
  deletedFilter !== 'all';

const findMatchingNodes = useCallback((categories: Category[], search: string): Category[] => {
  if (!search.trim()) return categories;

  const result: Category[] = [];

  const traverse = (cat: Category) => {
    if (cat.name.toLowerCase().includes(search.toLowerCase())) {
      result.push(cat);
    }

    if (cat.subCategories?.length) {
      cat.subCategories.forEach(traverse);
    }
  };

  categories.forEach(traverse);

  return result;
}, []);

  // ✅ Smart search in hierarchy


// NEW – pass the 5th argument
const filteredCategories = useMemo(() => {
  return findMatchingNodes(categories, debouncedSearch);
}, [categories, debouncedSearch, findMatchingNodes]);

const getParentChain = useCallback((category: Category, all: Category[]) => {
  const chain: Category[] = [];
  let current = category;

  while (current.parentCategoryId) {
    const parent = findCategoryById(current.parentCategoryId, all);
    if (!parent) break;

    chain.unshift(parent);
    current = parent;
  }

  return chain;
}, []);

  // ✅ Flatten categories for display

const flattenedData = useMemo(() => {
  const flattened: Array<Category & { level: number }> = [];

  const addRecursive = (category: Category, level: number) => {
    flattened.push({ ...category, level });

    if (
      expandedCategories.has(category.id) &&
      category.subCategories?.length
    ) {
      category.subCategories.forEach(child =>
        addRecursive(child, level + 1)
      );
    }
  };

  if (searchTerm.trim()) {
    return filteredCategories.map(cat => ({
      ...cat,
      level: getCategoryLevel(cat, categories)
    }));
  }

  categories.forEach(cat => addRecursive(cat, 0));

  return flattened;

}, [categories, expandedCategories, searchTerm, filteredCategories]);

const paginationData = useMemo(() => {
  const totalItems = flattenedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentData = flattenedData.slice(startIndex, endIndex);

  return {
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    currentData,
  };
}, [flattenedData, currentPage, itemsPerPage]);

const { totalItems, totalPages, startIndex, endIndex, currentData } = paginationData;

const goToPage = useCallback((page: number) => {
  setCurrentPage((prev) => Math.max(1, Math.min(page, totalPages)));
}, [totalPages]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
const goToNextPage = useCallback(() => {
  setCurrentPage(prev => Math.min(totalPages, prev + 1));
}, [totalPages]);

const goToPreviousPage = useCallback(() => {
  setCurrentPage(prev => Math.max(1, prev - 1));
}, []);
// ✅ Get total subcategories recursively
const getTotalSubCategories = useCallback((category: Category): number => {
  if (!category.subCategories?.length) return 0;

  let count = category.subCategories.length;

  category.subCategories.forEach(child => {
    count += getTotalSubCategories(child);
  });

  return count;
}, []);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
const handleStatusUpdate = async (category: Category) => {
  try {
    const updatedPayload = {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      parentCategoryId: category.parentCategoryId,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      metaKeywords: category.metaKeywords,
      showOnHomepage: category.showOnHomepage,
      isActive: !category.isActive, // ✅ only change
    };

    await categoriesService.update(category.id, updatedPayload);

    toast.success(
      `Category ${
        updatedPayload.isActive ? "Activated" : "Deactivated"
      } successfully`
    );

    fetchCategories(); // refresh list
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to update status"
    );
  }
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
  if (!searchTerm.trim()) {
    setDebouncedSearch("");
    setIsSearching(false);
    return;
  }

  setIsSearching(true);

  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
    setCurrentPage(1);
    setIsSearching(false);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  setCurrentPage(1);
}, [debouncedSearch, statusFilter, levelFilter, homepageFilter]); // ← add homepageFilter here


  return (
    <div className="space-y-2">
  
{/* Header */}
<div className="flex flex-wrap items-center justify-between gap-3">

  {/* Title */}
  <div>
    <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
      Categories Management
    </h1>
    <p className="text-[12px] text-slate-500">Manage product categories</p>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2 flex-wrap">

    <button
      onClick={() => router.push('/admin/brands')}
      className="px-3 py-1.5 text-[11px] bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-md hover:bg-violet-500/20 transition-all flex items-center gap-1.5"
    >
      <Award className="h-3 w-3" />
    Go To  Brand Page
    </button>

    <button
      onClick={() => router.push('/admin/products')}
      className="px-3 py-1.5 text-[11px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-md hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
    >
      <Package className="h-3 w-3" />
      Go To  Product Page
    </button>

    <button
      onClick={() => {
        resetForm();
        setShowModal(true);
      }}
      className="px-3 py-1.5 text-[11px] bg-gradient-to-r from-violet-500 to-cyan-500 text-white rounded-md hover:opacity-90 transition-all flex items-center gap-1.5"
    >
      <Plus className="h-3 w-3" />
      Add Category 
    </button>

  </div>
</div>


{/* Stats Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">

  {/* Total Categories */}
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
    <p className="text-[11px] text-slate-500">Total Categories</p>
    <p className="text-lg font-semibold text-white">{stats.totalCategories}</p>
  </div>

  {/* Active */}
  <button
    type="button"
    onClick={() => {
      if (statusFilter === 'all') setStatusFilter('active');
      else if (statusFilter === 'active') setStatusFilter('inactive');
      else setStatusFilter('all');
    }}
    className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 text-left"
  >
    <p className="text-[11px] text-green-400">Active</p>
    <p className="text-lg font-semibold text-white">{stats.totalActive}</p>
  </button>

  {/* Inactive */}
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
    <p className="text-[11px] text-red-400">Inactive</p>
    <p className="text-lg font-semibold text-white">{stats.totalInactive}</p>
  </div>

  {/* Homepage */}
  <button
    type="button"
    onClick={() => {
      if (homepageFilter === 'all') setHomepageFilter('yes');
      else if (homepageFilter === 'yes') setHomepageFilter('no');
      else setHomepageFilter('all');
    }}
    className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 text-left"
  >
    <p className="text-[11px] text-cyan-400">Homepage</p>
    <p className="text-lg font-semibold text-white">{stats.totalShowOnHomepage}</p>
  </button>

  {/* Products */}
  {/* <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5">
    <p className="text-[11px] text-pink-400">Products</p>
    <p className="text-lg font-semibold text-white">{stats.totalProducts}</p>
  </div> */}

</div>


{/* Filters */}
<div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">

  <div className="flex flex-wrap items-center gap-2">

    {/* Search */}
<div className="relative flex-1 min-w-[200px]">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />

  <input
   type="search"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search Brands By Name..."
    className={`w-full pl-8 pr-8 py-1.5 bg-slate-800/60 border rounded-md text-white text-[12px] focus:outline-none transition-all ${
      searchTerm
        ? "border-violet-500 ring-1 ring-violet-500/40"
        : "border-slate-700 focus:ring-1 focus:ring-violet-500"
    }`}
  />

  {/* 🔥 LOADER */}
  {isSearching && (
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
      <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )}
</div>
    {/* Level */}
    <select
      value={levelFilter}
      onChange={(e) => setLevelFilter(e.target.value)}
      className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
        levelFilter !== "all"
          ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/40"
          : "border-slate-700"
      }`}
    >
<option value="all">All Category Levels</option>
<option value="level1">Main Category</option>
<option value="level2">Sub Category</option>
<option value="level3">Child Category</option>
    </select>

    {/* Deleted */}
    <select
      value={deletedFilter}
      onChange={(e) => setDeletedFilter(e.target.value as any)}
      className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
        deletedFilter !== "all"
          ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/40"
          : "border-slate-700"
      }`}
    >
      <option value="all">Records</option>
      <option value="notDeleted">Live</option>
      <option value="deleted">Deleted</option>
    </select>

    {/* Status */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
        statusFilter !== "all"
          ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/40"
          : "border-slate-700"
      }`}
    >
      <option value="all">Status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>

    {/* Homepage */}
    <select
      value={homepageFilter}
      onChange={(e) => setHomepageFilter(e.target.value as any)}
      className={`p-2  bg-slate-800/90 border rounded-md text-white text-[11px] ${
        homepageFilter !== "all"
          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
          : "border-slate-700"
      }`}
    >
      <option value="all">Homepage</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
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
</div>



      {/* Categories Table */}
<div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden">

  {/* TABLE */}
  <div className="overflow-x-auto">
    <table className="w-full text-sm">

      {/* HEADER */}
      <thead className="bg-slate-800/40 border-b border-slate-800">
        <tr className="text-[11px] text-slate-500 uppercase tracking-wide">
          <th className="py-2 px-3 text-left">Category</th>
          <th className="py-2 px-3 text-center">Products</th>
          <th className="py-2 px-3 text-center">Status</th>
          <th className="py-2 px-3 text-center">Display Order</th>
          <th className="py-2 px-3 text-left">Created on</th>
          <th className="py-2 px-3 text-left">Updated on</th>
          <th className="py-2 px-3 text-left">Updated By</th>
          <th className="py-2 px-3 text-center">Actions</th>
        </tr>
      </thead>

      {/* BODY */}
     <tbody>
  {loading ? (
    <tr>
      <td colSpan={8} className="py-10 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading categories...</p>
        </div>
      </td>
    </tr>
  ) : currentData.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-10 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-slate-600" />
                <p className="text-slate-400 text-sm">No categories found</p>
                <p className="text-slate-500 text-[11px]">
                  Try adjusting filters
                </p>
              </div>
            </td>
          </tr>
        ) : (
          currentData.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              level={category.level}
              allCategories={categories}
              expandedCategories={expandedCategories}
              onToggleExpand={toggleCategoryExpansion}
              onEdit={handleEdit}
              onDelete={(id, name) => setDeleteConfirm({ id, name })}
              onView={setViewingCategory}
              onAddSubcategory={handleAddSubcategory}
              getImageUrl={getImageUrl}
              setImageDeleteConfirm={setImageDeleteConfirm}
              onStatusToggle={handleStatusToggle}
              onRestore={handleRestore}
              onOpenFaq={(cat) => {
    setEditingCategory(cat);
    setOpenFaqCategory(cat);
    setShowModal(true);
  }}
            />
          ))
        )}
      </tbody>

    </table>
  </div>


  {/* PAGINATION */}
  {totalPages > 1 && (
    <div className="border-t border-slate-800 px-3 py-2 bg-slate-900/40">

      <div className="flex flex-wrap items-center justify-between gap-2">

        {/* LEFT */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Show</span>

          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[11px]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <span>
            {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1">

          <button
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 disabled:opacity-40"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* PAGE NUMBERS */}
          <div className="flex gap-1">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-2 py-1 text-[11px] rounded-md transition-all ${
                  currentPage === pageNum
                    ? "bg-violet-500 text-white"
                    : "bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500 disabled:opacity-40"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>

    </div>
  )}
</div>


            {/* View Details Modal - UPDATED WITH DELETE BUTTON */}
        {viewingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-violet-500/10">
            
            {/* ========== FIXED HEADER WITH IMAGE ========== */}
            <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-4">
                {/* Category Image */}
                {viewingCategory.imageUrl ? (
                  <div 
                    className="w-14 h-14 rounded-lg overflow-hidden border-2 border-violet-500/30 cursor-pointer hover:border-violet-500 transition-all shrink-0"
                    onClick={() => setSelectedImageUrl(getImageUrl(viewingCategory.imageUrl))}
                  >
                    <img
                      src={getImageUrl(viewingCategory.imageUrl)}
                      alt={viewingCategory.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                    <FolderTree className="h-7 w-7 text-white" />
                  </div>
                )}

                {/* Title & Subtitle */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent truncate">
                    {viewingCategory.name}
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">View category information</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setViewingCategory(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all shrink-0"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ========== SCROLLABLE CONTENT ========== */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs">ℹ</span>
                      Basic Information
                    </h3>
                    <div className="space-y-2">
                      
        <div className="bg-slate-900/50 p-3 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">Name</p>

        <p className="text-base font-bold text-white">
          {viewingCategory.name}
        </p>

        <div className="flex items-center gap-2">
          <p className="text-sm font-mono text-slate-300 break-all">
            {viewingCategory.id}
          </p>

          <button
            onClick={() => {
              navigator.clipboard.writeText(viewingCategory.id);
            }}
            className="text-slate-400 hover:text-white transition"
            title="Copy ID"
          >
            <Copy size={14} />
          </button>
        </div>
        </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Slug</p>
                          <p className="text-white text-sm font-mono break-all">{viewingCategory.slug}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Sort Order</p>
                          <p className="text-white font-semibold">{viewingCategory.sortOrder}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Description</p>
                        {viewingCategory.description ? (
                          <div
                            className="text-white text-sm prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: viewingCategory.description }}
                          />
                        ) : (
                          <p className="text-slate-500 text-sm italic">No description</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEO Info */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-xs">🔍</span>
                      SEO Information
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Title</p>
                        <p className="text-white text-sm">{viewingCategory.metaTitle || <span className="text-slate-500 italic">Not set</span>}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Description</p>
                        <p className="text-white text-sm">{viewingCategory.metaDescription || <span className="text-slate-500 italic">Not set</span>}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Meta Keywords</p>
                        <p className="text-white text-sm">{viewingCategory.metaKeywords || <span className="text-slate-500 italic">Not set</span>}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Statistics */}
                  <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-4">
                    <h3 className="text-base font-bold text-white mb-3">Statistics</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Products</span>
                        <span className="text-xl font-bold text-white">{viewingCategory.productCount || 0}</span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Status</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                          viewingCategory.isActive 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${viewingCategory.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          {viewingCategory.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Homepage</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                          viewingCategory.showOnHomepage 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {viewingCategory.showOnHomepage ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Featured
                            </>
                          ) : (
                            'Not Featured'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-base font-bold text-white mb-3">Activity Timeline</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Created At</p>
                        <p className="text-white text-xs font-medium">
                          {formatDate(viewingCategory.createdAt)}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Created By</p>
                        <p className="text-white text-xs font-medium">{viewingCategory.createdBy || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Updated At</p>
                        <p className="text-white text-xs font-medium">
                           {formatDate(viewingCategory.updatedAt)}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Updated By</p>
                        <p className="text-white text-xs font-medium">{viewingCategory.updatedBy || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ================= FAQ ================= */}
<div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">

  <div className="flex justify-between items-center mb-3">
    <h3 className="text-white font-semibold">FAQs</h3>
    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
      {viewingCategory.faqs?.length || 0}
    </span>
  </div>

  {viewingCategory.faqs?.length ? (
    <div className="space-y-2">

      {viewingCategory.faqs.map((faq: any, i: number) => (
        <details
          key={faq.id}
          className="group bg-slate-900/50 rounded-lg border border-slate-700/40 overflow-hidden"
        >

          {/* QUESTION */}
          <summary className="cursor-pointer list-none p-3 flex justify-between items-center">

            <p className="text-sm text-white font-medium">
              {i + 1}. {faq.question}
            </p>

            <div className="flex items-center gap-2">

              <span className={`text-[10px] px-2 py-0.5 rounded ${
                faq.isActive
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {faq.isActive ? "Active" : "Inactive"}
              </span>

              <span className="text-xs text-slate-500">
                #{faq.displayOrder}
              </span>

            </div>
          </summary>

          {/* ANSWER */}
          <div className="px-3 pb-3 text-xs text-slate-400 border-t border-slate-700/40">
            {faq.answer}
          </div>

        </details>
      ))}

    </div>
  ) : (
    <p className="text-slate-500 text-sm">No FAQs available</p>
  )}

</div>
              </div>
              
            </div>
            

            {/* ========== FIXED FOOTER ========== */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 rounded-b-2xl shrink-0">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setViewingCategory(null)}
                  className="px-4 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-all font-medium flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingCategory(null);
                    handleEdit(viewingCategory);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Category
                </button>
              </div>
            </div>

          </div>
        </div>
        )}

      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
{/* ==================== IMAGE VIEWER MODAL (MISSING) ==================== */}
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
      onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
      <button
      type="button"
        onClick={() => setSelectedImageUrl(null)}
        className="absolute top-4 right-4 p-2 bg-red-900/80 text-white rounded-lg hover:bg-slate-800 transition-all"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>
)}

<ConfirmDialog
  isOpen={!!statusConfirm}
  onClose={() => setStatusConfirm(null)}
  onConfirm={async () => {
    if (!statusConfirm) return;

    setIsUpdatingStatus(true);

    try {
      await categoriesService.update(statusConfirm.id, {
        ...statusConfirm,
        isActive: !statusConfirm.isActive,
      });

      toast.success(
        `Category ${
          statusConfirm.isActive ? "deactivated" : "activated"
        } successfully`
      );

      await fetchCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setIsUpdatingStatus(false);
      setStatusConfirm(null);
    }
  }}
  title={statusConfirm?.isActive ? "Deactivate Category" : "Activate Category"}
  message={`Are you sure you want to ${
    statusConfirm?.isActive ? "deactivate" : "activate"
  } "${statusConfirm?.name}"?`}
  confirmText={statusConfirm?.isActive ? "Deactivate" : "Activate"}
  isLoading={isUpdatingStatus}
/>


      {/* Image Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!imageDeleteConfirm}
        onClose={() => setImageDeleteConfirm(null)}
        onConfirm={() => {
          if (imageDeleteConfirm) {
            handleDeleteImage(imageDeleteConfirm.categoryId, imageDeleteConfirm.imageUrl);
          }
        }}
        title="Delete Image"
        message={`Are you sure you want to delete the image for "${imageDeleteConfirm?.categoryName}"?`}
        confirmText="Delete Image"
        isLoading={isDeletingImage}
      />
<ConfirmDialog
  isOpen={!!restoreConfirm}
  onClose={() => setRestoreConfirm(null)}
  onConfirm={() => restoreConfirm && handleRestore(restoreConfirm)}
  title="Restore Category"
  message={`Are you sure you want to restore "${restoreConfirm?.name}"?`}
  confirmText="Restore"
  isLoading={isRestoring}
/>
<CategoryModal
  showModal={showModal}
  setShowModal={setShowModal}
   imageFile={imageFile}
  setImageFile={setImageFile}
  editingCategory={editingCategory}
  setEditingCategory={setEditingCategory}
  formData={formData}
  setFormData={setFormData}
  handleSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  categories={categories}
   pendingFaqs={pendingFaqs}
  setPendingFaqs={setPendingFaqs}
  openFaqCategory={openFaqCategory} // 🔥 add this
/>
    </div>
  );
}
