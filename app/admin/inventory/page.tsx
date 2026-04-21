"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Select from "react-select";
import {
  Search, Upload, Download, ShoppingCart, FilterX,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Package, AlertTriangle, CheckCircle2, Save, X, RefreshCcw,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { productsService } from "@/lib/services";
import { categoriesService } from "@/lib/services/categories";
import { brandsService } from "@/lib/services/brands";
import { useToast } from "@/app/admin/_components/CustomToast";
import { useRouter } from "next/navigation";
import MediaViewerModal, { MediaItem } from "../products/MediaViewerModal";
import ConfirmDialog from "../_components/ConfirmDialog";
import { getImageUrl } from "../_utils/formatUtils";


interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isMain?: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  price: number;
  brandName: string;
  categoryName: string;
  newStock: number;
  newPrice: number;
  image?: string;
  images?: ProductImage[];
}

interface SelectOption {
  value: string;
  label: string;
}

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "#1e293b",
    borderColor: state.isFocused ? "#8b5cf6" : "#475569",
    borderRadius: "0.5rem",
    boxShadow: "none",
    minHeight: "38px",
    "&:hover": { borderColor: "#8b5cf6" },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "#1e293b",
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#334155" : "#1e293b",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
  }),
  singleValue: (base: any) => ({ ...base, color: "white", fontSize: "13px" }),
  placeholder: (base: any) => ({ ...base, color: "#ecf0f6", fontSize: "13px" }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400"><AlertTriangle className="h-2.5 w-2.5" />Out</span>;
  if (qty <= 5)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400"><AlertTriangle className="h-2.5 w-2.5" />Low ({qty})</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" />{qty}</span>;
}

export default function InventoryPage() {
  const toast    = useToast();
  const router   = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [products, setProducts]     = useState<ProductRow[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands]         = useState<SelectOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
  const [selectedBrand, setSelectedBrand]       = useState<SelectOption | null>(null);
  const [importOpen, setImportOpen] = useState(false);
const [importFile, setImportFile] = useState<File | null>(null);
const [sampleLoading, setSampleLoading] = useState(false);
const [fullLoading, setFullLoading] = useState(false);

  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount]     = useState(0);
  const [totalPages, setTotalPages]     = useState(1);

  const [tableLoading, setTableLoading] = useState(true);

  const [rowLoading, setRowLoading]     = useState<string | null>(null);

  const [viewerOpen, setViewerOpen]   = useState(false);
  const [viewerMedia, setViewerMedia] = useState<MediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; message: string; onConfirm: () => void;
  }>({ title: "", message: "", onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, onConfirm });
    setConfirmOpen(true);
  };


const downloadSampleTemplate = async () => {
  try {
    setSampleLoading(true);

    const res = await productsService.getAll({
      page: 1,
      pageSize: 5,
      sortBy: "createdAt",
      sortDirection: "desc",
    });

    const items = res.data?.data?.items ?? [];

    if (!items.length) {
      toast.warning("No products found");
      return;
    }

const rows: ProductRow[] = items.map((p: any) => ({
  id: p.id,
  name: p.name,
  sku: p.sku || "",
  stockQuantity: p.stockQuantity ?? 0,
  price: p.price ?? 0,
  brandName: "",
  categoryName: "",
  newStock: 0,
  newPrice: 0,
}));

    // 🔥 FORCE DELAY (fix browser blocking)
    setTimeout(() => {
  writeExcel(toExcelRows(rows), "inventory-sample.xlsx");
    }, 100);

    toast.success("Sample downloaded");

  } catch (e) {
    console.error(e);
    toast.error("Download failed");
  } finally {
    setSampleLoading(false);
  }
};
  // ─── Fetch products ────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setTableLoading(true);
      const res = await productsService.getAll({
        page: currentPage,
        pageSize: itemsPerPage,
        searchTerm: debouncedSearch?.trim() || undefined,
        categoryId: selectedCategory?.value || undefined,
        brandId: selectedBrand?.value || undefined,   // ✅ backend brand filter
        sortBy: "createdAt",
        sortDirection: "desc",                         // ✅ newest first
      });
      if (res.data?.success) {
        const apiData = res.data.data;
        setTotalCount(apiData.totalCount);
        setTotalPages(apiData.totalPages);
        setProducts(apiData.items.map((p: any) => {
          const images = p.images || [];
          const mainImage = images.find((i: any) => i.isMain)?.imageUrl || images[0]?.imageUrl || "";
          return {
            id: p.id, name: p.name, sku: p.sku || "-",
            stockQuantity: Number(p.stockQuantity ?? 0),
            price: Number(p.price ?? 0),
            brandName: p.brandName ?? "",
            categoryName: p.categories?.[0]?.categoryName ?? "Uncategorized",
            image: mainImage, images,
            newStock: Number(p.stockQuantity ?? 0),
            newPrice: Number(p.price ?? 0),
          };
        }));
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setTableLoading(false);
    }
  };

const fetchFilters = async () => {
  try {
    const [catRes, brandRes] = await Promise.all([
      categoriesService.getAll({
        params: {
          includeSubCategories: true,
          includeInactive: true,
          isDeleted: false
        }
      }),
      brandsService.getAll({
        params: { includeUnpublished: false }
      }),
    ]);

    const categoriesData = Array.isArray(catRes.data?.data?.items)
      ? catRes.data.data.items
      : [];

    const brandsData = Array.isArray(brandRes.data?.data?.items)
      ? brandRes.data.data.items
      : [];

    // 🔥 FLATTEN ALL LEVELS (L1 + L2 + L3...)
    const flattenCategories = (cats: any[], level = 0): any[] => {
      let result: any[] = [];

      cats.forEach((cat) => {
        result.push({
          value: cat.id,
          label: `${'      '.repeat(level)}${cat.name}`, // indent UI
          level,
          parentId: cat.parentCategoryId || null
        });

        if (cat.subCategories && cat.subCategories.length > 0) {
          result = result.concat(
            flattenCategories(cat.subCategories, level + 1)
          );
        }
      });

      return result;
    };

    const allCategories = flattenCategories(categoriesData);

    // ✅ SORT (optional but clean)
    const sortedCategories = allCategories.sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    setCategories(sortedCategories);

    console.log("🔥 TOTAL FLATTEN CATEGORIES:", sortedCategories.length);
    console.log("🔥 FULL CATEGORY LIST:", sortedCategories);

    // ✅ BRANDS
    const sortedBrands = [...brandsData]
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((b: any) => ({
        value: b.id,
        label: b.name
      }));

    setBrands(sortedBrands);

    console.log("🔥 TOTAL BRANDS:", sortedBrands.length);

  } catch (error) {
    console.error("❌ Error fetching filters:", error);
    toast.error("Failed to load filters");
  }
};
  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => { fetchProducts(); }, [currentPage, itemsPerPage, debouncedSearch, selectedCategory, selectedBrand]);
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(h);
  }, [searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedCategory, selectedBrand]);

  // ─── Inventory update ──────────────────────────────────────────────────────
  const updateInventory = async (items: { productId: string; newStock: number; newPrice: number }[]) => {
    if (!items.length) return;
    try {
      setRowLoading(items.length === 1 ? items[0].productId : "bulk");
      const res = await productsService.bulkUpdateInventory(items);
      if (!res?.data?.success) { toast.error(res?.data?.message || "Update failed"); return; }
      toast.success(`Updated: ${res.data.data?.updated ?? 0}, Skipped: ${res.data.data?.skipped ?? 0}`);
      setProducts(prev => prev.map(p => {
        const u = items.find(i => i.productId === p.id);
        return u ? { ...p, stockQuantity: u.newStock, price: u.newPrice, newStock: u.newStock, newPrice: u.newPrice } : p;
      }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setRowLoading(null);
    }
  };

  const handleChange = (id: string, field: "newStock" | "newPrice", value: number) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const changedProducts = products.filter(p => p.newStock !== p.stockQuantity || p.newPrice !== p.price);

  const handleBulkUpdate = () => {
    const changed = changedProducts.map(p => ({ productId: p.id, newStock: p.newStock, newPrice: p.newPrice }));
    if (!changed.length) { toast.warning("No changes to save"); return; }
    updateInventory(changed);
  };

  const discardChanges = () => {
    setProducts(prev => prev.map(p => ({ ...p, newStock: p.stockQuantity, newPrice: p.price })));
    toast.info("Changes discarded");
  };

  // ─── Select / deselect ─────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleSelectAll = () => {
    setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.id)));
  };

  // ─── Export helpers ────────────────────────────────────────────────────────
  const toExcelRows = (rows: ProductRow[]) => rows.map(p => ({
    ProductId: p.id, ProductName: p.name, SKU: p.sku,
    CurrentStock: p.stockQuantity, NewStock: "",
    CurrentPrice: p.price, NewPrice: "",
  }));

const writeExcel = (rows: any[], filename: string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const blob = new Blob([wbout], {
      type: "application/octet-stream",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 0);

  } catch (e) {
    console.error("Excel write failed", e);
  }
};
  // Export all — fetches EVERY product (not just current page)
// const downloadFullTemplate = async () => {
//   try {
//   setFullLoading(true)

//     const res = await productsService.getAll({
//       page: 1,
//       pageSize: 9999,
//       sortBy: "createdAt",
//       sortDirection: "desc",
//     });

//     const items = res.data?.data?.items ?? [];

//     const rows: ProductRow[] = items.map((p: any) => ({
//       id: p.id,
//       name: p.name,
//       sku: p.sku || "-",
//       stockQuantity: Number(p.stockQuantity ?? 0),
//       price: Number(p.price ?? 0),
//       brandName: "",
//       categoryName: "",
//       image: "",
//       newStock: 0,
//       newPrice: 0,
//     }));

//     if (rows.length === 0) {
//       toast.warning("No products found to export");
//       return;
//     }

// writeExcel(toExcelRows(rows), "full-inventory.xlsx");

//     toast.success(`Exported ${rows.length} products`);
//   } catch {
//     toast.error("Export failed");
//   } finally {
//   setFullLoading(false);
// }
// };

const downloadSelectedTemplate = () => {
  if (!selected.size) {
    toast.warning("Select products first");
    return;
  }

  const selectedRows = products.filter(p => selected.has(p.id));

  if (!selectedRows.length) {
    toast.error("No valid products selected");
    return;
  }

writeExcel(toExcelRows(selectedRows), "selected-inventory.xlsx");

  toast.success(`Exported ${selectedRows.length} selected products`);

  // 🔥 THIS LINE FIXES YOUR ISSUE
  setSelected(new Set());  // 👈 clears selection → UI auto closes
};

  // ─── Upload Excel ──────────────────────────────────────────────────────────
const handleExcelUpload = async (file: File) => {
  if (!file) return;

  try {
    const res = await productsService.bulkUploadInventoryExcel(file);

    if (!res?.data) {
      toast.error("Invalid server response");
      return;
    }

    if (res.data.success) {
      const updated = res.data.data?.updated ?? 0;
      const skipped = res.data.data?.skipped ?? 0;

      if (skipped > 0) {
        toast.warning(
          `⚠️ ${skipped} item(s) were skipped because the Current Price or Stock Status does not match the latest database values. Please download the latest inventory file and try again.`
        );
      }

      if (updated > 0) {
        toast.success(`✅ ${updated} inventory item(s) updated successfully.`);
      }

      res.data.data?.errors?.forEach((err: any) =>
        toast.error(`Row ${err.row} – ${err.reason}`)
      );

      fetchProducts();
    } else {
      toast.error(res.data.message || "Excel upload failed");
    }

  } catch (e: any) {
    toast.error(e?.response?.data?.message || "Excel upload failed");
  } finally {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  // ─── Media viewer ──────────────────────────────────────────────────────────
const openMediaViewer = (images: any[], idx = 0) => {
  if (!images?.length) return;

  setViewerMedia(
    images.map((img: any) => ({
      type: "image",
      url: getImageUrl(img.imageUrl),
      title: img.altText || "Image",
      isMain: img.isMain
    }))
  );

  setViewerIndex(idx);
  setViewerOpen(true);
};

  // ─── Pagination ────────────────────────────────────────────────────────────
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(currentPage - 2, 1);
    let end   = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const hasActiveFilters = !!(debouncedSearch || selectedCategory || selectedBrand);

  // ─── Stats bar ─────────────────────────────────────────────────────────────
  const outOfStock = products.filter(p => p.stockQuantity === 0).length;
  const lowStock   = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;

  return (
    <div className="space-y-2 relative">
      {selected.size > 0 && (
      <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
          <div className="flex justify-center px-2">
            <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{selected.size} item(s) selected</p>
                  <p className="text-xs text-slate-400">Export the selected inventory rows to Excel</p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700/80" />

              <button
                onClick={downloadSelectedTemplate}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                title={`Export ${selected.size} selected inventory rows`}
              >
                <Download className="w-3.5 h-3.5" />
                Export Selected ({selected.size})
              </button>

              <button
                onClick={() => setSelected(new Set())}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
                title="Clear selected inventory rows"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Update stock & prices · {totalCount.toLocaleString()} products</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/admin/products")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold shadow-md transition-all"
          title="go to product page"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Go To Product Page
          </button>
{/* <button
  onClick={downloadFullTemplate}
  disabled={fullLoading}
  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
>
  {fullLoading ? "Exporting..." : "Export All"}
</button> */}

        <button
  onClick={() => setImportOpen(true)}
  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-all"
>
  <Upload className="w-3.5 h-3.5" />
  Upload Excel
</button>
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            ref={fileInputRef}
        onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  openConfirm(
    "Upload Inventory File",
    "This will update inventory based on the uploaded Excel file. Continue?",
    () => handleExcelUpload(file), // ✅ pass file, not event
  );
}}
          />
        </div>
      </div>

      {/* ══ STAT CHIPS ══ */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs">
          <Package className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-slate-400">Total</span>
          <span className="font-bold text-white">{totalCount.toLocaleString()}</span>
        </div>
        {outOfStock > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-slate-400">Out of stock</span>
            <span className="font-bold text-red-400">{outOfStock}</span>
            <span className="text-slate-500">(this page)</span>
          </div>
        )}
        {lowStock > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Low stock</span>
            <span className="font-bold text-amber-400">{lowStock}</span>
            <span className="text-slate-500">(this page)</span>
          </div>
        )}
        {changedProducts.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs">
            <Save className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-violet-300 font-semibold">{changedProducts.length} unsaved change(s)</span>
          </div>
        )}
      </div>

      {/* ══ FILTER BAR ══ */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search products by name or Sku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
            />
          </div>
          <div className="w-56 flex-shrink-0">
            <Select styles={selectStyles} options={categories} value={selectedCategory} onChange={setSelectedCategory}
              placeholder="All Categories" isClearable menuPortalTarget={typeof window !== "undefined" ? document.body : null} menuPosition="fixed" />
          </div>
          <div className="w-44 flex-shrink-0">
            <Select styles={selectStyles} options={brands} value={selectedBrand} onChange={setSelectedBrand}
              placeholder="All Brands" isClearable menuPortalTarget={typeof window !== "undefined" ? document.body : null} menuPosition="fixed" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory(null); setSelectedBrand(null); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex-shrink-0"
            >
              <FilterX className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ══ SHOW ENTRIES + COUNT ══ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 bg-slate-800/60 border border-slate-600 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {[25, 50, 75, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-slate-400">entries</span>
        </div>
        <div className="text-xs text-slate-400">
          {totalCount === 0 ? "No results" : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="whitespace-nowrap">
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="p-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selected.size === products.length}
                  onChange={toggleSelectAll}
                  className="rounded accent-violet-500"
                />
              </th>
              <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">SKU</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Stock Status</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">New Stock</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Current Price</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">New Price</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Save</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={8} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Loading inventory…</p>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-16 text-center text-slate-500 text-sm">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No products found
                </td>
              </tr>
            ) : products.map((p) => {
              const changed = p.newStock !== p.stockQuantity || p.newPrice !== p.price;
                const mainImage =
    p.images?.find((img: any) => img.isMain) ||
    p.images?.[0];

              return (
                <tr
                  key={p.id}
                  className={`border-b border-slate-800/60 transition-colors
                    ${selected.has(p.id) ? "bg-violet-500/5" : "hover:bg-slate-800/30"}
                    ${changed ? "bg-amber-500/5 border-l-2 border-l-amber-500/40" : ""}`}
                >
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded accent-violet-500" />
                  </td>

                  <td className="py-2 px-3 ">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer hover:border-violet-500/50 transition-colors"
                        onClick={() => p.images?.length && openMediaViewer(p.images)}
                      >
                        
                    {mainImage ? (
  <img
    src={getImageUrl(mainImage.imageUrl)}
    alt={p.name}
    className="w-full h-full object-cover pointer-events-none"
    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
    📦
  </div>
)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate max-w-[480px]">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500 truncate">{p.categoryName}</span>
                          {p.brandName && (
                            <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">{p.brandName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{p.sku}</span>
                  </td>

                  <td className="p-3 text-center">
                    <StockBadge qty={p.stockQuantity} />
                  </td>

                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={p.newStock}
                      disabled={rowLoading === p.id}
                      onChange={(e) => handleChange(p.id, "newStock", Number(e.target.value))}
                      onKeyDown={(e) => { if (e.key === "Enter" && changed) updateInventory([{ productId: p.id, newStock: p.newStock, newPrice: p.newPrice }]); }}
                      className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-violet-500 outline-none transition px-2 py-1.5
                        ${p.newStock !== p.stockQuantity ? "border-amber-500/60 bg-amber-500/5" : "border-slate-600"}`}
                    />
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-sm font-semibold text-emerald-400">£{p.price.toFixed(2)}</span>
                  </td>

                  <td className="p-3 text-center relative">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={p.newPrice}
                      disabled={rowLoading === p.id}
                      onChange={(e) => handleChange(p.id, "newPrice", Number(e.target.value))}
                      onKeyDown={(e) => { if (e.key === "Enter" && changed) updateInventory([{ productId: p.id, newStock: p.newStock, newPrice: p.newPrice }]); }}
                      className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition px-2 py-1.5
                        ${p.newPrice !== p.price ? "border-amber-500/60 bg-amber-500/5" : "border-slate-600"}`}
                    />
                    {rowLoading === p.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 rounded-lg">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {changed ? (
                      <button
                        disabled={rowLoading === p.id}
                        onClick={() => updateInventory([{ productId: p.id, newStock: p.newStock, newPrice: p.newPrice }])}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition disabled:opacity-50"
                        title="Save this row"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ══ PAGINATION ══ */}
        {totalPages > 1 && (
          <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 text-xs rounded-lg transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-slate-400">{totalCount.toLocaleString()} total</div>
          </div>
        )}
      </div>

      {/* ══ UNSAVED CHANGES BANNER ══ */}
      {changedProducts.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold text-sm">{changedProducts.length} Unsaved Change{changedProducts.length !== 1 ? "s" : ""}</p>
              <p className="text-slate-400 text-xs">Press Enter on any row to save individually, or use the buttons.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (changedProducts.length >= 5) {
                    openConfirm("Discard Changes", `Discard ${changedProducts.length} unsaved changes?`, discardChanges);
                  } else {
                    discardChanges();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                <X className="h-3.5 w-3.5" /> Discard
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={rowLoading === "bulk"}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition disabled:opacity-60"
              >
                {rowLoading === "bulk"
                  ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                  : <Save className="h-3.5 w-3.5" />}
                Save All ({changedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
{importOpen && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl">

      {/* HEADER */}
      <div className="p-5 border-b border-slate-700 flex justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Update Inventory via Excel
          </h2>
          <p className="text-slate-400 text-sm">
            Upload Excel file with inventory updates
          </p>
        </div>
        <button onClick={() => setImportOpen(false)}>
          <X className="text-slate-400" />
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* DOWNLOAD TEMPLATE */}
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
          <p className="text-white font-medium mb-1">Need a template?</p>
          <p className="text-slate-400 text-sm mb-3">
            Download sample (top 5 products)
          </p>
<button
  onClick={downloadSampleTemplate}
  disabled={sampleLoading}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-60"
>
  {sampleLoading ? "Downloading..." : "Download Sample"}
</button>
        </div>

        {/* FILE SELECT */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 p-8 rounded-xl text-center cursor-pointer hover:border-violet-500"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImportFile(f);
            }}
          />

          {importFile ? (
            <p className="text-green-400">{importFile.name}</p>
          ) : (
            <p className="text-slate-400">Click to upload Excel</p>
          )}
        </div>

        {/* ACTION */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!importFile) {
                toast.error("Select file first");
                return;
              }

              openConfirm(
                "Upload Inventory File",
                "This will update inventory based on the uploaded Excel file. Continue?",
                () => handleExcelUpload(importFile)
              );
            }}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg"
          >
            Upload & Update
          </button>

          <button
            onClick={() => {
              setImportOpen(false);
              setImportFile(null);
            }}
            className="px-4 bg-slate-700 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  </div>
)}
      <MediaViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} media={viewerMedia} initialIndex={viewerIndex} />
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title} message={confirmConfig.message} confirmText="Yes, Continue" cancelText="Cancel" />
    </div>
  );
}
