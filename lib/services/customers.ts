// lib/services/customers.ts
import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;

  phoneNumber?: string;      // ✅ ADD
  isDefault?: boolean;       // ✅ ADD
}

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId?: string;

  productName: string;
  productSku: string;
  productImageUrl: string;

  variantName?: string;      // ✅ ADD

  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
export interface Order {
  id: string;
  orderNumber: string;

  status: string;
  statusName: string;              // ✅ ADD

  orderDate: string;

  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;

  currency: string;

  notes?: string;

  deliveryMethod: string;
  deliveryMethodName: string;      // ✅ ADD
  shippingMethodName?: string;     // ✅ ADD

  payment: Payment;                // ✅ ADD

  totalPaidAmount: number;         // ✅ ADD
  paymentStatus: string;           // ✅ ADD

  shipments: any[];                // (keep any or define later)

  unshippedItems: UnshippedItem[]; // ✅ ADD

  items: OrderItem[];              // ✅ ADD (MAIN IMPORTANT)

  itemsCount: number;

  billingAddress: Address;
  shippingAddress: Address;
}

export interface UnshippedItem {
  orderItemId: string;
  productName: string;
  productSku: string;
  productImageUrl: string;

  unitPrice: number;

  orderedQuantity: number;
  shippedQuantity: number;
  unshippedQuantity: number;
}

export interface Payment {
  id: string;
  paymentMethod: string;

  status: string;
  statusName: string;

  amount: number;
  currency: string;

  transactionId: string;

  processedAt: string;

  refundAmount?: number;
  isRefunded: boolean;
}
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  addresses: Address[];
  orders: Order[];
  totalOrders: number;
  accountType?: "Personal" | "Business";
companyName?: string;
companyNumber?: string;
  totalSpent: number;
  tierLevel?: "Gold" | "Silver" | "Bronze"; // ✅ ADD THIS
  role?: string;
}

export interface CustomerQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  tierLevel?: string; // ✅ ADD THIS
}

// ✅ Add Response Interface
interface ApiResponse<T> {
  data: {
    success: boolean;
    data: T;
    message?: string;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newCustomersLast30Days: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface PaginatedResponse {
  items: Customer[];
  stats: CustomerStats; // ✅ ADD THIS
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export const customersService = {
  getAll: (params?: CustomerQueryParams): Promise<ApiResponse<PaginatedResponse>> =>
    apiClient.get(API_ENDPOINTS.customers, { params }) as Promise<ApiResponse<PaginatedResponse>>,

  getById: (id: string): Promise<ApiResponse<Customer>> =>
    apiClient.get(`${API_ENDPOINTS.customers}/${id}`) as Promise<ApiResponse<Customer>>,

  toggleStatus: (id: string): Promise<ApiResponse<string>> =>
  apiClient.put(`${API_ENDPOINTS.customers}/${id}/toggle-status`) as Promise<ApiResponse<string>>,

  assignRole: (customerId: string, role: string): Promise<ApiResponse<any>> =>
    apiClient.put(`/api/Customers/${customerId}/assign-role`, { role }) as Promise<ApiResponse<any>>,
};