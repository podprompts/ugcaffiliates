// src/app/marketplace/[slug]/page.tsx
// CHANGE: ApplyCard now gates non-logged-in users with a Sign Up prompt
// instead of letting them click Apply and showing "Applied - pending approval"

'use client'

import { useEffect, useState, useMemo } from 'react'
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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [activeAsset, setActiveAsset] = useState<string>('tiktok')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [trendAnimated, setTrendAnimated] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
        const { data: app } = await supabase
          .from('affiliate_applications')
          .select('id')
          .eq('product_id', p.id)
          .eq('affiliate_id', session.user.id)
          .single()
        if (app) setApplied(true)
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

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      const images = product?.images ?? []
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, images.length - 1) : null)
      if (e.key === 'ArrowLeft')  setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
      if (e.key === 'Escape')     setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, product])

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
    setApplySuccess(true)
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

  const vendor    = product.profiles as any
  const commPct   = (product.commission_rate * 100).toFixed(0)
  const earn      = (product.price * product.commission_rate).toFixed(2)
  const aiAssets  = product.ai_assets
  const images: string[] = product.images ?? (product.image_url ? [product.image_url] : [])
  const trendScore = getTrendScore(product.id)
  const trendPct   = ((trendScore - 5) / 5) * 100
  const trendColor = trendScore >= 9 ? '#16a34a' : trendScore >= 7 ? '#2563eb' : '#888'
  const embedUrl   = normalizeEmbedUrl(product.video_embed_url ?? '')

  const assetTabs = [
    { key: 'tiktok',   label: 'TikTok Hook',    content: aiAssets?.tiktok_hook },
    { key: 'ig',       label: 'IG Caption',      content: aiAssets?.ig_caption },
    { key: 'email',    label: 'Email Swipe',     content: aiAssets?.email_swipe },
    { key: 'youtube',  label: 'YouTube Script',  content: aiAssets?.youtube_script },
  ].filter(t => t.content)

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .pd-nav { background: #fff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; align-items: center; height: 68px; gap: 1rem; position: sticky; top: 0; z-index: 50; }
        .pd-body { max-width: 1100px; margin: 0 auto; padding: 3rem 2.5rem; display: grid; grid-template-columns: 1fr 360px; gap: 4rem; align-items: start; }
        .pd-sticky { position: sticky; top: 88px; }
        .pd-asset-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .pd-commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .trend-bar-track { background: #f2f0ec; border-radius: 100px; height: 8px; overflow: hidden; margin-top: 0.4rem; }
        .trend-bar-fill { height: 100%; border-radius: 100px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (max-width: 900px) {
          .pd-body { grid-template-columns: 1fr; gap: 2rem; padding: 2rem 1.5rem; }
          .pd-sticky { position: static; }
        }
        @media (max-width: 600px) {
          .pd-nav { padding: 0 1rem; height: 56px; }
          .pd-body { padding: 1.5rem 1rem; }
          .pd-commission-grid { grid-template-columns: repeat(2, 1fr); }
          .pd-asset-tabs button { font-size: 11.5px !important; padding: 0.4rem 0.75rem !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div onClick={() => setLightboxIndex(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null) }} style={{ position: 'absolute', left: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: lightboxIndex === 0 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <img src={images[lightboxIndex]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '4px' }} />
          <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? Math.min(i + 1, images.length - 1) : null) }} style={{ position: 'absolute', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: lightboxIndex === images.length - 1 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          <button onClick={() => setLightboxIndex(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{lightboxIndex + 1} / {images.length}</div>
        </div>
      )}

      {/* Nav */}
      <nav className="pd-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>
        <Link href="/marketplace" style={{ fontSize: '13px', color: '#888', textDecoration: 'none', whiteSpace: 'nowrap' }}>← Marketplace</Link>
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <Link href="/affiliate" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Dashboard</Link>
          ) : (
            <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.5rem 1.1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Affiliate Access</Link>
          )}
        </div>
      </nav>

      <div className="pd-body">
        {/* LEFT COLUMN */}
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '1.5rem' }}>
            <Link href="/marketplace" style={{ color: '#888', textDecoration: 'none' }}>Marketplace</Link>{' · '}
            <span>{product.category}</span>
          </div>

          {(product.video_url || embedUrl) && (
            <div style={{ width: '100%', aspectRatio: product.video_aspect_ratio ?? '16/9', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem', background: '#0d0d0d' }}>
              {product.video_url ? (
                <video controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} poster={images[0] ?? undefined}>
                  <source src={product.video_url} type="video/mp4" />
                </video>
              ) : (
                <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" title={product.title} />
              )}
            </div>
          )}

          {images.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {images.map((url, i) => (
                <div key={i} onClick={() => setLightboxIndex(i)} style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', cursor: 'zoom-in', background: '#f2f0ec', position: 'relative' }}>
                  <img src={url} alt={i === 0 ? product.title : `${product.title} image ${i + 1}`} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  {i === 0 && <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '2px', letterSpacing: '0.06em' }}>Primary</div>}
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && !product.video_url && !embedUrl && (
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#f2f0ec', borderRadius: '6px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No media</span>
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '12px', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{vendor?.full_name ?? 'Vendor'}</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 500, color: '#0d0d0d', marginBottom: '1.25rem', lineHeight: 1.15 }}>{product.title}</h1>
          <p style={{ fontSize: '15px', color: '#3a3a3a', lineHeight: 1.75, marginBottom: '2rem' }}>{product.description}</p>

          <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '1rem' }}>Commission details</div>
            <div className="pd-commission-grid">
              {[
                { label: 'Product price',    value: `$${product.price}` },
                { label: 'Commission rate',  value: `${commPct}%` },
                { label: 'You earn per sale', value: `$${earn}` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '0.25rem' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e8e6e2', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#3a3a3a' }}><span style={{ color: '#888' }}>Cookie window: </span>{product.cookie_days ?? 30} days</div>
              <div style={{ fontSize: '13px', color: '#3a3a3a' }}><span style={{ color: '#888' }}>Approval: </span>{product.auto_approve ? 'Instant' : 'Manual review'}</div>
            </div>
          </div>

          {product.brand_guidelines && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.6rem' }}>Brand guidelines</div>
              <p style={{ fontSize: '13.5px', color: '#3a3a3a', lineHeight: 1.7, background: '#f9f8f6', padding: '1rem', borderRadius: '3px', border: '1px solid #e8e6e2' }}>{product.brand_guidelines}</p>
            </div>
          )}

          {product.prohibited_terms && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.6rem' }}>Prohibited terms</div>
              <p style={{ fontSize: '13.5px', color: '#dc2626' }}>{product.prohibited_terms}</p>
            </div>
          )}

          {aiAssets && assetTabs.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.75rem' }}>AI-generated affiliate assets</div>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Ready-to-use content for your posts. Apply to promote to unlock.</p>
              <div className="pd-asset-tabs" style={{ marginBottom: '0' }}>
                {assetTabs.map(t => (
                  <button key={t.key} onClick={() => setActiveAsset(t.key)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeAsset === t.key ? '#0d0d0d' : '#f2f0ec', color: activeAsset === t.key ? '#ffffff' : '#888', borderRadius: '3px 3px 0 0' }}>{t.label}</button>
                ))}
              </div>
              <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', padding: '1.25rem', borderRadius: '0 4px 4px 4px', position: 'relative' }}>
                {!applied && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,248,246,0.9)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 4px 4px 4px', zIndex: 1 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '0.5rem' }}>Apply to unlock assets</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>Get approved to access all AI content</div>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7 }}>{assetTabs.find(t => t.key === activeAsset)?.content ?? ''}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'none' }} className="pd-mobile-apply">
            <ApplyCard product={product} earn={earn} commPct={commPct} applied={applied} applying={applying} applySuccess={applySuccess} applyToPromote={applyToPromote} user={user} trendScore={trendScore} trendPct={trendAnimated ? ((trendAnimated - 5) / 5) * 100 : 0} trendColor={trendColor} />
          </div>
        </div>

        {/* RIGHT COLUMN — sticky */}
        <div className="pd-sticky">
          <ApplyCard product={product} earn={earn} commPct={commPct} applied={applied} applying={applying} applySuccess={applySuccess} applyToPromote={applyToPromote} user={user} trendScore={trendScore} trendPct={trendAnimated ? ((trendAnimated - 5) / 5) * 100 : 0} trendColor={trendColor} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pd-mobile-apply { display: block !important; margin-bottom: 2rem; }
          .pd-sticky { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function ApplyCard({ product, earn, commPct, applied, applying, applySuccess, applyToPromote, user, trendScore, trendPct, trendColor }: any) {
  return (
    <>
      <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '2px' }}>{commPct}% commission</div>
          {product.auto_approve && <div style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '2px', border: '1px solid #bbf7d0' }}>Instant approval</div>}
        </div>

        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 600, marginBottom: '0.25rem' }}>${earn}</div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>earned per sale · ${product.price} product</div>

        {/* ── Apply button — gated by auth ────────────────────────── */}
        {applied ? (
          // Already applied (logged-in user who has applied)
          <div style={{ width: '100%', padding: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '3px', fontSize: '14px', fontWeight: 600, color: '#16a34a', textAlign: 'center' }}>
            ✓ Applied — pending approval
          </div>
        ) : user ? (
          // Logged-in, hasn't applied yet
          <button
            onClick={applyToPromote}
            disabled={applying}
            style={{ width: '100%', padding: '0.85rem', background: applying ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: applying ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {applying ? 'Applying...' : product.auto_approve ? 'Promote now — instant' : 'Apply to promote'}
          </button>
        ) : (
          // NOT logged in — show sign-up gate, no apply button
          <div>
            <Link
              href="/signup"
              style={{ display: 'block', width: '100%', padding: '0.85rem', background: '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, borderRadius: '3px', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}
            >
              Sign up to apply
            </Link>
            <div style={{ marginTop: '0.6rem', textAlign: 'center', fontSize: '12px', color: '#888' }}>
              Already have an account?{' '}
              <Link href={`/login?redirect=/marketplace/${product.slug}`} style={{ color: '#0d0d0d', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                Sign in
              </Link>
            </div>
          </div>
        )}

        {applySuccess && (
          <div style={{ marginTop: '0.75rem', fontSize: '12px', color: '#16a34a', textAlign: 'center' }}>
            The vendor has been notified of your application.
          </div>
        )}

        {product.product_url && (
          <a href={product.product_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', fontSize: '13px', color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            View product site →
          </a>
        )}
      </div>

      {/* Stats card */}
      <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.25rem' }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>Trend</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: trendColor }}>{trendScore}<span style={{ fontSize: '10px', fontWeight: 500, color: '#888' }}>/10</span></div>
          </div>
          <div className="trend-bar-track">
            <div className="trend-bar-fill" style={{ width: `${trendPct}%`, background: trendColor }} />
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '0.25rem', letterSpacing: '0.04em' }}>
            {trendScore >= 9 ? '🔥 Hot right now' : trendScore >= 7 ? '📈 Trending up' : '⚡ Building momentum'}
          </div>
        </div>
        {[
          { label: 'Category',   value: product.category },
          { label: 'Listed by',  value: (product.profiles as any)?.full_name ?? 'Vendor' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>{s.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </>
  )
}