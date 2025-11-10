'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProductResponse, Product, Process, ProcessResponse } from '@/utils/supabase/schema'
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



  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct(product);
    setImagePreview(product?.productImage[0]?.imageURL || 'https://placehold.co/600x400');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct(product);
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

  // const handleMaterialChange = (index: number, value: string) => {
  //   const newMaterials = [...editedProduct.materials];
  //   newMaterials[index] = value;
  //   setEditedProduct({ ...editedProduct, materials: newMaterials });
  // };

  // const handleAddMaterial = () => {
  //   setEditedProduct({
  //     ...editedProduct,
  //     materials: [...editedProduct.materials, ''],
  //   });
  // };

  // const handleRemoveMaterial = (index: number) => {
  //   const newMaterials = editedProduct.materials.filter((_, i) => i !== index);
  //   setEditedProduct({ ...editedProduct, materials: newMaterials });
  // };

  return (
    <div
      className={`bg-white border border-gray-200 h-full p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
    >
      <div className='flex flex-col md:flex-row gap-4 overflow-hidden'>
        <div className="w-1/2 overflow-hidden">
          {/* Product Image Section */}
          <div className="relative w-full h-64 bg-gray-100 overflow-hidden rounded-lg">
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
          <div className="p-6">
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
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Materials
            </h3>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {process && process?.materials.map((material, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {material.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {editedProcess && editedProcess?.materials.map((material, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={material.name}
                      // onChange={(e) => handleMaterialChange(index, e.target.value)}
                      placeholder="Material name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      // onClick={() => handleRemoveMaterial(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  // onClick={handleAddMaterial}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
                >
                  + Add Material
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="w-1/2">
          <div>
            {process && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{process.name}</h3>
                <p className="font-semibold text-gray-700 leading-relaxed">Products Per batch: {process.productsPerBatch}</p>
                <p className="p-4 text-gray-600 leading-relaxed">{process.details}</p>
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
