'use client'

// src/components/ProductCarousel.tsx
// Smooth infinite-loop carousel with momentum, fluid mobile swipe,
// and a subtle image parallax "lock" effect on scroll.

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
  profiles?: { full_name?: string; business_name?: string }
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef   = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX     = useRef(0)
  const startScroll = useRef(0)
  const velocity   = useRef(0)
  const lastX      = useRef(0)
  const lastTime   = useRef(0)
  const rafId      = useRef<number | null>(null)
  const isTouching = useRef(false)
  const n = products.length

  const CLONES = 3
  const items = [
    ...products.slice(-CLONES),
    ...products,
    ...products.slice(0, CLONES),
  ]

  const getStep = () => {
    const el = trackRef.current
    if (!el) return 0
    const card = el.querySelector('.pc-card') as HTMLElement
    if (!card) return 0
    return card.offsetWidth + 16
  }

  const checkLoop = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const step = getStep()
    if (!step) return
    const minBound = CLONES * step
    const maxBound = (CLONES + n) * step
    if (el.scrollLeft < minBound - step * 0.5) {
      el.scrollLeft += n * step
    } else if (el.scrollLeft >= maxBound - step * 0.5) {
      el.scrollLeft -= n * step
    }
  }, [n])

  // Parallax image lock — images shift slightly opposite to scroll direction
  const updateParallax = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const imgs = el.querySelectorAll<HTMLElement>('.pc-img')
    const trackRect = el.getBoundingClientRect()
    imgs.forEach(img => {
      const card = img.closest('.pc-card') as HTMLElement
      if (!card) return
      const cardRect = card.getBoundingClientRect()
      const cardCenter = cardRect.left + cardRect.width / 2
      const trackCenter = trackRect.left + trackRect.width / 2
      const offset = (cardCenter - trackCenter) / trackRect.width
      // Subtle parallax: max ±8% shift
      const shift = offset * -8
      img.style.transform = `translateX(${shift}%) scale(1.08)`
    })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const step = getStep()
    if (step) el.scrollLeft = CLONES * step
    updateParallax()
  }, [updateParallax])

  const momentum = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    if (Math.abs(velocity.current) < 0.3) {
      velocity.current = 0
      checkLoop()
      updateParallax()
      return
    }
    el.scrollLeft -= velocity.current
    velocity.current *= 0.93
    checkLoop()
    updateParallax()
    rafId.current = requestAnimationFrame(momentum)
  }, [checkLoop, updateParallax])

  // ── Mouse drag ──────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current)
    const el = trackRef.current!
    isDragging.current = true
    startX.current = e.pageX
    startScroll.current = el.scrollLeft
    lastX.current = e.pageX
    lastTime.current = performance.now()
    velocity.current = 0
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const now = performance.now()
      const dt = now - lastTime.current
      if (dt > 0) velocity.current = (lastX.current - e.pageX) / dt * 16
      lastX.current = e.pageX
      lastTime.current = now
      el.scrollLeft = startScroll.current + (startX.current - e.pageX)
      checkLoop()
      updateParallax()
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      el.style.cursor = 'grab'
      el.style.userSelect = ''
      rafId.current = requestAnimationFrame(momentum)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [checkLoop, momentum, updateParallax])

  // ── Touch ───────────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current)
    const el = trackRef.current!
    isTouching.current = true
    isDragging.current = true
    startX.current = e.touches[0].clientX
    startScroll.current = el.scrollLeft
    lastX.current = e.touches[0].clientX
    lastTime.current = performance.now()
    velocity.current = 0
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    // Only handle horizontal swipes — let vertical scroll through
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    const dy = Math.abs(e.touches[0].clientY - (e.touches[0].clientY))
    if (dy > dx) return

    const el = trackRef.current!
    const now = performance.now()
    const dt = now - lastTime.current
    const currentX = e.touches[0].clientX

    if (dt > 0) {
      velocity.current = (lastX.current - currentX) / dt * 16
    }
    lastX.current = currentX
    lastTime.current = now
    el.scrollLeft = startScroll.current + (startX.current - currentX)
    checkLoop()
    updateParallax()
  }

  const onTouchEnd = () => {
    isTouching.current = false
    isDragging.current = false
    // Give a little extra momentum boost on mobile for that fluid feel
    velocity.current *= 1.4
    rafId.current = requestAnimationFrame(momentum)
  }

  if (!n) return null

  return (
    <div style={{ position: 'relative', margin: '0 -2.5rem' }}>
      <style>{`
        .pc-track {
          display: flex;
          gap: 16px;
          overflow-x: scroll;
          overflow-y: hidden;
          scrollbar-width: none;
          padding: 0 2.5rem;
          cursor: grab;
          will-change: scroll-position;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-x;
        }
        .pc-track::-webkit-scrollbar { display: none; }
        .pc-card {
          flex-shrink: 0;
          width: calc(30% - 8px);
          text-decoration: none;
          color: inherit;
          display: block;
          -webkit-user-drag: none;
        }
        .pc-img-wrap {
          width: 100%;
          aspect-ratio: 1;
          background: #f2f0ec;
          border-radius: 2px;
          margin-bottom: 0.75rem;
          position: relative;
          overflow: hidden;
        }
        .pc-img {
          width: 108%;
          height: 108%;
          object-fit: cover;
          pointer-events: none;
          position: absolute;
          top: -4%;
          left: -4%;
          transition: transform 0.05s linear;
          will-change: transform;
        }
        .pc-card:hover .pc-title { text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 1024px) { .pc-card { width: calc(45% - 8px); } }
        @media (max-width: 768px)  {
          .pc-track { gap: 12px; padding: 0 1rem; touch-action: pan-x; }
          .pc-card { width: calc(72% - 6px); }
        }
        @media (max-width: 480px)  { .pc-card { width: calc(84% - 6px); } }
      `}</style>

      <div
        ref={trackRef}
        className="pc-track"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {items.map((p, idx) => {
          const vendor      = p.profiles as any
          const earn        = (p.price * p.commission_rate).toFixed(2)
          const commPct     = (p.commission_rate * 100).toFixed(0)
          const img         = p.images?.[0] ?? p.image_url
          const slug        = (p as any).slug ?? p.id
          const isClone     = idx < CLONES || idx >= CLONES + n
          const displayName = vendor?.business_name || vendor?.full_name || 'Vendor'

          return (
            <Link
              key={`${p.id}-${idx}`}
              href={`/marketplace/${slug}`}
              className="pc-card"
              tabIndex={isClone ? -1 : 0}
              aria-hidden={isClone}
              draggable={false}
            >
              <div className="pc-img-wrap">
                {img ? (
                  <img
                    src={img}
                    alt={p.title}
                    draggable={false}
                    className="pc-img"
                  />
                ) : (
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>No image</span>
                )}
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#0d0d0d', color: '#fff', fontSize: '10.5px', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '2px', zIndex: 1 }}>{commPct}% commission</div>
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '11px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{displayName}</div>
              <div className="pc-title" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.3rem', lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Earn up to <strong style={{ color: '#0d0d0d' }}>${earn}</strong> per sale</div>
            </Link>
          )
        })}
      </div>

      {/* Fade edges */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '2.5rem', height: '100%', background: 'linear-gradient(to right, #ffffff, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '5rem', height: '100%', background: 'linear-gradient(to left, #ffffff, transparent)', pointerEvents: 'none' }} />
    </div>
  )
}