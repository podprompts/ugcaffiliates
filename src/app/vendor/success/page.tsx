// src/app/vendor/success/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function VendorSuccessPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', display: 'flex', flexDirection: 'column' as const, fontFamily: 'var(--font-dm-sans), sans-serif' }}>

      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <div style={{
          textAlign: 'center' as const,
          maxWidth: '480px',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ width: '56px', height: '56px', background: '#0d0d0d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '22px' }}>
            ✓
          </div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '1rem', color: '#0d0d0d' }}>
            You're all set.
          </h1>
          <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.75, marginBottom: '0.75rem' }}>
            Your 7-day free trial has started. List your first product and start reaching thousands of motivated creators today.
          </p>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '2.5rem' }}>
            You won't be charged until your trial ends. Cancel anytime.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
            <Link href="/vendor/products/new" style={{ display: 'block', background: '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '0.85rem 2rem', borderRadius: '3px', textDecoration: 'none' }}>
              List your first product →
            </Link>
            <Link href="/vendor" style={{ display: 'block', fontSize: '13px', color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}