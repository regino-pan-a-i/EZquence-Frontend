'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ProductResponse,
  Product,
  Process,
  ProcessResponse,
  Material,
  InventoryItem,
  InventoryResponse,
} from '@/utils/supabase/schema';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabaseClient';
import toast from 'react-hot-toast';

export interface ProductCardProps {
  productId?: number | null;
  onSave?: (updatedProduct: Product) => void;
  onCreate?: (newProduct: Product) => void;
  className?: string;
}

const ProductModal: React.FC<ProductCardProps> = ({
  productId,
  onSave,
  onCreate,
  className = '',
}) => {
  const isCreating = !productId || productId === 0;
  const [product, setProduct] = useState<Product>();
  const [isEditing, setIsEditing] = useState(isCreating);
  const [process, setProcess] = useState<Process>();
  const [isSaving, setIsSaving] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<InventoryItem[]>([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState<string>('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState<number | null>(null);

  const { data: prodResponse, isLoading: loadingProducts } = useQuery<ProductResponse>({
    queryKey: ['product', productId],
    queryFn: async () => {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`http://localhost:8080/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) console.log('Failed to fetch orders', res);
      const data = await res.json();
      return data;
    },
    enabled: !isCreating,
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (prodResponse && prodResponse.success === true) {
      setProduct(prodResponse.data);
      setImagePreview(
        prodResponse.data.productImage[0]?.imageURL || 'https://placehold.co/600x400'
      );
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
      const res = await fetch(`http://localhost:8080/product/${productId}/process`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) console.log('Failed to fetch orders', res);
      const data = await res.json();
      return data;
    },
    enabled: !isCreating,
  });

  // Fetch available materials for autocomplete
  const { data: materialsResponse } = useQuery<InventoryResponse>({
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
      if (!res.ok) throw new Error('Failed to fetch materials');
      return res.json();
    },
  });

  // Use useEffect to set products when data is fetched
  useEffect(() => {
    if (processResponse && processResponse.success === true) {
      setProcess(processResponse.data);
      console.log(processResponse.data);
    }
  }, [processResponse]);

  // Initialize empty product and process for creation mode
  useEffect(() => {
    if (isCreating) {
      const emptyProduct: Product = {
        productId: 0,
        name: '',
        price: 0,
        details: '',
        companyId: 0,
        productImage: [{ productId: 0, imageURL: 'https://placehold.co/600x400' }],
      };
      const emptyProcess: Process = {
        processId: 0,
        name: '',
        details: '',
        productId: 0,
        productsPerBatch: 1,
        materials: [],
      };
      setProduct(emptyProduct);
      setProcess(emptyProcess);
      setEditedProduct(emptyProduct);
      setEditedProcess(emptyProcess);
    }
  }, [isCreating]);

  // Update available materials list
  useEffect(() => {
    if (materialsResponse && materialsResponse.success === true) {
      setAvailableMaterials(materialsResponse.data);
    }
  }, [materialsResponse]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMaterialDropdown !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowMaterialDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMaterialDropdown]);

  // Function to parse process details into steps
  const parseProcessSteps = (details: string): string[] => {
    if (!details) return [];

    // Split by numbered patterns like "1.", "2.", etc.
    const steps = details.split(/(?=\d+\.)/).filter((step) => step.trim());

    return steps;
  };

  // Function to diff materials and identify changes
  const diffMaterials = (original: Material[], edited: Material[]) => {
    const added = edited.filter(
      (em) => em.materialId === 0 || !original.some((om) => om.materialId === em.materialId)
    );

    const removed = original.filter((om) => !edited.some((em) => em.materialId === om.materialId));

    const modified = edited.filter((em) => {
      if (em.materialId === 0) return false; // Skip new materials
      const originalMaterial = original.find((om) => om.materialId === em.materialId);
      return (
        originalMaterial &&
        (originalMaterial.quantityNeeded !== em.quantityNeeded ||
          originalMaterial.units !== em.units)
      );
    });

    return { added, removed, modified };
  };

  // Helper function to filter out empty/incomplete materials
  const filterValidMaterials = (materials: Material[]): Material[] => {
    return materials.filter(
      (material) =>
        material.name.trim() !== '' && material.quantityNeeded > 0 && material.units.trim() !== ''
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct(product);

    // Initialize empty process if it doesn't exist
    if (!process) {
      const emptyProcess: Process = {
        processId: 0,
        name: '',
        details: '',
        productId: productId || 0,
        productsPerBatch: 1,
        materials: [],
      };
      setEditedProcess(emptyProcess);
    } else {
      setEditedProcess(process);
    }

    setImagePreview(product?.productImage[0]?.imageURL || 'https://placehold.co/600x400');
  };

  const handleCancel = () => {
    if (isCreating) {
      // For creation mode, just close without saving
      setIsEditing(false);
    } else {
      // For edit mode, revert to original values
      setIsEditing(false);
      setEditedProduct(product);
      setEditedProcess(process);
      setImagePreview(product?.productImage[0]?.imageURL || 'https://placehold.co/600x400');
    }
  };

  const handleSave = async () => {
    if (!editedProduct) return;

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (isCreating) {
        // Step 1: Create Product
        const productPayload = {
          name: editedProduct.name,
          price: editedProduct.price,
          details: editedProduct.details,
          imageURL: editedProduct.productImage[0]?.imageURL || 'https://placehold.co/600x400',
        };

        const productRes = await fetch('http://localhost:8080/product', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productPayload),
        });

        if (!productRes.ok) throw new Error('Failed to create product');
        const productData = await productRes.json();
        const newProductId = productData.data.productId;

        // Step 2: Create Process (if defined)
        if (editedProcess && editedProcess.name) {
          const processPayload = {
            name: editedProcess.name,
            details: editedProcess.details,
            productId: newProductId,
            productsPerBatch: editedProcess.productsPerBatch,
          };

          const processRes = await fetch(`http://localhost:8080/product/${newProductId}/process`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processPayload),
          });

          if (!processRes.ok) throw new Error('Failed to create process');
          const processData = await processRes.json();
          const newProcessId = processData.data.processId;

          // Step 3: Create new materials and link them to process
          const validMaterials = filterValidMaterials(editedProcess.materials || []);
          if (validMaterials.length > 0) {
            for (const material of validMaterials) {
              let materialId = material.materialId;

              // Check if material is new (materialId === 0 or doesn't exist in inventory)
              const existingMaterial = availableMaterials.find(
                (m) =>
                  m.name.toLowerCase() === material.name.toLowerCase() && m.units === material.units
              );

              if (!existingMaterial && material.name) {
                // Create new material
                const materialPayload = {
                  name: material.name,
                  quantityInStock: 0,
                  units: material.units,
                  expirationDate: null,
                };

                const materialRes = await fetch('http://localhost:8080/inventory', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(materialPayload),
                });

                if (!materialRes.ok) throw new Error(`Failed to create material: ${material.name}`);
                const materialData = await materialRes.json();
                materialId = materialData.data.materialId;
              } else if (existingMaterial) {
                materialId = existingMaterial.materialId;
              }

              // Step 4: Link material to process
              if (materialId) {
                const linkPayload = {
                  materialId: materialId,
                  processId: newProcessId,
                  quantityNeeded: material.quantityNeeded,
                  units: material.units,
                };

                const linkRes = await fetch(
                  `http://localhost:8080/process/${newProcessId}/materials`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(linkPayload),
                  }
                );

                if (!linkRes.ok)
                  console.warn(`Failed to link material ${material.name} to process`);
              }
            }
          }
        }

        toast.success('Product created successfully!');

        if (onCreate) {
          onCreate({ ...editedProduct, productId: newProductId });
        }
      } else {
        // Update existing product
        const productPayload = {
          name: editedProduct.name,
          price: editedProduct.price,
          details: editedProduct.details,
          imageURL: editedProduct.productImage[0]?.imageURL || 'https://placehold.co/600x400',
        };

        const productRes = await fetch(`http://localhost:8080/product/${productId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productPayload),
        });

        if (!productRes.ok) throw new Error('Failed to update product');

        // Update process if it exists
        if (editedProcess && process) {
          const processPayload = {
            name: editedProcess.name,
            details: editedProcess.details,
            productsPerBatch: editedProcess.productsPerBatch,
          };

          const processRes = await fetch(
            `http://localhost:8080/product/${productId}/updateProcess`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(processPayload),
            }
          );

          if (!processRes.ok) throw new Error('Failed to update process');

          // Sync materials after process update
          const originalMaterials = process.materials || [];
          const editedMaterials = filterValidMaterials(editedProcess.materials || []);
          const { added, removed, modified } = diffMaterials(originalMaterials, editedMaterials);

          const materialErrors: string[] = [];

          // Remove materials
          for (const material of removed) {
            try {
              const deleteRes = await fetch(
                `http://localhost:8080/process/${process.processId}/materials/${material.materialId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              if (!deleteRes.ok) {
                materialErrors.push(`Failed to remove material: ${material.name}`);
              }
            } catch (error) {
              materialErrors.push(
                `Error removing material ${material.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }

          // Add new materials
          for (const material of added) {
            try {
              let materialId = material.materialId;

              // Check if material exists in inventory
              const existingMaterial = availableMaterials.find(
                (m) =>
                  m.name.toLowerCase() === material.name.toLowerCase() && m.units === material.units
              );

              if (!existingMaterial && material.name) {
                // Create new material in inventory
                const materialPayload = {
                  name: material.name,
                  quantityInStock: 0,
                  units: material.units,
                  expirationDate: null,
                };

                const materialRes = await fetch('http://localhost:8080/inventory/createMaterial', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(materialPayload),
                });

                if (!materialRes.ok) {
                  materialErrors.push(`Failed to create material: ${material.name}`);
                  continue;
                }
                const materialData = await materialRes.json();
                console.log(materialData);
                materialId = materialData.data[0].materialId;
              } else if (existingMaterial) {
                materialId = existingMaterial.materialId;
              }

              // Link material to process
              if (materialId) {
                const linkPayload = {
                  materialId: materialId,
                  processId: process.processId,
                  quantityNeeded: material.quantityNeeded,
                  unitsNeeded: material.units,
                };

                const linkRes = await fetch(`http://localhost:8080/process/materials/add`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(linkPayload),
                });

                if (!linkRes.ok) {
                  materialErrors.push(`Failed to link material: ${material.name}`);
                }
              }
            } catch (error) {
              materialErrors.push(
                `Error adding material ${material.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }

          // Update modified materials
          for (const material of modified) {
            try {
              const updateRes = await fetch(
                `http://localhost:8080/process/${process.processId}/materials/${material.materialId}`,
                {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    quantityNeeded: material.quantityNeeded,
                    unitsNeeded: material.units,
                  }),
                }
              );
              if (!updateRes.ok) {
                materialErrors.push(`Failed to update material: ${material.name}`);
              }
            } catch (error) {
              materialErrors.push(
                `Error updating material ${material.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }

          // Show material errors if any occurred
          if (materialErrors.length > 0) {
            console.warn('Material update errors:', materialErrors);
            toast.error(`Some material updates failed:\n${materialErrors.join('\n')}`, {
              duration: 5000,
            });
          }
        } else if (editedProcess && editedProcess.name && !process) {
          // Create process if it didn't exist before
          const processPayload = {
            name: editedProcess.name,
            details: editedProcess.details,
            productId: productId,
            productsPerBatch: editedProcess.productsPerBatch,
          };

          const processRes = await fetch(
            `http://localhost:8080/product/${productId}/createProcess`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(processPayload),
            }
          );

          if (!processRes.ok) throw new Error('Failed to create process');
          const processData = await processRes.json();
          const newProcessId = processData.data[0].processId;

          // Add materials to newly created process
          const validMaterials = filterValidMaterials(editedProcess.materials || []);
          if (validMaterials.length > 0) {
            for (const material of validMaterials) {
              let materialId = material.materialId;

              // Check if material exists in inventory
              const existingMaterial = availableMaterials.find(
                (m) =>
                  m.name.toLowerCase() === material.name.toLowerCase() && m.units === material.units
              );

              if (!existingMaterial && material.name) {
                // Create new material in inventory
                const materialPayload = {
                  name: material.name,
                  quantityInStock: 0,
                  units: material.units,
                  expirationDate: null,
                };

                const materialRes = await fetch('http://localhost:8080/inventory', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(materialPayload),
                });

                if (!materialRes.ok) {
                  console.warn(`Failed to create material: ${material.name}`);
                  continue;
                }
                const materialData = await materialRes.json();
                materialId = materialData.data.materialId;
              } else if (existingMaterial) {
                materialId = existingMaterial.materialId;
              }

              // Link material to process
              if (materialId) {
                const linkPayload = {
                  materialId: materialId,
                  processId: newProcessId,
                  quantityNeeded: material.quantityNeeded,
                  unitsNeeded: material.units,
                };

                const linkRes = await fetch(`http://localhost:8080/process/materials/add`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(linkPayload),
                });

                if (!linkRes.ok) {
                  console.warn(`Failed to link material ${material.name} to process`);
                }
              }
            }
          }
        }

        toast.success('Product updated successfully!');

        if (onSave) {
          onSave(editedProduct);
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(
        `Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedProduct((prev) =>
      prev ? { ...prev, productImage: [{ ...prev.productImage[0], imageURL: value }] } : undefined
    );
    setImagePreview(value);
  };

  const handleMaterialChange = (index: number, field: keyof Material, value: string | number) => {
    if (!editedProcess) return;
    const newMaterials = [...editedProcess.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setEditedProcess({ ...editedProcess, materials: newMaterials });
  };

  const handleMaterialSelect = (index: number, material: InventoryItem) => {
    if (!editedProcess) return;
    const newMaterials = [...editedProcess.materials];
    newMaterials[index] = {
      ...newMaterials[index],
      materialId: material.materialId,
      name: material.name,
      units: material.units,
      materialUnits: material.units,
    };
    setEditedProcess({ ...editedProcess, materials: newMaterials });
    setShowMaterialDropdown(null);
    setMaterialSearchTerm('');
  };

  const getFilteredMaterials = (searchTerm: string) => {
    if (!searchTerm) return availableMaterials;
    return availableMaterials.filter((m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAddMaterial = () => {
    if (!editedProcess) return;
    const newMaterial: Material = {
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
      <div className="flex flex-col md:flex-row gap-4 min-h-0">
        <div className="w-full md:w-1/2 overflow-y-auto">
          {/* Product Image Section */}
          <div className="relative w-full h-64 min-h-[256px] bg-gray-100 overflow-hidden rounded-lg flex-shrink-0">
            {!isEditing ? (
              <Image
                src={imagePreview || 'https://placehold.co/600x400'}
                alt={product?.name || 'Product Image'}
                fill
                className="object-cover"
                onError={() => setImagePreview('/placeholder-product.png')}
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={imagePreview || 'https://placehold.co/600x400'}
                  alt={editedProduct?.name || 'Product Image'}
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
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{product?.name}</h2>
                  <p className="text-xl font-semibold text-green-600 mt-2">
                    ${product?.price.toFixed(2)}
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={editedProduct?.name}
                    onChange={(e) =>
                      setEditedProduct((prev) =>
                        prev ? { ...prev, name: e.target.value } : undefined
                      )
                    }
                    placeholder="Product Name"
                    className="w-full text-2xl font-bold px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedProduct?.price}
                      onChange={(e) =>
                        setEditedProduct((prev) =>
                          prev
                            ? { ...prev, price: Math.max(0, parseFloat(e.target.value) || 0) }
                            : undefined
                        )
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
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
                    setEditedProduct((prev) =>
                      prev ? { ...prev, details: e.target.value } : undefined
                    )
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
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Materials Required</h3>
            {!process && !editedProcess && !isEditing ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm text-center italic">
                  No process defined - materials information unavailable
                </p>
              </div>
            ) : !isEditing ? (
              <div className="space-y-3">
                {process &&
                  process?.materials.map((material, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{material.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">
                          {material.quantityNeeded}
                        </span>
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
                {editedProcess &&
                  editedProcess?.materials.map((material, index) => (
                    <div
                      key={index}
                      className="relative flex gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={material.name}
                          onChange={(e) => {
                            handleMaterialChange(index, 'name', e.target.value);
                            setMaterialSearchTerm(e.target.value);
                            setShowMaterialDropdown(index);
                          }}
                          onFocus={() => {
                            setShowMaterialDropdown(index);
                            setMaterialSearchTerm(material.name);
                          }}
                          placeholder="Material name (type to search)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {showMaterialDropdown === index && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredMaterials(materialSearchTerm).length > 0 ? (
                              <>
                                {getFilteredMaterials(materialSearchTerm).map((mat) => (
                                  <div
                                    key={mat.materialId}
                                    onClick={() => handleMaterialSelect(index, mat)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                  >
                                    <span className="font-medium">{mat.name}</span>
                                    <span className="text-sm text-gray-500">{mat.units}</span>
                                  </div>
                                ))}
                                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                                  Or type a new material name
                                </div>
                              </>
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No materials found. Type to create new material.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        value={material.quantityNeeded}
                        onChange={(e) =>
                          handleMaterialChange(
                            index,
                            'quantityNeeded',
                            parseFloat(e.target.value) || 0
                          )
                        }
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
            {process || editedProcess ? (
              <div>
                {/* Process Name */}
                {!isEditing ? (
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{process?.name}</h3>
                ) : (
                  <input
                    type="text"
                    value={editedProcess?.name}
                    onChange={(e) =>
                      setEditedProcess((prev) =>
                        prev ? { ...prev, name: e.target.value } : undefined
                      )
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
                        setEditedProcess((prev) =>
                          prev
                            ? { ...prev, productsPerBatch: parseInt(e.target.value) || 0 }
                            : undefined
                        )
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
                      {process &&
                        parseProcessSteps(process.details).map((step, index) => (
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
                        setEditedProcess((prev) =>
                          prev ? { ...prev, details: e.target.value } : undefined
                        );
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
                'Create Product'
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

export default ProductModal;
