// src/app/vendor/integration/page.tsx
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
  const [activeMethod, setActiveMethod] = useState<'pixel' | 'postback'>('pixel')

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
      if (!profile || !['vendor', 'admin'].includes(profile.role)) { router.push('/login'); return }
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

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

  const shopifyPostbackCode = `{% assign ugca_ref = "" %}
{% for param in checkout.attributes %}
  {% if param.key == "ugca_ref" %}
    {% assign ugca_ref = param.value %}
  {% endif %}
{% endfor %}

{% if ugca_ref != "" %}
<script>
  fetch("https://ugcaffiliates.com/api/postback?ref={{ ugca_ref }}&order_id={{ order.name | url_encode }}&amount={{ total_price | divided_by: 100.0 }}&secret=${postbackSecret}", {
    method: "GET"
  });
</script>
{% endif %}`

  const shopifyCartScript = `// Add to your theme.js or cart page JavaScript
// Run this on every page to capture the ugca_ref param
(function() {
  var ref = new URLSearchParams(window.location.search).get('ugca_ref');
  if (ref) {
    // Store in cart attributes so it's available at checkout
    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes: { ugca_ref: ref } })
    });
  }
})();`

  const wooPostbackCode = `// Add to your theme's functions.php
add_action('woocommerce_thankyou', 'ugca_server_postback', 10, 1);

function ugca_server_postback($order_id) {
  $order = wc_get_order($order_id);
  if (!$order) return;

  // Get ugca_ref from order meta (set during checkout)
  $ugca_ref = $order->get_meta('_ugca_ref');
  if (empty($ugca_ref)) return;

  $amount    = $order->get_total();
  $order_num = $order->get_order_number();
  $secret    = '${postbackSecret}';

  $url = add_query_arg([
    'ref'      => urlencode($ugca_ref),
    'order_id' => urlencode($order_num),
    'amount'   => $amount,
    'secret'   => $secret,
  ], 'https://ugcaffiliates.com/api/postback');

  wp_remote_get($url, ['blocking' => false, 'timeout' => 5]);
}

// Also add this to capture ugca_ref when visitor lands on your site
add_action('init', 'ugca_capture_ref');
function ugca_capture_ref() {
  if (isset($_GET['ugca_ref'])) {
    // Store in WooCommerce session
    if (function_exists('WC') && WC()->session) {
      WC()->session->set('ugca_ref', sanitize_text_field($_GET['ugca_ref']));
    }
    setcookie('ugca_ref', sanitize_text_field($_GET['ugca_ref']), time() + (30 * DAY_IN_SECONDS), '/');
  }
}

// Save ugca_ref to order meta when order is created
add_action('woocommerce_checkout_create_order', 'ugca_save_ref_to_order', 10, 2);
function ugca_save_ref_to_order($order, $data) {
  $ugca_ref = '';
  if (isset($_COOKIE['ugca_ref'])) {
    $ugca_ref = sanitize_text_field($_COOKIE['ugca_ref']);
  } elseif (function_exists('WC') && WC()->session) {
    $ugca_ref = WC()->session->get('ugca_ref', '');
  }
  if (!empty($ugca_ref)) {
    $order->update_meta_data('_ugca_ref', $ugca_ref);
  }
}`

  const sec = {
    background: '#ffffff',
    border: '1px solid #e8e6e2',
    borderRadius: '4px',
    padding: '1.75rem',
    marginBottom: '1.25rem',
  }
  const secLbl = {
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
    fontSize: '12px',
    color: '#e8e6e2',
    overflowX: 'auto' as const,
    whiteSpace: 'pre' as const,
    lineHeight: 1.6,
  }

  const copyBtn = (text: string, key: string) => (
    <button onClick={() => copy(text, key)} style={{ fontSize: '12px', fontWeight: 600, color: copied === key ? '#16a34a' : '#0d0d0d', background: '#f2f0ec', border: '1px solid #e8e6e2', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
        .vi-method-tabs { display: flex; gap: 0; margin-bottom: 1.25rem; border: 1px solid #e8e6e2; border-radius: 4px; overflow: hidden; }
        .vi-method-tab { flex: 1; padding: 0.75rem 1rem; background: #ffffff; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; color: #888; transition: all 0.15s; text-align: center; border-right: 1px solid #e8e6e2; }
        .vi-method-tab:last-child { border-right: none; }
        .vi-method-tab.active { background: #0d0d0d; color: #ffffff; font-weight: 600; }
        .vi-platform-tabs { display: flex; gap: 0.25rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .vi-platform-tab { padding: 0.4rem 0.85rem; background: #f2f0ec; border: none; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500; color: #888; transition: all 0.15s; }
        .vi-platform-tab.active { background: #0d0d0d; color: #ffffff; }
        @media (max-width: 768px) { .vi-content { padding: 1.25rem 1rem; } }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="vi-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Integration & tracking</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '0.5rem' }}>
            Choose a method to track affiliate sales on your store. The pixel works for most platforms. Server-side postback is more reliable and recommended for high volume.
          </p>
        </div>

        {/* Method selector */}
        <div className="vi-method-tabs">
          <button className={`vi-method-tab${activeMethod === 'pixel' ? ' active' : ''}`} onClick={() => setActiveMethod('pixel')}>
            ⬤ Method 1 — JavaScript Pixel <span style={{ fontSize: '10px', opacity: 0.7 }}>(Recommended)</span>
          </button>
          <button className={`vi-method-tab${activeMethod === 'postback' ? ' active' : ''}`} onClick={() => setActiveMethod('postback')}>
            ⬤ Method 2 — Server-side Postback
          </button>
        </div>

        {/* ── METHOD 1: PIXEL ── */}
        {activeMethod === 'pixel' && (
          <>
            <div style={sec}>
              <div style={{ ...secLbl, marginBottom: '0.75rem' }}>JavaScript pixel snippet</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
                Paste this on your <strong>order confirmation page</strong>. Replace the placeholders with your actual order data.
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ ...codeBox, flex: 1 }}>{pixelSnippet}</div>
                <div style={{ paddingTop: '0.5rem' }}>{copyBtn(pixelSnippet, 'pixel')}</div>
              </div>

              <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#3a3a3a', marginBottom: '0.5rem' }}>Replace the placeholders:</div>
                {[
                  ['{{ORDER_TOTAL}}', 'The order total in dollars, e.g. "49.00"'],
                  ['{{ORDER_ID}}', 'Your unique order ID, e.g. "ORD-12345"'],
                ].map(([p, d]) => (
                  <div key={p} style={{ display: 'flex', gap: '0.75rem', fontSize: '12.5px', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace', flexShrink: 0 }}>{p}</code>
                    <span style={{ color: '#555' }}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Platform instructions */}
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Platform instructions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
                    platform: 'Shopify',
                    steps: [
                      'Go to Settings → Checkout → Order status page',
                      'Paste the snippet into the "Additional scripts" box',
                      'Replace {{ORDER_TOTAL}} with: {{ total_price | money_without_currency }}',
                      'Replace {{ORDER_ID}} with: {{ order.name }}',
                    ]
                  },
                  {
                    platform: 'WooCommerce',
                    steps: [
                      'Install a plugin like "Code Snippets" or edit your theme\'s functions.php',
                      'Add the snippet via the woocommerce_thankyou hook',
                      'Replace {{ORDER_TOTAL}} with: $order->get_total()',
                      'Replace {{ORDER_ID}} with: $order->get_order_number()',
                    ]
                  },
                  {
                    platform: 'Custom / Other',
                    steps: [
                      'Paste the snippet anywhere on your order confirmation page',
                      'Replace placeholders with your backend order data',
                      'The script automatically reads the ugca_ref cookie set when the affiliate link was clicked',
                    ]
                  },
                ].map(({ platform, steps }) => (
                  <div key={platform} style={{ border: '1px solid #e8e6e2', borderRadius: '4px', padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.5rem' }}>{platform}</div>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {steps.map((s, i) => (
                        <li key={i} style={{ fontSize: '12.5px', color: '#555', lineHeight: 1.6 }}>{s}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── METHOD 2: SERVER-SIDE POSTBACK ── */}
        {activeMethod === 'postback' && (
          <>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#16a34a' }}>
              <strong>More reliable than the pixel.</strong> Server-side requests are not affected by ad blockers, browser extensions, or cookie restrictions.
            </div>

            {/* Postback URL */}
            <div style={sec}>
              <div style={{ ...secLbl, marginBottom: '0.75rem' }}>Your postback URL</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
                Fire a GET request to this URL from your server after every confirmed payment. Never call this from the browser.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ ...codeBox, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{postbackUrl}</div>
                <div style={{ paddingTop: '0.5rem' }}>{copyBtn(postbackUrl, 'postback')}</div>
              </div>

              <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#3a3a3a', marginBottom: '0.5rem' }}>Parameters:</div>
                {[
                  ['ref', '{{UGCA_REF}}', 'The tracking code from the affiliate link click'],
                  ['order_id', '{{ORDER_ID}}', 'Your unique order ID'],
                  ['amount', '{{ORDER_TOTAL}}', 'Order total in dollars, e.g. 49.00'],
                  ['secret', postbackSecret || '(your secret)', 'Your unique postback secret — pre-filled above'],
                ].map(([param, placeholder, desc]) => (
                  <div key={param} style={{ display: 'flex', gap: '0.75rem', fontSize: '12.5px', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace', flexShrink: 0 }}>{param}</code>
                    <span style={{ color: '#555' }}>{desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '0.875rem 1rem', background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '12.5px', color: '#92400e' }}>
                <strong>Keep your secret safe.</strong> Never expose this URL in client-side code, GitHub, or public repos. Only fire it from your server.
              </div>
            </div>

            {/* The key question: how do I get UGCA_REF server-side? */}
            <div style={sec}>
              <div style={{ ...secLbl, marginBottom: '0.75rem' }}>How to get {'{{UGCA_REF}}'} on your server</div>
              <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1.25rem' }}>
                When an affiliate's visitor lands on your site, UGCA appends <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace' }}>?ugca_ref=XXXX</code> to your URL. You need to capture this and pass it through to your order confirmation. Here's how:
              </p>

              {/* Shopify */}
              <div style={{ border: '1px solid #e8e6e2', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ background: '#f9f8f6', padding: '0.75rem 1rem', fontSize: '13px', fontWeight: 600, color: '#0d0d0d', borderBottom: '1px solid #e8e6e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Shopify — Full server-side setup
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '12.5px', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                    <strong>Step 1:</strong> Add this to your theme.js to capture the ref when a visitor lands:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ ...codeBox, flex: 1, fontSize: '11.5px' }}>{shopifyCartScript}</div>
                    {copyBtn(shopifyCartScript, 'shopify-cart')}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                    <strong>Step 2:</strong> Add this to your order confirmation page (Settings → Checkout → Additional scripts) to fire the postback:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ ...codeBox, flex: 1, fontSize: '11.5px' }}>{shopifyPostbackCode}</div>
                    {copyBtn(shopifyPostbackCode, 'shopify-postback')}
                  </div>
                </div>
              </div>

              {/* WooCommerce */}
              <div style={{ border: '1px solid #e8e6e2', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ background: '#f9f8f6', padding: '0.75rem 1rem', fontSize: '13px', fontWeight: 600, color: '#0d0d0d', borderBottom: '1px solid #e8e6e2' }}>
                  WooCommerce — Full server-side setup
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '12.5px', color: '#555', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                    Add this to your theme's <code style={{ background: '#e8e6e2', padding: '0.1rem 0.4rem', borderRadius: '2px', fontFamily: 'monospace' }}>functions.php</code>. It captures the ref when the visitor lands, saves it to the order, and fires the postback automatically after purchase:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ ...codeBox, flex: 1, fontSize: '11.5px' }}>{wooPostbackCode}</div>
                    {copyBtn(wooPostbackCode, 'woo-postback')}
                  </div>
                </div>
              </div>

              {/* Custom */}
              <div style={{ border: '1px solid #e8e6e2', borderRadius: '4px', padding: '0.875rem 1rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.4rem' }}>Custom / Other platforms</div>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    'When a visitor lands on your site, read ?ugca_ref= from the URL query string',
                    'Store it in a session, cookie, or hidden form field that persists through checkout',
                    'After payment is confirmed server-side, make a GET request to your postback URL with the stored ref value',
                    'Never fire the postback from the browser — always from your server',
                  ].map((s, i) => (
                    <li key={i} style={{ fontSize: '12.5px', color: '#555', lineHeight: 1.6 }}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}

        {/* Your secret key */}
        <div style={sec}>
          <div style={secLbl}>Your postback secret</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
            This is your unique secret — different from every other vendor. It's already pre-filled in the postback URL above.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ ...codeBox, flex: 1, padding: '0.85rem 1rem' }}>
              {postbackSecret || '••••••••••••••••••••••'}
            </div>
            {postbackSecret && copyBtn(postbackSecret, 'secret')}
          </div>
        </div>

        {/* How it works */}
        <div style={sec}>
          <div style={secLbl}>How tracking works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              ['1', 'Affiliate clicks their link', 'The affiliate shares their unique link (ugcaffiliates.com/go/XXXX). When clicked, the visitor is redirected to your product page with ?ugca_ref=XXXX appended to the URL.'],
              ['2', 'Visitor shops and buys', 'The ref is stored in a cookie (30-day window) and/or passed through checkout. When the order confirms, the pixel or postback fires with the ref code.'],
              ['3', 'Commission is recorded', 'UGCA records the conversion, calculates the commission, and marks it pending. You see it in your Conversions dashboard within seconds.'],
              ['4', 'You approve and pay', 'After reviewing, click "Approve & Pay" in your Conversions dashboard. UGCA automatically charges your saved card the affiliate commission plus the 10% platform fee, and transfers the commission directly to the affiliate\'s bank account via Stripe.'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0d0d0d', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{num}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test */}
        <div style={{ ...sec, background: '#f9f8f6' }}>
          <div style={secLbl}>Test your integration</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem' }}>
            After installing, click one of your affiliate links, complete a test purchase, then check your Conversions page — the sale should appear within seconds.
          </p>
          <a href="/vendor/conversions" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', textDecoration: 'none', display: 'inline-block' }}>
            View Conversions →
          </a>
        </div>
      </div>
    </div>
  )
}