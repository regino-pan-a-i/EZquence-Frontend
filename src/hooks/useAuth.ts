'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient';
import { UserRole, DecodedToken } from '@/utils/supabase/schema';
import { jwtDecode } from 'jwt-decode';
import { User } from '@supabase/supabase-js';

/**
 * Hook to get the current user's role from the session token (client-side)
 */
export function useRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const decoded = jwtDecode<DecodedToken>(session.access_token);
          setRole(decoded.user_role || null);
        } catch (error) {
          console.error('Error decoding token:', error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
    };

    fetchRole();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        try {
          const decoded = jwtDecode<DecodedToken>(session.access_token);
          setRole(decoded.user_role || null);
        } catch (error) {
          console.error('Error decoding token:', error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return role;
}

/**
 * Hook to get the current authenticated user (client-side)
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

/**
 * Hook to check if user has a specific role (client-side)
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const userRole = useRole();
  return userRole === requiredRole;
}

/**
 * Hook to check if user is authenticated (client-side)
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useUser();
  return !loading && !!user;
}
