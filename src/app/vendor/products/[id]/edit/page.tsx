// src/app/vendor/products/[id]/edit/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

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
  const [profileInitial, setProfileInitial] = useState('V')
  const [isAdmin, setIsAdmin] = useState(false)

  // Image state
  const [productImages, setProductImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video state
  const [videoUrl, setVideoUrl] = useState('')
  const [videoName, setVideoName] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', description: '', product_url: '', price: '',
    commission_rate: '', category: '', brand_guidelines: '',
    prohibited_terms: '', cookie_days: '30', auto_approve: false,
    video_embed_url: '', video_aspect_ratio: '16/9', status: 'active',
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

      if (!profile || !['vendor', 'admin'].includes(profile.role)) {
        router.push('/login'); return
      }

      const adminMode = profile.role === 'admin'
      setIsAdmin(adminMode)
      setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      const query = supabase.from('products').select('*').eq('id', productId)
      if (!adminMode) query.eq('vendor_id', session.user.id)
      const { data: product } = await query.single()

      if (!product) { router.push(adminMode ? '/admin/products' : '/vendor/products'); return }

      setProductImages(product.images ?? (product.image_url ? [product.image_url] : []))
      setVideoUrl(product.video_url ?? '')
      setVideoName(product.video_url ? 'Uploaded video' : '')
      setForm({
        title:            product.title ?? '',
        description:      product.description ?? '',
        product_url:      product.product_url ?? '',
        price:            product.price?.toString() ?? '',
        commission_rate:  ((product.commission_rate ?? 0) * 100).toFixed(0),
        category:         product.category ?? '',
        brand_guidelines: product.brand_guidelines ?? '',
        prohibited_terms: product.prohibited_terms ?? '',
        cookie_days:      product.cookie_days?.toString() ?? '30',
        auto_approve:     product.auto_approve ?? false,
        video_embed_url:  product.video_embed_url ?? '',
        video_aspect_ratio: product.video_aspect_ratio ?? '16/9',
        status:           product.status ?? 'active',
      })
      setLoading(false)
    }
    load()
  }, [productId])

  function set(key: string, value: any) {
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

  function removeImage(index: number) {
    setProductImages(prev => prev.filter((_, i) => i !== index))
  }

  // ── Video upload ─────────────────────────────────────────────────────────
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoUploading(true); setVideoProgress(0); setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      // Step 1 — Get presigned URL (bypasses Vercel 4.5MB limit)
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filename:    file.name,
          contentType: file.type || 'video/mp4',
          type:        'video',
        }),
      })

      if (!presignRes.ok) {
        const err = await presignRes.json()
        throw new Error(err.error ?? 'Failed to get upload URL')
      }

      const { presignedUrl, publicUrl } = await presignRes.json()

      // Step 2 — Upload directly to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setVideoProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setVideoUrl(publicUrl); setVideoName(file.name); resolve()
          } else {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.send(file)
      })

    } catch (err: any) {
      setError(err.message ?? 'Video upload failed')
    }

    setVideoUploading(false)
    setVideoProgress(0)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }


  function removeVideo() {
    setVideoUrl(''); setVideoName('')
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('products').delete().eq('id', productId)
    router.push(isAdmin ? '/admin/products' : '/vendor/products')
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)

    const commissionRate = parseFloat(form.commission_rate) / 100
    if (isNaN(commissionRate) || commissionRate < 0.05 || commissionRate > 0.70) {
      setError('Commission rate must be between 5% and 70%'); setSaving(false); return
    }

    const { error: updateError } = await supabase.from('products').update({
      title:            form.title,
      description:      form.description,
      product_url:      form.product_url,
      price:            parseFloat(form.price),
      commission_rate:  commissionRate,
      category:         form.category,
      brand_guidelines: form.brand_guidelines || null,
      prohibited_terms: form.prohibited_terms || null,
      cookie_days:      parseInt(form.cookie_days),
      auto_approve:     form.auto_approve,
      status:           form.status,
      images:           productImages,
      image_url:        productImages[0] ?? null,
      video_url:        videoUrl || null,
      video_embed_url:  form.video_embed_url || null,
      video_aspect_ratio: form.video_aspect_ratio,
      updated_at:       new Date().toISOString(),
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

  const inp = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }
  const sec = { background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }
  const secLbl = { fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 600, marginBottom: '1.25rem' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ve-content { max-width: 780px; margin: 0 auto; padding: 2.5rem 2rem; }
        .ve-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .ve-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .ve-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .drop-zone { border: 2px dashed #d0cdc8; border-radius: 6px; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .drop-zone:hover { border-color: #0d0d0d; background: #f9f8f6; }
        .prog-bar { height: 4px; background: #e8e6e2; border-radius: 2px; overflow: hidden; margin-top: 0.75rem; }
        .prog-fill { height: 100%; background: #0d0d0d; border-radius: 2px; transition: width 0.2s ease; }
        .ratio-btn { flex: 1; padding: 0.75rem; border-radius: 3px; border: 1.5px solid #e8e6e2; background: #ffffff; cursor: pointer; font-family: inherit; transition: all 0.15s; text-align: center; }
        .ratio-btn.active { border-color: #0d0d0d; background: #0d0d0d; color: #ffffff; }
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

        {isAdmin && (
          <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.75rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>You are editing this listing as Admin.</span>
            <Link href="/admin/products" style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', textDecoration: 'underline' }}>← Back to Admin Products</Link>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <Link href={isAdmin ? '/admin/products' : '/vendor/products'} style={{ fontSize: '12px', color: '#888', textDecoration: 'none', marginBottom: '0.75rem', display: 'inline-block' }}>
            ← {isAdmin ? 'Admin Products' : 'My products'}
          </Link>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Edit listing</h1>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#16a34a' }}>Changes saved successfully.</div>
        )}

        <form onSubmit={handleSave}>

          {/* Core details */}
          <div style={sec}>
            <div style={secLbl}>Product details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>Description *</label>
                <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>Product URL *</label>
                <input style={inp} type="url" value={form.product_url} onChange={e => set('product_url', e.target.value)} required placeholder="https://" />
              </div>
              <div className="ve-two-col">
                <div>
                  <label style={lbl}>Price ($) *</label>
                  <input style={inp} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
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
            <div className="ve-three-col">
              <div>
                <label style={lbl}>Commission rate (%) *</label>
                <input style={inp} type="number" min="5" max="70" step="1" value={form.commission_rate} onChange={e => set('commission_rate', e.target.value)} required />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.35rem' }}>5% – 70%</div>
              </div>
              <div>
                <label style={lbl}>Cookie window (days)</label>
                <input style={inp} type="number" min="1" max="90" value={form.cookie_days} onChange={e => set('cookie_days', e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.auto_approve} onChange={e => set('auto_approve', e.target.checked)} />
                  <span style={{ fontSize: '13px', color: '#3a3a3a' }}>Auto-approve affiliates</span>
                </label>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={sec}>
            <div style={secLbl}>Listing status</div>
            <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              {isAdmin && <option value="rejected">Rejected</option>}
            </select>
          </div>

          {/* Product images */}
          <div style={sec}>
            <div style={secLbl}>Product images <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa' }}>(up to 10)</span></div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1rem' }}>JPG, PNG, WebP up to 50MB each. First image is the main thumbnail.</p>

            {productImages.length > 0 && (
              <div className="ve-img-grid">
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

          {/* MP4 video upload */}
          <div style={sec}>
            <div style={secLbl}>Promo video — MP4 upload</div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1.25rem' }}>Upload an MP4, MOV, or WebM. Up to 2GB. Replaces any existing uploaded video.</p>

            {/* Aspect ratio */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Video format</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { value: '9/16', label: '9:16 Vertical', sub: 'TikTok · Reels', icon: '▯' },
                  { value: '16/9', label: '16:9 Landscape', sub: 'YouTube · Facebook', icon: '▬' },
                  { value: '1/1',  label: '1:1 Square',    sub: 'Instagram Feed', icon: '▪' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('video_aspect_ratio', opt.value)}
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
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>{videoName || 'Promo video'}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>✓ Uploaded · {form.video_aspect_ratio.replace('/', ':')} format</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button type="button" onClick={() => videoInputRef.current?.click()}
                    style={{ fontSize: '12px', color: '#0d0d0d', background: 'none', border: '1px solid #e8e6e2', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Replace
                  </button>
                  <button type="button" onClick={removeVideo}
                    style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                    Remove
                  </button>
                </div>
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

            {/* Hidden input for replace */}
            {videoUrl && (
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={handleVideoUpload} style={{ display: 'none' }} />
            )}
          </div>

          {/* YouTube embed — separate */}
          <div style={sec}>
            <div style={secLbl}>YouTube / embed video</div>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 1rem' }}>Paste a YouTube or Vimeo URL. Displays as an embedded player on your product page.</p>
            <label style={lbl}>Embed URL</label>
            <input style={inp} type="url" value={form.video_embed_url} onChange={e => set('video_embed_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            {form.video_embed_url && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#16a34a' }}>✓ Embed URL saved</div>
                <button type="button" onClick={() => set('video_embed_url', '')} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Remove</button>
              </div>
            )}
          </div>

          {/* Brand guidelines */}
          <div style={sec}>
            <div style={secLbl}>Brand guidelines <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Brand guidelines</label>
                <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={form.brand_guidelines} onChange={e => set('brand_guidelines', e.target.value)} placeholder="Tone, messaging, dos and don'ts for affiliates…" />
              </div>
              <div>
                <label style={lbl}>Prohibited terms</label>
                <input style={inp} value={form.prohibited_terms} onChange={e => set('prohibited_terms', e.target.value)} placeholder="e.g. cure, guaranteed, free" />
              </div>
            </div>
          </div>

          {/* Submit / delete */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {confirmDelete ? (
                <>
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>Are you sure? This cannot be undone.</span>
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#dc2626', padding: '0.6rem 1.25rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleDelete}
                  style={{ fontSize: '13px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                  Delete listing
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link href={isAdmin ? '/admin/products' : '/vendor/products'} style={{ fontSize: '13px', color: '#888', padding: '0.7rem 1.5rem', textDecoration: 'none', fontFamily: 'inherit' }}>Cancel</Link>
              <button type="submit" disabled={saving}
                style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.75rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}