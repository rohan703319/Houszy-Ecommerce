// lib/services/orderEdit.ts

import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ===========================
// ENUMS (Match API Documentation)
// ===========================

export interface ShippingRefundResult {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    orderNumber: string;
    refundId: string;
    refundAmount: number;
    remainingRefundableAmount: number;
    isFullyRefunded: boolean;
    paymentStatus: string;
    stockRestored: boolean;
    loyaltyPointsReversed: number;
    refundDate: string;
  };
  errors?: string[];
}
export interface RefundResult {
  success: boolean; // 🔥 ADD THIS
  message: string;
  data?: {
    orderId: string;
    orderNumber: string;
    refundId: string;
    refundAmount: number;
    remainingRefundableAmount: number;
    isFullyRefunded: boolean;
    paymentStatus: string;
    stockRestored: boolean;
    loyaltyPointsReversed: number;
    refundDate: string;
  };
  errors?: string[];
}

/**
 * Order Edit Operation Types (MUST USE NUMERIC VALUES)
 * @see API Documentation Section 7
 */
export enum OrderEditOperationType {
  UpdateQuantity = 1,
  UpdatePrice = 2,
  RemoveItem = 3,
  AddItem = 4,
  ReplaceItem = 5,
}

/**
 * Refund Reasons (MUST USE NUMERIC VALUES)
 * @see API Documentation Section 2 & 3
 */
export enum RefundReason {
  CustomerRequest = 1,
  OrderCancellation = 2,
  ItemOutOfStock = 3,
  DamagedItem = 4,
  WrongItemShipped = 5,
  PriceAdjustment = 6,
  DuplicateCharge = 7,
  ServiceIssue = 8,
  PartialOrderCancellation = 9,
  QualityIssue = 10,
  LateDelivery = 11,
  Other = 99,
}

// ===========================
// TYPES & INTERFACES
// ===========================

/**
 * Address object structure
 * @see API Documentation - Address Object Structure
 */
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
  phoneNumber: string;
}

/**
 * Order Edit Operation
 * @see API Documentation Section 1 - Operation Parameters
 */
export interface OrderEditOperation {
  operationType: OrderEditOperationType; // ✅ Numeric enum
  orderItemId?: string;
  productId?: string;
  productVariantId?: string | null;
  newQuantity?: number;
  newUnitPrice?: number;
  replacementProductId?: string;
  replacementProductVariantId?: string | null;
}

/**
 * Order Edit Request
 * @see API Documentation Section 1 - Request Body
 */
export interface OrderEditRequest {
  orderId: string;
  operations: OrderEditOperation[];
  editReason?: string | null;
  adminNotes?: string | null;
  recalculateTotals?: boolean;
  adjustInventory?: boolean;
  sendCustomerNotification?: boolean;
  billingAddress?: Address | null;
  shippingAddress?: Address | null;
}

/**
 * Full Refund Request
 * @see API Documentation Section 2
 */
export interface FullRefundRequest {
  orderId: string;
  reason: RefundReason; // ✅ Numeric enum
  reasonDetails?: string | null;
  adminNotes?: string | null;
  restoreInventory?: boolean;
  sendCustomerNotification?: boolean;
  currentUser?: string;
}

/**
 * Partial Refund Request
 * @see API Documentation Section 3
 */
export interface PartialRefundRequest {
  orderId: string;
  refundAmount: number;
  reason: RefundReason; // ✅ Numeric enum
  reasonDetails?: string | null;
  adminNotes?: string | null;
  sendCustomerNotification?: boolean;
  currentUser?: string;
}

/**
 * Regenerate Invoice Request
 * @see API Documentation Section 6
 */
export interface RegenerateInvoiceRequest {
  orderId: string;
  notes?: string | null;
  sendToCustomer?: boolean;
}

/**
 * Order Item Change DTO
 * @see API Documentation Section 8 - OrderItemChangeDto
 */
export interface OrderItemChange {
  changeType: string; // "Added" | "Removed" | "Updated" | "Replaced" | "PriceAdjusted"
  productName: string;
  productSku: string;
  oldQuantity: number | null;
  newQuantity: number | null;
  oldUnitPrice: number | null;
  newUnitPrice: number | null;
  oldTotalPrice: number | null;
  newTotalPrice: number | null;
}

/**
 * Inventory Adjustment DTO
 * @see API Documentation Section 8 - InventoryAdjustmentDto
 */
export interface InventoryAdjustment {
  productId: string;
  productName: string;
  productSku: string;
  quantityAdjusted: number;
  adjustmentType: string; // "Restored" | "Deducted"
}

/**
 * Order Edit Result DTO
 * @see API Documentation Section 8 - OrderEditResultDto
 */
export interface OrderEditResult {
  orderId: string;
  orderNumber: string;
  success: boolean;
  message: string;
  
  // Financial Summary
  oldSubtotal: number;
  newSubtotal: number;
  oldTaxAmount: number;
  newTaxAmount: number;
  oldTotalAmount: number;
  newTotalAmount: number;
  priceDifference: number;
  
  // Changes
  itemChanges: OrderItemChange[];
  billingAddressChanged: boolean;
  shippingAddressChanged: boolean;
  inventoryAdjustments: InventoryAdjustment[];
  
  // Refund Recommendation
  refundRecommended: boolean;
  recommendedRefundAmount: number;
  
  // Updated Order
  updatedOrder: any; // OrderDto
}

/**
 * Refund Result DTO
 * @see API Documentation Section 8 - RefundResultDto
 */

/**
 * Refund Entry DTO
 * @see API Documentation Section 8 - RefundEntryDto
 */
export interface RefundEntry {
  refundId: string;
  amount: number;
  currency: string;
  reason: string;
  reasonDetails: string | null;
  processedBy: string;
  processedAt: string;
  isPartial: boolean;
}

/**
 * Refund History DTO
 * @see API Documentation Section 8 - RefundHistoryDto
 */
export interface RefundHistory {
  orderId: string;
  orderNumber: string;
  originalOrderAmount: number;
  totalRefunded: number;
  remainingBalance: number;
  isFullyRefunded: boolean;
  paymentStatus: string;
  refunds: RefundEntry[];
}

/**
 * Order History DTO
 * @see API Documentation Section 8 - OrderHistoryDto
 */
export interface OrderHistory {
  id: string;
  orderId: string;
  changeType: string;
  changedBy: string;
  changeDate: string;
  changeDetails: any;
  oldSubtotal: number | null;
  newSubtotal: number | null;
  oldTaxAmount: number | null;
  newTaxAmount: number | null;
  oldShippingAmount: number | null;
  newShippingAmount: number | null;
  oldTotalAmount: number | null;
  newTotalAmount: number | null;
  oldStatus: string | null;
  newStatus: string | null;
  notes: string | null;
}

/**
 * Invoice DTO
 * @see API Documentation Section 8 - InvoiceDto
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  customerEmail: string;
  billingName: string;
  billingAddress: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
  pdfUrl: string | null;
  pdfFileSize: number | null;
  notes: string | null;
  emailedAt: string | null;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string | null;
}

// ===========================
// ORDER EDIT SERVICE CLASS
// ===========================

class OrderEditService {
  /**
   * Edit an existing order
   * PUT /api/orders/{orderId}/edit
   * @see API Documentation Section 1
   */
  async editOrder(request: OrderEditRequest): Promise<OrderEditResult> {
    try {
      console.log('🔧 Order Edit Request:', {
        orderId: request.orderId,
        operationsCount: request.operations.length,
        hasBillingAddress: !!request.billingAddress,
        hasShippingAddress: !!request.shippingAddress,
        editReason: request.editReason,
      });

      // ✅ apiClient returns { data: T, error?: string, success?: boolean }
      const response = await apiClient.put<any>(
        `${API_ENDPOINTS.orders}/${request.orderId}/edit`,
        request
      );

      console.log('📥 Edit Order Response:', response);

      // ✅ Check if apiClient wrapper had error
      if (response.error) {
        throw new Error(response.error);
      }

      // ✅ Extract actual data from wrapper
      const actualData = response.data;

      // ✅ Check if backend returned error in nested structure
      if (actualData && actualData.success === false) {
        throw new Error(
          actualData.message || 
          actualData.errors?.[0] || 
          'Failed to edit order'
        );
      }

      // ✅ Return the nested data object
      return actualData.data as OrderEditResult;
      
    } catch (error: any) {
      console.error('❌ Edit Order Error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        'Failed to edit order'
      );
    }
  }

  /**
   * Process full refund
   * POST /api/orders/{orderId}/refund
   * @see API Documentation Section 2
   */
async processFullRefund(request: FullRefundRequest): Promise<RefundResult> {
  try {
    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.orders}/${request.orderId}/refund`,
      request
    );

    const actualData = response.data;

    // ✅ ONLY backend controls success/failure
    if (actualData?.success === false) {
      throw new Error(
        actualData.message || 
        actualData.errors?.[0] || 
        'Failed to process refund'
      );
    }

    return actualData as RefundResult;

  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.errors?.[0] ||
      error.message ||
      'Failed to process refund'
    );
  }
}
  /**
   * Process partial refund
   * POST /api/orders/{orderId}/partial-refund
   * @see API Documentation Section 3
   */
async processPartialRefund(request: PartialRefundRequest): Promise<RefundResult> {
  try {
    console.log('💵 Partial Refund Request:', request);

    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.orders}/${request.orderId}/partial-refund`,
      request
    );

    console.log('📥 Partial Refund Response:', response);

    const actualData = response.data;

    // ✅ ONLY backend decides failure
    if (actualData?.success === false) {
      throw new Error(
        actualData.message || 
        actualData.errors?.[0] || 
        'Failed to process partial refund'
      );
    }

    // ✅ return full response (important)
    return actualData as RefundResult;

  } catch (error: any) {
    console.error('❌ Partial Refund Error:', error);

    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0] ||
      error?.message ||
      'Failed to process partial refund'
    );
  }
}

  /**
   * Get refund history
   * GET /api/orders/{orderId}/refund-history
   * @see API Documentation Section 4
   */
  async getRefundHistory(orderId: string): Promise<RefundHistory> {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.orders}/${orderId}/refund-history`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const actualData = response.data;

      if (actualData && actualData.success === false) {
        throw new Error(
          actualData.message || 
          'Failed to fetch refund history'
        );
      }

      return actualData.data as RefundHistory;
      
    } catch (error: any) {
      console.error('❌ Refund History Error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch refund history'
      );
    }
  }

  /**
   * Get edit history
   * GET /api/orders/{orderId}/edit-history
   * @see API Documentation Section 5
   */
  async getEditHistory(orderId: string): Promise<OrderHistory[]> {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.orders}/${orderId}/edit-history`
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const actualData = response.data;

      if (actualData && actualData.success === false) {
        throw new Error(
          actualData.message || 
          'Failed to fetch edit history'
        );
      }

      return actualData.data as OrderHistory[];
      
    } catch (error: any) {
      console.error('❌ Edit History Error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch edit history'
      );
    }
  }

  /**
   * Regenerate invoice
   * POST /api/orders/{orderId}/regenerate-invoice
   * @see API Documentation Section 6
   */
async regenerateInvoice(request: RegenerateInvoiceRequest): Promise<any> {
  try {
    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.orders}/${request.orderId}/regenerate-invoice`,
      request
    );

    const actualData = response.data;

    // ✅ backend controls failure
    if (actualData?.success === false) {
      throw new Error(
        actualData.message ||
        actualData.errors?.[0] ||
        'Failed to regenerate invoice'
      );
    }

    // ✅ return FULL response (important)
    return actualData;

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0] ||
      error?.message ||
      'Failed to regenerate invoice'
    );
  }
}

  // ===========================
  // HELPER METHODS
  // ===========================

  /**
   * Validate and clean address data
   * @returns Cleaned address or undefined if invalid
   */
  validateAndCleanAddress(address: Partial<Address>): Address | undefined {
    // Check if address has required fields with actual values
    if (
      !address.firstName?.trim() ||
      !address.lastName?.trim() ||
      !address.addressLine1?.trim() ||
      !address.city?.trim() ||
      !address.state?.trim() ||
      !address.postalCode?.trim() ||
      !address.country?.trim() ||
      !address.phoneNumber?.trim()
    ) {
      return undefined;
    }

    return {
      firstName: address.firstName.trim(),
      lastName: address.lastName.trim(),
      company: address.company?.trim() || undefined,
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2?.trim() || undefined,
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country.trim(),
      phoneNumber: address.phoneNumber.trim(),
    };
  }

  /**
   * Create update quantity operation
   * @see API Documentation Section 1 - UpdateQuantity
   */
  createUpdateQuantityOperation(
    orderItemId: string,
    newQuantity: number
  ): OrderEditOperation {
    return {
      operationType: OrderEditOperationType.UpdateQuantity,
      orderItemId,
      newQuantity,
    };
  }

  /**
   * Create update price operation
   * @see API Documentation Section 1 - UpdatePrice
   */
  createUpdatePriceOperation(
    orderItemId: string,
    newUnitPrice: number
  ): OrderEditOperation {
    return {
      operationType: OrderEditOperationType.UpdatePrice,
      orderItemId,
      newUnitPrice,
    };
  }

  /**
   * Create remove item operation
   * @see API Documentation Section 1 - RemoveItem
   */
  createRemoveItemOperation(orderItemId: string): OrderEditOperation {
    return {
      operationType: OrderEditOperationType.RemoveItem,
      orderItemId,
    };
  }

  /**
   * Create add item operation
   * @see API Documentation Section 1 - AddItem
   */
  createAddItemOperation(
    productId: string,
    quantity: number,
    unitPrice?: number,
    productVariantId?: string | null
  ): OrderEditOperation {
    const operation: OrderEditOperation = {
      operationType: OrderEditOperationType.AddItem,
      productId,
      newQuantity: quantity,
      productVariantId: productVariantId || null,
    };

    // ✅ Only include newUnitPrice if provided (otherwise backend uses current price)
    if (unitPrice !== undefined) {
      operation.newUnitPrice = unitPrice;
    }

    return operation;
  }

  /**
   * Create replace item operation
   * @see API Documentation Section 1 - ReplaceItem
   */
  createReplaceItemOperation(
    orderItemId: string,
    replacementProductId: string,
    newQuantity?: number,
    newUnitPrice?: number,
    replacementProductVariantId?: string | null
  ): OrderEditOperation {
    return {
      operationType: OrderEditOperationType.ReplaceItem,
      orderItemId,
      replacementProductId,
      replacementProductVariantId: replacementProductVariantId || null,
      newQuantity,
      newUnitPrice,
    };
  }

  /**
   * Get refund reason label
   */
  getRefundReasonLabel(reason: RefundReason): string {
    const labels: Record<RefundReason, string> = {
      [RefundReason.CustomerRequest]: 'Customer Request',
      [RefundReason.OrderCancellation]: 'Order Cancellation',
      [RefundReason.ItemOutOfStock]: 'Item Out of Stock',
      [RefundReason.DamagedItem]: 'Damaged Item',
      [RefundReason.WrongItemShipped]: 'Wrong Item Shipped',
      [RefundReason.PriceAdjustment]: 'Price Adjustment',
      [RefundReason.DuplicateCharge]: 'Duplicate Charge',
      [RefundReason.ServiceIssue]: 'Service Issue',
      [RefundReason.PartialOrderCancellation]: 'Partial Order Cancellation',
      [RefundReason.QualityIssue]: 'Quality Issue',
      [RefundReason.LateDelivery]: 'Late Delivery',
      [RefundReason.Other]: 'Other',
    };
    return labels[reason] || 'Unknown';
  }

  /**
   * Check if order can be edited based on status
   * @see API Documentation - Business Rules
   */
  canEditOrder(orderStatus: number): boolean {
    // Editable statuses: Pending (0), Confirmed (1), Processing (2), Shipped (3)
    const EDITABLE_STATUSES = [0, 1, 2, 3];
    return EDITABLE_STATUSES.includes(orderStatus);
  }

async refundShipping(
  orderId: string,
  data: {
    adminNotes?: string;
    sendCustomerNotification?: boolean;
    currentUser?: string;
  }
): Promise<ShippingRefundResult> {
  try {
    const response = await apiClient.post<ShippingRefundResult>(
      `${API_ENDPOINTS.orders}/${orderId}/refund-shipping`,
      {
        orderId,
        adminNotes: data.adminNotes?.trim() || "",
        sendCustomerNotification: data.sendCustomerNotification ?? true,
        currentUser: data.currentUser
      }
    );

    const actualData = response.data;

    // ✅ HARD CHECK (no undefined allowed)
    if (!actualData) {
      throw new Error("Empty response from server");
    }

    if (actualData.success === false) {
      throw new Error(
        actualData.message ||
        actualData.errors?.[0] ||
        "Failed to refund shipping charge"
      );
    }

    return actualData; // ✅ always returns here

  } catch (error: any) {
    // ✅ ALWAYS throw → never return undefined
    throw new Error(
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0] ||
      error?.message ||
      "Failed to refund shipping charge"
    );
  }
}
  /**
   * Get order status label
   */
  getOrderStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Pending',
      1: 'Confirmed',
      2: 'Processing',
      3: 'Shipped',
      4: 'Delivered',
      5: 'Cancelled',
      6: 'Refunded',
      7: 'OnHold',
      8: 'Failed',
    };
    return labels[status] || 'Unknown';
  }
}

// Export singleton instance
export const orderEditService = new OrderEditService();
