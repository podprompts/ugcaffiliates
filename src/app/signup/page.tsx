// src/app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'affiliate' | 'vendor' | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!role) { setError('Please select an account type'); return }
    setLoading(true); setError('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } }
    })

    if (signupError) { setError(signupError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').update({ role, full_name: fullName }).eq('id', data.user.id)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ role, full_name: fullName }),
        }).catch(() => {})
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    if (!role) { setError('Please select your account type first'); return }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?role=${role}` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .su-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; height: 68px; }
        .su-wrap { max-width: 480px; margin: 0 auto; padding: 3rem 1.5rem; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
        .role-btn { padding: 1.1rem 1rem; border-radius: 4px; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s; }
        @media (max-width: 600px) {
          .su-nav { padding: 0 1rem; height: 56px; }
          .su-nav span { display: none; }
          .su-wrap { padding: 2rem 1rem; }
          .role-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="su-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <span style={{ fontSize: '13px', color: '#888' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>Sign in</Link>
        </span>
      </nav>

      <div className="su-wrap">
        {success ? (
          <div style={{ textAlign: 'center' as const, padding: '2rem 0' }}>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '1rem' }}>Check your email</h1>
            <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'underline' }}>Back to sign in</Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center' as const, marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.4rem' }}>Create your account</h1>
              <p style={{ fontSize: '13.5px', color: '#888' }}>
                {role === 'vendor' ? 'Free to list. We only take 4% on confirmed sales.' : 'Free to join. No monthly fees.'}
              </p>
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.6rem' }}>I want to</div>
              <div className="role-grid">
                {[
                  { key: 'affiliate', title: 'Promote products', sub: 'Earn commissions as an affiliate' },
                  { key: 'vendor', title: 'List my products', sub: 'Sell via affiliate creators' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key as any)}
                    className="role-btn"
                    style={{
                      border: role === opt.key ? '2px solid #0d0d0d' : '1px solid #e8e6e2',
                      background: role === opt.key ? '#0d0d0d' : '#ffffff',
                    }}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: role === opt.key ? '#ffffff' : '#0d0d0d', marginBottom: '0.25rem' }}>{opt.title}</div>
                    <div style={{ fontSize: '12px', color: role === opt.key ? 'rgba(255,255,255,0.6)' : '#888' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              {[
                { label: 'Full name', type: 'text', value: fullName, onChange: setFullName, placeholder: 'Jane Smith' },
                { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'jane@example.com' },
                { label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: 'Min. 8 characters' },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    required
                    minLength={field.type === 'password' ? 8 : undefined}
                    style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              ))}

              {error && (
                <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem 1rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb' }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: loading ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e8e6e2' }} />
            </div>

            <button onClick={handleGoogleSignup} style={{ width: '100%', padding: '0.85rem', background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 500, border: '1px solid #e8e6e2', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center' as const, fontSize: '12px', color: '#888', marginTop: '1.5rem', lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <Link href="/terms" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Privacy Policy</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}