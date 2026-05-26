// src/app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [recentConversions, setRecentConversions] = useState<any[]>([])
  const [platformRules, setPlatformRules] = useState<any[]>([])
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [ruleValues, setRuleValues] = useState<Record<string, string>>({})
  const [inviteCodes, setInviteCodes] = useState<any[]>([])
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function loadInviteCodes(token: string) {
    const res = await fetch('/api/admin/invite-codes', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setInviteCodes(data.codes ?? [])
  }

  async function generateInviteCodes() {
    setGeneratingCodes(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ count: generateCount }),
    })
    const data = await res.json()
    if (data.ok) {
      setInviteCodes(prev => [...data.codes.map((code: string) => ({ code, used: false })), ...prev])
    }
    setGeneratingCodes(false)
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (!res.ok) { router.push('/login'); return }
      const { profile } = await res.json()
      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      const [
        { count: totalVendors },
        { count: totalAffiliates },
        { count: totalProducts },
        { count: totalConversions },
        { data: users },
        { data: products },
        { data: conversions },
        { data: rules },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('conversions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, role, stripe_onboarded, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('products').select('id, title, status, commission_rate, price, total_conversions, profiles!vendor_id(full_name)').order('created_at', { ascending: false }).limit(8),
        supabase.from('conversions').select('id, sale_amount, commission_amount, platform_fee, status, converted_at, products(title), profiles!affiliate_id(full_name)').order('converted_at', { ascending: false }).limit(8),
        supabase.from('platform_rules').select('*').order('rule_key'),
      ])

      const { data: convData } = await supabase.from('conversions').select('sale_amount, platform_fee')
      const totalRevenue = convData?.reduce((s, c) => s + c.sale_amount, 0) ?? 0
      const totalFees = convData?.reduce((s, c) => s + (c.platform_fee ?? 0), 0) ?? 0

      setStats({ totalVendors, totalAffiliates, totalProducts, totalConversions, totalRevenue, totalFees })
      setRecentUsers(users ?? [])
      setRecentProducts(products ?? [])
      setRecentConversions(conversions ?? [])
      setPlatformRules(rules ?? [])

      const vals: Record<string, string> = {}
      rules?.forEach(r => { vals[r.rule_key] = r.value })
      setRuleValues(vals)

      await loadInviteCodes(session.access_token)

      setLoading(false)
    }
    load()
  }, [])

  async function saveRule(key: string) {
    await supabase
      .from('platform_rules')
      .update({ value: ruleValues[key], updated_at: new Date().toISOString() })
      .eq('rule_key', key)
    setEditingRule(null)
  }

  async function toggleProductStatus(id: string, current: string) {
    const next = current === 'active' ? 'paused' : 'active'
    await supabase.from('products').update({ status: next }).eq('id', id)
    setRecentProducts(prev => prev.map(p => p.id === id ? { ...p, status: next } : p))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const statusColor: Record<string, string> = { active: '#16a34a', paused: '#888', draft: '#b45309', rejected: '#dc2626' }
  const roleColor: Record<string, string> = { vendor: '#2563eb', affiliate: '#7c3aed', admin: '#dc2626' }

  const sectionHead = (title: string) => (
    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e6e2' }}>{title}</div>
  )

  const availableCodes = inviteCodes.filter(c => !c.used)
  const usedCodes = inviteCodes.filter(c => c.used)

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .admin-content { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        .admin-stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .admin-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .admin-prod-table { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr; }
        .admin-prod-row   { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr; padding: 0.75rem 0; border-top: 1px solid #f2f0ec; align-items: center; }
        .admin-rule-row { padding: 0.85rem 1rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .invite-code-row { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0.85rem; border: 1px solid #e8e6e2; border-radius: 3px; }
        @media (max-width: 768px) {
          .admin-content { padding: 1.25rem 1rem; }
          .admin-stat-grid { grid-template-columns: repeat(3, 1fr); }
          .admin-two-col { grid-template-columns: 1fr; }
          .admin-prod-table { grid-template-columns: 1fr auto; }
          .admin-prod-table > div:nth-child(2),
          .admin-prod-table > div:nth-child(3),
          .admin-prod-table > div:nth-child(4) { display: none; }
          .admin-prod-row { grid-template-columns: 1fr auto; }
          .admin-prod-row > div:nth-child(2),
          .admin-prod-row > div:nth-child(3),
          .admin-prod-row > div:nth-child(4) { display: none; }
          .admin-rule-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        }
        @media (max-width: 480px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <AdminNav onSignOut={handleSignOut} />

      <div className="admin-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Platform overview</h1>
        </div>

        {/* Stats */}
        <div className="admin-stat-grid">
          {[
            { label: 'Vendors',       value: stats.totalVendors ?? 0 },
            { label: 'Affiliates',    value: stats.totalAffiliates ?? 0 },
            { label: 'Products',      value: stats.totalProducts ?? 0 },
            { label: 'Conversions',   value: stats.totalConversions ?? 0 },
            { label: 'GMV',           value: `$${(stats.totalRevenue ?? 0).toFixed(2)}` },
            { label: 'Platform fees', value: `$${(stats.totalFees ?? 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="admin-two-col">
          {/* Recent users */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem' }}>
            {sectionHead('Recent users')}
            {recentUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #f2f0ec' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                  {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name ?? 'Unknown'}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: roleColor[u.role] ?? '#888', background: `${roleColor[u.role] ?? '#888'}15`, padding: '0.15rem 0.5rem', borderRadius: '100px', textTransform: 'capitalize', flexShrink: 0 }}>
                  {u.role}
                </span>
                {u.role === 'vendor' && (
                  <span style={{ fontSize: '10px', color: u.stripe_onboarded ? '#16a34a' : '#888', flexShrink: 0 }}>
                    {u.stripe_onboarded ? '● Paid' : '○ Trial'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Recent conversions */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem' }}>
            {sectionHead('Recent conversions')}
            {recentConversions.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>No conversions yet</div>
            ) : recentConversions.map(c => {
              const product = c.products as any
              const affiliate = c.profiles as any
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #f2f0ec' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{affiliate?.full_name ?? '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>${c.sale_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: statusColor[c.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' }}>{c.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent products */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {sectionHead('Recent products')}
          <div style={{ minWidth: '480px' }}>
            <div className="admin-prod-table" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #f2f0ec' }}>
              {['Product', 'Vendor', 'Commission', 'Sales', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
              ))}
            </div>
            {recentProducts.map(p => {
              const vendor = p.profiles as any
              return (
                <div key={p.id} className="admin-prod-row">
                  <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>{p.title}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{vendor?.full_name ?? '—'}</div>
                  <div style={{ fontSize: '13px' }}>{(p.commission_rate * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>{p.total_conversions ?? 0}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor[p.status] ?? '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: statusColor[p.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' }}>{p.status}</span>
                    <button onClick={() => toggleProductStatus(p.id, p.status)} style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                      {p.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform rules */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.5rem' }}>
          {sectionHead('Platform rules')}
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Edit these values to change platform behavior instantly — no code deploy needed.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e8e6e2' }}>
            {platformRules.map(rule => (
              <div key={rule.rule_key} className="admin-rule-row" style={{ background: '#ffffff' }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0d0d0d', fontFamily: 'monospace' }}>{rule.rule_key}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '0.15rem' }}>{rule.description}</div>
                </div>
                {editingRule === rule.rule_key ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      value={ruleValues[rule.rule_key] ?? ''}
                      onChange={e => setRuleValues(prev => ({ ...prev, [rule.rule_key]: e.target.value }))}
                      style={{ width: '120px', padding: '0.35rem 0.6rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                    <button onClick={() => saveRule(rule.rule_key)} style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    <button onClick={() => setEditingRule(null)} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#0d0d0d' }}>{rule.value || '—'}</span>
                    <button onClick={() => setEditingRule(rule.rule_key)} style={{ fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite codes */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem' }}>
          {sectionHead('Invite codes')}
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>Generate codes to distribute. Each code can be used once. New members automatically receive 5 codes of their own to share.</p>

          {/* Generate controls */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="number" min={1} max={50} value={generateCount}
              onChange={e => setGenerateCount(Number(e.target.value))}
              style={{ width: '72px', padding: '0.4rem 0.6rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }}
            />
            <button onClick={generateInviteCodes} disabled={generatingCodes}
              style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: generatingCodes ? '#888' : '#0d0d0d', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '3px', cursor: generatingCodes ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {generatingCodes ? 'Generating...' : 'Generate codes'}
            </button>
            <span style={{ fontSize: '12px', color: '#888' }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{availableCodes.length} unused</span>
              {' · '}
              {usedCodes.length} used
              {' · '}
              {inviteCodes.length} total
            </span>
          </div>

          {/* Code list */}
          {inviteCodes.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0', background: '#f9f8f6', borderRadius: '4px', border: '1px solid #e8e6e2' }}>
              No codes generated yet. Use the controls above to create your first batch.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '480px', overflowY: 'auto' }}>
              {inviteCodes.map((c, i) => (
                <div key={i} className="invite-code-row" style={{ background: c.used ? '#f9f8f6' : '#ffffff' }}>
                  <code style={{ flex: 1, fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', color: c.used ? '#aaa' : '#0d0d0d', textDecoration: c.used ? 'line-through' : 'none' }}>
                    {c.code}
                  </code>
                  <span style={{ fontSize: '11px', color: c.used ? '#888' : '#16a34a', fontWeight: 500, flexShrink: 0 }}>
                    {c.used
                      ? `Used${c.profiles?.full_name ? ` · ${c.profiles.full_name}` : c.used_at ? ` · ${new Date(c.used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                      : 'Available'}
                  </span>
                  {!c.used && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code)
                        setCopiedCode(c.code)
                        setTimeout(() => setCopiedCode(null), 2000)
                      }}
                      style={{ fontSize: '11px', fontWeight: 600, color: copiedCode === c.code ? '#16a34a' : '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', flexShrink: 0 }}>
                      {copiedCode === c.code ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}