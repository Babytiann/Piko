/** Unified API response envelope (mirrors backend). */

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error?: undefined;
}

interface ApiErrorResponse {
  success: false;
  data?: undefined;
  error?: string;
  error_code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
