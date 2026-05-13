// src/app/affiliate/links/page.tsx
// Schema aligned: code, click_count, conversion_count, total_sales

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import AffiliateNav from '@/components/AffiliateNav'

export const dynamic = 'force-dynamic'

export default function AffiliateLinksPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('A')
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'affiliate') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'A')

      const { data } = await supabase
        .from('affiliate_links')
        .select(`
          id,
          code,
          click_count,
          conversion_count,
          total_sales,
          commission_rate,
          is_active,
          created_at,
          products (
            title,
            commission_rate,
            price,
            product_url,
            profiles!vendor_id (full_name)
          )
        `)
        .eq('affiliate_id', session.user.id)
        .eq('is_active', true)
        .order('total_sales', { ascending: false })

      setLinks(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function copyLink(code: string, id: string) {
    const url = `https://ugcaffiliates.com/go/${code}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const totalClicks  = links.reduce((s, l) => s + (l.click_count ?? 0), 0)
  const totalEarned  = links.reduce((s, l) => s + (l.total_sales ?? 0) * ((l.commission_rate ?? 20) / 100), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .al-content { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem; }
        .al-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .al-link-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .al-content { padding: 1.25rem 1rem; }
          .al-link-stats { gap: 1rem; }
        }
        @media (max-width: 480px) {
          .al-stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <AffiliateNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="al-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>My links</h1>
        </div>

        <div className="al-stat-grid">
          {[
            { label: 'Active links',  value: links.length.toString() },
            { label: 'Total clicks',  value: totalClicks.toLocaleString() },
            { label: 'Total earned',  value: `$${totalEarned.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* How to use section */}
        <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>How to promote</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>
            Copy your unique link below and share it anywhere — TikTok bio, Instagram link-in-bio, YouTube description, email, or direct message. When someone clicks your link and buys, you earn your commission automatically. Your cookie window keeps you credited for purchases made within the window, even if they don't buy immediately.
          </p>
        </div>

        {links.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.75rem' }}>No links yet</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Apply to promote products from the marketplace to get your unique tracked links.</p>
            <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6e2' }}>
            {links.map(link => {
              const product = link.products as any
              const vendor  = product?.profiles as any
              const shortUrl = `https://ugcaffiliates.com/go/${link.code}`
              const convRate = link.click_count > 0
                ? ((link.conversion_count / link.click_count) * 100).toFixed(1)
                : '0.0'
              const earned = ((link.total_sales ?? 0) * ((link.commission_rate ?? 20) / 100)).toFixed(2)

              return (
                <div key={link.id} style={{ background: '#ffffff', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{product?.title ?? 'Product'}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {vendor?.full_name ?? 'Vendor'} · {link.commission_rate ?? (product?.commission_rate > 1 ? product.commission_rate : Math.round(product?.commission_rate * 100))}% commission · ${product?.price ?? 0} product
                      </div>
                    </div>
                    <a href={product?.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#888', textDecoration: 'underline', flexShrink: 0 }}>
                      View product →
                    </a>
                  </div>

                  {/* Link copy row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f9f8f6', padding: '0.75rem 1rem', borderRadius: '3px', marginBottom: '1rem' }}>
                    <code style={{ flex: 1, fontSize: '12.5px', color: '#0d0d0d', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortUrl}
                    </code>
                    <button
                      onClick={() => copyLink(link.code, link.id)}
                      style={{ fontSize: '12px', fontWeight: 600, color: copied === link.id ? '#16a34a' : '#0d0d0d', background: '#ffffff', border: '1px solid #e8e6e2', padding: '0.35rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      {copied === link.id ? '✓ Copied!' : 'Copy link'}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="al-link-stats">
                    {[
                      { label: 'Clicks',      value: (link.click_count ?? 0).toLocaleString() },
                      { label: 'Conversions', value: (link.conversion_count ?? 0).toString() },
                      { label: 'Conv. rate',  value: `${convRate}%` },
                      { label: 'Earned',      value: `$${earned}` },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{s.label}</div>
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