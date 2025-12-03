'use client';

import { useGetCart, useGetCartCount } from '@/hooks/useCart';
import { FiShoppingCart } from 'react-icons/fi';
import Link from 'next/link';

export default function CartButton() {
  const { data: cartData } = useGetCart();
  const cartId = cartData?.data?.cartId;
  const { data: countData } = useGetCartCount(cartId);
  const itemCount = countData?.count || 0;

  return (
    <Link 
      href="/customer/cart"
      className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-95"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <FiShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
