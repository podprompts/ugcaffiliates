// src/app/vendor/integration/page.tsx
// Shows vendors exactly how to wire up conversion tracking on their store.
// Includes: pixel snippet, postback URL, secret key, platform instructions.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

export default function VendorIntegrationPage() {
  const router = useRouter()
  const [profileInitial, setProfileInitial] = useState('V')
  const [postbackSecret, setPostbackSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'vendor') { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      // Fetch postback secret from API
      const secretRes = await fetch('/api/vendor/integration', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (secretRes.ok) {
        const data = await secretRes.json()
        setPostbackSecret(data.postback_secret ?? '')
      }

      setLoading(false)
    }
    load()
  }, [])

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const pixelSnippet = `<script>
  window.UGCA_CONVERSION = {
    amount: "{{ORDER_TOTAL}}",
    order_id: "{{ORDER_ID}}"
  };
</script>
<script src="https://ugcaffiliates.com/track.js" async></script>`

  const postbackUrl = `https://ugcaffiliates.com/api/postback?ref={{UGCA_REF}}&order_id={{ORDER_ID}}&amount={{ORDER_TOTAL}}&secret=${postbackSecret}`

  const sectionStyle = {
    background: '#ffffff',
    border: '1px solid #e8e6e2',
    borderRadius: '4px',
    padding: '1.75rem',
    marginBottom: '1.25rem',
  }

  const sectionLabel = {
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#888',
    fontWeight: 600,
    marginBottom: '0.5rem',
  }

  const codeBox = {
    background: '#0d0d0d',
    borderRadius: '4px',
    padding: '1.25rem',
    fontFamily: 'monospace',
    fontSize: '12.5px',
    color: '#e8e6e2',
    overflowX: 'auto' as const,
    whiteSpace: 'pre' as const,
    position: 'relative' as const,
    lineHeight: 1.6,
  }

  const copyBtn = (text: string, key: string) => (
    <button
      onClick={() => copy(text, key)}
      style={{
        fontSize: '12px', fontWeight: 600,
        color: copied === key ? '#16a34a' : '#0d0d0d',
        background: '#f2f0ec', border: '1px solid #e8e6e2',
        padding: '0.3rem 0.75rem', borderRadius: '3px',
        cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {copied === key ? '✓ Copied' : 'Copy'}
    </button>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .vi-content { max-width: 860px; margin: 0 auto; padding: 2.5rem 2rem; }
        .vi-step { display: flex; gap: 1rem; margin-bottom: '0.75rem'; }
        .vi-step-num { width: 24px; height: 24px; borderRadius: 50%; background: #0d0d0d; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        @media (max-width: 768px) { .vi-content { padding: 1.25rem 1rem; } }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="vi-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Integration & tracking</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '0.5rem' }}>
            Add one of these to your store so UGCA can track affiliate sales and credit commissions automatically.
          </p>
        </div>

        {/* ── Method 1: Pixel ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ background: '#0d0d0d', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2px' }}>RECOMMENDED</div>
                <div style={sectionLabel}>Method 1 — JavaScript Pixel</div>
              </div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', margin: 0 }}>
                Paste this on your <strong>order confirmation page</strong>. Replace the placeholder values with your actual order data. Works with any platform.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ ...codeBox, flex: 1 }}>{pixelSnippet}</div>
            <div style={{ paddingTop: '0.5rem' }}>{copyBtn(pixelSnippet, 'pixel')}</div>
          </div>

          <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#3a3a3a', marginBottom: '0.5rem' }}>Replace the placeholders:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                ['{{ORDER_TOTAL}}', 'The order total in dollars, e.g. "49.00"'],
                ['{{ORDER_ID}}', 'Your unique order ID, e.g. "ORD-12345"'],
              ].map(([placeholder, desc]) => (
                <div key={placeholder} style={{ display: 'flex', gap: '0.75rem', fontSize: '12.5px', alignItems: 'flex-start' }}>
                  <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace', flexShrink: 0 }}>{placeholder}</code>
                  <span style={{ color: '#555' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform-specific instructions */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Platform instructions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  platform: 'Shopify',
                  steps: 'Settings → Checkout → Additional scripts. Paste the snippet and replace ORDER_TOTAL with {{ total_price | money_without_currency }} and ORDER_ID with {{ order.name }}.'
                },
                {
                  platform: 'WooCommerce',
                  steps: 'Appearance → Theme Editor → functions.php. Add via woocommerce_thankyou hook, using $order->get_total() and $order->get_id().'
                },
                {
                  platform: 'Custom / Other',
                  steps: 'Paste the snippet in the <head> or before </body> of your order confirmation page. Replace placeholders with your order data from your backend.'
                },
              ].map(({ platform, steps }) => (
                <div key={platform} style={{ border: '1px solid #e8e6e2', borderRadius: '4px', padding: '0.875rem 1rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.3rem' }}>{platform}</div>
                  <div style={{ fontSize: '12.5px', color: '#555', lineHeight: 1.6 }}>{steps}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Method 2: Server-side postback ── */}
        <div style={sectionStyle}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={sectionLabel}>Method 2 — Server-side postback URL</div>
            <p style={{ fontSize: '13px', color: '#3a3a3a', margin: 0 }}>
              More reliable than the pixel. Fire a GET request to this URL from your server after a confirmed payment. Never exposed to the browser.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ ...codeBox, flex: 1, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }}>
              {postbackUrl}
            </div>
            <div style={{ paddingTop: '0.5rem' }}>{copyBtn(postbackUrl, 'postback')}</div>
          </div>

          <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#3a3a3a', marginBottom: '0.5rem' }}>Replace the placeholders:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                ['{{UGCA_REF}}', 'The ugca_ref cookie or URL param from the visitor\'s session'],
                ['{{ORDER_ID}}', 'Your unique order ID'],
                ['{{ORDER_TOTAL}}', 'The order total in dollars, e.g. 49.00'],
              ].map(([placeholder, desc]) => (
                <div key={placeholder} style={{ display: 'flex', gap: '0.75rem', fontSize: '12.5px', alignItems: 'flex-start' }}>
                  <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace', flexShrink: 0 }}>{placeholder}</code>
                  <span style={{ color: '#555' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '12.5px', color: '#92400e' }}>
            <strong>Keep your secret safe.</strong> Never expose the postback URL with your secret in client-side code or public repos. Only fire it from your server.
          </div>
        </div>

        {/* ── Your secret key ── */}
        <div style={sectionStyle}>
          <div style={sectionLabel}>Your postback secret</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
            This secret is already included in your postback URL above. Keep it private — contact us if you need it rotated.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ ...codeBox, flex: 1, padding: '0.85rem 1rem' }}>
              {postbackSecret || '••••••••••••••••••••••'}
            </div>
            {postbackSecret && copyBtn(postbackSecret, 'secret')}
          </div>
        </div>

        {/* ── How it works ── */}
        <div style={sectionStyle}>
          <div style={sectionLabel}>How tracking works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              ['Affiliate clicks their link', 'The affiliate shares their unique /go/ link. When a visitor clicks it, they\'re redirected to your product page with a ugca_ref cookie set (30-day window).'],
              ['Visitor shops and buys', 'The cookie persists through checkout. When the order confirms, the pixel or postback fires with the ref code, order ID, and amount.'],
              ['Commission is recorded', 'UGCA records the conversion, calculates the affiliate\'s commission, and marks it pending. You see it in your Conversions dashboard.'],
              ['Payout happens', 'After the hold period, the commission becomes payable. You pay the affiliate directly — UGCA invoices you the 10% platform fee separately.'],
            ].map(([title, desc], i) => (
              <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0d0d0d', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Test your integration ── */}
        <div style={{ ...sectionStyle, background: '#f9f8f6' }}>
          <div style={sectionLabel}>Test your integration</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
            After installing the pixel or postback, do a test purchase using one of your affiliate links. Then check your Conversions page — the test sale should appear within seconds.
          </p>
          <a href="/vendor/conversions" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none', display: 'inline-block' }}>
            View Conversions →
          </a>
        </div>
      </div>
    </div>
  )
}