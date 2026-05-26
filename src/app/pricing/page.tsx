// src/app/pricing/page.tsx
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .pricing-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; height: 68px; }
        .pricing-nav-actions { margin-left: auto; display: flex; gap: 1rem; align-items: center; }
        .pricing-wrap { max-width: 900px; margin: 0 auto; padding: 4rem 2rem; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 3rem; }
        .feature-card { background: #ffffff; padding: 1.75rem; }
        .faq-wrap { max-width: 640px; margin: 0 auto; }
        @media (max-width: 768px) {
          .pricing-nav { padding: 0 1rem; height: 56px; }
          .pricing-wrap { padding: 2rem 1rem; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="pricing-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div className="pricing-nav-actions">
          <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none' }}>Get started free</Link>
        </div>
      </nav>

      <div className="pricing-wrap">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '1rem' }}>Pricing</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 500, marginBottom: '1rem' }}>Free to start. We only earn when you do.</h1>
          <p style={{ fontSize: '15px', color: '#3a3a3a', maxWidth: '48ch', margin: '0 auto', lineHeight: 1.7 }}>
            No monthly fees. No setup costs. No subscriptions. List your product, get affiliates promoting it, and only pay a 10% platform fee on confirmed sales.
          </p>
        </div>

        {/* Main pricing card */}
        <div style={{ background: '#0d0d0d', borderRadius: '6px', padding: '3rem', textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: '1rem' }}>For vendors</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '5rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>$0</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/month</span>
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>+ 10% on confirmed affiliate sales only</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '2.5rem' }}>Charged automatically via Stripe when you approve a conversion. Zero risk until you make a sale.</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', maxWidth: '480px', margin: '0 auto 2.5rem', textAlign: 'left' }}>
            {[
              'Unlimited product listings',
              'Unlimited affiliate partners',
              'Real-time conversions dashboard',
              'AI-generated affiliate content',
              'Server-side conversion tracking',
              '30 day cookie window',
              'Shopify & WooCommerce integration',
              'Automatic Stripe payouts to affiliates',
              'Brand guidelines & prohibited terms',
              'Video & image asset uploads',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          <Link href="/signup?role=vendor" style={{ display: 'inline-block', background: '#ffffff', color: '#0d0d0d', fontSize: '14px', fontWeight: 700, padding: '0.9rem 3rem', borderRadius: '3px', textDecoration: 'none' }}>
            List your product free →
          </Link>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem' }}>No credit card required to sign up</div>
        </div>

        {/* Affiliate pricing */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '2rem', textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.75rem' }}>For affiliates</div>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Always free</div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>Affiliates never pay anything — ever. You earn commissions set by the vendor, paid automatically via Stripe.</div>
          <Link href="/signup" style={{ display: 'inline-block', background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.7rem 2rem', borderRadius: '3px', textDecoration: 'none' }}>
            Sign up to promote →
          </Link>
        </div>

        {/* How the fee works */}
        <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '2rem', marginBottom: '3rem' }}>
          <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 500, marginBottom: '1rem' }}>How the 10% platform fee works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              ['An affiliate drives a sale', 'The tracking pixel or postback fires and the conversion appears in your dashboard as pending.'],
              ['You review and approve', 'Check the sale is legitimate, then click "Approve & Pay" in your Conversions dashboard.'],
              ['Automatic split payment', 'UGCA charges your saved card the affiliate\'s commission plus our 10% platform fee in one transaction.'],
              ['Affiliate gets paid instantly', 'The commission lands in the affiliate\'s Stripe account within 2–7 business days. You keep everything else.'],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0d0d0d', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.2rem' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example */}
          <div style={{ marginTop: '1.5rem', background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.25rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: '0.75rem' }}>Example sale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Customer buys your $100 product</span>
                <span style={{ fontWeight: 600 }}>$100.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Affiliate commission (20%)</span>
                <span style={{ color: '#dc2626' }}>−$20.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>UGCA platform fee (10% of sale)</span>
                <span style={{ color: '#dc2626' }}>−$10.00</span>
              </div>
              <div style={{ height: '1px', background: '#e8e6e2', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>You keep</span>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '15px' }}>$70.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-wrap">
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500, marginBottom: '2rem', textAlign: 'center' }}>Common questions</h2>
          {[
            { q: 'Is there really no monthly fee?', a: 'Yes. UGCAffiliates is completely free to list products on. You only pay the 10% platform fee when an affiliate sale is confirmed and approved by you.' },
            { q: 'When does UGCA charge the platform fee?', a: 'The fee is charged automatically when you click "Approve & Pay" on a conversion. It\'s taken from your saved card along with the affiliate\'s commission in one transaction — no manual invoicing.' },
            { q: 'How do affiliates get paid?', a: 'Affiliates connect their Stripe account. When you approve a conversion, UGCA automatically transfers their commission to their bank account within 2–7 business days via Stripe Connect.' },
            { q: 'What commission rates can I offer?', a: 'You can set any commission rate between 5% and 70%. The higher the commission, the more motivated affiliates will be to promote your product.' },
            { q: 'Do affiliates pay anything?', a: 'Never. Affiliates join and promote for free. They earn the commission rate you set, paid automatically by UGCA on your behalf.' },
            { q: 'What tracking methods are supported?', a: 'We support a JavaScript pixel for client-side tracking and server-side postback URLs for Shopify, WooCommerce, and custom stores. Full integration docs and optional installation services are available.' },
            { q: 'Can I approve affiliates manually?', a: 'Yes. You can review each affiliate application and approve only those who fit your brand. Or enable auto-approve to let anyone who applies start promoting immediately.' },
          ].map(faq => (
            <div key={faq.q} style={{ borderBottom: '1px solid #e8e6e2', padding: '1.25rem 0' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.5rem' }}>{faq.q}</div>
              <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{faq.a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', background: '#f9f8f6', borderRadius: '6px' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.75rem' }}>Ready to get started?</h2>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>Free to list. No credit card. No monthly fees.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup?role=vendor" style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: '3px', textDecoration: 'none' }}>List your product free</Link>
            <Link href="/signup" style={{ background: '#ffffff', color: '#0d0d0d', fontSize: '13px', fontWeight: 500, padding: '0.75rem 2rem', border: '1px solid #d0cdc8', borderRadius: '3px', textDecoration: 'none' }}>Sign up as affiliate</Link>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '2rem 2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/contact" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Contact</Link>
        </div>
      </footer>
    </div>
  )
}