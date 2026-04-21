import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

export interface DeliveryStrip {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  slug: string;
  displayOrder: number | null; // ✅ Changed to allow null
  isActive: boolean;
  isDeleted: boolean;
  pageTitle: string;
  pageSubtitle: string;
  featureCards: {
    icon: string;
    heading: string;
    description: string;
  }[];
  infoSectionTitle: string;
  infoPoints: string[];
  pageContentJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStripPayload {
  id?: string;
  title: string;
  subtitle: string;
  icon: string;
  slug: string;
  displayOrder: number | null; // ✅ Changed to allow null
  isActive: boolean;
  pageTitle: string;
  pageSubtitle: string;
  featureCards: {
    icon: string;
    heading: string;
    description: string;
  }[];
  infoSectionTitle: string;
  infoPoints: string[];
  pageContentJson: string;
  currentUser: string;
}

export interface DeliveryStripListResponse {
  success: boolean;
  message: string;
  data: DeliveryStrip[];
}

export interface DeliveryStripSingleResponse {
  success: boolean;
  message: string;
  data: DeliveryStrip;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export const deliveryStripService = {
  getAll: () =>
    apiClient.get<DeliveryStripListResponse>(`${API_ENDPOINTS.deliveryStrip}/admin`),

  getById: (id: string) =>
    apiClient.get<DeliveryStripSingleResponse>(`${API_ENDPOINTS.deliveryStrip}/${id}`),

  create: (data: DeliveryStripPayload) =>
    apiClient.post<ApiResponse>(API_ENDPOINTS.deliveryStrip, data),

  update: (id: string, data: DeliveryStripPayload) =>
    apiClient.put<ApiResponse>(`${API_ENDPOINTS.deliveryStrip}/${id}`, {
      ...data,
      id,
    }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`${API_ENDPOINTS.deliveryStrip}/${id}`),

  toggle: (id: string) =>
    apiClient.patch<ApiResponse>(`${API_ENDPOINTS.deliveryStrip}/${id}/toggle`),
};