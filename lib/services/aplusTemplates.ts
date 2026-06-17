import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

export interface APlusTemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image';
}

export interface APlusTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  sectionsJson: string; // JSON string of APlusTemplateField[]
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface APlusTemplateListResponse {
  success: boolean;
  data: APlusTemplate[];
  message?: string;
}

export interface SingleAPlusTemplateResponse {
  success: boolean;
  data: APlusTemplate;
  message?: string;
}

export interface CreateAPlusTemplateDto {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  sectionsJson: string;
  isActive: boolean;
  displayOrder: number;
}

export type UpdateAPlusTemplateDto = Partial<CreateAPlusTemplateDto> & { id?: string };

export const aplusTemplatesService = {
  getAll: (params?: { includeInactive?: boolean }, config: any = {}) => {
    const queryParams = new URLSearchParams();
    if (params?.includeInactive !== undefined) {
      queryParams.append('includeInactive', params.includeInactive.toString());
    }
    const queryString = queryParams.toString();
    const url = `${API_ENDPOINTS.aplusTemplates}${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<APlusTemplateListResponse>(url, config);
  },

  getById: (id: string, config: any = {}) =>
    apiClient.get<SingleAPlusTemplateResponse>(`${API_ENDPOINTS.aplusTemplates}/${id}`, config),

  create: (data: CreateAPlusTemplateDto, config: any = {}) =>
    apiClient.post<SingleAPlusTemplateResponse>(API_ENDPOINTS.aplusTemplates, data, config),

  update: (id: string, data: UpdateAPlusTemplateDto, config: any = {}) =>
    apiClient.put<SingleAPlusTemplateResponse>(`${API_ENDPOINTS.aplusTemplates}/${id}`, data, config),

  delete: (id: string, config: any = {}) =>
    apiClient.delete<{ success: boolean; message?: string }>(`${API_ENDPOINTS.aplusTemplates}/${id}`, config),
};
