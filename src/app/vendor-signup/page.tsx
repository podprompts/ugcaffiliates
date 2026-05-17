// src/app/vendor-signup/page.tsx
// Public vendor landing page — replaces the broken /vendors redirect.
// All "Sign up to sell" links now point here.

import Link from 'next/link'

export default function VendorSignupPage() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans), sans-serif', background: '#ffffff', color: '#0d0d0d', minHeight: '100vh' }}>
      <style>{`
        .vs-hero { background: #0d0d0d; padding: 5rem 2.5rem; text-align: center; }
        .vs-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; }
        .vs-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; padding: 4rem 2.5rem; }
        .vs-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 0 2.5rem 4rem; }
        @media (max-width: 900px) {
          .vs-features { grid-template-columns: repeat(2, 1fr); }
          .vs-steps    { grid-template-columns: 1fr; gap: 2rem; }
          .vs-plans    { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .vs-hero     { padding: 3rem 1rem; }
          .vs-features { grid-template-columns: 1fr; }
          .vs-steps    { padding: 2.5rem 1rem; }
          .vs-plans    { padding: 0 1rem 3rem; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/login"  style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, background: '#0d0d0d', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="vs-hero">
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1.25rem' }}>For vendors</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, color: '#ffffff', lineHeight: 1.1, marginBottom: '1.25rem', maxWidth: '18ch', margin: '0 auto 1.25rem' }}>
          Your product.<br />Thousands of creators.
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '44ch', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          List your product once. An army of motivated affiliates promote it everywhere. You set the rules, we track the sales.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 700, padding: '0.85rem 2.5rem', borderRadius: '3px', textDecoration: 'none' }}>Start your free trial</Link>
          <Link href="/pricing" style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'flex', alignItems: 'center' }}>See pricing →</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>7-day free trial · No card required to start</div>
      </div>

      {/* Features */}
      <div className="vs-features">
        {[
          { icon: '⚡', title: 'Instant affiliate army', body: 'Your listing goes live in the marketplace immediately. Affiliates browse and apply to promote within hours.' },
          { icon: '📊', title: 'Real-time dashboard', body: 'See every click, application, and sale as it happens. Know exactly which affiliates are driving revenue.' },
          { icon: '🤖', title: 'AI content generation', body: 'Every product automatically gets TikTok hooks, IG captions, email swipes, and YouTube scripts — generated for your affiliates.' },
          { icon: '🔒', title: 'You control everything', body: 'Set your commission rate, auto-approve or manually review affiliates, enforce brand guidelines and prohibited terms.' },
          { icon: '🔗', title: 'Server-side tracking', body: 'Every confirmed purchase fires a postback. 30-day cookie window. No lost commissions, no disputes.' },
          { icon: '💸', title: 'Simple fee structure', body: 'Flat monthly subscription plus a 4% fee on confirmed affiliate sales. No surprise costs.' },
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
            { num: '01', title: 'Create your account', body: 'Sign up, choose a plan, and complete your vendor profile in under 5 minutes.' },
            { num: '02', title: 'List your product', body: 'Add your product details, set your commission rate, and upload your media. AI handles the affiliate content.' },
            { num: '03', title: 'Watch affiliates apply', body: 'Your product goes live in the marketplace. Review applications and approve the affiliates you want.' },
          ].map(s => (
            <div key={s.num}>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 400, color: '#e8e6e2', lineHeight: 1, marginBottom: '0.75rem' }}>{s.num}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '0.6rem' }}>{s.title}</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '4rem 2.5rem 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Simple pricing</h2>
        <p style={{ fontSize: '13.5px', color: '#888', marginBottom: '3rem' }}>7-day free trial on all plans. Cancel anytime.</p>
      </section>
      <div className="vs-plans">
        {[
          { name: 'Starter', price: '$39', period: '/mo', products: '5 products', features: ['Unlimited affiliates', 'Real-time dashboard', 'AI asset generation', 'Basic analytics'], highlight: false },
          { name: 'Growth',  price: '$89', period: '/mo', products: '20 products', features: ['Everything in Starter', 'Priority marketplace placement', 'Advanced analytics', 'Affiliate matching'], highlight: true },
          { name: 'Pro',     price: '$179', period: '/mo', products: 'Unlimited products', features: ['Everything in Growth', 'Featured homepage placement', 'Full analytics suite', 'Dedicated support'], highlight: false },
        ].map(plan => (
          <div key={plan.name} style={{ border: plan.highlight ? '2px solid #0d0d0d' : '1px solid #e8e6e2', borderRadius: '4px', padding: '2rem', position: 'relative', background: plan.highlight ? '#f9f8f6' : '#fff' }}>
            {plan.highlight && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#0d0d0d', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.75rem', borderRadius: '100px' }}>Most popular</div>}
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 700 }}>{plan.price}</span>
              <span style={{ fontSize: '13px', color: '#888' }}>{plan.period}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '1.5rem' }}>{plan.products}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '0.6rem', fontSize: '13px', color: '#3a3a3a', alignItems: 'center' }}>
                  <span style={{ color: '#0d0d0d', fontWeight: 700, flexShrink: 0 }}>—</span>{f}
                </div>
              ))}
            </div>
            <Link href="/signup" style={{ display: 'block', textAlign: 'center', background: plan.highlight ? '#0d0d0d' : 'transparent', color: plan.highlight ? '#fff' : '#0d0d0d', border: '1px solid #0d0d0d', fontSize: '13px', fontWeight: 600, padding: '0.7rem', borderRadius: '3px', textDecoration: 'none' }}>
              Start free trial
            </Link>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '4rem 2.5rem', borderTop: '1px solid #e8e6e2', marginTop: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '1rem' }}>Ready to list your product?</h2>
        <Link href="/signup" style={{ display: 'inline-block', background: '#0d0d0d', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '0.9rem 3rem', borderRadius: '3px', textDecoration: 'none' }}>Create your vendor account</Link>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '0.75rem' }}>No card required · 7-day free trial</div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '1.5rem 2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Pricing', '/pricing'], ['Marketplace', '/marketplace']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}