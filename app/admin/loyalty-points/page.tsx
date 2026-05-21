'use client';

/**
 * ============================================================
 * LOYALTY POINTS MANAGEMENT PAGE
 * ============================================================
 */
import * as XLSX from "xlsx";
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  Eye,
  History,
  Crown,
  Award,
  Coins,
  TrendingUp,
  TrendingDown,
  Gift,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Mail,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ShoppingCart,
  FilterX,
  Loader2,
  Check,
  Minus,
} from 'lucide-react';
import { useToast } from '@/app/admin/_components/CustomToast';
import {
  loyaltyPointsService,
  LoyaltyUser,
  LoyaltyBalance,
  LoyaltyTransaction,
  formatPoints,
  getTierColor,
  getTransactionTypeInfo,
  formatRelativeDate,
  formatExpiryDate,
  LoyaltyUsersApiResponse,
} from '@/lib/services/loyaltyPoints';
import { useDebounce } from "../_hooks/useDebounce";
import { formatCurrency, getOrderProductImage } from "../_utils/formatUtils";

type SortField = 'currentBalance' | 'totalPointsEarned' | 'totalPointsRedeemed' | 'lastActivity';
type SortDirection = 'asc' | 'desc';
type TierLevel = 'all' | 'Gold' | 'Silver' | 'Bronze';

export default function LoyaltyPointsPage() {
  const toast = useToast();

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  const [users, setUsers] = useState<LoyaltyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<LoyaltyUsersApiResponse['data']['stats'] | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<TierLevel>('all');
  const [sortBy, setSortBy] = useState<SortField>('currentBalance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection States
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal States

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LoyaltyUser | null>(null);
  const [userBalance, setUserBalance] = useState<LoyaltyBalance | null>(null);
  const [userHistory, setUserHistory] = useState<LoyaltyTransaction[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // History Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(20);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // ============================================================
  // DEBOUNCED SEARCH
  // ============================================================
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // ============================================================
  // FETCH USERS DATA - UPDATED to use new API
  // ============================================================
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await loyaltyPointsService.getAllUsersWithLoyalty({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        tierLevel: tierFilter === 'all' ? undefined : tierFilter,
        sortBy: sortBy === 'currentBalance' ? 'balance' : 
                sortBy === 'totalPointsEarned' ? 'earned' :
                sortBy === 'totalPointsRedeemed' ? 'redeemed' : 'lastActivity',
        sortDirection: sortDirection,
      });

      if (response.success && response.data) {
        setUsers(response.data.items);
        setTotalCount(response.data.totalCount);
        setStats(response.data.stats);
      } else {
        toast.error('Failed to load loyalty points data');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error?.message || 'Failed to load loyalty points data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, tierFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [users]);

  // ============================================================
  // SELECTION HANDLERS
  // ============================================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(users.map(u => u.userId));
      setSelectedUsers(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const selectedUsersData = useMemo(() => {
    return users.filter(u => selectedUsers.has(u.userId));
  }, [users, selectedUsers]);

  // ============================================================
  // MODAL HANDLERS
  // ============================================================



  const handleViewHistory = async (user: LoyaltyUser) => {
    try {
      setSelectedUser(user);
      setHistoryModalOpen(true);
      setLoadingModal(true);
      setHistoryPage(1);
      setHasMoreHistory(true);

      const response = await loyaltyPointsService.getUserHistory(user.userId, {
        pageNumber: 1,
        pageSize: historyPageSize,
      });

      if (response.data?.success) {
       const transactions = response.data.data?.items || [];
        setUserHistory(transactions);
        setHasMoreHistory(transactions.length === historyPageSize);
      } else {
        toast.error('Failed to load transaction history');
        setUserHistory([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load transaction history');
      setUserHistory([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!selectedUser || !hasMoreHistory) return;

    try {
      setLoadingModal(true);
      const nextPage = historyPage + 1;

      const response = await loyaltyPointsService.getUserHistory(selectedUser.userId, {
        pageNumber: nextPage,
        pageSize: historyPageSize,
      });

      if (response.data?.success) {
        const newTransactions = response.data.data?.items || [];
        
        if (newTransactions.length > 0) {
          setUserHistory(prev => [...prev, ...newTransactions]);
          setHistoryPage(nextPage);
          setHasMoreHistory(newTransactions.length === historyPageSize);
        } else {
          setHasMoreHistory(false);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load more transactions');
    } finally {
      setLoadingModal(false);
    }
  };

  // ============================================================
  // FILTER & SORT HANDLERS
  // ============================================================

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-400" />
    );
  };

  const handleTierClick = (tier: TierLevel) => {
    setTierFilter(tier);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTierFilter('all');
    setSortBy('currentBalance');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || tierFilter !== 'all' || sortBy !== 'currentBalance' || sortDirection !== 'desc';
  }, [searchTerm, tierFilter, sortBy, sortDirection]);

  // ============================================================
  // PAGINATION
  // ============================================================
  
  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (end - start < maxVisible - 1) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisible - 1);
      } else {
        start = Math.max(1, end - maxVisible + 1);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // ============================================================
  // EXPORT HANDLERS
  // ============================================================
  
  const handleExportAll = () => {
    if (!users || users.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const data = users.map((user) => ({
      User: user.fullName || "",
      Email: user.email || "",
      Balance: user.currentBalance || 0,
      "Value (£)": user.redemptionValue || 0,
      Earned: user.totalPointsEarned || 0,
      Redeemed: user.totalPointsRedeemed || 0,
      Tier: user.tierLevel || "",
      "Last Activity": user.lastActivity || "Never",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Loyalty Points");
    XLSX.writeFile(
      workbook,
      `loyalty-points-all-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    toast.success(`${users.length} users exported successfully`);
  };

  const handleExportSelected = () => {
    if (!selectedUsersData.length) {
      toast.error("No users selected");
      return;
    }

    const data = selectedUsersData.map((user) => ({
      User: user.fullName,
      Email: user.email,
      Balance: user.currentBalance,
      "Value (£)": user.redemptionValue,
      Earned: user.totalPointsEarned,
      Redeemed: user.totalPointsRedeemed,
      Tier: user.tierLevel,
      "Last Activity": user.lastActivity || "Never",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Users");
    XLSX.writeFile(
      workbook,
      `loyalty-points-selected-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    toast.success(`${selectedUsersData.length} selected users exported`);
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  // ============================================================
  // RENDER: LOADING STATE
  // ============================================================
  
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">Loading loyalty points...</p>
          <p className="text-slate-500 text-sm mt-1">Please wait while we fetch customer data</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: MAIN CONTENT
  // ============================================================

  return (
    <div className="space-y-2">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Loyalty Points Management
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Monitor customer loyalty points, tiers, and transaction history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sticky Export Button */}
          {selectedUsers.size > 0 && (
            <div className="fixed top-[75px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none w-full">
              <div className="flex justify-center px-2">
                <div className="pointer-events-auto mx-auto w-fit max-w-[95%] sm:max-w-[900px] 
                  rounded-xl border border-slate-700 bg-slate-900/95 
                  px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                        <span className="font-semibold text-white">{selectedUsers.size}</span>
                        <span className="text-slate-300">users selected</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Bulk actions: export selected users.</p>
                    </div>
                    <div className="h-5 w-px bg-slate-700 hidden md:block" />
                    <button
                      onClick={handleExportSelected}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Export ({selectedUsers.size})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUsers(new Set());
                        setSelectAll(false);
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export All Button */}
          <button
            onClick={handleExportAll}
            disabled={users.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export Excel ({users.length})
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS - Using backend stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-xl p-3 hover:border-violet-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <User className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Users</p>
              <p className="text-white text-xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-3 hover:border-cyan-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Coins className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Points</p>
              <p className="text-white text-xl font-bold">{formatPoints(stats?.totalPointsBalance || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3 hover:border-green-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Value</p>
             <p className="text-white text-xl font-bold">
  £{((stats?.totalPointsBalance ?? 0) / 100).toLocaleString()}
</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-3 hover:border-orange-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Star className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Avg per User</p>
              <p className="text-white text-xl font-bold">{formatPoints(stats?.averagePointsPerUser || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TIER DISTRIBUTION - Using backend stats */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-violet-400" />
            Tier Distribution
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTierClick('Gold')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tierFilter === 'Gold'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-yellow-500/10 hover:text-yellow-400 border border-slate-700'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span className="font-bold">{stats?.goldUsers || 0}</span>
              <span>Gold</span>
            </button>

            <button
              onClick={() => handleTierClick('Silver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tierFilter === 'Silver'
                  ? 'bg-slate-300 text-black shadow-lg shadow-slate-300/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-500/10 hover:text-slate-300 border border-slate-700'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span className="font-bold">{stats?.silverUsers || 0}</span>
              <span>Silver</span>
            </button>

            <button
              onClick={() => handleTierClick('Bronze')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tierFilter === 'Bronze'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-orange-500/10 hover:text-orange-400 border border-slate-700'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span className="font-bold">{stats?.bronzeUsers || 0}</span>
              <span>Bronze</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT FILTERS & SEARCH - INLINE */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Compact Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {debouncedSearchTerm !== searchTerm && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Tier Filter Dropdown */}
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value as TierLevel);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          >
            <option value="all">All Tiers</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>

          {/* Pagination Info */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="text-xs text-slate-400 font-medium px-2">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Results Count */}
          <span className="text-xs text-slate-500 font-medium">
            {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </span>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                {/* Checkbox Column */}
                <th className="text-left py-2.5 px-3 w-12">
                  <button
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectAll
                        ? 'bg-violet-500 border-violet-500'
                        : selectedUsers.size > 0
                        ? 'bg-violet-500/50 border-violet-500'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {selectAll ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : selectedUsers.size > 0 ? (
                      <Minus className="h-3 w-3 text-white" />
                    ) : null}
                  </button>
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  User
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('currentBalance')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Balance {getSortIcon('currentBalance')}
                  </button>
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('totalPointsEarned')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Earned {getSortIcon('totalPointsEarned')}
                  </button>
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('totalPointsRedeemed')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Redeemed {getSortIcon('totalPointsRedeemed')}
                  </button>
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Tier
                </th>

                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('lastActivity')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Last Activity {getSortIcon('lastActivity')}
                  </button>
                </th>

                <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user, idx) => {
                const tierColors = getTierColor(user.tierLevel);
                const lastActivity = user.lastActivity;
                const isSelected = selectedUsers.has(user.userId);

                return (
                  <tr
                    key={user.userId}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-all ${
                      idx % 2 === 0 ? 'bg-slate-900/20' : ''
                    } ${isSelected ? 'bg-violet-500/10' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleSelectUser(user.userId)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </button>
                    </td>

                    {/* User Info */}
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="text-white text-sm font-medium">{user.fullName}</p>
                        <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="text-white text-sm font-bold">{formatPoints(user.currentBalance)}</p>
                        <p className="text-slate-500 text-xs">£{user.redemptionValue}</p>
                      </div>
                    </td>

                    {/* Earned */}
                    <td className="py-2.5 px-3">
                      <p className="text-green-400 text-sm font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {formatPoints(user.totalPointsEarned)}
                      </p>
                    </td>

                    {/* Redeemed */}
                    <td className="py-2.5 px-3">
                      <p className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {formatPoints(user.totalPointsRedeemed)}
                      </p>
                    </td>

                    {/* Tier Badge */}
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                        {user.tierLevel === 'Gold' && <Crown className="h-3 w-3" />}
                        {user.tierLevel !== 'Gold' && <Award className="h-3 w-3" />}
                        {user.tierLevel}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-2.5 px-3">
                      {lastActivity ? (
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(lastActivity)}
                        </p>
                      ) : (
                        <p className="text-slate-500 text-xs italic">No activity</p>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                      
                        <button
                          onClick={() => handleViewHistory(user)}
                          title="View history"
                          className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg font-medium">No users found</p>
            <p className="text-slate-500 text-sm mt-1">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No loyalty points data available'}
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 flex-wrap gap-2">
          
          <span className="text-sm text-slate-400 font-medium">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-violet-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

     

      {/* HISTORY MODAL */}
  {historyModalOpen && selectedUser && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-cyan-500/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
      
      {/* HEADER */}
      <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Transaction History</h2>
              <p className="text-xs text-slate-400">
                {selectedUser.fullName} • {selectedUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
            setHistoryModalOpen(false);
setUserHistory([]);
setHistoryPage(1);
setExpandedTx(null);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="overflow-y-auto p-4 space-y-4">
        {loadingModal && userHistory.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading history...</p>
          </div>
        ) : userHistory.length > 0 ? (
          <>
            {userHistory.map((tx) => {
              const typeInfo = getTransactionTypeInfo(tx.transactionType);
              const isPositive = tx.points > 0;

              return (
                <div
                  key={tx.id}
                  className={`rounded-xl border ${typeInfo.borderColor} ${typeInfo.bgColor} p-4`}
                >
                  {/* TOP */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${typeInfo.bgColor} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatRelativeDate(tx.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300">
                        {tx.description}
                      </p>
                    </div>

                    <div className={`text-lg font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                      {isPositive ? "+" : ""}
                      {formatPoints(tx.points)}
                    </div>
                  </div>

                  {/* ORDER INFO */}
                  {tx.orderNumber && (
                    <div className="text-xs text-slate-400 mb-3 flex flex-wrap gap-3">
                      <span>Order: {tx.orderNumber}</span>
                      <span>Status: {tx.orderStatus}</span>
                      <span>Total: {formatCurrency(tx.orderTotal || 0)}</span>
                    </div>
                  )}

{tx.products && tx.products.length > 0 && (() => {
  const isExpanded = expandedTx === tx.id;
  const visibleProducts = isExpanded ? tx.products : tx.products.slice(0, 3);

  return (
    <div className="space-y-2">
      {visibleProducts.map((p: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg"
        >
          <img
            src={getOrderProductImage(p.productImageUrl)}
            className="w-10 h-10 rounded object-cover"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {p.productName}
            </p>
            <p className="text-xs text-slate-400">
              Qty: {p.quantity} × {formatCurrency(p.unitPrice)}
            </p>
          </div>

          <div className="text-xs text-white">
            {formatCurrency(p.quantity * p.unitPrice)}
          </div>
        </div>
      ))}

      {/* TOGGLE BUTTON */}
      {tx.products.length > 3 && (
        <button
          onClick={() =>
            setExpandedTx(isExpanded ? null : tx.id)
          }
          className="text-xs text-cyan-400 hover:underline"
        >
          {isExpanded
            ? "Show less"
            : `+${tx.products.length - 3} more items`}
        </button>
      )}
    </div>
  );
})()}
                  {/* BALANCE */}
                  <div className="mt-3 text-xs text-slate-500 flex justify-between">
                    <span>Before: {formatPoints(tx.balanceBefore)}</span>
                    <span>After: {formatPoints(tx.balanceAfter)}</span>
                  </div>
                </div>
              );
            })}

            {/* LOAD MORE */}
            {hasMoreHistory && (
              <button
                onClick={loadMoreHistory}
                disabled={loadingModal}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loadingModal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}