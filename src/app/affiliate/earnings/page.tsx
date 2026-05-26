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
  const [stripeConnected, setStripeConnected] = useState(false)
  const [session, setSession] = useState<any>(null)

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
      const { data: { session: sess } } = await supabase.auth.getSession()
      if (!sess) { router.push('/login'); return }
      setSession(sess)

      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${sess.access_token}` } })
      if (!res.ok) { router.push('/login'); return }
      const { profile } = await res.json()
      if (!profile || profile.role !== 'affiliate') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'A')

      // Check Stripe Connect status
      const connectRes = await fetch('/api/stripe/affiliate-connect', {
        headers: { Authorization: `Bearer ${sess.access_token}` }
      })
      if (connectRes.ok) {
        const connectData = await connectRes.json()
        setStripeConnected(connectData.connected && connectData.onboarded && connectData.payouts_enabled)
      }

      const { data: c } = await supabase
        .from('conversions')
        .select('id, sale_amount, commission_amount, status, converted_at, approved_at, paid_at, products(title), profiles!vendor_id(full_name)')
        .eq('affiliate_id', sess.user.id)
        .order('converted_at', { ascending: false })
      setConversions(c ?? [])

      const { data: p } = await supabase
        .from('payouts')
        .select('id, amount, status, period_start, period_end, paid_at, stripe_transfer_id')
        .eq('affiliate_id', sess.user.id)
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
        .stripe-alert { background: #fef9ec; border: 1px solid #fde68a; border-radius: 4px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; }
        .how-step { display: flex; gap: 1rem; }
        .how-step-num { width: 22px; height: 22px; border-radius: 50%; background: #0d0d0d; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
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

        {/* Stripe Connect alert — only shown if not connected */}
        {!stripeConnected && (
          <div className="stripe-alert">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '0.3rem' }}>
                Action required — connect your Stripe account to receive payouts
              </div>
              <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                Your commissions are being tracked but you won't receive any payments until your Stripe account is connected and verified. This takes about 2 minutes.
              </div>
              <Link href="/affiliate/settings" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#92400e', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none', display: 'inline-block' }}>
                Connect Stripe account →
              </Link>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="earn-stat-grid">
          {[
            { label: 'Pending review', value: `$${summary.pending.toFixed(2)}`,  sub: 'Auto-advances to approved after 7 days' },
            { label: 'Approved',       value: `$${summary.approved.toFixed(2)}`, sub: 'Vendor clicks Approve & Pay to release' },
            { label: 'Total paid',     value: `$${summary.paid.toFixed(2)}`,     sub: 'Deposited to your account' },
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
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>How payouts work</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              {
                title: 'You drive a sale',
                desc: 'A customer clicks your tracked link, lands on the vendor\'s product page, and completes a purchase. The sale is recorded automatically via server-side postback.',
              },
              {
                title: 'Sale sits in Pending for 7 days',
                desc: 'Every new conversion starts as Pending — this is a hold period to allow for refunds or disputes. After 7 days it automatically advances to Approved, or the vendor can approve it earlier.',
              },
              {
                title: 'Vendor clicks Approve & Pay',
                desc: 'Once approved, the vendor clicks "Approve & Pay" in their dashboard. Their saved card is charged the commission amount plus the 10% UGCA platform fee in a single transaction.',
              },
              {
                title: 'Stripe sends your commission automatically',
                desc: 'The moment the vendor\'s card is charged, your commission is transferred directly to your connected Stripe account — no manual requests, no waiting on the vendor to send funds separately.',
              },
              {
                title: 'Funds arrive in 2–7 business days',
                desc: 'Stripe deposits the commission into your linked bank account within 2–7 business days depending on your bank and country.',
              },
            ].map((step, i) => (
              <div key={i} className="how-step">
                <div className="how-step-num">{i + 1}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{step.title}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ borderTop: '1px solid #e8e6e2', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'Do I need to do anything to get paid?',
                a: 'Just make sure your Stripe account is connected under Settings. Once connected, all approved commissions are deposited automatically — no action needed on your end.',
              },
              {
                q: 'What currency will I be paid in?',
                a: 'Payouts are processed in USD. Stripe will convert to your local currency if your bank account is in a different currency, at the exchange rate at time of transfer.',
              },
              {
                q: 'Is there a minimum payout threshold?',
                a: 'No minimum — every approved commission is paid out individually as soon as the vendor approves it.',
              },
              {
                q: 'What if a sale is refunded?',
                a: 'If a vendor issues a refund and disputes a conversion, the commission status will update to Disputed. Commission on refunded sales is not owed.',
              },
              {
                q: 'Why is my commission still showing as Pending?',
                a: 'All new conversions sit in Pending for 7 days as a hold period for refunds or disputes. After 7 days the status automatically advances to Approved — no action needed from you or the vendor. If it\'s been more than 7 days and it hasn\'t moved, contact support.',
              },
            ].map((item, i) => (
              <div key={i} style={{ borderBottom: i < 4 ? '1px solid #f2f0ec' : 'none', paddingBottom: i < 4 ? '1rem' : 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.3rem' }}>{item.q}</div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
            All payments are processed securely by Stripe. UGCA never holds your funds.
          </div>
        </div>

        {/* Stripe Connect status */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stripeConnected ? '#16a34a' : '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d' }}>
                {stripeConnected ? 'Stripe account connected' : 'Stripe account not connected'}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                {stripeConnected
                  ? 'You\'ll receive automatic payouts when vendors approve your conversions.'
                  : 'Connect your Stripe account to receive commission payouts automatically.'}
              </div>
            </div>
          </div>
          <Link href="/affiliate/settings" style={{ fontSize: '12px', fontWeight: 600, color: stripeConnected ? '#888' : '#ffffff', background: stripeConnected ? 'none' : '#0d0d0d', border: stripeConnected ? '1px solid #e8e6e2' : 'none', padding: '0.5rem 1.1rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
            {stripeConnected ? 'Manage account' : 'Connect Stripe →'}
          </Link>
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
                        {c.status === 'paid' && c.paid_at && (
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                            {new Date(c.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
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
                    <div style={{ fontSize: '13px', color: '#888' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {p.stripe_transfer_id && (
                        <div style={{ fontSize: '10px', color: '#b5a99a', marginTop: '2px', fontFamily: 'monospace' }}>{p.stripe_transfer_id.slice(0, 16)}…</div>
                      )}
                    </div>
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