'use client'

import Link from 'next/link'
import { useState } from 'react'

const CATEGORIES = ['Featured','New','Digital Products','SaaS & Tools','Courses','Beauty & Wellness','Fashion','Home & Living','Fitness','Finance']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .nav-top { display: flex; align-items: center; gap: 1.5rem; height: 64px; padding: 0 2.5rem; background: #faf9f7; }
        .nav-search { flex: 1; max-width: 480px; display: flex; align-items: center; gap: 0.6rem; border: 1px solid #e0dbd4; padding: 0.5rem 1rem; background: #f5f2ed; }
        .nav-search input { background: none; border: none; outline: none; font-size: 13px; color: #888; font-family: var(--font-dm-sans), sans-serif; width: 100%; }
        .nav-actions { display: flex; align-items: center; gap: 1.5rem; margin-left: auto; white-space: nowrap; }
        .cat-nav { border-bottom: 1px solid #e8e4de; padding: 0 2.5rem; display: flex; overflow-x: auto; scrollbar-width: none; background: #faf9f7; }
        .cat-nav::-webkit-scrollbar { display: none; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0.25rem; margin-left: auto; }
        .mobile-menu { display: none; }

        @media (max-width: 768px) {
          .nav-top { padding: 0 1rem; gap: 0.75rem; height: 56px; }
          .nav-search { display: none; }
          .nav-actions { display: none; }
          .hamburger { display: flex; flex-direction: column; justify-content: center; gap: 5px; }
          .cat-nav { display: none; }
          .mobile-menu {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #faf9f7;
            border-bottom: 1px solid #e8e4de;
            z-index: 100;
            padding: 1rem 0;
          }
          .mobile-menu-link {
            display: block;
            padding: 0.75rem 1.25rem;
            font-size: 14px;
            font-weight: 500;
            color: #1a1a1a;
            text-decoration: none;
            border-bottom: 1px solid #f0ece5;
            font-family: var(--font-dm-sans), sans-serif;
          }
          .mobile-menu-link:last-child { border-bottom: none; }
          .mobile-menu-section-label {
            padding: 0.6rem 1.25rem 0.3rem;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #b5a99a;
            font-family: var(--font-dm-sans), sans-serif;
          }
          .mobile-menu-cta {
            display: block;
            margin: 0.75rem 1.25rem 0;
            background: #1a1a1a;
            color: #faf9f7;
            font-size: 12px;
            font-weight: 600;
            padding: 0.7rem 1.25rem;
            text-decoration: none;
            text-align: center;
            letter-spacing: 0.06em;
            font-family: var(--font-dm-sans), sans-serif;
          }
        }
      `}</style>

      <nav style={{ background: '#faf9f7', borderBottom: '1px solid #e8e4de', position: 'relative' }}>
        <div className="nav-top">
          {/* Logo */}
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', textDecoration: 'none', color: '#1a1a1a', flexShrink: 0 }}>
            U G C A
          </Link>

          {/* Desktop search */}
          <div className="nav-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b5a99a" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search products or vendors" readOnly />
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            <Link href="/vendor-signup" style={{ fontSize: '12px', fontWeight: 500, color: '#888', textDecoration: 'none', letterSpacing: '0.04em' }}>Sign up to sell</Link>
            <Link href="/login" style={{ fontSize: '12px', fontWeight: 500, color: '#888', textDecoration: 'none', letterSpacing: '0.04em' }}>Sign in</Link>
            <Link href="/signup" style={{ background: '#1a1a1a', color: '#faf9f7', fontSize: '11px', fontWeight: 600, padding: '0.55rem 1.4rem', textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>Get invited</Link>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="mobile-menu">
            <div className="mobile-menu-section-label">Account</div>
            <Link href="/login" className="mobile-menu-link" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/vendor-signup" className="mobile-menu-link" onClick={() => setOpen(false)}>Sign up to sell</Link>
            <Link href="/signup" className="mobile-menu-cta" onClick={() => setOpen(false)}>Get invited</Link>
            <div className="mobile-menu-section-label" style={{ marginTop: '0.75rem' }}>Browse</div>
            {CATEGORIES.map(cat => (
              <Link key={cat} href={`/marketplace?category=${encodeURIComponent(cat)}`} className="mobile-menu-link" onClick={() => setOpen(false)}>
                {cat}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Desktop category nav */}
      <div className="cat-nav">
        {CATEGORIES.map((cat, i) => (
          <Link key={cat} href={`/marketplace?category=${encodeURIComponent(cat)}`}
            style={{ fontSize: '12px', fontWeight: 500, color: i === 0 ? '#1a1a1a' : '#888', textDecoration: 'none', padding: '0.8rem 1rem', whiteSpace: 'nowrap', borderBottom: i === 0 ? '1.5px solid #1a1a1a' : '1.5px solid transparent', flexShrink: 0, letterSpacing: '0.04em' }}>
            {cat}
          </Link>
        ))}
      </div>
    </>
  )
}