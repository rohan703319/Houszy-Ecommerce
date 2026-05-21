"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  Mail,
  MessageCircleReply,

  RefreshCw,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import ContactModals, { ContactReplyFormState } from "./ContactModals";
import {
  ContactItem,
  ContactListData,
  contactService,
} from "@/lib/services/contact";
import { formatDate } from "../_utils/formatUtils";

const INITIAL_REPLY_FORM: ContactReplyFormState = {
  reply: "",
  internalNotes: "",
};

const emptyMeta: ContactListData = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const getNormalizedStatus = (contact: ContactItem) => {
  const rawStatus = (contact.status || "").toLowerCase();

  if (
    rawStatus.includes("reply") ||
    rawStatus.includes("closed") ||
    rawStatus.includes("resolved") ||
    contact.adminReply ||
    contact.repliedAt
  ) {
    return "replied";
  }

  if (rawStatus.includes("assign") || rawStatus.includes("progress")) {
    return "in-progress";
  }

  return "new";
};

const getStatusBadge = (contact: ContactItem) => {
  const status = getNormalizedStatus(contact);

  if (status === "replied") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "in-progress") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
};

const getUserName = () => {
  if (typeof window === "undefined") {
    return "Admin";
  }

  const storedUserData = localStorage.getItem("userData");

  if (!storedUserData) {
    return "Admin";
  }

  try {
    const userData = JSON.parse(storedUserData);
    const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
    return fullName || userData.email || "Admin";
  } catch {
    return "Admin";
  }
};

export default function ContactPage() {
  const toast = useToast();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [meta, setMeta] = useState<ContactListData>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewingContact, setViewingContact] = useState<ContactItem | null>(null);
  const [replyingContact, setReplyingContact] = useState<ContactItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactItem | null>(null);
  const [replyForm, setReplyForm] =
    useState<ContactReplyFormState>(INITIAL_REPLY_FORM);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Admin");

  useEffect(() => {
    setCurrentUserName(getUserName());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, itemsPerPage]);

  const fetchContacts = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await contactService.getAll({
        page: currentPage,
        pageSize: itemsPerPage,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter.trim() || undefined,
        search: debouncedSearch || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || "Failed to load contacts");
      }

      setContacts(response.data.data.items || []);
      setMeta(response.data.data);
    } catch (error: any) {
      setContacts([]);
      setMeta(emptyMeta);
      toast.error(error?.message || "Failed to fetch contact requests");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts(!contacts.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const replied = contacts.filter(
      (contact) => getNormalizedStatus(contact) === "replied"
    ).length;
    const inProgress = contacts.filter(
      (contact) => getNormalizedStatus(contact) === "in-progress"
    ).length;
    const fresh = contacts.filter(
      (contact) => getNormalizedStatus(contact) === "new"
    ).length;

    return {
      total: meta.totalCount,
      fresh,
      inProgress,
      replied,
      assigned: contacts.filter((contact) => !!contact.assignedTo).length,
    };
  }, [contacts, meta.totalCount]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
    setCurrentPage(1);
    setItemsPerPage(20);
  };

  const hasActiveFilters =
    !!searchTerm.trim() || statusFilter !== "all" || !!categoryFilter.trim();

  const openReplyModal = (contact: ContactItem) => {
    setReplyingContact(contact);
    setReplyForm({
      reply: contact.adminReply || "",
      internalNotes: contact.internalNotes || "",
    });
  };

  const handleReplySubmit = async () => {
    if (!replyingContact || !replyForm.reply.trim()) {
      toast.error("Reply is required");
      return;
    }

    setIsReplying(true);

    try {
      const response = await contactService.reply(replyingContact.id, {
        reply: replyForm.reply.trim(),
        internalNotes: replyForm.internalNotes.trim() || undefined,
        assignedTo: currentUserName,
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.error || response.data?.message || "Reply failed");
      }

      toast.success(response.data.message || "Reply sent successfully");
      setReplyingContact(null);
      setReplyForm(INITIAL_REPLY_FORM);
      await fetchContacts(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await contactService.delete(deleteTarget.id);

      if (response.error || response.data?.success === false) {
        throw new Error(
          response.error || response.data?.message || "Delete request failed"
        );
      }

      toast.success(response.data?.message || "Contact deleted successfully");
      setDeleteTarget(null);

      if (contacts.length === 1 && currentPage > 1) {
        setCurrentPage((previous) => previous - 1);
      } else {
        await fetchContacts(false);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete contact request");
    } finally {
      setIsDeleting(false);
    }
  };

  const pageStart = meta.totalCount === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const pageEnd =
    meta.totalCount === 0
      ? 0
      : Math.min(meta.page * meta.pageSize, meta.totalCount);

  const pageNumbers = useMemo(() => {
    const totalPages = meta.totalPages || 1;
    const windowSize = 5;
    const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, index) => adjustedStart + index
    );
  }, [currentPage, meta.totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contact Requests</h1>
          <p className="text-xs text-slate-300">
            Customer enquiries, replies, assignment notes, and delete actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchContacts(false)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">New</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.fresh}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
            In Progress
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.inProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
            Replied
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.replied}</p>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
            Assigned
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.assigned}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email,  subject, order number..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            {searchTerm !== debouncedSearch && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="all">All status</option>
              <option value="New">New</option>
              <option value="InProgress">In Progress</option>
              <option value="Replied">Replied</option>
              <option value="Closed">Closed</option>
            </select>

            <input
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="Category filter"
              className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(event) => setItemsPerPage(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200 transition hover:bg-rose-500/20"
                  title="Clear filters"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Showing <span className="font-semibold text-white">{pageStart}</span> to{" "}
            <span className="font-semibold text-white">{pageEnd}</span> of{" "}
            <span className="font-semibold text-white">{meta.totalCount}</span>{" "}
            contact requests
          </p>
          <p>
            Backend filters: search, status, category, pagination
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-2xl shadow-slate-950/40">
        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
            <p className="text-sm text-slate-400">Loading contact requests...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-cyan-300">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">No contact requests found</p>
              <p className="mt-1 text-sm text-slate-400">
                Try changing the backend filters or refresh the list.
              </p>
            </div>
          </div>
        ) : (
         <div className="overflow-x-auto">
  <table className="min-w-[980px] w-full table-fixed text-xs">

    <colgroup>
      <col className="w-[220px]" />
      <col className="w-[280px]" />
      <col className="w-[110px]" />
      <col className="w-[140px]" />
      <col className="w-[140px]" />
      <col className="w-[140px]" />
      <col className="w-[110px]" />
    </colgroup>

    <thead className="bg-slate-950/70">
      <tr className="border-b border-slate-800 text-left">
        <th className="px-3 py-2 text-slate-400">Customer</th>
        <th className="px-3 py-2 text-slate-400">Subject</th>
        <th className="px-3 py-2 text-slate-400">Status</th>
        <th className="px-3 py-2 text-slate-400">Category</th>
        <th className="px-3 py-2 text-slate-400">Assigned</th>
        <th className="px-3 py-2 text-slate-400">Created</th>
        <th className="px-3 py-2 text-center text-slate-400">Actions</th>
      </tr>
    </thead>

    <tbody>
      {contacts.map((contact) => (
        <tr
          key={contact.id}
          className="border-b border-slate-800/70 hover:bg-slate-800/20"
        >

          {/* CUSTOMER */}
        <td className="px-3 py-2 align-middle">
  <div className="flex items-center gap-2">

    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-200">
      <UserRound className="h-3.5 w-3.5" />
    </div>

    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-white leading-tight">
        {contact.name || "N/A"}
      </p>
      <p className="truncate text-[11px] text-slate-400">
        {contact.email || "N/A"}
      </p>
      <p className="truncate text-[11px] text-slate-400">
        {contact.phone || "N/A"}
      </p>
    </div>

  </div>
</td>

          {/* SUBJECT */}
         <td className="px-3 py-2 align-middle">
  <div className="min-w-0">

    <p className="truncate text-sm font-medium text-white leading-tight">
      {contact.subject || "No subject"}
    </p>

    <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
      {contact.message || "No message"}
    </p>

  </div>
</td>

          {/* STATUS */}
       <td className="px-3 py-2 align-middle">
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(
      contact
    )}`}
  >
    {contact.status || "New"}
  </span>
</td>
          {/* CATEGORY */}
          <td
            className="truncate px-3 py-2 text-slate-300"
            title={contact.category || "N/A"}
          >
            {contact.category || "N/A"}
          </td>

          {/* ASSIGNED */}
          <td
            className="truncate px-3 py-2 text-slate-300"
            title={contact.assignedTo || "Unassigned"}
          >
            {contact.assignedTo || "Unassigned"}
          </td>

          {/* CREATED */}
          <td className="px-3 py-2 text-slate-400">
            {formatDate(contact.createdAt)}
          </td>

          {/* ACTIONS */}
          <td className="px-3 py-2">
            <div className="flex items-center justify-center gap-1">

              <button
                onClick={() => setViewingContact(contact)}
                className="rounded-lg border border-slate-700 p-1.5 text-slate-200 hover:text-cyan-300"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => openReplyModal(contact)}
                className="rounded-lg border border-slate-700 p-1.5 text-slate-200 hover:text-violet-300"
              >
                <MessageCircleReply className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setDeleteTarget(contact)}
                className="rounded-lg border border-slate-700 p-1.5 text-slate-200 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
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

      {meta.totalPages > 1 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <p className="text-sm text-slate-400">
              Page <span className="font-semibold text-white">{meta.page}</span> of{" "}
              <span className="font-semibold text-white">{meta.totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={!meta.hasPrevious}
                className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((previous) => previous - 1)}
                disabled={!meta.hasPrevious}
                className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`min-w-10 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    currentPage === pageNumber
                      ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                      : "border border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((previous) => previous + 1)}
                disabled={!meta.hasNext}
                className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(meta.totalPages)}
                disabled={!meta.hasNext}
                className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400">
              Current page items:{" "}
              <span className="font-semibold text-white">{contacts.length}</span>
            </p>
          </div>
        </div>
      )}

      <ContactModals
        viewingContact={viewingContact}
        setViewingContact={setViewingContact}
        replyingContact={replyingContact}
        setReplyingContact={setReplyingContact}
        replyForm={replyForm}
        setReplyForm={setReplyForm}
        onReplySubmit={handleReplySubmit}
        isReplying={isReplying}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact Request"
        message={`Are you sure you want to delete "${deleteTarget?.subject || deleteTarget?.name || "this contact"}"? This action cannot be undone.`}
        confirmText="Delete Request"
        cancelText="Cancel"
        icon={Trash2}
        iconColor="text-red-400"
        confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/40"
        isLoading={isDeleting}
      />
    </div>
  );
}
