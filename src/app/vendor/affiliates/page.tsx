// src/app/vendor/affiliates/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function VendorAffiliatesPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [actioning, setActioning] = useState<string | null>(null)

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
      if (!profile || profile.role !== 'vendor') { router.push('/login'); return }

      const { data: products } = await supabase.from('products').select('id').eq('vendor_id', session.user.id)
      const productIds = (products ?? []).map((p: any) => p.id)

      if (productIds.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from('affiliate_applications')
        .select('id, status, applied_at, reviewed_at, message, profiles!affiliate_id(id, full_name), products(id, title, commission_rate)')
        .in('product_id', productIds)
        .order('applied_at', { ascending: false })
      setApplications(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setActioning(id)
    await supabase.from('affiliate_applications').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status, reviewed_at: new Date().toISOString() } : a))
    setActioning(null)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)
  const statusColor: Record<string, string> = { pending: '#b45309', approved: '#16a34a', rejected: '#dc2626' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[{ label: 'Dashboard', href: '/vendor' }, { label: 'Products', href: '/vendor/products' }, { label: 'Affiliates', href: '/vendor/affiliates', active: true }, { label: 'Conversions', href: '/vendor/conversions' }, { label: 'Settings', href: '/vendor/settings' }].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>{n.label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Affiliates</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize' as const }}>
              {f} ({f === 'all' ? applications.length : applications.filter(a => a.status === f).length})
            </button>
          ))}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No applications yet</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Affiliates will appear here once they apply to promote your products.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e8e6e2', background: '#f9f8f6' }}>
                {['Affiliate', 'Product', 'Applied', 'Status', 'Action'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' }}>{h}</div>
                ))}
              </div>
              {filtered.map(a => {
                const affiliate = a.profiles as any
                const product = a.products as any
                const date = new Date(a.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const isActioning = actioning === a.id
                return (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{affiliate?.full_name?.charAt(0)?.toUpperCase() ?? '?'}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{affiliate?.full_name ?? 'Unknown'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{product?.title ?? '—'}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{product ? `${(product.commission_rate * 100).toFixed(0)}% commission` : ''}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{date}</div>
                    <div><span style={{ fontSize: '12px', color: statusColor[a.status], fontWeight: 500, textTransform: 'capitalize' as const }}>{a.status}</span></div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {a.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(a.id, 'approved')} disabled={isActioning} style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Approve</button>
                          <button onClick={() => handleAction(a.id, 'rejected')} disabled={isActioning} style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Decline</button>
                        </>
                      )}
                      {a.status === 'approved' && <button onClick={() => handleAction(a.id, 'rejected')} disabled={isActioning} style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Revoke</button>}
                      {a.status === 'rejected' && <button onClick={() => handleAction(a.id, 'approved')} disabled={isActioning} style={{ fontSize: '12px', color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Re-approve</button>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}