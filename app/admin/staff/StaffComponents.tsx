'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  EyeOff,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/app/admin/_components/CustomToast';
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog';
import { formatDate } from '@/app/admin/_utils/formatUtils';
import { getBackendErrors } from '@/app/admin/_utils/errorUtils';
import type {
  CreateStaffRequest,
  StaffItem,
  StaffListQueryParams,
  StaffRole,
  UpdateStaffRequest,
} from '@/lib/services/staff';

type SortDirection = 'asc' | 'desc';

export type StaffAction =
  | { type: 'view'; id: string }
  | { type: 'edit'; item: StaffItem }
  | { type: 'create' }
  | { type: 'toggle'; item: StaffItem }
  | { type: 'delete'; item: StaffItem }
  | { type: 'resetPassword'; item: StaffItem };


export const StaffFilters = React.memo(function StaffFilters({
  query,
  roles,
  searching,
  loading,
  showReset,
  onChange,
  onReset,
}: {
  query: StaffListQueryParams;
  roles: StaffRole[];
  searching: boolean;
  loading: boolean;
  showReset: boolean;
  onChange: (patch: Partial<StaffListQueryParams>) => void;
  onReset: () => void;
}) {
  const roleOptions = useMemo(() => roles.map((r) => r.name), [roles]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query.searchTerm || ''}
            onChange={(e) => onChange({ searchTerm: e.target.value, page: 1 })}
            placeholder="Search by name, email or phone..."
            className={`w-full pl-9 pr-10 py-2 bg-slate-950/40 border rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
              (query.searchTerm || '').trim()
                ? 'border-violet-500/50 ring-2 ring-violet-500/10'
                : 'border-slate-800'
            }`}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
            </div>
          )}
        </div>

        <select
          value={query.role || ''}
          onChange={(e) => onChange({ role: e.target.value || undefined, page: 1 })}
          className={`min-w-[170px] px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
            query.role ? 'border-violet-500/50 ring-2 ring-violet-500/10' : 'border-slate-800'
          }`}
        >
          <option value="">All Roles</option>
          {roleOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={query.isActive === undefined ? '' : query.isActive ? 'true' : 'false'}
          onChange={(e) =>
            onChange({
              isActive: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            })
          }
          className={`min-w-[150px] px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
            query.isActive !== undefined ? 'border-violet-500/50 ring-2 ring-violet-500/10' : 'border-slate-800'
          }`}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select
          value={query.sortBy || 'createdAt'}
          onChange={(e) => onChange({ sortBy: e.target.value, page: 1 })}
          className={`min-w-[160px] px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
            (query.sortBy || 'createdAt') !== 'createdAt'
              ? 'border-violet-500/50 ring-2 ring-violet-500/10'
              : 'border-slate-800'
          }`}
        >
          <option value="createdAt">Created</option>
          <option value="lastLoginAt">Last Login</option>
          <option value="email">Email</option>
          <option value="fullName">Name</option>
          <option value="primaryRole">Role</option>
        </select>

        <select
          value={(query.sortDirection as SortDirection) || 'desc'}
          onChange={(e) => onChange({ sortDirection: e.target.value as SortDirection, page: 1 })}
          className={`min-w-[110px] px-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${
            ((query.sortDirection as SortDirection) || 'desc') !== 'desc'
              ? 'border-violet-500/50 ring-2 ring-violet-500/10'
              : 'border-slate-800'
          }`}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        {showReset && (
          <button
            disabled={loading}
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-500/60 transition-all disabled:opacity-50"
            type="button"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
});

export const StaffTable = React.memo(function StaffTable({
  items,
  loading,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onAction,
}: {
  items: StaffItem[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onAction: (action: StaffAction) => void;
}) {
  const allVisibleSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((i) => selectedIds.has(i.id));
  }, [items, selectedIds]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr className="text-slate-300">
              <th className="text-left px-4 py-3 font-semibold w-12">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Created</th>
              <th className="text-left px-4 py-3 font-semibold">Last Login</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={8}>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading staff...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={8}>
                  No staff found.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-950/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onToggleOne(row.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-100">
                    <div className="font-semibold">{row.fullName || `${row.firstName} ${row.lastName}`}</div>
                    <div className="text-xs text-slate-500">📞{row.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-200"> {row.email}</td>
                  <td className="px-4 py-3 text-slate-200">
                    <div className="inline-flex items-center gap-2">
                      <Shield className="h-4 w-4 text-violet-400" />
                      {row.primaryRole || row.roles?.[0] || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        row.isActive
                          ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                          : 'bg-red-500/10 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {row.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(row.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton title="View" onClick={() => onAction({ type: 'view', id: row.id })}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton title="Edit" onClick={() => onAction({ type: 'edit', item: row })}>
                        <Edit className="h-4 w-4" />
                      </IconButton>
                      <IconButton title="Reset Password" onClick={() => onAction({ type: 'resetPassword', item: row })}>
                        <LockKeyhole className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => onAction({ type: 'toggle', item: row })}
                      >
                        {row.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </IconButton>
                      <IconButton title="Delete" variant="danger" onClick={() => onAction({ type: 'delete', item: row })}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

function IconButton({
  title,
  onClick,
  variant = 'default',
  children,
}: {
  title: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const base =
    'p-2 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed';
  const cls =
    variant === 'danger'
      ? `${base} bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:shadow-red-500/20 hover:border-red-500/60`
      : `${base} bg-slate-800/40 border-slate-700 text-slate-200 hover:bg-slate-800 hover:shadow-slate-900/40 hover:border-violet-500/50 hover:text-white`;
  return (
    <button type="button" title={title} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export const StaffPagination = React.memo(function StaffPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
}) {
  const getPageNumbers = useCallback(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const goToFirstPage = useCallback(() => onPageChange(1), [onPageChange]);
  const goToLastPage = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);
  const goToPreviousPage = useCallback(() => onPageChange(page - 1), [onPageChange, page]);
  const goToNextPage = useCallback(() => onPageChange(page + 1), [onPageChange, page]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-slate-400">
            Page {page} of {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Show</span>
            <select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="px-2 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">per page</span>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToFirstPage}
              disabled={page === 1}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
              type="button"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToPreviousPage}
              disabled={page === 1}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  type="button"
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    page === p ? 'bg-violet-500 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={goToNextPage}
              disabled={page === totalPages}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToLastPage}
              disabled={page === totalPages}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
              type="button"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="text-sm text-slate-400">Total: {totalCount} items</div>
      </div>
    </div>
  );
});

export function StaffFormModal({
  isOpen,
  mode,
  roles,
  initialValue,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  roles: StaffRole[];
  initialValue?: StaffItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffRequest | UpdateStaffRequest) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setErrors([]);
    if (mode === 'edit' && initialValue) {
      setFirstName(initialValue.firstName || '');
      setLastName(initialValue.lastName || '');
      setEmail(initialValue.email || '');
      setPhoneNumber(initialValue.phoneNumber || '');
      setRole(initialValue.primaryRole || initialValue.roles?.[0] || '');
      setPassword('');
      setConfirmPassword('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setRole('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, mode, initialValue]);

  const roleOptions = useMemo(() => roles.map((r) => r.name), [roles]);
  const toast = useToast();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = useMemo(() => {
    if (!firstName.trim()) return false;
    if (!lastName.trim()) return false;
    if (!role) return false;

    if (mode === 'create') {
      if (!email.trim() || !validateEmail(email)) return false;
      if (!password || password.length < 8) return false;
      if (password !== confirmPassword) return false;
    }

    return true;
  }, [firstName, lastName, role, mode, email, password, confirmPassword]);

  const handleSubmit = useCallback(() => {
    const errs: string[] = [];

    if (!firstName.trim()) errs.push('First Name is required');
    if (!lastName.trim()) errs.push('Last Name is required');

    if (mode === 'create') {
      if (!email.trim()) {
        errs.push('Email is required');
      } else if (!validateEmail(email)) {
        errs.push('Valid email address is required');
      }

      if (!password) {
        errs.push('Password is required');
      } else if (password.length < 8) {
        errs.push("Password must be at least 8 characters long");
      }

      if (password !== confirmPassword) {
        errs.push('Passwords do not match');
      }
    }

    if (!role) errs.push('Role is required');

    if (errs.length > 0) {
      toast.error(
        <div className="space-y-1">
          <div className="font-bold mb-1">Please fill required fields:</div>
          {errs.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-3 w-3" />
              {err}
            </div>
          ))}
        </div>
      );
      setErrors(errs);
      return;
    }

    setErrors([]);

    if (mode === 'create') {
      onSubmit({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
        role,
        password,
      });
      return;
    }

    onSubmit({
      firstName,
      lastName,
      phoneNumber: phoneNumber || undefined,
      role,
    });
  }, [mode, onSubmit, firstName, lastName, email, phoneNumber, role, password, confirmPassword, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'create' ? 'Create Staff' : 'Edit Staff'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'create' ? 'Create a new staff account' : 'Update staff details'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">First Name <span className="text-red-500">*</span></label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={`w-full mt-1 px-3 py-2 bg-slate-950/40 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                  errors.some(e => e.toLowerCase().includes('first name')) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Last Name <span className="text-red-500">*</span></label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={`w-full mt-1 px-3 py-2 bg-slate-950/40 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                  errors.some(e => e.toLowerCase().includes('last name')) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Email {mode === 'create' && <span className="text-red-500">*</span>}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mode === 'edit'}
              placeholder="staff@example.com"
              className={`w-full mt-1 px-3 py-2 bg-slate-950/40 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                errors.some(e => e.toLowerCase().includes('email')) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
              } disabled:opacity-60`}
            />
          </div>

          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Password <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    className={`w-full px-3 py-2 pr-10 bg-slate-950/40 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                      errors.some(e => e.toLowerCase().includes('password')) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    className={`w-full px-3 py-2 pr-10 bg-slate-950/40 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                      confirmPassword && password !== confirmPassword ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`mt-1 text-[10px] ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Role <span className="text-red-500">*</span></label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full mt-1 px-3 py-2 bg-slate-950/70 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all ${
                  errors.some(e => e.toLowerCase().includes('role')) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'
                }`}
              >
                <option value="">Select role</option>
                {roleOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Phone</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold shadow-lg transition-all active:scale-[0.98] ${
              isFormValid
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-violet-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : mode === 'create' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {saving ? 'Saving...' : mode === 'create' ? 'Create Staff' : 'Update Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}



export function ResetPasswordModal({
  isOpen,
  saving,
  staff,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  saving: boolean;
  staff: any;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen]);

  const isMatch = newPassword === confirmPassword;

  const handleSubmit = useCallback(() => {
    if (!newPassword || !confirmPassword) return;

    if (!isMatch) {
      alert('Passwords do not match');
      return;
    }

    onSubmit(newPassword);
  }, [newPassword, confirmPassword, isMatch, onSubmit]);

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-amber-500/20 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="p-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-xs text-slate-400">
              for {staff.fullName || staff.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4">

          {/* NEW PASSWORD */}
          <div>
            <label className="text-xs text-slate-400">New Password</label>

            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Enter new password"
                className="w-full px-3 py-2 pr-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="text-xs text-slate-400">Confirm Password</label>

            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="w-full px-3 py-2 pr-10 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* LIVE MATCH STATUS */}
            {confirmPassword && (
              <p
                className={`mt-1 text-xs ${
                  isMatch ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !newPassword || !confirmPassword || !isMatch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {saving ? 'Resetting...' : 'Reset'}
          </button>
        </div>

      </div>
    </div>
  );
}

export function StaffViewModal({
  isOpen,
  loading,
  item,
  onClose,
}: {
  isOpen: boolean;
  loading: boolean;
  item: StaffItem | null;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-cyan-500/20 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Staff Details</h2>
            <p className="text-xs text-slate-400">{item?.email || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : !item ? (
            <div className="flex items-center gap-2 text-slate-400">
              <AlertCircle className="h-4 w-4" />
              No data.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Full Name" value={item.fullName || `${item.firstName} ${item.lastName}`} />
              <InfoRow label="Email" value={item.email} />
              <InfoRow label="Phone" value={item.phoneNumber || '—'} />
              <InfoRow label="Roles" value={(item.roles || []).join(', ') || item.primaryRole || '—'} />
              <InfoRow label="Active" value={item.isActive ? 'Yes' : 'No'} />
              <InfoRow label="Email Confirmed" value={item.emailConfirmed ? 'Yes' : 'No'} />
              <InfoRow label="Created At" value={formatDate(item.createdAt)} />
              <InfoRow label="Last Login" value={formatDate(item.lastLoginAt)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-100 font-semibold mt-0.5 break-words">{value}</div>
    </div>
  );
}

export function StaffConfirmDialogs({
  open,
  loading,
  target,
  onClose,
  onConfirm,
}: {
  open: { toggle: boolean; delete: boolean };
  loading: boolean;
  target: StaffItem | null;
  onClose: (kind: 'toggle' | 'delete') => void;
  onConfirm: (kind: 'toggle' | 'delete') => void;
}) {
  return (
    <>
      <ConfirmDialog
        isOpen={open.toggle}
        onClose={() => onClose('toggle')}
        onConfirm={() => onConfirm('toggle')}
        title={target?.isActive ? 'Deactivate Staff?' : 'Activate Staff?'}
        message={
          target
            ? `Are you sure you want to ${target.isActive ? 'deactivate' : 'activate'} ${target.fullName || target.email}?`
            : 'Are you sure?'
        }
        confirmText={target?.isActive ? 'Deactivate' : 'Activate'}
        confirmButtonStyle={
          target?.isActive
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:shadow-orange-500/30'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30'
        }
        isLoading={loading}
      />

      <ConfirmDialog
        isOpen={open.delete}
        onClose={() => onClose('delete')}
        onConfirm={() => onConfirm('delete')}
        title="Delete Staff?"
        message={target ? `This will permanently delete ${target.fullName || target.email}. Continue?` : 'Continue?'}
        confirmText="Delete"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/30"
        isLoading={loading}
      />
    </>
  );
}

export function exportStaffToXlsx(filename: string, rows: StaffItem[]) {
  const data = rows.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: s.fullName || `${s.firstName} ${s.lastName}`,
    email: s.email,
    phoneNumber: s.phoneNumber || '',
    primaryRole: s.primaryRole || '',
    roles: (s.roles || []).join(', '),
    isActive: s.isActive ? 'Yes' : 'No',
    emailConfirmed: s.emailConfirmed ? 'Yes' : 'No',
    createdAt: s.createdAt,
    lastLoginAt: s.lastLoginAt || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Staff');
  XLSX.writeFile(wb, filename);
}

export function BulkSelectionBar({
  count,
  onExport,
  onClear,
}: {
  count: number;
  onExport: () => void;
  onClear: () => void;
}) {
  if (count <= 0) return null;

  return (
    <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
      <div className="flex justify-center px-2">
        <div className="pointer-events-auto mx-auto w-fit max-w-[95%] rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                <span className="font-semibold text-white">{count}</span>
                <span className="text-slate-300">staff selected</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Bulk actions: export selected staff.</p>
            </div>
            <div className="h-5 w-px bg-slate-700 hidden md:block" />
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
              type="button"
            >
              Export ({count})
            </button>
            <button
              onClick={onClear}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
