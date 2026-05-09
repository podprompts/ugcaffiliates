// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Build response that forwards cookies
  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res = NextResponse.next()
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() for reliable auth
  const { data: { user } } = await supabase.auth.getUser()

  // Only protect routes if NOT on an auth-related path
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isProtected =
    pathname.startsWith('/affiliate') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/admin')

  // Not logged in + trying to access protected route
  if (!user && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in + on login/signup — redirect to dashboard
  // SKIP this if we just came from a login (avoid redirect loop)
  if (user && isAuthPage && !req.nextUrl.searchParams.has('redirected')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const dest = profile?.role === 'vendor' ? '/vendor'
      : profile?.role === 'admin' ? '/admin'
      : '/affiliate'

    const url = req.nextUrl.clone()
    url.pathname = dest
    url.searchParams.set('redirected', '1')
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|go|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}