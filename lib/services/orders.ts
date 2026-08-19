// lib/services/orderService.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ==================== ENUMS & TYPES ====================

/**
 * ✅ Order Status (Backend returns strings now)
 */
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'CancellationRequested'
  | 'Shipped'
  | 'PartiallyShipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded'
  | 'Collected'; // ✅ ADD THIS

  
// ================= BULK REQUEST DTOs ====================

export interface BulkUpdateStatusRequest {
  orderIds: string[];
  newStatus: OrderStatus;
  adminNotes?: string;
  currentUser: string;
}

export interface UnshippedItem {
  orderItemId: string;
  productName: string;
  quantity: number;
  remainingQuantity: number;
  productImageUrl?: string;
}

export interface BulkShipmentItem {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shippingMethod: string;
  notes?: string;
}

export interface BulkCreateShipmentRequest {
  shipments: {
    orderId: string;
    trackingNumber: string;
    carrier: string;
    shippingMethod: string;
    notes?: string;
  }[];
  currentUser: string;
}

export interface BulkOperationResponse {
  processedCount: number;
  failedCount: number;
  failed?: {
    orderId: string;
    orderNumber: string;
    reason: string;
  }[];
}
/**
 * ✅ Collection Status
 */
export type CollectionStatus = 'Pending' | 'Ready' | 'Collected' | 'Expired';

/**
 * ✅ Delivery Method
 */
export type DeliveryMethod = 'HomeDelivery' | 'ClickAndCollect';

/**
 * ✅ Payment Status (Backend returns strings)
 */
export type PaymentStatus =
  | 'Pending'
  | 'Authorized'
  | 'Processing'
  | 'Successful'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded'
  | 'PartiallyRefunded'
  | 'PartiallyPaid'
  ;

// ==================== INTERFACES ====================

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  productSku: string;
  productSlug?:string;
  productImageUrl?: string;
  variantName?: string;
  productId: string;
  productVariantId?: string;
  subscriptionId?: string | null;
  subscriptionFrequency?: string | null;
}

export interface Payment {
  id: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  gatewayTransactionId?: string;
  processedAt?: string;
  failureReason?: string;
  createdAt: string;
  stripeFee?: number;
  netAmount?: number;
}

export interface ShipmentItem {
  id: string;
  quantity: number;
  orderItemId: string;
  orderItem?: OrderItem;
  productImageUrl?: string;
  productName?: string;
  productSku?: string;
  unitPrice?: string;

}

export interface Shipment {
  id: string;
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: string;
  shippingCost?: number;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  shipmentItems: ShipmentItem[];
}
export interface RefundHistory {
  id: string;
  refundAmount: number;
  refundDate: string;
  reason?: string;
  notes?: string;
}
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderDate: string;
  productSavingsAmount?: number;

  estimatedDispatchDate?: string;
  dispatchedAt?: string;
  dispatchNote?: string;

  pendingPaymentAmount: number;

  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;

  totalPaidAmount: number;
  totalRefundedAmount: number;
  remainingRefundableAmount?: number;
  netAmountPaid: number;

  currency: string;
  notes?: string;
  couponCode?: string;

  isGuestOrder: boolean;
  subscriptionId?: string;
  subscriptionFrequency?: string;
  userId?: string;

  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  billingAddress: Address;
  shippingAddress: Address;

  // ================= DELIVERY =================
  deliveryMethod: DeliveryMethod;
  shippingMethodName: string;

  clickAndCollectFee?: number;

  // ================= COLLECTION STORE =================
  collectionStoreId?: string;
  collectionStoreName?: string;

  collectionStoreAddressLine1?: string;
  collectionStoreAddressLine2?: string;
  collectionStoreCity?: string;
  collectionStorePostalCode?: string;
  collectionStoreCountry?: string;

  collectionStorePhone?: string;
  collectionStoreOpeningHours?: string;

  collectionStatus?: CollectionStatus;
  readyForCollectionAt?: string;
  collectedAt?: string;
  collectedBy?: string;

  collectorIDType?: string;
  collectorIDNumber?: string;

  collectionExpiryDate?: string;

  // ================= REFUND =================
  isShippingRefunded?: boolean;
  shippingRefundedAmount?: number;

  refundHistory?: RefundHistory[];

  // ================= PHARMACY =================
  pharmacyVerificationStatus?: PharmacyVerificationStatus;
  pharmacyVerificationNote?: string | null;
  pharmacyVerifiedAt?: string | null;
  pharmacyVerifiedBy?: string | null;

  pharmacyResponses?: {
    questionText: string;
    answerText: string;
    productName: string;
    answeredAt: string;
  }[];

  // ================= ATTRIBUTION =================
  orderSource?: string | null;
  gclid?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;

  // ================= PAYMENT =================
  paymentMethod?: string;
  paymentStatus?: string;

  payments: Payment[];

  // ================= ITEMS =================
  orderItems: OrderItem[];
  unshippedItems?: UnshippedItem[];

  // ================= SHIPPING =================
  shipments: Shipment[];

  // ================= SYSTEM =================
  cancellationRequestedAt?: string;
  cancellationRequestReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrdersListResponse {
  items: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;

  // ✅ ADD THIS
  stats: {
    totalOrders: number;
    totalPending: number;
    totalConfirmed: number;
    totalProcessing: number;
    totalCancellationRequested?: number;
    totalShipped: number;
    totalPartiallyShipped: number;
    totalDelivered: number;
    totalCollected: number;
    totalCancelled: number;
    totalReturned: number;
    totalRefunded: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface WooCommerceOrderImportResult {
  totalRows: number;
  importedOrders: number;
  createdCustomers: number;
  skippedOrders: number;
  errors: string[];
}

export interface OrderBulkUpdateResult {
  totalRows: number;
  ordersUpdated: number;
  skipped: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

// ==================== REQUEST DTOs ====================

export interface MarkCollectedRequest {
  orderId: string;
  collectedBy: string;
  collectorIDType: string;
  collectorIDNumber: string;
}

export interface UpdateStatusRequest {
  orderId: string;
  newStatus: OrderStatus;
  adminNotes?: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shippingMethod: string;
  notes?: string;
  shipmentItems?: {
    orderItemId: string;
    quantity: number;
  }[] | null;
}
export type PharmacyVerificationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected';

export interface MarkDeliveredRequest {
  orderId: string;
  shipmentId?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  receivedBy?: string;
}

export interface CancelOrderRequest {
  orderId: string;
  cancellationReason: string;
  restoreInventory: boolean;
  initiateRefund: boolean;
  cancelledBy: string;
}

// ==================== SERVICE CLASS ====================

class OrderService {
async getAllOrders(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  pharmacyVerificationStatus?: PharmacyVerificationStatus;
  includeGuestOrders?: boolean;
  isClickAndCollect?: boolean;
  shippingMethodName?: string;
  deliveryMethod?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  isPharmaProduct?: boolean;
  source?: string;
  orderType?: string;
}) {

    try {
      const response = await apiClient.get<ApiResponse<OrdersListResponse>>(
        API_ENDPOINTS.orders,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
// ================= PAYMENT =================

// 🔥 Mark FULL payment as paid
async markPaymentPaid(orderId: string, data?: {
  transactionId?: string;
  paymentMethod?: string;
  notes?: string;
}) {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.orders}/${orderId}/mark-payment-paid`,
      data || {}
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to mark payment as paid"
    );
  }
}

// 🔥 Mark PENDING AMOUNT as paid (partial)
async markPendingAmountPaid(orderId: string, data?: {
  transactionId?: string;
  paymentMethod?: string;
  notes?: string;
}) {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.orders}/${orderId}/mark-pending-amount-paid`,
      data || {}
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to mark pending amount as paid"
    );
  }
}
  async getOrderById(orderId: string) {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(
        `${API_ENDPOINTS.orders}/${orderId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order details');
    }
  }

  async trackOrder(orderNumber: string, email?: string) {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(
        `${API_ENDPOINTS.orders}/track/${orderNumber}`,
        { params: { email } }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to track order');
    }
  }

// ================= PHARMACY =================
async pharmacyApprove(orderId: string, data: { note?: string }) {
  const res = await apiClient.post(
    `${API_ENDPOINTS.orders}/${orderId}/pharmacy-approve`,
    {
      orderId: orderId,   // 🔥 VERY IMPORTANT
      note: data.note,
    }
  );
  return res.data;
}

async pharmacyReject(orderId: string, data: { reason: string }) {
  const res = await apiClient.post(
    `${API_ENDPOINTS.orders}/${orderId}/pharmacy-reject`,
    {
      orderId: orderId,   // 🔥 VERY IMPORTANT
      reason: data.reason,
    }
  );
  return res.data;
}

// ================= BULK OPERATIONS ====================

async bulkUpdateStatus(data: BulkUpdateStatusRequest) {
  try {
    const response = await apiClient.post<ApiResponse<BulkOperationResponse>>(
      `${API_ENDPOINTS.orders}/bulk-update-status`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to bulk update status'
    );
  }
}

async bulkCreateShipment(data: BulkCreateShipmentRequest) {
  try {
    const response = await apiClient.post<ApiResponse<BulkOperationResponse>>(
      `${API_ENDPOINTS.orders}/bulk-create-shipment`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to create bulk shipments'
    );
  }
}


  async getClickAndCollectOrders(params?: {
    pageNumber?: number;
    pageSize?: number;
    collectionStatus?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    try {
      const response = await apiClient.get<ApiResponse<OrdersListResponse>>(
        `${API_ENDPOINTS.orders}/click-and-collect`,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch click & collect orders');
    }
  }

  async markReady(orderId: string) {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        `${API_ENDPOINTS.orders}/${orderId}/mark-ready`
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark order as ready');
    }
  }

  async markCollected(data: MarkCollectedRequest) {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        `${API_ENDPOINTS.orders}/${data.orderId}/mark-collected`,
        data
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark order as collected');
    }
  }

async updateStatus(data: UpdateStatusRequest) {
  try {
    const response = await apiClient.put<ApiResponse<Order>>(
      `${API_ENDPOINTS.orders}/${data.orderId}/status`,
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }

    return {
      data: response.data?.data,
      message: response.data?.message
    };

  } catch (error: any) {
    throw new Error(
      error.message || 'Failed to update order status'
    );
  }
}

async createShipment(data: CreateShipmentRequest) {
  try {
    const response = await apiClient.post<ApiResponse<Shipment>>(
      `${API_ENDPOINTS.orders}/${data.orderId}/shipment`,
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }

    return {
      data: response.data?.data,
      message: response.data?.message
    };

  } catch (error: any) {
    throw new Error(
      error.message || 'Failed to create shipment'
    );
  }
}

async markDelivered(data: MarkDeliveredRequest) {
  try {
    const response = await apiClient.post<ApiResponse<Order>>(
      `${API_ENDPOINTS.orders}/${data.orderId}/delivered`,
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }

    return {
      data: response.data?.data,
      message: response.data?.message
    };

  } catch (error: any) {
    throw new Error(
      error.message || 'Failed to mark order as delivered'
    );
  }
}

async cancelOrder(data: CancelOrderRequest) {
  try {
    const response = await apiClient.post<ApiResponse<Order>>(
      `${API_ENDPOINTS.orders}/${data.orderId}/cancel`,
      data
    );
    if (response.error) {
      throw new Error(response.error);
    }

    return {
      data: response.data?.data,
      message: response.data?.message
    };

  } catch (error: any) {
    throw new Error(
      error.message || 'Failed to cancel order'
    );
  }
}
async importWooCommerce(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<WooCommerceOrderImportResult>>(
      `${API_ENDPOINTS.orders}/import-woocommerce`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      data: response.data?.data,
      message: response.data?.message
    };

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || 'Failed to import WooCommerce orders'
    );
  }
}

  async bulkUpdateExcel(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<OrderBulkUpdateResult>>(
        API_ENDPOINTS.bulkUpdateOrdersExcel,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Failed to bulk update orders via Excel'
      );
    }
  }


async downloadInvoice(orderId: string): Promise<void> {
  try {
    const response = await apiClient.get<Blob>(
      `${API_ENDPOINTS.orders}/${orderId}/invoice/download`,
      { responseType: 'blob' }
    );

    const blob = response.data as Blob;

    // ❗ handle backend JSON error inside blob
    if (blob.type === "application/json") {
      const text = await blob.text();
      const json = JSON.parse(text);
      throw new Error(json?.message || "Failed to download invoice");
    }

    const url = window.URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${orderId}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to download invoice"
    );
  }
}

/**
 * Export Orders to Excel
 */
async exportOrders(params: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  deliveryMethod?: string;
  source?: string;
}) {
  const queryParams = new URLSearchParams();
  
  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params.fromDate) {
    queryParams.append('fromDate', params.fromDate);
  }
  if (params.toDate) {
    queryParams.append('toDate', params.toDate);
  }
  if (params.searchTerm) {
    queryParams.append('searchTerm', params.searchTerm);
  }
  if (params.deliveryMethod && params.deliveryMethod !== 'all') {
    queryParams.append('deliveryMethod', params.deliveryMethod);
  }
  if (params.source) {
    queryParams.append('source', params.source);
  }

  const url = `${API_ENDPOINTS.exportOrders}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  return apiClient.get(url, {
    responseType: 'blob',
  });
}

/**
 * Export Order Admin Comments to Excel
 */
async exportAdminComments() {
  return apiClient.get(API_ENDPOINTS.exportAdminComments, {
    responseType: 'blob',
  });
}

/**
 * Export Order Admin Comments for a specific order to Excel
 */
async exportAdminCommentsForOrder(orderId: string) {
  return apiClient.get(API_ENDPOINTS.exportAdminCommentsForOrder(orderId), {
    responseType: 'blob',
  });
}

/**
 * Hard-delete (permanent) an order. Only allowed for orders with no successful payment
 * and no generated invoice. Caller must pass the order number as a typo-guard.
 */
async hardDeleteOrder(orderId: string, confirmOrderNumber: string) {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      `${API_ENDPOINTS.orders}/${orderId}/hard`,
      { data: { confirmOrderNumber } }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || 'Failed to hard-delete order'
    );
  }
}

async exportOrdersTravelbook(params: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  deliveryMethod?: string;
  source?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.deliveryMethod && params.deliveryMethod !== 'all') queryParams.append('deliveryMethod', params.deliveryMethod);
  if (params.source) queryParams.append('source', params.source);

  const url = `${API_ENDPOINTS.exportOrdersTravelbook}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  return apiClient.get(url, { responseType: 'blob' });
}

async exportProcessingForShipment() {
  return apiClient.get(API_ENDPOINTS.exportProcessingForShipment, { responseType: 'blob' });
}

async bulkShipFromExcel(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<any>(API_ENDPOINTS.bulkShipFromExcel, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ==================== ADMIN COMMENTS ====================
async getOrderAdminComments(orderId: string) {
  try {
    const response = await apiClient.get<ApiResponse<OrderAdminComment[]>>(
      `${API_ENDPOINTS.orders}/${orderId}/admin-comments`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admin comments');
  }
}

async addOrderAdminComment(orderId: string, comment: string) {
  try {
    const response = await apiClient.post<ApiResponse<OrderAdminComment>>(
      `${API_ENDPOINTS.orders}/${orderId}/admin-comments`,
      { comment }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add admin comment');
  }
}

async updateOrderAdminComment(commentId: string, comment: string) {
  try {
    const response = await apiClient.put<ApiResponse<OrderAdminComment>>(
      `${API_ENDPOINTS.orders}/admin-comments/${commentId}`,
      { comment }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update admin comment');
  }
}

async deleteOrderAdminComment(commentId: string) {
  try {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `${API_ENDPOINTS.orders}/admin-comments/${commentId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete admin comment');
  }
}

}

export interface OrderAdminComment {
  id: string;
  orderId: string;
  comment: string;
  createdByName: string;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isMine: boolean;
}

export const orderService = new OrderService();

// ==================== HELPER FUNCTIONS ====================

/**
 * ✅ Get Order Status Info (String-based)
 */
export const getOrderStatusInfo = (status: OrderStatus) => {
  const statusMap: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
    'Pending': { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    'Confirmed': { label: 'Confirmed', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    'Processing': { label: 'Processing', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
    'CancellationRequested': { label: 'Cancellation Requested', color: 'text-amber-300', bgColor: 'bg-amber-500/10' },
    'Shipped': { label: 'Shipped', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    'PartiallyShipped': { label: 'Partially Shipped', color: 'text-purple-300', bgColor: 'bg-purple-400/10' },
    'Delivered': { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    'Cancelled': { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    'Returned': { label: 'Returned', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    'Refunded': { label: 'Refunded', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },

    // ✅ ADD THIS
    'Collected': { label: 'Collected', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  };

  return statusMap[status] || {
    label: 'Unknown',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10'
  };
};

/**
 * ✅ Get Collection Status Info
 */
export const getCollectionStatusInfo = (status: CollectionStatus) => {
  const statusMap: Record<CollectionStatus, { label: string; color: string; bgColor: string }> = {
    'Pending': { label: 'Pending Collection', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    'Ready': { label: 'Ready for Pickup', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    'Collected': { label: 'Collected', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    'Expired': { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  };
  return statusMap[status] || statusMap['Pending'];
};

/**
 * ✅ Get Payment Status Info (Updated with "Successful")
 */
export const getPaymentStatusInfo = (status: PaymentStatus) => {
  const statusMap: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  Pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },

  Authorized: { label: 'Authorized', color: 'text-blue-300', bgColor: 'bg-blue-400/10' },

  Processing: { label: 'Processing', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },

  Successful: { label: 'Successful', color: 'text-green-400', bgColor: 'bg-green-500/10' },

  Completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10' },

  Failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/10' },

  Cancelled: { label: 'Cancelled', color: 'text-red-300', bgColor: 'bg-red-400/10' },

  Refunded: { label: 'Refunded', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },

  PartiallyRefunded: {
    label: 'Partially Refunded',
    color: 'text-purple-300',
    bgColor: 'bg-purple-400/10'
  },

  // 🔥 ADD THIS (missing tha)
  PartiallyPaid: {
    label: 'Partially Paid',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
};
  return statusMap[status] || statusMap['Pending'];
};

/**
 * Get Payment Method Info
 */
export const getPaymentMethodInfo = (method?: string | null) => {
  if (!method) {
    return {
      label: 'N/A',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      icon: 'cash' as const,
    };
  }

  const normalized = method.toLowerCase().trim();

  // ========================
  // STRIPE BASED METHODS
  // ========================
  if (normalized.includes('stripe')) {
    return {
      label: 'Stripe',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      icon: 'card' as const,
    };
  }

  // ========================
  // PAYPAL
  // ========================
  if (normalized.includes('paypal')) {
    return {
      label: 'PayPal',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      icon: 'wallet' as const,
    };
  }

  // ========================
  // APPLE PAY
  // ========================
  if (normalized.includes('apple pay')) {
    return {
      label: 'Apple Pay',
      color: 'text-slate-200',
      bgColor: 'bg-slate-500/10',
      icon: 'phone' as const,
    };
  }

  // ========================
  // GOOGLE PAY
  // ========================
  if (normalized.includes('google pay')) {
    return {
      label: 'Google Pay',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      icon: 'wallet' as const,
    };
  }

  // ========================
  // CARD
  // ========================
  if (normalized.includes('credit') || normalized.includes('debit')) {
    return {
      label: 'Card',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      icon: 'card' as const,
    };
  }

  // ========================
  // KLARNA
  // ========================
  if (normalized.includes('klarna')) {
    return {
      label: 'Klarna',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      icon: 'wallet' as const,
    };
  }

  // ========================
  // FALLBACK (NO COD)
  // ========================
  return {
    label: method, // show actual method instead of forcing COD
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: 'card' as const,
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: string) => {
  if (!date) return "N/A";
  let cleanString = date;
  if (
    cleanString.includes("T") &&
    !cleanString.endsWith("Z") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("+") &&
    !cleanString.slice(cleanString.indexOf("T")).includes("-")
  ) {
    cleanString = `${cleanString}Z`;
  }
  const parsedDate = new Date(cleanString);
  if (isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
};
