'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/_components/CustomToast';
import { useDebounce } from '@/app/admin/_hooks/useDebounce';
import { staffService, type StaffItem, type StaffListQueryParams, type StaffRole } from '@/lib/services/staff';
import { getBackendErrors, getBackendMessage } from '@/app/admin/_utils/errorUtils';
import {
  BulkSelectionBar,
  exportStaffToXlsx,
  ResetPasswordModal,
  StaffConfirmDialogs,
  StaffFilters,
  StaffFormModal,
  StaffPagination,
  StaffTable,
  StaffViewModal,
  type StaffAction,
} from './StaffComponents';

type ListState = {
  items: StaffItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export default function StaffPage() {
  const toast = useToast();
  const router = useRouter();

  const [query, setQuery] = useState<StaffListQueryParams>(() => ({
    page: 1,
    pageSize: 20,
    searchTerm: '',
    role: undefined,
    isActive: undefined,  
    sortBy: 'createdAt',
    sortDirection: 'desc',
  }));

  const debouncedSearch = useDebounce(query.searchTerm || '', 500);
  const [searching, setSearching] = useState(false);

  const effectiveQuery = useMemo<StaffListQueryParams>(() => {
    return { ...query, searchTerm: debouncedSearch };
  }, [query, debouncedSearch]);

  useEffect(() => {
    if ((query.searchTerm || '') === '') {
      setSearching(false);
      return;
    }
    setSearching(true);
  }, [query.searchTerm]);

  useEffect(() => {
    setSearching(false);
  }, [debouncedSearch]);

  const isAnyFilterActive = useMemo(() => {
    const hasSearch = (query.searchTerm || '').trim().length > 0;
    const hasRole = !!query.role;
    const hasStatus = query.isActive !== undefined;
    const hasSortBy = (query.sortBy || 'createdAt') !== 'createdAt';
    const hasSortDir = (query.sortDirection || 'desc') !== 'desc';
    const hasPageSize = (query.pageSize || 20) !== 20;
    return hasSearch || hasRole || hasStatus || hasSortBy || hasSortDir || hasPageSize;
  }, [query]);

  const [list, setList] = useState<ListState>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  });
  const [roles, setRoles] = useState<StaffRole[]>([]);

  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<StaffItem | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<StaffItem | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffItem | null>(null);

  const [confirmOpen, setConfirmOpen] = useState({ toggle: false, delete: false });
  const [confirmTarget, setConfirmTarget] = useState<StaffItem | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const fetchRoles = useCallback(async () => {
    const res = await staffService.getRoles();
    if (res.data?.success) {
      setRoles(res.data.data || []);
      return;
    }
    toast.error(res.data?.message || 'Failed to load roles');
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffService.getAll(effectiveQuery);
      if (res.data?.success) {
        const d = res.data.data;
        setList({
          items: d.items || [],
          totalCount: d.totalCount || 0,
          page: d.page || effectiveQuery.page || 1,
          pageSize: d.pageSize || effectiveQuery.pageSize || 20,
          totalPages: d.totalPages || 1,
          hasPrevious: d.hasPrevious || false,
          hasNext: d.hasNext || false,
        });
      } else {
        toast.error(res.data?.message || 'Failed to load staff');
      }
    } catch (e: any) {
     const errors = getBackendErrors(e);

toast.error(
  <div className="space-y-1">
    {errors.map((err, i) => (
      <div key={i}>• {err}</div>
    ))}
  </div>
);
    } finally {
      setLoading(false);
    }
  }, [effectiveQuery]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    // prune selections that are no longer visible
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(list.items.map((i) => i.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [list.items]);

  const onQueryChange = useCallback((patch: Partial<StaffListQueryParams>) => {
    setQuery((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setQuery({
      page: 1,
      pageSize: 20,
      searchTerm: '',
      role: undefined,
      isActive: undefined,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  }, []);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback((checked: boolean) => {
    setSelectedIds(() => {
      if (!checked) return new Set();
      return new Set(list.items.map((i) => i.id));
    });
  }, [list.items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const exportSelected = useCallback(() => {
    const rows = list.items.filter((i) => selectedIds.has(i.id));
    exportStaffToXlsx(`staff_selected_${new Date().toISOString().slice(0, 10)}.xlsx`, rows);
    clearSelection();
  }, [list.items, selectedIds, clearSelection]);

  const exportCurrentPage = useCallback(() => {
    exportStaffToXlsx(`staff_page_${new Date().toISOString().slice(0, 10)}.xlsx`, list.items);
  }, [list.items]);

  const openCreate = useCallback(() => {
    setFormMode('create');
    setEditingItem(null);
    setFormOpen(true);
  }, []);

const handleAction = useCallback(
  (action: StaffAction) => {
    switch (action.type) {
      case 'create':
        openCreate();
        break;

      case 'edit':
        setFormMode('edit');
        setEditingItem(action.item);
        setFormOpen(true);
        break;

      case 'view':
        setViewItem(null);
        setViewOpen(true);
        setViewLoading(true);

        staffService
          .getById(action.id)
          .then((res) => {
            if (res.data?.success) {
              setViewItem(res.data.data);
            } else {
              const errors = getBackendErrors(res);

              toast.error(
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              );
            }
          })
          .catch((e: any) => {
            const errors = getBackendErrors(e);

            toast.error(
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            );
          })
          .finally(() => setViewLoading(false));
        break;

      case 'resetPassword':
        setResetTarget(action.item);
        setResetOpen(true);
        break;

      case 'toggle':
        setConfirmTarget(action.item);
        setConfirmOpen((p) => ({ ...p, toggle: true }));
        break;

      case 'delete':
        setConfirmTarget(action.item);
        setConfirmOpen((p) => ({ ...p, delete: true }));
        break;
    }
  },
  [openCreate]
);
  const closeConfirm = useCallback((kind: 'toggle' | 'delete') => {
    setConfirmOpen((p) => ({ ...p, [kind]: false }));
    setConfirmTarget(null);
  }, []);

const confirmAction = useCallback(
  async (kind: 'toggle' | 'delete') => {
    if (!confirmTarget) return;

    try {
      setMutating(true);

      const res =
        kind === 'toggle'
          ? await staffService.toggleStatus(confirmTarget.id)
          : await staffService.remove(confirmTarget.id);

      if (res.data?.success) {
        toast.success(res.data.message);
        closeConfirm(kind);
        fetchList();
      } else {
        const errors = getBackendErrors(res);

        toast.error(
          <div className="space-y-1">
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        );
      }
    } catch (e: any) {
      const errors = getBackendErrors(e);

      toast.error(
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      );
    } finally {
      setMutating(false);
    }
  },
  [confirmTarget, closeConfirm, fetchList]
);

const submitForm = useCallback(
  async (payload: any) => {
    try {
      setMutating(true);

      const res =
        formMode === 'create'
          ? await staffService.create(payload)
          : editingItem
          ? await staffService.update(editingItem.id, payload)
          : null;

      if (!res) return;

      if (res.data?.success) {
        toast.success(res.data.message);
        setFormOpen(false);
        setEditingItem(null);
        fetchList();
      } else {
        // 🔥 handle non-200 but success=false
        const errors = getBackendErrors(res);

        toast.error(
          <div className="space-y-1">
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        );
      }
    } catch (e: any) {
      // 🔥 ASP.NET validation (400)
      const errors = getBackendErrors(e);

      toast.error(
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      );
    } finally {
      setMutating(false);
    }
  },
  [formMode, editingItem, fetchList]
);

const submitReset = useCallback(
  async (newPassword: string) => {
    if (!resetTarget) return;

    try {
      setMutating(true);

      const res = await staffService.resetPassword(resetTarget.id, { newPassword });

      if (res.data?.success) {
        toast.success(res.data.message);
        setResetOpen(false);
        setResetTarget(null);
      } else {
        const errors = getBackendErrors(res);

        toast.error(
          <div className="space-y-1">
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        );
      }
    } catch (e: any) {
      const errors = getBackendErrors(e);

      toast.error(
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      );
    } finally {
      setMutating(false);
    }
  },
  [resetTarget]
);

  return (
    <div className="space-y-2">
      <BulkSelectionBar count={selectedIds.size} onExport={exportSelected} onClear={clearSelection} />
      <div
        className="sticky z-30 -mx-4 px-4 py-3 border-b border-slate-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-end gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Staff Management
              </h1>
              <div className="text-sm text-slate-400 mb-1">{list.totalCount} staff</div>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">Create, manage roles, and control staff access</p>
          </div>

          <div className="flex items-center gap-2 justify-between">
            <button
              type="button"
              onClick={fetchList}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-violet-500/40 transition-all"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Staff
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/staff-roles')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
            >
              Go To Roles page
            </button>
          </div>
        </div>

        <div className="mt-2">
          <StaffFilters
            query={query}
            roles={roles}
            searching={searching}
            loading={loading}
            showReset={isAnyFilterActive}
            onChange={onQueryChange}
            onReset={resetFilters}
          />
        </div>
      </div>

 

      <StaffTable
        items={list.items}
        loading={loading}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAllVisible}
        onAction={handleAction}
      />

      <StaffPagination
        page={list.page}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        totalPages={list.totalPages}
        hasNext={list.hasNext}
        hasPrevious={list.hasPrevious}
        onPageChange={(p) => onQueryChange({ page: p })}
        onPageSizeChange={(ps) => onQueryChange({ pageSize: ps, page: 1 })}
      />

      <StaffFormModal
        isOpen={formOpen}
        mode={formMode}
        roles={roles}
        initialValue={editingItem}
        saving={mutating}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={submitForm}
      />

      <ResetPasswordModal
        isOpen={resetOpen}
        saving={mutating}
        staff={resetTarget}
        onClose={() => {
          setResetOpen(false);
          setResetTarget(null);
        }}
        onSubmit={submitReset}
      />

      <StaffViewModal
        isOpen={viewOpen}
        loading={viewLoading}
        item={viewItem}
        onClose={() => {
          setViewOpen(false);
          setViewItem(null);
        }}
      />

      <StaffConfirmDialogs
        open={confirmOpen}
        loading={mutating}
        target={confirmTarget}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />

      {list.items.length === 0 && !loading && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-slate-300">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          No staff data found for current filters.
        </div>
      )}
    </div>
  );
}
