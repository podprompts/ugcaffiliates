// src/app/vendor/conversions/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function VendorConversionsPage() {
  const router = useRouter()
  const [conversions, setConversions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all')

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
      const { profile } = await res.json()
      if (!profile || profile.role !== 'vendor') { router.push('/login'); return }

      const { data: c } = await supabase
        .from('conversions')
        .select('id, sale_amount, commission_amount, platform_fee, status, converted_at, paid_at, order_id, products(title), profiles!affiliate_id(full_name)')
        .eq('vendor_id', session.user.id)
        .order('converted_at', { ascending: false })
      setConversions(c ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function markAsPaid(id: string) {
    setMarking(id)
    const { error } = await supabase
      .from('conversions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setConversions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c))
    }
    setMarking(null)
  }

  async function markAsApproved(id: string) {
    setMarking(id)
    const { error } = await supabase
      .from('conversions')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setConversions(prev => prev.map(c => c.id === id ? { ...c, status: 'approved', approved_at: new Date().toISOString() } : c))
    }
    setMarking(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const filtered = filter === 'all' ? conversions : conversions.filter(c => c.status === filter)

  const totalOwed = conversions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commission_amount, 0)
  const totalPaid = conversions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0)
  const totalSales = conversions.reduce((s, c) => s + c.sale_amount, 0)

  const statusColor: Record<string, string> = {
    pending: '#888', approved: '#2563eb', paid: '#16a34a', disputed: '#dc2626'
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
            { label: 'Conversions', href: '/vendor/conversions', active: true },
            { label: 'Settings',    href: '/vendor/settings' },
          ].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Sales & conversions</h1>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#e8e6e2', marginBottom: '2rem' }}>
          {[
            { label: 'Total sales revenue', value: `$${totalSales.toFixed(2)}`, sub: `${conversions.length} total conversions` },
            { label: 'Commissions owed',    value: `$${totalOwed.toFixed(2)}`,  sub: 'Approved — pay these affiliates' },
            { label: 'Commissions paid',    value: `$${totalPaid.toFixed(2)}`,  sub: 'Already paid out' },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* How to pay notice */}
        {totalOwed > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.65 }}>
              <strong>You owe ${totalOwed.toFixed(2)} in affiliate commissions.</strong> Pay affiliates directly via PayPal, Venmo, bank transfer, or any agreed method. Then click "Mark as paid" on each conversion below to update their dashboard.
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {(['all', 'pending', 'approved', 'paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem',
                borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f ? '#0d0d0d' : '#ffffff',
                color: filter === f ? '#ffffff' : '#888',
                textTransform: 'capitalize' as const,
              }}
            >
              {f} {f === 'all' ? `(${conversions.length})` : `(${conversions.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Conversions table */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No conversions yet</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Sales will appear here once affiliates start driving conversions.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e8e6e2', background: '#f9f8f6' }}>
                {['Product / Affiliate', 'Order ID', 'Sale', 'Commission', 'Status', 'Action'].map(h => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' }}>{h}</div>
                ))}
              </div>
              {filtered.map(c => {
                const product   = c.products as any
                const affiliate = c.profiles as any
                const date = new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const isMarking = marking === c.id

                return (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{product?.title ?? '—'}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '0.15rem' }}>{affiliate?.full_name ?? '—'} · {date}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.order_id?.substring(0, 12) ?? '—'}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>${c.sale_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d' }}>${c.commission_amount.toFixed(2)}</div>
                    <div>
                      <span style={{ fontSize: '12px', color: statusColor[c.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' as const }}>{c.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {c.status === 'pending' && (
                        <button
                          onClick={() => markAsApproved(c.id)}
                          disabled={isMarking}
                          style={{ fontSize: '11.5px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.3rem 0.65rem', borderRadius: '3px', cursor: isMarking ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isMarking ? 0.6 : 1 }}
                        >
                          Approve
                        </button>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => markAsPaid(c.id)}
                          disabled={isMarking}
                          style={{ fontSize: '11.5px', fontWeight: 600, color: '#ffffff', background: isMarking ? '#888' : '#16a34a', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '3px', cursor: isMarking ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                        >
                          {isMarking ? '...' : 'Mark as paid'}
                        </button>
                      )}
                      {c.status === 'paid' && (
                        <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 500 }}>
                          Paid {c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      )}
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