// src/app/page.tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import ProductCarousel from '@/components/ProductCarousel'

async function getFeaturedProducts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('products')
    .select('id, slug, title, price, commission_rate, image_url, images, category, profiles!vendor_id(full_name)')
    .eq('status', 'active')
    .order('total_conversions', { ascending: false })
    .limit(10)
  return data ?? []
}

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [{ count: affiliates }, { count: products }, { data: convData }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('conversions').select('commission_amount').eq('status', 'paid'),
  ])
  const totalCommissions = (convData ?? []).reduce((s: number, c: any) => s + (c.commission_amount ?? 0), 0)
  return {
    affiliates: affiliates ?? 0,
    products:   products ?? 0,
    commissions: totalCommissions,
  }
}

async function getCategoryCounts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1
  }
  return counts
}

const CATEGORIES = [
  'Digital Products', 'Courses & Education', 'Beauty & Wellness', 'Fashion & Apparel',
  'SaaS & Software', 'Fitness', 'Home & Living', 'Food & Drink',
]

export default async function HomePage() {
  const [featuredProducts, stats, categoryCounts] = await Promise.all([
    getFeaturedProducts(),
    getStats(),
    getCategoryCounts(),
  ])

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M+`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K+`
    : `$${n.toFixed(0)}`

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#ffffff', color: '#0d0d0d', overflowX: 'hidden' }}>
      <style>{`
        .hero-h1 { font-family: var(--font-cormorant), serif; font-size: 3.75rem; font-weight: 500; line-height: 1.05; color: #ffffff; margin-bottom: 1rem; }
        .category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e6e2; }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; }
        .role-split { display: grid; grid-template-columns: 1fr 1fr; }
        .ai-strip-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 5rem; align-items: center; }
        .stat-bar { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e8e6e2; }
        .hero { position: relative; height: 520px; overflow: hidden; display: flex; align-items: flex-end; }
        .hero-content { position: relative; z-index: 2; padding: 3.5rem 2.5rem; max-width: 600px; }
        .hero-btns { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .section-pad { padding: 3.5rem 2.5rem; }
        .how-section { padding: 4rem 2.5rem; border-top: 1px solid #e8e6e2; border-bottom: 1px solid #e8e6e2; }
        .ai-strip { background: #1a1a18; padding: 4rem 2.5rem; }
        .cta-section { padding: 5rem 2.5rem; text-align: center; background: #f2f0ec; }
        .role-pane { padding: 4rem 3rem; border-top: 1px solid #e8e6e2; }
        @media (max-width: 1024px) {
          .ai-strip-grid { grid-template-columns: 1fr; gap: 2rem; }
        }
        @media (max-width: 768px) {
          .hero { height: 420px; }
          .hero-content { padding: 2rem 1rem; }
          .hero-h1 { font-size: 2.25rem !important; }
          .hero-btns { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
          .section-pad { padding: 2rem 1rem; }
          .category-grid { grid-template-columns: repeat(2, 1fr); }
          .how-grid { grid-template-columns: 1fr; gap: 2rem; }
          .role-split { grid-template-columns: 1fr; }
          .role-pane { padding: 2rem 1rem; border-right: none !important; }
          .ai-strip { padding: 2.5rem 1rem; }
          .ai-strip-grid { grid-template-columns: 1fr; gap: 2rem; }
          .cta-section { padding: 3rem 1rem; }
          .how-section { padding: 2.5rem 1rem; }
        }
        @media (max-width: 480px) {
          .category-grid { grid-template-columns: 1fr; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <div className="hero">
        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.45)', zIndex: 1 }} />
        <div className="hero-content">
          <h1 className="hero-h1">Find your next<br />top seller</h1>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.88)', marginBottom: '1.75rem', lineHeight: 1.55, maxWidth: '42ch' }}>
            Sign up to promote products from vendors and earn commissions on every sale you drive.
          </p>
          <div className="hero-btns">
            <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '13.5px', fontWeight: 600, padding: '0.7rem 1.6rem', borderRadius: '3px', textDecoration: 'none' }}>Sign up to promote</Link>
            <Link href="/vendor-signup" style={{ fontSize: '13.5px', fontWeight: 500, color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '3px', opacity: 0.9 }}>Are you a vendor? Sign up to sell</Link>
          </div>
        </div>
      </div>

      {/* STAT BAR — real data */}
      <div className="stat-bar">
        {[
          { n: stats.commissions > 0 ? fmt(stats.commissions) : 'Growing', l: 'Total commissions tracked' },
          { n: stats.products > 0 ? `${stats.products}+` : 'New', l: 'Active products listed' },
          { n: stats.affiliates > 0 ? stats.affiliates.toLocaleString() : 'Growing', l: 'Registered affiliates' },
          { n: '30 days', l: 'Cookie tracking window' },
        ].map(s => (
          <div key={s.l} style={{ padding: '1.5rem 2rem', borderRight: '1px solid #e8e6e2', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0d0d0d' }}>{s.n}</div>
            <div style={{ fontSize: '12px', color: '#888888', fontWeight: 500, marginTop: '0.2rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* CAROUSEL — infinite scroll */}
      {featuredProducts.length > 0 && (
        <section className="section-pad">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500 }}>Products to promote</h2>
            <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #d0cdc8', padding: '0.45rem 1rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' }}>All products</Link>
          </div>
          <ProductCarousel products={featuredProducts as any} />
        </section>
      )}

      <div style={{ height: '1px', background: '#e8e6e2', margin: '0 2.5rem' }} />

      {/* CATEGORIES — real counts */}
      <section className="section-pad" style={{ background: '#f9f8f6' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500, marginBottom: '1.75rem' }}>Browse by category</h2>
        <div className="category-grid">
          {CATEGORIES.map(name => {
            const count = categoryCounts[name] ?? 0
            return (
              <Link key={name} href={`/marketplace?category=${encodeURIComponent(name)}`}
                style={{ background: '#ffffff', padding: '1.75rem 1.5rem', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.15rem', fontWeight: 500, color: '#0d0d0d' }}>{name}</div>
                <div style={{ fontSize: '12px', color: '#888888', marginTop: '0.4rem' }}>
                  {count > 0 ? `${count} product${count !== 1 ? 's' : ''}` : 'Coming soon'}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '2rem' }}>How it works</div>
        <div className="how-grid">
          {[
            { num: '01', title: 'Vendors list their product', body: 'Submit your product, set your commission rate, and define your brand rules. AI generates affiliate-ready assets — hooks, captions, scripts — automatically.', tag: 'For vendors' },
            { num: '02', title: 'Affiliates apply and promote', body: 'Browse the marketplace, apply to promote any product, and grab your unique tracked link. Post on TikTok, Instagram, YouTube, or your own site.', tag: 'For affiliates' },
            { num: '03', title: 'Sales tracked automatically', body: 'Every confirmed purchase fires a server-side postback. Commissions calculate in real time. Vendors pay affiliates directly — no middleman.', tag: 'Automatic' },
          ].map(s => (
            <div key={s.num}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 400, color: '#e8e6e2', lineHeight: 1, marginBottom: '0.75rem' }}>{s.num}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.6rem' }}>{s.title}</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{s.body}</p>
              <span style={{ display: 'inline-block', marginTop: '0.85rem', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem 0.7rem', border: '1px solid #d0cdc8', color: '#3a3a3a', borderRadius: '2px' }}>{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ROLE SPLIT */}
      <div className="role-split">
        {[
          { eyebrow: 'For vendors', headline: 'Your product.\nTheir audience.', body: 'List once, reach thousands of motivated creators who are genuinely incentivized to sell. You control every term.', features: ['Set commissions from 5% to 70%', 'Auto-approve or manually review affiliates', 'Real-time sales and earnings dashboard', 'Enforce brand guidelines and prohibited terms', 'AI UGC video generation (Pro)'], cta: 'Sign up to sell', href: '/vendor-signup', borderRight: true },
          { eyebrow: 'For affiliates', headline: 'Your content.\nReal income.', body: 'Browse products that match your niche. Get your link. Post your content. Commissions paid directly — no minimums.', features: ['AI-generated hooks and captions per product', 'Unique tracked link for every product', 'Live commission and click dashboard', '30-day cookie tracking window', 'Free to join — no monthly fees'], cta: 'Sign up to promote', href: '/signup', borderRight: false },
        ].map(pane => (
          <div key={pane.eyebrow} className="role-pane" style={{ borderRight: pane.borderRight ? '1px solid #e8e6e2' : 'none' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>{pane.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '0.9rem', whiteSpace: 'pre-line' }}>{pane.headline}</h2>
            <p style={{ fontSize: '13.5px', color: '#3a3a3a', lineHeight: 1.75, marginBottom: '2rem', maxWidth: '38ch' }}>{pane.body}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {pane.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '13px', color: '#3a3a3a' }}>
                  <span style={{ width: '14px', height: '1px', background: '#0d0d0d', flexShrink: 0, marginTop: '8px', display: 'inline-block' }} />
                  {f}
                </div>
              ))}
            </div>
            <Link href={pane.href} style={{ display: 'inline-block', background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.65rem 1.5rem', borderRadius: '3px', textDecoration: 'none' }}>{pane.cta}</Link>
          </div>
        ))}
      </div>

      {/* AI STRIP */}
      <div className="ai-strip">
        <div className="ai-strip-grid">
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1rem' }}>AI-powered</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, color: '#ffffff', lineHeight: 1.15, marginBottom: '0.9rem' }}>The platform that writes<br />your pitch for you.</h2>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '1.75rem', maxWidth: '38ch' }}>Every product listing includes AI-generated affiliate assets. Affiliates start selling in minutes.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['TikTok hooks', 'IG captions', 'Email swipes', 'YouTube scripts', 'AI UGC video'].map(tag => (
                <span key={tag} style={{ fontSize: '12px', fontWeight: 500, padding: '0.3rem 0.8rem', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px' }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.08)' }}>
            {[
              { platform: 'TikTok — Hook', text: '"POV: you found the product everyone\'s buying but nobody\'s talking about yet..."', meta: 'Beauty & Wellness · 28% commission' },
              { platform: 'Instagram — Caption', text: '"This changed my morning routine completely. Link in bio if you want in."', meta: 'Wellness Course · 40% commission' },
              { platform: 'Email — Swipe copy', text: '"Hey [name] — I rarely send these but this one is converting at 8% and I had to share..."', meta: 'SaaS Tool · 35% recurring commission' },
            ].map(card => (
              <div key={card.platform} style={{ background: '#111111', padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: '0.4rem' }}>{card.platform}</div>
                <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{card.text}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '0.4rem' }}>{card.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>Get started today</div>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 500, marginBottom: '0.85rem', letterSpacing: '-0.01em' }}>Ready to grow your reach?</h2>
        <p style={{ fontSize: '14px', color: '#3a3a3a', marginBottom: '2rem' }}>Join vendors and affiliates already building on UGCA. Free to start.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/vendor-signup" style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '13.5px', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: '3px', textDecoration: 'none' }}>List your product</Link>
          <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '13.5px', fontWeight: 500, padding: '0.75rem 2rem', border: '1px solid #d0cdc8', borderRadius: '3px', textDecoration: 'none' }}>Start promoting</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '2.25rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>U G C A</div>
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          <Link href="/terms"         style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy"       style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/pricing"       style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/marketplace"   style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Marketplace</Link>
          <Link href="/vendor-signup" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Vendors</Link>
        </div>
        <div style={{ fontSize: '12px', color: '#888' }}>2026 UGCAffiliates, Inc.</div>
      </footer>
    </div>
  )
}