// src/app/api/stripe/webhook/route.ts
// Handles Stripe webhook events
// ── SUBSCRIPTION BILLING COMMENTED OUT ────────────────────────────────────────
// Vendors now list for free. Subscription model preserved here for future
// premium tier. Only conversion/platform fee tracking is active.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia' as any,
  })

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

      // ── SUBSCRIPTION ONBOARDING — COMMENTED OUT ─────────────────────────────
      // Vendors are now free to list. Re-enable when premium tier is launched.
      //
      // const userId = session.metadata?.supabase_user_id
      // const plan   = session.metadata?.plan
      //
      // if (userId && plan) {
      //   await supabase
      //     .from('profiles')
      //     .update({
      //       stripe_customer_id: session.customer as string,
      //       stripe_onboarded:   true,
      //     })
      //     .eq('id', userId)
      //
      //   await supabase
      //     .from('profiles')
      //     .update({ role: 'vendor' })
      //     .eq('id', userId)
      //
      //   console.log(`[webhook] vendor ${userId} subscribed to ${plan}`)
      // }
      // ── END COMMENTED OUT ────────────────────────────────────────────────────

      // ── Affiliate conversion attribution — ACTIVE ─────────────────────────
      // ref comes from client_reference_id (UGCA-hosted links)
      // or metadata.ugca_ref (vendor's own Stripe checkout)
      const ref = session.client_reference_id || session.metadata?.ugca_ref || null

      if (ref) {
        const orderId     = session.id
        const amountTotal = (session.amount_total ?? 0) / 100

        if (amountTotal > 0) {
          const { data: existing } = await supabase
            .from('conversions')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle()

          if (!existing) {
            const { data: link } = await supabase
              .from('affiliate_links')
              .select('id, affiliate_id, product_id, commission_rate, vendor_id')
              .eq('tracking_code', ref)
              .single()

            if (link) {
              const commissionAmount = parseFloat(
                (amountTotal * (link.commission_rate / 100)).toFixed(2)
              )
              const platformFee = parseFloat((amountTotal * 0.10).toFixed(2))

              await supabase.from('conversions').insert({
                affiliate_link_id:     link.id,
                affiliate_id:          link.affiliate_id,
                vendor_id:             link.vendor_id,
                product_id:            link.product_id,
                order_id:              orderId,
                sale_amount:           amountTotal,
                commission_rate:       link.commission_rate,
                commission_amount:     commissionAmount,
                platform_fee:          platformFee,
                status:                'approved',
                source:                'stripe',
                stripe_session_id:     session.id,
                stripe_payment_intent: session.payment_intent ?? null,
                converted_at:          new Date().toISOString(),
              })

              await supabase.rpc('increment_link_conversions', {
                link_id:     link.id,
                sale_amount: amountTotal,
              })

              console.log(
                `[webhook] affiliate conversion — order: ${orderId} | commission: $${commissionAmount} | platform fee: $${platformFee}`
              )
            } else {
              console.warn(`[webhook] affiliate ref not found: ${ref}`)
            }
          }
        }
      }

      break
    }

    // ── SUBSCRIPTION LIFECYCLE — COMMENTED OUT ─────────────────────────────
    // Re-enable when premium vendor tier is launched.
    //
    // case 'customer.subscription.deleted': {
    //   const sub    = event.data.object as any
    //   const userId = sub.metadata?.supabase_user_id
    //   if (!userId) break
    //   await supabase
    //     .from('profiles')
    //     .update({ stripe_onboarded: false })
    //     .eq('id', userId)
    //   console.log(`[webhook] subscription cancelled for ${userId}`)
    //   break
    // }
    // ── END COMMENTED OUT ────────────────────────────────────────────────────

    default:
      break
  }

  return NextResponse.json({ received: true })
}