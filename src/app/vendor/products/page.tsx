// src/app/vendor/products/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

export default function VendorProductsPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('V')
  const [products, setProducts] = useState<any[]>([])
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
      if (!res.ok) { router.push('/login'); return }
      const { profile } = await res.json()
      if (!profile || profile.role !== 'vendor') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      const { data: p } = await supabase
        .from('products')
        .select('id, title, status, commission_rate, price, total_conversions, total_revenue, category, created_at, auto_approve')
        .eq('vendor_id', session.user.id)
        .order('created_at', { ascending: false })
      setProducts(p ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    await supabase.from('products').update({ status: next }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: next } : p))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const statusColor: Record<string, string> = { active: '#16a34a', paused: '#888', draft: '#b45309', rejected: '#dc2626' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .vp-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }
        .vp-table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .vp-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        @media (max-width: 768px) {
          .vp-content { padding: 1.25rem 1rem; }
          .vp-table-header { grid-template-columns: 2fr 1fr; padding: 0.75rem 1rem; }
          .vp-table-header > div:nth-child(n+3) { display: none; }
          .vp-table-row { grid-template-columns: 2fr 1fr; padding: 0.85rem 1rem; gap: 0.5rem; }
          .vp-table-row > div:nth-child(2),
          .vp-table-row > div:nth-child(3),
          .vp-table-row > div:nth-child(4) { display: none; }
          .vp-table-row > div:nth-child(5) { font-size: 11px !important; }
        }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="vp-content">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Your products</h1>
          </div>
          <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none', background: '#ffffff', whiteSpace: 'nowrap' }}>
            + List a new product
          </Link>
        </div>

        {products.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888', marginBottom: '0.75rem' }}>No products yet</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>List your first product and start getting affiliates to promote it.</p>
            <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.5rem', borderRadius: '3px', textDecoration: 'none' }}>
              List a product
            </Link>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
              <div className="vp-table-header">
                {['Product', 'Category', 'Price', 'Commission', 'Sales', 'Status'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
                ))}
              </div>
              {products.map(p => (
                <div key={p.id} className="vp-table-row">
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.2rem' }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/vendor/products/${p.id}/edit`} style={{ fontSize: '11px', color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Edit</Link>
                      <span style={{ fontSize: '11px', color: '#e8e6e2' }}>·</span>
                      <button onClick={() => toggleStatus(p.id, p.status)} style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 0, fontFamily: 'inherit' }}>
                        {p.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#3a3a3a' }}>{p.category}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>${p.price}</div>
                  <div style={{ fontSize: '13px', color: '#3a3a3a' }}>{(p.commission_rate * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: '13px', color: '#3a3a3a' }}>
                    <div>{p.total_conversions ?? 0} sales</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>${(p.total_revenue ?? 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor[p.status] ?? '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: statusColor[p.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}