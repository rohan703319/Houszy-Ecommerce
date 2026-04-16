import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// --- ProductReview Interfaces ---
export interface ReviewReply {
  id: string;
  reviewId: string;
  comment: string;
  isAdminReply: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  title: string;
  comment: string;
  rating: number;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  approvedBy?: string;
  approvedAt?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  imageUrls?: string[];
  videoUrls?: string[];
  createdAt: string;
  updatedAt?: string;
  replies: ReviewReply[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

export interface CreateReviewDto {
  productId: string;
  title: string;
  comment: string;
  rating: number;
  imageUrls?: string[];
  videoUrls?: string[];
  customerEmail?: string;
  customerName?: string;
}

export interface UpdateReviewDto {
  title: string;
  comment: string;
  rating: number;
  imageUrls?: string[];
  videoUrls?: string[];
}

export interface ReplyReviewDto {
  reviewId: string;
  comment: string;
  isAdminReply: boolean;
}

export interface ProductReviewStats {
  totalReviews: number;
  totalPending: number;
  totalApproved: number;
  totalVerified: number;
  totalUnverified: number;
}

export interface PaginatedProductsResponse {
  items: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price?: number;
  }[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginatedReviewsResponse {
  items: ProductReview[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;

  // ✅ ADD THIS
  stats: ProductReviewStats;
}

export interface ReviewFilters {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'approved';
  rating?: number;
  searchTerm?: string;
  customerEmail?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  verifiedOnly?: boolean;
}

export interface ProductWithReviewSummary {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  productSlug?: string;
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  averageRating: number;
  lastReviewDate?: string;
}

export interface PaginatedProductsWithReviewsResponse {
  items: ProductWithReviewSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ✅ NEW: Import Result Interface
export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  warnings: string[];
}

// --- Main Service ---
export const productReviewsService = {
  // Get all reviews with server-side filtering & pagination
  getAll: (filters: ReviewFilters = {}, config: any = {}) => {
    const params = new URLSearchParams();
    if (filters.page)        params.set('page',        String(filters.page));
    if (filters.pageSize)    params.set('pageSize',    String(filters.pageSize));
    if (filters.status)      params.set('status',      filters.status);
    if (filters.rating)      params.set('rating',      String(filters.rating));
    if (filters.searchTerm)  params.set('searchTerm',  filters.searchTerm);
    if (filters.customerEmail) params.set('customerEmail', filters.customerEmail);
    if (filters.productId)   params.set('productId',   filters.productId);
    if (filters.productName) params.set('productName', filters.productName);
    if (filters.verifiedOnly !== undefined) {
  params.set('verifiedOnly', String(filters.verifiedOnly));
}
    if (filters.productSku)  params.set('productSku',  filters.productSku);
    return apiClient.get<ApiResponse<PaginatedReviewsResponse>>(
      `${API_ENDPOINTS.productReviews}?${params}`,
      config
    );
  },

  // Get reviews by product ID
  getByProductId: (
    productId: string, 
    includeUnapproved: boolean = true,
    minRating?: number,
    maxRating?: number,
    verifiedPurchaseOnly?: boolean,
    config: any = {}
  ) => {
    const params = new URLSearchParams();
    if (includeUnapproved !== undefined) params.append('includeUnapproved', String(includeUnapproved));
    if (minRating !== undefined) params.append('minRating', String(minRating));
    if (maxRating !== undefined) params.append('maxRating', String(maxRating));
    if (verifiedPurchaseOnly !== undefined) params.append('verifiedPurchaseOnly', String(verifiedPurchaseOnly));
    
    const queryString = params.toString();
    return apiClient.get<ApiResponse<ProductReview[]>>(
      `${API_ENDPOINTS.productReviews}/product/${productId}${queryString ? '?' + queryString : ''}`,
      config
    );
  },

  // Get pending reviews
  getPendingReviews: (pageNumber: number = 1, pageSize: number = 25, config: any = {}) =>
    apiClient.get<ApiResponse<ProductReview[]>>(
      `${API_ENDPOINTS.productReviews}/pending?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      config
    ),

  // Create review
  create: (data: CreateReviewDto, config: any = {}) =>
    apiClient.post<ApiResponse<ProductReview>>(
      API_ENDPOINTS.productReviews,
      data,
      config
    ),

  // Update review
  update: (reviewId: string, data: UpdateReviewDto, config: any = {}) =>
    apiClient.put<ApiResponse<ProductReview>>(
      `${API_ENDPOINTS.productReviews}/${reviewId}`,
      data,
      config
    ),

  // Delete review
  delete: (reviewId: string, config: any = {}) =>
    apiClient.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.productReviews}/${reviewId}`,
      config
    ),

  // Get review by Product ID and Customer Email
  getByProductAndCustomer: async (
    productId: string, 
    customerEmail: string
  ): Promise<ProductReview | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ProductReview[]>>(
        `${API_ENDPOINTS.productReviews}/product/${productId}?includeUnapproved=true`
      );
      
      if (response.data && 'success' in response.data && response.data.success) {
        const reviews = response.data.data;
        if (Array.isArray(reviews)) {
          const matchingReview = reviews.find((r: ProductReview) => {
            const reviewEmail = r.customerEmail || r.customerName;
            return reviewEmail?.toLowerCase() === customerEmail.toLowerCase();
          });
          
          return matchingReview || null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching review by product and customer:', error);
      return null;
    }
  },

  // Approve review
  approve: (reviewId: string, config: any = {}) =>
    apiClient.put<ApiResponse<ProductReview>>(
      `${API_ENDPOINTS.productReviews}/${reviewId}/approve`,
      {},
      config
    ),

  // Reply to review
  reply: (reviewId: string, data: ReplyReviewDto, config: any = {}) =>
    apiClient.post<ApiResponse<ReviewReply>>(
      `${API_ENDPOINTS.productReviews}/${reviewId}/reply`,
      data,
      config
    ),

  // Mark as helpful
  markHelpful: (reviewId: string, isHelpful: boolean, config: any = {}) =>
    apiClient.post<ApiResponse<boolean>>(
      `${API_ENDPOINTS.productReviews}/${reviewId}/helpful?isHelpful=${isHelpful}`,
      {},
      config
    ),

  // Get all products
  getAllProducts: (page: number = 1, pageSize: number = 10, config: any = {}) =>
    apiClient.get<ApiResponse<PaginatedProductsResponse>>(
      `/api/Products?page=${page}&pageSize=${pageSize}&sortDirection=asc`,
      config
    ),

  // Get products that have reviews (for filter dropdown)
  getProductsWithReviews: (params: {
    page?: number;
    pageSize?: number;
    approvedOnly?: boolean;
    searchTerm?: string;
  } = {}, config: any = {}) => {
    const p = new URLSearchParams();
    if (params.page)        p.set('page',         String(params.page));
    if (params.pageSize)    p.set('pageSize',      String(params.pageSize));
    if (params.approvedOnly !== undefined) p.set('approvedOnly', String(params.approvedOnly));
    if (params.searchTerm)  p.set('searchTerm',    params.searchTerm);
    return apiClient.get<ApiResponse<PaginatedProductsWithReviewsResponse>>(
      `${API_ENDPOINTS.productReviews}/products-with-reviews?${p}`,
      config
    );
  },

// ✅ NEW API 1: Download Sample Excel Template
downloadSample: async (): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.productReviews}/download-sample`,
      {
        responseType: 'blob', // ✅ Important for file download
      }
    );
    
    // ✅ Fix: Explicitly cast to Blob
    return response.data as Blob;
  } catch (error: any) {
    console.error('❌ Error downloading sample:', error);
    throw new Error(error?.response?.data?.message || 'Failed to download sample file');
  }
},

// ✅ NEW API 2: Import Excel File
importExcel: async (file: File): Promise<ApiResponse<ImportResult>> => {
  try {
    const formData = new FormData();
    formData.append('excelFile', file);

    const response = await apiClient.post<ApiResponse<ImportResult>>(
      `${API_ENDPOINTS.productReviews}/import-excel`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // ✅ Fix: Handle undefined response
    if (!response.data) {
      throw new Error('No response data received from server');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Error importing Excel:', error);
    
    // ✅ Return backend error message
    const errorMessage = error?.response?.data?.message || 'Failed to import Excel file';
    const errors = error?.response?.data?.errors || [];
    
    // ✅ Fix: Throw proper error structure
    throw {
      message: errorMessage,
      errors: errors,
      response: error?.response,
      data: error?.response?.data
    };
  }
},

};
