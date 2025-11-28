'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

import { createClient } from '@/utils/supabase/supabaseServer';
import { DecodedToken } from '@/utils/supabase/schema';

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
  console.log(role);
  if (role === 'ADMIN') {
    path = '/admin';
  } else if (role === 'WORKER') {
    path = '/production';
  }

  path += '/dashboard';
  revalidatePath('/', 'layout');
  redirect(path);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
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

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.log(error);
    redirect(`/error`);
  }

  revalidatePath('/', 'layout');
  redirect('/login');
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
