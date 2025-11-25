'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import {
  ProductionGoal,
  ProductionGoalsResponse,
  ProductListResponse,
} from '@/utils/supabase/schema';
import { getActiveProductionGoals, updateProductionGoal, createProductionGoal, getApiBaseUrl } from '@/utils/apiConfig';
import { FaBullseye, FaEdit, FaSave, FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface EditingGoal {
  productionGoalId: number;
  step: 'update-end-date' | 'create-new';
  newEndDate?: string;
  newGoalValue?: number;
  newEffectiveDate?: string;
  newGoalEndDate?: string;
}

export default function ProductionGoalsManager() {
  const queryClient = useQueryClient();
  const [editingGoal, setEditingGoal] = useState<EditingGoal | null>(null);
  const [creatingGoalForProduct, setCreatingGoalForProduct] = useState<number | null>(null);
  const [newGoalForm, setNewGoalForm] = useState({
    goalValue: 0,
    effectiveDate: '',
    endDate: '',
  });

  // Fetch active production goals
  const { data: productionGoalsResponse, isLoading: loadingGoals } = useQuery<ProductionGoalsResponse>({
    queryKey: ['production-goals-active'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      return getActiveProductionGoals(token!);
    },
  });

  // Fetch products
  const { data: productsResponse } = useQuery<ProductListResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${getApiBaseUrl()}/product`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Mutation for updating production goal (end date)
  const updateGoalMutation = useMutation({
    mutationFn: async ({ productionGoalId, updatedGoal }: { productionGoalId: number; updatedGoal: Partial<ProductionGoal> }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      return updateProductionGoal(productionGoalId, updatedGoal, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-goals-active'] });
      toast.success('Production goal updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update production goal:', error);
      toast.error('Failed to update production goal');
    },
  });

  // Mutation for creating new production goal
  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: Partial<ProductionGoal>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      return createProductionGoal(newGoal, token!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-goals-active'] });
      toast.success('New production goal created successfully!');
      setEditingGoal(null);
      setCreatingGoalForProduct(null);
      setNewGoalForm({ goalValue: 0, effectiveDate: '', endDate: '' });
    },
    onError: (error) => {
      console.error('Failed to create production goal:', error);
      toast.error('Failed to create production goal');
    },
  });

  const handleStartEdit = (goal: ProductionGoal) => {
    const today = new Date().toISOString().split('T')[0];
    setEditingGoal({
      productionGoalId: goal.productionGoalId,
      step: 'update-end-date',
      newEndDate: today,
    });
  };

  const handleUpdateEndDate = async () => {
    if (!editingGoal || !editingGoal.newEndDate) return;

    await updateGoalMutation.mutateAsync({
      productionGoalId: editingGoal.productionGoalId,
      updatedGoal: { endDate: new Date(editingGoal.newEndDate) },
    });

    // Move to create new goal step
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setEditingGoal({
      ...editingGoal,
      step: 'create-new',
      newEffectiveDate: tomorrowStr,
      newGoalValue: 0,
      newGoalEndDate: '',
    });
  };

  const handleCreateNewGoal = async () => {
    if (!editingGoal || editingGoal.step !== 'create-new') return;

    const currentGoal = productionGoalsResponse?.data.find(
      (g) => g.productionGoalId === editingGoal.productionGoalId
    );
    if (!currentGoal) return;

    await createGoalMutation.mutateAsync({
      productId: currentGoal.productId,
      companyId: currentGoal.companyId,
      goalValue: editingGoal.newGoalValue || 0,
      effectiveDate: new Date(editingGoal.newEffectiveDate!),
      endDate: new Date(editingGoal.newGoalEndDate!),
      dateCreated: new Date(),
    });
  };

  const handleCreateInitialGoal = async (productId: number) => {
    if (!productsResponse?.data) return;

    const product = productsResponse.data.find((p) => p.productId === productId);
    if (!product) return;

    await createGoalMutation.mutateAsync({
      productId: product.productId,
      companyId: product.companyId,
      goalValue: newGoalForm.goalValue,
      effectiveDate: new Date(newGoalForm.effectiveDate),
      endDate: new Date(newGoalForm.endDate),
      dateCreated: new Date(),
    });
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setCreatingGoalForProduct(null);
    setNewGoalForm({ goalValue: 0, effectiveDate: '', endDate: '' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get products without active goals
  const productsWithoutGoals = productsResponse?.data.filter(
    (product) => !productionGoalsResponse?.data.some((goal) => goal.productId === product.productId)
  ) || [];

  if (loadingGoals) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaSpinner className="animate-spin text-blue-600 text-xl" />
          <h2 className="text-xl font-bold text-gray-900">Loading Production Goals...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <FaBullseye className="text-blue-600 text-2xl" />
        <h2 className="text-2xl font-bold text-gray-900">Production Goals Management</h2>
      </div>

      {/* Active Goals */}
      {productionGoalsResponse?.data && productionGoalsResponse.data.length > 0 && (
        <div className="space-y-4 mb-6">
          {productionGoalsResponse.data.map((goal) => {
            const product = productsResponse?.data.find((p) => p.productId === goal.productId);
            const isEditing = editingGoal?.productionGoalId === goal.productionGoalId;

            return (
              <div key={goal.productionGoalId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product?.name || `Product ${goal.productId}`}
                    </h3>
                    <p className="text-sm text-gray-500">Goal ID: {goal.productionGoalId}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(goal)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <FaEdit />
                      Edit Goal
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Daily Goal</p>
                      <p className="text-xl font-bold text-blue-600">{goal.goalValue} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Effective Date</p>
                      <p className="text-sm text-gray-700">{formatDate(goal.effectiveDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-sm text-gray-700">{formatDate(goal.endDate)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editingGoal.step === 'update-end-date' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-3">
                          Step 1: Update the end date of the current goal
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              New End Date
                            </label>
                            <input
                              type="date"
                              value={editingGoal.newEndDate}
                              onChange={(e) =>
                                setEditingGoal({ ...editingGoal, newEndDate: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={handleUpdateEndDate}
                            disabled={updateGoalMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            {updateGoalMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Update & Continue
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {editingGoal.step === 'create-new' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800 mb-3">
                          Step 2: Create a new production goal
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Goal Value (units/day)
                            </label>
                            <input
                              type="number"
                              value={editingGoal.newGoalValue}
                              onChange={(e) =>
                                setEditingGoal({
                                  ...editingGoal,
                                  newGoalValue: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Effective Date
                            </label>
                            <input
                              type="date"
                              value={editingGoal.newEffectiveDate}
                              onChange={(e) =>
                                setEditingGoal({ ...editingGoal, newEffectiveDate: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={editingGoal.newGoalEndDate}
                              onChange={(e) =>
                                setEditingGoal({ ...editingGoal, newGoalEndDate: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateNewGoal}
                            disabled={createGoalMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            {createGoalMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Create Goal
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Products without goals */}
      {productsWithoutGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Products Without Goals</h3>
          <div className="space-y-3">
            {productsWithoutGoals.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">{product.name}</h4>
                  {creatingGoalForProduct !== product.productId ? (
                    <button
                      onClick={() => setCreatingGoalForProduct(product.productId)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <FaPlus />
                      Create Goal
                    </button>
                  ) : (
                    <button
                      onClick={() => setCreatingGoalForProduct(null)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  )}
                </div>

                {creatingGoalForProduct === product.productId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Goal Value (units/day)
                        </label>
                        <input
                          type="number"
                          value={newGoalForm.goalValue}
                          onChange={(e) =>
                            setNewGoalForm({ ...newGoalForm, goalValue: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Effective Date
                        </label>
                        <input
                          type="date"
                          value={newGoalForm.effectiveDate}
                          onChange={(e) =>
                            setNewGoalForm({ ...newGoalForm, effectiveDate: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newGoalForm.endDate}
                          onChange={(e) => setNewGoalForm({ ...newGoalForm, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateInitialGoal(product.productId)}
                      disabled={createGoalMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {createGoalMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      Create Goal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!productionGoalsResponse?.data?.length && !productsWithoutGoals.length && (
        <div className="text-center py-8 text-gray-500">
          <FaBullseye className="mx-auto text-4xl mb-2" />
          <p>No products available to set goals</p>
        </div>
      )}
    </div>
  );
}
