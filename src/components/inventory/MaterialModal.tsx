'use client';

import { useState, useEffect } from 'react';
import { InventoryItem } from '@/utils/supabase/schema';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/utils/apiConfig';

export interface MaterialModalProps {
  materialId?: number | null;
  onSave?: () => void;
  onCreate?: () => void;
  onClose?: () => void;
  className?: string;
}

const MaterialModal: React.FC<MaterialModalProps> = ({
  materialId,
  onSave,
  onCreate,
  onClose,
  className = '',
}) => {
  const isCreating = !materialId || materialId === 0;
  const [material, setMaterial] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(isCreating);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isCreating);

  const [editedMaterial, setEditedMaterial] = useState<Partial<InventoryItem>>({
    name: '',
    quantityInStock: 0,
    units: '',
    expirationDate: null,
  });

  // Fetch material data if editing
  useEffect(() => {
    const fetchMaterial = async () => {
      if (isCreating) {
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${getApiBaseUrl()}/inventory/${materialId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch material');

        const data = await res.json();
        if (data.success) {
          setMaterial(data.data);
          setEditedMaterial(data.data);
        }
      } catch (error) {
        console.error('Error fetching material:', error);
        toast.error('Failed to load material');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId, isCreating]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedMaterial(
      material || {
        name: '',
        quantityInStock: 0,
        units: '',
        expirationDate: null,
      }
    );
  };

  const handleCancel = () => {
    if (isCreating) {
      onClose?.();
    } else {
      setIsEditing(false);
      setEditedMaterial(material || {});
    }
  };

  const validateForm = (): boolean => {
    if (!editedMaterial.name || editedMaterial.name.trim() === '') {
      toast.error('Material name is required');
      return false;
    }

    if (editedMaterial.name.length > 100) {
      toast.error('Material name must be less than 100 characters');
      return false;
    }

    if (editedMaterial.quantityInStock === undefined || editedMaterial.quantityInStock < 0) {
      toast.error('Quantity must be 0 or greater');
      return false;
    }

    if (!editedMaterial.units || editedMaterial.units.trim() === '') {
      toast.error('Units are required');
      return false;
    }

    if (editedMaterial.expirationDate) {
      const expDate = new Date(editedMaterial.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expDate < today) {
        toast.error('Expiration date must be in the future');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        name: editedMaterial.name,
        quantityInStock: editedMaterial.quantityInStock,
        units: editedMaterial.units,
        expirationDate: editedMaterial.expirationDate || null,
      };

      if (isCreating) {
        const res = await fetch(`${getApiBaseUrl()}/inventory/createMaterial`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create material');

        toast.success('Material created successfully!');

        onCreate?.();
        
        onClose?.();
      } else {
        const res = await fetch(`${getApiBaseUrl()}/inventory/${materialId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log(res);

        if (!res.ok) throw new Error('Failed to update material');

        const data = await res.json();
        toast.success('Material updated successfully!');

        onSave?.();
        
        setIsEditing(false);
        setMaterial(data.data);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error(
        `Failed to save material: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 p-6 rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 p-6 rounded-lg shadow-lg ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isCreating ? 'Create New Material' : isEditing ? 'Edit Material' : 'Material Details'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Material Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Material Name <span className="text-red-500">*</span>
          </label>
          {!isEditing ? (
            <p className="text-lg text-gray-900">{material?.name}</p>
          ) : (
            <input
              type="text"
              value={editedMaterial.name || ''}
              onChange={(e) => setEditedMaterial({ ...editedMaterial, name: e.target.value })}
              placeholder="Enter material name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
          )}
        </div>

        {/* Quantity in Stock */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity in Stock <span className="text-red-500">*</span>
          </label>
          {!isEditing ? (
            <p className="text-lg text-gray-900">
              {material?.quantityInStock} {material?.units}
            </p>
          ) : (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editedMaterial.quantityInStock || 0}
              onChange={(e) =>
                setEditedMaterial({
                  ...editedMaterial,
                  quantityInStock: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Units */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Units <span className="text-red-500">*</span>
          </label>
          {!isEditing ? (
            <p className="text-lg text-gray-900">{material?.units}</p>
          ) : (
            <select
              value={editedMaterial.units || ''}
              onChange={(e) => setEditedMaterial({ ...editedMaterial, units: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select unit</option>
              <option value="kilograms">Kilograms (kg)</option>
              <option value="grams">Grams (g)</option>
              <option value="pounds">Pounds (lbs)</option>
              <option value="ounces">Ounces (oz)</option>
              <option value="liters">Liters (L)</option>
              <option value="milliliters">Milliliters (mL)</option>
              <option value="gallons">Gallons (gal)</option>
              <option value="units">Units</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="boxes">Boxes</option>
            </select>
          )}
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Expiration Date (Optional)
          </label>
          {!isEditing ? (
            <p className="text-lg text-gray-900">{formatDate(material?.expirationDate || null)}</p>
          ) : (
            <input
              type="date"
              value={
                editedMaterial.expirationDate
                  ? new Date(editedMaterial.expirationDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setEditedMaterial({
                  ...editedMaterial,
                  expirationDate: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {!isEditing ? (
          <>
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Material
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
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
                  {isCreating ? 'Creating...' : 'Saving...'}
                </>
              ) : isCreating ? (
                'Create Material'
              ) : (
                'Save Changes'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialModal;
