'use client';

import { useGetCartWithItems, useUpdateCartItem, useRemoveCartItem, useUpdateCartNotes } from '@/hooks/useCart';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { data: cartData, isLoading } = useGetCartWithItems();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const updateNotes = useUpdateCartNotes();

  const cart = cartData?.data?.cart;
  const items = cartData?.data?.items || [];

  const [notes, setNotes] = useState('');
  const [notesTimeout, setNotesTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize notes from cart
  useEffect(() => {
    if (cart?.notes) {
      setNotes(cart.notes);
    }
  }, [cart?.notes]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (notesTimeout) {
      clearTimeout(notesTimeout);
    }

    if (cart && notes !== cart.notes) {
      const timeout = setTimeout(() => {
        updateNotes.mutate({ cartId: cart.cartId, notes });
      }, 1000);
      setNotesTimeout(timeout);
    }

    return () => {
      if (notesTimeout) {
        clearTimeout(notesTimeout);
      }
    };
  }, [notes]);

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const handleUpdateQuantity = (productId: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else if (cart) {
      updateItem.mutate({ cartId: cart.cartId, productId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (productId: number) => {
    if (cart) {
      removeItem.mutate({ cartId: cart.cartId, productId });
    }
  };

  const handleCheckout = () => {
    router.push('/customer/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <FiShoppingBag size={80} className="text-gray-300 dark:text-neutral-700 mb-6" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Add some products to get started
        </p>
        <Link
          href="/customer/products"
          className="px-6 py-3 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          Browse Products
          <FiArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Shopping Cart
        </h1>

        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-neutral-800">
              {items.map((item) => (
                <div key={item.productId} className="p-4 md:p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-100 dark:bg-neutral-800 rounded overflow-hidden">
                      {item.product.productImage ? (
                        <Image
                          src={item.product.productImage[0].imageURL}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiShoppingBag size={32} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={removeItem.isPending}
                          className="p-2 min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>

                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                        ${item.product.price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                            disabled={updateItem.isPending}
                            className="p-2 min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-neutral-800 rounded border border-gray-300 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 active:scale-95"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus size={18} />
                          </button>
                          <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                            disabled={updateItem.isPending}
                            className="p-2 min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-neutral-800 rounded border border-gray-300 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 active:scale-95"
                            aria-label="Increase quantity"
                          >
                            <FiPlus size={18} />
                          </button>
                        </div>
                        <span className="ml-auto font-bold text-lg text-gray-900 dark:text-white">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
            <label htmlFor="notes" className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Order Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions for your order..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:text-white resize-none"
            />
            {updateNotes.isPending && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Saving...</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order Summary</h2>
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
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 md:py-4 min-h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-98"
            >
              Proceed to Checkout
              <FiArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
