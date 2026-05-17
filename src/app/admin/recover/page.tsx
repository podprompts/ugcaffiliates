'use client'

// src/app/admin/recover/page.tsx
// Emergency recovery page — navigates to this URL from any role to switch back to admin.
// Add a "Return to Admin" button to VendorNav and AffiliateNav pointing here.
// URL: /admin/recover

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export default function AdminRecoverPage() {
  const router  = useRouter()
  const [status, setStatus] = useState<'checking' | 'switching' | 'denied' | 'done'>('checking')
  const [email, setEmail]   = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function recover() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const userEmail = session.user.email?.toLowerCase() ?? ''
      setEmail(userEmail)

      // Gate: only known admin emails can recover
      const isAdmin = ADMIN_EMAILS.length > 0
        ? ADMIN_EMAILS.includes(userEmail)
        : true // If no env var set, allow any logged-in user (dev mode)

      if (!isAdmin) {
        setStatus('denied')
        return
      }

      setStatus('switching')

      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', session.user.id)

      setStatus('done')
      setTimeout(() => { window.location.href = '/admin' }, 1200)
    }
    recover()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px', padding: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '2rem' }}>U G C A</div>

        {status === 'checking' && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Checking credentials...</p>
        )}

        {status === 'switching' && (
          <>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#ffffff', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Switching back to Admin...</p>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
            <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '0.5rem' }}>Back to Admin</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Redirecting to dashboard...</p>
          </>
        )}

        {status === 'denied' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✗</div>
            <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '0.5rem' }}>Access denied</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '1.5rem' }}>
              {email} is not an admin account.
            </p>
            <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Go home</a>
          </>
        )}
      </div>
    </div>
  )
}