// lib/services/categoriesService.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';
import { CategoryFaq } from './categoryFaqs';
// ---- Shared Types ----
export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  isActive: boolean;
  sortOrder: number;  
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  parentCategoryId?: string;
  parentCategoryName?:string;
  isDeleted: boolean;
  showOnHomepage: boolean; 
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  subCategories?: Category[];
    faqs?: CategoryFaq[];
  schemaDescription?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
export interface UpdateCategoryDto {
  name: string;
  description: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  parentCategoryId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  schemaDescription?: string;
}

export type CategoryStats = {
  totalCategories: number;
  totalActive: number;
  totalInactive: number;
  totalShowOnHomepage: number;
  totalProducts: number;
};
export interface CreateCategoryDto {
  name: string;
  description: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  isActive?: boolean;
  showOnHomepage?: boolean;
  sortOrder?: number;
  parentCategoryId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  schemaDescription?: string;
}

export interface CategoryApiResponse {
  success: boolean;
  message?: string;
  data: {
    items: Category[];
    stats: CategoryStats;
  };
}

export const categoriesService = {
  // Get all categories (optionally allow config for params, headers)
getAll: (config: any = {}) =>
  apiClient.get<CategoryApiResponse>(
    API_ENDPOINTS.categories,
    config
  ),

  // Get category by ID
  getById: (id: string, config: any = {}) =>
    apiClient.get<Category>(`${API_ENDPOINTS.categories}/${id}`, config),

  // Create
create: (data: CreateCategoryDto) =>
  apiClient.post<ApiResponse<Category>>(
    API_ENDPOINTS.categories,
    data
  ),
  // Update (Full Update - PUT)
update: (id: string, data: UpdateCategoryDto, config: any = {}) =>
  apiClient.put<ApiResponse<Category>>(
    `${API_ENDPOINTS.categories}/${id}`,
    data,
    config
  ),

  // Delete
  delete: (id: string, config: any = {}) =>
    apiClient.delete<void>(`${API_ENDPOINTS.categories}/${id}`, config),

  // ---- Image Upload ----
uploadImage: async (file: File, params?: Record<string, any>) => {
  const formData = new FormData();
  formData.append("image", file);
  const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiClient.post<{ success: boolean; message: string; data: string }>(
    API_ENDPOINTS.uploadCategoryImage + searchParams,
    formData
  );
},

  // Make sure deleteBlogCategoryImage endpoint exists and is correct for categories
 deleteImage: (imageUrl: string) =>
  apiClient.delete(
    `${API_ENDPOINTS.deleteCategoryImage}/${encodeURIComponent(imageUrl)}`
  ),

  // ---- Banner Image Upload ----
  uploadBannerImage: async (file: File, params?: Record<string, any>) => {
    const formData = new FormData();
    formData.append("image", file);
    const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiClient.post<{ success: boolean; message: string; data: string }>(
      API_ENDPOINTS.uploadCategoryBannerImage + searchParams,
      formData
    );
  },

  deleteBannerImage: (imageUrl: string) =>
    apiClient.delete<{ success: boolean; message: string; data: boolean }>(
      `${API_ENDPOINTS.deleteCategoryBannerImage}?imageUrl=${encodeURIComponent(imageUrl)}`
    ),
  // Restore Category (Soft Delete Restore)
  restore: (id: string, config: any = {}) =>
    apiClient.post<void>(
      `${API_ENDPOINTS.categories}/${id}/restore`,
      {},
      config
    ),

  // Get simple list for dropdowns
  getSimple: (params?: { includeInactive?: boolean; isDeleted?: boolean }) =>
    apiClient.get<ApiResponse<Category[]>>(
      `${API_ENDPOINTS.categories}/simple`,
      { params }
    ),
};
