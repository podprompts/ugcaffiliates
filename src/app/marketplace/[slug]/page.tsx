// src/app/marketplace/[slug]/page.tsx
// Commission details blurred for logged-out users
// AI assets + MP4 video gated to approved affiliates only

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function getTrendScore(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return 5 + (Math.abs(hash) % 6)
}

// ── Smooth infinite image gallery ────────────────────────────────────────────
function ImageGallery({ images }: { images: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const n = images.length

  const items = n > 1 ? [images[n - 1], ...images, images[0]] : images

  const getWidth = () => trackRef.current?.offsetWidth ?? 0

  useEffect(() => {
    if (!trackRef.current || n === 0) return
    const el = trackRef.current
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = n > 1 ? getWidth() : 0
  }, [n])

  const handleScrollEnd = useCallback(() => {
    const el = trackRef.current
    if (!el || n <= 1) return
    const w = getWidth()
    const idx = Math.round(el.scrollLeft / w)
    if (idx === 0) {
      el.style.scrollBehavior = 'auto'
      el.scrollLeft = n * w
      setCurrent(n - 1)
    } else if (idx === n + 1) {
      el.style.scrollBehavior = 'auto'
      el.scrollLeft = w
      setCurrent(0)
    } else {
      setCurrent(idx - 1)
    }
  }, [n])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(handleScrollEnd, 80)
      const w = getWidth()
      const idx = Math.round(el.scrollLeft / w)
      if (n > 1 && idx >= 1 && idx <= n) setCurrent(idx - 1)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  }, [handleScrollEnd, n])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % n)
      if (e.key === 'ArrowLeft')  setLightboxIndex(i => (i - 1 + n) % n)
      if (e.key === 'Escape')     setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, n])

  const scrollTo = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.style.scrollBehavior = 'smooth'
    el.scrollLeft += dir * getWidth()
  }

  if (n === 0) return null

  return (
    <>
      <style>{`
        .ig-wrap { position: relative; margin-bottom: 1.5rem; border-radius: 8px; overflow: hidden; background: #f2f0ec; }
        .ig-track { display: flex; overflow-x: scroll; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .ig-track::-webkit-scrollbar { display: none; }
        .ig-slide { flex-shrink: 0; width: 100%; scroll-snap-align: start; aspect-ratio: 4/3; position: relative; overflow: hidden; }
        .ig-slide img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform 0.4s ease; display: block; }
        .ig-slide img:hover { transform: scale(1.02); }
        .ig-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.92); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 2px 12px rgba(0,0,0,0.12); transition: background 0.15s, transform 0.15s; backdrop-filter: blur(4px); }
        .ig-btn:hover { background: #ffffff; transform: translateY(-50%) scale(1.08); }
        .ig-btn-left { left: 12px; }
        .ig-btn-right { right: 12px; }
        .ig-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 2; }
        .ig-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); transition: all 0.25s; cursor: pointer; border: none; padding: 0; }
        .ig-dot.active { background: #ffffff; width: 18px; border-radius: 3px; }
        .ig-thumb-row { display: flex; gap: 8px; margin-top: 0.75rem; margin-bottom: 2rem; overflow-x: auto; scrollbar-width: none; }
        .ig-thumb-row::-webkit-scrollbar { display: none; }
        .ig-thumb { flex-shrink: 0; width: 64px; height: 64px; border-radius: 4px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s, opacity 0.15s; opacity: 0.6; }
        .ig-thumb.active { border-color: #0d0d0d; opacity: 1; }
        .ig-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ig-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.94); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .ig-lightbox-img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 4px; user-select: none; }
        .ig-lightbox-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .ig-lightbox-btn:hover { background: rgba(255,255,255,0.2); }
        .ig-lightbox-close { position: absolute; top: 1.25rem; right: 1.25rem; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .ig-lightbox-counter { position: absolute; bottom: 1.25rem; left: 50%; transform: translateX(-50%); font-size: 13px; color: rgba(255,255,255,0.5); font-family: var(--font-dm-sans), sans-serif; }
      `}</style>

      <div className="ig-wrap">
        <div ref={trackRef} className="ig-track">
          {items.map((img, i) => (
            <div key={i} className="ig-slide">
              <img src={img} alt="" draggable={false}
                onClick={() => { setLightboxIndex(n > 1 ? (i === 0 ? n - 1 : i === n + 1 ? 0 : i - 1) : 0); setLightboxOpen(true) }} />
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button className="ig-btn ig-btn-left" onClick={() => scrollTo(-1)} aria-label="Previous">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button className="ig-btn ig-btn-right" onClick={() => scrollTo(1)} aria-label="Next">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
            <div className="ig-dots">
              {images.map((_, i) => (
                <button key={i} className={`ig-dot${current === i ? ' active' : ''}`}
                  onClick={() => { const el = trackRef.current; if (!el) return; el.style.scrollBehavior = 'smooth'; el.scrollLeft = (i + 1) * getWidth() }} />
              ))}
            </div>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="ig-thumb-row">
          {images.map((img, i) => (
            <div key={i} className={`ig-thumb${current === i ? ' active' : ''}`}
              onClick={() => { const el = trackRef.current; if (!el) return; el.style.scrollBehavior = 'smooth'; el.scrollLeft = (i + 1) * getWidth() }}>
              <img src={img} alt="" draggable={false} />
            </div>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="ig-lightbox" onClick={() => setLightboxOpen(false)}>
          <img src={images[lightboxIndex]} className="ig-lightbox-img" alt="" onClick={e => e.stopPropagation()} draggable={false} />
          {n > 1 && (
            <>
              <button className="ig-lightbox-btn" style={{ left: '1rem' }} onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + n) % n) }}>‹</button>
              <button className="ig-lightbox-btn" style={{ right: '1rem' }} onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % n) }}>›</button>
            </>
          )}
          <button className="ig-lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
          <div className="ig-lightbox-counter">{lightboxIndex + 1} / {n}</div>
        </div>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [isApprovedAffiliate, setIsApprovedAffiliate] = useState(false)
  const [activeAsset, setActiveAsset] = useState<string>('tiktok')
  const [trendAnimated, setTrendAnimated] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loggedIn = !!user

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      const { data: p } = await supabase
        .from('products')
        .select('*, profiles!vendor_id(id, full_name, bio, website_url)')
        .eq('slug', params.slug)
        .eq('status', 'active')
        .single()

      if (!p) { router.push('/marketplace'); return }
      setProduct(p)

      if (session?.user) {
        // Check application status — not just applied, but specifically approved
        const { data: app } = await supabase
          .from('affiliate_applications')
          .select('id, status')
          .eq('product_id', p.id)
          .eq('affiliate_id', session.user.id)
          .single()

        if (app) {
          setApplied(true)
          setIsApprovedAffiliate(app.status === 'approved')
        }

        // Vendors and admins can also see all assets for their own products
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, vendor_status')
          .eq('id', session.user.id)
          .single()

        if (profile && ['vendor', 'admin'].includes(profile.role)) {
          setIsApprovedAffiliate(true)
        }
      }

      setLoading(false)
    }
    load()
  }, [params.slug])

  useEffect(() => {
    if (!product) return
    const score = getTrendScore(product.id)
    const timer = setTimeout(() => setTrendAnimated(score), 300)
    return () => clearTimeout(timer)
  }, [product])

  async function applyToPromote() {
    if (!user) { window.location.href = '/signup'; return }
    setApplying(true)

    await supabase.from('affiliate_applications').insert({
      product_id:   product.id,
      affiliate_id: user.id,
    })

    const vendor = product.profiles as any
    if (vendor?.id) {
      await supabase.from('notifications').insert({
        user_id:    vendor.id,
        type:       'affiliate_application',
        title:      'New affiliate application',
        message:    `Someone applied to promote "${product.title}". Review them in your Affiliates dashboard.`,
        product_id: product.id,
        read:       false,
      })
    }

    setApplied(true)
    setApplying(false)
  }

  function normalizeEmbedUrl(url: string): string {
    if (!url) return ''
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    return url
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  if (!product) return null

  const vendor     = product.profiles as any
  const commPct    = (product.commission_rate * 100).toFixed(0)
  const earn       = (product.price * product.commission_rate).toFixed(2)
  const aiAssets   = product.ai_assets
  const images: string[] = product.images ?? (product.image_url ? [product.image_url] : [])
  const trendScore = getTrendScore(product.id)
  const trendColor = trendScore >= 9 ? '#16a34a' : trendScore >= 7 ? '#2563eb' : '#888'
  const embedUrl   = normalizeEmbedUrl(product.video_embed_url ?? '')

  const assetTabs = [
    { key: 'tiktok',  label: 'TikTok Hook',   content: aiAssets?.tiktok_hook },
    { key: 'ig',      label: 'IG Caption',     content: aiAssets?.ig_caption },
    { key: 'email',   label: 'Email Swipe',    content: aiAssets?.email_swipe },
    { key: 'youtube', label: 'YouTube Script', content: aiAssets?.youtube_script },
  ].filter(t => t.content)

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .pd-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; height: 68px; gap: 1rem; position: sticky; top: 0; z-index: 50; }
        .pd-nav-cta { display: block; flex-shrink: 0; }
        .pd-body { max-width: 1100px; margin: 0 auto; padding: 3rem 2.5rem; display: grid; grid-template-columns: 1fr 360px; gap: 4rem; align-items: start; }
        .pd-sticky { position: sticky; top: 88px; }
        .pd-asset-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .pd-commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .trend-bar-track { background: #f2f0ec; border-radius: 100px; height: 8px; overflow: hidden; margin-top: 0.4rem; }
        .trend-bar-fill { height: 100%; border-radius: 100px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (max-width: 900px) { .pd-body { grid-template-columns: 1fr; gap: 2rem; padding: 2rem 1.5rem; } .pd-sticky { position: static; } }
        @media (max-width: 600px) { .pd-nav { padding: 0 1rem; height: 56px; gap: 0.5rem; } .pd-nav-cta { display: none; } .pd-body { padding: 1.5rem 1rem; } .pd-commission-grid { grid-template-columns: repeat(2, 1fr); } .pd-asset-tabs button { font-size: 11.5px !important; padding: 0.4rem 0.75rem !important; } }
      `}</style>

      {/* Nav */}
      <nav className="pd-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>
        <Link href="/marketplace" style={{ fontSize: '13px', color: '#888', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>← Marketplace</Link>
        <div style={{ flex: 1 }} />
        <div className="pd-nav-cta">
          {loggedIn ? (
            <Link href="/affiliate" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>My dashboard</Link>
          ) : (
            <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Join free</Link>
          )}
        </div>
      </nav>

      <div className="pd-body">
        {/* Left column */}
        <div>
          {/* Image gallery — public */}
          {images.length > 0 && <ImageGallery images={images} />}
          {/* Product image downloads — approved affiliates only */}
{images.length > 0 && (
  <div style={{ marginBottom: '2.5rem' }}>
    <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Product images</div>
    {isApprovedAffiliate ? (
      <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem' }}>
        <div style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '1rem', lineHeight: 1.6 }}>
          Download high-resolution product images for your content.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {images.map((img, i) => (
            <a key={i} href={img} download target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d0d0d', color: '#ffffff', fontSize: '12px', fontWeight: 600, padding: '0.45rem 0.85rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Image {i + 1}
            </a>
          ))}
        </div>
      </div>
    ) : (
      <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '20px' }}>🔒</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>High-res images available</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            {!loggedIn ? (
              <><Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600 }}>Sign up</Link> and apply to download product images</>
            ) : !applied ? (
              'Apply to promote this product to download high-res images'
            ) : (
              'You\'ll get access to download images once your application is approved'
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}

          {/* YouTube embed — public (it's public YouTube anyway) */}
          {embedUrl && (
            <div style={{ marginBottom: '2.5rem' }}>
              <iframe src={embedUrl} style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: '6px' }} allowFullScreen />
            </div>
          )}

          {/* MP4 promo video — approved affiliates only */}
          {product.video_url && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Promo video</div>
              {isApprovedAffiliate ? (
                <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', background: '#e8e6e2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0d0d0d" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>Promo video</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>MP4 · Available to approved affiliates</div>
                    </div>
                  </div>
                  <a href={product.video_url} download target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Download
                  </a>
                </div>
              ) : (
                <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '20px' }}>🔒</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>Promo video available</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {!loggedIn ? (
                        <><Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600 }}>Sign up</Link> and apply to access the promo video</>
                      ) : !applied ? (
                        'Apply to promote this product to access the promo video'
                      ) : (
                        'You\'ll get access to the promo video once your application is approved'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title + category */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.5rem' }}>
              Marketplace · {product.category ?? 'General'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.25rem', fontWeight: 500, marginBottom: '0.75rem', lineHeight: 1.2 }}>{product.title}</h1>
            {vendor?.full_name && <div style={{ fontSize: '13px', color: '#888' }}>by {vendor.full_name}</div>}
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>About this product</div>
              <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.75 }}>{product.description}</p>
            </div>
          )}

          {/* Commission details — logged-in only */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Commission details</div>
            {!loggedIn ? (
              <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e8e6e2' }}>
                <div style={{ filter: 'blur(8px)', userSelect: 'none', pointerEvents: 'none', padding: '1.5rem' }}>
                  <div className="pd-commission-grid">
                    {[{ label: 'Product price', value: `$${product.price}` }, { label: 'Commission rate', value: '••%' }, { label: 'You earn per sale', value: '$••.••' }].map(item => (
                      <div key={item.label} style={{ background: '#f9f8f6', borderRadius: '4px', padding: '1rem' }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#f9f8f6', borderRadius: '4px', display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
                    <span>Cookie window: <strong>•• days</strong></span>
                    <span>Approval: <strong>••••••</strong></span>
                  </div>
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)' }}>
                  <div style={{ fontSize: '24px' }}>🔒</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0d0d0d' }}>Sign up to see commission details</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Sign up free</Link>
                    <Link href="/login" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', background: '#ffffff', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none', border: '1px solid #e8e6e2' }}>Sign in</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ border: '1px solid #e8e6e2', borderRadius: '6px', overflow: 'hidden' }}>
                <div className="pd-commission-grid" style={{ padding: '1.5rem', gap: '1rem' }}>
                  {[{ label: 'Product price', value: `$${product.price}` }, { label: 'Commission rate', value: `${commPct}%` }, { label: 'You earn per sale', value: `$${earn}` }].map(item => (
                    <div key={item.label} style={{ background: '#f9f8f6', borderRadius: '4px', padding: '1rem' }}>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #e8e6e2', display: 'flex', gap: '1.5rem', fontSize: '13px', color: '#555' }}>
                  <span>Cookie window: <strong>{product.cookie_days ?? 30} days</strong></span>
                  <span>Approval: <strong>{product.auto_approve ? 'Instant' : 'Manual review'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* AI Assets — approved affiliates only */}
          {assetTabs.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Affiliate content assets</div>
              {isApprovedAffiliate ? (
                <>
                  <div className="pd-asset-tabs" style={{ marginBottom: '1rem' }}>
                    {assetTabs.map(tab => (
                      <button key={tab.key} onClick={() => setActiveAsset(tab.key)}
                        style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.45rem 0.9rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeAsset === tab.key ? '#0d0d0d' : '#f2f0ec', color: activeAsset === tab.key ? '#ffffff' : '#888' }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {assetTabs.filter(t => t.key === activeAsset).map(tab => (
                    <div key={tab.key} style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem 1.5rem', fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {tab.content}
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '20px' }}>🔒</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d' }}>AI affiliate assets available</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {!loggedIn ? (
                        <><Link href="/signup" style={{ color: '#0d0d0d', fontWeight: 600 }}>Sign up</Link> and apply to access TikTok hooks, captions, email swipes & more</>
                      ) : !applied ? (
                        'Apply to promote this product to unlock AI-generated content assets'
                      ) : (
                        'You\'ll get access to all content assets once your application is approved'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Brand guidelines */}
          {product.brand_guidelines && (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Brand guidelines</div>
              <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem 1.5rem', fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7 }}>
                {product.brand_guidelines}
              </div>
            </div>
          )}
        </div>

        {/* Right sticky column */}
        <div className="pd-sticky">
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '8px', padding: '1.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'inline-block', background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '3px', marginBottom: '1.25rem' }}>
              {loggedIn ? `${commPct}% commission` : 'Sign up to see commission'}
            </div>

            {loggedIn ? (
              <>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.25rem' }}>${earn}</div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>earned per sale · ${product.price} product</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.25rem', filter: 'blur(8px)', userSelect: 'none' }}>$••.••</div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>earned per sale · ${product.price} product</div>
              </>
            )}

            {isApprovedAffiliate ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1rem', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>
                ✓ Approved — you're promoting this
              </div>
            ) : applied ? (
              <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.85rem 1rem', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
                ⏳ Applied — pending approval
              </div>
            ) : (
              <button onClick={applyToPromote} disabled={applying}
                style={{ width: '100%', padding: '0.9rem', background: applying ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: applying ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {applying ? 'Applying…' : loggedIn ? 'Apply to promote' : 'Sign up to apply'}
              </button>
            )}

            {!loggedIn && (
              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '13px', color: '#888' }}>
                Already have an account? <Link href="/login" style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline' }}>Sign in</Link>
              </div>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                View product site →
              </a>
            </div>
          </div>

          {/* Trend card */}
          <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '6px', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Trend</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: trendColor }}>{trendScore}/10</div>
            </div>
            <div className="trend-bar-track">
              <div className="trend-bar-fill" style={{ width: `${(trendAnimated / 10) * 100}%`, background: trendColor }} />
            </div>
            <div style={{ fontSize: '11px', color: trendColor, marginTop: '0.35rem' }}>☑ Trending up</div>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#888' }}>Category</span>
                <span style={{ fontWeight: 500 }}>{product.category ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#888' }}>Cookie window</span>
                <span style={{ fontWeight: 500 }}>
                  {loggedIn ? `${product.cookie_days ?? 30} days` : <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>•• days</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#888' }}>Approval</span>
                <span style={{ fontWeight: 500 }}>{product.auto_approve ? 'Instant' : 'Manual review'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}