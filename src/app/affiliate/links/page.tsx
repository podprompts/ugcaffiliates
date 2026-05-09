// src/app/affiliate/links/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function AffiliateLinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'affiliate') { router.push('/login'); return }

      const { data } = await supabase
        .from('affiliate_links')
        .select('id, tracking_code, short_url, total_clicks, total_conversions, total_earned, created_at, products(title, commission_rate, price, product_url, profiles!vendor_id(full_name))')
        .eq('affiliate_id', session.user.id)
        .order('total_earned', { ascending: false })
      setLinks(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  const totalClicks = links.reduce((s, l) => s + (l.total_clicks ?? 0), 0)
  const totalEarned = links.reduce((s, l) => s + (l.total_earned ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[{ label: 'Dashboard', href: '/affiliate' }, { label: 'My Links', href: '/affiliate/links', active: true }, { label: 'Products', href: '/affiliate/products' }, { label: 'Earnings', href: '/affiliate/earnings' }, { label: 'Settings', href: '/affiliate/settings' }].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>{n.label}</Link>
          ))}
        </div>
        <Link href="/marketplace" style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none' }}>+ Find products</Link>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>My links</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#e8e6e2', marginBottom: '2rem' }}>
          {[{ label: 'Active links', value: links.length.toString() }, { label: 'Total clicks', value: totalClicks.toLocaleString() }, { label: 'Total earned', value: `$${totalEarned.toFixed(2)}` }].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
            </div>
          ))}
        </div>
        {links.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '3rem', textAlign: 'center' as const }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.75rem' }}>No links yet</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Apply to promote products from the marketplace to get your unique tracked links.</p>
            <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px', background: '#e8e6e2' }}>
            {links.map(link => {
              const product = link.products as any
              const vendor = product?.profiles as any
              const shortUrl = link.short_url ?? `https://ugcaffiliates.com/go/${link.tracking_code}`
              const convRate = link.total_clicks > 0 ? ((link.total_conversions / link.total_clicks) * 100).toFixed(1) : '0.0'
              return (
                <div key={link.id} style={{ background: '#ffffff', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{product?.title ?? 'Product'}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{vendor?.full_name ?? 'Vendor'} · {product ? `${(product.commission_rate * 100).toFixed(0)}% commission` : ''} · ${product?.price ?? 0} product</div>
                    </div>
                    <a href={product?.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#888', textDecoration: 'underline', flexShrink: 0 }}>View product →</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f9f8f6', padding: '0.75rem 1rem', borderRadius: '3px', marginBottom: '1rem' }}>
                    <code style={{ flex: 1, fontSize: '12.5px', color: '#0d0d0d', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shortUrl}</code>
                    <button onClick={() => copyLink(shortUrl, link.id)} style={{ fontSize: '12px', fontWeight: 600, color: copied === link.id ? '#16a34a' : '#0d0d0d', background: '#ffffff', border: '1px solid #e8e6e2', padding: '0.35rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {copied === link.id ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {[{ label: 'Clicks', value: (link.total_clicks ?? 0).toLocaleString() }, { label: 'Conversions', value: (link.total_conversions ?? 0).toString() }, { label: 'Conv. rate', value: `${convRate}%` }, { label: 'Earned', value: `$${(link.total_earned ?? 0).toFixed(2)}` }].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '0.2rem' }}>{s.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}