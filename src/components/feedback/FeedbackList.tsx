'use client';

import { useState, useMemo } from 'react';
import { customerFeedback } from '@/utils/supabase/schema';
import FeedbackCard from './FeedbackCard';
import { FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';

interface FeedbackListProps {
  feedbacks: customerFeedback[];
  isAdmin?: boolean;
  onResolve?: (feedbackId: number) => Promise<void>;
  isResolving?: boolean;
  resolvingId?: number;
}

type SortField = 'dateCreated' | 'resolved';
type SortOrder = 'asc' | 'desc';

export default function FeedbackList({
  feedbacks,
  isAdmin = false,
  onResolve,
  isResolving = false,
  resolvingId,
}: FeedbackListProps) {
  const [sortField, setSortField] = useState<SortField>('dateCreated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'pending'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedAndFilteredFeedbacks = useMemo(() => {
    let filtered = [...feedbacks];

    // Apply filter
    if (filterResolved === 'resolved') {
      filtered = filtered.filter((f) => f.resolved);
    } else if (filterResolved === 'pending') {
      filtered = filtered.filter((f) => !f.resolved);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortField === 'dateCreated') {
        const dateA = new Date(a.dateCreated).getTime();
        const dateB = new Date(b.dateCreated).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by resolved status
        const resolvedA = a.resolved ? 1 : 0;
        const resolvedB = b.resolved ? 1 : 0;
        return sortOrder === 'asc' ? resolvedA - resolvedB : resolvedB - resolvedA;
      }
    });

    return filtered;
  }, [feedbacks, sortField, sortOrder, filterResolved]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </span>
          <button
            onClick={() => handleSort('dateCreated')}
            className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-sm"
          >
            Date {getSortIcon('dateCreated')}
          </button>
          <button
            onClick={() => handleSort('resolved')}
            className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-sm"
          >
            Status {getSortIcon('resolved')}
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500 text-sm" />
          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value as 'all' | 'resolved' | 'pending')}
            className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="all">All Feedback</option>
            <option value="pending">Pending Only</option>
            <option value="resolved">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      {sortedAndFilteredFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {filterResolved === 'all'
              ? 'No feedback yet'
              : filterResolved === 'resolved'
              ? 'No resolved feedback'
              : 'No pending feedback'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAndFilteredFeedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.feedbackId}
              feedback={feedback}
              isAdmin={isAdmin}
              onResolve={onResolve}
              isResolving={isResolving && resolvingId === feedback.feedbackId}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Showing {sortedAndFilteredFeedbacks.length} of {feedbacks.length} feedback
        {feedbacks.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
