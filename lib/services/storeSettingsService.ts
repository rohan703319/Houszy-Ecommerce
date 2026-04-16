import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

// ==============================
// TYPES (MATCH API EXACTLY)
// ==============================

export interface StoreSettings {
  id: string;

  storeName: string;
  storeTagline: string;
  storeEmail: string;
  storePhone: string;

  storeAddress?: string;
  storeCity?: string;
  storePostalCode?: string;
  storeCountry?: string;

  currency: string;
  timezone: string;
  adminPanelName: string;

  // ✅ optional fields (safe)
  logoUrl?: string | null;
  faviconUrl?: string | null;

  stripeEnabled: boolean;
  stripeTestMode: boolean;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  stripeWebhookSecret?: string | null;

  payPalEnabled: boolean;
  payPalSandboxMode: boolean;
  payPalClientId?: string | null;
  payPalClientSecret?: string | null;

  codEnabled: boolean;
  bankTransferEnabled: boolean;

  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string | null;

  emailFromName: string;
  emailFromAddress: string;
  adminEmail: string;
  supportEmail: string;

  smtpEnableSsl: boolean;

  accentColor: string;
  showBreadcrumbs: boolean;
  compactMode: boolean;

  sessionTimeoutMinutes: number;
  jwtExpiryMinutes: number;
  maxLoginAttempts: number;

  requireStrongPassword: boolean;
  twoFactorEnabled: boolean;
  ipWhitelist?: string | null;

  notifyNewOrder: boolean;
  notifyLowStock: boolean;
  lowStockThreshold: number;

  notifyNewReview: boolean;
  notifyCustomerRegistration: boolean;
  notifyRefundRequest: boolean;
  notifyDailyReport: boolean;

  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ==============================
// DTO
// ==============================

export type UpdateStoreSettingsDto = Partial<StoreSettings> & {
  currentUser?: string;
};

// ==============================
// RESPONSE
// ==============================

export interface StoreSettingsResponse {
  success: boolean;
  message: string;
  data: StoreSettings;
}

// ==============================
// SERVICE
// ==============================

export const storeSettingsService = {
  get: (config: any = {}) =>
    apiClient.get<StoreSettingsResponse>(
      API_ENDPOINTS.storeSettings,
      config
    ),

  update: (data: UpdateStoreSettingsDto, config: any = {}) =>
    apiClient.put<StoreSettingsResponse>(
      API_ENDPOINTS.storeSettings,
      data,
      config
    ),
};