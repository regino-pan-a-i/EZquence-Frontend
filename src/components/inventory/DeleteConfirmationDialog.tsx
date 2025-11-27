'use client';

import { useState, useEffect } from 'react';
import { InventoryItem } from '@/utils/supabase/schema';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/utils/apiConfig';

export interface ProcessUsage {
  processId: number;
  processName: string;
  productId: number;
  productName: string;
  quantityNeeded: number;
  units: string;
}

export interface DeleteConfirmationDialogProps {
  material: InventoryItem;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  material,
  onConfirm,
  onCancel,
  className = '',
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [processUsages, setProcessUsages] = useState<ProcessUsage[]>([]);
  const [isLoadingUsages, setIsLoadingUsages] = useState(true);

  useEffect(() => {
    const fetchProcessUsages = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(
          `${getApiBaseUrl()}/inventory/${material.materialId}/processes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setProcessUsages(data.data);
          }
        } else {
          // If endpoint doesn't exist or fails, just continue with empty array
          console.warn('Could not fetch process usages');
        }
      } catch (error) {
        console.error('Error fetching process usages:', error);
      } finally {
        setIsLoadingUsages(false);
      }
    };

    fetchProcessUsages();
  }, [material.materialId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${getApiBaseUrl()}/inventory/${material.materialId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to delete material');

      toast.success('Material deleted successfully!');
      onConfirm();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error(
        `Failed to delete material: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Delete Material</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this material? This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Material Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Material Name</p>
                <p className="text-base font-semibold text-gray-900 mt-1">{material.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Stock</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {material.quantityInStock} {material.units}
                </p>
              </div>
              {material.expirationDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Expiration Date</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {new Date(material.expirationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Process Usage Information */}
          {isLoadingUsages ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">Loading process information...</p>
            </div>
          ) : processUsages.length > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    This material is currently used in {processUsages.length} process
                    {processUsages.length !== 1 ? 'es' : ''}:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {processUsages.map((usage) => (
                      <div
                        key={usage.processId}
                        className="bg-white rounded p-3 border border-yellow-200"
                      >
                        <p className="text-sm font-semibold text-gray-900">{usage.productName}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Process: {usage.processName} • Requires: {usage.quantityNeeded}{' '}
                          {usage.units}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">
                    Deleting this material will unlink it from all associated processes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-green-800">
                  This material is not currently used in any processes.
                </p>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Warning: This action is permanent and cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Material'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
