'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/utils/supabase/schema'

export interface ProductData {
  id: string;
  name: string;
  image: string;
  details: string;
  materials: string[];
}

export interface ProductCardProps {
  product: Product;
  onSave?: (updatedProduct: Product) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSave,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product>(product);
  const [imagePreview, setImagePreview] = useState<string>(product.productImage[0]?.imageURL);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct(product);
    setImagePreview(product.productImage[0].imageURL);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct(product);
    setImagePreview(product.productImage[0].imageURL);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedProduct);
    }
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedProduct({ ...editedProduct, productImage: [{ ...editedProduct.productImage[0], imageURL: value }] });
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
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Product Image Section */}
      <div className="relative w-full h-64 bg-gray-100">
        {!isEditing ? (
          <Image
            src={imagePreview || '/placeholder-product.png'}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImagePreview('/placeholder-product.png')}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={imagePreview || '/placeholder-product.png'}
              alt={editedProduct.name}
              fill
              className="object-cover opacity-50"
              onError={() => setImagePreview('/placeholder-product.png')}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <input
                type="text"
                value={editedProduct.productImage[0].imageURL}
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
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          ) : (
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) =>
                setEditedProduct({ ...editedProduct, name: e.target.value })
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
            <p className="text-gray-600 leading-relaxed">{product.details}</p>
          ) : (
            <textarea
              value={editedProduct.details}
              onChange={(e) =>
                setEditedProduct({ ...editedProduct, details: e.target.value })
              }
              placeholder="Product details..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          )}
        </div>

        {/* Product Materials
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Materials
          </h3>
          {!isEditing ? (
            <div className="flex flex-wrap gap-2">
              {product.materials.map((material, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                >
                  {material}
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {editedProduct.materials.map((material, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => handleMaterialChange(index, e.target.value)}
                    placeholder="Material name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleRemoveMaterial(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddMaterial}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
              >
                + Add Material
              </button>
            </div>
          )}
        </div> */}

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
    </div>
  );
};

export default ProductCard;
