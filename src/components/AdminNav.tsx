'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Overview',    href: '/admin' },
  { label: 'Users',       href: '/admin/users' },
  { label: 'Products',    href: '/admin/products' },
  { label: 'Conversions', href: '/admin/conversions' },
  { label: 'Rules',       href: '/admin/rules' },
]

interface Props {
  onSignOut: () => void
}

export default function AdminNav({ onSignOut }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .admin-nav-links { margin-left: 2rem; display: flex; gap: 0.25rem; }
        .admin-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0.25rem; }
        .admin-sign-out-btn { margin-left: auto; font-size: 12px; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; font-family: inherit; }
        .admin-mobile-link { display: block; padding: 0.85rem 1.25rem; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .admin-mobile-link.active { color: #ffffff; background: rgba(255,255,255,0.08); }
        @media (max-width: 768px) {
          .admin-nav-links { display: none; }
          .admin-sign-out-btn { display: none; }
          .admin-hamburger { display: flex; margin-left: auto; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <nav style={{ background: '#0d0d0d', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', position: 'relative' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', color: '#ffffff', flexShrink: 0 }}>U G C A</Link>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginLeft: '1rem', background: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '3px', flexShrink: 0 }}>Admin</span>

          {/* Desktop links */}
          <div className="admin-nav-links">
            {NAV_LINKS.map(n => {
              const active = pathname === n.href
              return (
                <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', color: active ? '#ffffff' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                  {n.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop sign out */}
          <button className="admin-sign-out-btn" onClick={onSignOut}>Sign out</button>

          {/* Hamburger (mobile only) */}
          <button className="admin-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>

          {/* Mobile dropdown */}
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', paddingBottom: '0.5rem' }}>
              {NAV_LINKS.map(n => {
                const active = pathname === n.href
                return (
                  <Link key={n.label} href={n.href} className={`admin-mobile-link${active ? ' active' : ''}`} onClick={() => setOpen(false)}>
                    {n.label}
                  </Link>
                )
              })}
              <button onClick={() => { setOpen(false); onSignOut() }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.85rem 1.25rem', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.25rem' }}>
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}