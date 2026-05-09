// src/app/admin/rules/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function AdminRulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase.from('platform_rules').select('*').order('rule_key')
      setRules(data ?? [])
      const vals: Record<string, string> = {}
      data?.forEach(r => { vals[r.rule_key] = r.value })
      setValues(vals)
      setLoading(false)
    }
    load()
  }, [])

  async function saveRule(key: string) {
    setSaving(key)
    await supabase.from('platform_rules').update({ value: values[key], updated_at: new Date().toISOString() }).eq('rule_key', key)
    setRules(prev => prev.map(r => r.rule_key === key ? { ...r, value: values[key] } : r))
    setSaving(null)
    setEditing(null)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#0d0d0d', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#ffffff' }}>U G C A</Link>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginLeft: '1rem', background: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '3px' }}>Admin</span>
        <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
          {[{ label: 'Overview', href: '/admin' }, { label: 'Users', href: '/admin/users' }, { label: 'Products', href: '/admin/products' }, { label: 'Conversions', href: '/admin/conversions' }, { label: 'Rules', href: '/admin/rules', active: true }].map(n => (
            <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? 'rgba(255,255,255,0.1)' : 'transparent', color: n.active ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>{n.label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.5rem' }}>Platform rules</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Edit these values to change platform behavior instantly — no code deploy needed.</p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          {rules.map((rule, i) => (
            <div key={rule.rule_key} style={{ padding: '1.25rem 1.5rem', borderBottom: i < rules.length - 1 ? '1px solid #e8e6e2' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#0d0d0d', marginBottom: '0.25rem' }}>{rule.rule_key}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{rule.description}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '0.25rem' }}>Last updated: {new Date(rule.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                {editing === rule.rule_key ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <input
                      value={values[rule.rule_key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [rule.rule_key]: e.target.value }))}
                      style={{ width: '160px', padding: '0.45rem 0.75rem', border: '1px solid #0d0d0d', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
                      autoFocus
                    />
                    <button onClick={() => saveRule(rule.rule_key)} disabled={saving === rule.rule_key} style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.45rem 1rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {saving === rule.rule_key ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#0d0d0d' }}>{rule.value || '—'}</span>
                    <button onClick={() => setEditing(rule.rule_key)} style={{ fontSize: '12px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #e8e6e2', background: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}