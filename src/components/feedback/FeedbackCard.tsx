import { customerFeedback } from '@/utils/supabase/schema';
import FeedbackStatusBadge from './FeedbackStatusBadge';
import { FaCommentDots, FaCheck } from 'react-icons/fa';

interface FeedbackCardProps {
  feedback: customerFeedback;
  isAdmin?: boolean;
  onResolve?: (feedbackId: number) => void;
  isResolving?: boolean;
}

export default function FeedbackCard({
  feedback,
  isAdmin = false,
  onResolve,
  isResolving = false,
}: FeedbackCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaCommentDots className="text-blue-600 text-lg" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(feedback.dateCreated)}
          </span>
        </div>
        <FeedbackStatusBadge resolved={feedback.resolved} />
      </div>

      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {feedback.message}
      </p>

      {isAdmin && !feedback.resolved && onResolve && (
        <div className="flex justify-end">
          <button
            onClick={() => onResolve(feedback.feedbackId)}
            disabled={isResolving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-semibold"
          >
            <FaCheck />
            {isResolving ? 'Resolving...' : 'Mark as Resolved'}
          </button>
        </div>
      )}
    </div>
  );
}
