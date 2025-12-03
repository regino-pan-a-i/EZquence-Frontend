'use client';

import { useState } from 'react';
import { useGetCartWithItems, useUpdateCartStatus } from '@/hooks/useCart';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { CartStatus } from '@/utils/supabase/schema';
import { FiCheck, FiPackage, FiCalendar } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cartData, isLoading } = useGetCartWithItems();
  const updateCartStatus = useUpdateCartStatus();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cart = cartData?.data?.cart;
  const items = cartData?.data?.items || [];

  const subtotal = items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleSubmitOrder = async () => {
    if (!cart || items.length === 0) return;
    if (!deliveryDate) {
      setError('Please select a delivery date');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create order from cart
      const orderResponse = await fetch(getApiUrl('/order/createOrder'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart.cartId,
          deliveryDate: deliveryDate,
          notes: cart.notes || '',
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(errorText || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      const orderId = orderResult?.data?.orderId;

      // Update cart status to COMPLETED
      await updateCartStatus.mutateAsync({
        cartId: cart.cartId,
        status: CartStatus.COMPLETED,
      });

      // Redirect to success page with order ID
      router.push(`/customer/orders?success=true&orderId=${orderId}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Get maximum date (90 days from now)
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || items.length === 0) {
    router.push('/customer/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Checkout
        </h1>

        <div className="space-y-6">
          {/* Order Items Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FiPackage size={24} />
              Order Items
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-neutral-800 rounded overflow-hidden">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="text-gray-400" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {item.productName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${item.productPrice.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    ${(item.productPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Date */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
            <label htmlFor="deliveryDate" className="block text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FiCalendar size={24} />
              Delivery Date
            </label>
            <input
              type="date"
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={today}
              max={maxDate}
              className="w-full px-4 py-3 min-h-[52px] border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:text-white text-lg"
              required
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Select your preferred delivery date (within 90 days)
            </p>
          </div>

          {/* Order Notes */}
          {cart.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Order Notes</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{cart.notes}</p>
            </div>
          )}

          {/* Order Total */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order Total</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-neutral-800 pt-2 mt-2">
                <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !deliveryDate}
              className="w-full py-3 md:py-4 min-h-[52px] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-98 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck size={24} />
                  Place Order
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Payment will be processed upon delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
