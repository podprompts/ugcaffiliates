// src/app/vendor/products/new/page.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

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
  const [uploadingImages, setUploadingImages] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [isPro, setIsPro] = useState(false)
  const [profileInitial, setProfileInitial] = useState('V')

  // Promo video upload state
  const [promoVideoUploading, setPromoVideoUploading] = useState(false)
  const [promoVideoUrl, setPromoVideoUrl] = useState<string>('')
  const [promoVideoName, setPromoVideoName] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const promoVideoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', description: '', product_url: '', price: '',
    commission_rate: '', category: '', brand_guidelines: '',
    prohibited_terms: '', cookie_days: '30', auto_approve: false,
    video_url: '', video_embed_url: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Check plan on mount
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json())
        .then(({ profile }) => {
          setIsPro(!!profile?.stripe_onboarded)
          setProfileInitial(profile?.full_name?.charAt(0)?.toUpperCase() ?? 'V')
        })
    })
  })

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (productImages.length + files.length > 10) { setError('Maximum 10 images allowed'); return }
    setUploadingImages(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const uploaded: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `products/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        uploaded.push(publicUrl)
      }
    }
    setProductImages(prev => [...prev, ...uploaded])
    setUploadingImages(false)
  }

  // ── Promo video upload ────────────────────────────────────────────────────
  async function handlePromoVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setError('Video file too large. Maximum size is 500MB.')
      return
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|qt)$/i)) {
      setError('Please upload an MP4, MOV, or WebM video file.')
      return
    }

    setPromoVideoUploading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const ext = file.name.split('.').pop()
    const path = `promo-videos/${session.user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setError(`Video upload failed: ${uploadError.message}`)
      setPromoVideoUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    setPromoVideoUrl(publicUrl)
    setPromoVideoName(file.name)
    set('video_url', publicUrl)
    setPromoVideoUploading(false)
  }

  function removePromoVideo() {
    setPromoVideoUrl('')
    setPromoVideoName('')
    set('video_url', '')
    if (promoVideoRef.current) promoVideoRef.current.value = ''
  }

  function removeImage(index: number) {
    setProductImages(prev => prev.filter((_, i) => i !== index))
  }

  async function generateAIAssets() {
    if (!form.title || !form.description) { setError('Add a title and description first'); return }
    setAiLoading(true); setError('')
    try {
      const res = await fetch('/api/ai/generate-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category, commission_rate: form.commission_rate, price: form.price }),
      })
      const data = await res.json()
      if (data.assets) setAiAssets(data.assets)
      else setError('Failed to generate assets. Try again.')
    } catch { setError('Failed to generate assets.') }
    setAiLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const slug = form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 60) + '-' + Date.now()
    const commissionRate = parseFloat(form.commission_rate) / 100
    if (isNaN(commissionRate) || commissionRate < 0.05 || commissionRate > 0.70) {
      setError('Commission rate must be between 5% and 70%'); setLoading(false); return
    }

    const { error: insertError } = await supabase.from('products').insert({
      vendor_id: session.user.id,
      title: form.title, slug,
      description: form.description,
      product_url: form.product_url,
      price: parseFloat(form.price),
      commission_rate: commissionRate,
      category: form.category,
      brand_guidelines: form.brand_guidelines || null,
      prohibited_terms: form.prohibited_terms || null,
      cookie_days: parseInt(form.cookie_days),
      auto_approve: form.auto_approve,
      status: 'active',
      ai_assets: aiAssets ?? null,
      images: productImages,
      image_url: productImages[0] ?? null,
      video_url: form.video_url || null,
      video_embed_url: form.video_embed_url || null,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/vendor/products')
  }

  const inputStyle = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }
  const sectionStyle = { background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .np-content { max-width: 780px; margin: 0 auto; padding: 2.5rem 2rem; }
        .np-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .np-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .np-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        @media (max-width: 768px) {
          .np-content { padding: 1.5rem 1rem; }
          .np-two-col { grid-template-columns: 1fr; }
          .np-three-col { grid-template-columns: 1fr 1fr; }
          .np-img-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 480px) {
          .np-three-col { grid-template-columns: 1fr; }
          .np-img-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="np-content">
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to products</Link>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>List a new product</h1>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Product basics ── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>Product details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Product name *</label>
                <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Premium Skincare Serum" />
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Describe your product — benefits, ingredients, what makes it unique..." />
              </div>
              <div>
                <label style={labelStyle}>Product URL *</label>
                <input style={inputStyle} type="url" value={form.product_url} onChange={e => set('product_url', e.target.value)} required placeholder="https://yourstore.com/product" />
              </div>
              <div className="np-two-col">
                <div>
                  <label style={labelStyle}>Price ($) *</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="49.99" />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Commission & settings ── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>Commission & settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="np-three-col">
                <div>
                  <label style={labelStyle}>Commission rate (%) *</label>
                  <input style={inputStyle} type="number" min="5" max="70" step="1" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} required placeholder="20" />
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '0.35rem' }}>5% – 70%</div>
                </div>
                <div>
                  <label style={labelStyle}>Cookie window (days)</label>
                  <input style={inputStyle} type="number" min="1" max="90" value={form.cookie_days} onChange={e => set('cookie_days', e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.auto_approve} onChange={e => set('auto_approve', e.target.checked)} />
                    <span style={{ fontSize: '13px', color: '#3a3a3a' }}>Auto-approve affiliates</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Product images ── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>Product images</div>
            {productImages.length > 0 && (
              <div className="np-img-grid">
                {productImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e8e6e2' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    {i === 0 && <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', borderRadius: '2px', padding: '1px 5px', fontSize: '9px', color: '#fff', fontWeight: 600 }}>Main</div>}
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages || productImages.length >= 10} style={{ fontSize: '13px', color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.6rem 1.25rem', borderRadius: '3px', background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', opacity: productImages.length >= 10 ? 0.5 : 1 }}>
              {uploadingImages ? 'Uploading…' : `+ Add images (${productImages.length}/10)`}
            </button>
          </div>

          {/* ── Promo video upload ── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.5rem' }}>Promo video</div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1.25rem' }}>
              Upload a promo video for affiliates to use when promoting your product. MP4, MOV, or WebM — up to 500MB.
            </p>

            {promoVideoUrl ? (
              <div style={{ border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#f2f2f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>{promoVideoName}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>✓ Uploaded successfully</div>
                  </div>
                </div>
                <button type="button" onClick={removePromoVideo} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', fontFamily: 'inherit' }}>
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <input ref={promoVideoRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={handlePromoVideoUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => promoVideoRef.current?.click()} disabled={promoVideoUploading} style={{ fontSize: '13px', color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.6rem 1.25rem', borderRadius: '3px', background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', opacity: promoVideoUploading ? 0.6 : 1 }}>
                  {promoVideoUploading ? 'Uploading video…' : '+ Upload promo video'}
                </button>
              </div>
            )}

            {/* Optional embed URL fallback */}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ ...labelStyle, color: '#aaa' }}>Or paste a video embed URL (YouTube, Vimeo, etc.)</label>
              <input style={{ ...inputStyle, color: '#888' }} type="url" value={form.video_embed_url} onChange={e => set('video_embed_url', e.target.value)} placeholder="https://youtube.com/embed/..." />
            </div>
          </div>

          {/* ── Brand guidelines ── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>Brand guidelines <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Brand guidelines</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.brand_guidelines} onChange={e => set('brand_guidelines', e.target.value)} placeholder="How should affiliates represent your brand? Tone, messaging, dos and don'ts..." />
              </div>
              <div>
                <label style={labelStyle}>Prohibited terms</label>
                <input style={inputStyle} value={form.prohibited_terms} onChange={e => set('prohibited_terms', e.target.value)} placeholder="e.g. cure, guaranteed, free — words affiliates must not use" />
              </div>
            </div>
          </div>

          {/* ── AI affiliate assets ── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>AI affiliate assets</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '0.25rem' }}>TikTok hooks, IG captions, email swipes & YouTube scripts for your affiliates</div>
              </div>
              <button type="button" onClick={generateAIAssets} disabled={aiLoading} style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: aiLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                {aiLoading ? 'Generating…' : aiAssets ? 'Regenerate' : 'Generate assets'}
              </button>
            </div>

            {aiAssets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(aiAssets).map(([key, value]) => (
                  <div key={key} style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '3px', padding: '1rem' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{key.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.6 }}>{value as string}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '0.5rem' }}>
            <Link href="/vendor/products" style={{ fontSize: '13px', color: '#888', padding: '0.7rem 1.5rem', textDecoration: 'none', fontFamily: 'inherit' }}>Cancel</Link>
            <button type="submit" disabled={loading} style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.75rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Listing product…' : 'List product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}