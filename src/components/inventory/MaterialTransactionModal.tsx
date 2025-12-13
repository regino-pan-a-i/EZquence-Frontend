'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaBoxOpen } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { supabase } from '@/utils/supabase/supabaseClient';
import type { InventoryItem, materialTransaction } from '@/utils/supabase/schema';

interface MaterialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableMaterials: InventoryItem[];
}

export default function MaterialTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  availableMaterials,
}: MaterialTransactionModalProps) {

  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);
  const [isCreatingNewMaterial, setIsCreatingNewMaterial] = useState(false);
  
  const [formData, setFormData] = useState({
    quantity: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    // For new material creation
    newMaterialName: '',
    newMaterialUnits: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMaterialSearchTerm('');
      setSelectedMaterial(null);
      setIsCreatingNewMaterial(false);
      setShowMaterialDropdown(false);
      setFormData({
        quantity: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        newMaterialName: '',
        newMaterialUnits: '',
      });
    }
  }, [isOpen]);

  const getFilteredMaterials = () => {
    if (!materialSearchTerm) return availableMaterials;
    const searchLower = materialSearchTerm.toLowerCase();
    return availableMaterials.filter((mat) =>
      mat.name.toLowerCase().includes(searchLower)
    );
  };

  const handleMaterialSelect = (material: InventoryItem) => {
    setSelectedMaterial(material);
    setMaterialSearchTerm(material.name);
    setIsCreatingNewMaterial(false);
    setShowMaterialDropdown(false);
  };

  const handleCreateNewMaterial = () => {
    setIsCreatingNewMaterial(true);
    setSelectedMaterial(null);
    setFormData({ ...formData, newMaterialName: materialSearchTerm });
    setShowMaterialDropdown(false);
  };

  const validateForm = (): boolean => {
    if (!selectedMaterial && !isCreatingNewMaterial) {
      toast.error('Please select a material or create a new one');
      return false;
    }

    if (isCreatingNewMaterial) {
      if (!formData.newMaterialName.trim()) {
        toast.error('Material name is required');
        return false;
      }
      if (!formData.newMaterialUnits) {
        toast.error('Material units are required');
        return false;
      }
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      toast.error('Please enter a valid cost');
      return false;
    }

    if (!formData.date) {
      toast.error('Please select a date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('Authentication required');
        setIsSaving(false);
        return;
      }

      let materialId: number;

      // Step 1: Create new material if needed
      if (isCreatingNewMaterial) {
        const materialPayload = {
          name: formData.newMaterialName.trim(),
          quantityInStock: parseFloat(formData.quantity),
          units: formData.newMaterialUnits,
          expirationDate: null,
        };

        const materialRes = await fetch(`${getApiBaseUrl()}/inventory/createMaterial`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(materialPayload),
        });

        if (!materialRes.ok) {
          throw new Error('Failed to create material');
        }

        const materialData = await materialRes.json();
        console.log(materialData)
        materialId = materialData.data[0].materialId;
        toast.success('New material created successfully!');
      } else if (selectedMaterial) {
        materialId = selectedMaterial.materialId;
      } else {
        throw new Error('No material selected');
      }

      // Step 2: Create material transaction
      const transactionPayload: Partial<materialTransaction> = {
        materialId,
        quantity: parseFloat(formData.quantity),
        cost: parseFloat(formData.cost),
        dateCreated: new Date(formData.date),
        units: isCreatingNewMaterial ? formData.newMaterialUnits : selectedMaterial!.units,
      };

      const transactionRes = await fetch(`${getApiBaseUrl()}/materialTransaction/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionPayload),
      });

      if (!transactionRes.ok) {
        throw new Error('Failed to record transaction');
      }

      toast.success('Material transaction recorded successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record transaction');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredMaterials = getFilteredMaterials();
  const showCreateOption = materialSearchTerm && 
    !availableMaterials.some(m => m.name.toLowerCase() === materialSearchTerm.toLowerCase());

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Record Material Transaction</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Material Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={materialSearchTerm}
              onChange={(e) => {
                setMaterialSearchTerm(e.target.value);
                setShowMaterialDropdown(true);
                setSelectedMaterial(null);
                setIsCreatingNewMaterial(false);
              }}
              onFocus={() => setShowMaterialDropdown(true)}
              placeholder="Search or create material..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />

            {/* Dropdown */}
            {showMaterialDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredMaterials.length > 0 && (
                  <div>
                    {filteredMaterials.map((mat) => (
                      <div
                        key={mat.materialId}
                        onClick={() => handleMaterialSelect(mat)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-800">{mat.name}</span>
                        <span className="text-sm text-gray-500">{mat.units}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create New Option */}
                {showCreateOption && (
                  <div
                    onClick={handleCreateNewMaterial}
                    className="px-3 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200 flex items-center gap-2 text-green-600"
                  >
                    <FaPlus size={14} />
                    <span className="font-medium">Create new: &quot;{materialSearchTerm}&quot;</span>
                  </div>
                )}

                {filteredMaterials.length === 0 && !showCreateOption && (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No materials found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Material Units (shown only when creating new) */}
          {isCreatingNewMaterial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.newMaterialUnits}
                onChange={(e) => setFormData({ ...formData, newMaterialUnits: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                <option value="">Select unit</option>
                <option value="kilograms">Kilograms (kg)</option>
                <option value="grams">Grams (g)</option>
                <option value="liters">Liters (L)</option>
                <option value="milliliters">Milliliters (mL)</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="pounds">Pounds (lb)</option>
                <option value="ounces">Ounces (oz)</option>
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="Enter quantity purchased"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
