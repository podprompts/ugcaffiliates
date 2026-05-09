// src/app/signup/page.tsx

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupPage() {
  const [role, setRole] = useState<'vendor' | 'affiliate' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) { setError('Please select your account type'); return }
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Set role on profile
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ role, full_name: fullName })
        .eq('id', data.user.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    if (!role) { setError('Please select your account type first'); return }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    border: '1px solid #e8e6e2',
    borderRadius: '3px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0d0d0d',
    background: '#ffffff',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#3a3a3a',
    marginBottom: '0.4rem',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '1rem' }}>Check your email</div>
          <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and get started.
          </p>
          <Link href="/login" style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '13px', color: '#888', textDecoration: 'underline' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', display: 'flex', flexDirection: 'column' as const }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '64px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>
          U G C A
        </Link>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#888' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>Sign in</Link>
        </div>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.5rem', textAlign: 'center' as const }}>
            Create your account
          </h1>
          <p style={{ fontSize: '13.5px', color: '#888', textAlign: 'center' as const, marginBottom: '2.5rem' }}>
            Free to join. No monthly fees.
          </p>

          {/* Role selector */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.75rem' }}>
              I want to
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {([
                { value: 'affiliate', label: 'Promote products', sub: 'Earn commissions as an affiliate' },
                { value: 'vendor', label: 'List my products', sub: 'Sell via affiliate creators' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  style={{
                    padding: '1.25rem 1rem',
                    border: role === opt.value ? '2px solid #0d0d0d' : '1px solid #e8e6e2',
                    borderRadius: '4px',
                    background: role === opt.value ? '#0d0d0d' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: role === opt.value ? '#ffffff' : '#0d0d0d', marginBottom: '0.25rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: role === opt.value ? 'rgba(255,255,255,0.65)' : '#888' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google signup */}
          <button
            onClick={handleGoogleSignup}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e8e6e2', borderRadius: '3px', background: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
            <span style={{ fontSize: '12px', color: '#888' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input style={inputStyle} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" required />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required />
            </div>

            {error && (
              <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: loading ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' as const, marginTop: '1.5rem', lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}