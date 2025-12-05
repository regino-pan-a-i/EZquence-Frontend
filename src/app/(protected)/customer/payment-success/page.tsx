'use client';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';



export default function PaymentSuccessPage() {
  const router = useRouter();
return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="w-20 h-20 text-green-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-gray-600 mb-8">
          Your payment has been processed successfully. Your order is confirmed.
        </p>

        <button
          onClick={() => router.push('/customer/orders')}
          className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          View Your Orders
        </button>
      </div>
    </div>
  );
}