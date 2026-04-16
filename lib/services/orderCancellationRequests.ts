import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

export interface OrderCancellationRequestItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  reason: string;
  additionalNotes: string;
  status: string;
  createdAt: string;
}

export interface OrderCancellationRequestsListData {
  items: OrderCancellationRequestItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface CancellationRequestListParams {
  page?: number;
  pageSize?: number;
}

export interface CancellationDecisionPayload {
  adminNotes: string;
}

class OrderCancellationRequestsService {
  async getAll(params: CancellationRequestListParams = {}) {
    try {
      const response = await apiClient.get<
        ApiEnvelope<OrderCancellationRequestsListData>
      >(API_ENDPOINTS.orderCancellationrequests, { params });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch cancellation requests"
      );
    }
  }

  async getByOrderId(orderId: string) {
    try {
      const response = await apiClient.get<ApiEnvelope<OrderCancellationRequestItem>>(
        `${API_ENDPOINTS.orders}/${orderId}/cancellation-request`
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch order cancellation request"
      );
    }
  }

  async approve(requestId: string, data: CancellationDecisionPayload) {
    try {
      const response = await apiClient.post<ApiEnvelope<unknown>>(
        `${API_ENDPOINTS.orderCancellationrequests}/${requestId}/approve`,
        data
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to approve cancellation request"
      );
    }
  }

  async reject(requestId: string, data: CancellationDecisionPayload) {
    try {
      const response = await apiClient.post<ApiEnvelope<unknown>>(
        `${API_ENDPOINTS.orderCancellationrequests}/${requestId}/reject`,
        data
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to reject cancellation request"
      );
    }
  }
}

export const orderCancellationRequestsService =
  new OrderCancellationRequestsService();
