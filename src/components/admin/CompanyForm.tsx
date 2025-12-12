'use client';

import { useState, useEffect } from 'react';
import { Company } from '@/utils/supabase/schema';
import { FaImage, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';

interface CompanyFormProps {
  company?: Company;
  isEditing?: boolean;
  onSubmit: (data: CompanyFormData, logoFile?: File) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface CompanyFormData {
  name: string;
  description: string;
  industry: string;
  logoURL?: string;
}

export default function CompanyForm({
  company,
  isEditing = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CompanyFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logoURL || null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name || '',
    description: company?.description || '',
    industry: company?.industry || '',
    logoURL: company?.logoURL || '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        description: company.description,
        industry: company.industry,
        logoURL: company.logoURL,
      });
      setLogoPreview(company.logoURL || null);
    }
  }, [company]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, SVG, or WebP image');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, logoFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          disabled={!isEditing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
          placeholder="Enter your company name"
        />
      </div>

      {/* Industry */}
      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          id="industry"
          name="industry"
          value={formData.industry}
          onChange={handleInputChange}
          required
          disabled={!isEditing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
        >
          <option value="">Select an industry</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Food & Beverage">Food & Beverage</option>
          <option value="Technology">Technology</option>
          <option value="Retail">Retail</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Construction">Construction</option>
          <option value="Automotive">Automotive</option>
          <option value="Textile">Textile</option>
          <option value="Pharmaceutical">Pharmaceutical</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={4}
          disabled={!isEditing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-800 dark:text-white resize-none disabled:bg-gray-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed"
          placeholder="Describe your company and what you do..."
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Logo <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative w-32 h-32 border-2 border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-neutral-800">
                <FaImage className="text-4xl text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          {isEditing && (
            <div className="flex-1">
              <input
                type="file"
                id="logo"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
              <label
                htmlFor="logo"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
              >
                Choose Logo
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Upload a JPG, PNG, SVG, or WebP image (max 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      {isEditing && (
        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" />
                {company ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{company ? 'Update Company' : 'Create Company'}</>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
