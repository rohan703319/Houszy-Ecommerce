// lib/services/products.service.ts
import { apiClient } from '../api';
import { API_ENDPOINTS } from '../api-config';

// ==========================================
// INTERFACES - PRODUCT DATA
// ==========================================

// ============================================
// TYPES
// ============================================
export interface AdminCommentHistory {
  id: string;
  productId: string;
  oldComment: string | null;
  newComment: string | null;
  changedBy: string;
  changedAt: string;
}

export interface ProductFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isMain: boolean;
  fileName?: string;
  fileSize?: number;
  file?: File;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;           // For variation: "Red, Blue, Green" | For regular: "100% Cotton"
  displayOrder: number;
  sortOrder?: number;
  displayName?: string;
  // WooCommerce-style: marks this attribute as "Used for variations"
  isVariation?: boolean;
  displayType?: string;    // Only for variation: "buttons" | "dropdown" | "swatch"
  position?: number;       // Only for variation: ordering (1, 2, 3...)
}

export interface VATRateData {
  id: string;
  name: string;
  rate: number;
  isActive?: boolean;
  displayOrder?: number;
  description?: string;
  country?: string;
  region?: string
  isDefault?: boolean;
}
// ==========================================
// PRODUCT OPTION INTERFACES (ADD THESE)
// ==========================================

/**
 * Product Option - Defines selectable option types for a product
 * Example: Color, Size, Pack Size
 */
export interface ProductOption {
  id: string;
  name: string;              // "Color", "Size", "Pack Size"
  values: string[];          // ["Red", "Blue", "Green"]
  displayType: string;       // "dropdown", "swatch", "buttons", "radio"
  position: number;          // Display order (1, 2, 3...)
  isActive: boolean;         // Whether option is active
}

/**
 * Product Option Create DTO - For creating/updating product options via API
 * Note: values is sent as comma-separated string to API
 */
export interface ProductOptionCreate {
  name: string;              // "Color", "Size"
  values: string;            // "Red,Blue,Green" (comma-separated for API)
  displayType: string;       // "dropdown", "swatch", "buttons", "radio"
  position: number;          // Display order
  isActive: boolean;         // Whether option is active
}

/**
 * Product Option Update DTO - For updating existing options
 */
export interface ProductOptionUpdate extends Partial<ProductOptionCreate> {
  id?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  slug?: string;                    // ✅ ADD THIS (from your API response)
  price: number | null;
  compareAtPrice: number | null;
  weight: number | null;
  stockQuantity: number;
  trackInventory: boolean;
  
  // NEW: Option values as array matching ProductOptions order
  optionValues: string[];           // ✅ ["Red", "L"] - IMPORTANT FOR OPTIONS SYSTEM
  
  // Legacy option fields (for backward compatibility)
  option1Name: string | null;
  option1Value: string | null;
  option2Name: string | null;
  option2Value: string | null;
  option3Name: string | null;
  option3Value: string | null;
  
  imageUrl: string | null;
  imageFile?: File;                 // For upload preview
  isDefault: boolean;
  displayOrder: number;
  isActive: boolean;
  gtin: string | null;
  barcode: string | null;
  
  // Loyalty Points (calculated)
  loyaltyPointsEarnable?: number;   // ✅ ADD THIS (from your API response)
  loyaltyPointsMessage?: string;    // ✅ ADD THIS (from your API response)

  // Next Day Delivery overrides (null = inherit from parent product)
  nextDayDeliveryEnabled?: boolean | null;
  nextDayDeliveryFree?: boolean | null;
  nextDayDeliveryCutoffTime?: string | null;

  // Sale Count overrides
  fakeSaleCount?: number | null;
  saleCount?: number;
  displaySaleCount?: number;
  monthlySaleCount?: number;
  weeklySaleCount?: number;
}


export interface ProductsApiResponse {
  success: boolean;
  message: string;
  data: {
    items: ProductItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  errors: null;
}


export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  sku: string;
}

export interface DropdownsData {
  brands: BrandData[];
  categories: CategoryData[];

}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  oldPrice?: number;
  description?: string;
  shortDescription?: string;
}

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  subCategories?: CategoryData[];
}

export interface Product {
  lowStockThreshold: boolean;
  sales: number;
  categories: never[];
  assignedDiscounts(assignedDiscounts: any): unknown;
  discountLabel: string;
  discountTitle: string;
  
  id: string;
  name: string;
  slug?: string;
  status?:string;
  gender?:string;
  requireOtherProducts?:boolean;
  requiredProductIds?: string;
  automaticallyAddProducts?:boolean;
  recurringCycleLength?:string;
  vatRate?:number;
  recurringCyclePeriod?:string;
  displayStockAvailability?:boolean;
  displayStockQuantity?:boolean;
vatRateName?:string;
recurringTotalCycles?:number;
deliveryDateId?:number;
dispatchTimeNote?:string;
  nextDayDeliveryFree?:boolean;
  nextDayDeliveryCutoffTime?:string;
  aPlusTemplateId?: string | null;
  aPlusContent?: string | null;
  sku: string;
  gtin?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  isPharmaProduct?: boolean;
  excludeFromLoyaltyPoints?: boolean;
  manufacturerPartNumber?: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName: string;
  productType: string;
  price: number;
  stockStatus?: string;
  oldPrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  callForPrice?: boolean;
  customerEntersPrice?: boolean;
  minimumCustomerEnteredPrice?: number;
  maximumCustomerEnteredPrice?: number;
  stockQuantity: number;
  trackQuantity?: boolean;
  manageInventoryMethod?: string;
  minStockQuantity?: number;
  notifyAdminForQuantityBelow?: boolean;
  notifyQuantityBelow?: number;
  loyaltyPointsEarnable?: number;
  subscriptionDiscountPercentage?: number;
  allowBackorder?: boolean;
  loyaltyPointsMessage?: string;
  estimatedDispatchDays?: string;
  backorderMode?: string;
  orderMinimumQuantity?: number;
  orderMaximumQuantity?: number;
  allowedQuantities?: string;
  notReturnable?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  weightUnit?: string;
  dimensionUnit?: string;
  requiresShipping?: boolean;
  isFreeShipping?: boolean;
  shipSeparately?: boolean;
  additionalShippingCharge?: number;
  isPublished: boolean;
  publishedAt?: string;
  visibleIndividually?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
  disableBuyButton?: boolean;
  disableWishlistButton?: boolean;
  markAsNew?: boolean;
  markAsNewStartDate?: string;
  markAsNewEndDate?: string;
  availableStartDate?: string;
  availableEndDate?: string;
  taxExempt?: boolean;
  taxCategoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  searchEngineFriendlyPageName?: string;
  tags?: string;
allowedSubscriptionFrequencies?: string;
  averageRating?: number;
  reviewCount?: number;
  viewCount?: number;
  allowCustomerReviews?: boolean;
  videoUrls?: string;
  specificationAttributes?: string;
  relatedProductIds?: string;
  crossSellProductIds?: string;
  adminComment?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  nextDayDeliveryEnabled?:boolean;
  sameDayDeliveryEnabled?:boolean;
  isRecurring?:boolean;
  vatExempt?:boolean;
  standardDeliveryEnabled?:boolean;
  allowedDeliveryOptionIds?: string[];
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  options?: ProductOption[];        // ✅ ADD THIS LINE
  relatedProducts?: RelatedProduct[];
  crossSellProducts?: RelatedProduct[];
  
  backInStockCount?: number; // ✅ ADD THIS
  features?: ProductFeature[];

  // Sale Count fields
  fakeSaleCount?: number;
  saleCount?: number;
  displaySaleCount?: number;
  monthlySaleCount?: number;
  weeklySaleCount?: number;
}


export interface BrandData {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  logoUrl?: string;
  isPublished?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
}

export interface SimpleProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;

  // ✅ ADD THESE PROPERTIES
  brandId?: string;
  brandName?: string;
  
  categories?: {
    categoryId: string;
    categoryName: string;
    categorySlug?: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }[];
  
  images?: {
    id: string;
    imageUrl: string;
    altText?: string;
    sortOrder?: number;
    isMain?: boolean;
  }[];
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId?: string;
  productType?: string;
  price: number;
  stockQuantity: number;
  isPublished?: boolean;
  gtin?: string;
  manufacturerPartNumber?: string;
  oldPrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  weightUnit?: string;
  dimensionUnit?: string;
  requiresShipping?: boolean;
  isFreeShipping?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string;
  allowCustomerReviews?: boolean;  
  backInStockCount?: number; // ✅ ADD THIS
  features?: ProductFeature[];
  fakeSaleCount?: number;
  aPlusTemplateId?: string | null;
  aPlusContent?: string | null;
  allowedDeliveryOptionIds?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  vatRateId?: string;

  // Search
 
  searchTerm?: string;
   // ✅ NEW
  stockStatus?: "InStock" | "LowStock" | "OutOfStock" | "NotTracked";

  // ✅ NEW
  isPharmaProduct?: boolean;
  // Category / Brand
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;

  // Product type
  productType?: string;

  // Status
  isPublished?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;

  // Homepage / New
  showOnHomepage?: boolean;
  markAsNew?: boolean;

  // Inventory
  manageInventoryMethod?: string;

  // Subscription
  isRecurring?: boolean;

  // VAT
  vatExempt?: boolean;

  // Returnable
  notReturnable?: boolean;

  // Delivery
  nextDayDeliveryEnabled?: boolean;
  sameDayDeliveryEnabled?: boolean;
  standardDeliveryEnabled?: boolean;

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sortDirection?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;

    // ✅ ADD THIS
    stats: {
      totalProducts: number;
      totalPublished: number;
      totalUnpublished: number;
      totalActive: number;
      totalInactive: number;
      totalInStock: number;
      totalLowStock: number;
      totalOutOfStock: number;
    };
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[]; // 🔥 ADD THIS
}
// ==========================================
// PRODUCTS SERVICE
// ==========================================

export const productsService = {
  
  // ==========================================
  // BASIC CRUD OPERATIONS
  // ==========================================

getAll: async (params?: ProductQueryParams) => {
  const queryParams = new URLSearchParams();

  if (params?.page)
    queryParams.append("page", params.page.toString());

  if (params?.pageSize)
    queryParams.append("pageSize", params.pageSize.toString());

  if (params?.searchTerm)
    queryParams.append("searchTerm", params.searchTerm);

  if (params?.stockStatus)
    queryParams.append("stockStatus", params.stockStatus);

  if (params?.isPharmaProduct !== undefined)
    queryParams.append(
      "isPharmaProduct",
      params.isPharmaProduct.toString()
    );

  if (params?.categoryId)
    queryParams.append("categoryId", params.categoryId);

  if (params?.brandId)
    queryParams.append("brandId", params.brandId);

  if (params?.vatRateId)
    queryParams.append("vatRateId", params.vatRateId);

  if (params?.productType)
    queryParams.append("productType", params.productType);

  if (params?.isPublished !== undefined)
    queryParams.append(
      "isPublished",
      params.isPublished.toString()
    );

  if (params?.showOnHomepage !== undefined)
    queryParams.append(
      "showOnHomepage",
      params.showOnHomepage.toString()
    );

  if (params?.markAsNew !== undefined)
    queryParams.append(
      "markAsNew",
      params.markAsNew.toString()
    );

  if (params?.isRecurring !== undefined)
    queryParams.append(
      "isRecurring",
      params.isRecurring.toString()
    );

  if (params?.notReturnable !== undefined)
    queryParams.append(
      "notReturnable",
      params.notReturnable.toString()
    );

  if (params?.nextDayDeliveryEnabled !== undefined)
    queryParams.append(
      "nextDayDeliveryEnabled",
      params.nextDayDeliveryEnabled.toString()
    );

  if (params?.sameDayDeliveryEnabled !== undefined)
    queryParams.append(
      "sameDayDeliveryEnabled",
      params.sameDayDeliveryEnabled.toString()
    );

  if (params?.standardDeliveryEnabled !== undefined)
    queryParams.append(
      "standardDeliveryEnabled",
      params.standardDeliveryEnabled.toString()
    );

  if (params?.isDeleted !== undefined)
    queryParams.append(
      "isDeleted",
      params.isDeleted.toString()
    );

  if (params?.isActive !== undefined)
    queryParams.append(
      "isActive",
      params.isActive.toString()
    );

  if (params?.sortBy)
    queryParams.append("sortBy", params.sortBy);

  if (params?.sortDirection)
    queryParams.append(
      "sortDirection",
      params.sortDirection
    );

  const url = `${API_ENDPOINTS.products}${
    queryParams.toString()
      ? `?${queryParams.toString()}`
      : ""
  }`;

  return apiClient.get<PaginatedResponse<Product>>(url);
},


  getById: async (id: string) => {
    return apiClient.get<ApiResponse<Product>>(`${API_ENDPOINTS.products}/${id}`);
  },

    // ✅ NEW: Admin Comment History
  getAdminCommentHistory: async (productId: string) => {
    return apiClient.get<ApiResponse<AdminCommentHistory[]>>(
      `${API_ENDPOINTS.products}/${productId}/admin-comment-history`
    );
  },


searchSummary: async (params: {
  name?: string;
  sku?: string;
  includeHomepageCount?: boolean;
}) => {
  return apiClient.get<
    ApiResponse<{
      nameFound?: boolean;
      nameMatchedCount?: number;
      skuFound?: boolean;
      skuMatchedCount?: number;
      homepageCount?: number;
    }>
  >(`${API_ENDPOINTS.products}/search-summary`, {
    params,
  });
},
  create: async (data: CreateProductDto) => {
    return apiClient.post<ApiResponse<Product>>(API_ENDPOINTS.products, data);
  },

  update: async (id: string, data: UpdateProductDto) => {
    return apiClient.put<ApiResponse<Product>>(`${API_ENDPOINTS.products}/${id}`, data);
  },

// 🔥 Inventory Bulk Update (JSON) — MUST BE PUT
bulkUpdateInventory: async (
  items: {
    productId: string;
    variantId?: string;   // ✅ added
    newStock: number;
    newPrice: number;
    newOldPrice: number;
  }[]
) => {
  return apiClient.put<
    ApiResponse<{
      totalItems: number;
      updated: number;
      skipped: number;
      errors: {
        row: number;
        productId: string;
        reason: string;
      }[];
      details: {
        productId: string;
        productName: string;
        sku: string;
        oldStock: number;
        newStock: number;
        oldPrice: number;
        newPrice: number;
        oldOldPrice: number;
        newOldPrice: number;
      }[];
    }>
  >(API_ENDPOINTS.inventoryBulkUpdate, items);
},

inventorySampleExcel: async () => {
  return apiClient.get(
    `${API_ENDPOINTS.inventorySampleExcel}`,
    {
      responseType: "blob",
    }
  );
},
getSimpleProducts: async () => {
  return apiClient.get<ApiResponse<Product[]>>(
    `${API_ENDPOINTS.products}/simple`
  );
},

// 🔥 Inventory Bulk Upload (Excel File) — POST is correct here
bulkUploadInventoryExcel: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<
    ApiResponse<any>
  >(API_ENDPOINTS.inventoryBulkUpload, formData);
},
toggleActive: async (id: string) => {
  return apiClient.patch<ApiResponse<{
    productId: string;
    productName: string;
    isActive: boolean;
  }>>(
    `${API_ENDPOINTS.products}/${id}/toggle-active`
  );
},

togglePublish: async (id: string) => {
  return apiClient.patch<ApiResponse<{
    productId: string;
    productName: string;
    isPublished: boolean;
  }>>(
    `${API_ENDPOINTS.products}/${id}/toggle-publish`
  );
},


  delete: async (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.products}/${id}`);
  },
restore: async (id: string) => {
  return apiClient.post<ApiResponse<void>>(
    `${API_ENDPOINTS.products}/${id}/restore`
  );
},
  getByCategory: async (categoryId: string, params?: Omit<ProductQueryParams, 'categoryId'>) => {
    return productsService.getAll({ ...params, categoryId });
  },

  getByBrand: async (brandId: string, params?: Omit<ProductQueryParams, 'brandId'>) => {
    return productsService.getAll({ ...params, brandId });
  },

  // ==========================================
  // IMAGE MANAGEMENT
  // ==========================================
addImages: async (
  productId: string,
  images: FormData,
  name?: string
) => {
  return apiClient.post<ApiResponse<ProductImage[]>>(
    `${API_ENDPOINTS.products}/${productId}/images${
      name ? `?name=${encodeURIComponent(name)}` : ''
    }`,
    images
  );
},

  deleteImage: async (imageId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.products}/images/${imageId}`
    );
  },

  deleteVariantImage: async (variantId: string) => {
  return apiClient.delete<ApiResponse<void>>(
    `${API_ENDPOINTS.products}/variants/${variantId}/image`
  );
},

  createWithImages: async (data: FormData) => {
    return apiClient.post<ApiResponse<Product>>(
      `${API_ENDPOINTS.products}/with-images`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  // ==========================================
  // 🗑️ ATTRIBUTE MANAGEMENT
  // ==========================================

  deleteAttribute: async (productId: string, attributeId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.products}/${productId}/attributes/${attributeId}`
    );
  },

  addAttribute: async (productId: string, attribute: ProductAttribute) => {
    return apiClient.post<ApiResponse<ProductAttribute>>(
      `${API_ENDPOINTS.products}/${productId}/attributes`,
      attribute
    );
  },

  updateAttribute: async (productId: string, attributeId: string, attribute: Partial<ProductAttribute>) => {
    return apiClient.put<ApiResponse<ProductAttribute>>(
      `${API_ENDPOINTS.products}/${productId}/attributes/${attributeId}`,
      attribute
    );
  },

  // ==========================================
// 📥 IMPORT PRODUCTS (EXCEL)
// ==========================================

/**
 * Download Product Import Template
 * GET: /api/Products/import-template
 */
downloadImportTemplate: async () => {
  return apiClient.get(
    `${API_ENDPOINTS.products}/import-template`,
    {
      responseType: "blob",   // ✅ VERY IMPORTANT
    }
  );
},

/**
 * Download Bulk Update Template (Excel)
 * POST: /api/Products/bulk-update-template
 * Params: searchTerm, isPublished, stockStatus, categoryId, fields
 */
  downloadBulkUpdateTemplate: async (params: {
    searchTerm?: string;
    isPublished?: boolean;
    stockStatus?: string;
    categoryId?: string;
    fields: string[];
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params.isPublished !== undefined) queryParams.append("isPublished", params.isPublished.toString());
    if (params.stockStatus) queryParams.append("stockStatus", params.stockStatus);
    if (params.categoryId) {
      const ids = params.categoryId.split(",");
      ids.forEach(id => {
        if (id.trim()) queryParams.append("categoryId", id.trim());
      });
    }
    
    // 💡 OPTIMIZATION: If too many fields are selected, the URL becomes too long.
    // We only send the fields if the user has specifically filtered them.
    // If they selected almost everything, we omit the param to let backend default to all.
    if (params.fields && params.fields.length > 0 && params.fields.length < 100) {
      queryParams.append("fields", params.fields.join(","));
    }

    const url = `${API_ENDPOINTS.bulkUpdateTemplate}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    return apiClient.get(url, {
      responseType: "blob",
    });
  },

/**
 * Upload Bulk Update Excel File
 * POST: /api/Products/bulk-update-excel
 * Body: multipart/form-data (excelFile)
 */
bulkUpdateWithExcel: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<ApiResponse<any>>(
    API_ENDPOINTS.bulkUpdateExcel,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
},

exportCategoriesExcel: async () => {
  return apiClient.get(API_ENDPOINTS.exportCategoriesExcel, {
    responseType: "blob",
  });
},

importCategoriesExcel: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<ApiResponse<any>>(
    API_ENDPOINTS.importCategoriesExcel,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
},


/**
 * Upload Product Excel File
 * POST: /api/Products/import-excel
 * Body: multipart/form-data (excelFile)
 */
importExcel: async (file: File) => {
  const formData = new FormData();
  formData.append("excelFile", file);

  return apiClient.post<{
    success: boolean;
    message: string;
    data?: {
      totalRows: number;
      successCount: number;
      failedCount: number;
      errors: string[];
      warnings: string[];
    };
  }>(
    `${API_ENDPOINTS.products}/import-excel`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
},

 importWooCommerce: async (file: File) => {
    const formData = new FormData();

    // ⚠️ MUST MATCH BACKEND PARAM NAME
    formData.append("csvFile", file);

    return apiClient.post<{
      success: boolean;
      message: string;
      data?: {
        totalRows: number;
        successCount: number;
        failedCount: number;
        errors: string[];
        warnings: string[];
      };
    }>(
      `${API_ENDPOINTS.products}/import-woocommerce`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },



  // ==========================================
  // PRODUCT OPTIONS MANAGEMENT
  // ==========================================
  
  /**
   * Get all options for a product
   */
  getOptions: async (productId: string) => {
    return apiClient.get<ApiResponse<ProductOption[]>>(
      `${API_ENDPOINTS.products}/${productId}/options`
    );
  },
  
  /**
   * Add a new option to a product
   */
  addOption: async (productId: string, option: ProductOptionCreate) => {
    return apiClient.post<ApiResponse<ProductOption>>(
      `${API_ENDPOINTS.products}/${productId}/options`,
      option
    );
  },
  
  /**
   * Update an existing product option
   */
  updateOption: async (productId: string, optionId: string, option: Partial<ProductOptionCreate>) => {
    return apiClient.put<ApiResponse<ProductOption>>(
      `${API_ENDPOINTS.products}/${productId}/options/${optionId}`,
      option
    );
  },
  
  /**
   * Delete a product option
   */
  deleteOption: async (productId: string, optionId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.products}/${productId}/options/${optionId}`
    );
  },
  
  /**
   * Generate all variant combinations from product options
   * Creates Cartesian product of all option values
   */
  generateVariants: async (productId: string) => {
    return apiClient.post<ApiResponse<ProductVariant[]>>(
      `${API_ENDPOINTS.products}/${productId}/generate-variants`
    );
  },
  

  // ==========================================
  // 🗑️ VARIANT MANAGEMENT
  // ==========================================

  deleteVariant: async (productId: string, variantId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.products}/${productId}/variants/${variantId}`
    );
  },

  addVariant: async (productId: string, variant: ProductVariant) => {
    return apiClient.post<ApiResponse<ProductVariant>>(
      `${API_ENDPOINTS.products}/${productId}/variants`,
      variant
    );
  },

  updateVariant: async (productId: string, variantId: string, variant: Partial<ProductVariant>) => {
    return apiClient.put<ApiResponse<ProductVariant>>(
      `${API_ENDPOINTS.products}/${productId}/variants/${variantId}`,
      variant
    );
  },

  addVariantImage: async (variantId: string, image: FormData) => {
    return apiClient.post<ApiResponse<ProductVariant>>(
      `${API_ENDPOINTS.products}/variants/${variantId}/image`,
      image,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  createWithVariants: async (data: FormData) => {
    return apiClient.post<ApiResponse<Product>>(
      `${API_ENDPOINTS.products}/with-variants`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  /**
   * Update product image metadata (altText, sortOrder, isMain)
   * @param productId Product ID
   * @param imageId Image ID
   * @param data Image update data
   */
  updateProductImage: (productId: string, imageId: string, data: {
    altText: string;
    sortOrder: number;
    isMain: boolean;
  }) =>
    apiClient.put<ApiResponse<any>>(
      `${API_ENDPOINTS.products}/${productId}/images/${imageId}`,
      data
    ),


 

  // ==========================================
  // 📧 BACK-IN-STOCK SUBSCRIPTIONS
  // ==========================================

  subscribeBackInStock: async (productId: string, email: string) => {
    return apiClient.post<ApiResponse<any>>(
      `${API_ENDPOINTS.products}/${productId}/back-in-stock-subscription`,
      { email }
    );
  },

  getBackInStockSubscribers: async (productId: string) => {
    return apiClient.get<ApiResponse<any[]>>(
      `${API_ENDPOINTS.products}/${productId}/back-in-stock-subscribers`
    );
  },
};

// ==========================================
// PRODUCT HELPER FUNCTIONS
// ==========================================

export const productHelpers = {
  getStockStatus: ({
  stockQuantity,
  trackQuantity,
  lowStockThreshold,
  allowBackorder,
}: {
  stockQuantity: number;
  trackQuantity?: boolean;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
}): string => {

  if (!trackQuantity) return "Not Tracked";

  if (stockQuantity === 0 && allowBackorder)
    return "Backorder";

  if (stockQuantity === 0)
    return "Out of Stock";

  if (lowStockThreshold && stockQuantity <= lowStockThreshold)
    return "Low Stock";

  return "In Stock";
},


  getMainImageUrl: (images: ProductImage[] | undefined, baseUrl: string): string => {
    if (!images || images.length === 0) return '';
    const mainImage = images.find(img => img.isMain) || images[0];
    return `${baseUrl.replace(/\/$/, '')}/${mainImage.imageUrl.replace(/^\//, '')}`;
  },

  formatProduct: (product: any, baseUrl: string) => ({
    ...product,
    status: productHelpers.getStockStatus(product.stockQuantity),
    image: productHelpers.getMainImageUrl(product.images, baseUrl),
    categoryName: product.categoryName || 'Uncategorized',
    brandName: product.brandName || 'No Brand',
  }),

  getDiscountPercentage: (oldPrice: number, currentPrice: number): number => {
    if (!oldPrice || oldPrice <= currentPrice) return 0;
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  },

  isNewProduct: (product: Product): boolean => {
    if (!product.markAsNew) return false;
    
    const now = new Date();
    const startDate = product.markAsNewStartDate ? new Date(product.markAsNewStartDate) : null;
    const endDate = product.markAsNewEndDate ? new Date(product.markAsNewEndDate) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    return true;
  },

  isAvailable: (product: Product): boolean => {
    const now = new Date();
    const startDate = product.availableStartDate ? new Date(product.availableStartDate) : null;
    const endDate = product.availableEndDate ? new Date(product.availableEndDate) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    return true;
  },
};

// ==========================================
// EXPORT DEFAULT
// ==========================================d

export default productsService;
