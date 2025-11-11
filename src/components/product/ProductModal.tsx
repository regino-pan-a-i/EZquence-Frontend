'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ProductResponse, Product, Process, ProcessResponse, material } from '@/utils/supabase/schema'
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';



export interface ProductCardProps {
  productId: number;
  onSave?: (updatedProduct: Product) => void;
  className?: string;
}

const ProductModal: React.FC<ProductCardProps> = ({
  productId,
  onSave,
  className = '',
}) => {

  const [product, setProduct] = useState<Product>();
  const [isEditing, setIsEditing] = useState(false);
  const [process, setProcess] = useState<Process>();

  const { data: prodResponse, isLoading: loadingProducts } = useQuery<ProductResponse>({
    queryKey: ['product', productId],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `http://localhost:8080/product/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) console.log('Failed to fetch orders', res);
      const data = await res.json();
      return data;
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (prodResponse && prodResponse.success === true) {
      setProduct(prodResponse.data);
      setImagePreview(prodResponse.data.productImage[0]?.imageURL || 'https://placehold.co/600x400');

    }
  }, [prodResponse]);

  const { data: processResponse, isLoading: loadingProcess } = useQuery<ProcessResponse>({
    queryKey: ['process', productId],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        `http://localhost:8080/product/${productId}/process`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) console.log('Failed to fetch orders', res);
      const data = await res.json();
      return data;
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (processResponse && processResponse.success === true) {
      setProcess(processResponse.data);
      console.log(processResponse.data);
    }
  }, [processResponse]);

  const [editedProduct, setEditedProduct] = useState<Product | undefined>(product);
  const [editedProcess, setEditedProcess] = useState<Process | undefined>(process);
  const [imagePreview, setImagePreview] = useState<string>('https://placehold.co/600x400');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editedProcess?.details, isEditing]);

  // Function to parse process details into steps
  const parseProcessSteps = (details: string): string[] => {
    if (!details) return [];
    
    // Split by numbered patterns like "1.", "2.", etc.
    const steps = details.split(/(?=\d+\.)/).filter(step => step.trim());
    
    return steps;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct(product);
    setEditedProcess(process);
    setImagePreview(product?.productImage[0]?.imageURL || 'https://placehold.co/600x400');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct(product);
    setEditedProcess(process);
    setImagePreview(product?.productImage[0]?.imageURL || 'https://placehold.co/600x400');
  };

  const handleSave = () => {
    if (onSave && editedProduct) {
      onSave(editedProduct);
    }
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedProduct(prev => prev ? { ...prev, productImage: [{ ...prev.productImage[0], imageURL: value }] } : undefined);
    setImagePreview(value);
  };

  const handleMaterialChange = (index: number, field: keyof material, value: string | number) => {
    if (!editedProcess) return;
    const newMaterials = [...editedProcess.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setEditedProcess({ ...editedProcess, materials: newMaterials });
  };

  const handleAddMaterial = () => {
    if (!editedProcess) return;
    const newMaterial: material = {
      materialId: 0, // Will be assigned by backend
      name: '',
      quantityNeeded: 0,
      units: '',
      materialUnits: '',
      processId: editedProcess.processId,
      quantityinStock: 0,
      expirationDate: new Date(),
      unitsNeeded: '',
    };
    setEditedProcess({
      ...editedProcess,
      materials: [...editedProcess.materials, newMaterial],
    });
  };

  const handleRemoveMaterial = (index: number) => {
    if (!editedProcess) return;
    const newMaterials = editedProcess.materials.filter((_, i) => i !== index);
    setEditedProcess({ ...editedProcess, materials: newMaterials });
  };

  return (
    <div
      className={`bg-white border border-gray-200 h-full p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-auto ${className}`}
    >
      <div className='flex flex-col md:flex-row gap-4 min-h-0'>
        <div className="w-full md:w-1/2 overflow-y-auto">
          {/* Product Image Section */}
          <div className="relative w-full h-64 min-h-[256px] bg-gray-100 overflow-hidden rounded-lg flex-shrink-0">
            {!isEditing ? (
              <Image
                src={imagePreview || 'https://placehold.co/600x400'}
                alt={product?.name || "Product Image"}
                fill
                className="object-cover"
                onError={() => setImagePreview('/placeholder-product.png')}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={imagePreview || 'https://placehold.co/600x400'}
                  alt={editedProduct?.name || "Product Image"}
                  fill
                  className="object-cover opacity-50"
                  onError={() => setImagePreview('/placeholder-product.png')}
                />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <input
                    type="text"
                    value={editedProduct?.productImage[0].imageURL}
                    onChange={handleImageChange}
                    placeholder="Image URL"
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Content Section */}
          <div className="p-4">
            {/* Product Name */}
            <div className="mb-4">
              {!isEditing ? (
                <h2 className="text-2xl font-bold text-gray-900">{product?.name}</h2>
              ) : (
                <input
                  type="text"
                  value={editedProduct?.name}
                  onChange={(e) =>
                    setEditedProduct(prev => prev ? { ...prev, name: e.target.value } : undefined)
                  }
                  placeholder="Product Name"
                  className="w-full text-2xl font-bold px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Product Details */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Details</h3>
              {!isEditing ? (
                <p className="text-gray-600 leading-relaxed">{product?.details}</p>
              ) : (
                <textarea
                  value={editedProduct?.details}
                  onChange={(e) =>
                    setEditedProduct(prev => prev ? { ...prev, details: e.target.value } : undefined)
                  }
                  placeholder="Product details..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              )}
            </div>
          </div>
          {/* Product Materials */}
          <div className="p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Materials Required
            </h3>
            {!process && !editedProcess ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm text-center italic">
                  No process defined - materials information unavailable
                </p>
              </div>
            ) : !isEditing ? (
              <div className="space-y-3">
                {process && process?.materials.map((material, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{material.name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">{material.quantityNeeded}</span>
                      <span>{material.units}</span>
                    </div>
                  </div>
                ))}
                {process && process?.materials.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No materials added yet</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {editedProcess && editedProcess?.materials.map((material, index) => (
                  <div key={index} className="flex gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={material.name}
                      onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                      placeholder="Material name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={material.quantityNeeded}
                      onChange={(e) => handleMaterialChange(index, 'quantityNeeded', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={material.units}
                      onChange={(e) => handleMaterialChange(index, 'units', e.target.value)}
                      placeholder="Units"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveMaterial(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex-shrink-0"
                      title="Remove material"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddMaterial}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-500 hover:text-blue-500 transition-colors duration-200 font-medium"
                >
                  + Add Material
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2 overflow-y-auto">
          <div className="p-4">
            {(process || editedProcess) ? (
              <div>
                {/* Process Name */}
                {!isEditing ? (
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{process?.name}</h3>
                ) : (
                  <input
                    type="text"
                    value={editedProcess?.name}
                    onChange={(e) =>
                      setEditedProcess(prev => prev ? { ...prev, name: e.target.value } : undefined)
                    }
                    placeholder="Process Name"
                    className="w-full text-lg font-semibold px-3 py-2 mb-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                
                {/* Products Per Batch */}
                {!isEditing ? (
                  <p className="font-semibold text-gray-700 leading-relaxed mb-4">
                    Products Per batch: {process?.productsPerBatch}
                  </p>
                ) : (
                  <div className="mb-4 flex items-center gap-2">
                    <label className="font-semibold text-gray-700">Products Per batch:</label>
                    <input
                      type="number"
                      value={editedProcess?.productsPerBatch}
                      onChange={(e) =>
                        setEditedProcess(prev => prev ? { ...prev, productsPerBatch: parseInt(e.target.value) || 0 } : undefined)
                      }
                      placeholder="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                
                {/* Process Steps */}
                <div className="space-y-2 h-fit">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Process Steps:</h4>
                  {!isEditing ? (
                    <>
                      {process && parseProcessSteps(process.details).map((step, index) => (
                        <div key={index} className="pl-2 text-gray-600 leading-relaxed">
                          {step.trim()}
                        </div>
                      ))}
                    </>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={editedProcess?.details}
                      onChange={(e) => {
                        setEditedProcess(prev => prev ? { ...prev, details: e.target.value } : undefined);
                      }}
                      placeholder="Enter process steps (e.g., 1. First step 2. Second step 3. Third step)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm overflow-hidden resize-none"
                      style={{ minHeight: '100px' }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Process Defined</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  This product doesn't have a manufacturing process yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Product
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
