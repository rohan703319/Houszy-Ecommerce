"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "../_components/CustomToast";
import ConfirmDialog from "../_components/ConfirmDialog";
import { googleMerchantService } from "@/lib/services/GoogleMerchant";
import { Product, productsService } from "@/lib/services/products";

type ActionType = "sync-all" | "sync-selected" | "delete-selected";

interface MerchantProductRow {
  id: string;
  name: string;
  sku: string;
}

function ProductSelectionModal({
  open,
  title,
  description,
  products,
  selectedIds,
  searchTerm,
  setSearchTerm,
  loading,
  submitLabel,
  onClose,
  onToggle,
  onToggleAll,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  products: MerchantProductRow[];
  selectedIds: string[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  loading: boolean;
  submitLabel: string;
  onClose: () => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  const allSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-center justify-center py-6">
        <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/40">
          <div className="border-b border-slate-800 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by product name or SKU..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onToggleAll}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  {allSelected ? "Clear All" : "Select All"}
                </button>
                <span className="text-sm text-slate-400">
                  <span className="font-semibold text-white">{selectedIds.length}</span>{" "}
                  selected
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-slate-500">
                    No products found for this search.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {products.map((product) => {
                      const checked = selectedIds.includes(product.id);

                      return (
                        <label
                          key={product.id}
                          className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-800/40"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(product.id)}
                            className="mt-1 rounded border-slate-600 bg-slate-800 text-violet-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {product.name}
                            </p>
                            <p className="mt-1 break-all text-xs text-cyan-300">
                              SKU: {product.sku}
                            </p>
                          </div>
                          {checked && (
                            <BadgeCheck className="mt-0.5 h-4 w-4 text-violet-400" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={selectedIds.length === 0}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleMerchantSettings() {
  const toast = useToast();
  const [products, setProducts] = useState<MerchantProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [syncSearchTerm, setSyncSearchTerm] = useState("");
  const [deleteSearchTerm, setDeleteSearchTerm] = useState("");
  const [selectedSyncIds, setSelectedSyncIds] = useState<string[]>([]);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action: ActionType | null;
  }>({ open: false, action: null });
  const [actionLoading, setActionLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productsService.getAll({
        page: 1,
        pageSize: 5000,
      });

      const items = response.data?.data?.items || [];
      const normalized = items
        .filter((product: Product) => !!product.id && !!product.sku)
        .map((product: Product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
        }));

      setProducts(normalized);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredSyncProducts = useMemo(() => {
    const keyword = syncSearchTerm.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword)
    );
  }, [products, syncSearchTerm]);

  const filteredDeleteProducts = useMemo(() => {
    const keyword = deleteSearchTerm.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword)
    );
  }, [products, deleteSearchTerm]);

  const toggleSelection = (
    id: string,
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    setter((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleAllSelection = (
    source: MerchantProductRow[],
    selected: string[],
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    const visibleIds = source.map((product) => product.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

    if (allVisibleSelected) {
      setter((previous) => previous.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setter((previous) => Array.from(new Set([...previous, ...visibleIds])));
  };

  const closeSyncModal = () => {
    setSyncModalOpen(false);
    setSyncSearchTerm("");
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteSearchTerm("");
  };

  const runAction = async () => {
    if (!confirmState.action) return;

    setActionLoading(true);

    try {
      if (confirmState.action === "sync-all") {
        const response = await googleMerchantService.syncAll();
        if (response.error || response.data?.success === false) {
          throw new Error(response.error || response.data?.message || "Sync all failed");
        }
        toast.success(response.data?.message || "All products synced successfully");
      }

      if (confirmState.action === "sync-selected") {
        const selectedProducts = products.filter((product) =>
          selectedSyncIds.includes(product.id)
        );

        for (const product of selectedProducts) {
          const response = await googleMerchantService.syncProduct(product.id);
          if (response.error || response.data?.success === false) {
            throw new Error(
              response.error ||
                response.data?.message ||
                `Failed to sync ${product.name}`
            );
          }
        }

        toast.success(`${selectedProducts.length} product(s) synced successfully`);
        setSelectedSyncIds([]);
        closeSyncModal();
      }

      if (confirmState.action === "delete-selected") {
        const selectedProducts = products.filter((product) =>
          selectedDeleteIds.includes(product.id)
        );

        for (const product of selectedProducts) {
          const response = await googleMerchantService.deleteProductBySku(
            product.sku
          );
          if (response.error || response.data?.success === false) {
            throw new Error(
              response.error ||
                response.data?.message ||
                `Failed to delete ${product.sku}`
            );
          }
        }

        toast.success(
          `${selectedProducts.length} product(s) removed from Google Merchant`
        );
        setSelectedDeleteIds([]);
        closeDeleteModal();
      }
    } catch (error: any) {
      toast.error(error?.message || "Action failed");
    } finally {
      setActionLoading(false);
      setConfirmState({ open: false, action: null });
    }
  };

  const confirmMessage = useMemo(() => {
    if (confirmState.action === "sync-all") {
      return "Are you sure you want to sync all products to Google Merchant Center?";
    }

    if (confirmState.action === "sync-selected") {
      return `Are you sure you want to sync ${selectedSyncIds.length} selected product(s) to Google Merchant Center?`;
    }

    if (confirmState.action === "delete-selected") {
      return `Are you sure you want to remove ${selectedDeleteIds.length} selected product(s) from Google Merchant Center?`;
    }

    return "";
  }, [confirmState.action, selectedDeleteIds.length, selectedSyncIds.length]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Google Merchant Center
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Sync products to Google Merchant or remove products by SKU.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmState({ open: true, action: "sync-all" })}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Sync All
            </button>

            <button
              type="button"
              onClick={() => setSyncModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-violet-500/20"
            >
              <Send className="h-4 w-4" />
              Sync Products
            </button>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-rose-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete Products
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
              Sync All
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Push all available products to Google Merchant Center.
            </p>
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
              Sync Selected
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Search by product name or SKU and sync only selected items.
            </p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-rose-300">
              Delete by SKU
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Search products and remove selected SKUs from Google Merchant.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-2 text-cyan-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Loaded Products</p>
              <p className="text-xs text-slate-400">
                {loadingProducts ? "Fetching products..." : `${products.length} products available`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loadingProducts}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingProducts ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Refresh Products
          </button>
        </div>
      </div>

      <ProductSelectionModal
        open={syncModalOpen}
        title="Sync Selected Products"
        description="Search products by name or SKU, then continue to confirmation."
        products={filteredSyncProducts}
        selectedIds={selectedSyncIds}
        searchTerm={syncSearchTerm}
        setSearchTerm={setSyncSearchTerm}
        loading={loadingProducts}
        submitLabel="Continue to Confirm"
        onClose={closeSyncModal}
        onToggle={(id) => toggleSelection(id, setSelectedSyncIds)}
        onToggleAll={() =>
          toggleAllSelection(
            filteredSyncProducts,
            selectedSyncIds,
            setSelectedSyncIds
          )
        }
        onSubmit={() => setConfirmState({ open: true, action: "sync-selected" })}
      />

      <ProductSelectionModal
        open={deleteModalOpen}
        title="Delete Selected Products"
        description="Search products by name or SKU, select items, then confirm SKU removal."
        products={filteredDeleteProducts}
        selectedIds={selectedDeleteIds}
        searchTerm={deleteSearchTerm}
        setSearchTerm={setDeleteSearchTerm}
        loading={loadingProducts}
        submitLabel="Continue to Confirm"
        onClose={closeDeleteModal}
        onToggle={(id) => toggleSelection(id, setSelectedDeleteIds)}
        onToggleAll={() =>
          toggleAllSelection(
            filteredDeleteProducts,
            selectedDeleteIds,
            setSelectedDeleteIds
          )
        }
        onSubmit={() => setConfirmState({ open: true, action: "delete-selected" })}
      />

      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={() => {
          if (!actionLoading) {
            setConfirmState({ open: false, action: null });
          }
        }}
        onConfirm={runAction}
        title={
          confirmState.action === "delete-selected"
            ? "Delete Google Merchant Products"
            : "Confirm Google Merchant Action"
        }
        message={confirmMessage}
        confirmText={
          confirmState.action === "delete-selected"
            ? "Delete Products"
            : "Confirm Sync"
        }
        cancelText="Cancel"
        icon={confirmState.action === "delete-selected" ? Trash2 : RefreshCw}
        iconColor={
          confirmState.action === "delete-selected"
            ? "text-red-400"
            : "text-emerald-400"
        }
        confirmButtonStyle={
          confirmState.action === "delete-selected"
            ? "bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/40"
            : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/40"
        }
        isLoading={actionLoading}
      />
    </div>
  );
}
