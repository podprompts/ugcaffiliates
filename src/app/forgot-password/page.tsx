// src/app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', display: 'flex', flexDirection: 'column' as const, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '64px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' as const }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '1rem' }}>Check your email</h1>
              <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7, marginBottom: '1.5rem' }}>We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.</p>
              <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'underline' }}>Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.5rem', textAlign: 'center' as const }}>Reset password</h1>
              <p style={{ fontSize: '13.5px', color: '#888', textAlign: 'center' as const, marginBottom: '2rem' }}>Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }}>Email</label>
                  <input style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
                </div>
                {error && <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb' }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: loading ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
              <p style={{ textAlign: 'center' as const, marginTop: '1.5rem' }}>
                <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'underline' }}>Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}