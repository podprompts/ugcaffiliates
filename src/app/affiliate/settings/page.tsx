// src/app/affiliate/settings/page.tsx
// Affiliate connects their Stripe account to receive automatic payouts

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function AffiliateSettingsInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser]           = useState<any>(null)
  const [profile, setProfile]     = useState<any>(null)
  const [connectStatus, setConnectStatus] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [session, setSession]     = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session: sess } } = await supabase.auth.getSession()
      if (!sess) { router.push('/login'); return }
      setSession(sess)
      setUser(sess.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, role, stripe_connect_id, stripe_connect_onboarded')
        .eq('id', sess.user.id)
        .single()

      setProfile(prof)

      // Check connect status
      const res = await fetch('/api/stripe/affiliate-connect', {
        headers: { Authorization: `Bearer ${sess.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConnectStatus(data)

        // If returning from Stripe onboarding
        if (searchParams.get('connect') === 'success' && data.onboarded) {
          setSuccess('Your Stripe account is connected! You\'ll now receive automatic payouts.')
        } else if (searchParams.get('connect') === 'refresh') {
          setError('Onboarding was interrupted. Please try connecting again.')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleConnect() {
    if (!session) return
    setConnecting(true); setError('')
    try {
      const res = await fetch('/api/stripe/affiliate-connect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to start Stripe onboarding')
        setConnecting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setConnecting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const isConnected = connectStatus?.connected && connectStatus?.onboarded

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .as-content { max-width: 640px; margin: 0 auto; padding: 2.5rem 2rem; }
        .as-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; height: 68px; display: flex; align-items: center; gap: 1rem; }
        @media (max-width: 600px) { .as-nav { padding: 0 1rem; } .as-content { padding: 1.5rem 1rem; } }
      `}</style>

      <nav className="as-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>
        <Link href="/affiliate" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>

      <div className="as-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Settings</h1>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#16a34a' }}>{success}</div>
        )}

        {/* Stripe Connect */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Payout account</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.4rem' }}>
                {isConnected ? '✓ Stripe account connected' : 'Connect your bank account'}
              </div>
              <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                {isConnected
                  ? 'You\'ll receive commission payouts automatically when vendors approve your conversions. Payouts arrive in your bank account within 2-7 business days.'
                  : 'Connect your bank account via Stripe to receive automatic commission payouts. Without this, vendors cannot pay you automatically.'}
              </div>

              {connectStatus?.connected && !connectStatus?.onboarded && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                  ⚠️ Your Stripe account setup is incomplete. Please finish connecting to receive payouts.
                </div>
              )}

              {isConnected && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '12px' }}>
                  <span style={{ color: connectStatus.payouts_enabled ? '#16a34a' : '#dc2626' }}>
                    {connectStatus.payouts_enabled ? '✓' : '✗'} Payouts {connectStatus.payouts_enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0 }}>
              {isConnected ? (
                <button onClick={handleConnect} disabled={connecting}
                  style={{ fontSize: '13px', fontWeight: 500, color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.5rem 1rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Update account
                </button>
              ) : (
                <button onClick={handleConnect} disabled={connecting}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: connecting ? '#888' : '#0d0d0d', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '3px', cursor: connecting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {connecting ? 'Redirecting…' : 'Connect with Stripe'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account info */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1rem' }}>Account info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#888' }}>Name</span>
              <span style={{ fontWeight: 500 }}>{profile?.full_name ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#888' }}>Email</span>
              <span style={{ fontWeight: 500 }}>{user?.email ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#888' }}>Role</span>
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{profile?.role ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function AffiliateSettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
      </div>
    }>
      <AffiliateSettingsInner />
    </Suspense>
  )
}