// lib/services/loyaltyConfig.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ============================================================
// LOYALTY CONFIG INTERFACES
// ============================================================

export interface LoyaltyConfig {
  id: string;
  pointsPerPound: number;
  minimumOrderAmountForPoints: number;
  maxPointsPerRedemption: number; // ✅ ADD THIS
  includeShippingInPoints: boolean;
  includeTaxInPoints: boolean;
  redemptionRate: number;
  minimumRedemptionPoints: number;
  maxRedemptionPercentOfOrder: number;
  roundDownRedemptionValue: boolean;
  pointsExpiryMonths: number;
  enableExpiry: boolean;
  expiryWarningDays: number;
  firstOrderBonusPoints: number;
  firstOrderBonusEnabled: boolean;
  reviewBonusPoints: number;
  reviewBonusEnabled: boolean;
  maxReviewBonusPerProduct: number;
  referralBonusPoints: number;
  referralBonusEnabled: boolean;
  silverTierThreshold: number;
  goldTierThreshold: number;
  tierSystemEnabled: boolean;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface UpdateLoyaltyConfigDto {
  id: string;
  pointsPerPound: number;
  minimumOrderAmountForPoints: number;
  maxPointsPerRedemption: number; // ✅ ADD THIS
  includeShippingInPoints: boolean;
  includeTaxInPoints: boolean;
  redemptionRate: number;
  minimumRedemptionPoints: number;
  maxRedemptionPercentOfOrder: number;
  roundDownRedemptionValue: boolean;
  pointsExpiryMonths: number;
  enableExpiry: boolean;
  expiryWarningDays: number;
  firstOrderBonusPoints: number;
  firstOrderBonusEnabled: boolean;
  reviewBonusPoints: number;
  reviewBonusEnabled: boolean;
  maxReviewBonusPerProduct: number;
  referralBonusPoints: number;
  referralBonusEnabled: boolean;
  silverTierThreshold: number;
  goldTierThreshold: number;
  tierSystemEnabled: boolean;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LoyaltyConfigApiResponse {
  success: boolean;
  message: string;
  data?: LoyaltyConfig;
  errors?: string[] | null;
}

// ============================================================
// LOYALTY CONFIG SERVICE
// ============================================================

export const loyaltyConfigService = {
  /**
   * Get current loyalty configuration
   * GET /api/admin/loyalty-config
   */
  get: (config: any = {}) =>
    apiClient.get<LoyaltyConfigApiResponse>(API_ENDPOINTS.loyaltyConfig, config),

  /**
   * Create loyalty configuration
   * POST /api/admin/loyalty-config
   */
  create: (data: UpdateLoyaltyConfigDto, config: any = {}) =>
    apiClient.post<LoyaltyConfigApiResponse>(API_ENDPOINTS.loyaltyConfig, data, config),

  /**
   * Update loyalty configuration
   * PUT /api/admin/loyalty-config
   */
  update: (data: UpdateLoyaltyConfigDto, config: any = {}) =>
    apiClient.put<LoyaltyConfigApiResponse>(API_ENDPOINTS.loyaltyConfig, data, config),
};

// ============================================================
// HELPER FUNCTIONS (Optional)
// ============================================================

/**
 * Calculate points for an order amount
 */
export const calculatePoints = (
  orderAmount: number,
  config: LoyaltyConfig
): number => {
  if (orderAmount < config.minimumOrderAmountForPoints) {
    return 0;
  }
  return Math.floor(orderAmount * config.pointsPerPound);
};

export const getEffectiveMaxRedeemablePoints = (
  userBalance: number,
  orderAmount: number,
  config: LoyaltyConfig
): number => {
  const percentLimitPoints = Math.floor(
    (orderAmount * (config.maxRedemptionPercentOfOrder / 100)) *
    config.redemptionRate
  );

  return Math.min(
    userBalance,
    config.maxPointsPerRedemption,
    percentLimitPoints
  );
};

/**
 * Calculate redemption value from points
 */
export const calculateRedemptionValue = (
  points: number,
  config: LoyaltyConfig
): number => {
  if (points < config.minimumRedemptionPoints) {
    return 0;
  }
  const value = points / config.redemptionRate;
 return config.roundDownRedemptionValue
  ? Math.floor(value * 100) / 100
  : value;
};

/**
 * Get tier name based on points
 */
export const getTierName = (
  totalPoints: number,
  config: LoyaltyConfig
): 'Bronze' | 'Silver' | 'Gold' => {
  if (!config.tierSystemEnabled) {
    return 'Bronze';
  }
  
  if (totalPoints >= config.goldTierThreshold) {
    return 'Gold';
  }
  
  if (totalPoints >= config.silverTierThreshold) {
    return 'Silver';
  }
  
  return 'Bronze';
};

/**
 * Check if points will expire soon
 */
export const willPointsExpireSoon = (
  earnedDate: string,
  config: LoyaltyConfig
): boolean => {
  if (!config.enableExpiry) {
    return false;
  }

  const earned = new Date(earnedDate);
  const expiryDate = new Date(earned);
  expiryDate.setMonth(expiryDate.getMonth() + config.pointsExpiryMonths);
  
  const warningDate = new Date(expiryDate);
  warningDate.setDate(warningDate.getDate() - config.expiryWarningDays);
  
  const now = new Date();
  
  return now >= warningDate && now < expiryDate;
};

/**
 * Calculate expiry date for points
 */
export const getPointsExpiryDate = (
  earnedDate: string,
  config: LoyaltyConfig
): Date | null => {
  if (!config.enableExpiry) {
    return null;
  }

  const earned = new Date(earnedDate);
  const expiryDate = new Date(earned);
  expiryDate.setMonth(expiryDate.getMonth() + config.pointsExpiryMonths);
  
  return expiryDate;
};
