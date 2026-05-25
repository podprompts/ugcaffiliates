// src/app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

type Filter = 'all' | 'vendor' | 'affiliate' | 'admin' | 'pending'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)

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
      const { data: { session: sess } } = await supabase.auth.getSession()
      if (!sess) { router.push('/login'); return }
      setSession(sess)

      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${sess.access_token}` } })
      const { profile } = await res.json()
      if (!profile || profile.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, vendor_status, rejection_note, reapply_count, stripe_onboarded, suspended, created_at')
        .order('created_at', { ascending: false })
      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleVendorAction(vendorId: string, action: 'approved' | 'rejected') {
    if (!session) return
    setActionLoading(vendorId)
    const note = rejectionNotes[vendorId] ?? ''

    const res = await fetch('/api/vendor/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ vendor_id: vendorId, action, note }),
    })

    const data = await res.json()
    if (data.ok) {
      setUsers(prev => prev.map(u =>
        u.id === vendorId ? { ...u, vendor_status: action } : u
      ))
      setExpandedUser(null)
    }
    setActionLoading(null)
  }

  async function changeRole(id: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  async function toggleSuspend(id: string, currentlySuspended: boolean) {
    const suspended = !currentlySuspended
    await supabase.from('profiles').update({ suspended }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, suspended } : u))
  }

  async function deleteUser(id: string) {
    await supabase.from('profiles').update({ suspended: true, role: 'suspended' }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, suspended: true, role: 'suspended' } : u))
    setExpandedUser(null)
  }

  async function pauseAllProducts(vendorId: string) {
    await supabase.from('products').update({ status: 'paused' }).eq('vendor_id', vendorId)
  }

  async function removeAllProducts(vendorId: string) {
    await supabase.from('products').update({ status: 'rejected' }).eq('vendor_id', vendorId)
  }

  async function revokeAllAffiliateLinks(affiliateId: string) {
    await supabase.from('affiliate_links').update({ is_active: false }).eq('affiliate_id', affiliateId)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const pendingVendors = users.filter(u => u.role === 'vendor' && u.vendor_status === 'pending_approval')
  const filtered = filter === 'all' ? users
    : filter === 'pending' ? pendingVendors
    : users.filter(u => u.role === filter)

  const roleColor: Record<string, string> = { vendor: '#2563eb', affiliate: '#7c3aed', admin: '#dc2626', suspended: '#888' }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .au-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }
        .au-header { margin-bottom: 2rem; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        .au-filter-bar { display: flex; gap: 0.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .au-table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #f9f8f6; }
        .au-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #e8e6e2; align-items: center; }
        .au-expand-row { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e8e6e2; background: #fafaf9; }
        @media (max-width: 768px) {
          .au-content { padding: 1.25rem 1rem; }
          .au-table-header { grid-template-columns: 1fr 1fr; padding: 0.75rem 1rem; }
          .au-table-header > div:nth-child(n+3) { display: none; }
          .au-table-row { grid-template-columns: 1fr 1fr; padding: 0.85rem 1rem; gap: 0.5rem; }
          .au-table-row > div:nth-child(3), .au-table-row > div:nth-child(4) { display: none; }
          .au-table-row > div:nth-child(5) { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 0.4rem; }
          .au-expand-row { padding: 0.85rem 1rem; }
        }
      `}</style>

      <AdminNav onSignOut={handleSignOut} />

      <div className="au-content">
        <div className="au-header">
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500 }}>Users</h1>
          <div style={{ fontSize: '13px', color: '#888' }}>{users.length} total users</div>
        </div>

        {/* Pending vendor alert */}
        {pendingVendors.length > 0 && filter !== 'pending' && (
          <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{pendingVendors.length} vendor application{pendingVendors.length > 1 ? 's' : ''} waiting for review</span>
            <button onClick={() => setFilter('pending')} style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', background: 'none', border: '1px solid #fde68a', padding: '0.2rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Review now →
            </button>
          </div>
        )}

        <div className="au-filter-bar">
          {(['pending', 'all', 'vendor', 'affiliate', 'admin'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12.5px', fontWeight: 500, padding: '0.4rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === f ? '#0d0d0d' : '#ffffff', color: filter === f ? '#ffffff' : '#888', textTransform: 'capitalize', position: 'relative' as const }}>
              {f === 'pending' ? 'Pending approval' : f} ({f === 'all' ? users.length : f === 'pending' ? pendingVendors.length : users.filter(u => u.role === f).length})
              {f === 'pending' && pendingVendors.length > 0 && filter !== 'pending' && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', overflowX: 'auto' }}>
          <div style={{ minWidth: '500px' }}>
            <div className="au-table-header">
              {['Name', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', fontSize: '13px', color: '#888' }}>
                {filter === 'pending' ? 'No pending vendor applications.' : 'No users found.'}
              </div>
            )}

            {filtered.map(u => (
              <>
                <div key={u.id} className="au-table-row" style={{ opacity: u.suspended ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f2f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0, position: 'relative' as const }}>
                      {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      {u.suspended && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#dc2626', borderRadius: '50%', border: '1.5px solid #fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name ?? 'Unknown'}</div>
                      {u.suspended && <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, letterSpacing: '0.05em' }}>SUSPENDED</div>}
                      {u.role === 'vendor' && u.vendor_status === 'pending_approval' && (
                        <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 600, letterSpacing: '0.05em' }}>PENDING APPROVAL</div>
                      )}
                      {u.role === 'vendor' && u.vendor_status === 'rejected' && (
                        <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, letterSpacing: '0.05em' }}>REJECTED{(u.reapply_count ?? 0) > 0 ? ' (REAPPLIED)' : ''}</div>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 600, color: roleColor[u.role] ?? '#888', background: `${roleColor[u.role] ?? '#888'}15`, padding: '0.2rem 0.6rem', borderRadius: '100px', textTransform: 'capitalize', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {u.role}
                  </span>

                  <div style={{ fontSize: '12px', color: u.vendor_status === 'approved' ? '#16a34a' : u.vendor_status === 'pending_approval' ? '#b45309' : u.vendor_status === 'rejected' ? '#dc2626' : '#888' }}>
                    {u.role === 'vendor'
                      ? u.vendor_status === 'approved' ? '● Approved'
                      : u.vendor_status === 'pending_approval' ? '● Pending'
                      : u.vendor_status === 'rejected' ? '● Rejected'
                      : '—'
                      : '—'}
                  </div>

                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Vendor pending — quick approve/reject */}
                    {u.role === 'vendor' && u.vendor_status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleVendorAction(u.id, 'approved')}
                          disabled={actionLoading === u.id}
                          style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#16a34a', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {actionLoading === u.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.3rem 0.75rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {u.role !== 'admin' && u.role !== 'suspended' && !(u.role === 'vendor' && u.vendor_status === 'pending_approval') && (
                      <button onClick={() => changeRole(u.id, 'admin')} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Make admin</button>
                    )}
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      style={{ fontSize: '11px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {expandedUser === u.id ? '▲ Less' : '▼ More'}
                    </button>
                  </div>
                </div>

                {expandedUser === u.id && (
                  <div key={`${u.id}-expand`} className="au-expand-row">
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.75rem' }}>Platform controls — {u.full_name}</div>

                    {/* Rejection note input for pending vendors */}
                    {u.role === 'vendor' && u.vendor_status === 'pending_approval' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3a3a3a', marginBottom: '0.4rem' }}>Rejection note (optional — sent via email and shown in their dashboard)</label>
                        <textarea
                          value={rejectionNotes[u.id] ?? ''}
                          onChange={e => setRejectionNotes(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="Explain why the application is being rejected…"
                          rows={3}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e8e6e2', borderRadius: '3px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={() => handleVendorAction(u.id, 'rejected')}
                          disabled={actionLoading === u.id}
                          style={{ marginTop: '0.5rem', fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#dc2626', border: 'none', padding: '0.45rem 1rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {actionLoading === u.id ? 'Rejecting…' : 'Confirm rejection'}
                        </button>
                      </div>
                    )}

                    {/* Show existing rejection note */}
                    {u.role === 'vendor' && u.vendor_status === 'rejected' && u.rejection_note && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '13px', color: '#dc2626' }}>
                        <strong>Rejection note:</strong> {u.rejection_note}
                        {(u.reapply_count ?? 0) > 0 && <div style={{ marginTop: '0.25rem', fontSize: '12px', color: '#888' }}>Vendor has reapplied ({u.reapply_count}/1 reapplication used)</div>}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => toggleSuspend(u.id, u.suspended)}
                        style={{ fontSize: '12px', fontWeight: 500, padding: '0.45rem 0.9rem', borderRadius: '3px', border: u.suspended ? '1px solid #bbf7d0' : '1px solid #fecaca', background: u.suspended ? '#f0fdf4' : '#fef2f2', color: u.suspended ? '#16a34a' : '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {u.suspended ? '✓ Unsuspend account' : '⊘ Suspend account'}
                      </button>

                      {(u.role === 'vendor' || u.role === 'suspended') && (
                        <>
                          <button onClick={() => { pauseAllProducts(u.id); alert(`All products for ${u.full_name} have been paused.`) }} style={{ fontSize: '12px', fontWeight: 500, padding: '0.45rem 0.9rem', borderRadius: '3px', border: '1px solid #e8e6e2', background: '#ffffff', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Pause all products
                          </button>
                          <button onClick={() => { removeAllProducts(u.id); alert(`All products for ${u.full_name} have been removed.`) }} style={{ fontSize: '12px', fontWeight: 500, padding: '0.45rem 0.9rem', borderRadius: '3px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Remove all products
                          </button>
                        </>
                      )}

                      {(u.role === 'affiliate' || u.role === 'suspended') && (
                        <button onClick={() => { revokeAllAffiliateLinks(u.id); alert(`All affiliate links for ${u.full_name} have been revoked.`) }} style={{ fontSize: '12px', fontWeight: 500, padding: '0.45rem 0.9rem', borderRadius: '3px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Revoke all affiliate links
                        </button>
                      )}

                      {u.role !== 'admin' && (
                        <button onClick={() => { if (window.confirm(`Permanently remove ${u.full_name} from the platform?`)) deleteUser(u.id) }} style={{ fontSize: '12px', fontWeight: 600, padding: '0.45rem 0.9rem', borderRadius: '3px', border: '1px solid #dc2626', background: '#dc2626', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                          Delete user
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}