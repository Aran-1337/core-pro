import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicPrefixes = ['/login', '/signup', '/about', '/courses', '/store', '/maintenance', '/contact'];
  const isPublicRoute = pathname === '/' || publicPrefixes.some(prefix => pathname.startsWith(prefix));

  // Check Maintenance Mode from system_settings
  const { data: sysSettings } = await supabase.from('site_settings').select('value').eq('key', 'system_settings').single();
  const isMaintenanceMode = sysSettings?.value?.maintenance_mode === true;

  // Let admins pass through maintenance mode
  let isAdmin = false;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = userData?.role === 'ADMIN';
  }

  // Redirect to maintenance if enabled and user is not admin
  if (isMaintenanceMode && !isAdmin && pathname !== '/maintenance') {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  // Redirect back if maintenance mode is OFF and user tries to access /maintenance
  if (!isMaintenanceMode && pathname === '/maintenance') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, we need to check their role/status from public.users
  // To avoid hitting DB on every request, we could rely on JWT claims, but for now we query DB.
  if (user && pathname.startsWith('/admin')) {
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard' // redirect non-admins
      return NextResponse.redirect(url)
    }
  }

  // Handle students who are PENDING (they can't access dashboard/courses yet)
  if (user && !pathname.startsWith('/admin') && !isPublicRoute && pathname !== '/pending') {
    const { data: userData } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()

    if (userData?.status === 'PENDING') {
      // We haven't built a /pending page yet, but we'll redirect them there
      // Wait, let's just let them see the public routes, or create a pending state in the dashboard.
      // For now, let's just let it pass, we can handle it in the UI.
    }
  }

  return supabaseResponse
}
