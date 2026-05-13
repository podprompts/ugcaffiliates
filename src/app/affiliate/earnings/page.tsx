// src/app/affiliate/earnings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import AffiliateNav from '@/components/AffiliateNav'

export const dynamic = 'force-dynamic'

export default function AffiliateEarningsPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('A')
  const [conversions, setConversions] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ pending: 0, approved: 0, paid: 0, total: 0 })

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
      if (!profile || profile.role !== 'affiliate') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'A')

      const { data: c } = await supabase
        .from('conversions')
        .select('id, sale_amount, commission_amount, status, converted_at, approved_at, paid_at, products(title), profiles!vendor_id(full_name)')
        .eq('affiliate_id', session.user.id)
        .order('converted_at', { ascending: false })
      setConversions(c ?? [])

      const { data: p } = await supabase
        .from('payouts')
        .select('id, amount, status, period_start, period_end, paid_at, stripe_transfer_id')
        .eq('affiliate_id', session.user.id)
        .order('created_at', { ascending: false })
      setPayouts(p ?? [])

      const convs = c ?? []
      setSummary({
        pending:  convs.filter(x => x.status === 'pending').reduce((s: number, x: any) => s + x.commission_amount, 0),
        approved: convs.filter(x => x.status === 'approved').reduce((s: number, x: any) => s + x.commission_amount, 0),
        paid:     convs.filter(x => x.status === 'paid').reduce((s: number, x: any) => s + x.commission_amount, 0),
        total:    convs.reduce((s: number, x: any) => s + x.commission_amount, 0),
      })

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const statusColor: Record<string, string> = { pending: '#888', approved: '#2563eb', paid: '#16a34a', disputed: '#dc2626' }
  const statusLabel: Record<string, string> = { pending: 'Pending', approved: 'Approved', paid: 'Paid', disputed: 'Disputed' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .earn-content { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem; }
        .earn-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .earn-table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .earn-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        .payout-header { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .payout-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        @media (max-width: 768px) {
          .earn-content { padding: 1.25rem 1rem; }
          .earn-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .earn-table-header { grid-template-columns: 1fr 1fr; padding: 0.75rem 1rem; }
          .earn-table-header > div:nth-child(n+3) { display: none; }
          .earn-table-row { grid-template-columns: 1fr 1fr; padding: 0.85rem 1rem; }
          .earn-table-row > div:nth-child(2),
          .earn-table-row > div:nth-child(3) { display: none; }
          .payout-header { grid-template-columns: 1fr 1fr; padding: 0.75rem 1rem; }
          .payout-header > div:nth-child(n+3) { display: none; }
          .payout-row { grid-template-columns: 1fr 1fr; padding: 0.85rem 1rem; }
          .payout-row > div:nth-child(3) { display: none; }
        }
      `}</style>

      <AffiliateNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="earn-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Earnings</h1>
        </div>

        {/* Summary cards */}
        <div className="earn-stat-grid">
          {[
            { label: 'Pending review', value: `$${summary.pending.toFixed(2)}`,  sub: 'Awaiting vendor confirmation' },
            { label: 'Approved',       value: `$${summary.approved.toFixed(2)}`, sub: 'Vendor confirmed — owed to you' },
            { label: 'Total paid',     value: `$${summary.paid.toFixed(2)}`,     sub: 'Already paid out' },
            { label: 'Total earned',   value: `$${summary.total.toFixed(2)}`,    sub: 'All time' },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* How payments work */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>i</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.3rem' }}>How payments work</div>
            <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.65 }}>
              Vendors pay affiliates directly via PayPal, Venmo, bank transfer, or any agreed method. UGCA tracks every sale and shows vendors exactly what they owe you. Once a vendor marks a conversion as paid, your status updates here automatically.
            </div>
          </div>
        </div>

        {/* Conversions table */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>All conversions</div>
          </div>
          {conversions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No conversions yet</div>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Share your affiliate links to start earning commissions.</p>
              <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '560px' }}>
                <div className="earn-table-header">
                  {['Product', 'Vendor', 'Sale', 'Commission', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
                  ))}
                </div>
                {conversions.map(c => {
                  const product = c.products as any
                  const vendor = c.profiles as any
                  const date = new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div key={c.id} className="earn-table-row">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{product?.title ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '0.15rem' }}>{date}</div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#3a3a3a' }}>{vendor?.full_name ?? '—'}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>${c.sale_amount.toFixed(2)}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d' }}>${c.commission_amount.toFixed(2)}</div>
                      <div>
                        <span style={{ fontSize: '12px', color: statusColor[c.status] ?? '#888', fontWeight: 500 }}>
                          {statusLabel[c.status] ?? c.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payout history */}
        {payouts.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Payout history</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '400px' }}>
                <div className="payout-header">
                  {['Period', 'Amount', 'Status', 'Date paid'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
                  ))}
                </div>
                {payouts.map(p => (
                  <div key={p.id} className="payout-row">
                    <div style={{ fontSize: '13px', color: '#3a3a3a' }}>
                      {new Date(p.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>${p.amount.toFixed(2)}</div>
                    <div style={{ fontSize: '12px', color: p.status === 'paid' ? '#16a34a' : '#888', fontWeight: 500, textTransform: 'capitalize' }}>{p.status}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}