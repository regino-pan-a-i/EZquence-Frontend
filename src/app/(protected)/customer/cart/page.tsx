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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <FiShoppingBag size={80} className="text-muted mb-6" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Your cart is empty</h2>
        <p className="text-muted mb-6 text-center">
          Add some products to get started
        </p>
        <Link
          href="/customer/products"
          className="px-6 py-3 min-h-[48px] bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          Browse Products
          <FiArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          Shopping Cart
        </h1>

        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} className="p-4 md:p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-background bg-surface rounded overflow-hidden">
                      {item.product.productImage ? (
                        <Image
                          src={item.product.productImage[0].imageURL}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <FiShoppingBag size={32} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">
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

                      <p className="text-lg font-semibold text-link mb-3">
                        ${item.product.price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                            disabled={updateItem.isPending}
                            className="p-2 min-w-[44px] min-h-[44px] bg-background bg-surface rounded border border-border hover:bg-border disabled:opacity-50 active:scale-95"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus size={18} />
                          </button>
                          <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                            disabled={updateItem.isPending}
                            className="p-2 min-w-[44px] min-h-[44px] bg-background bg-surface rounded border border-border hover:bg-border disabled:opacity-50 active:scale-95"
                            aria-label="Increase quantity"
                          >
                            <FiPlus size={18} />
                          </button>
                        </div>
                        <span className="ml-auto font-bold text-lg text-foreground">
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
          <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
            <label htmlFor="notes" className="block text-sm font-semibold mb-2 text-foreground">
              Order Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions for your order..."
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-surface text-foreground resize-none"
            />
            {updateNotes.isPending && (
              <p className="text-xs text-muted mt-1">Saving...</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-surface rounded-lg shadow-sm border border-border p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Order Summary</h2>
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
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 md:py-4 min-h-[52px] bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-98"
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
