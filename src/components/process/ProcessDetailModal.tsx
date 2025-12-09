'use client';

import React, { useState } from 'react';
import { Process } from '@/utils/supabase/schema';
import ChecklistItem from './ChecklistItem';
import { FaTimes, FaBoxOpen, FaCubes, FaTasks, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import toast from 'react-hot-toast';

interface ProcessDetailModalProps {
  process: Process;
  onClose: () => void;
  onComplete?: () => void;
}

// Helper function to parse process steps from details string
const parseProcessSteps = (details: string): string[] => {
  if (!details) return [];
  // Split on word boundaries or start of string before number followed by period and space
  const steps = details.split(/(?:^|\s+)(?=\d+\.\s)/).filter((step) => step.trim());
  return steps;
};

const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  process,
  onClose,
  onComplete,
}) => {
  const steps = parseProcessSteps(process.details);
  
  // Initialize checklist states
  const [checkedMaterials, setCheckedMaterials] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if all items are checked
  const allMaterialsChecked = process.materials.every(
    (_, index) => checkedMaterials[index]
  );
  const allStepsChecked = steps.every((_, index) => checkedSteps[index]);
  const allItemsChecked = allMaterialsChecked && allStepsChecked;

  const handleMaterialCheck = (index: number, checked: boolean) => {
    setCheckedMaterials((prev) => ({ ...prev, [index]: checked }));
  };

  const handleStepCheck = (index: number, checked: boolean) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: checked }));
  };

  const handleCompleteBatch = async () => {
    if (!allItemsChecked) {
      toast.error('Please check all ingredients and steps before completing the batch.');
      return;
    }

    setIsCompleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${getApiBaseUrl()}/inventory/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ processId: process.processId }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete batch');
      }

      toast.success('Batch completed successfully!');
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Error completing batch:', error);
      toast.error('Failed to complete batch. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const materialProgress = process.materials.filter((_, i) => checkedMaterials[i]).length;
  const stepProgress = steps.filter((_, i) => checkedSteps[i]).length;

  return (
    <div
      className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{process.name}</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FaBoxOpen />
                  <span>{process.productsPerBatch} products per batch</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Ingredients Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaCubes className="text-green-600 text-2xl" />
                <h3 className="text-xl font-bold text-gray-900">Ingredients</h3>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {materialProgress} / {process.materials.length} checked
              </span>
            </div>
            <div className="space-y-2">
              {process.materials.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No ingredients required</p>
              ) : (
                process.materials.map((material, index) => (
                  <ChecklistItem
                    key={index}
                    checked={checkedMaterials[index] || false}
                    onChange={(checked) => handleMaterialCheck(index, checked)}
                    label={material.name}
                    subtitle={`${material.quantityNeeded} ${material.units}`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Process Steps Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaTasks className="text-purple-600 text-2xl" />
                <h3 className="text-xl font-bold text-gray-900">Process Steps</h3>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {stepProgress} / {steps.length} checked
              </span>
            </div>
            <div className="space-y-2">
              {steps.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No steps defined</p>
              ) : (
                steps.map((step, index) => (
                  <ChecklistItem
                    key={index}
                    checked={checkedSteps[index] || false}
                    onChange={(checked) => handleStepCheck(index, checked)}
                    label={step.trim()}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteBatch}
              disabled={!allItemsChecked || isCompleting}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                allItemsChecked && !isCompleting
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaCheckCircle />
              {isCompleting ? 'Completing...' : 'Complete Batch'}
            </button>
          </div>
          {!allItemsChecked && (
            <p className="text-sm text-amber-600 mt-3 text-center">
              Please check all ingredients and steps to complete the batch
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessDetailModal;
