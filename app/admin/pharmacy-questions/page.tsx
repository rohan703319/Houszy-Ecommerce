"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  X,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  List,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { PharmacyQuestion, pharmacyQuestionsService, UpdatePharmacyQuestionDto } from "@/lib/services/PharmacyQuestions";
import PharmacyQuestionFormModal from "./PharmacyQuestionFormModal";
import { useDebounce } from "@/app/hooks/useDebounce";


type ViewMode = "all" | "active" | "inactive";
type SortField = "questionText" | "displayOrder" | "createdAt" | "optionsCount";
type SortDirection = "asc" | "desc";


export default function PharmacyQuestionsPage() {
  const toast = useToast();

  const [questions, setQuestions] = useState<PharmacyQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<PharmacyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<PharmacyQuestion | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
const [includeDeleted, setIncludeDeleted] = useState(false);


  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    icon: AlertCircle,
    iconColor: "text-red-400",
    confirmButtonStyle: "bg-gradient-to-r from-red-500 to-rose-500",
    isLoading: false,
  });
// ✅ Add this state at top with other states
const [isSearching, setIsSearching] = useState(false);
const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

// ✅ Update debounce effect to show loading
useEffect(() => {
  setIsSearching(true);
  const handler = setTimeout(() => {
    setIsSearching(false);
  }, 500);
  return () => clearTimeout(handler);
}, [searchTerm]);
  const [sortField, setSortField] = useState<SortField>("displayOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

const fetchQuestions = useCallback(async () => {
  try {
    setLoading(true);

const response = await pharmacyQuestionsService.getAll({
  includeDeleted,
});


    if (response?.data?.success) {
      let fetchedQuestions = response.data.data || [];
// ✅ ACTIVE FILTER (Frontend Controlled)
if (statusFilter === "active") {
  fetchedQuestions = fetchedQuestions.filter(q => q.isActive);
} 
else if (statusFilter === "inactive") {
  fetchedQuestions = fetchedQuestions.filter(q => !q.isActive);
}

// ✅ VIEW MODE FILTER (Stats Cards)
if (viewMode === "active") {
  fetchedQuestions = fetchedQuestions.filter(q => q.isActive);
}
else if (viewMode === "inactive") {
  fetchedQuestions = fetchedQuestions.filter(q => !q.isActive);
}

      // ✅ SEARCH FILTER
      if (debouncedSearchTerm) {
        fetchedQuestions = fetchedQuestions.filter((q: PharmacyQuestion) =>
          q.questionText
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
        );
      }

      // ✅ SORTING APPLY HERE
      fetchedQuestions.sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case "questionText":
            comparison = a.questionText.localeCompare(b.questionText);
            break;
          case "displayOrder":
            comparison = a.displayOrder - b.displayOrder;
            break;
          case "createdAt":
            comparison =
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime();
            break;
          case "optionsCount":
            comparison = a.options.length - b.options.length;
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });

      setAllQuestions(fetchedQuestions);
      setTotalCount(fetchedQuestions.length);

      const startIndex = (currentPage - 1) * pageSize;
      const paginatedQuestions = fetchedQuestions.slice(
        startIndex,
        startIndex + pageSize
      );

      setQuestions(paginatedQuestions);
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        "Failed to fetch questions"
    );
  } finally {
    setLoading(false);
  }
}, [
  currentPage,
  pageSize,
  statusFilter,
  includeDeleted,
  viewMode,    
  debouncedSearchTerm,
  sortField,
  sortDirection, // ⚠️ IMPORTANT add this
]);




 
// ✅ Update applyFilters function
const applyFilters = (questionsList: PharmacyQuestion[]) => {
  let filtered = [...questionsList];

  // Search Filter
  if (debouncedSearchTerm) {
    filtered = filtered.filter((q) =>
      q.questionText.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }

  // Status Filter (from dropdown)
  if (statusFilter === "active") {
    filtered = filtered.filter((q) => q.isActive);
  } else if (statusFilter === "inactive") {
    filtered = filtered.filter((q) => !q.isActive);
  }

  // View Mode Filter (from stats cards)
  if (viewMode === "active") {
    filtered = filtered.filter((q) => q.isActive);
  } else if (viewMode === "inactive") {
    filtered = filtered.filter((q) => !q.isActive);
  }

  return filtered;
};

// ✅ Update clearFilters function
const clearFilters = () => {
  setSearchTerm("");
  setStatusFilter("all");
  setViewMode("all");
  setCurrentPage(1);
};



  const applySorting = (questionsList: PharmacyQuestion[]) => {
    const sorted = [...questionsList];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "questionText":
          comparison = a.questionText.localeCompare(b.questionText);
          break;
        case "displayOrder":
          comparison = a.displayOrder - b.displayOrder;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "optionsCount":
          comparison = a.options.length - b.options.length;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-400" />
    );
  };
 useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const calculateStats = () => {
    const total = allQuestions.length;
    const active = allQuestions.filter((q) => q.isActive).length;
    const inactive = total - active;
    const totalOptions = allQuestions.reduce((sum, q) => sum + q.options.length, 0);
    

    return { total, active, inactive, totalOptions };
  };

  const stats = calculateStats();

  const handleDelete = (question: PharmacyQuestion) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Question",
      message: `Are you sure you want to delete "${question.questionText}"? This action can be reversed later.`,
      icon: Trash2,
      iconColor: "text-red-400",
      confirmButtonStyle: "bg-gradient-to-r from-red-500 to-rose-500",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
          await pharmacyQuestionsService.delete(question.id);
          toast.success("Question deleted successfully");
          fetchQuestions();
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to delete question");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRestore = (question: PharmacyQuestion) => {
    setConfirmDialog({
      isOpen: true,
      title: "Restore Question",
      message: `Are you sure you want to restore "${question.questionText}"?`,
      icon: RotateCcw,
      iconColor: "text-green-400",
      confirmButtonStyle: "bg-gradient-to-r from-green-500 to-emerald-500",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
          await pharmacyQuestionsService.restore(question.id);
          toast.success("Question restored successfully");
          fetchQuestions();
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to restore question");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleStatusToggle = (question: PharmacyQuestion) => {
  setConfirmDialog({
    isOpen: true,
    title: `${question.isActive ? "Deactivate" : "Activate"} Question`,
    message: `Are you sure you want to ${
      question.isActive ? "deactivate" : "activate"
    } "${question.questionText}"?`,
    icon: AlertCircle,
    iconColor: question.isActive ? "text-red-400" : "text-green-400",
    confirmButtonStyle: question.isActive
      ? "bg-gradient-to-r from-red-500 to-rose-500"
      : "bg-gradient-to-r from-green-500 to-emerald-500",
    isLoading: false,
  onConfirm: async () => {
  try {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));

  

    const updateData: UpdatePharmacyQuestionDto = {
      id: question.id,
      questionText: question.questionText,
      isActive: !question.isActive,
      displayOrder: question.displayOrder,
      answerType: question.answerType,
      options:
        question.answerType === "Text"
          ? []
          : question.options.map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
              displayOrder: opt.displayOrder,
            })),
    };

    await pharmacyQuestionsService.update(question.id, updateData);

    toast.success(
      `Question ${question.isActive ? "deactivated" : "activated"} successfully`
    );

    fetchQuestions();
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
      "Failed to update question status"
    );
  } finally {
    setConfirmDialog((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  }
}
,
  });
};


  const openCreateModal = () => {
    setSelectedQuestion(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (question: PharmacyQuestion) => {
    setSelectedQuestion(question);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    fetchQuestions();
  };



const hasActiveFilters =
  searchTerm.trim() ||
  viewMode !== "all" ||
  statusFilter !== "all" ||
  includeDeleted;


  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

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

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && allQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading pharmacy questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Pharmacy Questions
          </h1>
          <p className="text-slate-400 mt-0.5">Manage customer qualification questions</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-violet-500/50 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          onClick={() => {
            setViewMode("all");
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl border transition-all text-left ${
            viewMode === "all"
              ? "bg-violet-500/10 border-violet-500/50 ring-2 ring-violet-500/30"
              : "bg-slate-800/50 border-slate-700 hover:border-violet-500/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Total Questions</p>
              <p className="text-white text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setViewMode("active");
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl border transition-all text-left ${
            viewMode === "active"
              ? "bg-green-500/10 border-green-500/50 ring-2 ring-green-500/30"
              : "bg-slate-800/50 border-slate-700 hover:border-green-500/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Active Questions</p>
              <p className="text-white text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setViewMode("inactive");
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl border transition-all text-left ${
            viewMode === "inactive"
              ? "bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30"
              : "bg-slate-800/50 border-slate-700 hover:border-red-500/50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Inactive Questions</p>
              <p className="text-white text-xl font-bold">{stats.inactive}</p>
            </div>
          </div>
        </button>

        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <List className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Total Options</p>
              <p className="text-white text-xl font-bold">{stats.totalOptions}</p>
            </div>
          </div>
        </div>

       
      </div>

      {/* Items Per Page */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-slate-400">entries per page</span>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="text-white font-semibold">{startIndex + 1}</span> to{" "}
            <span className="text-white font-semibold">{endIndex}</span> of{" "}
            <span className="text-white font-semibold">{totalCount}</span> entries
          </div>
        </div>
      </div>
{/* Search and Filters */}
<div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5">
  <div className="flex flex-wrap items-center gap-2">

    {/* Search Input */}
    <div className="relative flex-1 min-w-[280px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="search"
        placeholder="Search questions..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full pl-9 pr-10 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
      />
    </div>

    {/* Status Filter */}
    <div className="relative">
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(
            e.target.value as "all" | "active" | "inactive"
          );
          setCurrentPage(1);
        }}
        className="pl-3 pr-8 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
      >
        <option value="all">All Status</option>
        <option value="active">Active Only</option>
        <option value="inactive">Inactive Only</option>
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>

    {/* 🗑 Deleted Filter */}
    <div className="relative">
      <select
        value={includeDeleted ? "true" : "false"}
        onChange={(e) => {
          setIncludeDeleted(e.target.value === "true");
          setCurrentPage(1);
        }}
        className="pl-3 pr-8 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
      >
        <option value="false">Hide Deleted</option>
        <option value="true">Show Deleted</option>
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>

    {/* Clear Button */}
    {(searchTerm || statusFilter !== "all" || includeDeleted) && (
      <button
        onClick={() => {
          setSearchTerm("");
          setStatusFilter("all");
          setIncludeDeleted(false);
          setCurrentPage(1);
        }}
        className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
      >
        <FilterX className="h-3.5 w-3.5" />
        Clear
      </button>
    )}
  </div>
</div>


      {/* Questions Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
        {questions.length === 0 ? (
          <div className="text-center py-10">
            <HelpCircle className="h-14 w-14 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No questions found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 sticky top-0 z-10">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("displayOrder")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                     Display Order
                      {getSortIcon("displayOrder")}
                    </button>
                  </th>

                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("questionText")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      Question
                      {getSortIcon("questionText")}
                    </button>
                  </th>

                  <th className="text-center py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("optionsCount")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors mx-auto"
                    >
                      Options
                      {getSortIcon("optionsCount")}
                    </button>
                  </th>

                  <th className="text-center py-2 px-3 text-slate-400 font-medium text-sm">Status</th>

                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      Created On
                      {getSortIcon("createdAt")}
                    </button>
                  </th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium text-sm">Created By</th>

                  <th className="text-center py-2 px-3 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>

              <tbody>
                {questions.map((question) => (
                  <tr
                    key={question.id}
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium">
                        #{question.displayOrder}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <p className="font-medium text-white text-sm">{question.questionText}</p>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm font-medium">
                        {question.options.length}
                      </span>
                    </td>

                <td className="py-2.5 px-3 text-center">
  <button
    onClick={() => handleStatusToggle(question)}
    className="transition-all"
  >
    {question.isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
        Inactive
      </span>
    )}
  </button>
</td>


                    <td className="py-2.5 px-3">
                      <p className="text-sm text-slate-300">{formatDate(question.createdAt)}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-sm text-slate-300">{question.createdBy}</p>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(question)}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 rounded-lg transition-all"
                          title="Edit Question"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

 {question.isDeleted ? (
  // ✅ If already deleted → show Restore
  <button
    onClick={() => handleRestore(question)}
    className="p-1.5 text-green-400 hover:bg-green-500/10 hover:text-green-300 rounded-lg transition-all"
    title="Restore Question"
  >
    <RotateCcw className="h-4 w-4" />
  </button>
) : (
  // ✅ If NOT deleted → show Delete
  <button
    onClick={() => handleDelete(question)}
    className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
    title="Delete Question"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all ${
                      currentPage === page
                        ? "bg-violet-500 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-slate-400">Total: {totalCount} items</div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedQuestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-500/10">
            <div className="p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Question Details</h2>
                    <p className="text-slate-400 text-sm">Order #{selectedQuestion.displayOrder}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Question Text</h3>
                <p className="text-white text-lg font-medium">{selectedQuestion.questionText}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Display Order</p>
                  <p className="text-white text-xl font-bold">#{selectedQuestion.displayOrder}</p>
                </div>

                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Options Count</p>
                  <p className="text-white text-xl font-bold">{selectedQuestion.options.length}</p>
                </div>

                <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <p
                    className={`text-xl font-bold ${
                      selectedQuestion.isActive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {selectedQuestion.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <List className="h-4 w-4 text-cyan-400" />
                  Answer Options
                </h3>
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="text-white font-medium">{option.optionText}</p>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Created At</p>
                    <p className="text-white font-medium">{formatDate(selectedQuestion.createdAt)}</p>
                  </div>
                  {selectedQuestion.updatedAt && (
                    <div>
                      <p className="text-slate-400 mb-1">Updated At</p>
                      <p className="text-white font-medium">{formatDate(selectedQuestion.updatedAt)}</p>
                    </div>
                  )}
                  {selectedQuestion.isDeleted && (
                    <div>
                      <p className="text-slate-400 mb-1">Deleted</p>
                      <p className="text-white font-medium">{selectedQuestion.isDeleted ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Form Modal */}
      <PharmacyQuestionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        question={selectedQuestion}
        isEditMode={isEditMode}
        onSuccess={handleFormSuccess}
        nextDisplayOrder={allQuestions.length + 1}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} />
    </div>
  );
}
