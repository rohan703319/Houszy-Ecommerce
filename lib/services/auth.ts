// lib/services/auth.ts (ya jaha bhi tum rakhe ho)

import { apiClient } from "../api";
import { API_ENDPOINTS } from "../api-config";

// ---- Login Request DTO ----
export interface LoginDto {
  email: string;
  password: string;
}

// ---- User Interface ----
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ---- Login Response ----
export interface LoginResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: User;
}

// ---- Refresh Token Response ----
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ✅ Helper: get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// ✅ Helper: set cookie value
const setCookie = (name: string, value: string, expiresAt?: number): void => {
  const expires = expiresAt
    ? `; expires=${new Date(expiresAt * 1000).toUTCString()}`
    : "";
  document.cookie = `${name}=${value}; path=/${expires}; SameSite=Lax`;
};

// ✅ Helper: parse token expiration timestamp
const getTokenExp = (token: string): number | undefined => {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp;
    }
  } catch (error) {
    console.error("Error parsing token expiry for cookie:", error);
  }
  return undefined;
};

// ✅ Helper: decode JWT and check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true; // Invalid token format
    }

    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));

    // Check if 'exp' exists
    if (!payload.exp) {
      return false; // No expiry means token doesn't expire (not recommended but handle it)
    }

    // Compare expiry time with current time
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If decode fails, consider token expired
  }
};

export const authService = {
  // ---- LOGIN ----
  login: async (data: LoginDto, config: any = {}): Promise<any> => {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.login,
      data,
      config
    );

    // ✅ Safe access with optional chaining
    if (response.data?.accessToken) {
      const tokenExp = getTokenExp(response.data.accessToken);
      setCookie("authToken", response.data.accessToken, tokenExp);
      localStorage.setItem("authToken", response.data.accessToken);
    }

    if (response.data?.refreshToken) {
      const refreshExp = getTokenExp(response.data.refreshToken);
      setCookie("refreshToken", response.data.refreshToken, refreshExp);
    }

    if (response.data?.user?.email) {
      localStorage.setItem("userEmail", response.data.user.email);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
    }

    return response;
  },

  // ---- LOGOUT ----
  logout: (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    
    // Clear cookies with path
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // ✅ Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  // ✅ Check authentication with token expiry validation (Synchronous)
  isAuthenticated: (): boolean => {
    try {
      // Check if cookie exists
      const token = getCookie("authToken");

      if (!token) {
        return false;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        // Auto logout if expired
        authService.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },

  // ✅ Alias for backward compatibility (same as isAuthenticated)
  isAuthenticatedSync: (): boolean => {
    return authService.isAuthenticated();
  },

  // ✅ Get token from cookie
  getToken: (): string | null => {
    return getCookie("authToken");
  },

  // ✅ Get token expiry time
  getTokenExpiry: (): Date | null => {
    try {
      const token = getCookie("authToken");
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));

      if (!payload.exp) return null;

      return new Date(payload.exp * 1000); // Convert to milliseconds
    } catch (error) {
      console.error("Error getting token expiry:", error);
      return null;
    }
  },

  // ✅ Check if token will expire soon (within next X minutes)
  isTokenExpiringSoon: (minutesThreshold: number = 5): boolean => {
    try {
      const token = getCookie("authToken");
      if (!token) return false;

      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));

      if (!payload.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;

      return timeUntilExpiry < minutesThreshold * 60;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return false;
    }
  },

  // ✅ REFRESH TOKEN: call /api/Auth/refresh-token
  refreshToken: async (): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  } | null> => {
    try {
      const accessToken = getCookie("authToken");
      const refreshToken = getCookie("refreshToken");

      if (!accessToken || !refreshToken) {
        console.warn("No tokens found for refresh");
        authService.logout();
        return null;
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.refreshToken,
        {
          accessToken,
          refreshToken,
        }
      );

      // ✅ Safe access with optional chaining + null checks
      const newAccessToken = response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;
      const user = response.data?.user;

      // ✅ Check all required fields including user
      if (!newAccessToken || !newRefreshToken || !user) {
        console.error("Invalid refresh token response");
        authService.logout();
        return null;
      }

      // Save new tokens
      const tokenExp = getTokenExp(newAccessToken);
      const refreshExp = getTokenExp(newRefreshToken);
      setCookie("authToken", newAccessToken, tokenExp);
      localStorage.setItem("authToken", newAccessToken);
      setCookie("refreshToken", newRefreshToken, refreshExp);

      // Update user data
      localStorage.setItem("userData", JSON.stringify(user));
      if (user.email) {
        localStorage.setItem("userEmail", user.email);
      }

      console.log("Token refreshed successfully");

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      authService.logout();
      return null;
    }
  },

  // ✅ Ensure token is valid before API call
  ensureValidToken: async (): Promise<string | null> => {
    const token = getCookie("authToken");
    if (!token) {
      return null;
    }

    // If token is expired, logout immediately
    if (isTokenExpired(token)) {
      console.log("Token expired, logging out...");
      authService.logout();
      return null;
    }

    return token;
  },

  // ✅ CHANGE PASSWORD: /api/Auth/change-password
  changePassword: async (
    data: ChangePasswordDto
  ): Promise<{ success: boolean; message: string }> => {
    const token = getCookie("authToken");

    if (!token) {
      return {
        success: false,
        message: "You are not authenticated. Please login again.",
      };
    }

    const response = await apiClient.post(
      API_ENDPOINTS.changePassword, // api-config me key add hona chahiye
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const message =
      (response.data as any)?.message || "Password changed successfully.";

    return {
      success: true,
      message,
    };
  },
};
