'use client'

// src/components/AdminNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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
  const pathname    = usePathname()
  const [open, setOpen]           = useState(false)
  const [switching, setSwitching] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── Preview role without touching the database ───────────────────────────
  function previewAs(role: 'vendor' | 'affiliate') {
    setSwitching(true)
    setOpen(false)
    localStorage.setItem('ugca_admin_preview', '1')
    // Route to the correct dashboard for each role
    window.location.href = role === 'vendor' ? '/vendor/conversions' : '/affiliate'
  }

  return (
    <>
      <style>{`
        .admin-nav-links     { margin-left: 2rem; display: flex; gap: 0.25rem; }
        .admin-hamburger     { display: none; background: none; border: none; cursor: pointer; padding: 0.25rem; }
        .admin-sign-out-btn  { font-size: 12px; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .admin-switch-btn    { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; padding: 0.25rem 0.65rem; border-radius: 3px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.15s; }
        .admin-switch-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .admin-mobile-link   { display: block; padding: 0.85rem 1.25rem; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .admin-mobile-link.active { color: #ffffff; background: rgba(255,255,255,0.08); }
        .admin-mobile-switch { display: block; width: 100%; text-align: left; padding: 0.85rem 1.25rem; font-size: 13px; font-weight: 500; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-family: inherit; }
        @media (max-width: 768px) {
          .admin-nav-links    { display: none; }
          .admin-desktop-only { display: none !important; }
          .admin-hamburger    { display: flex; margin-left: auto; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <nav style={{ background: '#0d0d0d', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', gap: '0.75rem', position: 'relative' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', color: '#ffffff', flexShrink: 0 }}>U G C A</Link>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', background: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '3px', flexShrink: 0 }}>Admin</span>

          {/* Desktop nav links */}
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

          {/* Desktop: preview buttons + sign out */}
          <div className="admin-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginRight: '0.25rem' }}>Preview as:</span>
            <button className="admin-switch-btn" onClick={() => previewAs('vendor')} disabled={switching}>
              {switching ? '...' : 'Vendor'}
            </button>
            <button className="admin-switch-btn" onClick={() => previewAs('affiliate')} disabled={switching}>
              {switching ? '...' : 'Affiliate'}
            </button>
            <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />
            <button className="admin-sign-out-btn" onClick={onSignOut}>Sign out</button>
          </div>

          {/* Hamburger */}
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
              <div style={{ padding: '0.75rem 1.25rem 0.3rem', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.25rem' }}>
                Preview as
              </div>
              <button className="admin-mobile-switch" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => previewAs('vendor')} disabled={switching}>
                {switching ? 'Switching...' : 'View as Vendor'}
              </button>
              <button className="admin-mobile-switch" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => previewAs('affiliate')} disabled={switching}>
                {switching ? 'Switching...' : 'View as Affiliate'}
              </button>
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