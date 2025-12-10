import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getRoleFromToken, decodeToken } from '@/lib/auth-utils';
import { UserRole, ApiResponse, ApprovalStatus } from './schema';
import { getApiBaseUrl } from '@/utils/apiConfig'
import { getCompanyById } from '@/lib/company-actions';

const fetchCompanyDetails = async () => {
  return await getCompanyById()
}

const fetchWorkerApprovalStatus = async (userId: string, token: string): Promise<ApprovalStatus | null> => {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/customer/user/${userId}/approvalStatus`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) {
      console.log('Failed to fetch approval status', res);
      return null;
    }
    const response: ApiResponse<ApprovalStatus> = await res.json();
    return response.data || null;
  } catch (error) {
    console.error('Error fetching approval status:', error);
    return null;
  }
}

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

  // Onboarding routes (accessible to authenticated users without company setup)
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // Protected routes - require authentication
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/production') ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/settings') ||
    isOnboardingRoute;

  // Admin-only routes
  const isAdminRoute = pathname.startsWith('/admin');

  // Production worker routes
  const isProductionRoute = pathname.startsWith('/production');

  // Customer routes
  const isCustomerRoute = pathname.startsWith('/customer');

  // If not authenticated and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, check role-based access and approval status
  if (user && isProtectedRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const userRole = getRoleFromToken(session.access_token);
      const decoded = decodeToken(session.access_token);
      const userId = decoded?.sub || '';
      
      // Fetch approval status for workers
      const approvalStatus = await fetchWorkerApprovalStatus(userId, session.access_token);
      const companyDetails = await fetchCompanyDetails();
      const hasCompany = !!companyDetails;

      // Check if worker is pending approval and trying to access non-onboarding routes
      if (
        userRole === UserRole.WORKER &&
        approvalStatus === ApprovalStatus.PENDING &&
        !pathname.startsWith('/onboarding/pending-approval')
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/onboarding/pending-approval';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect admin without company to company creation (except if already there)
      if (
        userRole === UserRole.ADMIN &&
        !hasCompany &&
        !pathname.startsWith('/admin/company/create') &&
        !isOnboardingRoute
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/admin/company/create';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect workers/clients without company to company selection (except if already there)
      if (
        (userRole === UserRole.WORKER || userRole === UserRole.CLIENT) &&
        !hasCompany &&
        !pathname.startsWith('/onboarding/select-company') &&
        !pathname.startsWith('/onboarding/pending-approval')
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/onboarding/select-company';
        return NextResponse.redirect(redirectUrl);
      }

      // Workers cannot access admin routes
      if (isAdminRoute && userRole === UserRole.WORKER) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/production/dashboard';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }

      // Clients cannot access admin or production routes
      if ((isAdminRoute || isProductionRoute) && userRole === UserRole.CLIENT) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/customer/products';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }

      // Workers and admins cannot access customer routes
      if (isCustomerRoute && (userRole === UserRole.ADMIN || userRole === UserRole.WORKER)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = userRole === UserRole.ADMIN ? '/admin/dashboard' : '/production/dashboard';
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // If authenticated user visits login page, redirect to their dashboard
  if (user && pathname === '/login') {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const userRole = getRoleFromToken(session.access_token);
      const decoded = decodeToken(session.access_token);
      const userId = decoded?.sub || '';
      
      // Fetch approval status and company details
      const approvalStatus = await fetchWorkerApprovalStatus(userId, session.access_token);
      const companyDetails = await fetchCompanyDetails();
      const hasCompany = !!companyDetails;
      const dashboardUrl = request.nextUrl.clone();

      // Handle pending worker approval
      if (userRole === UserRole.WORKER && approvalStatus === ApprovalStatus.PENDING) {
        dashboardUrl.pathname = '/onboarding/pending-approval';
        return NextResponse.redirect(dashboardUrl);
      }

      // Handle users without company
      if (userRole === UserRole.ADMIN && !hasCompany) {
        dashboardUrl.pathname = '/admin/company/create';
        return NextResponse.redirect(dashboardUrl);
      }

      if ((userRole === UserRole.WORKER || userRole === UserRole.CLIENT) && !hasCompany) {
        dashboardUrl.pathname = '/onboarding/select-company';
        return NextResponse.redirect(dashboardUrl);
      }

      // Normal dashboard redirects
      if (userRole === UserRole.ADMIN) {
        dashboardUrl.pathname = '/admin/dashboard';
      } else if (userRole === UserRole.WORKER) {
        dashboardUrl.pathname = '/production/dashboard';
      } else if (userRole === UserRole.CLIENT) {
        dashboardUrl.pathname = '/customer/products';
      }

      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}
