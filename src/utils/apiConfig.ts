/**
 * API Configuration Utility
 * 
 * Centralized configuration for backend API URL.
 * Automatically switches between development and production URLs based on environment.
 */

import { OrderStatus, ProductionGoal } from './supabase/schema';

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

/**
 * Update order status
 * @param orderId - The order ID to update
 * @param newStatus - The new status for the order
 * @param token - Authentication token
 * @returns Promise with the response data
 */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  token: string
): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get active production goals
 * @param token - Authentication token
 * @returns Promise with production goals response
 */
export async function getActiveProductionGoals(token: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/company/production-goals/active`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch production goals: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new production goal
 * @param goal - The production goal object to create
 * @param token - Authentication token
 * @returns Promise with the response data
 */
export async function createProductionGoal(
  goal: Partial<ProductionGoal>,
  token: string
): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/company/production-goals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });

  if (!response.ok) {
    throw new Error(`Failed to create production goal: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing production goal
 * @param productionGoalId - The production goal ID to update
 * @param updatedGoal - The updated production goal data
 * @param token - Authentication token
 * @returns Promise with the response data
 */
export async function updateProductionGoal(
  productionGoalId: number,
  updatedGoal: Partial<ProductionGoal>,
  token: string
): Promise<any> {
  const response = await fetch(
    `${getApiBaseUrl()}/company/production-goals/${productionGoalId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedGoal),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update production goal: ${response.statusText}`);
  }

  return response.json();
}
