'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/utils/supabase/supabaseServer';
import { DecodedToken } from '@/utils/supabase/schema';
import { getApiBaseUrl } from '@/utils/apiConfig';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log(error);
    redirect('/error');
  }

  let path = '/';
  const token = authData?.session?.access_token;
  const decoded = jwtDecode(token) as DecodedToken;
  const role = decoded?.user_role;
  if (role === 'ADMIN') {
    path = '/admin';
  } else if (role === 'WORKER') {
    path = '/production';
  } else if (role === 'CLIENT') {
    path = '/customer';
  }

  path += role === 'CLIENT' ? '/products' : '/dashboard';
  revalidatePath('/', 'layout');
  redirect(path);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string;
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        firstName: firstName,
        lastName: lastName,
        email: formData.get('email') as string,
      },
    },
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    console.log(error);
    redirect(`/error`);
  }


  const userId = authData.user?.id;
  // If no session, sign in immediately to get a token
  let token = authData?.session?.access_token;
  
  if (!token) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    
    if (signInError) {
      console.log('Failed to sign in after signup:', signInError);
      redirect('/error');
    }
    
    token = signInData?.session?.access_token;
  }

  if (!token) {
    console.log('No token available - email confirmation may be required');
    redirect('/error');
  }

  
  const response = await fetch(`${getApiBaseUrl()}/company/user/${userId}/role`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role })
  });

  if (!response.ok) {
    console.log(`Failed to set user role: ${response.statusText}`);
    throw new Error(`Failed to set user role: ${response.statusText}`);
  }

  // refresh session to have the right role

  const { data: newData, error: newError } = await supabase.auth.refreshSession();

  if (newError) console.error(newError);

  // Updated JWT & user:
  const newToken = newData.session?.access_token;



  if (role === 'WORKER') {
    // Set initial approval status for workers    
    const response = await fetch(`${getApiBaseUrl()}/company/user/${userId}/pending`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Failed to set initial approval status: ${response.statusText}`);
      throw new Error(`Failed to set initial approval status: ${response.statusText}`);
    }
  
  }

  // Role-based redirect after signup
  revalidatePath('/', 'layout');
  
  // Redirect based on role
  if (role === 'ADMIN') {
    // Admins need to create their company first
    redirect('/admin/company/create');
  } else if (role === 'WORKER' || role === 'CLIENT') {
    // Workers and clients need to select a company
    redirect('/onboarding/select-company');
  } else {
    // Fallback to login
    redirect('/login');
  }
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect('/error');
  }

  redirect('/logout');
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.log(error);
    redirect('/error');
  }

  redirect(data.url);
}

export async function getAccessToken() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}
