// lib/services/categoryFaqs.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ================= TYPES =================

export interface CategoryFaq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryFaqResponse {
  success: boolean;
  message?: string;
  data: CategoryFaq[];
  errors?: string[];
}

export interface SingleCategoryFaqResponse {
  success: boolean;
  message?: string;
  data: CategoryFaq;
  errors?: string[];
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  data: boolean;
  errors?: string[];
}

export interface CreateCategoryFaqDto {
  question: string;
  answer?: string;
  displayOrder?: number;
  isActive?: boolean;
}
export type Faq = {
  id?: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
};

// ================= SERVICE =================

export const categoryFaqsService = {

  // 🔹 GET ALL FAQs
  getByCategoryId: (categoryId: string) =>
    apiClient.get<CategoryFaqResponse>(
      `${API_ENDPOINTS.categories}/${categoryId}/faqs`
    ),

  // 🔹 CREATE FAQ
  create: (categoryId: string, data: CreateCategoryFaqDto) =>
    apiClient.post<SingleCategoryFaqResponse>(
      `${API_ENDPOINTS.categories}/${categoryId}/faqs`,
      data
    ),

  // 🔹 UPDATE FAQ
  update: (categoryId: string, faqId: string, data: CreateCategoryFaqDto) =>
    apiClient.put<SingleCategoryFaqResponse>(
      `${API_ENDPOINTS.categories}/${categoryId}/faqs/${faqId}`,
      data
    ),

  // 🔹 DELETE FAQ
  delete: (categoryId: string, faqId: string) =>
    apiClient.delete<DeleteResponse>(
      `${API_ENDPOINTS.categories}/${categoryId}/faqs/${faqId}`
    ),
};