import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

interface GoogleMerchantResponse {
  success: boolean;
  message: string;
  data: any;
  errors?: string[];
}

export interface GoogleMerchantSyncStatus {
  isRunning: boolean;
  status: "Idle" | "InProgress" | "Completed" | "CompletedWithErrors" | "Failed";
  currentAction: "sync-all" | "clean-resync" | null;
  startedAt?: string;
  completedAt?: string;
  totalEligible: number;
  processed: number;
  synced: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  percentComplete: number;
  message: string;
  recentErrors: string[];
}

export const googleMerchantService = {
  syncAll: async () => {
    return apiClient.post<GoogleMerchantResponse>(
      `${API_ENDPOINTS.GoogleMerchantCenter}/sync-all`
    );
  },

  syncProduct: async (productId: string) => {
    return apiClient.post<GoogleMerchantResponse>(
      `${API_ENDPOINTS.GoogleMerchantCenter}/sync/${productId}`
    );
  },

  deleteProductBySku: async (sku: string) => {
    return apiClient.delete<GoogleMerchantResponse>(
      `${API_ENDPOINTS.GoogleMerchantCenter}/product/${encodeURIComponent(sku)}`
    );
  },

  getFeedXml: async () => {
    return apiClient.get(
      `${API_ENDPOINTS.GoogleMerchantCenter}/feed.xml`,
      {
        responseType: "text",
      }
    );
  },

  cleanResync: async () => {
    return apiClient.post<GoogleMerchantResponse>(
      `${API_ENDPOINTS.GoogleMerchantCenter}/clean-resync`
    );
  },

  getReviewsFeedXml: async () => {
    return apiClient.get(
      `${API_ENDPOINTS.GoogleMerchantCenter}/reviews-feed.xml`,
      {
        responseType: "text",
      }
    );
  },

  getSyncStatus: async () => {
    return apiClient.get<GoogleMerchantSyncStatus>(
      `${API_ENDPOINTS.GoogleMerchantCenter}/sync-status`
    );
  },
};

export type { GoogleMerchantResponse };