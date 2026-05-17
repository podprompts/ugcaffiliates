\// src/app/auth/callback/route.ts
// Handles Supabase auth callbacks:
// - Email confirmation (token_hash) → /login?confirmed=true
// - Google OAuth (code) → role-based dashboard redirect
// - Password reset (code + type=recovery) → /reset-password

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const role       = searchParams.get('role')

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

  // ── Email confirmation via token_hash ─────────────────────────────────────
  // Fired when user clicks the confirm email link from signup
  if (tokenHash && type === 'signup') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    })
    if (error) {
      console.error('[callback] token_hash verify error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    return NextResponse.redirect(`${origin}/login?confirmed=true`)
  }

  // ── No code and no token_hash — bail ─────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // ── Password reset ────────────────────────────────────────────────────────
  if (type === 'recovery') {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // ── Google OAuth / general code exchange ─────────────────────────────────
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[callback] code exchange error:', error)
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

  const destination =
    profile?.role === 'vendor' ? '/vendor' :
    profile?.role === 'admin'  ? '/admin'  :
    '/affiliate'

  return NextResponse.redirect(`${origin}${destination}`)
}