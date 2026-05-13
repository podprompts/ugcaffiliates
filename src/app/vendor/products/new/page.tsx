// src/app/vendor/products/new/page.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'
import VideoFormatPicker from '@/components/VideoFormatPicker'
import { VideoFormatKey } from '@/lib/video-formats'

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

  // HeyGen state
  const [heygenImage, setHeygenImage] = useState<string>('')
  const [heygenImageUploading, setHeygenImageUploading] = useState(false)
  const [heygenFormat, setHeygenFormat] = useState<VideoFormatKey>('tiktok')
  const [heygenLoading, setHeygenLoading] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string>('')
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>('')
  const [generatedScript, setGeneratedScript] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const heygenImageRef = useRef<HTMLInputElement>(null)

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

  async function handleHeygenImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setHeygenImageUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const ext = file.name.split('.').pop()
    const path = `heygen/${session.user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setHeygenImage(publicUrl)
    }
    setHeygenImageUploading(false)
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

  async function generateHeygenVideo() {
    if (!heygenImage) { setError('Upload a product image first'); return }
    if (!form.title || !form.description) { setError('Fill in the product title and description first'); return }
    setHeygenLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const res = await fetch('/api/ai/heygen-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          price: form.price,
          commission_rate: form.commission_rate ? parseFloat(form.commission_rate) / 100 : undefined,
          imageUrl: heygenImage,
          format: heygenFormat,
        }),
      })
      const data = await res.json()
      if (data.video_url) {
        setGeneratedVideo(data.video_url)
        setGeneratedThumbnail(data.thumbnail_url ?? '')
        setGeneratedScript(data.script ?? '')
        set('video_url', data.video_url)
      } else {
        setError(data.error ?? 'Failed to generate video. Try again.')
      }
    } catch { setError('Failed to generate video.') }
    setHeygenLoading(false)
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
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' as const }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your product — what it does, who it's for, why people love it..." required />
              </div>
              <div className="np-two-col">
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

          {/* Images */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>Product images</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Upload up to 10 images. First image becomes the primary thumbnail shown in the marketplace.</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
            {productImages.length > 0 && (
              <div className="np-img-grid">
                {productImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative' as const, aspectRatio: '1', borderRadius: '3px', overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && <div style={{ position: 'absolute' as const, top: '4px', left: '4px', background: '#0d0d0d', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>Primary</div>}
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute' as const, top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages || productImages.length >= 10} style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px dashed #d0cdc8', background: '#f9f8f6', padding: '0.75rem 1.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {uploadingImages ? 'Uploading...' : productImages.length >= 10 ? 'Max 10 images' : '+ Add images'}
            </button>
          </div>

          {/* Video */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>Product video</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Paste an mp4 URL or an unlisted YouTube/Vimeo embed URL.</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              <div>
                <label style={labelStyle}>mp4 video URL (primary)</label>
                <input style={inputStyle} type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://yoursite.com/video.mp4" />
              </div>
              <div>
                <label style={labelStyle}>YouTube / Vimeo embed URL (fallback)</label>
                <input style={inputStyle} type="url" value={form.video_embed_url} onChange={e => set('video_embed_url', e.target.value)} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.3rem' }}>Use the embed URL, not the watch URL. Unlisted videos only.</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Pricing & commission</div>
            <div className="np-three-col">
              <div>
                <label style={labelStyle}>Product price ($) *</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="89.00" required />
              </div>
              <div>
                <label style={labelStyle}>Commission (%) *</label>
                <input style={inputStyle} type="number" min="5" max="70" step="0.5" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} placeholder="28" required />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.3rem' }}>Min 5% · Max 70%</div>
              </div>
              <div>
                <label style={labelStyle}>Cookie window (days)</label>
                <input style={inputStyle} type="number" min="1" max="90" value={form.cookie_days} onChange={e => set('cookie_days', e.target.value)} />
              </div>
            </div>
            {form.price && form.commission_rate && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f9f8f6', borderRadius: '3px', fontSize: '13px', color: '#3a3a3a' }}>
                Affiliates earn <strong>${(parseFloat(form.price || '0') * parseFloat(form.commission_rate || '0') / 100).toFixed(2)}</strong> per sale · You keep <strong>${(parseFloat(form.price || '0') * (1 - parseFloat(form.commission_rate || '0') / 100) * 0.96).toFixed(2)}</strong> after commission and platform fee
              </div>
            )}
          </div>

          {/* Affiliate rules */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Affiliate rules</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Brand guidelines</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }} value={form.brand_guidelines} onChange={e => set('brand_guidelines', e.target.value)} placeholder="e.g. Always use our logo correctly. Don't make medical claims..." />
              </div>
              <div>
                <label style={labelStyle}>Prohibited terms</label>
                <input style={inputStyle} type="text" value={form.prohibited_terms} onChange={e => set('prohibited_terms', e.target.value)} placeholder="e.g. cure, guaranteed, free" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="auto_approve" checked={form.auto_approve} onChange={e => set('auto_approve', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="auto_approve" style={{ fontSize: '13px', color: '#3a3a3a', cursor: 'pointer' }}>Auto-approve affiliates — anyone can promote without your review</label>
              </div>
            </div>
          </div>

          {/* AI Text Assets — unchanged */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>AI affiliate copy assets</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Generate ready-to-use TikTok hooks, Instagram captions, email swipes, and YouTube scripts for your affiliates.</p>
            <button type="button" onClick={generateAIAssets} disabled={aiLoading} style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', border: '1px solid #0d0d0d', background: 'none', padding: '0.6rem 1.25rem', borderRadius: '3px', cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.6 : 1, fontFamily: 'inherit' }}>
              {aiLoading ? 'Generating...' : 'Generate AI copy assets'}
            </button>
            {aiAssets && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column' as const, gap: '1px', background: '#e8e6e2' }}>
                {[
                  { label: 'TikTok Hook', content: aiAssets.tiktok_hook },
                  { label: 'Instagram Caption', content: aiAssets.ig_caption },
                  { label: 'Email Swipe', content: aiAssets.email_swipe },
                  { label: 'YouTube Script', content: aiAssets.youtube_script },
                ].map(asset => asset.content && (
                  <div key={asset.label} style={{ background: '#ffffff', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.4rem' }}>{asset.label}</div>
                    <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.6 }}>{asset.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Avatar Video — HeyGen — Pro only */}
          <div style={{ ...sectionStyle, border: '1px solid #ddd6fe', background: '#f5f3ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#6d28d9' }}>AI avatar video — HeyGen</div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#7c3aed', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>Pro</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6d28d9', marginBottom: '1.5rem', lineHeight: 1.65, opacity: 0.85 }}>
              Upload a product photo — an AI avatar will speak a generated promo script with full audio, lip-sync, and auto-captions. Choose your target platform to get the right video format.
            </p>

            {!isPro ? (
              <div style={{ background: 'rgba(109,40,217,0.08)', border: '1px solid #ddd6fe', borderRadius: '3px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 500 }}>Upgrade to Pro to unlock AI avatar video generation.</div>
                <Link href="/pricing" style={{ fontSize: '12px', color: '#7c3aed', textDecoration: 'underline', marginTop: '0.4rem', display: 'inline-block' }}>View Pro plan →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>

                {/* Step 1 — Product photo */}
                <div>
                  <label style={{ ...labelStyle, color: '#6d28d9' }}>Step 1 — Upload your product photo</label>
                  <p style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '0.75rem', opacity: 0.85 }}>This image appears as the video background behind the avatar.</p>
                  <input ref={heygenImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeygenImageUpload} />
                  {heygenImage ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' as const }}>
                      <img src={heygenImage} alt="Product" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd6fe' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500, marginBottom: '0.4rem' }}>✓ Image uploaded</div>
                        <button type="button" onClick={() => heygenImageRef.current?.click()} style={{ fontSize: '12px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Change image</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => heygenImageRef.current?.click()} disabled={heygenImageUploading} style={{ fontSize: '13px', fontWeight: 500, color: '#7c3aed', border: '1px dashed #c4b5fd', background: 'rgba(109,40,217,0.04)', padding: '0.75rem 1.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {heygenImageUploading ? 'Uploading...' : '+ Upload product photo'}
                    </button>
                  )}
                </div>

                {/* Step 2 — Platform / format */}
                <div>
                  <label style={{ ...labelStyle, color: '#6d28d9' }}>Step 2 — Choose target platform</label>
                  <p style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '0.75rem', opacity: 0.85 }}>Selects the video dimensions. You can generate multiple formats after listing.</p>
                  {/* Override VideoFormatPicker colors to match purple theme */}
                  <div style={{ '--picker-active-bg': '#7c3aed', '--picker-active-border': '#7c3aed' } as React.CSSProperties}>
                    <VideoFormatPicker
                      value={heygenFormat}
                      onChange={setHeygenFormat}
                      disabled={heygenLoading}
                    />
                  </div>
                </div>

                {/* Step 3 — Script preview note */}
                <div style={{ background: 'rgba(109,40,217,0.05)', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '0.75rem 1rem', fontSize: '12px', color: '#6d28d9' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>✦ How it works</div>
                  <div style={{ color: '#7c3aed', lineHeight: 1.6 }}>
                    Claude reads your product title, description, price, and commission rate, then writes a 45–60 second spoken promo script. HeyGen renders an AI avatar delivering that script with full audio, lip-sync, and auto-captions — using your product photo as the background.
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={generateHeygenVideo}
                  disabled={heygenLoading || !heygenImage || !form.title || !form.description}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: heygenLoading ? '#888' : '#7c3aed', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '3px', cursor: (heygenLoading || !heygenImage || !form.title || !form.description) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' as const, opacity: (!heygenImage || !form.title || !form.description) ? 0.5 : 1 }}
                >
                  {heygenLoading ? 'Generating avatar video... (~2–3 min)' : 'Generate AI avatar video'}
                </button>

                {(!form.title || !form.description) && !heygenLoading && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '-0.75rem' }}>Fill in the product title and description above first.</div>
                )}

                {heygenLoading && (
                  <div style={{ fontSize: '12px', color: '#888', padding: '0.75rem 1rem', background: 'rgba(109,40,217,0.05)', borderRadius: '3px' }}>
                    HeyGen is rendering your avatar video with audio. This takes 2–3 minutes. Don't close this page.
                  </div>
                )}

                {/* Result */}
                {generatedVideo && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', marginBottom: '0.75rem' }}>✓ Avatar video generated successfully</div>
                    <video controls style={{ width: '100%', borderRadius: '4px', background: '#0d0d0d', maxHeight: '400px' }} src={generatedVideo} />

                    {generatedScript && (
                      <div style={{ marginTop: '1rem', background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '0.5rem' }}>Generated script</div>
                        <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{generatedScript}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                      <a href={generatedVideo} download style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', textDecoration: 'underline' }}>Download video</a>
                      <span style={{ fontSize: '12px', color: '#888' }}>· Auto-added as your product video above</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem 1rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb', marginBottom: '1rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' as const }}>
            <Link href="/vendor/products" style={{ fontSize: '13px', fontWeight: 500, color: '#888', border: '1px solid #e8e6e2', padding: '0.7rem 1.5rem', borderRadius: '3px', textDecoration: 'none', background: '#ffffff' }}>Cancel</Link>
            <button type="submit" disabled={loading} style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: loading ? '#888' : '#0d0d0d', border: 'none', padding: '0.7rem 2rem', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Listing product...' : 'List product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}