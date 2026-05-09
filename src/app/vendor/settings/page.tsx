// src/app/vendor/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function VendorSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) { router.push('/login'); return }
      const { profile: prof } = await res.json()
      if (!prof || prof.role !== 'vendor') { router.push('/login'); return }
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  async function openBillingPortal() {
    setPortalLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const { url, error } = await res.json()
    if (error) { alert(error); setPortalLoading(false); return }
    window.location.href = url
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2',
    borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit',
    color: '#0d0d0d', background: '#f9f8f6', outline: 'none',
  }

  const labelStyle = {
    display: 'block' as const, fontSize: '12px', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: '#3a3a3a', marginBottom: '0.4rem',
  }

  const sectionStyle = {
    background: '#ffffff', border: '1px solid #e8e6e2',
    borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard',   href: '/vendor' },
            { label: 'Products',    href: '/vendor/products' },
            { label: 'Affiliates',  href: '/vendor/affiliates' },
            { label: 'Conversions', href: '/vendor/conversions' },
            { label: 'Settings',    href: '/vendor/settings', active: true },
          ].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'V'}
          </div>
          <button onClick={handleSignOut} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Settings</h1>
        </div>

        {/* Profile */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input style={inputStyle} type="text" value={profile?.full_name ?? ''} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <input style={inputStyle} type="text" value="Vendor" readOnly />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Subscription</div>

          {profile?.stripe_onboarded ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#16a34a' }}>Active subscription</span>
              </div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                Manage your subscription, update your payment method, or cancel your plan through the Stripe billing portal.
              </p>
              <button
                onClick={openBillingPortal}
                disabled={portalLoading}
                style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: portalLoading ? '#888' : '#0d0d0d', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '3px', cursor: portalLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {portalLoading ? 'Opening...' : 'Manage billing →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#888' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#888' }}>No active subscription</span>
              </div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                Subscribe to list your products and start reaching affiliates.
              </p>
              <Link href="/pricing" style={{ display: 'inline-block', fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.65rem 1.5rem', borderRadius: '3px', textDecoration: 'none' }}>
                View pricing →
              </Link>
            </div>
          )}
        </div>

        {/* Postback snippet */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>Conversion tracking snippet</div>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            Add this snippet to your checkout confirmation / thank-you page to track affiliate sales automatically.
          </p>
          <div style={{ background: '#0d0d0d', borderRadius: '3px', padding: '1.25rem', fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, overflowX: 'auto' as const }}>
            {`<!-- UGCAffiliates Tracking -->
<script>
(function() {
  var ref = document.cookie.split('; ')
    .find(function(r){ return r.startsWith('ugca_ref=') })
  if (!ref) return
  var code = ref.split('=')[1]
  fetch('https://ugcaffiliates.com/api/postback'
    + '?ref=' + encodeURIComponent(code)
    + '&order_id=' + encodeURIComponent('{{ORDER_ID}}')
    + '&amount=' + encodeURIComponent('{{ORDER_TOTAL}}')
    + '&secret=YOUR_SECRET',
    { method: 'POST', keepalive: true }
  )
})()
</script>`}
          </div>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '0.75rem' }}>
            Replace <code style={{ background: '#f2f0ec', padding: '0.1rem 0.3rem', borderRadius: '2px' }}>YOUR_SECRET</code> with your postback secret from the platform rules table.
          </p>
        </div>

        {/* Danger zone */}
        <div style={{ ...sectionStyle, borderColor: '#fecaca' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #fecaca' }}>Account</div>
          <button
            onClick={handleSignOut}
            style={{ fontSize: '13px', fontWeight: 500, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.6rem 1.25rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}