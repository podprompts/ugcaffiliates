// src/app/affiliate/products/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import AffiliateNav from '@/components/AffiliateNav'

export const dynamic = 'force-dynamic'

export default function AffiliateProductsPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('A')
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        .from('affiliate_applications')
        .select('id, status, applied_at, products(id, title, commission_rate, price, category, product_url, profiles!vendor_id(full_name))')
        .eq('affiliate_id', session.user.id)
        .order('applied_at', { ascending: false })
      setApplications(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const approved = applications.filter(a => a.status === 'approved')
  const pending = applications.filter(a => a.status === 'pending')

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ap-content { max-width: 900px; margin: 0 auto; padding: 2.5rem 2rem; }
        .ap-card { background: #ffffff; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
        @media (max-width: 768px) {
          .ap-content { padding: 1.25rem 1rem; }
          .ap-card { flex-direction: column; align-items: flex-start; }
          .ap-card a, .ap-card span { align-self: flex-start; }
        }
      `}</style>

      <AffiliateNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="ap-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>My products</h1>
        </div>

        {applications.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.75rem' }}>No products yet</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Browse the marketplace and apply to promote products.</p>
            <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {approved.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16a34a', marginBottom: '0.75rem' }}>Approved — ready to promote ({approved.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6e2' }}>
                  {approved.map(a => {
                    const product = a.products as any
                    const vendor = product?.profiles as any
                    return (
                      <div key={a.id} className="ap-card">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.2rem' }}>{product?.title ?? '—'}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{vendor?.full_name ?? '—'} · {product?.category ?? ''} · {product ? `${(product.commission_rate * 100).toFixed(0)}% commission` : ''} · ${product?.price ?? 0} product</div>
                        </div>
                        <Link href="/affiliate/links" style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '3px', textDecoration: 'none', flexShrink: 0 }}>Get link →</Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.75rem' }}>Pending approval ({pending.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6e2' }}>
                  {pending.map(a => {
                    const product = a.products as any
                    const vendor = product?.profiles as any
                    return (
                      <div key={a.id} className="ap-card">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '0.2rem', color: '#888' }}>{product?.title ?? '—'}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{vendor?.full_name ?? '—'} · {product ? `${(product.commission_rate * 100).toFixed(0)}% commission` : ''}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>Awaiting approval</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}