import { OrderStatus } from '@/utils/supabase/schema';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.PAID:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.IN_PROGRESS:
      case OrderStatus.STARTED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.DELAYED:
        return 'bg-red-100 text-red-800 border-red-200';
      case OrderStatus.RECEIVED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
        status
      )} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
