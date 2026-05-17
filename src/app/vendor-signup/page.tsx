// src/app/vendor-signup/page.tsx
// Public vendor landing page — sign up is free, no subscription required.
// Sets role to 'vendor' directly on signup.

import Link from 'next/link'

export default function VendorSignupPage() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#ffffff', color: '#0d0d0d', minHeight: '100vh' }}>
      <style>{`
        .vs-hero { background: #0d0d0d; padding: 5rem 2.5rem; text-align: center; }
        .vs-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; }
        .vs-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; padding: 4rem 2.5rem; }
        @media (max-width: 900px) {
          .vs-features { grid-template-columns: repeat(2, 1fr); }
          .vs-steps    { grid-template-columns: 1fr; gap: 2rem; }
        }
        @media (max-width: 600px) {
          .vs-hero     { padding: 3rem 1rem; }
          .vs-features { grid-template-columns: 1fr; }
          .vs-steps    { padding: 2.5rem 1rem; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/login"  style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup?role=vendor" style={{ fontSize: '13px', fontWeight: 600, background: '#0d0d0d', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="vs-hero">
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>For vendors · Free to list</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, color: '#ffffff', lineHeight: 1.1, marginBottom: '1.25rem', maxWidth: '18ch', margin: '0 auto 1.25rem' }}>
          Your product.<br />Thousands of creators.
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '44ch', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
          List your product for free. Affiliates promote it everywhere. You only pay a 4% platform fee on confirmed sales — zero upfront cost.
        </p>

        {/* Free badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '0.4rem 1rem', marginBottom: '2rem' }}>
          <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Free to list · 4% on confirmed sales only</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup?role=vendor" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 700, padding: '0.85rem 2.5rem', borderRadius: '3px', textDecoration: 'none' }}>List your product free</Link>
          <Link href="/marketplace" style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'flex', alignItems: 'center' }}>Browse the marketplace →</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>No credit card required · No monthly fees · Cancel anytime</div>
      </div>

      {/* Features */}
      <div className="vs-features">
        {[
          { icon: '⚡', title: 'Free to list', body: 'No subscription, no upfront cost. List your product and reach affiliates immediately. We only earn when you earn.' },
          { icon: '📊', title: 'Real-time dashboard', body: 'See every click, application, and sale as it happens. Know exactly which affiliates are driving revenue.' },
          { icon: '🤖', title: 'AI content generation', body: 'Every product automatically gets TikTok hooks, IG captions, email swipes, and YouTube scripts — generated for your affiliates.' },
          { icon: '🔒', title: 'You control everything', body: 'Set your commission rate, auto-approve or manually review affiliates, enforce brand guidelines and prohibited terms.' },
          { icon: '🔗', title: 'Server-side tracking', body: 'Every confirmed purchase fires a postback. 30-day cookie window. No lost commissions, no disputes.' },
          { icon: '💸', title: 'Simple fee structure', body: 'Just 4% on confirmed affiliate sales. No monthly fees, no setup costs, no surprises. You keep the rest.' },
        ].map(f => (
          <div key={f.title} style={{ background: '#f9f8f6', padding: '2rem 1.75rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</div>
            <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{f.body}</p>
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
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing — simplified */}
      <section style={{ padding: '4rem 2.5rem', textAlign: 'center', background: '#f9f8f6' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Simple, transparent pricing</h2>
        <p style={{ fontSize: '13.5px', color: '#888', marginBottom: '3rem', maxWidth: '40ch', margin: '0 auto 3rem' }}>No monthly fees. No setup costs. We only make money when you make money.</p>
        <div style={{ display: 'inline-block', background: '#ffffff', border: '2px solid #0d0d0d', borderRadius: '4px', padding: '2.5rem 3rem', maxWidth: '400px', width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Free to list</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3.5rem', fontWeight: 700 }}>$0</span>
            <span style={{ fontSize: '13px', color: '#888' }}>/month</span>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '2rem' }}>+ 4% on confirmed affiliate sales</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem', textAlign: 'left' }}>
            {[
              'Unlimited product listings',
              'Unlimited affiliates',
              'Real-time sales dashboard',
              'AI affiliate asset generation',
              'Server-side conversion tracking',
              '30-day cookie window',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '13px', color: '#3a3a3a', alignItems: 'center' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
          </div>
          <Link href="/signup?role=vendor" style={{ display: 'block', textAlign: 'center', background: '#0d0d0d', color: '#fff', border: '1px solid #0d0d0d', fontSize: '13px', fontWeight: 600, padding: '0.85rem', borderRadius: '3px', textDecoration: 'none' }}>
            Start listing for free
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '4rem 2.5rem', borderTop: '1px solid #e8e6e2' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '1rem' }}>Ready to list your product?</h2>
        <Link href="/signup?role=vendor" style={{ display: 'inline-block', background: '#0d0d0d', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '0.9rem 3rem', borderRadius: '3px', textDecoration: 'none' }}>Create your free vendor account</Link>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '0.75rem' }}>No credit card required · Free forever · 4% on sales only</div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '1.5rem 2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Marketplace', '/marketplace']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}