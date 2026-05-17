// src/app/api/stripe/checkout/route.ts
// ── VENDOR SUBSCRIPTION CHECKOUT — COMMENTED OUT ─────────────────────────────
// Vendors now list products for free. Subscription model preserved below
// for future premium tier launch. Re-enable and uncomment to restore.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// ── COMMENTED OUT — subscription checkout ─────────────────────────────────────
//
// import Stripe from 'stripe'
// import { createServiceClient } from '@/lib/supabase-server'
//
// const PRICE_IDS: Record<string, string> = {
//   starter: process.env.STRIPE_STARTER_PRICE_ID!,
//   growth:  process.env.STRIPE_GROWTH_PRICE_ID!,
//   pro:     process.env.STRIPE_PRO_PRICE_ID!,
// }
//
// const TRIAL_DAYS: Record<string, number> = {
//   starter: 7,
//   growth:  7,
//   pro:     0,
// }
//
// export async function POST(req: NextRequest) {
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//     apiVersion: '2026-04-22.dahlia' as any,
//   })
//   try {
//     const authHeader = req.headers.get('authorization')
//     const token = authHeader?.replace('Bearer ', '')
//     if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     const supabase = createServiceClient()
//     const { data: { user } } = await supabase.auth.getUser(token)
//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     const { plan } = await req.json()
//     const priceId = PRICE_IDS[plan]
//     if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
//     const appUrl = process.env.NEXT_PUBLIC_APP_URL!
//     const trialDays = TRIAL_DAYS[plan] ?? 0
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('stripe_customer_id, full_name')
//       .eq('id', user.id)
//       .single()
//     let customerId = profile?.stripe_customer_id
//     if (!customerId) {
//       const customer = await stripe.customers.create({
//         email: user.email,
//         name: profile?.full_name ?? undefined,
//         metadata: { supabase_user_id: user.id },
//       })
//       customerId = customer.id
//       await supabase
//         .from('profiles')
//         .update({ stripe_customer_id: customerId })
//         .eq('id', user.id)
//     }
//     const session = await stripe.checkout.sessions.create({
//       customer: customerId,
//       mode: 'subscription',
//       payment_method_types: ['card'],
//       line_items: [{ price: priceId, quantity: 1 }],
//       subscription_data: {
//         ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
//         metadata: { supabase_user_id: user.id, plan },
//       },
//       success_url: `${appUrl}/vendor/success`,
//       cancel_url:  `${appUrl}/pricing`,
//       metadata: { supabase_user_id: user.id, plan },
//     })
//     return NextResponse.json({ url: session.url })
//   } catch (err) {
//     console.error('[stripe/checkout] error:', err)
//     return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
//   }
// }
// ── END COMMENTED OUT ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Subscriptions disabled — vendors list for free.
  // Platform revenue comes from 4% fee on affiliate conversions.
  return NextResponse.json(
    { error: 'Vendor subscriptions are not currently active. Listing is free.' },
    { status: 503 }
  )
}