// lib/services/brandFaqs.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ================= TYPES =================

export interface BrandFaq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}

export interface BrandFaqResponse {
  success: boolean;
  message?: string;
  data: BrandFaq[];
  errors?: string[];
}

export interface SingleBrandFaqResponse {
  success: boolean;
  message?: string;
  data: BrandFaq;
  errors?: string[];
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  data: boolean;
  errors?: string[];
}

export interface CreateBrandFaqDto {
  question: string;
  answer?: string;
  displayOrder?: number;
  isActive?: boolean;
}

// ================= SERVICE =================

export const brandFaqsService = {
  
  // 🔹 GET ALL FAQs (Public)
  getByBrandId: (brandId: string) =>
    apiClient.get<BrandFaqResponse>(
      `${API_ENDPOINTS.brands}/${brandId}/faqs`
    ),

  // 🔹 CREATE FAQ (Admin)
  create: (brandId: string, data: CreateBrandFaqDto) =>
    apiClient.post<SingleBrandFaqResponse>(
      `${API_ENDPOINTS.brands}/${brandId}/faqs`,
      data
    ),

  // 🔹 UPDATE FAQ (Admin)
  update: (brandId: string, faqId: string, data: CreateBrandFaqDto) =>
    apiClient.put<SingleBrandFaqResponse>(
      `${API_ENDPOINTS.brands}/${brandId}/faqs/${faqId}`,
      data
    ),

  // 🔹 DELETE FAQ (Admin)
  delete: (brandId: string, faqId: string) =>
    apiClient.delete<DeleteResponse>(
      `${API_ENDPOINTS.brands}/${brandId}/faqs/${faqId}`
    ),
};