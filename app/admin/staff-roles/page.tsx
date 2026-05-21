'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/_components/CustomToast';
import { useDebounce } from '@/app/admin/_hooks/useDebounce';
import { staffService, type StaffRole } from '@/lib/services/staff';
import { BulkSelectionBar, exportRolesToXlsx, RoleConfirmDialogs, RoleFilters, RoleFormModal, RoleTable, RoleViewModal, type RoleAction } from './RoleComponents';

import { getBackendMessage } from '@/app/admin/_utils/errorUtils';

export default function StaffRolesPage() {
  const toast = useToast();
  const router = useRouter();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const filtered = useMemo(() => {
    const term = (debouncedSearch || '').trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((r) => (r.name || '').toLowerCase().includes(term));
  }, [roles, debouncedSearch]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<StaffRole | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState({ delete: false });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffService.getRoles();
      if (res.data?.success) {
        setRoles(res.data.data || []);
      } else {
        toastRef.current.error(getBackendMessage(res));
      }
    } catch (e: any) {
      toastRef.current.error(getBackendMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filtered.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [filtered]);

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
      return new Set(filtered.map((r) => r.id));
    });
  }, [filtered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const exportSelected = useCallback(() => {
    const rows = filtered.filter((r) => selectedIds.has(r.id));
    exportRolesToXlsx(`roles_selected_${new Date().toISOString().slice(0, 10)}.xlsx`, rows);
    clearSelection();
  }, [filtered, selectedIds, clearSelection]);

  useEffect(() => {
    if (search === '') {
      setSearching(false);
      return;
    }
    setSearching(true);
  }, [search]);

  useEffect(() => {
    setSearching(false);
  }, [debouncedSearch]);

  const openCreate = useCallback(() => {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  }, []);

  const handleAction = useCallback(
    (action: RoleAction) => {
      switch (action.type) {
        case 'create':
          openCreate();
          break;
        case 'view':
          setSelected(action.item);
          setViewOpen(true);
          break;
        case 'edit':
          if ((action.item.name || '').toLowerCase() === 'admin') return;
          if (action.item.isSystem) return;
          setFormMode('edit');
          setSelected(action.item);
          setFormOpen(true);
          break;
        case 'delete':
          if ((action.item.name || '').toLowerCase() === 'admin') return;
          if (action.item.isSystem) return;
          setSelected(action.item);
          setConfirmOpen({ delete: true });
          break;
      }
    },
    [openCreate]
  );

  const submitForm = useCallback(
    async (name: string) => {
      try {
        setMutating(true);
        const res =
          formMode === 'create'
            ? await staffService.createRole({ name })
            : selected
              ? await staffService.updateRole(selected.id, { name })
              : null;
        if (!res) return;

        if (res.data?.success) {
          toastRef.current.success(getBackendMessage(res));
          setFormOpen(false);
          setSelected(null);
          fetchRoles();
        } else {
          toastRef.current.error(getBackendMessage(res));
        }
      } catch (e: any) {
        toastRef.current.error(getBackendMessage(e));
      } finally {
        setMutating(false);
      }
    },
    [formMode, selected, fetchRoles]
  );

  const confirmDelete = useCallback(async () => {
    if (!selected) return;
    try {
      setMutating(true);
      const res = await staffService.deleteRole(selected.name);
      if (res.data?.success) {
        toastRef.current.success(getBackendMessage(res));
        setConfirmOpen({ delete: false });
        setSelected(null);
        fetchRoles();
      } else {
        toastRef.current.error(getBackendMessage(res));
      }
    } catch (e: any) {
      toastRef.current.error(getBackendMessage(e));
    } finally {
      setMutating(false);
    }
  }, [selected, fetchRoles]);

  return (
    <div className="space-y-4">
      <BulkSelectionBar count={selectedIds.size} onExport={exportSelected} onClear={clearSelection} />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-end gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Staff Roles
            </h1>
            <div className="text-sm text-slate-400 mb-1">{filtered.length} roles</div>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Create and manage roles </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRoles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
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
            Create Role
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/staff')}
            className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all"
          >
            Go To Staff page
          </button>
        </div>
      </div>

      <RoleFilters
        search={search}
        searching={searching}
        loading={loading}
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      <RoleTable
        items={filtered}
        loading={loading}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAllVisible}
        onAction={handleAction}
        onDisabled={(message) => toastRef.current.warning(message)}
      />

      <RoleFormModal
        isOpen={formOpen}
        mode={formMode}
        saving={mutating}
        initialValue={selected}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onSubmit={submitForm}
      />

      <RoleViewModal
        isOpen={viewOpen}
        item={selected}
        onClose={() => setViewOpen(false)}
      />

      <RoleConfirmDialogs
        open={confirmOpen}
        loading={mutating}
        target={selected}
        onClose={() => setConfirmOpen({ delete: false })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
