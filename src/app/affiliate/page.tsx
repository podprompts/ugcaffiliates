// src/app/affiliate/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function AffiliateDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [conversions, setConversions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    // Fetch profile via API route using service role
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (!res.ok) { router.push('/login'); return }
    const { profile: prof } = await res.json()
    if (!prof || prof.role !== 'affiliate') { router.push('/login'); return }
    setProfile(prof)

    // Fetch links and conversions using session
    const { data: l } = await supabase
      .from('affiliate_links')
      .select('id, total_clicks, total_conversions, total_earned, tracking_code, short_url, products(title, commission_rate, price)')
      .eq('affiliate_id', session.user.id)
      .order('total_earned', { ascending: false })
    setLinks(l ?? [])

    const { data: c } = await supabase
      .from('conversions')
      .select('id, sale_amount, commission_amount, status, converted_at, products(title)')
      .eq('affiliate_id', session.user.id)
      .order('converted_at', { ascending: false })
      .limit(8)
    setConversions(c ?? [])

    setLoading(false)
  }
  load()
}, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const totalClicks      = links.reduce((s, l) => s + (l.total_clicks ?? 0), 0)
  const totalConversions = links.reduce((s, l) => s + (l.total_conversions ?? 0), 0)
  const totalEarned      = links.reduce((s, l) => s + (l.total_earned ?? 0), 0)
  const convRate         = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'

  const statCards = [
    { label: 'Total clicks',    value: totalClicks.toLocaleString() },
    { label: 'Conversions',     value: totalConversions.toLocaleString() },
    { label: 'Conv. rate',      value: `${convRate}%` },
    { label: 'Total earned',    value: `$${totalEarned.toFixed(2)}` },
    { label: 'Active products', value: links.length.toString() },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard', href: '/affiliate', active: true },
            { label: 'My Links',  href: '/affiliate/links' },
            { label: 'Products',  href: '/affiliate/products' },
            { label: 'Earnings',  href: '/affiliate/earnings' },
            { label: 'Settings',  href: '/affiliate/settings' },
          ].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none' }}>
            + Find products
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3a3a3a' }}>
    {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
  </div>
  <button
    onClick={async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    }}
    style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', fontFamily: 'inherit' }}
  >
    Sign out
  </button>
</div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: '#e8e6e2', marginBottom: '2.5rem' }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>

          {/* Links */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Your affiliate links</div>
              <Link href="/affiliate/links" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {links.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.75rem' }}>No links yet</div>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Browse the marketplace and apply to promote products.</p>
                <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>
                  Browse marketplace
                </Link>
              </div>
            ) : links.slice(0, 6).map(link => {
              const product = link.products as any
              return (
                <div key={link.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{product?.title ?? 'Product'}</div>
                    <div style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{link.short_url ?? `ugcaffiliates.com/go/${link.tracking_code}`}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>{link.total_clicks ?? 0} clicks</div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>${(link.total_earned ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conversions */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Recent conversions</div>
              <Link href="/affiliate/earnings" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {conversions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No conversions yet</div>
                <p style={{ fontSize: '13px', color: '#888' }}>Start sharing your links to earn commissions.</p>
              </div>
            ) : conversions.map(c => {
              const product = c.products as any
              const date = new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={c.id} style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{product?.title ?? 'Product'}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '0.15rem' }}>{date}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>${c.commission_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: c.status === 'paid' ? '#16a34a' : '#888', fontWeight: 500, textTransform: 'capitalize' as const }}>{c.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}