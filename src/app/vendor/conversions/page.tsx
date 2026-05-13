'use client'

// src/app/vendor/conversions/page.tsx
// Drop into your existing /vendor layout.
// Matches your patterns: @supabase/ssr, profiles table, converted_at, approved/disputed statuses.

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export default function VendorConversionsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [conversions, setConversions] = useState<Conversion[]>([])
  const [tab, setTab]                 = useState<ConversionStatus | 'all'>('pending')
  const [loading, setLoading]         = useState(true)
  const [busy, setBusy]               = useState<string | null>(null)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)

  // ── Auth guard ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'vendor') {
        router.push('/')
        return
      }

      fetchConversions(session.user.id)
    }
    checkAuth()
  }, [])

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchConversions = useCallback(async (vendorId?: string) => {
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

    if (vendorId) query = query.eq('vendor_id', vendorId)

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

  // ── Status update ─────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: ConversionStatus) => {
    setBusy(id + status)
    const { error } = await supabase
      .from('conversions')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setConversions(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      showToast(
        status === 'approved' ? 'Sale approved — affiliate notified.' :
        status === 'paid'     ? 'Marked as paid.'                     :
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
    setTimeout(() => setToast(null), 3500)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = tab === 'all' ? conversions : conversions.filter(c => c.status === tab)

  const stats = {
    pendingCount: conversions.filter(c => c.status === 'pending').length,
    owedTotal:    conversions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commission_amount, 0),
    paidTotal:    conversions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0),
    gmv:          conversions.filter(c => ['approved','paid'].includes(c.status)).reduce((s, c) => s + c.sale_amount, 0),
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .vc-content  { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        .vc-stats    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .vc-stat     { background: #f9f8f6; padding: 1.25rem 1.5rem; }
        .vc-tabs     { display: flex; gap: 0.25rem; border-bottom: 1px solid #e8e6e2; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .vc-tab      { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.6rem 1rem; cursor: pointer; font-size: 0.875rem; color: #888; font-family: var(--font-dm-sans), sans-serif; transition: all 0.15s; }
        .vc-tab.active { color: #1a1a1a; border-bottom-color: #b8860b; font-weight: 600; }
        .vc-table-wrap { border: 1px solid #e8e6e2; border-radius: 8px; overflow-x: auto; }
        .vc-table    { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .vc-th       { text-align: left; padding: 0.75rem 1rem; background: #f9f8f6; color: #888; font-weight: 500; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e8e6e2; white-space: nowrap; }
        .vc-tr       { border-bottom: 1px solid #f0ece6; }
        .vc-tr:hover { background: #faf9f7; }
        .vc-td       { padding: 0.875rem 1rem; vertical-align: middle; }
        .vc-pill     { display: inline-block; padding: 2px 9px; border-radius: 12px; font-size: 0.73rem; font-weight: 500; }
        .vc-btn      { border: none; border-radius: 5px; color: #fff; padding: 0.3rem 0.75rem; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; font-family: var(--font-dm-sans), sans-serif; }
        .vc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .vc-actions  { display: flex; gap: 0.35rem; align-items: center; }
        @media (max-width: 768px) {
          .vc-content { padding: 1.25rem 1rem; }
          .vc-stats   { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: toast.ok ? '#1a1a1a' : '#7f1d1d', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="vc-content">

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Conversions</h1>
            <p style={{ color: '#888', fontSize: '0.875rem', marginTop: 4 }}>Review, approve, and pay your affiliates.</p>
          </div>
          <button
            onClick={() => fetchConversions()}
            style={{ background: 'transparent', border: '1px solid #d4b896', borderRadius: 6, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', color: '#b8860b' }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="vc-stats">
          {[
            { label: 'Pending Approval',  value: String(stats.pendingCount), color: '#b8860b' },
            { label: 'Commissions Owed',  value: fmt(stats.owedTotal),       color: '#c0392b' },
            { label: 'Commissions Paid',  value: fmt(stats.paidTotal),       color: '#27ae60' },
            { label: 'Confirmed GMV',     value: fmt(stats.gmv),             color: '#1a1a1a' },
          ].map(s => (
            <div key={s.label} className="vc-stat" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="vc-tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`vc-tab${tab === t.key ? ' active' : ''}`}
            >
              {t.label}
              {t.key === 'pending' && stats.pendingCount > 0 && (
                <span style={{ background: '#b8860b', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.68rem', marginLeft: 6 }}>
                  {stats.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '3rem', fontSize: '0.9rem' }}>
            No {tab === 'all' ? '' : tab} conversions yet.
          </div>
        ) : (
          <div className="vc-table-wrap">
            <table className="vc-table">
              <thead>
                <tr>
                  {['Product', 'Affiliate', 'Sale', 'Commission', 'Source', 'Date', 'Status', 'Actions'].map(h => (
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
                    <td className="vc-td" style={{ fontFamily: 'monospace', color: '#27ae60', fontWeight: 600 }}>{fmt(c.commission_amount)}</td>
                    <td className="vc-td">
                      <span className="vc-pill" style={sourceStyle(c.source)}>
                        {c.source === 'stripe' ? '⚡ Stripe' : c.source === 'pixel' ? '◎ Pixel' : '—'}
                      </span>
                    </td>
                    <td className="vc-td" style={{ whiteSpace: 'nowrap', color: '#666', fontSize: '0.82rem' }}>{fmtDate(c.converted_at)}</td>
                    <td className="vc-td">
                      <span className="vc-pill" style={statusStyle(c.status)}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="vc-td">
                      <div className="vc-actions">
                        {c.status === 'pending' && (
                          <>
                            <button
                              className="vc-btn"
                              style={{ background: '#27ae60' }}
                              disabled={busy === c.id + 'approved'}
                              onClick={() => updateStatus(c.id, 'approved')}
                            >
                              {busy === c.id + 'approved' ? '…' : 'Approve'}
                            </button>
                            <button
                              className="vc-btn"
                              style={{ background: '#888' }}
                              disabled={busy === c.id + 'disputed'}
                              onClick={() => updateStatus(c.id, 'disputed')}
                            >
                              {busy === c.id + 'disputed' ? '…' : 'Dispute'}
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button
                            className="vc-btn"
                            style={{ background: '#b8860b' }}
                            disabled={busy === c.id + 'paid'}
                            onClick={() => updateStatus(c.id, 'paid')}
                          >
                            {busy === c.id + 'paid' ? '…' : 'Mark Paid'}
                          </button>
                        )}
                        {(c.status === 'paid' || c.status === 'disputed') && (
                          <span style={{ color: '#ccc', fontSize: '0.85rem' }}>—</span>
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

// ─── Style helpers ────────────────────────────────────────────────────────────

function statusStyle(status: ConversionStatus): React.CSSProperties {
  const map: Record<ConversionStatus, React.CSSProperties> = {
    pending:  { background: '#fff8e1', color: '#f57f17' },
    approved: { background: '#e8f5e9', color: '#2e7d32' },
    disputed: { background: '#fce4ec', color: '#b71c1c' },
    paid:     { background: '#e8eaf6', color: '#283593' },
  }
  return map[status]
}

function sourceStyle(source: string | null): React.CSSProperties {
  if (source === 'stripe') return { background: '#e8f5e9', color: '#2e7d32' }
  if (source === 'pixel')  return { background: '#fff8e1', color: '#f57f17' }
  return { background: '#f0f0f0', color: '#888' }
}