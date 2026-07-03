// lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.athlits.co.uk';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  errors?: string[]
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    // ✅ Validate and log base URL
    if (!baseURL || baseURL === 'undefined') {
      console.error('❌ Invalid API_BASE_URL:', baseURL);
      baseURL = 'https://api.athlits.co.uk';
    }

    console.log('🔧 API Client initialized with URL:', baseURL);

    this.client = axios.create({
      baseURL,
      timeout: 120000, // 2 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // ✅ FIX: Remove validateStatus - let errors be errors!
      // validateStatus: (status) => status < 500, // ❌ REMOVE THIS!
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // ✅ REQUEST INTERCEPTOR
    this.client.interceptors.request.use(
      (config) => {
        config.maxContentLength = Infinity;
        config.maxBodyLength = Infinity;

        const queryString = config.params
          ? `?${new URLSearchParams(config.params).toString()}`
          : "";

        const fullUrl = `${config.baseURL}${config.url}${queryString}`;

        console.log(
          `🚀 API Request: ${config.method?.toUpperCase()} ${fullUrl}`
        );
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);

        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // ✅ RESPONSE INTERCEPTOR - FIXED!
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config?.url}`);
        return response;
      },

      (error: AxiosError) => {
        console.group('🚨 API ERROR');

        const status = error.response?.status;
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();

        console.log('📍 URL:', `${error.config?.baseURL}${url}`);
        console.log('📍 Method:', method);
        console.log('📍 Code:', error.code);
        console.log('📍 Message:', error.message);

        if (error.response) {
          // ✅ BACKEND ERROR (REAL RESPONSE)
          console.log('📦 Status:', status);
          console.log('📦 Data:', error.response.data);

        } else if (error.request) {
          // ❌ NETWORK ERROR (YOUR CURRENT CASE)
          console.log('❌ NETWORK FAILURE');

          // 🔥 ADD THIS (CRITICAL)
          const payloadSize = error.config?.data
            ? JSON.stringify(error.config.data).length / 1024
            : 0;

          console.log('📦 Payload Size (KB):', payloadSize);

          if (payloadSize > 500) {
            console.warn('⚠️ Payload too large → likely backend drop');
          }

          console.log('Possible Causes:', [
            'Server crash / timeout',
            'Payload too large',
            'CORS issue',
            'Invalid JSON structure'
          ]);

        } else {
          console.log('⚠️ Unknown error:', error.message);
        }

        console.groupEnd();

        // ✅ AUTH HANDLING
        if (status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: any
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`🔄 Making ${method} request to: ${endpoint}`);

      const response = await this.client({
        method,
        url: endpoint,
        data,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        ...options,
      });

      // ✅ Handle API success: false in response body
      if (response.data?.success === false) {
        return {
          error: response.data.message || 'Operation failed',
          status: response.status,
          data: response.data,
          errors: response.data.errors || []
        };
      }

      // ✅ This shouldn't happen now (removed validateStatus)
      // But keep as safety check
      if (response.status >= 400 && response.status < 500) {
        const errorMessage = response.data?.message ||
          response.data?.error ||
          `Request failed with status ${response.status}`;
        console.warn('⚠️ 4xx status code:', errorMessage);
        return {
          error: errorMessage,
          status: response.status,
          data: response.data
        };
      }

      return {
        data: response.data,
        message: 'Request successful',
        status: response.status
      };

    } catch (error: any) {
      // ✅ ENHANCED ERROR HANDLING
      const errorDetails = {
        endpoint: endpoint || 'unknown',
        method: method || 'unknown',
        message: error?.message || 'Unknown error',
        code: error?.code || 'NO_CODE',
        status: error?.response?.status || 'NO_STATUS',
        responseData: error?.response?.data || null
      };

      const status = error?.response?.status;

      if (status === 400 || status === 401 || status === 403 || status === 404) {
        console.warn(`⚠️ Request warning (${status}):`, errorDetails.message, endpoint);
      } else {
        console.error('❌ Request failed:', JSON.stringify(errorDetails, null, 2));
      }

      let errorMessage = 'An unexpected error occurred';

      // ✅ Error Response Scenarios
      if (error?.response) {
        // Server responded with error status
        const errorData = error.response.data;

        errorMessage =
          errorData?.message ||
          errorData?.error ||
          errorData?.errors?.[0] ||
          `HTTP ${error.response.status}: ${error.response.statusText}`;

        switch (error.response.status) {
          case 400:
            errorMessage = errorData?.message || 'Bad request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission.';
            break;
          case 404:
            errorMessage = `Endpoint not found: ${endpoint}`;
            break;
          case 413:
            errorMessage = 'Request too large. Server limit exceeded.';
            break;
          case 500:
            errorMessage = errorData?.message || 'Internal server error. Please try again later.';
            break;
          case 502:
            errorMessage = 'Bad Gateway. Server is temporarily unavailable.';
            break;
          case 503:
            errorMessage = 'Service unavailable. Please try again later.';
            break;
        }

      } else if (error?.request) {

        // ✅ backend plain text response
        if (typeof error?.response?.data === 'string') {
          errorMessage = error.response.data;
        }

        // ✅ backend structured response
        else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        else {
          switch (error.code) {

            case 'ERR_NETWORK':

              // 🔥 If backend status exists
              if (error?.request?.status === 503) {
                errorMessage = 'The service is unavailable.';
              }

              else {
                errorMessage = 'Unable to connect to server.';
              }

              break;

            case 'ERR_FR_MAX_BODY_LENGTH_EXCEEDED':
              errorMessage = 'Request data too large.';
              break;

            case 'ECONNABORTED':
              errorMessage = 'Request timeout.';
              break;

            case 'ECONNREFUSED':
              errorMessage = 'Connection refused.';
              break;

            case 'ENOTFOUND':
              errorMessage = 'Server not found.';
              break;

            default:
              errorMessage = 'No response from server.';
          }
        }

      } else {
        // ✅ Request setup error
        errorMessage = error?.message || 'Failed to setup request';
      }

      return {
        error: errorMessage,
        status,
        data: error?.response?.data
      };
    }
  }

  // ✅ HTTP METHODS - These return wrapped ApiResponse
  async get<T>(endpoint: string, options?: any): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(endpoint: string, body?: unknown, options?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ✅ AUTH TOKEN METHODS
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // ✅ FILE UPLOAD METHODS
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>('POST', endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
  }

  async uploadMultipleFiles<T>(
    endpoint: string,
    files: File[],
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>('POST', endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
  }

  // ✅ CONNECTION TEST
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔍 Testing connection to:', this.client.defaults.baseURL);

      const response = await this.client.get('/health', {
        timeout: 5000
      });

      return {
        success: true,
        message: 'Connection successful',
        details: {
          status: response.status,
          baseURL: this.client.defaults.baseURL
        }
      };
    } catch (error: any) {
      let message = 'Connection failed';
      let details: any = {
        baseURL: this.client.defaults.baseURL,
        code: error.code
      };

      if (error.code === 'ECONNREFUSED') {
        message = 'Server is not running or refusing connections';
        details.suggestion = `Start your backend server at ${this.client.defaults.baseURL}`;
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Network error - Cannot reach server';
        details.suggestion = 'Check:\n1. Backend is running\n2. CORS is enabled\n3. Internet connection\n4. Firewall settings';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Server URL not found';
        details.suggestion = `Verify API_BASE_URL: ${this.client.defaults.baseURL}`;
      } else {
        message = error.message || 'Unknown error';
      }

      console.error('❌ Connection test failed:', message, details);

      return {
        success: false,
        message,
        details
      };
    }
  }

  // ✅ DIRECT ACCESS TO RAW AXIOS INSTANCE
  // Use this when you need direct axios access (like in orderEditService)
  getRawClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiClient };
