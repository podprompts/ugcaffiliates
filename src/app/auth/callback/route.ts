// src/app/auth/callback/route.ts
// Handles Supabase auth callbacks:
// - Email confirmation → /login?confirmed=true
// - Google OAuth → role-based dashboard redirect
// - Password reset → /reset-password

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role')   // passed from Google signup flow
  const type = searchParams.get('type')   // 'recovery' for password reset, 'signup' for email confirm

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

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

  // ── Password reset ────────────────────────────────────────────────────────
  if (type === 'recovery') {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // ── Email confirmation ────────────────────────────────────────────────────
  // When a user clicks the confirm email link, send them to login with a
  // success message so they know to sign in. Don't auto-login them.
  if (type === 'signup' || type === 'email') {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/login?confirmed=true`)
  }

  // ── Google OAuth / general code exchange ─────────────────────────────────
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // If role was passed (Google signup), set it on the profile
  if (role && (role === 'vendor' || role === 'affiliate')) {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id)
  }

  // Get profile role to redirect to the right dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // ── Role-based redirect ───────────────────────────────────────────────────
  // stripe_onboarded check removed — vendors list for free now
  const destination =
    profile?.role === 'vendor' ? '/vendor' :
    profile?.role === 'admin'  ? '/admin'  :
    '/affiliate'

  return NextResponse.redirect(`${origin}${destination}`)
}