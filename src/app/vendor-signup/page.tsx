// src/app/vendor-signup/page.tsx
import Link from 'next/link'

export default function VendorSignupPage() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#ffffff', color: '#0d0d0d', minHeight: '100vh' }}>
      <style>{`
        .vs-nav { borderBottom: 1px solid #e8e6e2; padding: 0 2.5rem; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .vs-hero { background: #0d0d0d; padding: 5rem 2.5rem; text-align: center; }
        .vs-hero-btns { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
        .vs-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; }
        .vs-feature { background: #f9f8f6; padding: 2rem 1.75rem; }
        .vs-feature-icon { width: 36px; height: 36px; border: 1px solid #d0cdc8; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .vs-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; padding: 4rem 2.5rem; }
        .vs-pricing { padding: 4rem 2.5rem; text-align: center; background: #f9f8f6; }
        .vs-pricing-card { display: inline-block; background: #ffffff; border: 2px solid #0d0d0d; border-radius: 4px; padding: 2.5rem 3rem; max-width: 400px; width: 100%; box-sizing: border-box; }
        .vs-cta { text-align: center; padding: 4rem 2.5rem; border-top: 1px solid #e8e6e2; }
        .vs-footer { border-top: 1px solid #e8e6e2; padding: 1.5rem 2.5rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between; }

        @media (max-width: 900px) {
          .vs-features { grid-template-columns: repeat(2, 1fr); }
          .vs-steps { grid-template-columns: 1fr; gap: 2rem; }
        }
        @media (max-width: 600px) {
          .vs-nav { padding: 0 1rem; }
          .vs-nav-links span { display: none; }
          .vs-hero { padding: 3rem 1.25rem; }
          .vs-hero h1 { font-size: 2.5rem !important; }
          .vs-hero p { font-size: 14px !important; }
          .vs-hero-btns { flex-direction: column; align-items: center; }
          .vs-hero-btns a { width: 100%; max-width: 280px; text-align: center; }
          .vs-features { grid-template-columns: 1fr; }
          .vs-feature { padding: 1.5rem 1.25rem; }
          .vs-steps { padding: 2.5rem 1.25rem; gap: 1.75rem; }
          .vs-pricing { padding: 2.5rem 1.25rem; }
          .vs-pricing-card { padding: 1.75rem 1.5rem; }
          .vs-cta { padding: 2.5rem 1.25rem; }
          .vs-cta h2 { font-size: 2rem !important; }
          .vs-footer { padding: 1.25rem 1rem; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>
        <div className="vs-nav-links" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <span><Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link></span>
          <Link href="/signup?role=vendor" style={{ fontSize: '13px', fontWeight: 600, background: '#0d0d0d', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="vs-hero">
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666', fontWeight: 500, marginBottom: '1.25rem' }}>For vendors · Free to list</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, color: '#ffffff', lineHeight: 1.1, maxWidth: '18ch', margin: '0 auto 1.25rem' }}>
          Your product.<br />Thousands of creators.
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '44ch', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
          List your product for free. Affiliates promote it everywhere. You only pay a 10% platform fee on confirmed sales — zero upfront cost.
        </p>

        {/* Free badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '0.4rem 1rem', marginBottom: '2rem' }}>
          <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Free to list · 10% on confirmed sales only</span>
        </div>

        <div className="vs-hero-btns">
          <Link href="/signup?role=vendor" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 700, padding: '0.85rem 2.5rem', borderRadius: '3px', textDecoration: 'none' }}>List your product free</Link>
          <Link href="/marketplace" style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Browse the marketplace →</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>No credit card required · No monthly fees · Cancel anytime</div>
      </div>

      {/* Features */}
      <div className="vs-features">
        {[
          {
            title: 'Free to list',
            body: 'No subscription, no upfront cost. List your product and reach affiliates immediately. We only earn when you earn.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            title: 'Real-time dashboard',
            body: 'See every click, application, and sale as it happens. Know exactly which affiliates are driving revenue.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            title: 'AI content generation',
            body: 'Every product automatically gets TikTok hooks, IG captions, email swipes, and YouTube scripts — generated for your affiliates.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a5 5 0 01-2.328 1.347v1.153a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1.153a5 5 0 01-2.328-1.347L6.343 16.9z" />
              </svg>
            ),
          },
          {
            title: 'You control everything',
            body: 'Set your commission rate, auto-approve or manually review affiliates, enforce brand guidelines and prohibited terms.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ),
          },
          {
            title: 'Server-side tracking',
            body: 'Every confirmed purchase fires a postback. 30-day cookie window. No lost commissions, no disputes.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ),
          },
          {
            title: 'Simple fee structure',
            body: 'Just 10% on confirmed affiliate sales. No monthly fees, no setup costs, no surprises. You keep the rest.',
            icon: (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            ),
          },
        ].map(f => (
          <div key={f.title} className="vs-feature">
            <div className="vs-feature-icon">{f.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</div>
            <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7, margin: 0 }}>{f.body}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <section style={{ borderTop: '1px solid #e8e6e2', borderBottom: '1px solid #e8e6e2' }}>
        <div className="vs-steps">
          {[
            { num: '01', title: 'Create your free account', body: 'Sign up in under 2 minutes. No credit card, no subscription required.' },
            { num: '02', title: 'List your product', body: 'Add your product details, set your commission rate, and upload your media. AI handles the affiliate content automatically.' },
            { num: '03', title: 'Watch affiliates apply', body: 'Your product goes live in the marketplace. Review applications and approve the affiliates you want promoting your brand.' },
          ].map(s => (
            <div key={s.num}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 400, color: '#e8e6e2', lineHeight: 1, marginBottom: '0.75rem' }}>{s.num}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '0.6rem' }}>{s.title}</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <div className="vs-pricing">
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Simple, transparent pricing</h2>
        <p style={{ fontSize: '13.5px', color: '#888', maxWidth: '40ch', margin: '0 auto 3rem' }}>No monthly fees. No setup costs. We only make money when you make money.</p>
        <div className="vs-pricing-card">
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Free to list</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3.5rem', fontWeight: 700 }}>$0</span>
            <span style={{ fontSize: '13px', color: '#888' }}>/month</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '2rem' }}>+ 10% on confirmed affiliate sales</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem', textAlign: 'left' }}>
            {[
              'Unlimited product listings',
              'Unlimited affiliates',
              'Real-time sales dashboard',
              'AI affiliate asset generation',
              'Server-side conversion tracking',
              '30-day cookie window',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: '0.75rem', fontSize: '13px', color: '#3a3a3a', alignItems: 'center' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>
          <Link href="/signup?role=vendor" style={{ display: 'block', textAlign: 'center', background: '#0d0d0d', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '0.85rem', borderRadius: '3px', textDecoration: 'none' }}>
            Start listing for free
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="vs-cta">
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '1rem' }}>Ready to list your product?</h2>
        <Link href="/signup?role=vendor" style={{ display: 'inline-block', background: '#0d0d0d', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '0.9rem 3rem', borderRadius: '3px', textDecoration: 'none' }}>Create your free vendor account</Link>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '0.75rem' }}>No credit card required · Free forever · 10% on sales only</div>
      </div>

      {/* Footer */}
      <footer className="vs-footer">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Marketplace', '/marketplace']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}