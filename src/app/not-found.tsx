// src/app/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', display: 'flex', flexDirection: 'column' as const, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ textAlign: 'center' as const, maxWidth: '400px' }}>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '6rem', fontWeight: 400, color: '#e8e6e2', lineHeight: 1, marginBottom: '1rem' }}>404</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 500, marginBottom: '0.75rem' }}>Page not found</h1>
          <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, marginBottom: '2rem' }}>The page you're looking for doesn't exist or has been moved.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="/" style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.75rem', borderRadius: '3px', textDecoration: 'none' }}>Go home</Link>
            <Link href="/marketplace" style={{ fontSize: '13.5px', fontWeight: 500, color: '#0d0d0d', background: '#ffffff', border: '1px solid #e8e6e2', padding: '0.7rem 1.75rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
          </div>
        </div>
      </div>
    </div>
  )
}