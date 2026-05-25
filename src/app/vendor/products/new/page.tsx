// src/app/vendor/products/new/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [profileInitial, setProfileInitial] = useState('V')

  // Image state
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState('')
  const [productImages, setProductImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video state
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoName, setVideoName] = useState('')
  const videoInputRef = useRef<HTMLInputElement>(null)

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
    video_embed_url: '',
    video_aspect_ratio: '16/9',
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json())
        .then(({ profile }) => {
          setProfileInitial(profile?.full_name?.charAt(0)?.toUpperCase() ?? 'V')
        })
    })
  }, [])

  function setField(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Image upload ─────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (productImages.length + files.length > 10) { setError('Maximum 10 images allowed'); return }
    setUploadingImages(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const uploaded: string[] = []
    for (let i = 0; i < files.length; i++) {
      setImageProgress(`Uploading image ${i + 1} of ${files.length}…`)
      const fd = new FormData()
      fd.append('file', files[i])
      fd.append('type', 'image')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })
      const data = await res.json()
      if (res.ok && data.url) uploaded.push(data.url)
      else setError(data.error ?? 'Failed to upload image')
    }
    setProductImages(prev => [...prev, ...uploaded])
    setImageProgress('')
    setUploadingImages(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(i: number) {
    setProductImages(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Video upload (XHR for progress) ─────────────────────────────────────
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoUploading(true); setVideoProgress(0); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'video')

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setVideoProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              if (data.url) { setVideoUrl(data.url); setVideoName(file.name); resolve() }
              else reject(new Error(data.error ?? 'Upload failed'))
            } catch { reject(new Error('Invalid response')) }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error ?? `Upload failed (${xhr.status})`)) }
            catch { reject(new Error(`Upload failed (${xhr.status})`)) }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.open('POST', '/api/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.send(fd)
      })
    } catch (err: any) {
      setError(err.message ?? 'Video upload failed')
    }

    setVideoUploading(false); setVideoProgress(0)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  function removeVideo() {
    setVideoUrl(''); setVideoName('')
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  // ── AI assets ────────────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    let url = form.product_url.trim()
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`

    const commissionRate = parseFloat(form.commission_rate) / 100
    if (isNaN(commissionRate) || commissionRate < 0.05 || commissionRate > 0.70) {
      setError('Commission rate must be between 5% and 70%'); setLoading(false); return
    }

    const slug = form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 60) + '-' + Date.now()

    const { error: insertError } = await supabase.from('products').insert({
      vendor_id:        session.user.id,
      title:            form.title,
      slug,
      description:      form.description,
      product_url:      url,
      price:            parseFloat(form.price),
      commission_rate:  commissionRate,
      category:         form.category,
      brand_guidelines: form.brand_guidelines || null,
      prohibited_terms: form.prohibited_terms || null,
      cookie_days:      parseInt(form.cookie_days),
      auto_approve:     form.auto_approve,
      status:           'active',
      ai_assets:        aiAssets ?? null,
      images:           productImages,
      image_url:        productImages[0] ?? null,
      video_url:        videoUrl || null,
      video_embed_url:  form.video_embed_url || null,
      video_aspect_ratio: form.video_aspect_ratio,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/vendor/products')
  }

  const inp = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }
  const sec = { background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }
  const secLbl = { fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 600, marginBottom: '1.25rem' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .np-content { max-width: 780px; margin: 0 auto; padding: 2.5rem 2rem; }
        .np-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .np-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .np-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .drop-zone { border: 2px dashed #d0cdc8; border-radius: 6px; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .drop-zone:hover { border-color: #0d0d0d; background: #f9f8f6; }
        .prog-bar { height: 4px; background: #e8e6e2; border-radius: 2px; overflow: hidden; margin-top: 0.75rem; }
        .prog-fill { height: 100%; background: #0d0d0d; border-radius: 2px; transition: width 0.2s ease; }
        .ratio-btn { flex: 1; padding: 0.75rem; border-radius: 3px; border: 1.5px solid #e8e6e2; background: #ffffff; cursor: pointer; font-family: inherit; transition: all 0.15s; text-align: center; }
        .ratio-btn.active { border-color: #0d0d0d; background: #0d0d0d; color: #ffffff; }
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
          <Link href="/vendor/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none', marginBottom: '0.75rem', display: 'inline-block' }}>← My products</Link>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>List a product</h1>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Core details */}
          <div style={sec}>
            <div style={secLbl}>Product details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp} value={form.title} onChange={e => setField('title', e.target.value)} required placeholder="e.g. Hydration Serum Wash" />
              </div>
              <div>
                <label style={lbl}>Description *</label>
                <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => setField('description', e.target.value)} required placeholder="Describe your product for affiliates…" />
              </div>
              <div>
                <label style={lbl}>Product URL *</label>
                <input style={inp} type="url" value={form.product_url} onChange={e => setField('product_url', e.target.value)} onBlur={e => {
                  let v = e.target.value.trim()
                  if (v && !/^https?:\/\//i.test(v)) setField('product_url', `https://${v}`)
                }} required placeholder="https://yourstore.com/product" />
              </div>
              <div className="np-two-col">
                <div>
                  <label style={lbl}>Price ($) *</label>
                  <input style={inp} type="number" min="0" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} required placeholder="49.99" />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={inp} value={form.category} onChange={e => setField('category', e.target.value)}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Commission */}
          <div style={sec}>
            <div style={secLbl}>Commission & settings</div>
            <div className="np-three-col">
              <div>
                <label style={lbl}>Commission rate (%) *</label>
                <input style={inp} type="number" min="5" max="70" step="1" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} required placeholder="20" />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.35rem' }}>5% – 70%</div>
              </div>
              <div>
                <label style={lbl}>Cookie window (days)</label>
                <input style={inp} type="number" min="1" max="90" value={form.cookie_days} onChange={e => setField('cookie_days', e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.auto_approve} onChange={e => setField('auto_approve', e.target.checked)} />
                  <span style={{ fontSize: '13px', color: '#3a3a3a' }}>Auto-approve affiliates</span>
                </label>
              </div>
            </div>
          </div>

          {/* Product images */}
          <div style={sec}>
            <div style={secLbl}>Product images <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa' }}>(up to 10)</span></div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1rem' }}>JPG, PNG, WebP up to 50MB each. First image is the main thumbnail.</p>

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

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages || productImages.length >= 10}
              style={{ fontSize: '13px', color: '#0d0d0d', border: '1px solid #e8e6e2', padding: '0.6rem 1.25rem', borderRadius: '3px', background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', opacity: productImages.length >= 10 ? 0.5 : 1 }}>
              {uploadingImages ? imageProgress || 'Uploading…' : `+ Add images (${productImages.length}/10)`}
            </button>
          </div>

          {/* Promo video — MP4 */}
          <div style={sec}>
            <div style={secLbl}>Promo video — MP4 upload</div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1.25rem' }}>Upload an MP4, MOV, or WebM to Cloudflare R2. Up to 2GB. Affiliates can download or share this.</p>

            {/* Aspect ratio */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Video format</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { value: '9/16', label: '9:16 Vertical', sub: 'TikTok · Reels · Shorts', icon: '▯' },
                  { value: '16/9', label: '16:9 Landscape', sub: 'YouTube · Facebook', icon: '▬' },
                  { value: '1/1',  label: '1:1 Square',    sub: 'Instagram Feed',   icon: '▪' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setField('video_aspect_ratio', opt.value)}
                    className={`ratio-btn${form.video_aspect_ratio === opt.value ? ' active' : ''}`}>
                    <div style={{ fontSize: '20px', marginBottom: '0.25rem' }}>{opt.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.65, marginTop: '0.15rem' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {videoUrl ? (
              <div style={{ border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '4px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>{videoName}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>✓ Uploaded · {form.video_aspect_ratio.replace('/', ':')} format</div>
                  </div>
                </div>
                <button type="button" onClick={removeVideo} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', flexShrink: 0 }}>Remove</button>
              </div>
            ) : (
              <>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={handleVideoUpload} style={{ display: 'none' }} />
                <div className="drop-zone" onClick={() => !videoUploading && videoInputRef.current?.click()} style={{ opacity: videoUploading ? 0.7 : 1 }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', display: 'block' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                  {videoUploading ? (
                    <div>
                      <div style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '0.5rem' }}>Uploading… {videoProgress}%</div>
                      <div className="prog-bar"><div className="prog-fill" style={{ width: `${videoProgress}%` }} /></div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#3a3a3a', marginBottom: '0.25rem' }}>Click to upload promo video</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>MP4, MOV, WebM — up to 2GB</div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* YouTube / embed URL — separate section */}
          <div style={sec}>
            <div style={secLbl}>YouTube / embed video</div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1rem' }}>Paste a YouTube or Vimeo URL. This displays as an embedded player on your product page.</p>
            <label style={lbl}>Embed URL</label>
            <input style={inp} type="url" value={form.video_embed_url} onChange={e => setField('video_embed_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            {form.video_embed_url && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#16a34a' }}>✓ Embed URL saved</div>
                <button type="button" onClick={() => setField('video_embed_url', '')} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Remove</button>
              </div>
            )}
          </div>

          {/* Brand guidelines */}
          <div style={sec}>
            <div style={secLbl}>Brand guidelines <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Brand guidelines</label>
                <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={form.brand_guidelines} onChange={e => setField('brand_guidelines', e.target.value)} placeholder="Tone, messaging, dos and don'ts for affiliates…" />
              </div>
              <div>
                <label style={lbl}>Prohibited terms</label>
                <input style={inp} value={form.prohibited_terms} onChange={e => setField('prohibited_terms', e.target.value)} placeholder="e.g. cure, guaranteed, free" />
              </div>
            </div>
          </div>

          {/* AI assets */}
          <div style={sec}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={secLbl}>AI affiliate assets</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '-0.75rem' }}>TikTok hooks, IG captions, email swipes & YouTube scripts</div>
              </div>
              <button type="button" onClick={generateAIAssets} disabled={aiLoading}
                style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.6rem 1.25rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: aiLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}>
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

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '0.5rem' }}>
            <Link href="/vendor/products" style={{ fontSize: '13px', color: '#888', padding: '0.7rem 1.5rem', textDecoration: 'none', fontFamily: 'inherit' }}>Cancel</Link>
            <button type="submit" disabled={loading}
              style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.75rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Listing product…' : 'List product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}