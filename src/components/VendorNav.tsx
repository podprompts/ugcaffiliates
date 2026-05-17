'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Dashboard',   href: '/vendor' },
  { label: 'Products',    href: '/vendor/products' },
  { label: 'Affiliates',  href: '/vendor/affiliates' },
  { label: 'Conversions', href: '/vendor/conversions' },
  { label: 'Integration', href: '/vendor/integration' },
  { label: 'Settings',    href: '/vendor/settings' },
]

interface Props {
  profileInitial: string
  onSignOut: () => void
}

export default function VendorNav({ profileInitial, onSignOut }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .v2-nav-links { margin-left: 2rem; display: flex; gap: 0.25rem; overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
        .v2-nav-links::-webkit-scrollbar { display: none; }
        .v2-nav-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
        .v2-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0.25rem; }
        .v2-mobile-link { display: block; padding: 0.85rem 1.25rem; font-size: 14px; font-weight: 500; color: #3a3a3a; text-decoration: none; border-bottom: 1px solid #f2f0ec; }
        .v2-mobile-link.active { color: #0d0d0d; background: #f9f8f6; font-weight: 600; }
        .v2-mobile-cta { display: block; margin: 0.75rem 1.25rem; background: #0d0d0d; color: #ffffff; font-size: 13px; font-weight: 600; padding: 0.7rem 1.25rem; border-radius: 4px; text-decoration: none; text-align: center; }
        @media (max-width: 768px) {
          .v2-nav-links { display: none; }
          .v2-nav-right { display: none; }
          .v2-hamburger { display: flex; margin-left: auto; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'relative' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d', flexShrink: 0 }}>U G C A</Link>

          {/* Desktop links */}
          <div className="v2-nav-links">
            {NAV_LINKS.map(n => {
              const active = pathname === n.href
              return (
                <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: active ? '#f2f0ec' : 'transparent', color: active ? '#0d0d0d' : '#888', whiteSpace: 'nowrap' }}>
                  {n.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right */}
          <div className="v2-nav-right">
            <Link href="/vendor/products/new" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.45rem 1rem', borderRadius: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}>+ List product</Link>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e8e6e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{profileInitial}</div>
            <button onClick={onSignOut} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Sign out</button>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="v2-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>

          {/* Mobile dropdown */}
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', borderBottom: '1px solid #e8e6e2', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', paddingBottom: '0.75rem' }}>
              {NAV_LINKS.map(n => {
                const active = pathname === n.href
                return (
                  <Link key={n.label} href={n.href} className={`v2-mobile-link${active ? ' active' : ''}`} onClick={() => setOpen(false)}>
                    {n.label}
                  </Link>
                )
              })}
              <Link href="/vendor/products/new" className="v2-mobile-cta" onClick={() => setOpen(false)}>+ List product</Link>
              <button onClick={() => { setOpen(false); onSignOut() }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.85rem 1.25rem', fontSize: '14px', color: '#888', background: 'none', border: 'none', borderTop: '1px solid #f2f0ec', cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.25rem' }}>
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}