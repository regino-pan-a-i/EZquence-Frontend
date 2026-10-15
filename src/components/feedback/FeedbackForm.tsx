'use client';

import { useState } from 'react';
import { FaCommentDots, FaPaperPlane } from 'react-icons/fa';

interface FeedbackFormProps {
  onSubmit: (message: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function FeedbackForm({ onSubmit, isSubmitting = false }: FeedbackFormProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await onSubmit(message);
    setMessage(''); // Clear form after successful submission
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaCommentDots className="text-link text-xl" />
        <h3 className="text-lg font-semibold text-foreground">
          Submit Feedback
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="feedback-message"
            className="block text-sm font-medium text-foreground text-muted mb-2"
          >
            Your Feedback
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            maxLength={1000}
            placeholder="Share your thoughts, suggestions, or concerns..."
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:outline-none bg-surface text-foreground resize-none"
          />
          <p className="text-xs text-muted mt-1">
            {message.length}/1000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed transition font-semibold"
        >
          <FaPaperPlane />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
