'use client'

import Link from 'next/link'
import { useState } from 'react'

const CATEGORIES = ['Featured','New','Digital Products','SaaS & Tools','Courses','Beauty & Wellness','Fashion','Home & Living','Fitness','Finance']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .nav-top { display: flex; align-items: center; gap: 1.5rem; height: 68px; padding: 0 2.5rem; }
        .nav-search { flex: 1; max-width: 540px; display: flex; align-items: center; gap: 0.6rem; border: 1px solid #d0cdc8; border-radius: 100px; padding: 0.5rem 1rem; }
        .nav-actions { display: flex; align-items: center; gap: 1.25rem; margin-left: auto; white-space: nowrap; }
        .cat-nav { border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; display: flex; overflow-x: auto; scrollbar-width: none; }
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
            background: #ffffff;
            border-bottom: 1px solid #e8e6e2;
            z-index: 100;
            padding: 1rem 0;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .mobile-menu-link {
            display: block;
            padding: 0.75rem 1.25rem;
            font-size: 14px;
            font-weight: 500;
            color: #0d0d0d;
            text-decoration: none;
            border-bottom: 1px solid #f2f0ec;
          }
          .mobile-menu-link:last-child { border-bottom: none; }
          .mobile-menu-section-label {
            padding: 0.6rem 1.25rem 0.3rem;
            font-size: 10.5px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #888;
          }
          .mobile-menu-cta {
            display: block;
            margin: 0.75rem 1.25rem 0;
            background: #0d0d0d;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            padding: 0.7rem 1.25rem;
            border-radius: 4px;
            text-decoration: none;
            text-align: center;
          }
        }
      `}</style>

      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', position: 'relative' }}>
        <div className="nav-top">
          {/* Logo */}
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>
            U G C A
          </Link>

          {/* Desktop search */}
          <div className="nav-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <span style={{ fontSize: '13.5px', color: '#888888' }}>Search products or vendors</span>
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            <Link href="/vendor-signup" style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3a', textDecoration: 'none' }}>Sign up to sell</Link>
            <Link href="/login" style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3a', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ background: '#0d0d0d', color: '#ffffff', fontSize: '13px', fontWeight: 600, padding: '0.55rem 1.4rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign up to promote</Link>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="mobile-menu">
            <div className="mobile-menu-section-label">Account</div>
            <Link href="/login" className="mobile-menu-link" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/vendor-signup" className="mobile-menu-link" onClick={() => setOpen(false)}>Sign up to sell</Link>
            <Link href="/signup" className="mobile-menu-cta" onClick={() => setOpen(false)}>Sign up to promote</Link>

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
            style={{ fontSize: '13.5px', fontWeight: 500, color: i === 0 ? '#0d0d0d' : '#3a3a3a', textDecoration: 'none', padding: '0.85rem 1rem', whiteSpace: 'nowrap', borderBottom: i === 0 ? '2px solid #0d0d0d' : '2px solid transparent', flexShrink: 0 }}>
            {cat}
          </Link>
        ))}
      </div>
    </>
  )
}