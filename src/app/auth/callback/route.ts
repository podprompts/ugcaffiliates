// src/app/auth/callback/route.ts
//
// Handles Supabase OAuth callback (Google sign-in)
// Also sets role on profile if passed via query param (from Google signup flow)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') // passed from Google signup
  // Handle password reset
const type = searchParams.get('type')
if (type === 'recovery' && code) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
  await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(`${origin}/reset-password`)
}

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            try { cookieStore.set({ name, value, ...options }) } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try { cookieStore.set({ name, value: '', ...options }) } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // If role was passed (Google signup), set it on the profile
      if (role && (role === 'vendor' || role === 'affiliate')) {
        await supabase
          .from('profiles')
          .update({ role })
          .eq('id', data.user.id)
      }

      // Get profile role to redirect correctly
      const { data: profile } = await supabase
  .from('profiles')
  .select('role, stripe_onboarded')
  .eq('id', data.user.id)
  .single()

      const destination = profile?.role === 'vendor'
  ? (profile?.stripe_onboarded ? '/vendor' : '/pricing')
  : profile?.role === 'admin'
  ? '/admin'
  : '/affiliate'

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}