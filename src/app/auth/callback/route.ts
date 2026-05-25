// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type')
  const role      = searchParams.get('role')

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
  if (tokenHash && type === 'signup') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    })
    if (error) {
      console.error('[callback] token_hash verify error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    // Sign out immediately so user must log in manually
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?confirmed=true`)
  }

  // ── No code and no token_hash ─────────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // ── Password reset ────────────────────────────────────────────────────────
  if (type === 'recovery') {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[callback] code exchange error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (role && (role === 'vendor' || role === 'affiliate')) {
    await supabase.from('profiles').update({ role }).eq('id', data.user.id)
  }

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