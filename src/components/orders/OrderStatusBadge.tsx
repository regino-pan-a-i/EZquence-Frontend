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
        return 'bg-accent/10 text-link border-accent/30';
      case OrderStatus.IN_PROGRESS:
      case OrderStatus.STARTED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.DELAYED:
        return 'bg-red-100 text-red-800 border-red-200';
      case OrderStatus.RECEIVED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-background text-foreground border-border';
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
