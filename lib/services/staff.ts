import { apiClient, type ApiResponse } from '../api';
import { API_ENDPOINTS } from '../api-config';

export type SortDirection = 'asc' | 'desc';

export interface StaffListQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface StaffItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  primaryRole: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StaffStatsByRole {
  role: string;
  count: number;
}

export interface StaffListStats {
  total: number;
  active: number;
  inactive: number;
  byRole: StaffStatsByRole[];
}

export interface StaffListResponseData {
  items: StaffItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  stats: StaffListStats;
}

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: string;
}

export interface UpdateStaffRequest {
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface StaffRole {
  id: string;
  name: string;
  userCount: number;
  isSystem: boolean;
  description?: string;
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export const staffService = {
  getAll: (params?: StaffListQueryParams): Promise<ApiResponse<ApiEnvelope<StaffListResponseData>>> =>
    apiClient.get<ApiEnvelope<StaffListResponseData>>(API_ENDPOINTS.staff, { params }),

  create: (body: CreateStaffRequest): Promise<ApiResponse<ApiEnvelope<StaffItem>>> =>
    apiClient.post<ApiEnvelope<StaffItem>>(API_ENDPOINTS.staff, body),

  getById: (id: string): Promise<ApiResponse<ApiEnvelope<StaffItem>>> =>
    apiClient.get<ApiEnvelope<StaffItem>>(`${API_ENDPOINTS.staff}/${id}`),

  update: (id: string, body: UpdateStaffRequest): Promise<ApiResponse<ApiEnvelope<StaffItem>>> =>
    apiClient.put<ApiEnvelope<StaffItem>>(`${API_ENDPOINTS.staff}/${id}`, body),

  remove: (id: string): Promise<ApiResponse<ApiEnvelope<string>>> =>
    apiClient.delete<ApiEnvelope<string>>(`${API_ENDPOINTS.staff}/${id}`),

  toggleStatus: (id: string): Promise<ApiResponse<ApiEnvelope<string>>> =>
    apiClient.patch<ApiEnvelope<string>>(`${API_ENDPOINTS.staff}/${id}/toggle-status`),

  resetPassword: (id: string, body: ResetPasswordRequest): Promise<ApiResponse<ApiEnvelope<string>>> =>
    apiClient.post<ApiEnvelope<string>>(`${API_ENDPOINTS.staff}/${id}/reset-password`, body),

  getRoles: (): Promise<ApiResponse<ApiEnvelope<StaffRole[]>>> =>
    apiClient.get<ApiEnvelope<StaffRole[]>>(API_ENDPOINTS.staffRoles),

  createRole: (body: CreateRoleRequest): Promise<ApiResponse<ApiEnvelope<StaffRole>>> =>
    apiClient.post<ApiEnvelope<StaffRole>>(API_ENDPOINTS.staffRoles, body),

  updateRole: (id: string, body: UpdateRoleRequest): Promise<ApiResponse<ApiEnvelope<StaffRole>>> =>
    apiClient.put<ApiEnvelope<StaffRole>>(`${API_ENDPOINTS.staffRoles}/${id}`, body),

  deleteRole: (name: string): Promise<ApiResponse<ApiEnvelope<string>>> =>
    apiClient.delete<ApiEnvelope<string>>(`${API_ENDPOINTS.staffRoles}/${name}`),
};
