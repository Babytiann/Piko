/** Unified API response envelope (mirrors backend). */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
