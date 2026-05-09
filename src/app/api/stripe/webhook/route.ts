// src/app/api/stripe/webhook/route.ts
// Handles Stripe webhook events for subscription lifecycle

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId  = session.metadata?.supabase_user_id
      const plan    = session.metadata?.plan
      if (!userId || !plan) break

      // Update vendor profile with subscription info
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_onboarded:   true,
        })
        .eq('id', userId)

      // Ensure role is vendor
      await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', userId)

      console.log(`[webhook] vendor ${userId} subscribed to ${plan}`)
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      // Mark as not onboarded when subscription cancelled
      await supabase
        .from('profiles')
        .update({ stripe_onboarded: false })
        .eq('id', userId)

      console.log(`[webhook] subscription cancelled for ${userId}`)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}