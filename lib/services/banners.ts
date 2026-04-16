import { apiClient } from '../api'; 
import { API_ENDPOINTS } from '../api-config';


// --- Banner Type Enum ---
export type BannerType = 
  | "Homepage" 
  | "Offer" 
  | "Promotional" 
  | "Category" 
  | "Seasonal" 
  | "FlashSale";


// --- Banner Interfaces ---
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  link: string;
  description: string;
  isDeleted: boolean;
  bannerType: string; // or BannerType if you want strict typing
  offerCode?: string | null;
  discountPercentage?: number | null;
  offerText?: string | null;
  buttonText?: string | null;
  isActive: boolean;
  displayOrder: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}


export interface CreateBannerDto {
  title: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  link?: string;
  description?: string;
  bannerType: string; // or BannerType for strict typing
  offerCode?: string | null;
  discountPercentage?: number | null;
  offerText?: string | null;
  buttonText?: string | null;
  isActive: boolean;
displayOrder?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}


export interface BannerApiResponse {
  success?: boolean;
  data?: Banner[] | Banner;
  message?: string;
  errors?: string[] | null;
}


export interface BannerStats {
  totalBanners: number;
  activeBanners: number;
  inactiveBanners: number;
  upcomingBanners: number;
}


// --- Main Service ---
export const bannersService = {
  // Get all banners (with optional includeInactive param)
  getAll: (config: any = {}) =>
    apiClient.get<BannerApiResponse>(API_ENDPOINTS.banners, config),


  // Get banner by ID
  getById: (id: string, config: any = {}) =>
    apiClient.get<Banner>(`${API_ENDPOINTS.banners}/${id}`, config),


  // Create new banner
  create: (data: CreateBannerDto, config: any = {}) =>
    apiClient.post<Banner>(API_ENDPOINTS.banners, data, config),


  // Update banner by ID
  update: (id: string, data: Partial<CreateBannerDto>, config: any = {}) =>
    apiClient.put<Banner>(`${API_ENDPOINTS.banners}/${id}`, data, config),


  // Delete banner by ID
  delete: (id: string) =>
    apiClient.delete<void>(`${API_ENDPOINTS.banners}/${id}`),
  // ✅ RESTORE
  restore: (id: string) =>
    apiClient.post(`${API_ENDPOINTS.banners}/${id}/restore`),

  // ---- Banner Image Upload (with title in params) ----
  uploadImage: async (file: File, params?: Record<string, any>) => {
    const formData = new FormData();
    formData.append("image", file); // Backend expects 'image' field
    const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiClient.post<{ success: boolean; message: string; data: string }>(
      API_ENDPOINTS.uploadBannerImage + searchParams,
      formData
    );
  },


  // ---- Banner Image Delete ----
  deleteImage: (imageUrl: string) =>
    apiClient.delete<void>(API_ENDPOINTS.deleteBannerImage, { params: { imageUrl } }),
};
