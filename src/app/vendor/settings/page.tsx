// src/app/vendor/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

export default function VendorSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [profileInitial, setProfileInitial] = useState('V')

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    bio: '',
    website_url: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name, bio, website_url')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setForm({
          full_name: profile.full_name ?? '',
          business_name: profile.business_name ?? '',
          bio: profile.bio ?? '',
          website_url: profile.website_url ?? '',
        })
        setProfileInitial(profile.full_name?.charAt(0)?.toUpperCase() ?? 'V')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        business_name: form.business_name,
        bio: form.bio,
        website_url: form.website_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (updateError) setError(updateError.message)
    else setSaved(true)

    setSaving(false)
  }

  const input = { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', color: '#0d0d0d', background: '#ffffff', outline: 'none', boxSizing: 'border-box' as const }
  const label = { display: 'block' as const, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#3a3a3a', marginBottom: '0.4rem' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Account settings</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>}
        {saved && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '1rem', marginBottom: '1.25rem', fontSize: '13px', color: '#16a34a' }}>✓ Settings saved successfully</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1.25rem' }}>Profile information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div>
                <label style={label}>Business name</label>
                <input style={input} value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} placeholder="e.g. Glow Beauty Co." />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.35rem' }}>This is what affiliates and customers see in the marketplace instead of your personal name.</div>
              </div>

              <div>
                <label style={label}>Your name</label>
                <input style={input} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="First Last" />
              </div>

              <div>
                <label style={label}>Bio</label>
                <textarea style={{ ...input, minHeight: '80px', resize: 'vertical' }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell affiliates about your brand…" />
              </div>

              <div>
                <label style={label}>Website URL</label>
                <input style={input} type="url" value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))} placeholder="https://yourstore.com" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.75rem', borderRadius: '3px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}