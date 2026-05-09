// src/app/vendor/products/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const CATEGORIES = [
  'Digital Products', 'Courses & Education', 'SaaS & Software',
  'Beauty & Wellness', 'Fashion & Apparel', 'Fitness', 'Home & Living',
  'Food & Drink', 'Finance', 'Pets', 'Photography', 'Gaming', 'Other'
]

export const dynamic = 'force-dynamic'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiAssets, setAiAssets] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    product_url: '',
    price: '',
    commission_rate: '',
    category: '',
    brand_guidelines: '',
    prohibited_terms: '',
    cookie_days: '30',
    auto_approve: false,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function generateAIAssets() {
    if (!form.title || !form.description) {
      setError('Add a title and description first to generate AI assets')
      return
    }
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          commission_rate: form.commission_rate,
          price: form.price,
        }),
      })
      const data = await res.json()
      if (data.assets) setAiAssets(data.assets)
      else setError('Failed to generate assets. Try again.')
    } catch {
      setError('Failed to generate assets. Try again.')
    }
    setAiLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    // Build slug from title
    const slug = form.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60)
      + '-' + Date.now()

    const commissionRate = parseFloat(form.commission_rate) / 100
    if (isNaN(commissionRate) || commissionRate < 0.05 || commissionRate > 0.70) {
      setError('Commission rate must be between 5% and 70%')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('products')
      .insert({
        vendor_id:        session.user.id,
        title:            form.title,
        slug,
        description:      form.description,
        product_url:      form.product_url,
        price:            parseFloat(form.price),
        commission_rate:  commissionRate,
        category:         form.category,
        brand_guidelines: form.brand_guidelines || null,
        prohibited_terms: form.prohibited_terms || null,
        cookie_days:      parseInt(form.cookie_days),
        auto_approve:     form.auto_approve,
        status:           'active',
        ai_assets:        aiAssets ?? null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/vendor/products')
  }

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    border: '1px solid #e8e6e2',
    borderRadius: '3px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0d0d0d',
    background: '#ffffff',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#3a3a3a',
    marginBottom: '0.4rem',
  }

  const sectionStyle = {
    background: '#ffffff',
    border: '1px solid #e8e6e2',
    borderRadius: '4px',
    padding: '1.75rem',
    marginBottom: '1.25rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[
            { label: 'Dashboard',   href: '/vendor' },
            { label: 'Products',    href: '/vendor/products', active: true },
            { label: 'Affiliates',  href: '/vendor/affiliates' },
            { label: 'Conversions', href: '/vendor/conversions' },
            { label: 'Settings',    href: '/vendor/settings' },
          ].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            ← Back to products
          </Link>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>New listing</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>List a product</h1>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Product details</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Product title *</label>
                <input style={inputStyle} type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Hydration Serum Bundle" required />
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' as const }}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe your product — what it does, who it's for, why people love it..."
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Product URL *</label>
                  <input style={inputStyle} type="url" value={form.product_url} onChange={e => set('product_url', e.target.value)} placeholder="https://yoursite.com/product" required />
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} required>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Commission */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Pricing & commission</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Product price ($) *</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="89.00" required />
              </div>
              <div>
                <label style={labelStyle}>Commission rate (%) *</label>
                <input style={inputStyle} type="number" min="5" max="70" step="0.5" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} placeholder="28" required />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.3rem' }}>Min 5% · Max 70%</div>
              </div>
              <div>
                <label style={labelStyle}>Cookie window (days)</label>
                <input style={inputStyle} type="number" min="1" max="90" value={form.cookie_days} onChange={e => set('cookie_days', e.target.value)} />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.3rem' }}>How long to track referrals</div>
              </div>
            </div>
            {form.price && form.commission_rate && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f9f8f6', borderRadius: '3px', fontSize: '13px', color: '#3a3a3a' }}>
                Affiliates earn <strong>${(parseFloat(form.price || '0') * parseFloat(form.commission_rate || '0') / 100).toFixed(2)}</strong> per sale · You keep <strong>${(parseFloat(form.price || '0') * (1 - parseFloat(form.commission_rate || '0') / 100) * 0.96).toFixed(2)}</strong> after commission and platform fee
              </div>
            )}
          </div>

          {/* Rules */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Affiliate rules</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Brand guidelines</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                  value={form.brand_guidelines}
                  onChange={e => set('brand_guidelines', e.target.value)}
                  placeholder="e.g. Always use our logo correctly. Don't make medical claims. Keep messaging positive..."
                />
              </div>
              <div>
                <label style={labelStyle}>Prohibited terms</label>
                <input style={inputStyle} type="text" value={form.prohibited_terms} onChange={e => set('prohibited_terms', e.target.value)} placeholder="e.g. cure, guaranteed, free" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="auto_approve"
                  checked={form.auto_approve}
                  onChange={e => set('auto_approve', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="auto_approve" style={{ fontSize: '13px', color: '#3a3a3a', cursor: 'pointer' }}>
                  Auto-approve affiliates — anyone can promote without your review
                </label>
              </div>
            </div>
          </div>

          {/* AI Assets */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>AI affiliate assets</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Generate TikTok hooks, Instagram captions, and email swipes for your affiliates automatically.</p>
            <button
              type="button"
              onClick={generateAIAssets}
              disabled={aiLoading}
              style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #0d0d0d', background: 'none', padding: '0.6rem 1.25rem', borderRadius: '3px', cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.6 : 1 }}
            >
              {aiLoading ? 'Generating...' : 'Generate AI assets'}
            </button>

            {aiAssets && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column' as const, gap: '1px', background: '#e8e6e2' }}>
                {[
                  { label: 'TikTok Hook',       content: aiAssets.tiktok_hook },
                  { label: 'Instagram Caption', content: aiAssets.ig_caption },
                  { label: 'Email Swipe',       content: aiAssets.email_swipe },
                  { label: 'YouTube Script',    content: aiAssets.youtube_script },
                ].map(asset => asset.content && (
                  <div key={asset.label} style={{ background: '#ffffff', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.4rem' }}>{asset.label}</div>
                    <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.6 }}>{asset.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem 1rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link href="/vendor/products" style={{ fontSize: '13px', fontWeight: 500, color: '#888', border: '1px solid #e8e6e2', padding: '0.7rem 1.5rem', borderRadius: '3px', textDecoration: 'none', background: '#ffffff' }}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: loading ? '#888' : '#0d0d0d', border: 'none', padding: '0.7rem 2rem', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Listing product...' : 'List product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}