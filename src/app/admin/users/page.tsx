// src/app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'vendor' | 'affiliate' | 'admin'>('all')

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

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, stripe_onboarded, created_at, updated_at')
        .order('created_at', { ascending: false })
      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function changeRole(id: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div></div>

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter)
  const roleColor: Record<string, string> = { vendor: '#2563eb', affiliate: '#7c3aed', admin: '#dc2626' }

  const AdminNav = () => (
    <nav style={{ background: '#0d0d0d', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky' as const, top: 0, zIndex: 50 }}>
      <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#ffffff' }}>U G C A</Link>
      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888', marginLeft: '1rem', background: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '3px' }}>Admin</span>
      <div style={{ marginLeft: '2rem', display: 'flex', gap: '0.25rem' }}>
        {[{ label: 'Overview', href: '/admin' }, { label: 'Users', href: '/admin/users', active: true }, { label: 'Products', href: '/admin/products' }, { label: 'Conversions', href: '/admin/conversions' }, { label: 'Rules', href: '/admin/rules' }].map(n => (
          <Link key={n.label} href={n.href} style={{ fontSize: '13px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', textDecoration: 'none', background: n.active ? 'rgba(255,255,255,0.1)' : 'transparent', color: n.active ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>{n.label}</Link>
        ))}
      </div>
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <AdminNav />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Users</h1>
          <div style={{ fontSize: '13px', color: '#888' }}>{users.length} total users</div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {(['all', 'vendor', 'affiliate', 'admin'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize' as const }}>
              {f} ({f === 'all' ? users.length : users.filter(u => u.role === f).length})
            </button>
          ))}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e8e6e2', background: '#f9f8f6' }}>
            {['Name', 'Role', 'Subscription', 'Joined', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' }}>{h}</div>
            ))}
          </div>
          {filtered.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e2', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{u.full_name?.charAt(0)?.toUpperCase() ?? '?'}</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.full_name ?? 'Unknown'}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: roleColor[u.role] ?? '#888', background: `${roleColor[u.role]}15`, padding: '0.2rem 0.6rem', borderRadius: '100px', textTransform: 'capitalize' as const, display: 'inline-block' }}>{u.role}</span>
              <div style={{ fontSize: '12px', color: u.stripe_onboarded ? '#16a34a' : '#888' }}>{u.role === 'vendor' ? (u.stripe_onboarded ? '● Active' : '○ Trial/None') : '—'}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {u.role !== 'admin' && <button onClick={() => changeRole(u.id, 'admin')} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Make admin</button>}
                {u.role !== 'vendor' && <button onClick={() => changeRole(u.id, 'vendor')} style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Make vendor</button>}
                {u.role !== 'affiliate' && <button onClick={() => changeRole(u.id, 'affiliate')} style={{ fontSize: '11px', color: '#7c3aed', background: 'none', border: '1px solid #ddd6fe', padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Make affiliate</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}