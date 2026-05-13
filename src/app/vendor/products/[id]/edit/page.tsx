// src/app/vendor/products/[id]/edit/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function VendorEditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [profileInitial, setProfileInitial] = useState('V')
  const [productImages, setProductImages] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const heygenImageRef = useRef<HTMLInputElement>(null)

  // HeyGen state
  const [heygenImage, setHeygenImage] = useState('')
  const [heygenImageUploading, setHeygenImageUploading] = useState(false)
  const [heygenFormat, setHeygenFormat] = useState<VideoFormatKey>('tiktok')
  const [heygenLoading, setHeygenLoading] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState('')
  const [generatedScript, setGeneratedScript] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', product_url: '', price: '',
    commission_rate: '', category: '', brand_guidelines: '',
    prohibited_terms: '', cookie_days: '30', auto_approve: false,
    video_url: '', video_embed_url: '', status: 'active',
  })

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
      setIsPro(!!profile.stripe_onboarded)
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('vendor_id', session.user.id)
        .single()

      if (!product) { router.push('/vendor/products'); return }

      setProductImages(product.images ?? (product.image_url ? [product.image_url] : []))
      setForm({
        title: product.title ?? '',
        description: product.description ?? '',
        product_url: product.product_url ?? '',
        price: product.price?.toString() ?? '',
        commission_rate: ((product.commission_rate ?? 0) * 100).toFixed(0),
        category: product.category ?? '',
        brand_guidelines: product.brand_guidelines ?? '',
        prohibited_terms: product.prohibited_terms ?? '',
        cookie_days: product.cookie_days?.toString() ?? '30',
        auto_approve: product.auto_approve ?? false,
        video_url: product.video_url ?? '',
        video_embed_url: product.video_embed_url ?? '',
        status: product.status ?? 'active',
      })
      setLoading(false)
    }
    load()
  }, [productId])

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

  async function generateHeygenVideo() {
    if (!heygenImage) { setError('Upload a product image first'); return }
    if (!form.title || !form.description) { setError('Product title and description are required'); return }
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
        setGeneratedScript(data.script ?? '')
        set('video_url', data.video_url)
      } else {
        setError(data.error ?? 'Failed to generate video. Try again.')
      }
    } catch { setError('Failed to generate video.') }
    setHeygenLoading(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('products').delete().eq('id', productId)
    router.push('/vendor/products')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)

    const commissionRate = parseFloat(form.commission_rate) / 100
    if (isNaN(commissionRate) || commissionRate < 0.05 || commissionRate > 0.70) {
      setError('Commission rate must be between 5% and 70%'); setSaving(false); return
    }

    const { error: updateError } = await supabase.from('products').update({
      title: form.title,
      description: form.description,
      product_url: form.product_url,
      price: parseFloat(form.price),
      commission_rate: commissionRate,
      category: form.category,
      brand_guidelines: form.brand_guidelines || null,
      prohibited_terms: form.prohibited_terms || null,
      cookie_days: parseInt(form.cookie_days),
      auto_approve: form.auto_approve,
      status: form.status,
      images: productImages,
      image_url: productImages[0] ?? null,
      video_url: form.video_url || null,
      video_embed_url: form.video_embed_url || null,
      updated_at: new Date().toISOString(),
    }).eq('id', productId)

    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const inputStyle = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }
  const sectionStyle = { background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ve-content { max-width: 780px; margin: 0 auto; padding: 2.5rem 2rem; }
        .ve-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .ve-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .ve-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        @media (max-width: 768px) {
          .ve-content { padding: 1.5rem 1rem; }
          .ve-two-col { grid-template-columns: 1fr; }
          .ve-three-col { grid-template-columns: 1fr 1fr; }
          .ve-img-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 480px) {
          .ve-three-col { grid-template-columns: 1fr; }
          .ve-img-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="ve-content">
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to products</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Edit product</div>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500 }}>{form.title}</h1>
            </div>

            {/* Status + Delete controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {['active', 'paused'].map(s => (
                <button key={s} type="button" onClick={() => set('status', s)} style={{ fontSize: '12px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: form.status === s ? '#0d0d0d' : '#f2f0ec', color: form.status === s ? '#ffffff' : '#888', textTransform: 'capitalize' }}>{s}</button>
              ))}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ fontSize: '12px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '3px', border: confirmDelete ? '1px solid #dc2626' : '1px solid #fecaca', cursor: 'pointer', fontFamily: 'inherit', background: confirmDelete ? '#dc2626' : '#fff1f2', color: confirmDelete ? '#ffffff' : '#dc2626' }}
              >
                {deleting ? 'Deleting...' : confirmDelete ? 'Confirm delete' : 'Delete product'}
              </button>
              {confirmDelete && (
                <button type="button" onClick={() => setConfirmDelete(false)} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Product details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Product title *</label>
                <input style={inputStyle} type="text" value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} required />
              </div>
              <div className="ve-two-col">
                <div>
                  <label style={labelStyle}>Product URL *</label>
                  <input style={inputStyle} type="url" value={form.product_url} onChange={e => set('product_url', e.target.value)} required />
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
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Add, remove or reorder images. First image is the primary thumbnail. Up to 10 images.</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
            {productImages.length > 0 && (
              <div className="ve-img-grid">
                {productImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '3px', overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#0d0d0d', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>Primary</div>}
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {productImages.length < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px dashed #d0cdc8', background: '#f9f8f6', padding: '0.75rem 1.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {uploadingImages ? 'Uploading...' : '+ Add more images'}
              </button>
            )}
          </div>

          {/* Video */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>Product video</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Paste an mp4 URL or unlisted YouTube/Vimeo embed URL. Clear the field to remove the video.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>mp4 video URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://..." />
                  {form.video_url && <button type="button" onClick={() => set('video_url', '')} style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Remove</button>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>YouTube / Vimeo embed URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="url" value={form.video_embed_url} onChange={e => set('video_embed_url', e.target.value)} placeholder="https://www.youtube.com/embed/..." />
                  {form.video_embed_url && <button type="button" onClick={() => set('video_embed_url', '')} style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Remove</button>}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.3rem' }}>Use the embed URL (youtube.com/embed/ID), not the watch URL.</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Pricing & commission</div>
            <div className="ve-three-col">
              <div>
                <label style={labelStyle}>Price ($) *</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Commission (%) *</label>
                <input style={inputStyle} type="number" min="5" max="70" step="0.5" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Cookie window (days)</label>
                <input style={inputStyle} type="number" min="1" max="90" value={form.cookie_days} onChange={e => set('cookie_days', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Affiliate Rules */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Affiliate rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Brand guidelines</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.brand_guidelines} onChange={e => set('brand_guidelines', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Prohibited terms</label>
                <input style={inputStyle} type="text" value={form.prohibited_terms} onChange={e => set('prohibited_terms', e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="auto_approve" checked={form.auto_approve} onChange={e => set('auto_approve', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="auto_approve" style={{ fontSize: '13px', color: '#3a3a3a', cursor: 'pointer' }}>Auto-approve affiliates</label>
              </div>
            </div>
          </div>

          {/* HeyGen AI Avatar Video — Pro only */}
          <div style={{ ...sectionStyle, border: '1px solid #ddd6fe', background: '#f5f3ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#6d28d9' }}>AI avatar video — HeyGen</div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', background: '#7c3aed', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>Pro</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6d28d9', marginBottom: '1.5rem', opacity: 0.85, lineHeight: 1.65 }}>
              Upload a product photo — an AI avatar delivers a spoken promo with full audio, lip-sync, and auto-captions. Choose your platform format and generate.
            </p>

            {!isPro ? (
              <div style={{ background: 'rgba(109,40,217,0.08)', border: '1px solid #ddd6fe', borderRadius: '3px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 500 }}>Upgrade to Pro to unlock AI video generation.</div>
                <Link href="/pricing" style={{ fontSize: '12px', color: '#7c3aed', textDecoration: 'underline', marginTop: '0.4rem', display: 'inline-block' }}>View Pro plan →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Step 1 */}
                <div>
                  <label style={{ ...labelStyle, color: '#6d28d9' }}>Step 1 — Upload product photo</label>
                  <p style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '0.75rem', opacity: 0.85 }}>This image appears as the video background behind the avatar.</p>
                  <input ref={heygenImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeygenImageUpload} />
                  {heygenImage ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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

                {/* Step 2 */}
                <div>
                  <label style={{ ...labelStyle, color: '#6d28d9' }}>Step 2 — Choose target platform</label>
                  <p style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '0.75rem', opacity: 0.85 }}>Sets the video dimensions and aspect ratio.</p>
                  <VideoFormatPicker value={heygenFormat} onChange={setHeygenFormat} disabled={heygenLoading} />
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={generateHeygenVideo}
                  disabled={heygenLoading || !heygenImage || !form.title || !form.description}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: heygenLoading ? '#888' : '#7c3aed', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '3px', cursor: (heygenLoading || !heygenImage) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', opacity: !heygenImage ? 0.5 : 1 }}
                >
                  {heygenLoading ? 'Generating avatar video... (~2–3 min)' : 'Generate AI avatar video'}
                </button>

                {heygenLoading && (
                  <div style={{ fontSize: '12px', color: '#888', padding: '0.75rem 1rem', background: 'rgba(109,40,217,0.05)', borderRadius: '3px' }}>
                    HeyGen is rendering your avatar video with audio. This takes 2–3 minutes. Don't close this page.
                  </div>
                )}

                {generatedVideo && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', marginBottom: '0.75rem' }}>✓ Avatar video generated — auto-set as product video above</div>
                    <video controls style={{ width: '100%', borderRadius: '4px', background: '#0d0d0d', maxHeight: '360px' }} src={generatedVideo} />
                    {generatedScript && (
                      <div style={{ marginTop: '1rem', background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Generated script</div>
                        <div style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7 }}>{generatedScript}</div>
                      </div>
                    )}
                    <a href={generatedVideo} download style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', textDecoration: 'underline', display: 'inline-block', marginTop: '0.75rem' }}>Download video</a>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div style={{ fontSize: '13px', color: '#c0392b', padding: '0.75rem 1rem', background: '#fdf2f2', borderRadius: '3px', border: '1px solid #f5c6cb', marginBottom: '1rem' }}>{error}</div>}
          {success && <div style={{ fontSize: '13px', color: '#16a34a', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '3px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>Product updated successfully.</div>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Link href="/vendor/products" style={{ fontSize: '13px', fontWeight: 500, color: '#888', border: '1px solid #e8e6e2', padding: '0.7rem 1.5rem', borderRadius: '3px', textDecoration: 'none', background: '#ffffff' }}>Cancel</Link>
            <button type="submit" disabled={saving} style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: saving ? '#888' : '#0d0d0d', border: 'none', padding: '0.7rem 2rem', borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}