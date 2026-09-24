// services/activityLog.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ========== Type Definitions ========== (keep all your existing types)

export interface EntityDetails {
  id: string;
  name?: string;
  shortDescription?: string;
  sku?: string;
  price?: number;
  oldPrice?: number;
  stockQuantity?: number;
  isPublished?: boolean;
  isDeleted?: boolean;
  orderNumber?: string;
  status?: string;
  totalAmount?: number;
  customerEmail?: string;
  orderDate?: string;
}

export interface ActivityLog {
  id: string;
  activityLogType: string;
  activityLogTypeName: string;
  comment: string;
  entityName?: string;
  entityId?: string;
  createdOnUtc: string;
  userName: string;
  userEmail?: string;
  userId?: string;
  entityDetails?: EntityDetails;
  ipAddress?: string;
  changesJson?: string;
  uploadedFileId?: string;
  uploadedFileName?: string;
  uploadedFileSize?: number;
}

export interface UploadedFileItem {
  id: string;
  originalFileName: string;
  storedPath: string;
  contentType?: string;
  sizeBytes: number;
  purpose: number;
  purposeName: string;
  uploadedOnUtc: string;
  uploadedByUserId?: string;
  uploadedByUserName: string;
  uploadedByUserEmail?: string;
}

export interface AuditTrailEventItem {
  id: string;
  eventType: number;
  eventTypeName: string;
  targetId?: string;
  summary: string;
  targetSnapshotJson?: string;
  affectedCount: number;
  createdOnUtc: string;
  performedByUserId?: string;
  performedByUserName: string;
  performedByUserEmail?: string;
  ipAddress?: string;
}

export interface ActivityLogListResponse {
  items: ActivityLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AuditTrailListResponse {
  items: AuditTrailEventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface ActivityLogQueryParams {
  page?: number;
  pageSize?: number;
  createdFrom?: string;
  createdTo?: string;
  activityLogType?: ActivityLogType;
  ipAddress?: string;
  searchTerm?: string;
  entityName?: string;
  userName?: string;
  sortDirection?: 'asc' | 'desc';
}

export type ActivityLogType =
  | 'AddProduct'
  
  | 'UpdateProduct'
  | 'DeleteProduct'
  | 'AddCategory'
  | 'UpdateCategory'
  | 'DeleteCategory'
  | 'AddBrand'
  | 'UpdateBrand'
  | 'DeleteBrand'
  | 'AddOrder'
  | 'UpdateOrder'
  | 'CancelOrder'
  | 'CreateShipment'
  | 'AddCustomer'
  | 'UpdateCustomer'
  | 'DeleteCustomer'
  | 'UserLogin'
  | 'UserLogout'
  | 'UserRegister'
  | 'AddBanner'
  | 'UpdateBanner'
  | 'DeleteBanner'
  | 'AddBlogPost'
  | 'UpdateBlogPost'
  | 'DeleteBlogPost'
  | 'AddBlogCategory'
  | 'UpdateBlogCategory'
  | 'DeleteBlogCategory'
  | 'AddBlogComment'
  | 'UpdateBlogComment'
  | 'DeleteBlogComment'
  | 'AddProductReview'
  | 'UpdateProductReview'
  | 'DeleteProductReview'
  | 'RejectProductReview'
  | 'AddDiscount'
  | 'UpdateDiscount'
  | 'DeleteDiscount'
  | 'AddShippingZone'
  | 'UpdateShippingZone'
  | 'DeleteShippingZone'
  | 'AddShippingMethod'
  | 'UpdateShippingMethod'
  | 'DeleteShippingMethod'
  | 'AddVATRate'
  | 'UpdateVATRate'
  | 'DeleteVATRate'
  | 'AddNewsletterSubscription'
  | 'DeleteNewsletterSubscription'
  | 'AddSubscription'
  | 'UpdateSubscription'
  | 'CancelSubscription'
  | 'AddLoyaltyPoints'
  | 'RedeemLoyaltyPoints'
  | 'UpdateSettings'
  | 'BulkUpdateInventory'
  | 'BulkUpdateProductsFromExcel'
  | 'BulkShipFromExcel'
  | 'BulkUpdateOrdersFromExcel'
  | 'ImportProductsFromExcel'
  | 'Other';

// ========== Service ==========

export const activityLogService = {
  /**
   * Get all activity logs with optional filters and pagination
   */
  getAll: (params?: ActivityLogQueryParams) =>
    apiClient.get<ApiResponse<ActivityLogListResponse>>(
      API_ENDPOINTS.activityLogs.base,
      { params }
    ),

  /**
   * Delete a specific activity log by ID
   */
  deleteById: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(
      API_ENDPOINTS.activityLogs.delete(id)
    ),

  /**
   * Clear all activity logs
   */
  clearAll: () =>
    apiClient.delete<ApiResponse<boolean>>(
      API_ENDPOINTS.activityLogs.clear
    ),

  /**
   * Get activity logs by entity type
   */
  getByEntity: (entityName: string, params?: Omit<ActivityLogQueryParams, 'entityName'>) => {
    const searchTerm = params?.searchTerm
      ? `${params.searchTerm} ${entityName}`
      : entityName;
    
    return apiClient.get<ApiResponse<ActivityLogListResponse>>(
      API_ENDPOINTS.activityLogs.base,
      { params: { ...params, searchTerm } }
    );
  },

  /**
   * Get activity logs by date range
   */
  getByDateRange: (
    startDate: string,
    endDate: string,
    params?: Omit<ActivityLogQueryParams, 'createdFrom' | 'createdTo'>
  ) =>
    apiClient.get<ApiResponse<ActivityLogListResponse>>(
      API_ENDPOINTS.activityLogs.base,
      { params: { ...params, createdFrom: startDate, createdTo: endDate } }
    ),

  /**
   * Get activity logs by type
   * ✅ FIXED: Map activityType parameter to activityLogType
   */
  getByType: (
    activityType: ActivityLogType,
    params?: Omit<ActivityLogQueryParams, 'activityLogType'>
  ) =>
    apiClient.get<ApiResponse<ActivityLogListResponse>>(
      API_ENDPOINTS.activityLogs.base,
      { params: { ...params, activityLogType: activityType } } // ✅ FIXED
    ),

  /**
   * Get activity logs by user
   */
  getByUser: (userName: string, params?: ActivityLogQueryParams) =>
    apiClient.get<ApiResponse<ActivityLogListResponse>>(
      API_ENDPOINTS.activityLogs.base,
      { params: { ...params, searchTerm: userName } }
    ),

  /**
   * Get uploaded Excel / bulk update files
   */
  getUploadedFiles: (purpose?: number) =>
    apiClient.get<ApiResponse<UploadedFileItem[]>>(
      API_ENDPOINTS.activityLogs.files,
      { params: purpose !== undefined ? { purpose } : {} }
    ),

  /**
   * Download an uploaded file by ID
   */
  downloadUploadedFile: async (id: string, fileName: string) => {
    const response = await apiClient.get(
      API_ENDPOINTS.activityLogs.downloadFile(id),
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete an uploaded file by ID
   */
  deleteUploadedFile: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(
      API_ENDPOINTS.activityLogs.deleteFile(id)
    ),

  /**
   * Get Audit Trail / Deletion events
   */
  getAuditTrail: (params?: { page?: number; pageSize?: number; eventType?: number; searchTerm?: string }) =>
    apiClient.get<ApiResponse<AuditTrailListResponse>>(
      API_ENDPOINTS.activityLogs.auditTrail,
      { params }
    ),
};

export default activityLogService;
