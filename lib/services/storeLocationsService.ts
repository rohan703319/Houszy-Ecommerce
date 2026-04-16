import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// --- Store Location Interface ---
export interface StoreLocation {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  openingHours?: string;
  email?: string;
  isActive: boolean;
  displayOrder: number;
}

// --- API Response ---
export interface StoreLocationApiResponse {
  success: boolean;
  message?: string;
  data: StoreLocation[];
}

// --- Create / Update DTO ---
export interface CreateStoreLocationDto {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  openingHours?: string;
  email?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// --- Main Service ---
export const storeLocationsService = {
  // ✅ GET ALL (Admin / Public)
  getAll: (config: any = {}) =>
    apiClient.get<StoreLocationApiResponse>(
      API_ENDPOINTS.StoreLocations,
      config
    ),

  // ✅ GET BY ID
  getById: (id: string, config: any = {}) =>
    apiClient.get<StoreLocation>(
      `${API_ENDPOINTS.StoreLocations}/${id}`,
      config
    ),

  // ✅ CREATE
  create: (data: CreateStoreLocationDto, config: any = {}) =>
    apiClient.post<StoreLocation>(
      API_ENDPOINTS.StoreLocations,
      data,
      config
    ),

  // ✅ UPDATE
  update: (id: string, data: Partial<CreateStoreLocationDto>, config: any = {}) =>
    apiClient.put<StoreLocation>(
      `${API_ENDPOINTS.StoreLocations}/${id}`,
      data,
      config
    ),

  // ✅ DELETE
  delete: (id: string) =>
    apiClient.delete<void>(
      `${API_ENDPOINTS.StoreLocations}/${id}`
    ),
};