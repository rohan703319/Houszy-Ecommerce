"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductDescriptionEditor } from "../_components/SelfHostedEditor";
import CategoryFaqManager from "./CategoryFaqManager";
import { useToast } from "@/app/admin/_components/CustomToast";

import { CheckCircle, Edit, Eye, Plus, Trash2, Upload, X } from "lucide-react";
import ConfirmDialog from "../_components/ConfirmDialog";
import { categoriesService, Category } from "@/lib/services/categories";
import { getImageUrl } from "../_utils/formatUtils";
interface Props {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  imageFile: File | null;
setImageFile: (file: File | null) => void;
  bannerImageFile: File | null;
  setBannerImageFile: (file: File | null) => void;

  editingCategory: any;
  setEditingCategory: any;

  formData: any;
  setFormData: any;

  handleSubmit: any;
  isSubmitting: boolean;

  categories: any[];

  openFaqCategory?: any;
  

  // ✅ IMPORTANT (FIX)
  pendingFaqs: any[];
  setPendingFaqs: (faqs: any[]) => void;
}

export default function CategoryModal({
  showModal,
  setShowModal,
  editingCategory,
  setEditingCategory,
  setImageFile,
  bannerImageFile,
  setBannerImageFile,
  formData,
  setFormData,
  handleSubmit,
  openFaqCategory,
  categories,
  pendingFaqs,          // ✅ ADD
  setPendingFaqs,       // ✅ ADD
  isSubmitting,         // ⚠️ missing tha
}: Props) {
  const [activeTab, setActiveTab] = useState("basic");
  const toast = useToast();
const dropdownRef = useRef<HTMLDivElement | null>(null);
const homepageCount = categories.filter((c) => c.showOnHomepage).length;
const [search, setSearch] = useState("");
const [open, setOpen] = useState(false);
const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "valid" | "duplicate">("idle");


  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageDeleteConfirm, setImageDeleteConfirm] = useState<{
    categoryId: string;
    imageUrl: string;
    categoryName: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [bannerDeleteConfirm, setBannerDeleteConfirm] = useState<boolean>(false);
 const getParentCategoryOptions = () => {
  const result: any[] = [];
const traverse = (cats: any[], level = 0) => {
  if (!Array.isArray(cats)) return; // 💣 CRASH FIX

  cats.forEach((cat) => {
    if (editingCategory && cat.id === editingCategory.id) return;

    if (level < 3) {
      result.push({ ...cat, level });
    }

    if (Array.isArray(cat.subCategories)) {
      traverse(cat.subCategories, level + 1);
    }
  });
};
traverse(Array.isArray(categories) ? categories : []);
  return result;
};

const parentOptions = useMemo(() => {
  return getParentCategoryOptions();


}, [categories, editingCategory]);

useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  };

  window.addEventListener("click", handleClickOutside);
  return () => window.removeEventListener("click", handleClickOutside);
}, []);
 const handleImageFileChange = (file: File) => {
  setImageFile(file); // ✅ parent state update
  const previewUrl = URL.createObjectURL(file);
  setImagePreview(previewUrl);
};

const handleBannerFileChange = (file: File) => {
  if (file.type !== "image/webp") {
    toast.error("❌ Only WebP format allowed for banner image");
    return;
  }
  setBannerImageFile(file);
  const previewUrl = URL.createObjectURL(file);
  setBannerPreview(previewUrl);
};

const handleDeleteBanner = async () => {
  if (!editingCategory || !formData.bannerImageUrl) return;
  setIsDeletingBanner(true);
  try {
    await categoriesService.deleteBannerImage(formData.bannerImageUrl);
    toast.success("Banner deleted ✅");
    setEditingCategory((prev: any) => prev ? { ...prev, bannerImageUrl: "" } : prev);
    setFormData((prev: any) => ({ ...prev, bannerImageUrl: "" }));
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    setBannerImageFile(null);
  } catch {
    toast.error("Banner delete failed");
  } finally {
    setIsDeletingBanner(false);
    setBannerDeleteConfirm(false);
  }
};
const handleDeleteImage = async (categoryId: string, imageUrl: string) => {
  setIsDeletingImage(true);

  try {
    const filename = extractFilename(imageUrl);

    await categoriesService.deleteImage(filename);

    toast.success("Image deleted ✅");

    setEditingCategory((prev: any) =>
      prev ? { ...prev, imageUrl: "" } : prev
    );

    setFormData((prev: any) => ({
      ...prev,
      imageUrl: "",
    }));

  } catch (error: any) {
    toast.error("Delete failed");
  } finally {
    setIsDeletingImage(false);
    setImageDeleteConfirm(null);
  }
};useEffect(() => {
  if (openFaqCategory) {
    setActiveTab("faqs");
  }
}, [openFaqCategory]);

const selectedParent = parentOptions.find(
  (c: any) => c.id === formData.parentCategoryId
);
useEffect(() => {
  if (selectedParent) {
    setSearch(selectedParent.name);
  } else {
    setSearch("");
  }
}, [formData.parentCategoryId, parentOptions]);


const extractFilename = (imageUrl: string) => {
  if (!imageUrl) return "";
  const parts = imageUrl.split('/');
  return parts[parts.length - 1];
};

const checkDuplicateName = (name: string): boolean => {
  const isDuplicateCategory = (categories: Category[]): boolean => {
    for (const cat of categories) {
      if (
        cat.name.trim().toLowerCase() === name.toLowerCase() &&
        cat.id !== editingCategory?.id
      ) {
        return true;
      }
      if (cat.subCategories?.length) {
        if (isDuplicateCategory(cat.subCategories)) return true;
      }
    }
    return false;
  };
  return isDuplicateCategory(categories);
};

useEffect(() => {
  if (showModal && !editingCategory) {
    setPendingFaqs([]);
  }
}, [showModal, editingCategory]);

// 🔥 Reset previews and files on modal open/close to prevent state leaks
useEffect(() => {
  if (!showModal) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setImagePreview(null);
    setBannerPreview(null);
    setImageFile(null);
    setBannerImageFile(null);
  } else {
    setImagePreview(null);
    setBannerPreview(null);
    setImageFile(null);
    setBannerImageFile(null);
  }
}, [showModal, setImageFile, setBannerImageFile]);


useEffect(() => {
  if (!formData.name.trim()) {
    setNameStatus("idle");
    return;
  }

  setNameStatus("checking");

  const timer = setTimeout(() => {
    const isDuplicate = checkDuplicateName(formData.name);

    setNameStatus(isDuplicate ? "duplicate" : "valid");
  }, 400);

  return () => clearTimeout(timer);
}, [formData.name, categories]);
const filteredOptions = parentOptions.filter((c: any) =>
  c.name.toLowerCase().includes(search.toLowerCase())
);
useEffect(() => {
  if (editingCategory && showModal) {
    setFormData({
      name: editingCategory.name || "",
      description: editingCategory.description || "",
      imageUrl: editingCategory.imageUrl || "",
      bannerImageUrl: editingCategory.bannerImageUrl || "",
      isActive: editingCategory.isActive ?? true,
      showOnHomepage: editingCategory.showOnHomepage ?? false,
      sortOrder: editingCategory.sortOrder ?? "",
      parentCategoryId: editingCategory.parentCategoryId || "",
      metaTitle: editingCategory.metaTitle || "",
      metaDescription: editingCategory.metaDescription || "",
      metaKeywords: editingCategory.metaKeywords || "",
      schemaDescription: editingCategory.schemaDescription || "",
    });
  }
}, [editingCategory, showModal]);


  if (!showModal) return null;
  const MAX_HOMEPAGE_CATEGORIES = 50;
  return (
   <>
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
<div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-xl flex flex-col">
        {/* HEADER */}
<div className="p-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
  <div className="flex items-center justify-between gap-3">

    {/* LEFT: IMAGE + TITLE */}
    <div className="flex items-center gap-3">

      {/* CATEGORY IMAGE */}
      <div
        onClick={() => {
          if (formData.imageUrl || imagePreview) {
            setSelectedImageUrl(
              imagePreview || getImageUrl(formData.imageUrl)
            );
          }
        }}
        className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
          (formData.imageUrl || imagePreview)
            ? 'cursor-pointer hover:scale-105 transition-transform border-2 border-violet-500/20'
            : 'bg-gradient-to-r from-violet-500 to-cyan-500'
        }`}
      >
        {(formData.imageUrl || imagePreview) ? (
          <img
            src={imagePreview || getImageUrl(formData.imageUrl)}
            alt="Category"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : editingCategory ? (
          <Edit className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </div>

      {/* TITLE */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {editingCategory ? "Edit Category" : "Create Category"}

          {formData.name && (
            <span className="text-violet-400 font-semibold truncate max-w-[280px]">
              • {formData.name}
            </span>
          )}
        </h2>

        {/* SUBTITLE */}
        <p className="text-slate-400 text-sm flex items-center gap-2">
          {editingCategory
            ? "✏️ Update category details"
            : "➕ Add a new category"}

         {typeof formData.sortOrder === "number" && formData.sortOrder > 0 && (
  <span className="text-cyan-400 font-semibold">
    • #{formData.sortOrder}
  </span>
)}
        </p>
      </div>
    </div>

    {/* RIGHT: CLOSE BUTTON */}
    <button
     onClick={() => {
  setShowModal(false);
  setEditingCategory(null);
  setActiveTab("basic");

  // 🔥 RESET IMAGE STATE
  setImageFile(null);
  setImagePreview(null);
}}
      className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
      disabled={isSubmitting}
    >
      <X className="h-5 w-5" />
    </button>

  </div>
</div>

        {/* TABS */}
<div className="flex gap-1 px-4 py-2 border-b border-slate-700 bg-slate-900/50">
  {["basic","image","seo","settings","faqs"].map((tab) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition ${
        activeTab === tab
          ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
          : "bg-slate-800 text-slate-400 hover:text-white"
      }`}
    >
      {tab}
    </button>
  ))}
</div>

        {/* FORM */}
<form
 onSubmit={async (e) => {
  await handleSubmit(e, pendingFaqs);

  // 🔥 RESET AFTER SAVE
  setImageFile(null);
  setImagePreview(null);
}}
  className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
>

  {/* ================= BASIC ================= */}
  {activeTab === "basic" && (
  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">

      {/* NAME */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Category Name     <span className="text-red-500">*</span>
        </label>
       <input
  required
  value={formData.name}
  onChange={(e) =>
    setFormData({ ...formData, name: e.target.value })
  }
  className={`w-full px-3 py-2 border rounded-lg text-sm text-white transition-all ${
    nameStatus === "duplicate"
      ? "border-red-500 bg-red-500/10"
      : nameStatus === "valid"
      ? "border-green-500 bg-green-500/10"
      : "border-slate-600 bg-slate-900"
  }`}
  placeholder="Enter category name"
/>
{nameStatus === "checking" && (
  <p className="text-xs text-slate-400 mt-1">Checking...</p>
)}

{nameStatus === "duplicate" && (
  <p className="text-xs text-red-400 mt-1">
    ❌ Category already exists
  </p>
)}

{nameStatus === "valid" && formData.name && (
  <p className="text-xs text-green-400 mt-1">
    ✅ Name available
  </p>
)}


        {!formData.name && (
          <p className="text-xs text-amber-400 mt-1">
            ⚠️ Category name is required before uploading image
          </p>
        )}
      </div>
 <label className="block text-sm text-slate-300 mb-2">
          Parent Category
        </label>
      {/* PARENT CATEGORY */}
  <div className="relative" ref={dropdownRef}>
  {/* INPUT */}
  <input
    value={search}
    onFocus={() => setOpen(true)}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search parent category..."
    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
  />

  {/* DROPDOWN */}
  {open && (
    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-slate-900 border border-slate-700 rounded-lg shadow-lg">

      {/* NONE OPTION */}
      <div
        onClick={() => {
          setFormData({ ...formData, parentCategoryId: "" });
          setSearch("");
          setOpen(false);
        }}
        className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 cursor-pointer"
      >
        None (Main Category)
      </div>

      {/* OPTIONS */}
      {filteredOptions.map((c: any) => (
        <div
          key={c.id}
          onClick={() => {
            setFormData({ ...formData, parentCategoryId: c.id });
            setSearch(c.name);
            setOpen(false);
          }}
          className={`px-3 py-2 text-sm cursor-pointer flex items-center
            ${c.level === 1 ? "bg-slate-800/40" : ""}
            ${c.level === 0 ? "font-medium text-white" : "text-slate-300"}
            hover:bg-violet-500/20`}
          style={{
            paddingLeft: `${27 + c.level * 26}px`, // 👈 spacing instead of --
          }}
        >
          {c.name}
        </div>
      ))}
    </div>
  )}
</div>

  <label className="block text-sm text-slate-300 mb-2">
          Category Description
        </label>
      {/* DESCRIPTION */}
      <ProductDescriptionEditor
        value={formData.description}
        onChange={(val) =>
          setFormData({ ...formData, description: val })
        }
        height={250}
      />
    </div>
  )}

  {/* ================= IMAGE ================= */}
  {activeTab === "image" && (
   <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 space-y-3">
 

  <div className="space-y-4">
    {/* Current/Preview Image Display */}
    {(imagePreview || formData.imageUrl) && (
      <div className="flex items-center gap-4 p-3 bg-slate-900/30 rounded-xl border border-slate-600">
        <div
          className="w-16 h-16 rounded-lg overflow-hidden border-2 border-violet-500/30 cursor-pointer hover:border-violet-500 transition-all"
          onClick={() => setSelectedImageUrl(imagePreview || getImageUrl(formData.imageUrl))}
        >
          <img
            src={imagePreview || getImageUrl(formData.imageUrl)}
            alt="Category image"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">
            {imagePreview ? "New Image Selected" : "Current Image"}
          </p>
          <p className="text-xs text-slate-400">
            {imagePreview ? "Will be uploaded on save" : "Click to view full size"}
          </p>
        </div>

        {/* Change/Remove buttons */}
        <div className="flex gap-2">
          <label
            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              !formData.name
                ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
            }`}
          >
            Change
            <input
              type="file"
              accept="image/*"
              disabled={!formData.name}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFileChange(file);
              }}
            />
          </label>

          {imagePreview && (
            <button
              type="button"
              onClick={() => {
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setImageFile(null);
                setImagePreview(null);
                toast.success("Image selection removed");
              }}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              Remove
            </button>
          )}

          {/* Delete button for existing images (only in edit mode) */}
          {editingCategory && formData.imageUrl && !imagePreview && (
            <button
              type="button"
              onClick={() => {
                if (editingCategory) {
                  setImageDeleteConfirm({
                    categoryId: editingCategory.id,
                    imageUrl: formData.imageUrl!,
                    categoryName: editingCategory.name,
                  });
                }
              }}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium flex items-center gap-2"
              title="Delete Image"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    )}

    {/* Upload Area - Show only if no image */}
    {!formData.imageUrl && !imagePreview && (
      <div className="flex items-center justify-center w-full">
        <label
          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-all ${
            !formData.name
              ? "border-slate-700 bg-slate-900/20 cursor-not-allowed"
              : "border-slate-600 bg-slate-900/30 hover:bg-slate-800/50 cursor-pointer group"
          }`}
        >
          <div className="flex items-center gap-3">
            <Upload
              className={`w-6 h-6 transition-colors ${
                !formData.name
                  ? "text-slate-600"
                  : "text-slate-500 group-hover:text-violet-400"
              }`}
            />
            <div>
              <p
                className={`text-sm ${
                  !formData.name ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {!formData.name ? (
                  "Enter category name first to upload"
                ) : (
                  <>
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              {formData.name && (
                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
              )}
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            disabled={!formData.name}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFileChange(file);
            }}
          />
        </label>
      </div>
    )}

    {/* URL Input - Optional */}
    {!imagePreview && (
      <>
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
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="Paste image URL"
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </>
    )}
  </div>
       {/* Guidelines Box */}
                      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="text-cyan-400 mt-0.5">📸</div>
                          <div>
                            <p className="text-sm text-cyan-400 font-semibold mb-2">Guidelines:</p>
                            <ul className="text-xs text-slate-300 space-y-1">
                          <li>• Size: 300×300 (In px)</li>
                              <li>• Format: WebP </li>
                              <li>• Max: 1MB</li>
                            </ul>
                          </div>
                        </div>
                      </div>

    {/* ─── BANNER IMAGE ─── */}
    <div className="mt-6 border-t border-slate-700/50 pt-5 space-y-3">
      <label className="block text-sm font-semibold text-violet-300">🖼️ Banner Image <span className="text-xs text-slate-400 font-normal">(WebP only · displayed at top of category page)</span></label>

      {/* Preview if exists */}
      {(bannerPreview || formData.bannerImageUrl) && (
        <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-slate-900/40 group">
          <img
            src={bannerPreview || (formData.bannerImageUrl?.startsWith("http") ? formData.bannerImageUrl : `${process.env.NEXT_PUBLIC_API_URL || ""}${formData.bannerImageUrl}`)}
            alt="Banner preview"
            className="w-full h-32 object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
            {bannerPreview ? (
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(bannerPreview); setBannerPreview(null); setBannerImageFile(null); }}
                className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500"
              >Remove</button>
            ) : (
              <>
                <label className="px-3 py-1.5 bg-violet-500/80 text-white rounded-lg text-xs font-medium hover:bg-violet-500 cursor-pointer">
                  Change
                  <input type="file" accept=".webp,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerFileChange(f); }} />
                </label>
                {editingCategory && formData.bannerImageUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 flex items-center gap-1"
                  ><Trash2 className="h-3 w-3" />Delete</button>
                )}
              </>
            )}
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
              {bannerPreview ? "New banner (save to apply)" : "Current Banner"}
            </span>
          </div>
        </div>
      )}

      {/* Upload area (shown when no banner) */}
      {!formData.bannerImageUrl && !bannerPreview && (
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-violet-500/40 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer transition-all group">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
            <div>
              <p className="text-sm text-slate-400 group-hover:text-slate-300">
                <span className="font-semibold text-violet-400">Click to upload banner</span>
              </p>
              <p className="text-xs text-slate-500">WebP only · recommended 1440×320px</p>
            </div>
          </div>
          <input type="file" accept=".webp,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerFileChange(f); }} />
        </label>
      )}
    </div>
</div>
  )}


  {/* ================= SEO ================= */}
  {activeTab === "seo" && ( 
             <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">
               
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                      placeholder="Enter meta title for SEO"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Description</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                      placeholder="Enter meta description for SEO"
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
                      placeholder="Enter keywords separated by commas"
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Schema Description
                      <span className="ml-1 text-slate-500 font-normal">(for SEO structured data)</span>
                    </label>
                    <textarea
                      value={formData.schemaDescription ?? ""}
                      onChange={(e) => setFormData({ ...formData, schemaDescription: e.target.value })}
                      placeholder="Shop fitness products including gym accessories, gym equipment..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
  )}

  {/* ================= SETTINGS ================= */}
  {activeTab === "settings" && (
<div className="space-y-3">

  {/* Sort Order */}
  <div>
    <label className="block text-sm text-slate-300 font-semibold mb-2">
      Sort Order
    </label>

    <input
      type="number"
      min="0"
      value={formData.sortOrder ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        setFormData({
          ...formData,
          sortOrder: value === "" ? "" : parseInt(value, 10),
        });
      }}
      placeholder="Enter display order"
      className="w-full px-4 py-3 bg-slate-900/40 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500"
    />
  </div>

  {/* Active Status */}
  <div>
    <label className="block text-sm text-slate-300 font-semibold mb-2">
      Visibility
    </label>

    <button
      type="button"
      onClick={() =>
        setFormData({ ...formData, isActive: !formData.isActive })
      }
      className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
        formData.isActive
          ? "bg-emerald-500/10 border-2 border-emerald-500/50 text-emerald-400"
          : "bg-slate-500/10 border-2 border-slate-500/50 text-slate-400"
      }`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5" />
        <div className="text-left">
          <p className="font-bold text-sm">
            {formData.isActive ? "Active" : "Inactive"}
          </p>
          <p className="text-xs opacity-75">
            {formData.isActive
              ? "Category is visible"
              : "Category is hidden"}
          </p>
        </div>
      </div>

      <div className={`w-11 h-6 rounded-full ${
        formData.isActive ? "bg-emerald-500" : "bg-slate-600"
      }`}>
        <div className={`w-5 h-5 bg-white rounded-full transition-all ${
          formData.isActive ? "translate-x-5 mt-0.5" : "translate-x-0.5 mt-0.5"
        }`} />
      </div>
    </button>
  </div>

  

  {/* Show on Homepage */}
  <div>
    <label className="block text-sm text-slate-300 font-semibold mb-2">
      Show on Homepage
    </label>

    <button
      type="button"
      onClick={() => {
        const checked = !formData.showOnHomepage;

        if (
          checked &&
          homepageCount >= 15 &&
          !editingCategory?.showOnHomepage
        ) {
          toast.error(`Max ${MAX_HOMEPAGE_CATEGORIES} reached`);
          return;
        }

        setFormData({ ...formData, showOnHomepage: checked });
      }}
      className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
        formData.showOnHomepage
          ? "bg-cyan-500/10 border-2 border-cyan-500/50 text-cyan-400"
          : "bg-slate-500/10 border-2 border-slate-500/50 text-slate-400"
      } ${
        !formData.showOnHomepage && homepageCount >= 15
          ? "opacity-50 cursor-not-allowed"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5" />
        <div className="text-left">
          <p className="font-bold text-sm">
            {formData.showOnHomepage ? "On Homepage" : "Not on Homepage"}
          </p>
          <p className="text-xs opacity-75">
            {formData.showOnHomepage
              ? `Featured (${homepageCount}/15)`
              : "Not featured"}
          </p>
        </div>
      </div>

      <div className={`w-11 h-6 rounded-full ${
        formData.showOnHomepage ? "bg-cyan-500" : "bg-slate-600"
      }`}>
        <div className={`w-5 h-5 bg-white rounded-full transition-all ${
          formData.showOnHomepage
            ? "translate-x-5 mt-0.5"
            : "translate-x-0.5 mt-0.5"
        }`} />
      </div>
    </button>
  </div>

</div>

  )}

  {/* ================= FAQ ================= */}
  {activeTab === "faqs" && (

    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
   <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
 <CategoryFaqManager
  categoryId={editingCategory?.id || ""}
  faqs={editingCategory ? editingCategory.faqs ?? [] : pendingFaqs}
  onChange={(faqs) => {
    console.log("🔥 FAQs updated:", faqs);

    if (editingCategory) {
      setEditingCategory((prev: any) =>
        prev ? { ...prev, faqs } : prev
      );
    } else {
      setPendingFaqs(faqs); // ✅ NOW WORKS
    }
  }}
/>
</div>
    </div>
  )}

  {/* ================= ACTIONS ================= */}
<div className="flex gap-2 pt-3 border-t border-slate-700">
  <button
    type="button"
  onClick={() => {
  setShowModal(false);
  setEditingCategory(null);
  setActiveTab("basic");

  // 🔥 RESET IMAGE STATE
  setImageFile(null);
  setImagePreview(null);
}}
    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all"
  >
    Cancel
  </button>

  <button
    type="submit"
    disabled={
      isSubmitting ||
      nameStatus === "duplicate" ||
      nameStatus === "checking"
    }
    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all
    ${
      isSubmitting || nameStatus === "duplicate" || nameStatus === "checking"
        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
        : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
    }`}
  >
    {editingCategory ? "Update Category" : "Create Category"}
  </button>
</div>

</form>
      </div>
{/* 🔥 Image Delete Confirmation */}
{imageDeleteConfirm && (
  <ConfirmDialog
    isOpen={!!imageDeleteConfirm}
    onClose={() => setImageDeleteConfirm(null)}
    onConfirm={() => {
      if (imageDeleteConfirm) {
        handleDeleteImage(
          imageDeleteConfirm.categoryId,
          imageDeleteConfirm.imageUrl
        );
      }
    }}
    title="Delete Image"
    message={`Are you sure you want to delete the image for "${imageDeleteConfirm.categoryName}"?`}
    confirmText="Delete Image"
    isLoading={isDeletingImage}
  />
)}

{/* 🔥 Banner Delete Confirmation */}
{bannerDeleteConfirm && (
  <ConfirmDialog
    isOpen={bannerDeleteConfirm}
    onClose={() => setBannerDeleteConfirm(false)}
    onConfirm={handleDeleteBanner}
    title="Delete Banner Image"
    message="Are you sure you want to delete the banner image for this category?"
    confirmText="Delete Banner"
    isLoading={isDeletingBanner}
  />
)}

{selectedImageUrl && (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[60] flex items-center justify-center p-4"
    onClick={() => setSelectedImageUrl(null)}
  >
    <div className="relative max-w-6xl max-h-[90vh]">

      {/* Close Button */}
      <button
        onClick={() => setSelectedImageUrl(null)}
        className="
          absolute top-3 right-3
          p-2 rounded-lg
          bg-white/10 hover:bg-red-500
          text-white backdrop-blur-md
          transition-all shadow-md
        "
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image */}
      <img
        src={selectedImageUrl}
        alt="Brand Logo Full View"
        className="
          max-w-full max-h-[90vh]
          rounded-xl
          shadow-2xl
          border border-white/10
        "
        onClick={(e) => e.stopPropagation()}
         onError={(e) => (e.currentTarget.src = "/placeholder.png")}
      />
    </div>
  </div>
)}
      
    </div>
  </>
  );
}