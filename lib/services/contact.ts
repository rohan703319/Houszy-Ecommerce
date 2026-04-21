import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

// ================= CONTACT TYPES =================

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: string;
  category?: string;
  assignedTo?: string;
  adminReply?: string;
  internalNotes?: string;
  repliedAt?: string;
  repliedBy?: string;
  orderNumber?: string;
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
}

export interface ContactListResponse {
  success: boolean;
  message?: string;
  data: ContactListData;
  errors?: string[];
}

export interface ContactActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: string[];
}

// ================= CONTACT SERVICE =================

export const contactService = {
  getAll: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    search?: string;
  }) =>
    apiClient.get<ContactListResponse>(API_ENDPOINTS.contact, { params }),

  reply: (
    id: string,
    data: { reply: string; internalNotes?: string; assignedTo?: string }
  ) =>
    apiClient.post<ContactActionResponse>(
      `${API_ENDPOINTS.contact}/${id}/reply`,
      data
    ),

  delete: (id: string) =>
    apiClient.delete<ContactActionResponse>(
      `${API_ENDPOINTS.contact}/${id}`
    ),
};

// ================= TYPES =================

export interface FeatureCard {
  icon: string;
  heading: string;
  description: string;
}

export interface DeliveryStrip {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  pageTitle: string;
  pageSubtitle: string;
  featureCards: FeatureCard[];
  infoSectionTitle: string;
  infoPoints: string[];
  pageContentJson: string;
  currentUser: string;
}

export interface DeliveryStripResponse {
  success: boolean;
  message?: string;
  data: DeliveryStrip;
  errors?: string[];
}

export interface DeliveryStripListResponse {
  success: boolean;
  message?: string;
  data: DeliveryStrip[];
  errors?: string[];
}

export interface DeliveryStripActionResponse {
  success: boolean;
  message?: string;
  data: boolean;
  errors?: string[];
}

// ================= SERVICE =================

export const deliveryStripService = {
  // ✅ CREATE
  create: (data: DeliveryStrip) =>
    apiClient.post<DeliveryStripResponse>(
      API_ENDPOINTS.deliveryStrip,
      data
    ),

  // ✅ UPDATE
  update: (id: string, data: DeliveryStrip) =>
    apiClient.put<DeliveryStripResponse>(
      `${API_ENDPOINTS.deliveryStrip}/${id}`,
      data
    ),

  // ✅ DELETE
  delete: (id: string) =>
    apiClient.delete<DeliveryStripActionResponse>(
      `${API_ENDPOINTS.deliveryStrip}/${id}`
    ),

  // ✅ TOGGLE ACTIVE
  toggle: (id: string) =>
    apiClient.patch<DeliveryStripActionResponse>(
      `${API_ENDPOINTS.deliveryStrip}/${id}/toggle`
    ),
};