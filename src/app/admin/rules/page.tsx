// src/app/admin/rules/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

// Human-friendly labels and descriptions for each rule key
const RULE_META: Record<string, { label: string; description: string; hint: string; format: string }> = {
  cron_secret: {
    label: 'Cron Job Secret',
    description: 'The secret key used to authenticate automated daily payout runs from cron-job.org.',
    hint: 'Keep this private. Used in the cron-job.org request header.',
    format: 'Text string',
  },
  default_cookie_days: {
    label: 'Default Cookie Window (Days)',
    description: 'How many days after clicking an affiliate link a sale can still be credited to that affiliate. Vendors can set their own window up to the maximum.',
    hint: 'Standard industry range is 7–90 days. Default is 30.',
    format: 'Number of days (e.g. 30)',
  },
  max_commission_rate: {
    label: 'Maximum Commission Rate',
    description: 'The highest commission percentage a vendor is allowed to offer affiliates. Expressed as a decimal (0.70 = 70%).',
    hint: 'Setting this too high could reduce vendor profitability. 70% is standard for digital products.',
    format: 'Decimal (e.g. 0.70 for 70%)',
  },
  max_cookie_days: {
    label: 'Maximum Cookie Window (Days)',
    description: 'The longest cookie window any vendor can set for their affiliate program.',
    hint: 'Longer windows benefit affiliates but may complicate attribution. 90 days is standard.',
    format: 'Number of days (e.g. 90)',
  },
  min_commission_rate: {
    label: 'Minimum Commission Rate',
    description: 'The lowest commission percentage a vendor is allowed to offer. Expressed as a decimal (0.05 = 5%).',
    hint: 'Setting a floor ensures affiliates always earn a meaningful amount. 5% is standard.',
    format: 'Decimal (e.g. 0.05 for 5%)',
  },
  min_payout_amount: {
    label: 'Minimum Payout Amount ($)',
    description: 'The minimum commission amount required before a payout can be triggered. Set to 0 for no minimum.',
    hint: 'A minimum threshold (e.g. $10) reduces small transaction fees. Set to 0 to allow any amount.',
    format: 'Dollar amount (e.g. 10.00 or 0 for no minimum)',
  },
  payout_hold_days: {
    label: 'Payout Hold Period (Days)',
    description: 'How many days a conversion stays in "pending" status before it becomes eligible for payout. This gives vendors time to verify sales and catch refunds.',
    hint: 'Standard is 7–14 days. Match this to your average refund window.',
    format: 'Number of days (e.g. 7)',
  },
  platform_fee_rate: {
    label: 'Platform Fee Rate',
    description: 'The percentage UGCA takes from each confirmed sale as a platform fee. Automatically charged to the vendor\'s card when they approve a conversion.',
    hint: 'Currently set to 10%. This is charged on top of the affiliate commission.',
    format: 'Decimal (e.g. 0.10 for 10%)',
  },
  postback_secret: {
    label: 'Global Postback Secret (Legacy)',
    description: 'A shared fallback secret for server-side postback validation. New vendors use per-vendor secrets from their profiles. This is kept for backwards compatibility only.',
    hint: 'Do not share this publicly. Each vendor should use their own unique secret from their Integration page.',
    format: 'Text string',
  },
}

export default function AdminRulesPage() {
  const router = useRouter()
  const [rules, setRules]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues]   = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)

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
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase.from('platform_rules').select('*').order('rule_key')
      setRules(data ?? [])
      const vals: Record<string, string> = {}
      data?.forEach((r: any) => { vals[r.rule_key] = r.value })
      setValues(vals)
      setLoading(false)
    }
    load()
  }, [])

  async function saveRule(key: string) {
    setSaving(key)
    await supabase.from('platform_rules')
      .update({ value: values[key], updated_at: new Date().toISOString() })
      .eq('rule_key', key)
    setRules(prev => prev.map(r => r.rule_key === key ? { ...r, value: values[key] } : r))
    setSaving(null)
    setEditing(null)
    setToast(`"${RULE_META[key]?.label ?? key}" updated successfully.`)
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .ar-content { max-width: 860px; margin: 0 auto; padding: 2.5rem 2rem; }
        .ar-rule-card { background: #ffffff; border: 1px solid #e8e6e2; border-radius: 4px; padding: 1.5rem; margin-bottom: 1rem; }
        .ar-rule-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .ar-rule-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
        @media (max-width: 768px) {
          .ar-content { padding: 1.25rem 1rem; }
          .ar-rule-header { flex-direction: column; }
          .ar-rule-actions { width: 100%; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#0d0d0d', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 6, fontSize: '13px', zIndex: 9999 }}>
          ✓ {toast}
        </div>
      )}

      <AdminNav onSignOut={handleSignOut} />

      <div className="ar-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, marginBottom: '0.5rem' }}>Platform rules</h1>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
            These settings control how the platform behaves — commission limits, payout timing, and fees. Changes take effect immediately with no code deploy needed.
          </p>
        </div>

        {/* Warning banner */}
        <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '13px', color: '#92400e' }}>
          ⚠️ Changes here affect all vendors and affiliates immediately. Double-check values before saving.
        </div>

        {rules.map(rule => {
          const meta = RULE_META[rule.rule_key]
          const isEditing = editing === rule.rule_key
          const isSaving = saving === rule.rule_key

          // Mask secrets
          const isSensitive = rule.rule_key.includes('secret')
          const displayValue = isSensitive
            ? (rule.value ? '••••••••••••••••' : '—')
            : (rule.value || '—')

          return (
            <div key={rule.rule_key} className="ar-rule-card">
              <div className="ar-rule-header">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d0d0d', marginBottom: '0.2rem' }}>
                    {meta?.label ?? rule.rule_key}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa', marginBottom: '0.5rem' }}>
                    {rule.rule_key}
                  </div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '0.4rem' }}>
                    {meta?.description ?? rule.description}
                  </div>
                  {meta?.hint && (
                    <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                      💡 {meta.hint}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '0.5rem' }}>
                    Format: {meta?.format ?? 'Text'} · Last updated: {new Date(rule.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {isEditing ? (
                  <div className="ar-rule-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <input
                      value={values[rule.rule_key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [rule.rule_key]: e.target.value }))}
                      style={{ width: '200px', padding: '0.5rem 0.75rem', border: '1px solid #0d0d0d', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
                      autoFocus
                      placeholder={meta?.format}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveRule(rule.rule_key)} disabled={isSaving}
                        style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.45rem 1rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(null)}
                        style={{ fontSize: '12px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.45rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ar-rule-actions">
                    <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#0d0d0d', background: '#f9f8f6', padding: '0.3rem 0.75rem', borderRadius: '3px', border: '1px solid #e8e6e2' }}>
                      {displayValue}
                    </span>
                    <button onClick={() => setEditing(rule.rule_key)}
                      style={{ fontSize: '12px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #e8e6e2', background: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}