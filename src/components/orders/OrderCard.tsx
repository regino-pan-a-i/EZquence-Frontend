
import { Order, OrderProductList, OrderStatus } from '@/utils/supabase/schema';
import OrderStatusBadge from './OrderStatusBadge';
import { FaCheckCircle, FaTimesCircle, FaCalendar, FaDollarSign, FaBox, FaSpinner } from 'react-icons/fa';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import toast from 'react-hot-toast';

interface OrderCardProps {
  order: Order;
  products: OrderProductList[];
  onViewDetails?: (orderId: number) => void;
  showStatusActions?: boolean;
  className?: string;
}

export default function OrderCard({ order, products, onViewDetails, showStatusActions = false, className = '' }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: number; newStatus: OrderStatus }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${getApiBaseUrl()}/order/${orderId}/status`, {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-order-details'] });
      toast.success('Order status updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    },
  });

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

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (updateStatusMutation.isPending) return;
    
    try {
      updateStatusMutation.mutate({ orderId: order.orderId, newStatus });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  return (
    <div
      className={`bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 py-4 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">Order #{order.orderId}</h3>
            <div className="flex items-center gap-2 mt-1">
              <FaCalendar className="text-link text-sm" />
              <span className="text-link text-sm">{formatDate(order.dateCreated)}</span>
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
              <p className="text-xs text-muted uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(order.orderTotal)}</p>
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
              <p className="text-xs text-muted uppercase tracking-wide">Payment</p>
              <p className={`text-sm font-semibold ${order.paid ? 'text-green-600' : 'text-red-600'}`}>
                {order.paid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Date */}
        <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-link text-sm" />
            <span className="text-sm text-foreground">
              {order.dateDelivered ? (
                <>
                  <span className="font-medium">Delivery Date:</span> {formatDate(order.dateDelivered)}
                </>
              ) : (
                <>
                  <span className="font-medium">Not yet delivered</span> 
                </>
              )}
            </span>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-link hover:text-link transition-colors"
          >
            <FaBox />
            <span>
              {products.length} Product{products.length !== 1 ? 's' : ''}
            </span>
            <span className="text-muted">{isExpanded ? '▼' : '▶'}</span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {products.map((product, index) => (
                <div
                  key={`${product.productId}-${index}`}
                  className="flex justify-between items-center p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{product.productName.name}</p>
                    <p className="text-sm text-muted">Quantity: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted">{formatCurrency(product.unitPrice)} each</p>
                    <p className="font-semibold text-foreground">{formatCurrency(product.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">Notes</p>
          {order.notes && order.notes.trim() !== '' ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">N/A</p>
          )}
        </div>

        {/* Status Action Buttons */}
        {showStatusActions && order.status !== OrderStatus.COMPLETED && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Update Status</p>
            <div className="flex flex-col md:flex-row justify-evenly gap-2">
              
              {order.status != OrderStatus.IN_PROGRESS && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.IN_PROGRESS)}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-accent/30 text-primary-foreground text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {updateStatusMutation.isPending ? <FaSpinner className="animate-spin" /> : null}
                  In Progress
                </button>
              )}
              {order.status != OrderStatus.DELAYED && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.DELAYED)}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {updateStatusMutation.isPending ? <FaSpinner className="animate-spin" /> : null}
                  Delayed
                </button>
              )}
              {order.status != OrderStatus.RECEIVED && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.COMPLETED)}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {updateStatusMutation.isPending ? <FaSpinner className="animate-spin" /> : null}
                  Completed
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section - Optional View Details Button */}
      {onViewDetails && (
        <div className="px-6 py-3 bg-background border-t border-border rounded-b-lg">
          <button
            onClick={() => onViewDetails(order.orderId)}
            className="w-full px-4 py-2 text-sm font-medium text-link hover:text-link hover:bg-accent/10 rounded-md transition-colors duration-200"
          >
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
}
