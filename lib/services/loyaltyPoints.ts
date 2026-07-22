// lib/services/loyaltyPoints.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ============================================================
// LOYALTY POINTS INTERFACES
// ============================================================

export interface LoyaltyBalance {
  id: string;
  userId: string;
  hasAccount?: boolean;
  currentBalance: number;
  redemptionValue: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  tierLevel: 'Bronze' | 'Silver' | 'Gold';
  pointsToNextTier: number;
  firstOrderBonusAwarded: boolean;
  totalReviewBonusEarned: number;
  totalReferralBonusEarned: number;
  lastEarnedAt: string;
  lastRedeemedAt: string | null;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;

  transactionType: 
    | 'Earned'
    | 'Redeemed'
    | 'FirstOrderBonus'
    | 'ReviewBonus'
    | 'ReferralBonus'
    | 'Expired'
    | 'Adjustment';

  points: number;
  absolutePoints: number;

  balanceBefore: number;
  balanceAfter: number;

  description: string;

  createdAt: string;
  expiresAt?: string;
  isExpired: boolean;

  orderId?: string;
  orderNumber?: string;
  orderDate?: string;
  orderTotal?: number;
  orderStatus?: string;

  products?: {
    productName: string;
    productSku: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    productImageUrl: string;
  }[];
}
// ============================================================
// NEW: Aggregated User Response from /api/loyalty/users
// ============================================================

export interface LoyaltyUser {
  userId: string;
  fullName: string;
  email: string;
  currentBalance: number;
  redemptionValue: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  tierLevel: 'Bronze' | 'Silver' | 'Gold';
  lastActivity?: string | null;
}

export interface LoyaltyUsersApiResponse {
  success: boolean;
  message: string;
  data: {
    items: LoyaltyUser[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    stats: {
      totalUsers: number;
      totalPointsBalance: number;
      totalPointsEarned: number;
      totalPointsRedeemed: number;
      averagePointsPerUser: number;
      goldUsers: number;
      silverUsers: number;
      bronzeUsers: number;
    };
  };
}

export interface LoyaltyBalanceApiResponse {
  success: boolean;
  message: string;
  data?: LoyaltyBalance;
  errors?: string[] | null;
}

export interface LoyaltyHistoryApiResponse {
  success: boolean;
  message: string;
  data?: {
    items: LoyaltyTransaction[];
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface LoyaltyHistoryQueryParams {
  pageNumber?: number;
  pageSize?: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================
// LOYALTY POINTS SERVICE - UPDATED
// ============================================================

export const loyaltyPointsService = {
  /**
   * ✅ NEW: Get all users with loyalty data (aggregated from backend)
   * GET /api/loyalty/users?page=1&pageSize=20&tierLevel=Gold&searchTerm=arun&sortBy=balance&sortDirection=desc
   */
  getAllUsersWithLoyalty: async (params?: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    tierLevel?: 'Gold' | 'Silver' | 'Bronze' | string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params?.tierLevel && params.tierLevel !== 'all') queryParams.append('tierLevel', params.tierLevel);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);

      const endpoint = queryParams.toString() 
        ? `/api/loyalty/users?${queryParams.toString()}`
        : '/api/loyalty/users';

      const response = await apiClient.get<LoyaltyUsersApiResponse>(endpoint);
      
      return {
        success: response.data?.success || false,
        message: response.data?.message || '',
        data: response.data?.data || null,
      };
    } catch (error) {
      console.error('Error fetching loyalty users:', error);
      throw error;
    }
  },

  /**
   * Get current user's loyalty balance
   * GET /api/loyalty/balance
   */
  getBalance: (config: any = {}) =>
    apiClient.get<LoyaltyBalanceApiResponse>(API_ENDPOINTS.loyaltyPoints.balance, config),

  /**
   * Get current user's loyalty transaction history
   * GET /api/loyalty/history
   */
  getHistory: (params?: LoyaltyHistoryQueryParams, config: any = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params?.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.loyaltyPoints.history}?${queryParams.toString()}`
      : API_ENDPOINTS.loyaltyPoints.history;

    return apiClient.get<LoyaltyHistoryApiResponse>(endpoint, config);
  },

  /**
   * Get specific user's balance by userId
   */
  getUserBalance: async (userId: string) => {
    try {
      const response = await apiClient.get<LoyaltyBalanceApiResponse>(
        `${API_ENDPOINTS.loyaltyPoints.balance}?userId=${userId}`
      );
      return response;
    } catch (error) {
      console.error(`Failed to get balance for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get specific user's history by userId
   */
getUserHistory: async (userId: string, params?: LoyaltyHistoryQueryParams) => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.pageNumber) queryParams.append('page', params.pageNumber.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const endpoint = `/api/loyalty/history/${userId}?${queryParams.toString()}`;

    return await apiClient.get<LoyaltyHistoryApiResponse>(endpoint);
  } catch (error) {
    console.error(`Failed to get history for user ${userId}:`, error);
    throw error;
  }
}
};

// ============================================================
// HELPER FUNCTIONS (same as before)
// ============================================================

export const formatPoints = (points: number): string => {
  return points.toLocaleString('en-GB');
};

export const getTierColor = (tier: string): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} => {
  switch (tier.toLowerCase()) {
    case 'gold':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        icon: 'text-yellow-400',
      };
    case 'silver':
      return {
        bg: 'bg-slate-400/10',
        text: 'text-slate-300',
        border: 'border-slate-400/30',
        icon: 'text-slate-300',
      };
    case 'bronze':
    default:
      return {
        bg: 'bg-orange-600/10',
        text: 'text-orange-400',
        border: 'border-orange-600/30',
        icon: 'text-orange-400',
      };
  }
};

export const getTransactionTypeInfo = (type: string): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} => {
  switch (type) {
    case 'Earned':
      return {
        label: 'Earned',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
      };
    case 'Redeemed':
      return {
        label: 'Redeemed',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      };
    case 'FirstOrderBonus':
      return {
        label: 'First Order Bonus',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
      };
    case 'ReviewBonus':
      return {
        label: 'Review Bonus',
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30',
      };
    case 'ReferralBonus':
      return {
        label: 'Referral Bonus',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
      };
    case 'Expired':
      return {
        label: 'Expired',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      };
    case 'Adjustment':
      return {
        label: 'Adjustment',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
      };
    default:
      return {
        label: type,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
      };
  }
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

export const formatExpiryDate = (expiresAt: string | null | undefined): {
  text: string;
  isExpiringSoon: boolean;
  color: string;
} => {
  if (!expiresAt) {
    return {
      text: 'Never expires',
      isExpiringSoon: false,
      color: 'text-slate-500',
    };
  }

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: 'Expired',
      isExpiringSoon: false,
      color: 'text-red-400',
    };
  }

  if (diffDays <= 30) {
    return {
      text: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      isExpiringSoon: true,
      color: 'text-orange-400',
    };
  }

  const formattedDate = expiryDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    text: `Expires ${formattedDate}`,
    isExpiringSoon: false,
    color: 'text-slate-400',
  };
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  let cleanString = dateString;
  if (
    cleanString.includes("T") &&
    !cleanString.endsWith("Z") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("+") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("-")
  ) {
    cleanString = `${cleanString}Z`;
  }
  const parsedDate = new Date(cleanString);
  if (isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
};