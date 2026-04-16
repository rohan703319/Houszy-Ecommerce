import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';
import { BrandFaq } from './brandFaqs';

// --- Brand TypeScript Interfaces ---
export interface Brand {
  id: string;
  name: string;
  description: string;
  slug: string;
  logoUrl?: string;
  isPublished: boolean;
  isDeleted: boolean;
  isActive: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  faqs?: BrandFaq[];
}

// ✅ LIST - Matches your JSON structure
export interface BrandListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Brand[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    stats: {
      totalBrands: number;
      totalPublished: number;
      totalUnpublished: number;
      totalActive: number;
      totalInactive: number;
      totalShowOnHomepage: number;
    };
  };
}

// ✅ SINGLE (create/update response)
export interface SingleBrandResponse {
  success: boolean;
  message?: string;
  data: Brand;
}

// ✅ CREATE DTO - matches your JSON fields
export interface CreateBrandDto {
  name: string;
  description: string;
  logoUrl?: string;
  isPublished?: boolean;
  isActive?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

// ✅ UPDATE DTO (same as Create for partial updates)
export type UpdateBrandDto = Partial<CreateBrandDto>;

// ✅ API RESPONSE for operations that return data array directly
export interface BrandApiResponse {
  success: boolean;
  message?: string;
  data: Brand[];
}

// ✅ STATS (if you need a simplified stats object)
export interface BrandStats {
  totalBrands: number;

  totalPublished: number;
  totalUnpublished: number;

  totalActive: number;
  totalInactive: number;

  totalShowOnHomepage: number;

  // optional (agar backend de)
  totalProducts?: number;
}
// --- Main Brand Service ---
export const brandsService = {
  // Get all brands (with pagination)
  getAll: (config: any = {}) =>
    apiClient.get<BrandListResponse>(API_ENDPOINTS.brands, config),

  // Get single brand by ID
  getById: (id: string, config: any = {}) =>
    apiClient.get<SingleBrandResponse>(`${API_ENDPOINTS.brands}/${id}`, config),

  // Create new brand
  create: (data: CreateBrandDto, config: any = {}) =>
    apiClient.post<SingleBrandResponse>(API_ENDPOINTS.brands, data, config),

  // Update brand by ID
  update: (id: string, data: UpdateBrandDto, config: any = {}) =>
    apiClient.put<SingleBrandResponse>(`${API_ENDPOINTS.brands}/${id}`, data, config),

  // Delete brand by ID (soft delete)
  delete: (id: string, config: any = {}) =>
    apiClient.delete<void>(`${API_ENDPOINTS.brands}/${id}`, config),

  // Restore soft-deleted brand
  restore: (id: string) =>
    apiClient.post<void>(`${API_ENDPOINTS.brands}/${id}/restore`),

  // Upload logo for brand
  uploadLogo: async (file: File, params?: Record<string, any>) => {
    const formData = new FormData();
    formData.append("logo", file);
    const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiClient.post<{ success: boolean; message: string; data: string }>(
      API_ENDPOINTS.uploadBrandLogo + searchParams,
      formData
    );
  },

  // Delete brand logo
  deleteLogo: (logoUrl: string) =>
    apiClient.delete<void>(API_ENDPOINTS.deleteBrandLogo, { params: { imageUrl: logoUrl } }),
};