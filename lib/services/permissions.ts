import { apiClient } from '../api';
import { ApiResponse } from '../api';

export interface PageDto {
  id: string;
  key: string;
  name: string;
  group: string | null;
  sortOrder: number;
}

export interface Flags {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface NullableFlags {
  view: boolean | null;
  create: boolean | null;
  edit: boolean | null;
  delete: boolean | null;
}

export interface MatrixItemDto {
  pageId: string;
  key: string;
  name: string;
  group: string | null;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserMatrixItemDto {
  pageId: string;
  key: string;
  name: string;
  group: string | null;
  override: NullableFlags;
  effective: Flags;
}

export interface SetRoleItem {
  pageId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SetUserItem {
  pageId: string;
  canView: boolean | null;
  canCreate: boolean | null;
  canEdit: boolean | null;
  canDelete: boolean | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export const permissionsService = {
  async getPages(): Promise<ApiResponse<ApiEnvelope<PageDto[]>>> {
    return apiClient.get<ApiEnvelope<PageDto[]>>('/api/Permissions/pages');
  },

  async getRoleMatrix(role: string): Promise<ApiResponse<ApiEnvelope<MatrixItemDto[]>>> {
    return apiClient.get<ApiEnvelope<MatrixItemDto[]>>(`/api/Permissions/roles/${role}`);
  },

  async setRoleMatrix(role: string, items: SetRoleItem[]): Promise<ApiResponse<ApiEnvelope<any>>> {
    return apiClient.put<ApiEnvelope<any>>(`/api/Permissions/roles/${role}`, items);
  },

  async getUserMatrix(userId: string): Promise<ApiResponse<ApiEnvelope<UserMatrixItemDto[]>>> {
    return apiClient.get<ApiEnvelope<UserMatrixItemDto[]>>(`/api/Permissions/users/${userId}`);
  },

  async setUserMatrix(userId: string, items: SetUserItem[]): Promise<ApiResponse<ApiEnvelope<any>>> {
    return apiClient.put<ApiEnvelope<any>>(`/api/Permissions/users/${userId}`, items);
  },

  async getMyPermissions(): Promise<ApiResponse<ApiEnvelope<Record<string, Flags>>>> {
    return apiClient.get<ApiEnvelope<Record<string, Flags>>>('/api/Permissions/me');
  }
};
