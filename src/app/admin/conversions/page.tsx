// src/app/admin/conversions/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

export default function AdminConversionsPage() {
  const router = useRouter()
  const [conversions, setConversions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all')

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
      if (!profile || profile.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase
        .from('conversions')
        .select('id, sale_amount, commission_amount, platform_fee, status, converted_at, order_id, products(title), profiles!affiliate_id(full_name), profiles!vendor_id(full_name)')
        .order('converted_at', { ascending: false })
      setConversions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function setStatus(id: string, status: string) {
    await supabase.from('conversions').update({ status }).eq('id', id)
    setConversions(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const filtered = filter === 'all' ? conversions : conversions.filter(c => c.status === filter)
  const statusColor: Record<string, string> = { pending: '#888', approved: '#2563eb', paid: '#16a34a', disputed: '#dc2626' }
  const totalGMV = conversions.reduce((s, c) => s + c.sale_amount, 0)
  const totalFees = conversions.reduce((s, c) => s + (c.platform_fee ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ac-content { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        .ac-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .ac-filter-bar { display: flex; gap: 0.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        /* 6-col: Product | Affiliate | Sale | Commission | Fee | Status */
        .ac-table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .ac-table-row    { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        @media (max-width: 768px) {
          .ac-content { padding: 1.25rem 1rem; }
          .ac-stat-grid { grid-template-columns: repeat(2, 1fr); }
          /* Mobile: Product | Sale | Status */
          .ac-table-header { grid-template-columns: 2fr 1fr 1fr; padding: 0.75rem 1rem; }
          .ac-table-header > div:nth-child(2),
          .ac-table-header > div:nth-child(4),
          .ac-table-header > div:nth-child(5) { display: none; }
          .ac-table-row { grid-template-columns: 2fr 1fr 1fr; padding: 0.85rem 1rem; }
          .ac-table-row > div:nth-child(2),
          .ac-table-row > div:nth-child(4),
          .ac-table-row > div:nth-child(5) { display: none; }
        }
      `}</style>

      <AdminNav onSignOut={handleSignOut} />

      <div className="ac-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Conversions</h1>
        </div>

        <div className="ac-stat-grid">
          {[
            { label: 'Total GMV',         value: `$${totalGMV.toFixed(2)}` },
            { label: 'Platform fees',     value: `$${totalFees.toFixed(2)}` },
            { label: 'Total conversions', value: conversions.length.toString() },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="ac-filter-bar">
          {(['all', 'pending', 'approved', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize' }}>
              {f} ({f === 'all' ? conversions.length : conversions.filter(c => c.status === f).length})
            </button>
          ))}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', overflowX: 'auto' }}>
          <div style={{ minWidth: '600px' }}>
            <div className="ac-table-header">
              {['Product', 'Affiliate', 'Sale', 'Commission', 'Fee', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', fontSize: '13px', color: '#888' }}>No conversions yet</div>
            ) : filtered.map(c => {
              const product = c.products as any
              const affiliate = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles as any
              const date = new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={c.id} className="ac-table-row">
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{date}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{affiliate?.full_name ?? '—'}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>${c.sale_amount.toFixed(2)}</div>
                  <div style={{ fontSize: '13px' }}>${c.commission_amount.toFixed(2)}</div>
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>${(c.platform_fee ?? 0).toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: statusColor[c.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' }}>{c.status}</span>
                    {c.status === 'pending' && (
                      <button onClick={() => setStatus(c.id, 'approved')} style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Approve</button>
                    )}
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