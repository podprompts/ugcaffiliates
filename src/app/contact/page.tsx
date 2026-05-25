// src/app/contact/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function setField(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send message')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inp = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e8e6e2',
    borderRadius: '3px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0d0d0d',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const lbl = {
    display: 'block' as const,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#3a3a3a',
    marginBottom: '0.4rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ct-wrap { max-width: 580px; margin: 0 auto; padding: 4rem 2rem; }
        .ct-nav { background: #ffffff; border-bottom: 1px solid #e8e6e2; padding: 0 2.5rem; height: 68px; display: flex; align-items: center; justify-content: space-between; }
        @media (max-width: 600px) {
          .ct-nav { padding: 0 1rem; height: 56px; }
          .ct-wrap { padding: 2.5rem 1rem; }
        }
      `}</style>

      <nav className="ct-nav">
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: '13px', fontWeight: 600, background: '#0d0d0d', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </nav>

      <div className="ct-wrap">
        {success ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ width: '56px', height: '56px', background: '#0d0d0d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '22px', color: '#ffffff' }}>✓</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.75rem' }}>Message sent</h1>
            <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Thanks for reaching out. We'll get back to you within 24 hours.
            </p>
            <Link href="/" style={{ fontSize: '13px', color: '#888', textDecoration: 'underline' }}>Back to home</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.5rem' }}>Support</div>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.75rem' }}>Contact us</h1>
              <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.7 }}>
                Questions about your account, tracking setup, or anything else — we're here to help. Typical response time is under 24 hours.
              </p>
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Vendor setup', desc: 'Integration & tracking help', href: '/vendor/integration' },
                { label: 'Affiliate help', desc: 'Links, commissions & payouts', href: '/affiliate' },
                { label: 'Terms of service', desc: 'Platform rules & policies', href: '/terms' },
                { label: 'Privacy policy', desc: 'How we handle your data', href: '/privacy' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1rem', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.desc}</div>
                </Link>
              ))}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input style={inp} type="text" value={form.name} onChange={e => setField('name', e.target.value)} required placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input style={inp} type="email" value={form.email} onChange={e => setField('email', e.target.value)} required placeholder="jane@example.com" />
                </div>
              </div>

              <div>
                <label style={lbl}>Subject *</label>
                <select style={inp} value={form.subject} onChange={e => setField('subject', e.target.value)} required>
                  <option value="">Select a topic</option>
                  <option value="Vendor application">Vendor application</option>
                  <option value="Tracking setup">Tracking setup help</option>
                  <option value="Commission dispute">Commission dispute</option>
                  <option value="Account issue">Account issue</option>
                  <option value="Billing">Billing</option>
                  <option value="Bug report">Bug report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={lbl}>Message *</label>
                <textarea
                  style={{ ...inp, minHeight: '120px', resize: 'vertical' }}
                  value={form.message}
                  onChange={e => setField('message', e.target.value)}
                  required
                  placeholder="Tell us what's going on…"
                />
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '0.85rem', background: loading ? '#888' : '#0d0d0d', color: '#ffffff', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Sending…' : 'Send message'}
              </button>
            </form>

            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '1.5rem' }}>
              Or email us directly at{' '}
              <a href="mailto:hello@ugcaffiliates.com" style={{ color: '#0d0d0d', textDecoration: 'underline' }}>hello@ugcaffiliates.com</a>
            </p>
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>U G C A</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Marketplace', '/marketplace']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}