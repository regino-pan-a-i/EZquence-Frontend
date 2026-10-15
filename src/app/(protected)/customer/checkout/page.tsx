'use client';

import { useState } from 'react';
import { useGetCartWithItems, useUpdateCartStatus } from '@/hooks/useCart';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiUrl } from '@/utils/apiConfig';
import { CartStatus } from '@/utils/supabase/schema';
import { FiCheck, FiPackage, FiCalendar } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentCard from "@/components/payment/PaymentCard"

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cartData, isLoading } = useGetCartWithItems();
  const updateCartStatus = useUpdateCartStatus();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cart = cartData?.data?.cart;
  const items = cartData?.data?.items || [];

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const submitOrder = async () => {
    if (!cart || items.length === 0) return;
    if (!deliveryDate) {
      setError('Please select a delivery date');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }
      // Create order from cart
      const orderResponse = await fetch(getApiUrl('/order/createOrder'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  const convertToSubcurrency = (amount: number) => Math.round(amount * 100);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Get maximum date (90 days from now)
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!cart || items.length === 0) {
    router.push('/customer/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          Checkout
        </h1>

        <div className="space-y-6">
          {/* Order Items Summary */}
          <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
              <FiPackage size={24} />
              Order Items
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-background bg-surface rounded overflow-hidden">
                    {item.product.productImage ? (
                      <Image
                        src={item.product.productImage[0].imageURL}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="text-muted" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted">
                      ${item.product.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-foreground">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Date */}
          <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
            <label htmlFor="deliveryDate" className="block text-lg font-bold mb-4 text-foreground flex items-center gap-2">
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
              className="w-full px-4 py-3 min-h-[52px] border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-surface text-foreground text-lg"
              required
            />
            <p className="text-sm text-muted mt-2">
              Select your preferred delivery date (within 7 days)
            </p>
          </div>

          {/* Order Notes */}
          {cart.notes && (
            <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
              <h3 className="text-lg font-bold mb-2 text-foreground">Order Notes</h3>
              <p className="text-muted whitespace-pre-wrap">{cart.notes}</p>
            </div>
          )}

          {/* Order Total */}
          <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Order Total</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-2xl font-bold text-foreground">
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

            <Elements
              stripe={stripePromise}
              options={{
                mode: "payment",
                amount: convertToSubcurrency(total),
                currency: "usd",
              }}
            >
              <PaymentCard amount={total} placeOrder={submitOrder} />
            </Elements>



          </div>
        </div>
      </div>
    </div>
  );
}
