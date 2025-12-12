import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface FeedbackStatusBadgeProps {
  resolved: boolean;
}

export default function FeedbackStatusBadge({ resolved }: FeedbackStatusBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        resolved
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}
    >
      {resolved ? (
        <>
          <FaCheckCircle className="text-sm" />
          Resolved
        </>
      ) : (
        <>
          <FaTimesCircle className="text-sm" />
          Pending
        </>
      )}
    </div>
  );
}
