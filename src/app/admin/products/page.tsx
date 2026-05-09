// src/app/admin/products/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all')

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
      if (!profile || profile.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase
        .from('products')
        .select('id, title, status, commission_rate, price, category, total_conversions, total_revenue, created_at, profiles!vendor_id(full_name)')
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function setStatus(id: string, status: string) {
    await supabase.from('products').update({ status }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  const filtered = filter === 'all' ? products : products.filter(p => p.status === filter)
  const statusColor: Record<string, string> = { active: '#16a34a', paused: '#888', draft: '#b45309', rejected: '#dc2626' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#0d0d0d', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#ffffff' }}>U G C A</Link>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginLeft: '1rem', background: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '3px' }}>Admin</span>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[{ label: 'Overview', href: '/admin' }, { label: 'Users', href: '/admin/users' }, { label: 'Products', href: '/admin/products', active: true }, { label: 'Conversions', href: '/admin/conversions' }, { label: 'Rules', href: '/admin/rules' }].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? 'rgba(255,255,255,0.1)' : 'transparent', color: n.active ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>{n.label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Products</h1>
          <div style={{ fontSize: '13px', color: '#888' }}>{products.length} total products</div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {(['all', 'active', 'paused', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize' as const }}>
              {f} ({f === 'all' ? products.length : products.filter(p => p.status === f).length})
            </button>
          ))}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e8e6e2', background: '#f9f8f6' }}>
            {['Product', 'Vendor', 'Category', 'Commission', 'Sales', 'Status'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' }}>{h}</div>
            ))}
          </div>
          {filtered.map(p => {
            const vendor = p.profiles as any
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, paddingRight: '1rem' }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{vendor?.full_name ?? '—'}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{p.category}</div>
                <div style={{ fontSize: '13px' }}>{(p.commission_rate * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{p.total_conversions ?? 0} · ${(p.total_revenue ?? 0).toFixed(0)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor[p.status] ?? '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: statusColor[p.status], fontWeight: 500, textTransform: 'capitalize' as const }}>{p.status}</span>
                  <button onClick={() => setStatus(p.id, p.status === 'active' ? 'paused' : 'active')} style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                    {p.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  {p.status !== 'rejected' && <button onClick={() => setStatus(p.id, 'rejected')} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Remove</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}