// src/app/vendor/settings/page.tsx
// Vendor adds a payment method for automatic platform fee charges and affiliate payouts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import VendorNav from '@/components/VendorNav'

export const dynamic = 'force-dynamic'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CardForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSave() {
    if (!stripe || !elements) return
    setSaving(true); setError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const { error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement }
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Card setup failed')
      setSaving(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div>
      <div style={{ border: '1px solid #e8e6e2', borderRadius: '4px', padding: '0.875rem 1rem', background: '#ffffff', marginBottom: '1rem' }}>
        <CardElement options={{ style: { base: { fontSize: '14px', color: '#0d0d0d', '::placeholder': { color: '#aaa' } } } }} />
      </div>
      {error && <div style={{ fontSize: '13px', color: '#dc2626', marginBottom: '0.75rem' }}>{error}</div>}
      <button onClick={handleSave} disabled={saving || !stripe}
        style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: saving ? '#888' : '#0d0d0d', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        {saving ? 'Saving…' : 'Save card'}
      </button>
    </div>
  )
}

export default function VendorSettingsPage() {
  const router = useRouter()
  const [session, setSession]           = useState<any>(null)
  const [profile, setProfile]           = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading]           = useState(true)
  const [showCardForm, setShowCardForm] = useState(false)
  const [success, setSuccess]           = useState('')
  const [profileInitial, setProfileInitial] = useState('V')

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

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, role, stripe_customer_id')
        .eq('id', sess.user.id)
        .single()

      setProfile(prof)
      setProfileInitial(prof?.full_name?.charAt(0)?.toUpperCase() ?? 'V')

      // Check payment method status
      const pmRes = await fetch('/api/stripe/vendor-setup', {
        headers: { Authorization: `Bearer ${sess.access_token}` }
      })
      if (pmRes.ok) setPaymentStatus(await pmRes.json())

      setLoading(false)
    }
    load()
  }, [])

  async function handleAddCard() {
    if (!session) return
    setShowCardForm(true)

    const res = await fetch('/api/stripe/vendor-setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const data = await res.json()
    if (data.client_secret) setClientSecret(data.client_secret)
  }

  async function handleCardSuccess() {
    setShowCardForm(false)
    setSuccess('Payment method saved successfully.')
    // Refresh payment status
    const pmRes = await fetch('/api/stripe/vendor-setup', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (pmRes.ok) setPaymentStatus(await pmRes.json())
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f8f6' }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#888' }}>Loading...</div>
    </div>
  )

  const hasCard = paymentStatus?.has_payment_method
  const card    = paymentStatus?.card

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f6', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <style>{`
        .vs-content { max-width: 640px; margin: 0 auto; padding: 2.5rem 2rem; }
        @media (max-width: 600px) { .vs-content { padding: 1.5rem 1rem; } }
      `}</style>

      <VendorNav profileInitial={profileInitial} onSignOut={handleSignOut} />

      <div className="vs-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontWeight: 500, marginBottom: '0.4rem' }}>Vendor</div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 500, margin: 0 }}>Settings</h1>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '13px', color: '#16a34a' }}>{success}</div>
        )}

        {/* Payment method */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '0.75rem' }}>Payment method</div>
          <p style={{ fontSize: '13px', color: '#3a3a3a', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Add a card to automatically pay affiliate commissions and UGCA platform fees when you approve conversions. Your card is charged only when you click "Approve & Pay".
          </p>

          {hasCard ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '20px' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', textTransform: 'capitalize' }}>{card?.brand} ···· {card?.last4}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Expires {card?.exp_month}/{card?.exp_year}</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>✓ Active</span>
              </div>
              {!showCardForm && (
                <button onClick={handleAddCard}
                  style={{ fontSize: '13px', color: '#888', background: 'none', border: '1px solid #e8e6e2', padding: '0.45rem 1rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Replace card
                </button>
              )}
            </div>
          ) : (
            !showCardForm && (
              <button onClick={handleAddCard}
                style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', background: '#0d0d0d', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add payment method
              </button>
            )
          )}

          {showCardForm && clientSecret && (
            <div style={{ marginTop: '1rem' }}>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CardForm clientSecret={clientSecret} onSuccess={handleCardSuccess} />
              </Elements>
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', fontSize: '12px', color: '#888' }}>
            🔒 Card details are stored securely by Stripe. UGCA never sees your full card number.
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.75rem' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '1rem' }}>How automatic payouts work</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              ['Conversion recorded', 'When an affiliate drives a sale, it appears in your Conversions dashboard as Pending.'],
              ['You review and approve', 'Click "Approve & Pay" to verify the sale is legitimate and trigger payment.'],
              ['Automatic split payment', 'UGCA charges your card the commission + 10% platform fee. The commission goes directly to the affiliate\'s bank account via Stripe.'],
              ['Affiliate gets paid', 'The affiliate receives their commission automatically within 2-7 business days — no manual transfers needed.'],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0d0d0d', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.2rem' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}