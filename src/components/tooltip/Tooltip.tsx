'use client';

import { useState, ReactNode } from 'react';

type Props = {
  content: string;
  children: ReactNode;
  /** when true, tooltip is enabled; if false it's disabled */
  show?: boolean;
  position?: 'right' | 'top';
};

export default function Tooltip({ content, children, show = true, position = 'right' }: Props) {
  const [visible, setVisible] = useState(false);

  const shouldShow = show && visible;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {shouldShow && (
        <span
          role="tooltip"
          className={`z-50 pointer-events-none absolute whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-md transform transition-opacity duration-150 ${
            position === 'right'
              ? 'left-full ml-2 top-1/2 -translate-y-1/2'
              : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
