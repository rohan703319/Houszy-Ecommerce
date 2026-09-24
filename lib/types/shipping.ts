// ==================== CARRIER TYPES ====================

export interface Carrier {
  id: string;
  name: string;
  trackingUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateCarrierDto {
  name: string;
  trackingUrl?: string | null;
  isActive: boolean;
  displayOrder?: number;
}

export interface UpdateCarrierDto {
  id: string;
  name: string;
  trackingUrl?: string | null;
  isActive: boolean;
  displayOrder?: number;
}

// ==================== DELIVERY OPTION & SERVICE TYPES ====================

export type DeliveryOptionCategory = "Standard" | "NextDay" | "SameDay" | "ClickAndCollect" | number;

export interface DeliveryService {
  id: string;
  deliveryOptionId: string;
  name: string;
  displayName: string;
  carrierId?: string | null;
  carrierName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  cutoffTime?: string | null;
  isSaturdayWorking: boolean;
  isSundayWorking: boolean;
  postcodeSurchargeOverride?: number | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateDeliveryServiceDto {
  deliveryOptionId: string;
  name: string;
  displayName: string;
  carrierId?: string | null;
  carrierName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  cutoffTime?: string | null;
  isSaturdayWorking: boolean;
  isSundayWorking: boolean;
  postcodeSurchargeOverride?: number | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateDeliveryServiceDto {
  id: string;
  deliveryOptionId: string;
  name: string;
  displayName: string;
  carrierId?: string | null;
  carrierName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  cutoffTime?: string | null;
  isSaturdayWorking: boolean;
  isSundayWorking: boolean;
  postcodeSurchargeOverride?: number | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface DeliveryOption {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  category: DeliveryOptionCategory;
  isActive: boolean;
  displayOrder: number;
  deliveryServices?: DeliveryService[];
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateDeliveryOptionDto {
  name: string;
  displayName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  category: DeliveryOptionCategory;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateDeliveryOptionDto {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  price: number;
  freeShippingThreshold?: number | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  category: DeliveryOptionCategory;
  isActive: boolean;
  displayOrder: number;
}

// ==================== NON-WORKING DAYS (HOLIDAYS) TYPES ====================

export interface NonWorkingDay {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  name: string;
  isRecurringYearly: boolean;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateNonWorkingDayDto {
  date: string;
  name: string;
  isRecurringYearly: boolean;
  isActive: boolean;
  notes?: string | null;
}

export interface UpdateNonWorkingDayDto {
  id: string;
  date: string;
  name: string;
  isRecurringYearly: boolean;
  isActive: boolean;
  notes?: string | null;
}

// ==================== POSTCODE RULES ====================

export interface PostcodeRule {
  id: string;
  postcodePattern: string;
  ruleType: "Surcharge" | "Restricted";
  surchargeAmount: number;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreatePostcodeRuleDto {
  postcodePattern: string;
  ruleType: "Surcharge" | "Restricted";
  surchargeAmount: number;
  notes?: string | null;
  isActive: boolean;
}

export interface UpdatePostcodeRuleDto {
  id: string;
  postcodePattern: string;
  ruleType: "Surcharge" | "Restricted";
  surchargeAmount: number;
  notes?: string | null;
  isActive: boolean;
}

// ==================== SHIPPING QUOTE ====================

export interface ShippingQuoteDto {
  deliveryOptionId: string;
  deliveryServiceId?: string | null;
  name: string;
  displayName: string;
  carrierName: string;
  serviceName: string;
  category: DeliveryOptionCategory;
  description?: string | null;
  price: number;
  originalPrice: number;
  isFree: boolean;
  surchargeApplied: number;
  isRestricted: boolean;
  isDefault: boolean;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  estimatedDeliveryFrom: string;
  estimatedDeliveryTo: string;
  estimatedDeliveryDateMin?: string | null;
  estimatedDeliveryDateMax?: string | null;
  estimatedDelivery?: string | null;
  cutoffTime?: string | null;
  nextCutoffUtc?: string | null;
  displayOrder: number;
}

// ==================== LEGACY SHIPPING ZONE TYPES ====================

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  country: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateZoneDto {
  name: string;
  description: string;
  country: string;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateZoneDto {
  name: string;
  description: string;
  country: string;
  isActive: boolean;
  displayOrder: number;
}

// ==================== LEGACY SHIPPING METHOD TYPES ====================

export interface ShippingMethod {
  id: string;
  name: string;
  displayName: string;
  description: string;
  carrierCode: string;
  serviceCode: string;
  deliveryTimeMinDays: number;
  deliveryTimeMaxDays: number;
  trackingSupported: boolean;
  signatureRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateMethodDto {
  name: string;
  displayName: string;
  description: string;
  carrierCode: string;
  serviceCode: string;
  deliveryTimeMinDays: number;
  deliveryTimeMaxDays: number;
  trackingSupported: boolean;
  signatureRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateMethodDto {
  name: string;
  displayName: string;
  description: string;
  carrierCode: string;
  serviceCode: string;
  deliveryTimeMinDays: number;
  deliveryTimeMaxDays: number;
  trackingSupported: boolean;
  signatureRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}

// ==================== LEGACY SHIPPING RATE TYPES ====================

export interface ShippingRate {
  id: string;
  shippingMethodId: string;
  shippingMethodName: string;
  weightFrom: number;
  weightTo: number;
  orderValueFrom: number;
  orderValueTo: number;
  baseRate: number;
  perKgRate: number;
  perItemRate: number;
  minimumCharge: number;
  maximumCharge: number | null;
  freeShippingThreshold: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ZoneRates {
  zoneId: string;
  zoneName: string;
  zoneDescription: string;
  rates: ShippingRate[];
}

export interface CreateRateDto {
  shippingZoneId: string;
  shippingMethodId: string;
  weightFrom: number;
  weightTo: number;
  orderValueFrom: number;
  orderValueTo: number;
  baseRate: number;
  perKgRate: number;
  perItemRate: number;
  minimumCharge: number;
  maximumCharge: number | null;
  freeShippingThreshold: number | null;
  isActive: boolean;
}

export interface UpdateRateDto {
  baseRate: number;
  perKgRate: number;
  perItemRate: number;
  minimumCharge: number;
  maximumCharge: number | null;
  freeShippingThreshold: number | null;
  isActive: boolean;
}

// ==================== API RESPONSE TYPES ====================

export interface ShippingApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[] | null;
}

export interface ZoneApiResponse {
  success: boolean;
  message?: string;
  data: ShippingZone[];
  errors?: string[] | null;
}

export interface SingleZoneResponse {
  success: boolean;
  message?: string;
  data: ShippingZone;
  errors?: string[] | null;
}

export interface MethodApiResponse {
  success: boolean;
  message?: string;
  data: ShippingMethod[];
  errors?: string[] | null;
}

export interface SingleMethodResponse {
  success: boolean;
  message?: string;
  data: ShippingMethod;
  errors?: string[] | null;
}

export interface RateApiResponse {
  success: boolean;
  message?: string;
  data: ZoneRates;
  errors?: string[] | null;
}

export interface SingleRateResponse {
  success: boolean;
  message?: string;
  data: string; // Returns rate ID
  errors?: string[] | null;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  data?: string;
  errors?: string[] | null;
}

// ==================== STATS TYPES ====================

export interface ShippingStats {
  totalZones: number;
  totalMethods: number;
  totalRates: number;
  activeZones: number;
  activeMethods: number;
}
