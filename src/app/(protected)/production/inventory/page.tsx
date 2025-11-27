'use client';

import React from 'react';
import MaterialsInventory from '@/components/inventory/MaterialsInventory';
import { getApiBaseUrl } from '@/utils/apiConfig';
import {
  InventoryResponse,
  InventoryItem,
  InventoryNeed,
  InventoryNeedResponse,
} from '@/utils/supabase/schema';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<InventoryItem[]>([]);
  const [inventoryNeeded, setInventoryNeeded] = useState<InventoryNeed[]>([]);

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

      const res = await fetch(`${getApiBaseUrl()}/inventory`, {
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
      console.log(materialsResponse.data);
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

      const res = await fetch(`${getApiBaseUrl()}/inventory/needs/today`, {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Track and manage your materials inventory</p>
      </div>

      <MaterialsInventory materials={materials || []} inventoryNeeded={inventoryNeeded || []} />
    </div>
  );
}
