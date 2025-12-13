'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaReceipt, FaPlus, FaBoxOpen, FaDollarSign } from 'react-icons/fa';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import DateFilter from '@/components/filters/DateFilter';
import MaterialTransactionModal from '@/components/inventory/MaterialTransactionModal';
import type { ApiResponse, materialTransactionResponse, InventoryResponse } from '@/utils/supabase/schema';
import ScoreCard from '@/components/scorecard/ScoreCard'
export default function MaterialTransactionsPage() {

  // Default to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateRange, setDateRange] = useState({
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch material transactions
  const {
    data: transactionsData,
    isLoading: loadingTransactions,
    refetch: refetchTransactions,
  } = useQuery<ApiResponse<materialTransactionResponse[]>>({
    queryKey: ['materialTransactions', dateRange.start, dateRange.end],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${getApiBaseUrl()}/materialTransaction/dateRange?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }

      return res.json();
    },
  });

  // Fetch available materials for the modal
  const { data: materialsData, isLoading: loadingMaterials } = useQuery<InventoryResponse>({
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
        throw new Error('Failed to fetch materials');
      }

      return res.json();
    },
  });

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleTransactionSuccess = () => {
    refetchTransactions();
  };

  const transactions = transactionsData?.data || [];
  const materials = materialsData?.data || [];

  // Filter transactions by search term
  const filteredTransactions = transactions.filter((txn) =>
    txn.material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary statistics
  const totalTransactions = filteredTransactions.length;
  const totalExpenses = filteredTransactions.reduce((sum, txn) => sum + txn.cost, 0);
  const totalQuantity = filteredTransactions.reduce((sum, txn) => sum + txn.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaReceipt className="text-3xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Material Transactions</h1>
            <p className="text-sm text-gray-600">Track material purchases and inventory costs</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Date Filter */}
      <DateFilter
        type="range"
        label="Filter by Date"
        onDateRangeChange={handleDateRangeChange}
        defaultStartDate={dateRange.start}
        defaultEndDate={dateRange.end}
        defaultPreset="last30days"
      />

      {/* Summary Cards */}
      <div className="w-full mt-6">
        <ScoreCard
            title="Alerts & Notifications"
            data={[
              {
                value: `${totalTransactions}`,
                label: 'Total Transactions',
                color: 'blue',
                icon: <FaReceipt />,
              },
              {
                value: `$ ${totalExpenses.toFixed(2)}`,
                label: 'Total Expenses',
                color: 'blue',
                icon: <FaDollarSign />,
              },
            ]}
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by material name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock After
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingTransactions ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No transactions found for the selected date range
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.materialTransactionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaBoxOpen className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {txn.material.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {txn.quantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.units}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ${txn.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.material.quantityInStock.toFixed(2)} {txn.material.units}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <MaterialTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        availableMaterials={materials}
      />
    </div>
  );
}
