// src/app/vendor/page.tsx
// Vendor dashboard — approve/decline calls /api/affiliate/approve (creates link)
'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

function VendorDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [conversions, setConversions] = useState<any[]>([])
  const [pendingApps, setPendingApps] = useState<any[]>([])
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

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
      const { profile: prof } = await res.json()

      if (!prof || prof.role !== 'vendor') {
        router.push('/login?redirected=1')
        return
      }
      setProfile(prof)

      const { data: prodIds } = await supabase.from('products').select('id').eq('vendor_id', session.user.id)
      const ids = prodIds?.map((p: any) => p.id) ?? []

      const [{ data: prods }, { data: convs }, { data: apps }] = await Promise.all([
        supabase.from('products').select('id, title, status, commission_rate, total_conversions, total_revenue').eq('vendor_id', session.user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('conversions').select('id, sale_amount, commission_amount, platform_fee, status, converted_at, profiles!affiliate_id(full_name), products(title)').eq('vendor_id', session.user.id).order('converted_at', { ascending: false }).limit(8),
        ids.length > 0
          ? supabase.from('affiliate_applications').select('id, applied_at, profiles!affiliate_id(full_name, email), products(title)').eq('status', 'pending').in('product_id', ids).order('applied_at', { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
      ])

      setProducts(prods ?? [])
      setConversions(convs ?? [])
      setPendingApps(apps ?? [])

      const allConvs = convs ?? []
      setStats({
        revenue:  allConvs.reduce((s, c) => s + c.sale_amount, 0),
        sales:    allConvs.length,
        products: (prods ?? []).filter((p: any) => p.status === 'active').length,
        pending:  (apps ?? []).length,
      })

      setLoading(false)
    }
    load()
  }, [])

  // ── Approve / Decline — calls API which creates the affiliate link ──────────
  async function handleAction(appId: string, action: 'approved' | 'rejected') {
    setActionLoading(appId)
    setActionError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/affiliate/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ application_id: appId, action }),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      setActionError(data.error ?? 'Failed to update application')
      setActionLoading(null)
      return
    }

    // Remove from pending list optimistically
    setPendingApps(prev => prev.filter(a => a.id !== appId))
    setStats(prev => ({ ...prev, pending: prev.pending - 1 }))
    setActionLoading(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const profileInitial = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'V'
  const isNewVendor = products.length === 0

  const hasBusinessName = !!(profile?.business_name)
  const hasProduct = products.length > 0
  const hasApprovedAffiliate = conversions.length > 0
  const checklistDone = hasBusinessName && hasProduct && hasApprovedAffiliate
  const checklistSteps = [
    { done: true,                 label: 'Create your vendor account',    href: null,                    cta: null },
    { done: hasBusinessName,      label: 'Add your business name',         href: '/vendor/settings',      cta: 'Go to Settings' },
    { done: hasProduct,           label: 'List your first product',        href: '/vendor/products/new',  cta: 'List a product' },
    { done: hasApprovedAffiliate, label: 'Get your first affiliate sale',  href: null,                    cta: null, sub: 'Share your marketplace link to attract affiliates' },
  ]
  const completedCount = checklistSteps.filter(s => s.done).length

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .v-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }
        .v-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .v-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .checklist-step { display: flex; align-items: flex-start; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 1px solid #f2f0ec; }
        .checklist-step:last-child { border-bottom: none; }
        @media (max-width: 768px) {
          .v-content { padding: 1.25rem 1rem; }
          .v-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .v-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="v-content">
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.3rem' }}>Vendor Dashboard</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>
              Welcome{isNewVendor ? '' : ' back'}, {profile?.business_name ?? profile?.full_name?.split(' ')[0] ?? 'Vendor'}
            </h1>
          </div>
          <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #d0cdc8', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' }}>+ List a new product</Link>
        </div>

        {/* Free listing notice */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '13px', color: '#16a34a' }}>
          ✓ Free to list · 10% platform fee on confirmed affiliate sales only
        </div>

        {/* Action error */}
        {actionError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '13px', color: '#dc2626' }}>
            {actionError}
          </div>
        )}

        {/* Getting started checklist */}
        {!checklistDone && (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d' }}>Getting started</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '0.2rem' }}>{completedCount} of {checklistSteps.length} steps complete</div>
              </div>
              <div style={{ width: '120px', height: '4px', background: '#f2f0ec', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0d0d0d', borderRadius: '2px', width: `${(completedCount / checklistSteps.length) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            {checklistSteps.map((step, i) => (
              <div key={i} className="checklist-step">
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', background: step.done ? '#0d0d0d' : '#f2f0ec', border: step.done ? 'none' : '1.5px solid #d0cdc8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.done && <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: step.done ? 400 : 500, color: step.done ? '#888' : '#0d0d0d', textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</div>
                  {(step as any).sub && !step.done && <div style={{ fontSize: '12px', color: '#888', marginTop: '0.15rem' }}>{(step as any).sub}</div>}
                </div>
                {!step.done && step.href && step.cta && (
                  <Link href={step.href} style={{ fontSize: '12px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.3rem 0.75rem', borderRadius: '3px', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>{step.cta}</Link>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="v-stat-grid">
          {[
            { label: 'Total Revenue',     value: `$${stats.revenue.toFixed(2)}` },
            { label: 'Total Sales',       value: stats.sales },
            { label: 'Active Products',   value: stats.products },
            { label: 'Pending Approvals', value: stats.pending },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="v-two-col">
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Your products</div>
              <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {products.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>
                No products yet.<br />
                <Link href="/vendor/products/new" style={{ color: '#0d0d0d', fontWeight: 600 }}>List your first product →</Link>
              </div>
            ) : products.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f2f0ec', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: '11px', color: p.status === 'active' ? '#16a34a' : '#888', fontWeight: 500, textTransform: 'capitalize' }}>{p.status} · {(p.commission_rate * 100).toFixed(0)}% commission</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.total_conversions ?? 0} sales</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>${(p.total_revenue ?? 0).toFixed(2)}</div>
                </div>
                <Link href="/vendor/products" style={{ fontSize: '12px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.25rem 0.6rem', borderRadius: '3px', textDecoration: 'none', flexShrink: 0 }}>Edit</Link>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Pending approvals</div>
              <Link href="/vendor/affiliates" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {pendingApps.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>No pending applications.</div>
            ) : pendingApps.map(a => {
              const affiliate = a.profiles as any
              const product = a.products as any
              const isActioning = actionLoading === a.id
              return (
                <div key={a.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid #f2f0ec' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{affiliate?.full_name ?? 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{product?.title ?? '—'} · {new Date(a.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleAction(a.id, 'approved')}
                        disabled={isActioning}
                        style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: isActioning ? '#888' : '#0d0d0d', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                      >
                        {isActioning ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'rejected')}
                        disabled={isActioning}
                        style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: isActioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Recent sales</div>
            <Link href="/vendor/conversions" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
          </div>
          {conversions.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', marginBottom: '0.3rem' }}>No sales yet</div>
              Sales will appear here once affiliates start converting.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '560px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px solid #e8e6e2', marginBottom: '0.25rem' }}>
                  {['Product / Affiliate', 'Sale', 'Commission', 'Platform Fee', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
                  ))}
                </div>
                {conversions.map(c => {
                  const product = c.products as any
                  const affiliate = c.profiles as any
                  return (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '0.75rem 0', borderBottom: '1px solid #f2f0ec', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{affiliate?.full_name ?? '—'}</div>
                      </div>
                      <div style={{ fontSize: '13px' }}>${c.sale_amount.toFixed(2)}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>${c.commission_amount.toFixed(2)}</div>
                      <div style={{ fontSize: '13px', color: '#888' }}>${(c.platform_fee ?? 0).toFixed(2)}</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', color: c.status === 'paid' ? '#16a34a' : c.status === 'approved' ? '#2563eb' : '#888' }}>{c.status}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VendorDashboardWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>}>
      <VendorDashboard />
    </Suspense>
  )
}