// src/app/vendor/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function VendorDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [conversions, setConversions] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      const { profile: prof } = await res.json()
      if (!prof || prof.role !== 'vendor') { router.push('/login'); return }
      setProfile(prof)

      const { data: p } = await supabase
        .from('products')
        .select('id, title, status, commission_rate, price, total_conversions, total_revenue, created_at')
        .eq('vendor_id', session.user.id)
        .order('created_at', { ascending: false })
      setProducts(p ?? [])

      const { data: c } = await supabase
        .from('conversions')
        .select('id, sale_amount, commission_amount, platform_fee, status, converted_at, profiles!affiliate_id(full_name), products(title)')
        .eq('vendor_id', session.user.id)
        .order('converted_at', { ascending: false })
        .limit(8)
      setConversions(c ?? [])

      const { data: a } = await supabase
        .from('affiliate_applications')
        .select('id, status, applied_at, profiles!affiliate_id(full_name), products(title)')
        .in('product_id', (p ?? []).map((x: any) => x.id))
        .eq('status', 'pending')
        .order('applied_at', { ascending: false })
        .limit(10)
      setApplications(a ?? [])

      setLoading(false)
    }
    load()
  }, [])

  async function handleApplication(id: string, status: 'approved' | 'rejected') {
    await supabase
      .from('affiliate_applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const totalRevenue    = products.reduce((s, p) => s + (p.total_revenue ?? 0), 0)
  const totalSales      = products.reduce((s, p) => s + (p.total_conversions ?? 0), 0)
  const activeProducts  = products.filter(p => p.status === 'active').length
  const pendingApps     = applications.length

  const statCards = [
    { label: 'Total revenue',      value: `$${totalRevenue.toFixed(2)}` },
    { label: 'Total sales',        value: totalSales.toLocaleString() },
    { label: 'Active products',    value: activeProducts.toString() },
    { label: 'Pending approvals',  value: pendingApps.toString() },
  ]

  const statusColor: Record<string, string> = {
    active:  '#16a34a',
    paused:  '#888',
    draft:   '#b45309',
    rejected:'#dc2626',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard',   href: '/vendor',              active: true },
            { label: 'Products',    href: '/vendor/products' },
            { label: 'Affiliates',  href: '/vendor/affiliates' },
            { label: 'Conversions', href: '/vendor/conversions' },
            { label: 'Settings',    href: '/vendor/settings' },
          ].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none' }}>
            + List product
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3a3a3a' }}>
    {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
  </div>
  <button
    onClick={async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    }}
    style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', fontFamily: 'inherit' }}
  >
    Sign out
  </button>
</div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor Dashboard</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none', background: '#ffffff' }}>
            + List a new product
          </Link>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e8e6e2', marginBottom: '2.5rem' }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.5rem 1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Products */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Your products</div>
              <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {products.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.75rem' }}>No products yet</div>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>List your first product and start getting affiliates to promote it.</p>
                <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>
                  List a product
                </Link>
              </div>
            ) : products.slice(0, 6).map(p => (
              <div key={p.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '0.2rem' }}>{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '11px', color: statusColor[p.status] ?? '#888', fontWeight: 600, textTransform: 'capitalize' as const }}>{p.status}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>· {(p.commission_rate * 100).toFixed(0)}% commission</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.total_conversions ?? 0} sales</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>${(p.total_revenue ?? 0).toFixed(2)}</div>
                </div>
                <Link href={`/vendor/products/${p.id}/edit`} style={{ fontSize: '11px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.3rem 0.65rem', borderRadius: '3px', textDecoration: 'none', flexShrink: 0 }}>
                  Edit
                </Link>
              </div>
            ))}
          </div>

          {/* Pending Applications */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Pending approvals</div>
              <Link href="/vendor/affiliates" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {applications.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No pending approvals</div>
                <p style={{ fontSize: '13px', color: '#888' }}>Affiliate applications will appear here.</p>
              </div>
            ) : applications.map(a => {
              const affiliate = a.profiles as any
              const product   = a.products as any
              const date = new Date(a.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={a.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{affiliate?.full_name ?? 'Affiliate'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{date}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '0.75rem' }}>{product?.title ?? 'Product'}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApplication(a.id, 'approved')}
                      style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApplication(a.id, 'rejected')}
                      style={{ fontSize: '12px', fontWeight: 500, color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.35rem 0.85rem', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Conversions */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Recent sales</div>
            <Link href="/vendor/conversions" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
          </div>
          {conversions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888', marginBottom: '0.5rem' }}>No sales yet</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Sales will appear here once affiliates start converting.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e8e6e2' }}>
              {['Product', 'Affiliate', 'Sale', 'Commission', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' }}>{h}</div>
              ))}
            </div>
          )}
          {conversions.map(c => {
            const affiliate = c.profiles as any
            const product   = c.products as any
            const date = new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, paddingRight: '1rem' }}>{product?.title ?? '—'}</div>
                <div style={{ fontSize: '13px', color: '#3a3a3a' }}>{affiliate?.full_name ?? '—'}</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>${c.sale_amount.toFixed(2)}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>${c.commission_amount.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: statusColor[c.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' as const }}>{c.status}</div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}