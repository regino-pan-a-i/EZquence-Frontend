
import { Order, OrderProductList } from '@/utils/supabase/schema';
import OrderStatusBadge from './OrderStatusBadge';
import { FaCheckCircle, FaTimesCircle, FaCalendar, FaDollarSign, FaBox } from 'react-icons/fa';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  products: OrderProductList[];
  onViewDetails?: (orderId: number) => void;
  className?: string;
}

export default function OrderCard({ order, products, onViewDetails, className = '' }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Order #{order.orderId}</h3>
            <div className="flex items-center gap-2 mt-1">
              <FaCalendar className="text-blue-200 text-sm" />
              <span className="text-blue-100 text-sm">{formatDate(order.dateCreated)}</span>
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Body Section */}
      <div className="px-6 py-4">
        {/* Order Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaDollarSign className="text-green-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(order.orderTotal)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${order.paid ? 'bg-green-100' : 'bg-red-100'}`}>
              {order.paid ? (
                <FaCheckCircle className="text-green-600 text-lg" />
              ) : (
                <FaTimesCircle className="text-red-600 text-lg" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
              <p className={`text-sm font-semibold ${order.paid ? 'text-green-600' : 'text-red-600'}`}>
                {order.paid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Date */}
        {order.dateDelivered && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-blue-600 text-sm" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Delivery Date:</span> {formatDate(order.dateDelivered)}
              </span>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaBox />
            <span>
              {products.length} Product{products.length !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {products.map((product, index) => (
                <div
                  key={`${product.productId}-${index}`}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.productName.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatCurrency(product.unitPrice)} each</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(product.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        {order.notes && order.notes.trim() !== '' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Footer Section - Optional View Details Button */}
      {onViewDetails && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={() => onViewDetails(order.orderId)}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
          >
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
}
