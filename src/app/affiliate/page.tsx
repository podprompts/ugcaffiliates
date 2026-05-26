// src/app/affiliate/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import AffiliateNav from '@/components/AffiliateNav'

export const dynamic = 'force-dynamic'

function InviteCodes({ userId }: { userId: string }) {
  const [codes, setCodes] = useState<any[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!userId) return
    supabase
      .from('invite_codes')
      .select('id, code, used, used_at, profiles!used_by(full_name)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCodes(data ?? []))
  }, [userId])

  if (codes.length === 0) return null

  const available = codes.filter(c => !c.used)

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Your invite codes</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '0.15rem' }}>{available.length} of {codes.length} remaining</div>
        </div>
        <div style={{ fontSize: '11px', color: '#888', background: '#f9f8f6', border: '1px solid #e8e6e2', padding: '0.3rem 0.75rem', borderRadius: '100px' }}>
          {available.length} left
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {codes.map(c => {
          const usedBy = (c.profiles as any)?.full_name
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: c.used ? '#f9f8f6' : '#ffffff', border: '1px solid #e8e6e2', borderRadius: '3px' }}>
              <code style={{ flex: 1, fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em', color: c.used ? '#aaa' : '#0d0d0d', textDecoration: c.used ? 'line-through' : 'none' }}>{c.code}</code>
              {c.used ? (
                <span style={{ fontSize: '11px', color: '#888' }}>Used{usedBy ? ` by ${usedBy}` : ''}</span>
              ) : (
                <button onClick={() => copyCode(c.code)}
                  style={{ fontSize: '11.5px', fontWeight: 600, color: copied === c.code ? '#16a34a' : '#0d0d0d', background: '#f2f0ec', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {copied === c.code ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: '12px', color: '#888', marginTop: '1rem', lineHeight: 1.6 }}>
        Share these codes with creators or brands you want to invite to UGCA. Each code can only be used once.
      </p>
    </div>
  )
}

export default function AffiliateDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [conversions, setConversions] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState({ clicks: 0, conversions: 0, earned: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

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
      if (!res.ok) { router.push('/login'); return }
      const { profile: prof } = await res.json()
      if (!prof || prof.role !== 'affiliate') { router.push('/login?redirected=1'); return }
      setProfile(prof)

      const [{ data: linksData }, { data: convsData }, { data: appsData }] = await Promise.all([
        supabase.from('affiliate_links').select('id, tracking_code, short_url, total_clicks, total_conversions, total_earned, products(title, commission_rate, price, profiles!vendor_id(full_name))').eq('affiliate_id', session.user.id).order('total_earned', { ascending: false }).limit(5),
        supabase.from('conversions').select('id, sale_amount, commission_amount, status, converted_at, products(title)').eq('affiliate_id', session.user.id).order('converted_at', { ascending: false }).limit(6),
        supabase.from('affiliate_applications').select('id, status, applied_at, products(title, commission_rate, price)').eq('affiliate_id', session.user.id).order('applied_at', { ascending: false }).limit(5),
      ])

      setLinks(linksData ?? [])
      setConversions(convsData ?? [])
      setApplications(appsData ?? [])

      const allLinks = linksData ?? []
      const allConvs = convsData ?? []
      setStats({
        clicks: allLinks.reduce((s, l) => s + (l.total_clicks ?? 0), 0),
        conversions: allConvs.length,
        earned: allConvs.reduce((s, c) => s + c.commission_amount, 0),
        pending: allConvs.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0),
      })

      setLoading(false)
    }
    load()
  }, [])

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const profileInitial = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .a-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }
        .a-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e8e6e2; margin-bottom: 2rem; }
        .a-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .a-link-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 0; border-bottom: 1px solid #f2f0ec; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .a-content { padding: 1.25rem 1rem; }
          .a-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .a-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <AffiliateNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="a-content">
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.3rem' }}>Affiliate Dashboard</div>
            <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Affiliate'}</h1>
          </div>
          <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 500, color: '#0d0d0d', border: '1px solid #d0cdc8', padding: '0.5rem 1.25rem', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Browse marketplace →</Link>
        </div>

        {/* Stats */}
        <div className="a-stat-grid">
          {[
            { label: 'Total Clicks',  value: stats.clicks.toLocaleString() },
            { label: 'Conversions',   value: stats.conversions },
            { label: 'Total Earned',  value: `$${stats.earned.toFixed(2)}` },
            { label: 'Pending',       value: `$${stats.pending.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.75rem', fontWeight: 600, color: '#0d0d0d' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="a-two-col">
          {/* My Links */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>My links</div>
              <Link href="/affiliate/links" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {links.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>
                No links yet.<br />
                <Link href="/marketplace" style={{ color: '#0d0d0d', fontWeight: 600 }}>Browse marketplace →</Link>
              </div>
            ) : links.map(link => {
              const product = link.products as any
              const url = link.short_url ?? `https://ugcaffiliates.com/go/${link.tracking_code}`
              return (
                <div key={link.id} className="a-link-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                    <code style={{ fontSize: '11.5px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{url}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#888', textAlign: 'right' }}>
                      <div>{link.total_clicks ?? 0} clicks</div>
                      <div style={{ color: '#0d0d0d', fontWeight: 600 }}>${(link.total_earned ?? 0).toFixed(2)}</div>
                    </div>
                    <button onClick={() => copyLink(url, link.id)} style={{ fontSize: '11.5px', fontWeight: 600, color: copied === link.id ? '#16a34a' : '#0d0d0d', background: '#f2f0ec', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      {copied === link.id ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent earnings */}
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Recent earnings</div>
              <Link href="/affiliate/earnings" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            {conversions.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.1rem', marginBottom: '0.3rem' }}>No earnings yet</div>
                Share your affiliate links to start earning.
              </div>
            ) : conversions.map(c => {
              const product = c.products as any
              const statusColor: Record<string, string> = { pending: '#888', approved: '#2563eb', paid: '#16a34a' }
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f2f0ec', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{new Date(c.converted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>${c.commission_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: statusColor[c.status] ?? '#888', fontWeight: 500, textTransform: 'capitalize' }}>{c.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Applications */}
        {applications.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>My applications</div>
              <Link href="/affiliate/products" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>View all</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '400px' }}>
                {applications.map(a => {
                  const product = a.products as any
                  const statusColor: Record<string, string> = { pending: '#b45309', approved: '#16a34a', rejected: '#dc2626' }
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f2f0ec', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.title ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{product ? `${(product.commission_rate * 100).toFixed(0)}% commission · $${product.price}` : ''}</div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: statusColor[a.status] ?? '#888', textTransform: 'capitalize', flexShrink: 0 }}>{a.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Invite codes */}
        <InviteCodes userId={profile?.id} />

        {/* Empty state */}
        {links.length === 0 && applications.length === 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888', marginBottom: '0.75rem' }}>Ready to start earning?</div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem', maxWidth: '40ch', margin: '0 auto 1.5rem' }}>Browse the marketplace, apply to promote products, and get your unique tracked links.</p>
            <Link href="/marketplace" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', padding: '0.7rem 1.5rem', borderRadius: '3px', textDecoration: 'none' }}>Browse marketplace</Link>
          </div>
        )}
      </div>
    </div>
  )
}