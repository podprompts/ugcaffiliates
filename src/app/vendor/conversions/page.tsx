'use client'

// src/app/vendor/conversions/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Resend } from 'resend'
import VendorNav from '@/components/VendorNav'

type ConversionStatus = 'pending' | 'approved' | 'paid' | 'disputed'

interface Conversion {
  id: string
  order_id: string
  sale_amount: number
  commission_rate: number
  commission_amount: number
  platform_fee: number
  status: ConversionStatus
  source: 'pixel' | 'stripe' | null
  converted_at: string
  affiliate_name: string | null
  product_title: string | null
}

const STATUS_TABS: { key: ConversionStatus | 'all'; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'paid',     label: 'Paid'     },
  { key: 'disputed', label: 'Disputed' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const dynamic = 'force-dynamic'

export default function VendorConversionsPage() {
  const router   = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [conversions, setConversions]     = useState<Conversion[]>([])
  const [tab, setTab]                     = useState<ConversionStatus | 'all'>('pending')
  const [loading, setLoading]             = useState(true)
  const [busy, setBusy]                   = useState<string | null>(null)
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null)
  const [profileInitial, setProfileInitial] = useState('V')
  const [vendorId, setVendorId]           = useState<string | null>(null)
  const [vendorName, setVendorName]       = useState<string>('')
  const [session, setSession]             = useState<any>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    async function init() {
      const { data: { session: sess } } = await supabase.auth.getSession()
      if (!sess) { router.push('/login'); return }
      setSession(sess)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', sess.user.id)
        .single()

      // Allow vendor OR admin
      if (!profile || !['vendor', 'admin'].includes(profile.role)) {
        router.push('/')
        return
      }

      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')
      setVendorName(profile.full_name ?? '')
      setVendorId(sess.user.id)
      fetchConversions(sess.user.id)
    }
    init()
  }, [])

  const fetchConversions = useCallback(async (vid?: string) => {
    setLoading(true)

    let query = supabase
      .from('conversions')
      .select(`
        id, order_id, sale_amount, commission_rate, commission_amount,
        platform_fee, status, source, converted_at,
        profiles!affiliate_id ( full_name ),
        products ( title )
      `)
      .order('converted_at', { ascending: false })

    if (vid) query = query.eq('vendor_id', vid)

    const { data, error } = await query

    if (!error && data) {
      setConversions(
        data.map((r: any) => ({
          ...r,
          affiliate_name: r.profiles?.full_name ?? null,
          product_title:  r.products?.title     ?? null,
        }))
      )
    }
    setLoading(false)
  }, [supabase])

  const updateStatus = async (id: string, status: ConversionStatus) => {
    setBusy(id + status)

    const { error } = await supabase
      .from('conversions')
      .update({ status, ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}) })
      .eq('id', id)

    if (!error) {
      setConversions(prev => prev.map(c => c.id === id ? { ...c, status } : c))

      // When vendor marks paid → email admin for platform fee invoice
      if (status === 'paid') {
        const conv = conversions.find(c => c.id === id)
        if (conv && session) {
          fetch('/api/vendor/notify-paid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              conversion_id:     conv.id,
              order_id:          conv.order_id,
              sale_amount:       conv.sale_amount,
              commission_amount: conv.commission_amount,
              platform_fee:      conv.platform_fee,
              affiliate_name:    conv.affiliate_name,
              product_title:     conv.product_title,
              vendor_name:       vendorName,
            }),
          }).catch(() => {})
        }
      }

      showToast(
        status === 'approved' ? 'Sale approved — affiliate notified.' :
        status === 'paid'     ? 'Marked as paid. Platform fee invoice sent.' :
                                'Sale disputed.',
        true
      )
    } else {
      showToast('Something went wrong.', false)
    }
    setBusy(null)
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const filtered = tab === 'all' ? conversions : conversions.filter(c => c.status === tab)

  const stats = {
    pendingCount: conversions.filter(c => c.status === 'pending').length,
    owedTotal:    conversions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commission_amount, 0),
    paidTotal:    conversions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0),
    gmv:          conversions.filter(c => ['approved','paid'].includes(c.status)).reduce((s, c) => s + c.sale_amount, 0),
    platformFeeOwed: conversions.filter(c => c.status === 'approved').reduce((s, c) => s + c.platform_fee, 0),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .vc-content  { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        .vc-stats    { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .vc-stat     { background: #f9f8f6; padding: 1.25rem 1.5rem; }
        .vc-tabs     { display: flex; gap: 0.25rem; border-bottom: 1px solid #e8e6e2; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .vc-tab      { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.6rem 1rem; cursor: pointer; font-size: 0.875rem; color: #888; font-family: var(--font-dm-sans), sans-serif; transition: all 0.15s; }
        .vc-tab.active { color: #1a1a1a; border-bottom-color: #0d0d0d; font-weight: 600; }
        .vc-table-wrap { border: 1px solid #e8e6e2; border-radius: 8px; overflow-x: auto; }
        .vc-table    { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .vc-th       { text-align: left; padding: 0.75rem 1rem; background: #f9f8f6; color: #888; font-weight: 500; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e8e6e2; white-space: nowrap; }
        .vc-tr       { border-bottom: 1px solid #f0ece6; }
        .vc-tr:hover { background: #faf9f7; }
        .vc-td       { padding: 0.875rem 1rem; vertical-align: middle; }
        .vc-pill     { display: inline-block; padding: 2px 9px; border-radius: 12px; font-size: 0.73rem; font-weight: 500; }
        .vc-btn      { border: none; border-radius: 4px; color: #fff; padding: 0.3rem 0.75rem; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; font-family: var(--font-dm-sans), sans-serif; }
        .vc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .vc-actions  { display: flex; gap: 0.35rem; align-items: center; }
        @media (max-width: 900px) {
          .vc-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .vc-content { padding: 1.25rem 1rem; }
          .vc-stats   { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: toast.ok ? '#0d0d0d' : '#7f1d1d', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 6, fontSize: '0.875rem', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="vc-content">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Conversions</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '0.3rem' }}>Review, approve, and pay your affiliates.</p>
          </div>
          <button onClick={() => vendorId && fetchConversions(vendorId)}
            style={{ background: 'transparent', border: '1px solid #e8e6e2', borderRadius: 4, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '13px', color: '#888', fontFamily: 'inherit' }}>
            ↻ Refresh
          </button>
        </div>

        {/* Platform fee notice if there are approved conversions */}
        {stats.platformFeeOwed > 0 && (
          <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Platform fee due to UGCA: <strong>{fmt(stats.platformFeeOwed)}</strong> — payable after you mark commissions as paid.</span>
          </div>
        )}

        {/* Stats */}
        <div className="vc-stats">
          {[
            { label: 'Pending Approval',   value: String(stats.pendingCount), color: '#b45309' },
            { label: 'Commissions Owed',   value: fmt(stats.owedTotal),       color: '#dc2626' },
            { label: 'Platform Fee Owed',  value: fmt(stats.platformFeeOwed), color: '#7c3aed' },
            { label: 'Commissions Paid',   value: fmt(stats.paidTotal),       color: '#16a34a' },
            { label: 'Confirmed GMV',      value: fmt(stats.gmv),             color: '#0d0d0d' },
          ].map(s => (
            <div key={s.label} className="vc-stat" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="vc-tabs">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`vc-tab${tab === t.key ? ' active' : ''}`}>
              {t.label}
              {t.key === 'pending' && stats.pendingCount > 0 && (
                <span style={{ background: '#0d0d0d', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.68rem', marginLeft: 6 }}>
                  {stats.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '3rem', fontSize: '13px' }}>
            No {tab === 'all' ? '' : tab} conversions yet.
          </div>
        ) : (
          <div className="vc-table-wrap">
            <table className="vc-table">
              <thead>
                <tr>
                  {['Product', 'Affiliate', 'Sale', 'Commission', 'Platform Fee', 'Source', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="vc-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="vc-tr">
                    <td className="vc-td" style={{ fontWeight: 500 }}>{c.product_title ?? '—'}</td>
                    <td className="vc-td" style={{ color: '#555' }}>{c.affiliate_name ?? '—'}</td>
                    <td className="vc-td" style={{ fontFamily: 'monospace' }}>{fmt(c.sale_amount)}</td>
                    <td className="vc-td" style={{ fontFamily: 'monospace', color: '#16a34a', fontWeight: 600 }}>{fmt(c.commission_amount)}</td>
                    <td className="vc-td" style={{ fontFamily: 'monospace', color: '#7c3aed', fontSize: '12px' }}>{fmt(c.platform_fee)}</td>
                    <td className="vc-td">
                      <span className="vc-pill" style={sourceStyle(c.source)}>
                        {c.source === 'stripe' ? '⚡ Stripe' : c.source === 'pixel' ? '◎ Pixel' : '—'}
                      </span>
                    </td>
                    <td className="vc-td" style={{ whiteSpace: 'nowrap', color: '#666', fontSize: '12px' }}>{fmtDate(c.converted_at)}</td>
                    <td className="vc-td">
                      <span className="vc-pill" style={statusStyle(c.status)}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="vc-td">
                      <div className="vc-actions">
                        {c.status === 'pending' && (
                          <>
                            <button className="vc-btn" style={{ background: '#16a34a' }} disabled={busy === c.id + 'approved'} onClick={() => updateStatus(c.id, 'approved')}>
                              {busy === c.id + 'approved' ? '…' : 'Approve'}
                            </button>
                            <button className="vc-btn" style={{ background: '#888' }} disabled={busy === c.id + 'disputed'} onClick={() => updateStatus(c.id, 'disputed')}>
                              {busy === c.id + 'disputed' ? '…' : 'Dispute'}
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button className="vc-btn" style={{ background: '#0d0d0d' }} disabled={busy === c.id + 'paid'} onClick={() => updateStatus(c.id, 'paid')}>
                            {busy === c.id + 'paid' ? '…' : 'Mark Paid'}
                          </button>
                        )}
                        {(c.status === 'paid' || c.status === 'disputed') && (
                          <span style={{ color: '#ccc', fontSize: '13px' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function statusStyle(status: ConversionStatus): React.CSSProperties {
  const map: Record<ConversionStatus, React.CSSProperties> = {
    pending:  { background: '#fef9ec', color: '#b45309' },
    approved: { background: '#f0fdf4', color: '#16a34a' },
    disputed: { background: '#fef2f2', color: '#dc2626' },
    paid:     { background: '#eff6ff', color: '#2563eb' },
  }
  return map[status]
}

function sourceStyle(source: string | null): React.CSSProperties {
  if (source === 'stripe') return { background: '#f0fdf4', color: '#16a34a' }
  if (source === 'pixel')  return { background: '#fef9ec', color: '#b45309' }
  return { background: '#f2f0ec', color: '#888' }
}