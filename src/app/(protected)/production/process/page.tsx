'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { ApiResponse, Process } from '@/utils/supabase/schema';
import ProcessCard from '@/components/process/ProcessCard';
import ProcessDetailModal from '@/components/process/ProcessDetailModal';
import { FaSyncAlt, FaSearch } from 'react-icons/fa';

export default function ProcessPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  // Fetch all processes
  const {
    data: processesResponse,
    isLoading,
    error,
  } = useQuery<ApiResponse<Process[]>>({
    queryKey: ['processes'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${getApiBaseUrl()}/process/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch processes');
      }

      return res.json();
    },
  });

  const processes = processesResponse?.data || [];

  // Filter processes based on search term
  const filteredProcesses = processes.filter((process) =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessSelect = (process: Process) => {
    setSelectedProcess(process);
  };

  const handleCloseModal = () => {
    setSelectedProcess(null);
  };

  const handleBatchComplete = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['processes'] });
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryNeeded'] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading processes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading processes</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FaSyncAlt className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900">Production Processes</h1>
        </div>
        <p className="text-gray-600">
          Select a process to view details and complete a production batch
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Process Grid */}
      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12">
          <FaSyncAlt className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No processes found matching your search' : 'No processes available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map((process) => (
            <ProcessCard
              key={process.processId}
              process={process}
              onSelect={handleProcessSelect}
            />
          ))}
        </div>
      )}

      {/* Process Detail Modal */}
      {selectedProcess && (
        <ProcessDetailModal
          process={selectedProcess}
          onClose={handleCloseModal}
          onComplete={handleBatchComplete}
        />
      )}
    </div>
  );
}
