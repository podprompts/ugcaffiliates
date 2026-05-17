'use client'

// src/components/ProductCarousel.tsx
// Smooth infinite-loop carousel. Swipeable, no jerky jumps.

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
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScroll = useRef(0)
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const rafId = useRef<number | null>(null)
  const n = products.length

  const CLONES = 3
  const items = [
    ...products.slice(-CLONES),
    ...products,
    ...products.slice(0, CLONES),
  ]

  // Get card width including gap
  const getStep = () => {
    const el = trackRef.current
    if (!el) return 0
    const card = el.querySelector('.pc-card') as HTMLElement
    if (!card) return 0
    return card.offsetWidth + 20
  }

  // Seamless loop — jump without animation when hitting clone zones
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

  // Set initial scroll position
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const step = getStep()
    if (step) el.scrollLeft = CLONES * step
  }, [])

  // Momentum scroll after drag release
  const momentum = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    if (Math.abs(velocity.current) < 0.5) {
      velocity.current = 0
      checkLoop()
      return
    }
    el.scrollLeft -= velocity.current
    velocity.current *= 0.92
    checkLoop()
    rafId.current = requestAnimationFrame(momentum)
  }, [checkLoop])

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current!
    if (rafId.current) cancelAnimationFrame(rafId.current)
    isDragging.current = true
    startX.current = e.pageX
    startScroll.current = el.scrollLeft
    lastX.current = e.pageX
    lastTime.current = Date.now()
    velocity.current = 0
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const now = Date.now()
      const dt = now - lastTime.current
      if (dt > 0) velocity.current = (lastX.current - e.pageX) / dt * 16
      lastX.current = e.pageX
      lastTime.current = now
      el.scrollLeft = startScroll.current + (startX.current - e.pageX)
      checkLoop()
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
  }, [checkLoop, momentum])

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    const el = trackRef.current!
    if (rafId.current) cancelAnimationFrame(rafId.current)
    isDragging.current = true
    startX.current = e.touches[0].pageX
    startScroll.current = el.scrollLeft
    lastX.current = e.touches[0].pageX
    lastTime.current = Date.now()
    velocity.current = 0
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const el = trackRef.current!
    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) velocity.current = (lastX.current - e.touches[0].pageX) / dt * 16
    lastX.current = e.touches[0].pageX
    lastTime.current = now
    el.scrollLeft = startScroll.current + (startX.current - e.touches[0].pageX)
    checkLoop()
  }

  const onTouchEnd = () => {
    isDragging.current = false
    rafId.current = requestAnimationFrame(momentum)
  }

  if (!n) return null

  return (
    <div style={{ position: 'relative', margin: '0 -2.5rem' }}>
      <style>{`
        .pc-track {
          display: flex;
          gap: 20px;
          overflow-x: scroll;
          scrollbar-width: none;
          padding: 0 2.5rem;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
          will-change: scroll-position;
        }
        .pc-track::-webkit-scrollbar { display: none; }
        .pc-card {
          flex-shrink: 0;
          width: calc(30% - 10px);
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .pc-card:hover .pc-title { text-decoration: underline; text-underline-offset: 2px; }
        @media (max-width: 1024px) { .pc-card { width: calc(45% - 10px); } }
        @media (max-width: 768px)  { .pc-card { width: calc(70% - 10px); } }
        @media (max-width: 480px)  { .pc-card { width: calc(82% - 10px); } }
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
          const vendor  = p.profiles as any
          const earn    = (p.price * p.commission_rate).toFixed(2)
          const commPct = (p.commission_rate * 100).toFixed(0)
          const img     = p.images?.[0] ?? p.image_url
          const slug    = (p as any).slug ?? p.id
          const isClone = idx < CLONES || idx >= CLONES + n
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
              <div style={{ width: '100%', aspectRatio: '1', background: '#f2f0ec', borderRadius: '2px', marginBottom: '0.75rem', position: 'relative', overflow: 'hidden' }}>
                {img ? (
                  <img src={img} alt={p.title} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                ) : (
                  <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>No image</span>
                )}
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#0d0d0d', color: '#fff', fontSize: '10.5px', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '2px' }}>{commPct}% commission</div>
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '11px', fontWeight: 500, color: '#888', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{displayName}</div>
              <div className="pc-title" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', marginBottom: '0.3rem', lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Earn up to <strong style={{ color: '#0d0d0d' }}>${earn}</strong> per sale</div>
            </Link>
          )
        })}
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '2.5rem', height: '100%', background: 'linear-gradient(to right, #ffffff, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '5rem', height: '100%', background: 'linear-gradient(to left, #ffffff, transparent)', pointerEvents: 'none' }} />
    </div>
  )
}