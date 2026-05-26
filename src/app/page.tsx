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
        /* ── Invite banner ── */
        .invite-banner { background: #f0ece5; border-bottom: 1px solid #e8e4de; padding: 10px 2.5rem; display: flex; align-items: center; justify-content: space-between; }
        .invite-banner-text { font-size: 12px; color: #888; letter-spacing: 0.03em; }
        .invite-banner-link { font-size: 12px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.06em; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

        /* ── Hero ── */
        .hero { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e8e4de; align-items: stretch; }
        .hero-left { padding: 72px 48px 72px 2.5rem; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid #e8e4de; }
        .hero-eyebrow { font-size: 10px; letter-spacing: 0.22em; color: #b5a99a; text-transform: uppercase; margin-bottom: 20px; }
        .hero-h1 { font-family: var(--font-cormorant), serif; font-size: 3.5rem; font-weight: 400; line-height: 1.08; color: #1a1a1a; margin-bottom: 20px; letter-spacing: -0.01em; }
        .hero-sub { font-size: 13.5px; color: #888; line-height: 1.75; margin-bottom: 32px; max-width: 38ch; }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .hero-right { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background-color: #e8e4de; }
        .hero-video-cell { overflow: hidden; background: #1a1a1a; aspect-ratio: 3/4; }
        .hero-video-cell video { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ── Buttons ── */
        .btn-primary { background: #1a1a1a; color: #faf9f7; font-size: 11px; font-weight: 600; padding: 10px 24px; border: 1px solid #1a1a1a; cursor: pointer; letter-spacing: 0.08em; font-family: var(--font-dm-sans), sans-serif; text-decoration: none; display: inline-block; }
        .btn-outline { background: none; color: #1a1a1a; font-size: 11px; font-weight: 600; padding: 10px 24px; border: 1px solid #1a1a1a; cursor: pointer; letter-spacing: 0.08em; font-family: var(--font-dm-sans), sans-serif; text-decoration: none; display: inline-block; }
        .btn-ghost { background: none; color: #888; font-size: 11px; font-weight: 500; padding: 10px 24px; border: 1px solid #e0dbd4; cursor: pointer; letter-spacing: 0.06em; font-family: var(--font-dm-sans), sans-serif; text-decoration: none; display: inline-block; }

        /* ── Stat bar ── */
        .stat-bar { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e8e4de; }
        .stat-cell { padding: 28px 24px; border-right: 1px solid #e8e4de; text-align: center; background: #faf9f7; }
        .stat-cell:last-child { border-right: none; }
        .stat-val { font-family: var(--font-cormorant), serif; font-size: 2rem; font-weight: 400; color: #1a1a1a; letter-spacing: -0.02em; margin-bottom: 4px; }
        .stat-label { font-size: 10px; color: #b5a99a; letter-spacing: 0.12em; text-transform: uppercase; }

        /* ── Category pills ── */
        .pill-row { display: flex; gap: 8px; padding: 20px 2.5rem; border-bottom: 1px solid #e8e4de; overflow-x: auto; scrollbar-width: none; background: #faf9f7; }
        .pill-row::-webkit-scrollbar { display: none; }
        .pill { font-size: 11px; color: #888; border: 1px solid #e0dbd4; padding: 6px 18px; cursor: pointer; white-space: nowrap; letter-spacing: 0.04em; background: #faf9f7; text-decoration: none; display: inline-block; }
        .pill:hover { border-color: #1a1a1a; color: #1a1a1a; }

        /* ── Section ── */
        .section { padding: 52px 2.5rem; border-bottom: 1px solid #e8e4de; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; }
        .section-title { font-family: var(--font-cormorant), serif; font-size: 1.75rem; font-weight: 400; color: #1a1a1a; letter-spacing: -0.01em; }
        .section-link { font-size: 11px; color: #b5a99a; letter-spacing: 0.08em; text-decoration: none; }
        .section-link:hover { color: #1a1a1a; }

        /* ── Product grid ── */
        .product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e4de; }
        .product-card { background: #faf9f7; }
        .product-img { background: #f0ece5; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .product-img-inner { width: 52%; height: 52%; background: #ddd8cf; }
        .product-badge { position: absolute; top: 12px; left: 12px; background: #1a1a1a; color: #faf9f7; font-size: 9px; font-weight: 600; padding: 3px 9px; letter-spacing: 0.1em; }
        .product-info { padding: 16px 18px; }
        .product-cat { font-size: 10px; color: #b5a99a; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
        .product-title { font-family: var(--font-cormorant), serif; font-size: 1.1rem; font-weight: 400; color: #1a1a1a; margin-bottom: 4px; line-height: 1.3; }
        .product-vendor { font-size: 11px; color: #b5a99a; margin-bottom: 12px; }
        .product-commission { display: flex; align-items: center; justify-content: space-between; }
        .comm-tag { font-size: 10px; color: #5a7a4a; background: #eef3e8; padding: 3px 9px; font-weight: 600; letter-spacing: 0.06em; }
        .earn-amt { font-size: 13px; color: #1a1a1a; font-weight: 600; }

        /* ── Category grid ── */
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e4de; }
        .cat-card { background: #faf9f7; padding: 28px 24px; text-decoration: none; display: block; }
        .cat-card:hover { background: #f5f2ed; }
        .cat-name { font-family: var(--font-cormorant), serif; font-size: 1.15rem; font-weight: 400; color: #1a1a1a; margin-bottom: 5px; }
        .cat-count { font-size: 11px; color: #b5a99a; letter-spacing: 0.04em; }

        /* ── How it works ── */
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; }
        .how-num { font-family: var(--font-cormorant), serif; font-size: 3rem; font-weight: 400; color: #e8e4de; line-height: 1; margin-bottom: 14px; }
        .how-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .how-body { font-size: 13px; color: #888; line-height: 1.75; }
        .how-tag { display: inline-block; margin-top: 14px; font-size: 10px; color: #b5a99a; border: 1px solid #e8e4de; padding: 3px 10px; letter-spacing: 0.08em; }

        /* ── Editorial split ── */
        .editorial { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #e8e4de; border-bottom: 1px solid #e8e4de; }
        .edit-pane { padding: 52px 2.5rem; }
        .edit-eyebrow { font-size: 10px; letter-spacing: 0.2em; color: #b5a99a; text-transform: uppercase; margin-bottom: 16px; }
        .edit-h2 { font-family: var(--font-cormorant), serif; font-size: 2.25rem; font-weight: 400; line-height: 1.15; margin-bottom: 14px; letter-spacing: -0.01em; }
        .edit-body { font-size: 13px; color: #888; line-height: 1.8; margin-bottom: 22px; }
        .edit-features { display: flex; flex-direction: column; gap: 9px; margin-bottom: 26px; }
        .edit-feature { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #888; }
        .edit-dot { width: 3px; height: 3px; background: #b5a99a; border-radius: 50%; flex-shrink: 0; }

        /* ── AI strip ── */
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

        /* ── CTA ── */
        .cta { padding: 80px 2.5rem; text-align: center; background: #1a1a1a; }
        .cta-eyebrow { font-size: 10px; letter-spacing: 0.22em; color: #444; text-transform: uppercase; margin-bottom: 16px; }
        .cta-h2 { font-family: var(--font-cormorant), serif; font-size: 3rem; font-weight: 400; color: #faf9f7; margin-bottom: 12px; letter-spacing: -0.01em; line-height: 1.1; }
        .cta-sub { font-size: 13px; color: #555; margin-bottom: 32px; line-height: 1.7; }
        .cta-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        /* ── Footer ── */
        .footer { border-top: 1px solid #2a2a2a; background: #1a1a1a; padding: 24px 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
        .footer-links a { font-size: 11px; color: #444; text-decoration: none; letter-spacing: 0.04em; }
        .footer-links a:hover { color: #888; }
        .footer-copy { font-size: 11px; color: #333; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .ai-grid { grid-template-columns: 1fr; gap: 2rem; }
        }
        @media (max-width: 768px) {
          .invite-banner { padding: 10px 1rem; }
          .hero { grid-template-columns: 1fr; }
          .hero-left { padding: 48px 1.5rem; border-right: none; border-bottom: 1px solid #e8e4de; }
          .hero-right { display: block; position: relative; overflow: hidden; }
          .hero-carousel { display: flex; transition: transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94); will-change: transform; }
          .hero-carousel-slide { flex-shrink: 0; width: 75vw; aspect-ratio: 3/4; overflow: hidden; background: #1a1a1a; margin-right: 1px; }
          .hero-carousel-slide video { width: 100%; height: 100%; object-fit: cover; display: block; }
          .hero-carousel-dots { display: flex; justify-content: center; gap: 6px; padding: 12px 0; background: #faf9f7; }
          .hero-carousel-dot { width: 5px; height: 5px; border-radius: 50%; background: #d0cbc2; border: none; padding: 0; cursor: pointer; transition: background 0.2s, width 0.2s; }
          .hero-carousel-dot.active { background: #1a1a1a; width: 16px; border-radius: 3px; }
          .hero-h1 { font-size: 2.5rem !important; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
          .pill-row { padding: 16px 1rem; }
          .section { padding: 36px 1.5rem; }
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
          .how-grid { grid-template-columns: 1fr; gap: 2rem; }
          .editorial { grid-template-columns: 1fr; }
          .edit-pane { padding: 36px 1.5rem; }
          .ai-strip { padding: 36px 1.5rem; }
          .cta { padding: 52px 1.5rem; }
          .footer { padding: 20px 1.5rem; }
        }
        @media (max-width: 480px) {
          .product-grid { grid-template-columns: 1fr; }
          .cat-grid { grid-template-columns: 1fr; }
          .stat-bar { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <Navbar />

      {/* Invite banner */}
      <div className="invite-banner">
        <span className="invite-banner-text">Invite-only access — currently accepting applications from select vendors & creators</span>
        <Link href="/signup" className="invite-banner-link">Request your invite →</Link>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">Affiliate platform · Est. 2026</div>
          <h1 className="hero-h1">Promote products.<br />Earn what you're<br />worth.</h1>
          <p className="hero-sub">A curated marketplace connecting vetted vendors with motivated creators. Apply to promote, share your link, collect commissions directly.</p>
          <div className="hero-btns">
            <Link href="/signup" className="btn-primary">Request access</Link>
            <Link href="/marketplace" className="btn-ghost">Browse products</Link>
          </div>
        </div>
        <div className="hero-right">
          {/* Desktop: 2x2 grid */}
          <div className="hero-video-cell" style={{ display: 'contents' } as any}>
            <style>{`
              @media (min-width: 769px) {
                .hero-right { display: grid !important; grid-template-columns: 1fr 1fr; gap: 1px; background-color: #e8e4de; overflow: visible !important; }
                .hero-desktop-cell { display: block !important; }
                .hero-mobile-carousel { display: none !important; }
              }
              @media (max-width: 768px) {
                .hero-desktop-cell { display: none !important; }
                .hero-mobile-carousel { display: block !important; }
              }
            `}</style>
          </div>

          {/* Desktop cells */}
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

          {/* Mobile infinite swipe carousel */}
          <div className="hero-mobile-carousel">
            <div style={{ overflow: 'hidden', position: 'relative' }}>
              <div id="ugca-carousel" className="hero-carousel">
                {/* Cloned last slide at front for infinite feel */}
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero4.mp4" type="video/mp4" /></video>
                </div>
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero1.mp4" type="video/mp4" /></video>
                </div>
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero2.mp4" type="video/mp4" /></video>
                </div>
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero3.mp4" type="video/mp4" /></video>
                </div>
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero4.mp4" type="video/mp4" /></video>
                </div>
                {/* Cloned first slide at end for infinite feel */}
                <div className="hero-carousel-slide">
                  <video autoPlay muted loop playsInline><source src="/hero1.mp4" type="video/mp4" /></video>
                </div>
              </div>
            </div>
            <div className="hero-carousel-dots">
              <button className="hero-carousel-dot active" data-dot="0" />
              <button className="hero-carousel-dot" data-dot="1" />
              <button className="hero-carousel-dot" data-dot="2" />
              <button className="hero-carousel-dot" data-dot="3" />
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function initCarousel() {
              var track = document.getElementById('ugca-carousel');
              if (!track) return;
              var dots = document.querySelectorAll('.hero-carousel-dot');
              var slideCount = 4;
              var current = 0;
              var slideW = 0;
              var startX = 0;
              var dragging = false;
              var dragDelta = 0;
              var transitioning = false;

              function getSlideW() {
                var s = track.querySelector('.hero-carousel-slide');
                return s ? s.offsetWidth + 1 : window.innerWidth * 0.75;
              }

              function setPos(idx, animate) {
                slideW = getSlideW();
                track.style.transition = animate ? 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
                track.style.transform = 'translateX(' + (-(idx + 1) * slideW) + 'px)';
              }

              function updateDots(idx) {
                dots.forEach(function(d, i) {
                  d.classList.toggle('active', i === idx);
                });
              }

              function goTo(idx, animate) {
                current = idx;
                setPos(idx, animate !== false);
                updateDots(((idx % slideCount) + slideCount) % slideCount);
              }

              setPos(0, false);

              track.addEventListener('transitionend', function() {
                if (current === slideCount) {
                  goTo(0, false);
                } else if (current === -1) {
                  goTo(slideCount - 1, false);
                }
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
                slideW = getSlideW();
                track.style.transform = 'translateX(' + (-(current + 1) * slideW + dragDelta) + 'px)';
              }, { passive: true });

              track.addEventListener('touchend', function() {
                if (!dragging) return;
                dragging = false;
                transitioning = true;
                if (dragDelta < -50) {
                  goTo(current + 1, true);
                } else if (dragDelta > 50) {
                  goTo(current - 1, true);
                } else {
                  goTo(current, true);
                  transitioning = false;
                }
              });

              dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                  var idx = parseInt(dot.getAttribute('data-dot'));
                  transitioning = true;
                  goTo(idx, true);
                });
              });

              window.addEventListener('resize', function() {
                setPos(current, false);
              });
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initCarousel);
            } else {
              initCarousel();
            }
          })();
        ` }} />
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
            {['AI-generated hooks, captions & scripts per product', 'Unique tracked link for every product', 'Live commission & click dashboard', '30-day cookie tracking window', 'Free to join — no monthly fees'].map(f => (
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
    </div>
  )
}