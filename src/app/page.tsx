// src/app/page.tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
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
    .order('created_at', { ascending: false })
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

async function getLoggedInUser() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

const CATEGORIES = [
  'Digital Products', 'Courses & Education', 'Beauty & Wellness', 'Fashion & Apparel',
  'SaaS & Software', 'Fitness', 'Home & Living', 'Food & Drink',
]

export default async function HomePage() {
  const [featuredProducts, stats, categoryCounts, loggedIn] = await Promise.all([
    getFeaturedProducts(),
    getStats(),
    getCategoryCounts(),
    getLoggedInUser(),
  ])

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M+`
    : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K+`
    : `$${n.toFixed(0)}`

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#faf9f7', color: '#1a1a1a', overflowX: 'hidden' }}>
      <style>{`
        .invite-banner { background: #f0ece5; border-bottom: 1px solid #e8e4de; padding: 10px 2.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .invite-banner-text { font-size: 12px; color: #888; letter-spacing: 0.03em; flex: 1; }
        .invite-banner-link { font-size: 12px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.06em; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }

        .hero { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e8e4de; align-items: stretch; }
        .hero-left { padding: 72px 48px 72px 2.5rem; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid #e8e4de; }
        .hero-eyebrow { font-size: 10px; letter-spacing: 0.22em; color: #b5a99a; text-transform: uppercase; margin-bottom: 20px; }
        .hero-h1 { font-family: var(--font-cormorant), serif; font-size: 3.5rem; font-weight: 400; line-height: 1.08; color: #1a1a1a; margin-bottom: 20px; letter-spacing: -0.01em; }
        .hero-sub { font-size: 13.5px; color: #888; line-height: 1.75; margin-bottom: 32px; max-width: 38ch; }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .hero-right { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background-color: #e8e4de; }
        .hero-video-cell { overflow: hidden; background: #1a1a1a; aspect-ratio: 3/4; }
        .hero-video-cell video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-desktop-cell { display: block; }
        .hero-mobile-overlay { display: none; }

        .btn-primary { background: #1a1a1a; color: #faf9f7; font-size: 11px; font-weight: 600; padding: 10px 24px; border: 1px solid #1a1a1a; cursor: pointer; letter-spacing: 0.08em; font-family: var(--font-dm-sans), sans-serif; text-decoration: none; display: inline-block; }
        .btn-ghost { background: none; color: #888; font-size: 11px; font-weight: 500; padding: 10px 24px; border: 1px solid #e0dbd4; cursor: pointer; letter-spacing: 0.06em; font-family: var(--font-dm-sans), sans-serif; text-decoration: none; display: inline-block; }

        .stat-bar { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e8e4de; }
        .stat-cell { padding: 28px 24px; border-right: 1px solid #e8e4de; text-align: center; background: #faf9f7; }
        .stat-cell:last-child { border-right: none; }
        .stat-val { font-family: var(--font-cormorant), serif; font-size: 2rem; font-weight: 400; color: #1a1a1a; letter-spacing: -0.02em; margin-bottom: 4px; }
        .stat-label { font-size: 10px; color: #b5a99a; letter-spacing: 0.12em; text-transform: uppercase; }

        .pill-row { display: flex; gap: 8px; padding: 20px 2.5rem; border-bottom: 1px solid #e8e4de; overflow-x: auto; scrollbar-width: none; background: #faf9f7; }
        .pill-row::-webkit-scrollbar { display: none; }
        .pill { font-size: 11px; color: #888; border: 1px solid #e0dbd4; padding: 6px 18px; cursor: pointer; white-space: nowrap; letter-spacing: 0.04em; background: #faf9f7; text-decoration: none; display: inline-block; }
        .pill:hover { border-color: #1a1a1a; color: #1a1a1a; }

        .section { padding: 52px 2.5rem; border-bottom: 1px solid #e8e4de; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; }
        .section-title { font-family: var(--font-cormorant), serif; font-size: 1.75rem; font-weight: 400; color: #1a1a1a; letter-spacing: -0.01em; }
        .section-link { font-size: 11px; color: #b5a99a; letter-spacing: 0.08em; text-decoration: none; }
        .section-link:hover { color: #1a1a1a; }

        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e4de; }
        .cat-card { background: #faf9f7; padding: 28px 24px; text-decoration: none; display: block; }
        .cat-card:hover { background: #f5f2ed; }
        .cat-name { font-family: var(--font-cormorant), serif; font-size: 1.15rem; font-weight: 400; color: #1a1a1a; margin-bottom: 5px; }
        .cat-count { font-size: 11px; color: #b5a99a; letter-spacing: 0.04em; }

        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; }
        .how-num { font-family: var(--font-cormorant), serif; font-size: 3rem; font-weight: 400; color: #e8e4de; line-height: 1; margin-bottom: 14px; }
        .how-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .how-body { font-size: 13px; color: #888; line-height: 1.75; }
        .how-tag { display: inline-block; margin-top: 14px; font-size: 10px; color: #b5a99a; border: 1px solid #e8e4de; padding: 3px 10px; letter-spacing: 0.08em; }

        .editorial { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #e8e4de; border-bottom: 1px solid #e8e4de; }
        .edit-pane { padding: 52px 2.5rem; }
        .edit-eyebrow { font-size: 10px; letter-spacing: 0.2em; color: #b5a99a; text-transform: uppercase; margin-bottom: 16px; }
        .edit-h2 { font-family: var(--font-cormorant), serif; font-size: 2.25rem; font-weight: 400; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.01em; }
        .edit-body { font-size: 13px; color: #888; line-height: 1.8; margin-bottom: 22px; }
        .edit-features { display: flex; flex-direction: column; gap: 9px; margin-bottom: 26px; }
        .edit-feature { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #888; }
        .edit-dot { width: 3px; height: 3px; background: #b5a99a; border-radius: 50%; flex-shrink: 0; }

        .ai-strip { background: #1a1a1a; padding: 52px 2.5rem; border-bottom: 1px solid #1a1a1a; }
        .ai-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 4rem; align-items: center; }
        .ai-eyebrow { font-size: 10px; letter-spacing: 0.2em; color: #444; text-transform: uppercase; margin-bottom: 16px; }
        .ai-h2 { font-family: var(--font-cormorant), serif; font-size: 2.5rem; font-weight: 400; color: #faf9f7; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.01em; }
        .ai-sub { font-size: 13px; color: #555; line-height: 1.8; margin-bottom: 22px; }
        .ai-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .ai-tag { font-size: 11px; color: #444; border: 1px solid #2a2a2a; padding: 5px 12px; letter-spacing: 0.04em; }
        .ai-cards { display: flex; flex-direction: column; gap: 1px; background: #2a2a2a; }
        .ai-card { background: #111; padding: 18px 20px; }
        .ai-platform { font-size: 10px; color: #444; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 7px; }
        .ai-text { font-size: 13px; color: #666; line-height: 1.6; }
        .ai-meta { font-size: 10px; color: #2a2a2a; margin-top: 6px; }

        .cta { padding: 80px 2.5rem; text-align: center; background: #1a1a1a; }
        .cta-eyebrow { font-size: 10px; letter-spacing: 0.22em; color: #444; text-transform: uppercase; margin-bottom: 16px; }
        .cta-h2 { font-family: var(--font-cormorant), serif; font-size: 3rem; font-weight: 400; color: #faf9f7; margin-bottom: 12px; letter-spacing: -0.01em; line-height: 1.1; }
        .cta-sub { font-size: 13px; color: #555; margin-bottom: 32px; line-height: 1.7; }
        .cta-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        .footer { border-top: 1px solid #2a2a2a; background: #1a1a1a; padding: 24px 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
        .footer-links a { font-size: 11px; color: #444; text-decoration: none; letter-spacing: 0.04em; }
        .footer-links a:hover { color: #888; }
        .footer-copy { font-size: 11px; color: #333; }

        /* ── Mobile overlay hero styles ── */
        .mobile-hero-track { display: flex; will-change: transform; }
        .mobile-hero-slide { flex-shrink: 0; width: 100%; position: relative; }
        .mobile-hero-slide video { width: 100%; aspect-ratio: 9/14; object-fit: cover; display: block; }
        .mobile-hero-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.42) 45%, rgba(0,0,0,0.08) 100%); pointer-events: none; }
        .mobile-hero-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 20px 22px; }
        .mobile-hero-eyebrow { font-size: 9px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 10px; }
        .mobile-hero-h1 { font-family: var(--font-cormorant), serif; font-size: 2.5rem; font-weight: 400; color: #ffffff; line-height: 1.08; margin-bottom: 10px; letter-spacing: -0.01em; }
        .mobile-hero-sub { font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.65; margin-bottom: 18px; max-width: 34ch; }
        .mobile-hero-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .mobile-btn-primary { background: #ffffff; color: #1a1a1a; font-size: 10px; font-weight: 700; padding: 9px 20px; letter-spacing: 0.08em; text-decoration: none; display: inline-block; }
        .mobile-btn-ghost { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85); font-size: 10px; font-weight: 500; padding: 9px 20px; border: 1px solid rgba(255,255,255,0.28); letter-spacing: 0.06em; text-decoration: none; display: inline-block; }
        .mobile-hero-dots { position: absolute; right: 14px; top: 50%; transform: translateY(-60%); display: flex; flex-direction: column; gap: 5px; z-index: 2; }
        .mobile-hero-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.35); border: none; padding: 0; cursor: pointer; transition: background 0.2s, height 0.2s; }
        .mobile-hero-dot.active { background: #ffffff; height: 14px; border-radius: 2px; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ai-grid { grid-template-columns: 1fr; gap: 2rem; }
        }
        @media (max-width: 768px) {
          .invite-banner { display: none; }
          .invite-banner { padding: 10px 1rem; }
          .invite-banner-text { font-size: 11px; }
          .invite-banner-link { font-size: 11px; white-space: nowrap; }
          .hero { grid-template-columns: 1fr; border-bottom: none; }
          .hero-left { display: none; }
          .hero-right { display: block !important; background: none; border-bottom: 1px solid #e8e4de; }
          .hero-desktop-cell { display: none !important; }
          .hero-mobile-overlay { display: block; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
          .pill-row { padding: 16px 1rem; }
          .section { padding: 36px 1.5rem; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
          .how-grid { grid-template-columns: 1fr; gap: 2rem; }
          .editorial { grid-template-columns: 1fr; }
          .edit-pane { padding: 36px 1.5rem; }
          .ai-strip { padding: 36px 1.5rem; }
          .cta { padding: 52px 1.5rem; }
          .footer { padding: 20px 1.5rem; }
        }
        @media (max-width: 480px) {
          .cat-grid { grid-template-columns: 1fr; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <Navbar />

      {/* Invite banner — hidden on mobile, visible on desktop */}
      <div className="invite-banner">
        <span className="invite-banner-text">Invite-only access — currently accepting applications from select vendors & creators</span>
        <Link href="/signup" className="invite-banner-link">Request your invite →</Link>
      </div>

      {/* Hero */}
      <div className="hero">
        {/* Desktop left copy — hidden on mobile */}
        <div className="hero-left">
          <div className="hero-eyebrow">Affiliate platform · By Invite Only</div>
          <h1 className="hero-h1">Promote products.<br />Earn a commission<br />on sales.</h1>
          <p className="hero-sub">A curated marketplace connecting vetted vendors with motivated creators. Apply to promote, share your link, collect commissions directly.</p>
          <div className="hero-btns">
            <Link href="/signup" className="btn-primary">Request access</Link>
            <Link href="/marketplace" className="btn-ghost">Browse products</Link>
          </div>
        </div>

        <div className="hero-right">
          {/* Desktop 2x2 grid */}
          <div className="hero-desktop-cell hero-video-cell">
            <video autoPlay muted loop playsInline><source src="/hero1.mp4" type="video/mp4" /></video>
          </div>
          <div className="hero-desktop-cell hero-video-cell">
            <video autoPlay muted loop playsInline><source src="/hero2.mp4" type="video/mp4" /></video>
          </div>
          <div className="hero-desktop-cell hero-video-cell">
            <video autoPlay muted loop playsInline><source src="/hero3.mp4" type="video/mp4" /></video>
          </div>
          <div className="hero-desktop-cell hero-video-cell">
            <video autoPlay muted loop playsInline><source src="/hero4.mp4" type="video/mp4" /></video>
          </div>

          {/* Mobile full-width overlay hero */}
          <div className="hero-mobile-overlay">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Slides injected dynamically by script */}
              <div id="mobile-hero-track" className="mobile-hero-track" />

              {/* Dots injected dynamically by script */}
              <div id="mobile-hero-dots" className="mobile-hero-dots" />

              {/* Copy overlaid on video */}
              <div className="mobile-hero-content">
                <div className="mobile-hero-eyebrow">Affiliate platform · By invite only</div>
                <h1 className="mobile-hero-h1">Promote products.<br />Earn a commission<br />on sales.</h1>
                <p className="mobile-hero-sub">A curated marketplace connecting vetted vendors with motivated creators.</p>
                <div className="mobile-hero-btns">
                  <Link href="/signup" className="mobile-btn-primary">Request access</Link>
                  <Link href="/marketplace" className="mobile-btn-ghost">Browse products</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat bar */}
      <div className="stat-bar">
        {[
          { val: stats.commissions > 0 ? fmt(stats.commissions) : 'Growing', label: 'Total commissions tracked' },
          { val: stats.products > 0 ? `${stats.products}+` : 'New', label: 'Active products listed' },
          { val: stats.affiliates > 0 ? stats.affiliates.toLocaleString() : 'Growing', label: 'Registered affiliates' },
          { val: '30', label: 'Day cookie window' },
        ].map(s => (
          <div key={s.label} className="stat-cell">
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category pills */}
      <div className="pill-row">
        {CATEGORIES.map(cat => (
          <Link key={cat} href={`/marketplace?category=${encodeURIComponent(cat)}`} className="pill">{cat}</Link>
        ))}
      </div>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">Products to promote</div>
            <Link href="/marketplace" className="section-link">View all →</Link>
          </div>
          <ProductCarousel products={featuredProducts as any} loggedIn={loggedIn} />
        </div>
      )}

      {/* Browse by category */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">Browse by category</div>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map(name => {
            const count = categoryCounts[name] ?? 0
            return (
              <Link key={name} href={`/marketplace?category=${encodeURIComponent(name)}`} className="cat-card">
                <div className="cat-name">{name}</div>
                <div className="cat-count">{count > 0 ? `${count} product${count !== 1 ? 's' : ''}` : 'Coming soon'}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">How it works</div>
        </div>
        <div className="how-grid">
          {[
            { num: '01', title: 'Vendors list their product', body: 'Submit your product, set your commission rate, and define brand rules. AI generates TikTok hooks, captions, email swipes, and scripts for every affiliate automatically.', tag: 'For vendors' },
            { num: '02', title: 'Affiliates apply and promote', body: 'Browse the marketplace, apply to promote any product, and grab your unique tracked link. Post on TikTok, Instagram, YouTube, or your own site.', tag: 'For affiliates' },
            { num: '03', title: 'Commissions pay automatically', body: 'Every confirmed sale fires a server-side postback. Commissions calculate in real time and pay via Stripe — no manual transfers, no minimums.', tag: 'Automatic' },
          ].map(s => (
            <div key={s.num}>
              <div className="how-num">{s.num}</div>
              <div className="how-title">{s.title}</div>
              <p className="how-body">{s.body}</p>
              <span className="how-tag">{s.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor / Affiliate split */}
      <div className="editorial">
        <div className="edit-pane" style={{ background: '#faf9f7', borderRight: '1px solid #e8e4de' }}>
          <div className="edit-eyebrow">For affiliates</div>
          <h2 className="edit-h2">Your content.<br />Real income.</h2>
          <p className="edit-body">Browse curated products that match your niche. Apply to promote, get your unique link, and start earning commissions on every confirmed sale — paid directly.</p>
          <div className="edit-features">
            {['AI-generated hooks, captions & scripts per product', 'Unique tracked link for every product', 'Live commission & click dashboard', '30 day cookie tracking window', 'Free to join — no monthly fees'].map(f => (
              <div key={f} className="edit-feature"><div className="edit-dot" />{f}</div>
            ))}
          </div>
          <Link href="/signup" className="btn-primary">Sign up to promote</Link>
        </div>
        <div className="edit-pane" style={{ background: '#1a1a1a' }}>
          <div className="edit-eyebrow" style={{ color: '#444' }}>For vendors</div>
          <h2 className="edit-h2" style={{ color: '#faf9f7' }}>Your product.<br />Thousands of creators.</h2>
          <p className="edit-body" style={{ color: '#555' }}>List once, reach thousands of motivated creators who are genuinely incentivised to sell. Set your commission, define your brand rules. You control every term.</p>
          <div className="edit-features">
            {['Set commissions from 5% to 70%', 'Auto-approve or manually review affiliates', 'Real-time sales and earnings dashboard', 'Enforce brand guidelines', 'Free to list — 10% on confirmed sales only'].map(f => (
              <div key={f} className="edit-feature" style={{ color: '#555' }}><div className="edit-dot" style={{ background: '#333' }} />{f}</div>
            ))}
          </div>
          <Link href="/vendor-signup" style={{ background: '#faf9f7', color: '#1a1a1a', fontSize: '11px', fontWeight: 600, padding: '10px 24px', border: '1px solid #faf9f7', cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>List your product</Link>
        </div>
      </div>

      {/* AI strip */}
      <div className="ai-strip">
        <div className="ai-grid">
          <div>
            <div className="ai-eyebrow">AI-powered</div>
            <h2 className="ai-h2">The platform that writes<br />your pitch for you.</h2>
            <p className="ai-sub">Every product listing includes AI-generated affiliate assets. Affiliates start selling in minutes — not days.</p>
            <div className="ai-tag-row">
              {['TikTok hooks', 'IG captions', 'Email swipes', 'YouTube scripts', 'AI UGC video'].map(tag => (
                <span key={tag} className="ai-tag">{tag}</span>
              ))}
            </div>
          </div>
          <div className="ai-cards">
            {[
              { platform: 'TikTok — Hook', text: '"POV: you found the product everyone\'s buying but nobody\'s talking about yet…"', meta: 'Beauty & Wellness · 28% commission' },
              { platform: 'Instagram — Caption', text: '"This changed my morning routine completely. Link in bio if you want in."', meta: 'Wellness Course · 40% commission' },
              { platform: 'Email — Swipe copy', text: '"Hey [name] — I rarely send these but this one is converting at 8% and I had to share…"', meta: 'SaaS Tool · 35% recurring commission' },
            ].map(card => (
              <div key={card.platform} className="ai-card">
                <div className="ai-platform">{card.platform}</div>
                <div className="ai-text">{card.text}</div>
                <div className="ai-meta">{card.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <div className="cta-eyebrow">Get started today</div>
        <h2 className="cta-h2">Ready to grow<br />your reach?</h2>
        <p className="cta-sub">Join vendors and affiliates already building on UGCA.<br />Invite-only — request your spot today.</p>
        <div className="cta-btns">
          <Link href="/signup" style={{ background: '#faf9f7', color: '#1a1a1a', fontSize: '11px', fontWeight: 600, padding: '12px 28px', border: '1px solid #faf9f7', cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>Request your invite</Link>
          <Link href="/vendor-signup" style={{ background: 'none', color: '#555', fontSize: '11px', fontWeight: 600, padding: '12px 28px', border: '1px solid #333', cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>List your product</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.22em', color: '#444' }}>U G C A</div>
        <div className="footer-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/vendor-signup">Vendors</Link>
        </div>
        <div className="footer-copy">© 2026 UGCAffiliates · HONNYDO LLC.</div>
      </footer>

      {/* Carousel script — mobile only, random start, dynamic slides */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function initMobileHero() {
            var track = document.getElementById('mobile-hero-track');
            var dotsContainer = document.getElementById('mobile-hero-dots');
            if (!track || !dotsContainer) return;

            // ── Video list — add/remove filenames here freely ──
            var videos = ['hero1.mp4', 'hero2.mp4', 'hero3.mp4', 'hero4.mp4'];

            // Shuffle videos randomly on every page load
            for (var i = videos.length - 1; i > 0; i--) {
              var j = Math.floor(Math.random() * (i + 1));
              var tmp = videos[i]; videos[i] = videos[j]; videos[j] = tmp;
            }

            var slideCount = videos.length;

            // Build slides dynamically: clone-last + real slides + clone-first
            var allSlides = [videos[slideCount - 1]].concat(videos).concat([videos[0]]);
            track.innerHTML = '';
            allSlides.forEach(function(src) {
              var slide = document.createElement('div');
              slide.className = 'mobile-hero-slide';
              slide.innerHTML = '<video autoplay muted loop playsinline><source src="/' + src + '" type="video/mp4"></video><div class="mobile-hero-gradient"></div>';
              track.appendChild(slide);
            });

            // Build dots dynamically
            dotsContainer.innerHTML = '';
            videos.forEach(function(_, i) {
              var btn = document.createElement('button');
              btn.className = 'mobile-hero-dot' + (i === 0 ? ' active' : '');
              btn.setAttribute('data-dot', i);
              dotsContainer.appendChild(btn);
            });
            var dots = dotsContainer.querySelectorAll('.mobile-hero-dot');

            var current = 0;
            var startX = 0;
            var dragging = false;
            var dragDelta = 0;
            var transitioning = false;

            function getW() {
              var s = track.querySelector('.mobile-hero-slide');
              return s ? s.offsetWidth : window.innerWidth;
            }

            function setPos(idx, animate) {
              track.style.transition = animate ? 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
              track.style.transform = 'translateX(' + (-(idx + 1) * getW()) + 'px)';
            }

            function updateDots(idx) {
              dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
            }

            function goTo(idx, animate) {
              current = idx;
              setPos(idx, animate !== false);
              updateDots(((idx % slideCount) + slideCount) % slideCount);
            }

            setPos(0, false);

            track.addEventListener('transitionend', function() {
              if (current === slideCount) { goTo(0, false); }
              else if (current === -1) { goTo(slideCount - 1, false); }
              transitioning = false;
            });

            track.addEventListener('touchstart', function(e) {
              if (transitioning) return;
              startX = e.touches[0].clientX;
              dragging = true;
              dragDelta = 0;
              track.style.transition = 'none';
            }, { passive: true });

            track.addEventListener('touchmove', function(e) {
              if (!dragging) return;
              dragDelta = e.touches[0].clientX - startX;
              track.style.transform = 'translateX(' + (-(current + 1) * getW() + dragDelta) + 'px)';
            }, { passive: true });

            track.addEventListener('touchend', function() {
              if (!dragging) return;
              dragging = false;
              transitioning = true;
              if (dragDelta < -50) { goTo(current + 1, true); }
              else if (dragDelta > 50) { goTo(current - 1, true); }
              else { goTo(current, true); transitioning = false; }
            });

            dots.forEach(function(dot) {
              dot.addEventListener('click', function() {
                transitioning = true;
                goTo(parseInt(dot.getAttribute('data-dot')), true);
              });
            });

            window.addEventListener('resize', function() { setPos(current, false); });
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMobileHero);
          } else {
            initMobileHero();
          }
        })();
      ` }} />
    </div>
  )
}