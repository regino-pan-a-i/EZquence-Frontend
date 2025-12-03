'use client';

import { useGetCartWithItems, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { FiX, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import Image from 'next/image';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { data: cartData, isLoading } = useGetCartWithItems();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const cart = cartData?.data?.cart;
  const items = cartData?.data?.items || [];
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-neutral-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
              aria-label="Close cart"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FiX size={64} className="text-gray-300 dark:text-neutral-700 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-neutral-700 rounded overflow-hidden">
                      {item.product.productImage ? (
                        <Image
                          src={item.product.productImage[0].imageURL}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiX size={32} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${item.product.price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                          disabled={updateItem.isPending}
                          className="p-1.5 min-w-[36px] min-h-[36px] bg-white dark:bg-neutral-700 rounded border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 disabled:opacity-50 active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-10 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                          disabled={updateItem.isPending}
                          className="p-1.5 min-w-[36px] min-h-[36px] bg-white dark:bg-neutral-700 rounded border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 disabled:opacity-50 active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={removeItem.isPending}
                      className="p-2 min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 active:scale-95"
                      aria-label="Remove item"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Total and Checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-neutral-800 p-4 space-y-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/customer/checkout';
                }}
                className="w-full py-3 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors active:scale-98"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
