import { jwtDecode } from 'jwt-decode';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UserRole, DecodedToken } from '@/utils/supabase/schema';

/**
 * Decodes a JWT token and extracts user role information
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Gets the current user's role from the session token (server-side)
 */
export async function getUserRole(): Promise<UserRole | null> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    const decoded = decodeToken(session.access_token);
    return decoded?.user_role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Checks if the user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Checks if the current user has the required role (server-side)
 */
export async function hasRequiredRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === requiredRole;
}

/**
 * Gets user role from a specific token (used in middleware)
 */
export function getRoleFromToken(token: string): UserRole | null {
  const decoded = decodeToken(token);
  return decoded?.user_role || null;
}
