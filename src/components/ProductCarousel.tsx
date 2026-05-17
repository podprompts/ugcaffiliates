'use client'

// src/components/ProductCarousel.tsx
// Infinite-loop horizontal carousel with peek effect.
// Shows ~2.3 cards on desktop, ~1.3 on mobile.
// Swipeable in both directions, loops endlessly.

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  slug: string
  title: string
  price: number
  commission_rate: number
  image_url?: string
  images?: string[]
  profiles?: { full_name?: string }
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef  = useRef<HTMLDivElement>(null)
  const ticking   = useRef(false)
  const n         = products.length

  // Build infinite list: clone last 3, real items, clone first 3
  const CLONES = 3
  const items = [
    ...products.slice(-CLONES),
    ...products,
    ...products.slice(0, CLONES),
  ]

  // Jump without animation when hitting clone zones
  const handleScroll = useCallback(() => {
    if (ticking.current) return
    ticking.current = true
    requestAnimationFrame(() => {
      const el = trackRef.current
      if (!el) { ticking.current = false; return }

      const card     = el.querySelector('.pc-card') as HTMLElement
      if (!card)     { ticking.current = false; return }
      const step     = card.offsetWidth + 20 // card + gap

      const minBound = CLONES * step
      const maxBound = (CLONES + n) * step

      if (el.scrollLeft < minBound - step / 2) {
        el.style.scrollBehavior = 'auto'
        el.scrollLeft += n * step
        // Re-enable smooth after a frame
        requestAnimationFrame(() => {
          if (el) el.style.scrollBehavior = 'smooth'
        })
      } else if (el.scrollLeft > maxBound - step / 2) {
        el.style.scrollBehavior = 'auto'
        el.scrollLeft -= n * step
        requestAnimationFrame(() => {
          if (el) el.style.scrollBehavior = 'smooth'
        })
      }
      ticking.current = false
    })
  }, [n])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.pc-card') as HTMLElement
    if (!card) return
    const step = card.offsetWidth + 20
    // Start at first real card (after the leading clones)
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = CLONES * step
    requestAnimationFrame(() => {
      if (el) el.style.scrollBehavior = 'smooth'
    })
  }, [])

  if (!n) return null

  return (
    <div style={{ position: 'relative', margin: '0 -2.5rem' }}>
      <style>{`
        .pc-track {
          display: flex;
          gap: 20px;
          overflow-x: scroll;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          padding: 0 2.5rem;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
        }
        .pc-track::-webkit-scrollbar { display: none; }
        .pc-track:active { cursor: grabbing; }
        .pc-card {
          flex-shrink: 0;
          width: calc(40% - 10px);
          scroll-snap-align: start;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .pc-card:hover .pc-title { text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 1024px) { .pc-card { width: calc(55% - 10px); } }
        @media (max-width: 768px)  { .pc-card { width: calc(75% - 10px); } }
        @media (max-width: 480px)  { .pc-card { width: calc(85% - 10px); } }
      `}</style>

      <div
        ref={trackRef}
        className="pc-track"
        onScroll={handleScroll}
        // Touch drag support
        onMouseDown={e => {
          const el = trackRef.current!
          const startX = e.pageX - el.offsetLeft
          const startScroll = el.scrollLeft
          el.style.scrollBehavior = 'auto'
          const onMove = (ev: MouseEvent) => {
            el.scrollLeft = startScroll - (ev.pageX - el.offsetLeft - startX)
          }
          const onUp = () => {
            el.style.scrollBehavior = 'smooth'
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
      >
        {items.map((p, idx) => {
          const vendor    = p.profiles as any
          const earn      = (p.price * p.commission_rate).toFixed(2)
          const commPct   = (p.commission_rate * 100).toFixed(0)
          const img       = (p as any).images?.[0] ?? p.image_url
          const slug      = (p as any).slug ?? p.id
          const isClone   = idx < CLONES || idx >= CLONES + n
          return (
            <Link
              key={`${p.id}-${idx}`}
              href={`/marketplace/${slug}`}
              className="pc-card"
              tabIndex={isClone ? -1 : 0}
              aria-hidden={isClone}
            >
              <div style={{ width: '100%', aspectRatio: '1', background: '#f2f0ec', borderRadius: '2px', marginBottom: '0.75rem', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {img ? (
                  <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} draggable={false} />
                ) : (
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>No image</span>
                )}
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#0d0d0d', color: '#fff', fontSize: '10.5px', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '2px' }}>{commPct}% commission</div>
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '12px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{vendor?.full_name ?? 'Vendor'}</div>
              <div className="pc-title" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.3rem', lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Earn up to <strong style={{ color: '#0d0d0d' }}>${earn}</strong> per sale</div>
            </Link>
          )
        })}
      </div>

      {/* Fade edges to hint at more content */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '2.5rem', height: '100%', background: 'linear-gradient(to right, #ffffff, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '5rem', height: '100%', background: 'linear-gradient(to left, #ffffff, transparent)', pointerEvents: 'none' }} />
    </div>
  )
}