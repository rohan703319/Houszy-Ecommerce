// Base API URL - make sure this is defined or imported from your config

import { API_BASE_URL } from "@/lib/api";


/**
 * Format date to readable string format
 * @param dateString - Date string or null/undefined
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date with custom options
 * @param dateString - Date string or null/undefined
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDateCustom = (
  dateString?: string | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  
  return date.toLocaleString("en-US", options || defaultOptions);
};

/**
 * Format currency to GBP (£) format
 * @param value - Number to format as currency
 * @returns Formatted currency string with £ symbol
 */
export const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return "£0.00";
  return `£${value.toLocaleString("en-GB", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format currency with custom currency symbol
 * @param value - Number to format as currency
 * @param currency - Currency symbol (default: £)
 * @returns Formatted currency string
 */
export const formatCurrencyWithSymbol = (value: number, currency: string = "£"): string => {
  if (value === undefined || value === null) return `${currency}0.00`;
  return `${currency}${value.toLocaleString("en-GB", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Get order product image URL
 * @param imageUrl - Image URL string
 * @returns Complete image URL or fallback image
 */
export const getOrderProductImage = (imageUrl?: string): string => {
  if (!imageUrl) return "/no-image.png";

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return API_BASE_URL.replace("/api", "") + imageUrl.replace("~", "");
};

/**
 * Get product main image from images array
 * @param images - Array of image objects with isMain and imageUrl properties
 * @returns Main image URL or empty string if no images
 */
export const getProductImage = (images: any[]): string => {
  if (!images || images.length === 0) return "";

  const mainImage = images.find((img: any) => img.isMain) || images[0];
  let imageUrl = mainImage.imageUrl || "";

  if (!imageUrl) return "";

  // If already full URL → return directly
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Otherwise attach base URL (for local uploads)
  return API_BASE_URL.replace("/api", "") + imageUrl.replace("~", "");
};

/**
 * Get all product images (array of URLs)
 * @param images - Array of image objects
 * @returns Array of complete image URLs
 */
export const getAllProductImages = (images: any[]): string[] => {
  if (!images || images.length === 0) return [];
  
  return images.map(img => {
    let imageUrl = img.imageUrl || "";
    if (!imageUrl) return "";
    
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    
    return API_BASE_URL.replace("/api", "") + imageUrl.replace("~", "");
  }).filter(url => url !== "");
};
export const formatValue = (value: any) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.includes("T") && value.includes(":"))
    return new Date(value).toLocaleString();
  return value.toString();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  export const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    
    const cleanUrl = imageUrl.split('?')[0];
    
    return `${API_BASE_URL}/${cleanUrl}`;
  };

  export const extractFilename = (imageUrl: string) => {
    if (!imageUrl) return "";

    const cleanedUrl = imageUrl.replace(API_BASE_URL, "");

    const parts = cleanedUrl.split("/");

    return parts.pop() || "";
  };
/**
 * Get thumbnail image (smaller version if available)
 * @param imageUrl - Original image URL
 * @returns Thumbnail URL or original if thumbnail not available
 */
export const getThumbnailImage = (imageUrl?: string): string => {
  if (!imageUrl) return "/no-image.png";
  
  // If it's already a full URL
  if (imageUrl.startsWith("http")) {
    // You can add logic here to transform to thumbnail if your API supports it
    // Example: imageUrl.replace("/images/", "/thumbnails/")
    return imageUrl;
  }
  
  return API_BASE_URL.replace("/api", "") + imageUrl.replace("~", "");
};

/**
 * Format number with commas
 * @param value - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString("en-US");
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, length: number = 50): string => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get status badge color based on status type
 * @param status - Status string
 * @returns CSS class or color code
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    completed: "green",
    pending: "orange",
    cancelled: "red",
    processing: "blue",
    shipped: "purple",
    delivered: "green",
    paid: "green",
    failed: "red",
    refunded: "gray",
  };
  
  return statusColors[status?.toLowerCase()] || "gray";
};

/**
 * Format phone number to readable format
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // Format based on length (UK numbers)
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, "$1 $2");
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  }
  return phone;
};

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const formatDateOnly = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};