// lib/services/discounts.ts

import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

// --- Discount Type & Limitation Types ---
export type DiscountType =
  | "AssignedToOrderTotal"
  | "AssignedToProducts"
  | "AssignedToCategories"
  | "AssignedToManufacturers"
  | "AssignedToShipping"
  | "AssignedToOrderSubTotal";

export type DiscountLimitationType = "Unlimited" | "NTimesOnly" | "NTimesPerCustomer";

// --- Discount Interface ---
export interface Discount {
  id: string;
  name: string;
  isActive: boolean;
  discountType: DiscountType;
  usePercentage: boolean;
  discountAmount: number;
  discountPercentage: number;
  maximumDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  requiresCouponCode: boolean;
  couponCode: string | null;
  isCumulative: boolean;
  discountLimitation: DiscountLimitationType;
  limitationTimes: number | null;
  maximumDiscountedQuantity: number | null;
  appliedToSubOrders: boolean;
  adminComment: string;
  desktopBannerImageUrl: string | null;
  mobileBannerImageUrl: string | null;
  assignedProductIds: string;
  assignedCategoryIds: string;
  assignedManufacturerIds: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: string;
  updatedBy?: string | null;
}

// --- Usage History Interface ---
export interface DiscountUsageHistory {
  id: string;
  discountId: string;
  discountName: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  discountAmount: number;
  usedAt: string;
  appliedToProductNames?: string;
  appliedToCategoryNames?: string;
  appliedToManufacturerNames?: string;
}

// --- API Response Interfaces ---
export interface DiscountApiResponse {
  success: boolean;
  message?: string;
  data: Discount[];
  errors?: string[] | null;
}

export interface SingleDiscountResponse {
  success: boolean;
  message?: string;
  data: Discount;
  errors?: string[] | null;
}

export interface DiscountUsageHistoryResponse {
  success: boolean;
  message: string;
  data: DiscountUsageHistory[];
  errors: string[] | null;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  errors?: string[] | null;
}

// --- CreateUpdate DTO ---
export interface CreateDiscountDto {
  name: string;
  isActive: boolean;
  discountType: DiscountType;
  usePercentage: boolean;
  discountAmount: number;
  discountPercentage: number;
  maximumDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  requiresCouponCode: boolean;
  couponCode: string;
  isCumulative: boolean;
  discountLimitation: DiscountLimitationType;
  limitationTimes: number | null;
  maximumDiscountedQuantity: number | null;
  appliedToSubOrders: boolean;
  adminComment: string;
  assignedProductIds: string;
  assignedCategoryIds: string;
  assignedManufacturerIds: string;
}

// ✅ VALIDATION HELPER
const validateDiscountData = (data: Partial<CreateDiscountDto>): string[] => {
  const errors: string[] = [];

  if (data.name !== undefined && !data.name.trim()) {
    errors.push("Discount name is required");
  }

  if (data.usePercentage && data.discountPercentage !== undefined) {
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      errors.push("Discount percentage must be between 0 and 100");
    }
  }

  if (!data.usePercentage && data.discountAmount !== undefined) {
    if (data.discountAmount < 0) {
      errors.push("Discount amount must be positive");
    }
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.push("End date must be after start date");
    }
  }

  if (data.requiresCouponCode && !data.couponCode?.trim()) {
    errors.push("Coupon code is required when 'Requires Coupon Code' is enabled");
  }

  if (data.discountLimitation === "NTimesOnly" || data.discountLimitation === "NTimesPerCustomer") {
    if (!data.limitationTimes || data.limitationTimes < 1) {
      errors.push("Limitation times must be greater than 0");
    }
  }

  return errors;
};

// --- Main Service ---
export const discountsService = {
  /**
   * Get all discounts with optional filters
   * @param config - Axios config with params like { params: { includeInactive: true } }
   */
  getAll: async (config: any = {}) => {
    try {
      return await apiClient.get<DiscountApiResponse>(API_ENDPOINTS.discounts, config);
    } catch (error: any) {
      console.error("Error fetching discounts:", error);
      throw error;
    }
  },

  /**
   * Get discount by ID
   * @param id - Discount ID
   */
  getById: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Discount ID is required");
    }
    
    try {
      return await apiClient.get<SingleDiscountResponse>(
        `${API_ENDPOINTS.discounts}/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error fetching discount ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new discount
   * @param data - Discount creation data
   */
  create: async (data: CreateDiscountDto, config: any = {}) => {
    // ✅ Validate before sending
    const validationErrors = validateDiscountData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.post<SingleDiscountResponse>(
        API_ENDPOINTS.discounts,
        data,
        config
      );
    } catch (error: any) {
      console.error("Error creating discount:", error);
      throw error;
    }
  },

  /**
   * Update existing discount
   * @param id - Discount ID
   * @param data - Partial discount data to update
   */
  update: async (id: string, data: Partial<CreateDiscountDto>, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Discount ID is required");
    }

    // ✅ Validate before sending
    const validationErrors = validateDiscountData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.put<SingleDiscountResponse>(
        `${API_ENDPOINTS.discounts}/${id}`,
        data,
        config
      );
    } catch (error: any) {
      console.error(`Error updating discount ${id}:`, error);
      throw error;
    }
  },

  restore: async (id: string, config: any = {}) => {
  if (!id?.trim()) {
    throw new Error("Discount ID is required");
  }

  try {
    return await apiClient.post(
      `${API_ENDPOINTS.discounts}/${id}/restore`,
      {},
      config
    );
  } catch (error: any) {
    console.error(`Error restoring discount ${id}:`, error);
    throw error;
  }
},

  /**
   * Delete discount by ID
   * @param id - Discount ID
   */
  delete: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Discount ID is required");
    }

    try {
      return await apiClient.delete<DeleteResponse>(
        `${API_ENDPOINTS.discounts}/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error deleting discount ${id}:`, error);
      throw error;
    }
  },

  // Upload banner image
uploadBannerImage: async (
  id: string,
  file: File,
  type: "desktop" | "mobile" = "desktop",
  config: any = {}
) => {
  if (!id?.trim()) {
    throw new Error("Discount ID is required");
  }

  try {
    const formData = new FormData();
    formData.append("image", file);

    return await apiClient.post(
      `${API_ENDPOINTS.discounts}/${id}/upload-banner-image?type=${type}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        ...config,
      }
    );
  } catch (error: any) {
    console.error("Error uploading banner image:", error);
    throw error;
  }
},

// Delete banner image
deleteBannerImage: async (
  id: string,
  type: "desktop" | "mobile" = "desktop",
  config: any = {}
) => {
  if (!id?.trim()) {
    throw new Error("Discount ID is required");
  }

  try {
    return await apiClient.delete(
      `${API_ENDPOINTS.discounts}/${id}/delete-banner-image?type=${type}`,
      config
    );
  } catch (error: any) {
    console.error("Error deleting banner image:", error);
    throw error;
  }
},

  /**
   * Get usage history for a discount
   * @param id - Discount ID
   */
  getUsageHistory: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Discount ID is required");
    }

    try {
      return await apiClient.get<DiscountUsageHistoryResponse>(
        `${API_ENDPOINTS.discounts}/${id}/usage-history`,
        config
      );
    } catch (error: any) {
      console.error(`Error fetching usage history for discount ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ BONUS: Validate discount code availability
   */
  validateCouponCode: async (code: string, orderSubtotal: number = 0, productIds: string[] = [], categoryIds: string[] = []) => {
    if (!code?.trim()) {
      throw new Error("Coupon code is required");
    }

    try {
      return await apiClient.post<{ success: boolean; data: any; message: string }>(
        `${API_ENDPOINTS.discounts}/validate-coupon`,
        { couponCode: code, orderSubtotal, productIds, categoryIds }
      );
    } catch (error: any) {
      console.error("Error validating coupon code:", error);
      throw error;
    }
  },

};

// ✅ HELPER UTILITIES
export const discountHelpers = {
  /**
   * Check if discount is currently active
   */
  isActive: (discount: Discount): boolean => {
    if (!discount.isActive) return false;
    const now = new Date();
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);
    return now >= start && now <= end;
  },

  /**
   * Format discount value for display
   */
  formatValue: (discount: Discount): string => {
    if (discount.usePercentage) {
      return `${discount.discountPercentage}%`;
    }
    return `£${discount.discountAmount.toFixed(2)}`;
  },

  /**
   * Calculate days until expiry
   */
  daysUntilExpiry: (discount: Discount): number => {
    const now = new Date();
    const end = new Date(discount.endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Parse assigned IDs string to array
   */
  parseAssignedIds: (idsString: string): string[] => {
    if (!idsString?.trim()) return [];
    return idsString.split(',').map(id => id.trim()).filter(id => id !== '');
  },

  /**
   * Join assigned IDs array to string
   */
  joinAssignedIds: (idsArray: string[]): string => {
    return idsArray.filter(id => id?.trim()).join(',');
  }
};
