import { apiClient } from '../api';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  subject: string;
  category: string;
  message: string;
  status: 'New' | 'InProgress' | 'Replied' | 'Closed';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  internalNotes?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface ContactMessagesListResponse {
  items: ContactMessage[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface ContactQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  search?: string;
}

export interface ReplyDto {
  reply: string;
  internalNotes?: string;
  assignedTo?: string;
}

export const contactMessagesService = {
  getAll: (params?: ContactQueryParams) =>
    apiClient.get<ApiResponse<ContactMessagesListResponse>>('/api/Contact', { params }),

  reply: (id: string, dto: ReplyDto) =>
    apiClient.post<ApiResponse<ContactMessage>>(`/api/Contact/${id}/reply`, dto),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`/api/Contact/${id}`),
};
