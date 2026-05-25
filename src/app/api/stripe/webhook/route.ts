// src/app/api/stripe/webhook/route.ts
// Handles Stripe webhook events
// ── SUBSCRIPTION BILLING COMMENTED OUT ──────────────────────────────────────
// Vendors now list for free. Subscription model preserved here for future
// premium tier. Only conversion/platform fee tracking is active.
// ── CONNECT EVENTS ADDED ────────────────────────────────────────────────────
// Handles payment_intent.succeeded, payment_intent.payment_failed,
// transfer.created, account.updated for Stripe Connect payouts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'Adrien1@gmail.com'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia' as any,
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const body   = await req.text()
  const sig    = req.headers.get('stripe-signature')!

  // ── Determine which webhook secret to use ───────────────────────────────
  // Connect events use a separate signing secret if configured
  let event: Stripe.Event
  const connectSecret  = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  const standardSecret = process.env.STRIPE_WEBHOOK_SECRET!

  // Try standard secret first, fall back to connect secret
  try {
    event = stripe.webhooks.constructEvent(body, sig, standardSecret)
  } catch {
    if (connectSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, connectSecret)
      } catch (err) {
        console.error('[webhook] signature error:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      console.error('[webhook] signature error — no connect secret configured')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  const supabase = createServiceClient()

  switch (event.type) {

    // ── CHECKOUT SESSION COMPLETED ──────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as any

      // ── SUBSCRIPTION ONBOARDING — COMMENTED OUT ──────────────────────────
      // Vendors are now free to list. Re-enable when premium tier is launched.
      // ── END COMMENTED OUT ───────────────────────────────────────────────

      // ── Affiliate conversion attribution — ACTIVE ────────────────────────
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

    // ── PAYMENT INTENT SUCCEEDED (charge-and-pay confirmed) ─────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const conversionId = pi.metadata?.conversion_id

      if (conversionId) {
        // Mark conversion as paid if not already done by charge-and-pay route
        const { data: conv } = await supabase
          .from('conversions')
          .select('id, status')
          .eq('id', conversionId)
          .single()

        if (conv && conv.status !== 'paid') {
          await supabase
            .from('conversions')
            .update({
              status:                'paid',
              paid_at:               new Date().toISOString(),
              stripe_payment_intent: pi.id,
            })
            .eq('id', conversionId)

          console.log(`[webhook] payment_intent.succeeded — conversion ${conversionId} marked paid`)
        }
      }
      break
    }

    // ── PAYMENT INTENT FAILED ────────────────────────────────────────────────
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const conversionId = pi.metadata?.conversion_id
      const vendorId     = pi.metadata?.vendor_id

      console.error(`[webhook] payment_intent.payment_failed — conversion: ${conversionId}`)

      // Email admin about the failure
      if (conversionId) {
        try {
          await resend.emails.send({
            from:    'UGCA <hello@ugcaffiliates.com>',
            to:      ADMIN_EMAIL,
            subject: `[Alert] Payment failed for conversion ${conversionId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
                <h2 style="color: #dc2626;">Payment Failed</h2>
                <p>A vendor's card was declined when trying to pay an affiliate commission.</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #888;">Conversion ID</td><td style="font-family: monospace;">${conversionId}</td></tr>
                  <tr><td style="padding: 8px 0; color: #888;">Vendor ID</td><td style="font-family: monospace;">${vendorId ?? '—'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #888;">Payment Intent</td><td style="font-family: monospace;">${pi.id}</td></tr>
                  <tr><td style="padding: 8px 0; color: #888;">Failure reason</td><td style="color: #dc2626;">${pi.last_payment_error?.message ?? 'Unknown'}</td></tr>
                </table>
                <p style="margin-top: 16px;">The vendor needs to update their payment method and retry.</p>
                <a href="https://ugcaffiliates.com/admin/conversions" style="display: inline-block; background: #0d0d0d; color: #fff; padding: 10px 24px; text-decoration: none; border-radius: 3px; margin-top: 16px;">View in Admin →</a>
              </div>
            `,
          })
        } catch (emailErr) {
          console.error('[webhook] failed payment email error:', emailErr)
        }
      }
      break
    }

    // ── TRANSFER CREATED (commission sent to affiliate) ──────────────────────
    case 'transfer.created': {
      const transfer     = event.data.object as Stripe.Transfer
      const conversionId = transfer.metadata?.conversion_id

      console.log(
        `[webhook] transfer.created — ${transfer.amount / 100} USD to ${transfer.destination} | conversion: ${conversionId}`
      )
      break
    }

    // ── ACCOUNT UPDATED (affiliate Connect account status changed) ───────────
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      const ugcaUserId = account.metadata?.ugca_user_id

      if (ugcaUserId) {
        const onboarded = account.details_submitted &&
          !(account.requirements?.currently_due?.length)

        await supabase
          .from('profiles')
          .update({ stripe_connect_onboarded: onboarded })
          .eq('stripe_connect_id', account.id)

        console.log(
          `[webhook] account.updated — ${account.id} | onboarded: ${onboarded}`
        )
      }
      break
    }

    // ── SUBSCRIPTION LIFECYCLE — COMMENTED OUT ───────────────────────────────
    // Re-enable when premium vendor tier is launched.
    // ── END COMMENTED OUT ───────────────────────────────────────────────────

    default:
      break
  }

  return NextResponse.json({ received: true })
}