// src/app/vendor/affiliates/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

export default function VendorAffiliatesPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('V')
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [actioning, setActioning] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
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
      const { profile } = await res.json()
      if (!profile || profile.role !== 'vendor') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', sess.user.id)

      const productIds = (products ?? []).map((p: any) => p.id)
      if (productIds.length === 0) { setLoading(false); return }

      // ── Step 1: fetch applications + products (no profile join) ──────────
      const { data: apps } = await supabase
        .from('affiliate_applications')
        .select('id, status, applied_at, reviewed_at, message, affiliate_id, products(id, title, commission_rate)')
        .in('product_id', productIds)
        .order('applied_at', { ascending: false })

      if (!apps || apps.length === 0) { setLoading(false); return }

      // ── Step 2: fetch affiliate profiles separately ───────────────────────
      const affiliateIds = [...new Set(apps.map((a: any) => a.affiliate_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', affiliateIds)

      const profilesMap: Record<string, string> = {}
      for (const p of profilesData ?? []) {
        profilesMap[p.id] = p.full_name ?? 'Unknown'
      }

      // ── Step 3: merge ─────────────────────────────────────────────────────
      const merged = apps.map((a: any) => ({
        ...a,
        affiliate_name: profilesMap[a.affiliate_id] ?? 'Unknown',
      }))

      setApplications(merged)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    if (!session) return
    setActioning(id)
    setActionError('')

    const res = await fetch('/api/affiliate/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ application_id: id, action }),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      setActionError(data.error ?? 'Failed to update application. Please try again.')
      setActioning(null)
      return
    }

    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: action, reviewed_at: new Date().toISOString() } : a)
    )
    setActioning(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)
  const statusColor: Record<string, string> = { pending: '#b45309', approved: '#16a34a', rejected: '#dc2626' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .va-content { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem; }
        .va-filter-bar { display: flex; gap: 0.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .va-table-header { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .va-table-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1.5fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        @media (max-width: 768px) {
          .va-content { padding: 1.25rem 1rem; }
          .va-table-header { grid-template-columns: 1fr 1fr; padding: 0.75rem 1rem; }
          .va-table-header > div:nth-child(n+3) { display: none; }
          .va-table-row { grid-template-columns: 1fr 1fr; padding: 0.85rem 1rem; gap: 0.5rem; }
          .va-table-row > div:nth-child(3),
          .va-table-row > div:nth-child(4) { display: none; }
          .va-table-row > div:nth-child(5) { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 0.35rem; }
        }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="va-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Affiliates</h1>
        </div>

        {actionError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>
            {actionError}
          </div>
        )}

        <div className="va-filter-bar">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize' }}>
              {f} ({f === 'all' ? applications.length : applications.filter(a => a.status === f).length})
            </button>
          ))}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', overflowX: 'auto' }}>
          <div style={{ minWidth: '560px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No applications yet</div>
                <p style={{ fontSize: '13px', color: '#888' }}>Affiliates will appear here once they apply to promote your products.</p>
              </div>
            ) : (
              <>
                <div className="va-table-header">
                  {['Affiliate', 'Product', 'Applied', 'Status', 'Action'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
                  ))}
                </div>
                {filtered.map(a => {
                  const product = a.products as any
                  const date = new Date(a.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const isActioning = actioning === a.id
                  const name = a.affiliate_name ?? 'Unknown'
                  const initial = name.charAt(0).toUpperCase()

                  return (
                    <div key={a.id} className="va-table-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                          {initial}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {product ? `${(product.commission_rate * 100).toFixed(0)}% commission` : ''}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#888' }}>{date}</div>

                      <div>
                        <span style={{ fontSize: '12px', color: statusColor[a.status], fontWeight: 500, textTransform: 'capitalize' }}>
                          {a.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleAction(a.id, 'approved')} disabled={isActioning}
                              style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: isActioning ? '#888' : '#0d0d0d', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                              {isActioning ? '…' : 'Approve'}
                            </button>
                            <button onClick={() => handleAction(a.id, 'rejected')} disabled={isActioning}
                              style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                              Decline
                            </button>
                          </>
                        )}
                        {a.status === 'approved' && (
                          <button onClick={() => handleAction(a.id, 'rejected')} disabled={isActioning}
                            style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            {isActioning ? '…' : 'Revoke'}
                          </button>
                        )}
                        {a.status === 'rejected' && (
                          <button onClick={() => handleAction(a.id, 'approved')} disabled={isActioning}
                            style={{ fontSize: '12px', color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            {isActioning ? '…' : 'Re-approve'}
                          </button>
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
    </div>
  )
}