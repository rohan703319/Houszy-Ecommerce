import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// --- VAT Rates TypeScript Interfaces ---
export interface VATRate {
  id: string;
  name: string;
  description: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  country: string;
  region: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean; // 
}

export interface CreateVATRateDto {
  name: string;
  description: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  country: string;
  region: string;
  displayOrder: number;
}

// API Response Interfaces
export interface VATRateApiResponse {
  success: boolean;
  message?: string;
  data: VATRate[];
  errors?: string[];
}

export interface CreateVATRateResponse {
  success: boolean;
  message: string;
  data: VATRate;
}

export interface UpdateVATRateResponse {
  success: boolean;
  message: string;
  data: VATRate;
}

export interface DeleteVATRateResponse {
  success: boolean;
  message: string;
  data: boolean;
}

// Optional: Stats interface for future use
export interface VATRateStats {
  totalRates: number;
  activeRates: number;
  defaultRate: number;
  countriesCount: number;
}

// --- Main VAT Rates Service ---
export const vatratesService = {
  // Get all VAT rates
  getAll: (config?: any) =>
    apiClient.get<VATRateApiResponse>(API_ENDPOINTS.vatrates, config),

  // Get single VAT rate by ID
  getById: (id: string, config?: any) =>
    apiClient.get<VATRate>(`${API_ENDPOINTS.vatrates}/${id}`, config),

  // Create new VAT rate
  create: (data: CreateVATRateDto, config?: any) =>
    apiClient.post<CreateVATRateResponse>(API_ENDPOINTS.vatrates, data, config),

  // Update VAT rate by ID
  update: (id: string, data: Partial<CreateVATRateDto>, config?: any) =>
    apiClient.put<UpdateVATRateResponse>(`${API_ENDPOINTS.vatrates}/${id}`, data, config),
 // ==============================
  // RESTORE (NEW)
  // ==============================
  restore: (id: string) =>
    apiClient.post(`${API_ENDPOINTS.vatrates}/${id}/restore`),
  // Delete VAT rate by ID
  delete: (id: string, config?: any) =>
    apiClient.delete<DeleteVATRateResponse>(`${API_ENDPOINTS.vatrates}/${id}`, config),
};
