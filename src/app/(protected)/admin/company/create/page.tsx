'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminJoinCompany, createCompany } from '@/lib/company-actions';
import { uploadCompanyLogo } from '@/lib/storage-utils';
import toast from 'react-hot-toast';
import { FaBuilding, FaImage, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/supabaseClient';
import { DecodedToken } from '@/utils/supabase/schema'
import { jwtDecode } from 'jwt-decode';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
  });

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
        toast.error('Please upload a JPG, PNG, SVG, or WebP image');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
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

    if (!formData.name || !formData.description || !formData.industry) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let logoURL: string | undefined = undefined;

      // Step 1: Upload logo (if provided)
      if (logoFile) {
        const uploadResult = await uploadCompanyLogo(logoFile);

        if (!uploadResult.success || !uploadResult.url) {
          toast.error(uploadResult.error || 'Failed to upload logo');
          setIsSubmitting(false);
          return;
        }
        logoURL = uploadResult.url;
      }

      // Step 2: Create company with logo URL (if provided)
      const result = await createCompany({
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        logoURL: '',
      });

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
    
      const decodedToken = jwtDecode<DecodedToken>(token || '');
      const userId = decodedToken.usr_id;

      if (!userId) {
        toast.error('Unable to identify user');
        setIsSubmitting(false);
        return;
      }
      if (!result.data?.companyId) {
        toast.error('Failed to create company');
        setIsSubmitting(false);
        return;
      }

      // Step 3: Assign the new company to the current user
      const newResult = await adminJoinCompany(result.data.companyId, userId)

      if (result.success) {
        toast.success('Company created successfully!');
        router.push('/admin/dashboard');
      } else {
        toast.error(result.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaBuilding className="text-3xl text-link" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Create Your Company
            </h1>
            <p className="text-muted mt-1">
              Set up your company profile to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground text-muted mb-2"
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
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:outline-none bg-surface text-foreground"
              placeholder="Enter your company name"
            />
          </div>

          {/* Industry */}
          <div>
            <label
              htmlFor="industry"
              className="block text-sm font-medium text-foreground text-muted mb-2"
            >
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:outline-none bg-surface text-foreground"
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
              className="block text-sm font-medium text-foreground text-muted mb-2"
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
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:outline-none bg-surface text-foreground resize-none"
              placeholder="Describe your company and what you do..."
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground text-muted mb-2">
              Company Logo <span className="text-muted text-xs">(optional)</span>
            </label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative w-32 h-32 border-2 border-border rounded-lg overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-background bg-surface">
                    <FaImage className="text-4xl text-muted" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
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
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary-hover transition"
                >
                  Choose Logo
                </label>
                <p className="text-sm text-muted mt-2">
                  Upload a JPG, PNG, SVG, or WebP image (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed transition font-semibold"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Company...
                </>
              ) : (
                'Create Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
