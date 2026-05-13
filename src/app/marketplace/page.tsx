// src/app/marketplace/page.tsx
'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['All', 'Digital Products', 'Courses & Education', 'SaaS & Software', 'Beauty & Wellness', 'Fashion & Apparel', 'Fitness', 'Home & Living', 'Food & Drink', 'Finance', 'Pets', 'Photography', 'Gaming', 'Other']

function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const searchParams = useSearchParams()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) setCategory(cat)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      let query = supabase
        .from('products')
        .select('id, slug, title, description, price, commission_rate, category, image_url, images, total_conversions, auto_approve, profiles!vendor_id(full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (category !== 'All') query = query.eq('category', category)
      if (search) query = query.ilike('title', `%${search}%`)

      const { data } = await query
      setProducts(data ?? [])

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
  }, [category, search])

  async function applyToProduct(e: React.MouseEvent, productId: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { window.location.href = '/signup'; return }
    setApplying(productId)
    await supabase.from('affiliate_applications').insert({ product_id: productId, affiliate_id: user.id })
    setApplied(prev => new Set([...prev, productId]))
    setApplying(null)
  }

  const filtered = products.filter(p =>
    (category === 'All' || p.category === category) &&
    (search === '' || p.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .mkt-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; height: 68px; gap: 1.5rem; }
        .mkt-nav-actions { margin-left: auto; display: flex; align-items: center; gap: 1rem; }
        .cat-scroll { display: flex; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .mkt-body { display: grid; grid-template-columns: 220px 1fr; gap: 0; min-height: calc(100vh - 137px); }
        .mkt-sidebar { border-right: 1px solid #e8e6e2; padding: 2rem 1.5rem; }
        .mkt-main { padding: 2rem 2.5rem; }
        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .product-card { display: block; text-decoration: none; color: inherit; cursor: pointer; }
        .product-card:hover .card-title { text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .mkt-nav { padding: 0 1rem; height: 56px; }
          .mkt-nav-actions a:not(:last-child) { display: none; }
          .cat-scroll { padding: 0 1rem; }
          .mkt-body { grid-template-columns: 1fr; }
          .mkt-sidebar { display: none; }
          .mkt-main { padding: 1.25rem 1rem; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        }
        @media (max-width: 480px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
      `}</style>

      {/* Nav */}
      <nav className="mkt-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>
        <div style={{ flex: 1, maxWidth: '480px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #d0cdc8', borderRadius: '100px', padding: '0.45rem 1rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or vendors" style={{ border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', width: '100%', fontFamily: 'inherit', color: '#0d0d0d' }} />
        </div>
        <div className="mkt-nav-actions">
          <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' as const }}>Sign up free</Link>
        </div>
      </nav>

      {/* Category scroll */}
      <div className="cat-scroll">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ fontSize: '13.5px', fontWeight: 500, color: category === cat ? '#0d0d0d' : '#3a3a3a', background: 'none', border: 'none', borderBottom: category === cat ? '2px solid #0d0d0d' : '2px solid transparent', padding: '0.85rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit', flexShrink: 0 }}>{cat}</button>
        ))}
      </div>

      <div className="mkt-body">
        {/* Sidebar */}
        <aside className="mkt-sidebar">
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '1rem' }}>Categories</div>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ display: 'block', width: '100%', textAlign: 'left' as const, fontSize: '13px', fontWeight: category === cat ? 600 : 400, color: category === cat ? '#0d0d0d' : '#3a3a3a', background: category === cat ? '#f2f0ec' : 'none', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '3px', cursor: 'pointer', marginBottom: '2px', fontFamily: 'inherit' }}>{cat}</button>
          ))}
        </aside>

        {/* Products */}
        <main className="mkt-main">
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
            {loading ? 'Loading...' : `${filtered.length} products available`}
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', color: '#888' }}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '4rem 0' }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888', marginBottom: '0.5rem' }}>No products found</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Try a different category or search term.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map(p => {
                const vendor = p.profiles as any
                const earn = (p.price * p.commission_rate).toFixed(2)
                const commPct = (p.commission_rate * 100).toFixed(0)
                const isApplied = applied.has(p.id)
                const isApplying = applying === p.id
                const primaryImage = p.images?.[0] ?? p.image_url
                const slug = p.slug ?? p.id

                return (
                  <Link key={p.id} href={`/marketplace/${slug}`} className="product-card">
                    <div style={{ position: 'relative' as const, width: '100%', aspectRatio: '1', background: '#f2f0ec', borderRadius: '2px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                      {primaryImage ? (
                        <img src={primaryImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888' }}>No image</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute' as const, bottom: '8px', left: '8px', background: '#0d0d0d', color: '#ffffff', fontSize: '10.5px', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '2px' }}>{commPct}% commission</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '11px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{vendor?.full_name ?? 'Vendor'}</div>
                    <div className="card-title" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.3rem', lineHeight: 1.35 }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.75rem' }}>Earn up to <strong style={{ color: '#0d0d0d' }}>${earn}</strong> per sale · ${p.price} product</div>
                    <button
                      onClick={(e) => applyToProduct(e, p.id)}
                      disabled={isApplied || isApplying}
                      style={{ width: '100%', padding: '0.6rem', fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit', background: isApplied ? '#f2f0ec' : '#0d0d0d', color: isApplied ? '#888' : '#ffffff', border: 'none', borderRadius: '2px', cursor: isApplied ? 'default' : 'pointer' }}
                    >
                      {isApplying ? 'Applying...' : isApplied ? 'Applied' : p.auto_approve ? 'Promote now' : 'Apply to promote'}
                    </button>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default function MarketplacePageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>}>
      <MarketplacePage />
    </Suspense>
  )
}