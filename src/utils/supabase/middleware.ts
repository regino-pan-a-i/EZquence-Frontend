import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getRoleFromToken } from '@/lib/auth-utils';
import { UserRole } from './schema';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes - require authentication
  const isProtectedRoute = pathname.startsWith('/admin') || 
                          pathname.startsWith('/production') ||
                          pathname.startsWith('/account') ||
                          pathname.startsWith('/settings');

  // Admin-only routes
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Production worker routes
  const isProductionRoute = pathname.startsWith('/production');

  // If not authenticated and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, check role-based access
  if (user && isProtectedRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const userRole = getRoleFromToken(session.access_token);

      // Workers cannot access admin routes
      if (isAdminRoute && userRole === UserRole.WORKER) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/production/dashboard';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }

      // Admins cannot access production routes (optional - remove if admins should have access)
      // if (isProductionRoute && userRole === UserRole.ADMIN) {
      //   const redirectUrl = request.nextUrl.clone();
      //   redirectUrl.pathname = '/admin/dashboard';
      //   return NextResponse.redirect(redirectUrl);
      // }
    }
  }

  // If authenticated user visits login page, redirect to their dashboard
  if (user && pathname === '/login') {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const userRole = getRoleFromToken(session.access_token);
      const dashboardUrl = request.nextUrl.clone();
      
      if (userRole === UserRole.ADMIN) {
        dashboardUrl.pathname = '/admin/dashboard';
      } else if (userRole === UserRole.WORKER) {
        dashboardUrl.pathname = '/production/dashboard';
      }
      
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}
