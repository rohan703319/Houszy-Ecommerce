import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

interface GoogleMerchantResponse {
  success: boolean;
  message: string;
  data: string;
  errors?: string[];
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

  // ✅ NEW
getFeedXml: async () => {
  return apiClient.get(
    `${API_ENDPOINTS.GoogleMerchantCenter}/feed.xml`,
    {
      responseType: "text",
    }
  );
},
};

export type { GoogleMerchantResponse };