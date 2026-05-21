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
import { getSelectStyles } from "../_utils/styles";
import { useTheme } from "@/app/admin/_context/theme-provider";
import React from "react";


interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isMain?: boolean;
}

interface ProductRow {
  id: string;
  variantId?: string;
  isVariant?: boolean;
  variantsCount?: number;
  productType?: string;
  compareAtPrice?: number;
  parentId?: string;
  parentName?: string;
  oldPrice?: number;
  name: string;
  sku: string;
  slug: string;
  stockQuantity: number;
  price: number;

  newStock: number;
  newPrice: number;
  newOldPrice: number;

  brandName: string;
  categoryName: string;

  image?: string;
  images?: ProductImage[];

  variants?: ProductRow[];
}

interface SelectOption {
  value: string;
  label: string;
}



function StockBadge({ qty }: { qty: number }) {
  if (qty === 0)
    return <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[8px] font-semibold bg-red-500/15 text-red-400"><AlertTriangle className="h-2 w-2" />Out</span>;
  if (qty <= 5)
    return <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[8px] font-semibold bg-amber-500/15 text-amber-400"><AlertTriangle className="h-2 w-2" />Low ({qty})</span>;
  return <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[8px] font-semibold bg-emerald-500/15 text-emerald-400"><CheckCircle2 className="h-2 w-2" />{qty}</span>;
}

export default function InventoryPage() {
  const toast = useToast();
  const router = useRouter();
  const { theme } = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme === 'dark'), [theme]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<SelectOption | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [productType, setSelectedProductType] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tableLoading, setTableLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<MediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; message: string; onConfirm: () => void;
  }>({ title: "", message: "", onConfirm: () => { } });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, onConfirm });
    setConfirmOpen(true);
  };

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const getRowKey = (p: ProductRow) => p.variantId ? `${p.id}-${p.variantId}` : p.id;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedProductType("all");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setCurrentPage(1);
  };

  const downloadSampleTemplate = async () => {
    try {
      setSampleLoading(true);
      const res = await productsService.inventorySampleExcel();
      const blob = new Blob([res.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventory-sample.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Sample downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    } finally {
      setSampleLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setTableLoading(true);
      const params: any = {
        page: currentPage,
        pageSize: itemsPerPage,
        sortBy: "createdAt",
        sortDirection: "desc",
      };
      if (debouncedSearch?.trim()) params.searchTerm = debouncedSearch.trim();
      if (selectedStatus !== "all") params.stockStatus = selectedStatus;
      if (productType !== "all") params.productType = productType;
      if (selectedCategory?.value) params.categoryId = selectedCategory.value;
      if (selectedBrand?.value) params.brandId = selectedBrand.value;

      const res = await productsService.getAll(params);
      if (res.data?.success) {
        const apiData = res.data.data;
        const search = debouncedSearch.trim().toLowerCase();
        setTotalCount(apiData.totalCount);
        setTotalPages(apiData.totalPages);

        const rows: ProductRow[] = [];
        const autoExpand = new Set<string>();

        apiData.items.forEach((p: any) => {
          const variants = Array.isArray(p.variants) ? p.variants : [];
          const images = Array.isArray(p.images) ? p.images : [];
          const mainImage = images.find((img: any) => img.isMain)?.imageUrl || images[0]?.imageUrl || "";

          const parentMatched = !search || p.name?.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search);
          const matchedVariants = variants.filter((v: any) => !search || v.name?.toLowerCase().includes(search) || v.sku?.toLowerCase().includes(search));

          const variantRows: ProductRow[] = matchedVariants.map((v: any) => ({
            id: p.id,
            parentId: p.id,
            parentName: p.name,
            slug: v.slug || p.slug,
            variantId: v.id,
            isVariant: true,
            image: mainImage,
            images,
            name: v.name,
            sku: v.sku,
            stockQuantity: Number(v.stockQuantity ?? 0),
            price: Number(v.price ?? 0),
            oldPrice: Number(v.compareAtPrice ?? 0),
            newStock: Number(v.stockQuantity ?? 0),
            newPrice: Number(v.price ?? 0),
            newOldPrice: Number(v.compareAtPrice ?? 0),
            brandName: p.brandName ?? "",
            categoryName: p.categories?.[0]?.categoryName || "",
          }));

          if (parentMatched) {
            rows.push({
              id: p.id,
              isVariant: false,
              productType: p.productType || "simple",
              variantsCount: variants.length,
              slug: p.slug,
              name: p.name,
              sku: p.sku,
              image: mainImage,
              images,
              stockQuantity: Number(p.stockQuantity ?? 0),
              price: Number(p.price ?? 0),
              oldPrice: Number(p.oldPrice ?? 0),
              newStock: Number(p.stockQuantity ?? 0),
              newPrice: Number(p.price ?? 0),
              newOldPrice: Number(p.oldPrice ?? 0),
              brandName: p.brandName ?? "",
              categoryName: p.categories?.[0]?.categoryName || "",
              variants: variants.map((v: any) => ({
                id: p.id,
                parentId: p.id,
                parentName: p.name,
                slug: v.slug || p.slug,
                variantId: v.id,
                isVariant: true,
                name: v.name,
                sku: v.sku,
                stockQuantity: Number(v.stockQuantity ?? 0),
                price: Number(v.price ?? 0),
                oldPrice: Number(v.compareAtPrice ?? 0),
                newStock: Number(v.stockQuantity ?? 0),
                newPrice: Number(v.price ?? 0),
                newOldPrice: Number(v.compareAtPrice ?? 0),
                image: v.imageUrl || mainImage,
                images,
                brandName: p.brandName ?? "",
                categoryName: p.categories?.[0]?.categoryName || "",
              })),
            });
            if (search && variants.length > 0) autoExpand.add(p.id);
            return;
          }

          if (variantRows.length > 0) {
            rows.push({
              id: p.id,
              isVariant: false,
              productType: p.productType || "simple",
              variantsCount: variants.length,
              slug: p.slug,
              name: p.name,
              sku: p.sku,
              image: mainImage,
              images,
              stockQuantity: Number(p.stockQuantity ?? 0),
              price: Number(p.price ?? 0),
              oldPrice: Number(p.oldPrice ?? 0),
              newStock: Number(p.stockQuantity ?? 0),
              newPrice: Number(p.price ?? 0),
              newOldPrice: Number(p.oldPrice ?? 0),
              brandName: p.brandName ?? "",
              categoryName: p.categories?.[0]?.categoryName || "",
              variants: variantRows,
            });
            autoExpand.add(p.id);
          }
        });
        setExpandedRows(autoExpand);
        setProducts(rows);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, productType, selectedStatus, selectedCategory, selectedBrand]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus, productType, selectedCategory, selectedBrand]);

  const fetchFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        categoriesService.getAll({ params: { includeSubCategories: true, includeInactive: true, isDeleted: false } }),
        brandsService.getAll({ params: { includeUnpublished: false } }),
      ]);
      const categoriesData = Array.isArray(catRes.data?.data?.items) ? catRes.data.data.items : [];
      const brandsData = Array.isArray(brandRes.data?.data?.items) ? brandRes.data.data.items : [];

      const flattenCategories = (cats: any[], prefix = "", level = 0): any[] => {
        let result: any[] = [];
        cats.forEach((cat) => {
          let name = level === 0 ? cat.name : level === 1 ? `${prefix} > ${cat.name}` : `${prefix} >> ${cat.name}`;
          result.push({ value: cat.id, label: name, level, parentId: cat.parentCategoryId || null });
          if (cat.subCategories && cat.subCategories.length > 0) {
            result = result.concat(flattenCategories(cat.subCategories, name, level + 1));
          }
        });
        return result;
      };

      const allCategories = flattenCategories(categoriesData);
      setCategories(allCategories.sort((a, b) => a.label.localeCompare(b.label)));
      setBrands(brandsData.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((b: any) => ({ value: b.id, label: b.name })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load filters");
    }
  };
  useEffect(() => { fetchFilters(); }, []);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const updateInventory = async (items: { productId: string; variantId?: string; newStock: number; newPrice: number; newOldPrice: number; }[]) => {
    if (!items.length) return;
    try {
      setRowLoading(items.length === 1 ? `${items[0].productId}-${items[0].variantId || "main"}` : "bulk");
      const res = await productsService.bulkUpdateInventory(items);
      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Update failed");
        return;
      }
      toast.success(`Updated: ${res.data.data?.updated ?? 0}, Skipped: ${res.data.data?.skipped ?? 0}`);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setRowLoading(null);
    }
  };

  const handleChange = (productId: string, variantId: string | undefined, field: "newStock" | "newPrice" | "newOldPrice", value: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId && !variantId) return { ...p, [field]: value };
        return {
          ...p,
          variants: p.variants?.map((v) => v.variantId === variantId ? { ...v, [field]: value } : v) || [],
        };
      })
    );
  };

  const changedProducts = products.flatMap((p) => {
    const rows = [];
    if (p.newStock !== p.stockQuantity || p.newPrice !== p.price || p.newOldPrice !== (p.oldPrice ?? 0)) rows.push(p);
    if ((p.variants?.length ?? 0) > 0) {
      p.variants?.forEach((v) => {
        if (v.newStock !== v.stockQuantity || v.newPrice !== v.price || v.newOldPrice !== (v.oldPrice ?? 0)) rows.push(v);
      });
    }
    return rows;
  });

  const handleBulkUpdate = () => {
    const invalidProducts = changedProducts.filter(p => p.newOldPrice > 0 && p.newOldPrice <= p.newPrice);
    
    if (invalidProducts.length > 0) {
      toast.error(`Invalid Prices: Old Price must be greater than New Price for ${invalidProducts.length} product(s).`);
      return;
    }

    const changed = changedProducts.map((p) => ({
      productId: p.id,
      variantId: p.variantId || undefined,
      newStock: p.newStock,
      newPrice: p.newPrice,
      newOldPrice: p.newOldPrice,
    }));

    if (!changed.length) {
      toast.warning("No changes to save");
      return;
    }

    updateInventory(changed);
  };

  const discardChanges = () => {
    setProducts(prev =>
      prev.map(p => ({
        ...p,
        newStock: p.stockQuantity,
        newPrice: p.price,
        newOldPrice: p.oldPrice ?? 0,
        variants: p.variants?.map(v => ({
          ...v,
          newStock: v.stockQuantity,
          newPrice: v.price,
          newOldPrice: v.oldPrice ?? 0,
        })) || [],
      }))
    );
    toast.info("Changes discarded");
  };

  const toggleSelect = (p: ProductRow) => {
    const s = new Set(selected);
    const rowKey = getRowKey(p);
    if (s.has(rowKey)) {
      s.delete(rowKey);
      if (!p.isVariant && p.variants) p.variants.forEach((v) => s.delete(`${p.id}-${v.variantId}`));
    } else {
      s.add(rowKey);
      if (!p.isVariant && p.variants) p.variants.forEach((v) => s.add(`${p.id}-${v.variantId}`));
    }
    setSelected(s);
  };

  const toggleSelectAll = () => {
    const allKeys = products.flatMap((p) => [getRowKey(p), ...(p.variants?.map(v => `${p.id}-${v.variantId}`) || [])]);
    setSelected(selected.size === allKeys.length ? new Set() : new Set(allKeys));
  };

  const toExcelRows = (rows: ProductRow[]) =>
    rows.map((p) => ({
      ProductId: p.parentId || p.id,
      ProductName: p.isVariant ? p.parentName || p.name : p.name,
      SKU: p.sku,
      VariantId: p.variantId || "",
      VariantName: p.isVariant ? p.name : "",
      CurrentStock: p.stockQuantity,
      NewStock: "",
      CurrentPrice: p.price,
      NewPrice: "",
      CurrentOldPrice: p.oldPrice ?? 0,
      NewOldPrice: "",
    }));

  const writeExcel = (rows: any[], filename: string) => {
    try {
      const data = [
        ["ProductId", "ProductName (ref)", "SKU (ref)", "VariantId (optional)", "VariantName (ref)", "CurrentStock (ref)", "NewStock", "CurrentPrice (ref)", "NewPrice", "CurrentOldPrice (ref)", "NewOldPrice"],
        ...rows.map((r) => [r.ProductId || "", r.ProductName || "", r.SKU || "", r.VariantId || "", r.VariantName || "", r.CurrentStock ?? "", r.NewStock ?? "", r.CurrentPrice ?? "", r.NewPrice ?? "", r.CurrentOldPrice ?? "", r.NewOldPrice ?? ""]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws["!cols"] = [{ wch: 38 }, { wch: 26 }, { wch: 14 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Update");
      XLSX.writeFile(wb, filename);
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed");
    }
  };

  const downloadSelectedTemplate = () => {
    if (!selected.size) { toast.warning("Select products first"); return; }
    const selectedRows: ProductRow[] = [];
    products.forEach((p) => {
      if (selected.has(getRowKey(p))) selectedRows.push({ ...p, variants: undefined });
      p.variants?.forEach((v) => {
        if (selected.has(`${p.id}-${v.variantId}`)) selectedRows.push({ ...v, id: p.id, parentId: p.id, isVariant: true });
      });
    });
    if (!selectedRows.length) { toast.error("No valid products selected"); return; }
    writeExcel(toExcelRows(selectedRows), "selected-inventory.xlsx");
    toast.success(`Exported ${selectedRows.length} selected rows`);
    setSelected(new Set());
  };

  const handleExcelUpload = async (file: File) => {
    if (!file) return;
    try {
      const res = await productsService.bulkUploadInventoryExcel(file);
      if (res?.data?.success) {
        const updated = res.data.data?.updated ?? 0;
        const skipped = res.data.data?.skipped ?? 0;
        if (res.data.message) toast.info(res.data.message);
        if (skipped > 0) toast.warning(`⚠️ ${skipped} item(s) skipped. Latest data required.`);
        if (updated > 0) toast.success(`✅ ${updated} item(s) updated.`);
        res.data.data?.errors?.forEach((err: any) => toast.error(`Row ${err.row} – ${err.reason}`));
        await fetchProducts();
        setImportOpen(false);
        setImportFile(null);
      } else {
        toast.error(res?.data?.message || "Excel upload failed");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Excel upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openMediaViewer = (images: any[], idx = 0) => {
    if (!images?.length) return;
    setViewerMedia(images.map((img: any) => ({ type: "image", url: getImageUrl(img.imageUrl), title: img.altText || "Image", isMain: img.isMain })));
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const hasActiveFilters = searchTerm.trim() !== "" || selectedStatus !== "all" || (selectedCategory && selectedCategory.value !== "all") || productType !== "all" || (selectedBrand && selectedBrand.value !== "all");
  const outOfStock = products.filter(p => p.stockQuantity === 0).length;
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;

  return (
    <div className="space-y-2 relative">
      {selected.size > 0 && (
        <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
          <div className="flex justify-center px-2">
            <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{selected.size} item(s) selected</p>
                  <p className="text-xs text-slate-400">Export the selected inventory rows to Excel</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700/80" />
              <button onClick={downloadSelectedTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                <Download className="w-3.5 h-3.5" /> Export Selected ({selected.size})
              </button>
              <button onClick={() => setSelected(new Set())} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">Inventory Management</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {outOfStock > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs"><AlertTriangle className="h-3.5 w-3.5 text-red-400" /><span className="text-slate-400">Out of stock</span><span className="font-bold text-red-400">{outOfStock}</span></div>}
            {lowStock > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs"><TrendingUp className="h-3.5 w-3.5 text-amber-400" /><span className="text-slate-400">Low stock</span><span className="font-bold text-amber-400">{lowStock}</span></div>}
            {changedProducts.length > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs"><Save className="h-3.5 w-3.5 text-violet-400" /><span className="text-violet-300 font-semibold">{changedProducts.length} unsaved change(s)</span></div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => router.push("/admin/products")} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 rounded-lg font-semibold transition-all"><ShoppingCart className="w-3.5 h-3.5" />Go to Products</button>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-all"><Upload className="w-3.5 h-3.5" />Update Inventory</button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-1">Update stock & prices · {totalCount.toLocaleString()} products</p>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl px-2 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all" />
          </div>
          <div className="w-[280px] flex-shrink-0"><Select instanceId="inv-category-select" styles={selectStyles} options={categories} value={selectedCategory} onChange={setSelectedCategory} placeholder="All Categories" isClearable /></div>
          <div className="w-32 flex-shrink-0"><Select instanceId="inv-brand-select" styles={selectStyles} options={brands} value={selectedBrand} onChange={setSelectedBrand} placeholder="All Brands" isClearable /></div>
          <div className="w-32 flex-shrink-0">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-2 py-[9px] bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="all">All Status</option>
              <option value="InStock">In Stock</option>
              <option value="LowStock">Low Stock</option>
              <option value="OutOfStock">Out Of Stock</option>
            </select>
          </div>
          <div className="w-32 flex-shrink-0">
            <select value={productType} onChange={(e) => setSelectedProductType(e.target.value)} className="w-full px-2 py-[9px] bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">grouped</option>
            </select>
          </div>
          {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold whitespace-nowrap"><FilterX className="w-3.5 h-3.5" />Clear</button>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Show</span>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:outline-none">
            {[25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-slate-400">entries</span>
        </div>
        <div className="text-xs text-slate-400">{totalCount === 0 ? "No results" : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount.toLocaleString()}`}</div>
      </div>

      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
        <table className="w-full text-xs table-auto">
          <thead className="whitespace-nowrap">
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="p-2.5 text-center w-10">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === products.flatMap(p => [getRowKey(p), ...(p.variants?.map(v => `${p.id}-${v.variantId}`) || [])]).length}
                  onChange={toggleSelectAll}
                  className="rounded accent-violet-500 w-3.5 h-3.5"
                />
              </th>
              <th className="p-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider min-w-[220px]">Product</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-28">SKU</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-20">Stock</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-24">New Stock</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-24">Current Price</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-24">New Price</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-24">Curr. Old</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-24">New Old</th>
              <th className="p-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider w-12">Save</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr><td colSpan={10} className="p-12 text-center text-slate-400 text-sm">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={10} className="p-12 text-center text-slate-500 text-sm"><Package className="h-10 w-10 mx-auto mb-2 opacity-20" />No products found</td></tr>
            ) : (
              products.map((p) => {
                const changed = p.newStock !== p.stockQuantity || p.newPrice !== p.price || p.newOldPrice !== (p.oldPrice ?? 0);
                const priceInvalid = p.newOldPrice > 0 && p.newOldPrice <= p.newPrice;

                return (
                  <React.Fragment key={getRowKey(p)}>
                    <tr className={`border-b border-slate-800/40 transition-colors ${selected.has(getRowKey(p)) ? "bg-violet-500/5" : "hover:bg-slate-800/20"} ${changed ? "bg-amber-500/5 border-l-2 border-l-amber-500/40" : ""} ${priceInvalid ? "bg-red-500/5" : ""}`}>
                      <td className="p-2.5 text-center">
                        <input type="checkbox" checked={selected.has(getRowKey(p))} onChange={() => toggleSelect(p)} className="rounded accent-violet-500 w-3.5 h-3.5" />
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(p.image || "")} alt={p.name} onClick={() => openMediaViewer(p.images || [], 0)} className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-800 flex-shrink-0 object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`/product/${p.variants?.[0]?.slug || p.slug}`} target="_blank" rel="noopener noreferrer" className="group block" title={p.name}>
                                <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-cyan-400 max-w-[300px] lg:max-w-[550px]">{p.name}</p>
                              </a>
                              {(p.variants?.length ?? 0) > 0 && <button onClick={() => toggleExpand(p.id)} className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700 flex items-center justify-center">{expandedRows.has(p.id) ? "−" : "+"}</button>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {p.brandName && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">{p.brandName}</span>}
                              {p.categoryName && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{p.categoryName}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        {!p.isVariant && p.productType === "variable" ? (
                          <span className="text-xs font-semibold text-violet-300">{p.variantsCount} Var</span>
                        ) : (
                          <span
                            onClick={() => {
                              navigator.clipboard.writeText(p.sku || "");
                              toast.success("SKU copied", { position: "top-center", autoClose: 1200 });
                            }}
                            className="text-xs font-mono text-slate-400 bg-slate-800/50 hover:bg-slate-700 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="Click to copy SKU"
                          >
                            {p.sku || "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center"><StockBadge qty={p.stockQuantity} /></td>
                      <td className="p-2.5 text-center">
                        <input type="number" min={0} value={p.newStock} onChange={(e) => handleChange(p.id, undefined, "newStock", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${p.newStock !== p.stockQuantity ? "border-amber-500/60 bg-amber-500/5" : "border-slate-700"}`} />
                      </td>
                      <td className="p-2.5 text-center"><span className="text-sm font-bold text-emerald-400">£{p.price.toFixed(2)}</span></td>
                      <td className="p-2.5 text-center relative">
                        <input type="number" min={0} step="0.01" value={p.newPrice} onChange={(e) => handleChange(p.id, undefined, "newPrice", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${p.newPrice !== p.price ? "border-amber-500/60 bg-amber-500/5" : "border-slate-700"} ${priceInvalid ? "border-red-500 ring-1 ring-red-500/50" : ""}`} />
                        {rowLoading === p.id && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-lg"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}
                      </td>
                      <td className="p-2.5 text-center"><span className="text-sm text-slate-500 line-through">£{(p.oldPrice ?? 0).toFixed(2)}</span></td>
                      <td className="p-2.5 text-center relative">
                        <input type="number" min={0} step="0.01" value={p.newOldPrice} onChange={(e) => handleChange(p.id, undefined, "newOldPrice", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${p.newOldPrice !== (p.oldPrice ?? 0) ? "border-amber-500/60 bg-amber-500/5" : "border-slate-700"} ${priceInvalid ? "border-red-500 ring-1 ring-red-500/50" : ""}`} />
                        {priceInvalid && (
                          <div className="absolute -top-1 right-0 translate-x-1/2 bg-red-600 text-white text-[8px] px-1 rounded shadow-lg z-10 font-bold" title="Old Price must be greater than New Price">
                            ?
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">{changed ? <button disabled={priceInvalid} onClick={() => updateInventory([{ productId: p.id, newStock: p.newStock, newPrice: p.newPrice, newOldPrice: p.newOldPrice }])} className={`p-2 rounded-lg transition-colors ${priceInvalid ? "bg-slate-800 text-slate-600 cursor-not-allowed border-slate-700" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"}`} title={priceInvalid ? "Old Price must be > New Price" : "Save Changes"}><Save className="h-4 w-4" /></button> : <span className="text-slate-800">—</span>}</td>
                    </tr>
                    {expandedRows.has(p.id) && p.variants?.map((v) => {
                      const vChanged = v.newStock !== v.stockQuantity || v.newPrice !== v.price || v.newOldPrice !== (v.oldPrice ?? 0);
                      const vPriceInvalid = v.newOldPrice > 0 && v.newOldPrice <= v.newPrice;
                      return (
                        <tr key={`${p.id}-${v.variantId}`} className={`bg-slate-950/40 border-b border-slate-800/30 transition-colors ${selected.has(`${p.id}-${v.variantId}`) ? "bg-violet-500/5" : "hover:bg-slate-900/40"} ${vPriceInvalid ? "bg-red-500/5" : ""}`}>
                          <td className="p-2.5 text-center">
                            <input type="checkbox" checked={selected.has(`${p.id}-${v.variantId}`)} onChange={() => toggleSelect(v)} className="rounded accent-violet-500 w-3.5 h-3.5" />
                          </td>
                          <td className="py-2 px-2.5 pl-10">
                            <div className="flex items-center gap-3">
                              <img src={getImageUrl(v.image || p.image || "")} alt={v.name} className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 object-cover" />
                              <a href={`/product/${v.slug || p.slug}`} target="_blank" rel="noopener noreferrer" className="group truncate" title={v.name}>
                                <span className="text-sm text-slate-300 transition-colors group-hover:text-cyan-400 max-w-[250px] lg:max-w-[500px] inline-block truncate align-middle font-medium">{v.name}</span>
                              </a>
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              onClick={() => {
                                navigator.clipboard.writeText(v.sku || "");
                                toast.success("SKU copied", { position: "top-center", autoClose: 1200 });
                              }}
                              className="text-xs font-mono text-slate-500 bg-slate-800/30 hover:bg-slate-700 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="Click to copy SKU"
                            >
                              {v.sku || "—"}
                            </span>
                          </td>
                          <td className="p-2.5 text-center"><StockBadge qty={v.stockQuantity} /></td>
                          <td className="p-2.5 text-center"><input type="number" min={0} value={v.newStock} onChange={(e) => handleChange(p.id, v.variantId, "newStock", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${v.newStock !== v.stockQuantity ? "border-amber-500/40 bg-amber-500/5" : "border-slate-700"}`} /></td>
                          <td className="p-2.5 text-center"><span className="text-sm font-semibold text-emerald-400/80">£{v.price.toFixed(2)}</span></td>
                          <td className="p-2.5 text-center relative">
                            <input type="number" min={0} step="0.01" value={v.newPrice} onChange={(e) => handleChange(p.id, v.variantId, "newPrice", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${v.newPrice !== v.price ? "border-amber-500/40 bg-amber-500/5" : "border-slate-700"} ${vPriceInvalid ? "border-red-500 ring-1 ring-red-500/50" : ""}`} />
                          </td>
                          <td className="p-2.5 text-center"><span className="text-xs text-slate-600 line-through">£{(v.oldPrice ?? 0).toFixed(2)}</span></td>
                          <td className="p-2.5 text-center relative">
                            <input type="number" min={0} step="0.01" value={v.newOldPrice} onChange={(e) => handleChange(p.id, v.variantId, "newOldPrice", Number(e.target.value))} className={`w-20 bg-slate-800 border rounded-lg text-white text-center text-sm px-2 py-1.5 ${v.newOldPrice !== (v.oldPrice ?? 0) ? "border-amber-500/40 bg-amber-500/5" : "border-slate-700"} ${vPriceInvalid ? "border-red-500 ring-1 ring-red-500/50" : ""}`} />
                            {vPriceInvalid && (
                              <div className="absolute -top-1 right-0 translate-x-1/2 bg-red-600 text-white text-[8px] px-1 rounded shadow-lg z-10 font-bold" title="Old Price must be greater than New Price">
                                ?
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center">{vChanged ? <button disabled={vPriceInvalid} onClick={() => updateInventory([{ productId: p.id, variantId: v.variantId, newStock: v.newStock, newPrice: v.newPrice, newOldPrice: v.newOldPrice }])} className={`p-2 rounded-lg transition-colors ${vPriceInvalid ? "bg-slate-800 text-slate-600 cursor-not-allowed border-slate-700" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"}`} title={vPriceInvalid ? "Old Price must be > New Price" : "Save Changes"}><Save className="h-4 w-4" /></button> : <span className="text-slate-800">—</span>}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"><ChevronsLeft className="h-4 w-4" /></button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              {getPageNumbers().map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[32px] h-8 text-xs rounded-lg transition-all ${currentPage === page ? "bg-violet-600 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"><ChevronsRight className="h-4 w-4" /></button>
              </div>
          </div>
        )}
      </div>

      {changedProducts.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-xl px-5 py-3 flex items-center justify-between gap-4 shadow-2xl">
            <div>
              <p className="text-white font-semibold text-sm">{changedProducts.length} Unsaved Changes</p>
              <p className="text-slate-400 text-xs">Save all changes at once.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={discardChanges} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition">Discard</button>
              <button onClick={handleBulkUpdate} disabled={rowLoading === "bulk"} className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition disabled:opacity-60">
                {rowLoading === "bulk" ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : "Save All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Update Inventory via Excel</h2>
                <p className="text-slate-400 text-xs">Upload Excel file with inventory updates</p>
              </div>
              <button onClick={() => setImportOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-white text-sm font-medium mb-1">Need a template?</p>
                <button onClick={downloadSampleTemplate} disabled={sampleLoading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-60">{sampleLoading ? "Downloading..." : "Download Sample"}</button>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-600 p-8 rounded-xl text-center cursor-pointer hover:border-violet-500 transition">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                {importFile ? <p className="text-green-400 text-sm">{importFile.name}</p> : <p className="text-slate-400 text-sm">Click to upload Excel</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => importFile ? openConfirm("Upload Inventory File", "Continue with upload?", () => handleExcelUpload(importFile)) : toast.error("Select file first")} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold">Upload & Update</button>
                <button onClick={() => { setImportOpen(false); setImportFile(null); }} className="px-4 bg-slate-700 text-white rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <MediaViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} media={viewerMedia} initialIndex={viewerIndex} />
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} confirmText="Yes, Continue" cancelText="Cancel" />
    </div>
  );
}
