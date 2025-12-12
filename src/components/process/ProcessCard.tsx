'use client';

import React from 'react';
import { Process, Material } from '@/utils/supabase/schema';
import { FaBoxOpen, FaCubes, FaTasks } from 'react-icons/fa';

interface ProcessCardProps {
  process: Process;
  onSelect: (process: Process) => void;
}

// Helper function to parse process steps from details string
const parseProcessSteps = (details: string): string[] => {
  if (!details) return [];
  // Split on word boundaries or start of string before number followed by period and space
  const steps = details.split(/(?:^|\s+)(?=\d+\.\s)/).filter((step) => step.trim());
  return steps;
};

const ProcessCard: React.FC<ProcessCardProps> = ({ process, onSelect }) => {
  console.log(process)
  const stepCount = parseProcessSteps(process.details).length;
  const materialCount = process.materials.length;

  return (
    <div
      onClick={() => onSelect(process)}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4">
        <h3 className="text-xl font-bold">{process.name}</h3>
      </div>

      {/* Metadata Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-gray-700">
          <FaBoxOpen className="text-blue-600 text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Products per Batch</p>
            <p className="text-lg font-bold">{process.productsPerBatch}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <FaCubes className="text-green-600 text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Ingredients</p>
            <p className="text-lg font-bold">{materialCount} required</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <FaTasks className="text-purple-600 text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Process Steps</p>
            <p className="text-lg font-bold">{stepCount} steps</p>
          </div>
        </div>
      </div>

      {/* View Details Hint */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-blue-600 font-medium text-center">
          Click to view details →
        </p>
      </div>
    </div>
  );
};

export default ProcessCard;
