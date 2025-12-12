'use client';

import React from 'react';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

interface ChecklistItemProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  checked,
  onChange,
  label,
  subtitle,
  disabled = false,
}) => {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
        checked
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center h-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="hidden"
        />
        {checked ? (
          <FaCheckCircle className="text-green-600 text-xl" />
        ) : (
          <FaCircle className="text-gray-300 text-xl" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm font-medium ${
            checked ? 'line-through text-gray-500' : 'text-gray-900'
          }`}
        >
          {label}
        </span>
        {subtitle && (
          <span className="block text-xs text-gray-600 mt-1">{subtitle}</span>
        )}
      </div>
    </label>
  );
};

export default ChecklistItem;
