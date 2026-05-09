// src/app/page.tsx

import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#ffffff', color: '#0d0d0d' }}>

      {/* ANNOUNCE BAR */}
      <div style={{ background: '#f9f8f6', borderBottom: '1px solid #e8e6e2', textAlign: 'center', padding: '0.55rem 1rem', fontSize: '12.5px', color: '#3a3a3a' }}>
        Launching 2026 — Join the waitlist for early access.{' '}
        <Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Sign up free
        </Link>
      </div>

      {/* NAV */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', height: '68px' }}>
          {/* Logo */}
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
            U G C A
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '540px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #d0cdc8', borderRadius: '100px', padding: '0.5rem 1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <span style={{ fontSize: '13.5px', color: '#888888' }}>Search products or vendors</span>
          </div>

          {/* Nav actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
            <Link href="/vendors" style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3a', textDecoration: 'none' }}>Sign up to sell</Link>
            <Link href="/login" style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3a', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.55rem 1.4rem', borderRadius: '4px', textDecoration: 'none' }}>
              Sign up to promote
            </Link>
          </div>
        </div>
      </nav>

      {/* CATEGORY NAV */}
      <div style={{ borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' as const }}>
        {['Featured', 'New', 'Digital Products', 'SaaS & Tools', 'Courses', 'Beauty & Wellness', 'Fashion', 'Home & Living', 'Fitness', 'Finance'].map((cat, i) => (
          <Link
            key={cat}
            href={`/marketplace?category=${cat.toLowerCase().replace(/ /g, '-')}`}
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: i === 0 ? '#0d0d0d' : '#3a3a3a',
              textDecoration: 'none',
              padding: '0.85rem 1rem',
              whiteSpace: 'nowrap' as const,
              borderBottom: i === 0 ? '2px solid #0d0d0d' : '2px solid transparent',
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* HERO — Video Background */}
      <div style={{ position: 'relative', height: '520px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        >
          <source src="/hero.mp4" type="video/mp4" />
          <img src="/hero-poster.jpg" alt="Hero background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.2) 55%, rgba(13,13,13,0) 100%)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '3.5rem 2.5rem', maxWidth: '600px' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3.75rem', fontWeight: 500, lineHeight: 1.05, color: '#ffffff', marginBottom: '1rem' }}>
            Find your next<br />top seller
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.88)', marginBottom: '1.75rem', lineHeight: 1.55, maxWidth: '42ch' }}>
            Sign up to promote products from 1,000+ vendors and earn commissions on every sale you drive.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const }}>
            <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '13.5px', fontWeight: 600, padding: '0.7rem 1.6rem', borderRadius: '3px', textDecoration: 'none' }}>
              Sign up to promote
            </Link>
            <Link href="/vendors" style={{ fontSize: '13.5px', fontWeight: 500, color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '3px', opacity: 0.9 }}>
              Are you a vendor? Sign up to sell
            </Link>
          </div>
        </div>
      </div>
      {/* TRENDING PRODUCTS */}
      <section style={{ padding: '3.5rem 2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500 }}>Trending products to promote</h2>
          <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #d0cdc8', padding: '0.45rem 1rem', borderRadius: '3px', textDecoration: 'none' }}>
            All products
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
          {[
            { brand: 'GlowLab Co.', name: 'Hydration Serum Bundle', price: '$89', commission: '28%', earn: '$24.92' },
            { brand: 'CreatorIQ', name: 'UGC Mastery Course 2026', price: '$297', commission: '40%', earn: '$118.80' },
            { brand: 'LaunchKit', name: 'SaaS Starter Template Pack', price: '$149', commission: '35%', earn: '$52.15' },
            { brand: 'Nora Studio', name: 'Minimalist Capsule Wardrobe', price: '$175', commission: '22%', earn: '$38.50' },
            { brand: 'MindFlow', name: 'Meditation App — Annual Plan', price: '$149', commission: '50%', earn: '$74.50' },
          ].map((p) => (
            <div key={p.name} style={{ cursor: 'pointer' }}>
              <div style={{ width: '100%', aspectRatio: '1', background: '#f2f0ec', borderRadius: '2px', marginBottom: '0.75rem', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888' }}>Image</span>
                <div style={{ position: 'absolute' as const, bottom: '8px', left: '8px', background: '#0d0d0d', color: '#ffffff', fontSize: '10.5px', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                  {p.commission}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '13px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{p.brand}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.3rem', lineHeight: 1.35 }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Earn up to <strong style={{ color: '#0d0d0d' }}>{p.earn}</strong> per sale</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: '#e8e6e2', margin: '0 2.5rem' }} />

      {/* CATEGORIES */}
      <section style={{ padding: '3.5rem 2.5rem', background: '#f9f8f6' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500, marginBottom: '1.75rem' }}>Browse by category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e8e6e2' }}>
          {[
            { name: 'Digital Products', count: '214 products' },
            { name: 'Courses & Education', count: '189 products' },
            { name: 'Beauty & Wellness', count: '312 products' },
            { name: 'Fashion & Apparel', count: '278 products' },
            { name: 'SaaS & Software', count: '97 products' },
            { name: 'Fitness', count: '143 products' },
            { name: 'Home & Living', count: '201 products' },
            { name: 'Food & Drink', count: '119 products' },
          ].map((c) => (
            <Link key={c.name} href={`/marketplace?category=${c.name.toLowerCase().replace(/ /g, '-')}`} style={{ background: '#ffffff', padding: '1.75rem 1.5rem', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.15rem', fontWeight: 500, color: '#0d0d0d' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: '#888888', marginTop: '0.4rem' }}>{c.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '4rem 2.5rem', borderTop: '1px solid #e8e6e2', borderBottom: '1px solid #e8e6e2' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '2rem' }}>How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
          {[
            { num: '01', title: 'Vendors list their product', body: 'Submit your product, set your commission rate, and define your brand rules. AI generates affiliate-ready assets — hooks, captions, scripts — automatically.', tag: 'For vendors' },
            { num: '02', title: 'Affiliates apply and promote', body: 'Browse the marketplace, apply to promote any product, and grab your unique tracked link. Post on TikTok, Instagram, YouTube, or your own site.', tag: 'For affiliates' },
            { num: '03', title: 'Sales tracked. Stripe pays out.', body: 'Every confirmed purchase fires a server-side postback to UGCA. Commissions calculate in real time and deposit directly to affiliates via Stripe Connect.', tag: 'Automatic' },
          ].map((s) => (
            <div key={s.num}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 400, color: '#e8e6e2', lineHeight: 1, marginBottom: '0.75rem' }}>{s.num}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.6rem' }}>{s.title}</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{s.body}</p>
              <span style={{ display: 'inline-block', marginTop: '0.85rem', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.25rem 0.7rem', border: '1px solid #d0cdc8', color: '#3a3a3a', borderRadius: '2px' }}>{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* VENDOR / AFFILIATE SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {[
          {
            eyebrow: 'For vendors',
            headline: 'Your product.\nTheir audience.',
            body: 'List once, reach thousands of motivated creators who are genuinely incentivized to sell. You control every term.',
            features: ['Set commissions from 5% to 70%', 'Auto-approve or manually review affiliates', 'Real-time sales and earnings dashboard', 'Enforce brand guidelines and prohibited terms', 'Automatic Stripe payouts to all affiliates'],
            cta: 'Sign up to sell',
            href: '/vendors',
          },
          {
            eyebrow: 'For affiliates',
            headline: 'Your content.\nReal income.',
            body: 'Browse products that match your niche. Get your link. Post your content. Commissions paid weekly with no minimums.',
            features: ['AI-generated hooks and captions per product', 'Unique tracked link for every product', 'Live commission and click dashboard', '30-day cookie tracking window', 'Weekly payouts, no payout minimum'],
            cta: 'Sign up to promote',
            href: '/signup',
          },
        ].map((pane, i) => (
          <div key={pane.eyebrow} style={{ padding: '4rem 3rem', borderTop: '1px solid #e8e6e2', borderRight: i === 0 ? '1px solid #e8e6e2' : 'none' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>{pane.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '0.9rem', whiteSpace: 'pre-line' as const }}>{pane.headline}</h2>
            <p style={{ fontSize: '13.5px', color: '#3a3a3a', lineHeight: 1.75, marginBottom: '2rem', maxWidth: '38ch' }}>{pane.body}</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem', marginBottom: '2rem' }}>
              {pane.features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '13px', color: '#3a3a3a' }}>
                  <span style={{ width: '14px', height: '1px', background: '#0d0d0d', flexShrink: 0, marginTop: '8px', display: 'inline-block' }} />
                  {f}
                </div>
              ))}
            </div>
            <Link href={pane.href} style={{ display: 'inline-block', background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.65rem 1.5rem', borderRadius: '3px', textDecoration: 'none' }}>
              {pane.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* AI STRIP */}
      <div style={{ background: '#1a1a18', padding: '4rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '5rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '1rem' }}>AI-powered</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, color: '#ffffff', lineHeight: 1.15, marginBottom: '0.9rem' }}>
            The platform that writes<br />your pitch for you.
          </h2>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '1.75rem', maxWidth: '38ch' }}>
            Every product listing includes AI-generated affiliate assets. Affiliates start selling in minutes. Vendors get higher-quality promotions from day one.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
            {['TikTok hooks', 'IG captions', 'Email swipes', 'YouTube scripts', 'Niche matching'].map((tag) => (
              <span key={tag} style={{ fontSize: '12px', fontWeight: 500, padding: '0.3rem 0.8rem', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px' }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px', background: 'rgba(255,255,255,0.08)' }}>
          {[
            { platform: 'TikTok — Hook', text: '"POV: you found the product everyone\'s buying but nobody\'s talking about yet..."', meta: 'Hydration Serum Bundle · 28% commission' },
            { platform: 'Instagram — Caption', text: '"This changed my morning routine completely. Link in bio if you want in."', meta: 'Wellness Course · 40% commission' },
            { platform: 'Email — Swipe copy', text: '"Hey [name] — I rarely send these but this one is converting at 8% and I had to share..."', meta: 'SaaS Tool · 35% recurring commission' },
          ].map((card) => (
            <div key={card.platform} style={{ background: '#111111', padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: '0.4rem' }}>{card.platform}</div>
              <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{card.text}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '0.4rem' }}>{card.meta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '5rem 2.5rem', textAlign: 'center' as const, background: '#f2f0ec' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>Get started today</div>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 500, marginBottom: '0.85rem', letterSpacing: '-0.01em' }}>Ready to grow your reach?</h2>
        <p style={{ fontSize: '14px', color: '#3a3a3a', marginBottom: '2rem' }}>Join vendors and affiliates already building on UGCA. Free to start, no credit card required.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link href="/vendors" style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '13.5px', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: '3px', textDecoration: 'none' }}>List your product</Link>
          <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '13.5px', fontWeight: 500, padding: '0.75rem 2rem', border: '1px solid #d0cdc8', borderRadius: '3px', textDecoration: 'none' }}>Start promoting</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '2.25rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>U G C A</div>
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {['Terms', 'Privacy', 'Docs', 'Support', 'Blog'].map((l) => (
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#888' }}>2026 UGCAffiliates, Inc.</div>
      </footer>

    </div>
  )
}