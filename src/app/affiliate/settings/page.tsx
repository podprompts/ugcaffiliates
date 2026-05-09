// src/app/affiliate/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function AffiliateSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saved, setSaved] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile: prof } = await res.json()
      if (!prof || prof.role !== 'affiliate') { router.push('/login'); return }
      setProfile(prof)
      setFullName(prof.full_name ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', session.user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  const inputStyle = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none' }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }
  const sectionStyle = { background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '60px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[{ label: 'Dashboard', href: '/affiliate' }, { label: 'My Links', href: '/affiliate/links' }, { label: 'Products', href: '/affiliate/products' }, { label: 'Earnings', href: '/affiliate/earnings' }, { label: 'Settings', href: '/affiliate/settings', active: true }].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? '#f2f0ec' : 'transparent', color: n.active ? '#0d0d0d' : '#888' }}>{n.label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Affiliate</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Settings</h1>
        </div>
        <form onSubmit={saveProfile}>
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>Profile</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input style={{ ...inputStyle, background: '#f9f8f6' }} type="text" value="Affiliate" readOnly />
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: '1.25rem', fontSize: '13px', fontWeight: 600, color: '#ffffff', background: saved ? '#16a34a' : saving ? '#888' : '#0d0d0d', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>How you get paid</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.7, marginBottom: '0.75rem' }}>Vendors pay affiliates directly via PayPal, Venmo, bank transfer, or any method you agree on. Share your preferred payment method with vendors when they confirm your sales.</p>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.65 }}>When a vendor marks a conversion as paid in their dashboard, your earnings status updates automatically in your <Link href="/affiliate/earnings" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>Earnings page</Link>.</p>
        </div>
        <div style={{ ...sectionStyle, borderColor: '#fecaca' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #fecaca' }}>Account</div>
          <button onClick={handleSignOut} style={{ fontSize: '13px', fontWeight: 500, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.6rem 1.25rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>
    </div>
  )
}