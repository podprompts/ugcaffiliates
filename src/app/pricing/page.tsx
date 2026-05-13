// src/app/pricing/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const PLANS = [
  { name: 'Starter', price: 39, products: '5 products', features: ['Up to 5 active product listings', 'Unlimited affiliates per product', 'Real-time sales dashboard', 'AI affiliate asset generation', 'Basic analytics', '7-day free trial'], cta: 'Start free trial', highlighted: false },
  { name: 'Growth', price: 89, products: '20 products', features: ['Up to 20 active product listings', 'Unlimited affiliates per product', 'Priority marketplace placement', 'AI affiliate asset generation', 'Advanced analytics & reporting', 'Affiliate matching suggestions', '7-day free trial'], cta: 'Start free trial', highlighted: true },
  { name: 'Pro', price: 179, products: 'Unlimited products', features: ['Unlimited product listings', 'Unlimited affiliates per product', 'Featured homepage placement', 'AI affiliate asset generation', 'Full analytics suite', 'Dedicated support', 'Early access to new features', 'Free onboarding call with our team'], cta: 'Get started', highlighted: false },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function handleCheckout(planName: string) {
    setLoading(planName)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/signup?next=pricing'); return }
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ plan: planName.toLowerCase() }) })
      const { url, error } = await res.json()
      if (error) { alert(error); setLoading(null); return }
      window.location.href = url
    } catch { alert('Something went wrong.'); setLoading(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .pricing-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; height: 68px; }
        .pricing-nav-actions { margin-left: auto; display: flex; gap: 1rem; align-items: center; }
        .pricing-wrap { max-width: 1100px; margin: 0 auto; padding: 4rem 2rem; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 3rem; }
        .plan-card { padding: 2.5rem 2rem; }
        .faq-wrap { max-width: 640px; margin: 0 auto; }
        @media (max-width: 768px) {
          .pricing-nav { padding: 0 1rem; height: 56px; }
          .pricing-nav-actions a:not(:last-child) { display: none; }
          .pricing-wrap { padding: 2rem 1rem; }
          .plans-grid { grid-template-columns: 1fr; }
          .plan-card { padding: 1.75rem 1.25rem; }
        }
      `}</style>

      <nav className="pricing-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div className="pricing-nav-actions">
          <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none' }}>Get started</Link>
        </div>
      </nav>

      <div className="pricing-wrap">
        <div style={{ textAlign: 'center' as const, marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '1rem' }}>Pricing</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 500, marginBottom: '1rem' }}>Simple, transparent pricing</h1>
          <p style={{ fontSize: '15px', color: '#3a3a3a', maxWidth: '48ch', margin: '0 auto', lineHeight: 1.65 }}>List your products, reach thousands of motivated creators, and only pay a flat monthly fee. No hidden costs. 7-day free trial on all plans.</p>
        </div>

        <div className="plans-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className="plan-card" style={{ background: plan.highlighted ? '#0d0d0d' : '#ffffff', position: 'relative' as const }}>
              {plan.highlighted && <div style={{ position: 'absolute' as const, top: '1.25rem', right: '1.25rem', fontSize: '11px', fontWeight: 600, color: '#0d0d0d', background: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '100px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Most popular</div>}
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: plan.highlighted ? 'rgba(255,255,255,0.5)' : '#888', marginBottom: '0.75rem' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '3rem', fontWeight: 600, color: plan.highlighted ? '#ffffff' : '#0d0d0d', lineHeight: 1 }}>${plan.price}</span>
                <span style={{ fontSize: '13px', color: plan.highlighted ? 'rgba(255,255,255,0.5)' : '#888' }}>/mo</span>
              </div>
              <div style={{ fontSize: '12px', color: plan.highlighted ? 'rgba(255,255,255,0.5)' : '#888', marginBottom: '2rem' }}>{plan.products}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.7rem', marginBottom: '2rem' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '13px', color: plan.highlighted ? 'rgba(255,255,255,0.8)' : '#3a3a3a' }}>
                    <span style={{ color: plan.highlighted ? '#ffffff' : '#0d0d0d', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>—</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={() => handleCheckout(plan.name)} disabled={loading === plan.name} style={{ width: '100%', padding: '0.85rem', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', background: plan.highlighted ? '#ffffff' : '#0d0d0d', color: plan.highlighted ? '#0d0d0d' : '#ffffff', border: 'none', borderRadius: '3px', cursor: loading === plan.name ? 'not-allowed' : 'pointer', opacity: loading === plan.name ? 0.7 : 1 }}>
                {loading === plan.name ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' as const, padding: '1.5rem', background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', marginBottom: '3rem' }}>
          <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>A <strong>4% transaction fee</strong> applies on confirmed affiliate sales, in addition to your monthly subscription.</div>
        </div>

        <div className="faq-wrap">
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500, marginBottom: '2rem', textAlign: 'center' as const }}>Common questions</h2>
          {[
            { q: 'How does the free trial work?', a: "All plans include a 7-day free trial. You'll need to enter a card to start, but you won't be charged until day 8. Cancel anytime before then." },
            { q: 'How do affiliates get paid?', a: 'UGCA tracks every sale and shows vendors exactly what they owe each affiliate. Vendors pay affiliates directly via PayPal, Venmo, bank transfer, or any method they agree on.' },
            { q: 'Can I change plans?', a: 'Yes — upgrade or downgrade anytime. Changes take effect at the next billing cycle.' },
            { q: 'What is the 4% transaction fee?', a: 'On top of your monthly subscription, a 4% fee applies to the sale amount of each confirmed affiliate conversion. This is charged to the vendor.' },
            { q: 'Do affiliates pay anything?', a: 'No. Affiliates join and promote products completely free. They earn commissions set by the vendor.' },
          ].map(faq => (
            <div key={faq.q} style={{ borderBottom: '1px solid #e8e6e2', padding: '1.25rem 0' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.5rem' }}>{faq.q}</div>
              <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}