// src/app/marketplace/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  'All', 'Digital Products', 'Courses & Education', 'SaaS & Software',
  'Beauty & Wellness', 'Fashion & Apparel', 'Fitness', 'Home & Living',
  'Food & Drink', 'Finance', 'Pets', 'Photography', 'Gaming', 'Other'
]

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<any>(null)
  const [applying, setApplying] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      // Load all active products
      const { data: p } = await supabase
        .from('products')
        .select('id, title, description, price, commission_rate, category, image_url, total_conversions, auto_approve, profiles!vendor_id(full_name)')
        .eq('status', 'active')
        .order('total_conversions', { ascending: false })
      setProducts(p ?? [])

      // If logged in, check which products already applied to
      if (session?.user) {
        const { data: apps } = await supabase
          .from('affiliate_applications')
          .select('product_id')
          .eq('affiliate_id', session.user.id)
        if (apps) setApplied(new Set(apps.map((a: any) => a.product_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  async function applyToPromote(productId: string) {
    if (!user) { window.location.href = '/signup'; return }
    setApplying(productId)

    await supabase
      .from('affiliate_applications')
      .insert({ product_id: productId, affiliate_id: user.id })

    setApplied(prev => new Set([...prev, productId]))
    setApplying(null)
  }

  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', height: '68px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
          <div style={{ flex: 1, maxWidth: '540px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #d0cdc8', borderRadius: '100px', padding: '0.5rem 1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or vendors"
              style={{ border: 'none', outline: 'none', fontSize: '13.5px', color: '#0d0d0d', background: 'transparent', flex: 1, fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link href="/affiliate" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none' }}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3a', textDecoration: 'none' }}>Sign in</Link>
                <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none' }}>
                  Sign up to promote
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Category nav */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' as const, scrollbarWidth: 'none' as const }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                fontSize: '13.5px', fontWeight: 500, color: category === cat ? '#0d0d0d' : '#3a3a3a',
                padding: '0.85rem 1rem', background: 'none', border: 'none',
                borderBottom: category === cat ? '2px solid #0d0d0d' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500 }}>
              {category === 'All' ? 'All products' : category}
            </h1>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '0.25rem' }}>{filtered.length} products available</div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '5rem 0' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888', marginBottom: '0.5rem' }}>No products found</div>
            <p style={{ fontSize: '13px', color: '#888' }}>Try a different category or search term.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {filtered.map(p => {
              const vendor = p.profiles as any
              const earn = (p.price * p.commission_rate).toFixed(2)
              const commPct = (p.commission_rate * 100).toFixed(0)
              const isApplied = applied.has(p.id)
              const isApplying = applying === p.id

              return (
                <div key={p.id} style={{ cursor: 'pointer' }}>
                  {/* Thumbnail */}
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f2f0ec', borderRadius: '2px', marginBottom: '0.85rem', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888' }}>No image</span>
                    )}
                    <div style={{ position: 'absolute' as const, bottom: '8px', left: '8px', background: '#0d0d0d', color: '#ffffff', fontSize: '10.5px', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                      {commPct}% commission
                    </div>
                    {p.auto_approve && (
                      <div style={{ position: 'absolute' as const, top: '8px', right: '8px', background: '#16a34a', color: '#ffffff', fontSize: '10px', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '2px' }}>
                        Instant
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '12px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    {vendor?.full_name ?? 'Vendor'}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.35rem', lineHeight: 1.35 }}>{p.title}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.75rem' }}>
                    Earn up to <strong style={{ color: '#0d0d0d' }}>${earn}</strong> per sale · ${p.price} product
                  </div>

                  {/* Apply button */}
                  {isApplied ? (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', padding: '0.5rem 0' }}>
                      Applied — pending approval
                    </div>
                  ) : (
                    <button
                      onClick={() => applyToPromote(p.id)}
                      disabled={isApplying}
                      style={{
                        width: '100%', fontSize: '12.5px', fontWeight: 600,
                        color: '#ffffff', background: isApplying ? '#888' : '#0d0d0d',
                        border: 'none', padding: '0.6rem 1rem', borderRadius: '3px',
                        cursor: isApplying ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {isApplying ? 'Applying...' : p.auto_approve ? 'Promote now' : 'Apply to promote'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}