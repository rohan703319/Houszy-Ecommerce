export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.athlits.co.uk';

export const API_ENDPOINTS = {
  // Auth
  login: '/api/Auth/login',
  register: '/api/Auth/register',
  contact: '/api/Contact',
  refreshToken: '/api/Auth/refresh-token',
  changePassword: '/api/Auth/change-password',
  exportOrdersTravelbook: '/api/Orders/export-travelbook',
  exportProcessingForShipment: '/api/Orders/export-processing-for-shipment',
  bulkShipFromExcel: '/api/Orders/bulk-ship-from-excel',



  // Categories
  categories: '/api/Categories',
  uploadCategoryImage: '/api/Categories/upload-image',
  deleteCategoryImage: '/api/ImageManagement/category',

  StoreLocations: '/api/StoreLocations',
  storeSettings: "/api/StoreSettings",

  // Manufacturers
  manufacturers: '/api/Manufacturers',

  // Brands
  brands: '/api/Brands',
  uploadBrandLogo: '/api/Brands/upload-logo',
  deleteBrandLogo: '/api/ImageManagement/brand',

  // Products
  products: '/api/Products',
  inventoryBulkUpdate: "/api/Products/inventory/bulk-update",
  inventoryBulkUpload: "/api/Products/inventory/bulk-upload",
  inventorySampleExcel: "/api/Products/inventory/sample-excel",
  bulkUpdateTemplate: "/api/Products/bulk-update-template",
  bulkUpdateExcel: "/api/Products/bulk-update-excel",
  exportCategoriesExcel: "/api/products/export-categories-excel",
  importCategoriesExcel: "/api/products/import-categories-excel",
  PharmacyQuestions: '/api/pharmacy-questions',

  deliveryStrip: "/api/DeliveryStrip",
  // Product Lock & Takeover System
  productLock: {
    acquireLock: (productId: string) => `/api/Products/${productId}/acquire-lock`,
    releaseLock: (productId: string) => `/api/Products/${productId}/release-lock`,
    lockStatus: (productId: string) => `/api/Products/${productId}/lock-status`,
    requestTakeover: (productId: string) => `/api/Products/${productId}/request-takeover`,
    pendingTakeoverRequests: '/api/Products/pending-takeover-requests',
    myTakeoverRequests: '/api/Products/my-takeover-requests',
    approveTakeover: (requestId: string) => `/api/Products/takeover-requests/${requestId}/approve`,
    rejectTakeover: (requestId: string) => `/api/Products/takeover-requests/${requestId}/reject`,
    cancelTakeover: (requestId: string) => `/api/Products/takeover-requests/${requestId}/cancel`,
  },

  // Orders
  orders: '/api/Orders',
  exportOrders: '/api/Orders/export',
  bulkUpdateOrdersExcel: '/api/Orders/bulk-update-excel',
  orderCancellationrequests: '/api/Orders/cancellation-requests',
  AddressLookup: '/api/address-lookup',

  // Shipping
  shipping: "/api/Shipping",
  deliveryOptions: '/api/Shipping/delivery-options',
  postcodeRules: '/api/Shipping/postcode-rules',

  // Image Management
  imageManagement: '/api/ImageManagement',

  // Customers
  customers: '/api/customers',
  GoogleMerchantCenter: '/api/GoogleMerchant',

  // Staff
  staff: '/api/Staff',
  staffRoles: '/api/Staff/roles',

  // Discounts
  discounts: '/api/Discounts',

  // Banners
  banners: '/api/Banners',
  uploadBannerImage: '/api/Banners/upload-image',
  deleteBannerImage: '/api/Banners/delete-image',

  // Blog Categories
  blogCategories: '/api/BlogCategories',
  deleteBlogCategoryImage: '/api/BlogCategories/delete-image',
  uploadBlogCategoryImage: '/api/BlogCategories/upload-image',

  // Blog Posts
  blogPosts: '/api/BlogPosts',
  uploadBlogPostImage: '/api/BlogPosts/upload-image',
  deleteBlogPostImage: '/api/BlogPosts/delete-image',

  // VAT Rates
  vatrates: '/api/VATRates',

  // Product Reviews
  productReviews: '/api/ProductReviews',

  // Subscriptions
  subscriptions: '/api/Subscriptions',

  // Comments
  blogComments: '/api/BlogComments',

  // Editor
  editor: {
    uploadImage: '/api/Editor/upload-image',
    deleteImage: '/api/Editor/delete-image',
    deleteImageByUrl: '/api/Editor/delete-image-by-url',
  },

  // Activity Logs
  activityLogs: {
    base: '/api/ActivityLogs',
    delete: (id: string) => `/api/ActivityLogs/${id}`,
    clear: '/api/ActivityLogs/clear',
  },
  dashboard: {
    stats: '/api/Dashboard/stats',
    overview: '/api/Dashboard/overview',
  },

  // Loyalty Config
  loyaltyConfig: '/api/admin/loyalty-config',
  loyaltyPoints: {
    balance: '/api/loyalty/balance',
    history: '/api/loyalty/history'
  },
  aplusTemplates: '/api/APlusTemplates',
};
