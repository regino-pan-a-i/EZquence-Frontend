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
      className="bg-surface border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg p-4 mb-4">
        <h3 className="text-xl font-bold">{process.name}</h3>
      </div>

      {/* Metadata Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-foreground">
          <FaBoxOpen className="text-link text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-muted uppercase font-medium">Products per Batch</p>
            <p className="text-lg font-bold">{process.productsPerBatch}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-foreground">
          <FaCubes className="text-green-600 text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-muted uppercase font-medium">Ingredients</p>
            <p className="text-lg font-bold">{materialCount} required</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-foreground">
          <FaTasks className="text-purple-600 text-lg flex-shrink-0" />
          <div>
            <p className="text-xs text-muted uppercase font-medium">Process Steps</p>
            <p className="text-lg font-bold">{stepCount} steps</p>
          </div>
        </div>
      </div>

      {/* View Details Hint */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-link font-medium text-center">
          Click to view details →
        </p>
      </div>
    </div>
  );
};

export default ProcessCard;
