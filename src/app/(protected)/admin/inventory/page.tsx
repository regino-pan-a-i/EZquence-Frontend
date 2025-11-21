'use client';

import React from 'react';
import MaterialsInventory from '@/components/inventory/MaterialsInventory';
import MaterialModal from '@/components/inventory/MaterialModal';
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog';
import {
  InventoryResponse,
  InventoryItem,
  InventoryNeed,
  InventoryNeedResponse,
} from '@/utils/supabase/schema';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { FaBoxes } from 'react-icons/fa';


export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [inventoryNeeded, setInventoryNeeded] = useState<InventoryNeed[]>([]);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);

  const {
    data: materialsResponse,
    isLoading: loadingMaterials,
    error: errorMaterials,
  } = useQuery<InventoryResponse>({
    queryKey: ['materials'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`http://localhost:8080/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.log('Failed to fetch materials', res);
        throw new Error('Failed to fetch materials');
      }

      return res.json();
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (materialsResponse && materialsResponse.success === true) {
      setMaterials(materialsResponse.data);
    }
  }, [materialsResponse]);

  const {
    data: inventoryNeededResponse,
    isLoading: loadingInventoryNeeded,
    error: errorInventoryNeeded,
  } = useQuery<InventoryNeedResponse>({
    queryKey: ['inventoryNeeded'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`http://localhost:8080/inventory/needs/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.log('Failed to fetch materials', res);
        throw new Error('Failed to fetch materials');
      }

      return res.json();
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (inventoryNeededResponse && inventoryNeededResponse.success === true) {
      console.log(inventoryNeededResponse.data);
      setInventoryNeeded(inventoryNeededResponse.data);
    }
  }, [inventoryNeededResponse]);

  const handleCreateNew = () => {
    setSelectedMaterial(null);
    setIsMaterialModalOpen(true);
  };

  const handleEdit = (material: InventoryItem) => {
    setSelectedMaterial(material);
    setIsMaterialModalOpen(true);
  };

  const handleDelete = (material: InventoryItem) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsMaterialModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleSaveMaterial = (updatedMaterial: InventoryItem) => {
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    handleCloseModal();
  };

  const handleCreateMaterial = (newMaterial: InventoryItem) => {
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    setIsDeleteDialogOpen(false);
    setSelectedMaterial(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedMaterial(null);
  };

  if (loadingMaterials) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading inventory...</div>
        </div>
      </div>
    );
  }

  if (errorMaterials) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading inventory</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div>
            <div className="flex items-center gap-3">
              <FaBoxes className="text-blue-600 text-3xl" />
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <p className="text-gray-600 mt-2">
              The status is based on the amount of materials in stock compared to the required
              quantity for today's production.
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Material
        </button>
      </div>

      <MaterialsInventory
        materials={materials || []}
        inventoryNeeded={inventoryNeeded || []}
        isAdminView={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Material Modal */}
      {isMaterialModalOpen && (
        <div
          className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <MaterialModal
              materialId={selectedMaterial?.materialId}
              onSave={handleSaveMaterial}
              onCreate={handleCreateMaterial}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedMaterial && (
        <DeleteConfirmationDialog
          material={selectedMaterial}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
