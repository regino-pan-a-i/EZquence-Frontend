'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { Cart, cartItem, CartStatus } from '@/utils/supabase/schema';
import toast from 'react-hot-toast';

// Response types for cart API
interface CartResponse {
  success: boolean;
  data: Cart;
}

interface CartWithItemsResponse {
  success: boolean;
  data: {
    cart: Cart;
    items: Array<cartItem>;
  };
}

interface CartCountResponse {
  success: boolean;
  count: number;
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper to make authenticated API calls
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  return response.json();
}

// Get or create active cart for current user
export function useGetCart() {
  return useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: () => fetchWithAuth(getApiUrl('/cart')),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get cart with all items and product details
export function useGetCartWithItems() {
  return useQuery<CartWithItemsResponse>({
    queryKey: ['cart', 'items'],
    queryFn: () => fetchWithAuth(getApiUrl('/cart/my-cart')),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Get item count in cart
export function useGetCartCount(cartId?: number) {
  return useQuery<CartCountResponse>({
    queryKey: ['cart', cartId, 'count'],
    queryFn: () => fetchWithAuth(getApiUrl(`/cart/${cartId}/count`)),
    enabled: !!cartId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Add item to cart (auto-increments if exists)
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId, quantity = 1 }: { cartId: number; productId: number; quantity?: number }) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}/items`), {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add to cart: ${error.message}`);
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId, quantity }: { cartId: number; productId: number; quantity: number }) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}/items/${productId}`), {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cart: ${error.message}`);
    },
  });
}

// Remove item from cart
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId }: { cartId: number; productId: number }) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}/items/${productId}`), {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
}

// Clear all items from cart
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: number) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}/items`), {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
    onError: (error: Error) => {
      toast.error(`Failed to clear cart: ${error.message}`);
    },
  });
}

// Update cart notes
export function useUpdateCartNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, notes }: { cartId: number; notes: string }) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}`), {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notes: ${error.message}`);
    },
  });
}

// Update cart status
export function useUpdateCartStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, status }: { cartId: number; status: CartStatus }) => {
      return fetchWithAuth(getApiUrl(`/cart/${cartId}/status`), {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cart status: ${error.message}`);
    },
  });
}
