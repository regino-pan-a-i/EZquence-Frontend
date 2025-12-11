'use server';

import { revalidatePath } from 'next/cache';
import { getApiUrl } from '@/utils/apiConfig';
import { createClient } from '@/utils/supabase/supabaseServer';
import { Company, DecodedToken, ApiResponse } from '@/utils/supabase/schema';
import { jwtDecode } from 'jwt-decode';
import { getCompanyIdFromToken } from './auth-utils';


export interface CompanyCreateData {
  name: string;
  description: string;
  industry: string;
  logoURL: string;
}

/**
 * Create a new company
 * @param companyData - Company information including name, description, industry, and logoURL
 * @returns ApiResponse with created company data
 */
export async function createCompany(
  companyData: CompanyCreateData
): Promise<ApiResponse<Company>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const response = await fetch(getApiUrl('/company'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to create company: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath('/admin');
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error creating company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the company',
    };
  }
}

/**
 * Get all companies
 * @returns ApiResponse with array of companies
 */
export async function getAllCompanies(): Promise<ApiResponse<Company[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const response = await fetch(getApiUrl('/company'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch companies: ${response.statusText}`,
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error fetching companies:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching companies',
    };
  }
}

/**
 * Get a company by ID
 * @param companyId - The ID of the company
 * @returns ApiResponse with company data
 */
export async function getCompanyById(): Promise<ApiResponse<Company>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const decodedToken = jwtDecode<DecodedToken>(session.access_token || '');
    const companyId = decodedToken.user_company

    const response = await fetch(getApiUrl(`/company/${companyId}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch company: ${response.statusText}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching the company',
    };
  }
}

/**
 * Get all workers in the current company
 * @returns ApiResponse with array of workers
 */
export async function getCompanyWorkers(): Promise<ApiResponse<Worker[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }
    const companyId = getCompanyIdFromToken(session.access_token)

    const response = await fetch(getApiUrl(`/company/${companyId}/workers`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch workers: ${response.statusText}`,
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error fetching workers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching workers',
    };
  }
}

/**
 * Admin joins newly created company
 * @param companyId - The ID of the company to join
 * @returns ApiResponse indicating success or failure
 */
export async function adminJoinCompany(companyId: number, userId: number): Promise<ApiResponse<Worker>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }
    const response = await fetch(getApiUrl(`/company/${companyId}/adminJoinCompany/${userId}`), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to join company: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath('/admin/company');

    await supabase.auth.refreshSession();

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error joining company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while joining the company',
    };
  }
}

/**
 * Request to join a company (for workers and clients)
 * @param companyId - The ID of the company to join
 * @returns ApiResponse indicating success or failure
 */
export async function workerRequestJoinCompany(companyId: number, userId: number): Promise<ApiResponse<Worker>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }
    const response = await fetch(getApiUrl(`/company/${companyId}/workerJoinCompany/${userId}`), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to join company: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath('/onboarding');

    await supabase.auth.refreshSession();
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error joining company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while joining the company',
    };
  }
}

/**
 * Request to join a company (for workers and clients)
 * @param companyId - The ID of the company to join
 * @returns ApiResponse indicating success or failure
 */
export async function clientRequestJoinCompany(companyId: number, userId: number): Promise<ApiResponse<Worker>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const response = await fetch(getApiUrl(`/company/${companyId}/clientJoinCompany/${userId}`), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to join company: ${response.statusText}`,
      };
    }

    const result = await response.json();
    revalidatePath('/onboarding');

    await supabase.auth.refreshSession();
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error joining company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while joining the company',
    };
  }
}

/**
 * Get all companies (public - no authentication required)
 * @returns ApiResponse with array of companies
 */
export async function getPublicCompanies(): Promise<ApiResponse<Company[]>> {
  try {
    const response = await fetch(getApiUrl('/company'), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch companies: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    console.error('Error fetching public companies:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching companies',
    };
  }
}

/**
 * Get company by ID (public - no authentication required)
 * @param companyId - The ID of the company to fetch
 * @returns ApiResponse with company data
 */
export async function getPublicCompanyById(companyId: string | number): Promise<ApiResponse<Company>> {
  try {
    const response = await fetch(getApiUrl(`/company/${companyId}`), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch company: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error fetching public company:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching company',
    };
  }
}
