import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";
import {
  ShippingZone,
  CreateZoneDto,
  UpdateZoneDto,
  ShippingMethod,
  CreateMethodDto,
  UpdateMethodDto,
  CreateRateDto,
  UpdateRateDto,
  ZoneApiResponse,
  SingleZoneResponse,
  MethodApiResponse,
  SingleMethodResponse,
  RateApiResponse,
  SingleRateResponse,
  DeleteResponse,
  ShippingStats,
} from "../types/shipping";

// ✅ VALIDATION HELPERS
const validateZoneData = (data: Partial<CreateZoneDto>): string[] => {
  const errors: string[] = [];

  if (data.name !== undefined && !data.name.trim()) {
    errors.push("Zone name is required");
  }

  if (data.description !== undefined && !data.description.trim()) {
    errors.push("Zone description is required");
  }

  if (data.country !== undefined) {
    if (!data.country.trim()) {
      errors.push("Country code is required");
    } else if (data.country.length !== 2) {
      errors.push("Country code must be 2 characters (e.g., GB, US)");
    }
  }

  if (data.displayOrder !== undefined && data.displayOrder < 0) {
    errors.push("Display order must be a positive number");
  }

  return errors;
};

const validateMethodData = (data: Partial<CreateMethodDto>): string[] => {
  const errors: string[] = [];

  if (data.name !== undefined && !data.name.trim()) {
    errors.push("Method name is required");
  }

  if (data.displayName !== undefined && !data.displayName.trim()) {
    errors.push("Display name is required");
  }

  if (data.carrierCode !== undefined && !data.carrierCode.trim()) {
    errors.push("Carrier code is required");
  }

  if (data.serviceCode !== undefined && !data.serviceCode.trim()) {
    errors.push("Service code is required");
  }

  if (data.deliveryTimeMinDays !== undefined && data.deliveryTimeMinDays < 0) {
    errors.push("Minimum delivery days must be positive");
  }

  if (data.deliveryTimeMaxDays !== undefined && data.deliveryTimeMaxDays < 0) {
    errors.push("Maximum delivery days must be positive");
  }

  if (
    data.deliveryTimeMinDays !== undefined &&
    data.deliveryTimeMaxDays !== undefined &&
    data.deliveryTimeMaxDays < data.deliveryTimeMinDays
  ) {
    errors.push("Maximum delivery days must be greater than minimum");
  }

  return errors;
};

const validateRateData = (data: Partial<CreateRateDto>): string[] => {
  const errors: string[] = [];

  if (data.shippingZoneId !== undefined && !data.shippingZoneId.trim()) {
    errors.push("Shipping zone is required");
  }

  if (data.shippingMethodId !== undefined && !data.shippingMethodId.trim()) {
    errors.push("Shipping method is required");
  }

  if (data.weightFrom !== undefined && data.weightFrom < 0) {
    errors.push("Weight from must be positive");
  }

  if (data.weightTo !== undefined && data.weightTo < 0) {
    errors.push("Weight to must be positive");
  }

  if (
    data.weightFrom !== undefined &&
    data.weightTo !== undefined &&
    data.weightTo <= data.weightFrom
  ) {
    errors.push("Weight to must be greater than weight from");
  }

  if (data.baseRate !== undefined && data.baseRate < 0) {
    errors.push("Base rate must be positive");
  }

  if (data.perKgRate !== undefined && data.perKgRate < 0) {
    errors.push("Per kg rate must be positive");
  }

  if (data.perItemRate !== undefined && data.perItemRate < 0) {
    errors.push("Per item rate must be positive");
  }

  return errors;
};

// ==================== MAIN SERVICE ====================

export const shippingService = {
  // ==================== ZONES ====================

  /**
   * Get all shipping zones
   * @param config - Axios config with params like { params: { includeInactive: true } }
   */
  getAllZones: async (config: any = {}) => {
    try {
      return await apiClient.get<ZoneApiResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones`,
        config
      );
    } catch (error: any) {
      console.error("Error fetching zones:", error);
      throw error;
    }
  },

  /**
   * Get zone by ID
   * @param id - Zone ID
   */
  getZoneById: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Zone ID is required");
    }

    try {
      return await apiClient.get<SingleZoneResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error fetching zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new zone
   * @param data - Zone creation data
   */
  createZone: async (data: CreateZoneDto, config: any = {}) => {
    // ✅ Validate before sending
    const validationErrors = validateZoneData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.post<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones`,
        data,
        config
      );
    } catch (error: any) {
      console.error("Error creating zone:", error);
      throw error;
    }
  },

  /**
   * Update existing zone
   * @param id - Zone ID
   * @param data - Zone update data
   */
  updateZone: async (id: string, data: UpdateZoneDto, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Zone ID is required");
    }

    // ✅ Validate before sending
    const validationErrors = validateZoneData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.put<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones/${id}`,
        data,
        config
      );
    } catch (error: any) {
      console.error(`Error updating zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete zone by ID
   * @param id - Zone ID
   */
  deleteZone: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Zone ID is required");
    }

    try {
      return await apiClient.delete<DeleteResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error deleting zone ${id}:`, error);
      throw error;
    }
  },



/**
 * Restore Soft Deleted Zone
 */
restoreZone: async (id: string) => {
  if (!id?.trim()) throw new Error("Zone ID is required");

  return await apiClient.post(
    `${API_ENDPOINTS.shipping}/admin/zones/${id}/restore`
  );
},

  // ==================== METHODS ====================

  /**
   * Get all shipping methods
   * @param config - Axios config with params like { params: { includeInactive: true } }
   */
  getAllMethods: async (config: any = {}) => {
    try {
      return await apiClient.get<MethodApiResponse>(
        `${API_ENDPOINTS.shipping}/admin/methods`,
        config
      );
    } catch (error: any) {
      console.error("Error fetching methods:", error);
      throw error;
    }
  },

  /**
   * Get method by ID
   * @param id - Method ID
   */
  getMethodById: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Method ID is required");
    }

    try {
      return await apiClient.get<SingleMethodResponse>(
        `${API_ENDPOINTS.shipping}/admin/methods/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error fetching method ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new method
   * @param data - Method creation data
   */
  createMethod: async (data: CreateMethodDto, config: any = {}) => {
    // ✅ Validate before sending
    const validationErrors = validateMethodData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.post<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/methods`,
        data,
        config
      );
    } catch (error: any) {
      console.error("Error creating method:", error);
      throw error;
    }
  },

  /**
   * Update existing method
   * @param id - Method ID
   * @param data - Method update data
   */
  updateMethod: async (id: string, data: UpdateMethodDto, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Method ID is required");
    }

    // ✅ Validate before sending
    const validationErrors = validateMethodData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.put<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/methods/${id}`,
        data,
        config
      );
    } catch (error: any) {
      console.error(`Error updating method ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete method by ID
   * @param id - Method ID
   */
  deleteMethod: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Method ID is required");
    }

    try {
      return await apiClient.delete<DeleteResponse>(
        `${API_ENDPOINTS.shipping}/admin/methods/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error deleting method ${id}:`, error);
      throw error;
    }
  },
  

// ==============================
// restoreMethod: async (id: string) => 
// ==============================
restoreMethod: async (id: string) => {
  if (!id?.trim()) {
    throw new Error("Method ID is required");
  }

  return await apiClient.post(
    `${API_ENDPOINTS.shipping}/admin/methods/${id}/restore`
  );
},
  // ==================== RATES ====================

  /**
   * Get rates for a zone
   * @param zoneId - Zone ID
   */
  getZoneRates: async (zoneId: string, config: any = {}) => {
    if (!zoneId?.trim()) {
      throw new Error("Zone ID is required");
    }

    try {
      return await apiClient.get<RateApiResponse>(
        `${API_ENDPOINTS.shipping}/admin/zones/${zoneId}/rates`,
        config
      );
    } catch (error: any) {
      console.error(`Error fetching rates for zone ${zoneId}:`, error);
      throw error;
    }
  },

  /**
   * Create new rate
   * @param data - Rate creation data
   */
  createRate: async (data: CreateRateDto, config: any = {}) => {
    // ✅ Validate before sending
    const validationErrors = validateRateData(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.post<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/rates`,
        data,
        config
      );
    } catch (error: any) {
      console.error("Error creating rate:", error);
      throw error;
    }
  },

  /**
   * Update existing rate
   * @param id - Rate ID
   * @param data - Rate update data
   */
  updateRate: async (id: string, data: UpdateRateDto, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Rate ID is required");
    }

    // ✅ Validate before sending (partial validation for update)
    const validationErrors: string[] = [];
    
    if (data.baseRate !== undefined && data.baseRate < 0) {
      validationErrors.push("Base rate must be positive");
    }
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      return await apiClient.put<SingleRateResponse>(
        `${API_ENDPOINTS.shipping}/admin/rates/${id}`,
        data,
        config
      );
    } catch (error: any) {
      console.error(`Error updating rate ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete rate by ID
   * @param id - Rate ID
   */
  deleteRate: async (id: string, config: any = {}) => {
    if (!id?.trim()) {
      throw new Error("Rate ID is required");
    }

    try {
      return await apiClient.delete<DeleteResponse>(
        `${API_ENDPOINTS.shipping}/admin/rates/${id}`,
        config
      );
    } catch (error: any) {
      console.error(`Error deleting rate ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ BONUS: Get shipping statistics
   */
  getStats: async () => {
    try {
      return await apiClient.get<{ success: boolean; data: ShippingStats }>(
        `${API_ENDPOINTS.shipping}/admin/stats`
      );
    } catch (error: any) {
      console.error("Error fetching shipping stats:", error);
      throw error;
    }
  },
};

// ✅ HELPER UTILITIES
export const shippingHelpers = {
  /**
   * Check if zone is active
   */
  isZoneActive: (zone: ShippingZone): boolean => {
    return zone.isActive;
  },

  /**
   * Check if method is active
   */
  isMethodActive: (method: ShippingMethod): boolean => {
    return method.isActive;
  },

  /**
   * Format delivery time
   */
  formatDeliveryTime: (method: ShippingMethod): string => {
    if (method.deliveryTimeMinDays === method.deliveryTimeMaxDays) {
      return `${method.deliveryTimeMinDays} day${method.deliveryTimeMinDays > 1 ? "s" : ""}`;
    }
    return `${method.deliveryTimeMinDays}-${method.deliveryTimeMaxDays} days`;
  },

  /**
   * Format weight range
   */
  formatWeightRange: (rate: any): string => {
    return `${rate.weightFrom}kg - ${rate.weightTo}kg`;
  },

  /**
   * Format rate display
   */
  formatRate: (rate: any): string => {
    if (rate.baseRate === 0 && rate.freeShippingThreshold === null) {
      return "FREE";
    }
    return `£${rate.baseRate.toFixed(2)}`;
  },

  /**
   * Calculate effective rate
   */
  calculateRate: (rate: any, weight: number, orderValue: number): number => {
    if (rate.freeShippingThreshold && orderValue >= rate.freeShippingThreshold) {
      return 0;
    }

    let total = rate.baseRate;
    
    if (rate.perKgRate > 0) {
      total += weight * rate.perKgRate;
    }

    if (rate.minimumCharge && total < rate.minimumCharge) {
      total = rate.minimumCharge;
    }

    if (rate.maximumCharge && total > rate.maximumCharge) {
      total = rate.maximumCharge;
    }

    return total;
  },
};
