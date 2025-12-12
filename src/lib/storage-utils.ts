'use server';

import { createClient } from '@/utils/supabase/supabaseServer';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a company logo to the companyLogos bucket
 * @param file - The file to upload
 * @param fileName - Optional custom filename (defaults to timestamp-based)
 * @returns UploadResult with the public URL or error
 */
export async function uploadCompanyLogo(
  file: File,
  fileName?: string
): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPG, PNG, SVG, or WebP image.',
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 5MB limit.',
      };
    }

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const uploadFileName = fileName || `logo-${timestamp}.${extension}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('companyLogos')
      .upload(uploadFileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('companyLogos')
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Unexpected error in uploadCompanyLogo:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during upload.',
    };
  }
}

/**
 * Delete a company logo from the companyLogos bucket
 * @param filePath - The path/filename of the file to delete
 * @returns boolean indicating success
 */
export async function deleteCompanyLogo(filePath: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from('companyLogos')
      .remove([filePath]);

    if (error) {
      console.error('Storage deletion error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in deleteCompanyLogo:', error);
    return false;
  }
}
