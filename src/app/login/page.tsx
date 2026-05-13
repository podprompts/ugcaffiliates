// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) { setError(loginError.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_onboarded')
      .eq('id', data.user.id)
      .single()

    await new Promise(resolve => setTimeout(resolve, 500))

    const dest = profile?.role === 'vendor'
      ? (profile?.stripe_onboarded ? '/vendor' : '/pricing')
      : profile?.role === 'admin' ? '/admin'
      : '/affiliate'

    window.location.href = dest
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .login-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; height: 68px; }
        .login-wrap { max-width: 420px; margin: 0 auto; padding: 3rem 1.5rem; }
        @media (max-width: 600px) {
          .login-nav { padding: 0 1rem; height: 56px; }
          .login-wrap { padding: 2rem 1rem; }
        }
      `}</style>

      <nav className="login-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <span style={{ fontSize: '13px', color: '#888' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>Sign up free</Link>
        </span>
      </nav>

      <div className="login-wrap">
        <div style={{ textAlign: 'center' as const, marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.4rem' }}>Sign in</h1>
          <p style={{ fontSize: '13.5px', color: '#888' }}>Welcome back.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
          <div>
            <label style={{ display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '12px', color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Forgot?</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>

          {error && <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem 1rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: loading ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
          <span style={{ fontSize: '12px', color: '#888' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
        </div>

        <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '0.85rem', background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 500, border: '1px solid #e8e6e2', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center' as const, fontSize: '12px', color: '#888', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  )
}