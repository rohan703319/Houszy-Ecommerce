import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderNumber: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  adminReply: string;
  repliedAt: string | null;
  repliedBy: string;
  internalNotes: string;
  assignedTo: string;
  createdAt: string;
}

export interface ContactListData {
  items: ContactItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  stats?: string | Record<string, unknown>;
}

export interface ContactListResponse {
  success: boolean;
  message?: string;
  data: ContactListData;
  errors?: string[];
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  data: ContactItem;
  errors?: string[];
}

export interface ReplyToContactDto {
  reply: string;
  internalNotes?: string;
  assignedTo?: string;
}

export interface ContactQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  search?: string;
}

export const contactService = {
  getAll: (params: ContactQueryParams = {}) =>
    apiClient.get<ContactListResponse>(API_ENDPOINTS.contact, { params }),

  reply: (id: string, data: ReplyToContactDto) =>
    apiClient.post<ContactResponse>(`${API_ENDPOINTS.contact}/${id}/reply`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string; errors?: string[] }>(
      `${API_ENDPOINTS.contact}/${id}`
    ),
};
