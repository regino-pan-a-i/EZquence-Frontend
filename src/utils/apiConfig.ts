/**
 * API Configuration Utility
 * 
 * Centralized configuration for backend API URL.
 * Automatically switches between development and production URLs based on environment.
 */

/**
 * Get the base URL for the backend API
 * @returns The API base URL (without trailing slash)
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Construct a full API URL with the given endpoint
 * @param endpoint - The API endpoint (e.g., '/product' or 'product')
 * @returns The full API URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
