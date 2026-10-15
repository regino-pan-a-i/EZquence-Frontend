'use client';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';



export default function PaymentSuccessPage() {
  const router = useRouter();
return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-accent/10 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="w-20 h-20 text-green-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Thank You!</h1>
        <p className="text-muted mb-8">
          Your payment has been processed successfully. Your order is confirmed.
        </p>

        <button
          onClick={() => router.push('/customer/orders')}
          className="inline-block w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          View Your Orders
        </button>
      </div>
    </div>
  );
}