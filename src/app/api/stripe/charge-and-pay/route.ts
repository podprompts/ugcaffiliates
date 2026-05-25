// src/app/api/stripe/charge-and-pay/route.ts
// The core payout route:
// 1. Charges vendor's saved card (commission + platform fee)
// 2. Transfers commission to affiliate's Stripe Connect account
// 3. UGCA keeps the platform fee automatically
// Called when vendor clicks "Approve & Pay" on a conversion

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
})

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversion_id } = await req.json()
    if (!conversion_id) return NextResponse.json({ error: 'conversion_id required' }, { status: 400 })

    // ── Load conversion ──────────────────────────────────────────────────────
    const { data: conversion } = await supabase
      .from('conversions')
      .select(`
        id, order_id, sale_amount, commission_amount, platform_fee,
        status, affiliate_id, vendor_id, product_id,
        profiles!affiliate_id ( full_name, stripe_connect_id, stripe_connect_onboarded ),
        products ( title )
      `)
      .eq('id', conversion_id)
      .single()

    if (!conversion) return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
    if (conversion.status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    if (conversion.vendor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const affiliate = conversion.profiles as any
    const product   = conversion.products as any

    // ── Check affiliate has Connect account ──────────────────────────────────
    if (!affiliate?.stripe_connect_id || !affiliate?.stripe_connect_onboarded) {
      return NextResponse.json({
        error: 'Affiliate has not connected their Stripe account yet. They need to connect their bank before you can pay them.',
        code: 'AFFILIATE_NOT_CONNECTED',
      }, { status: 400 })
    }

    // ── Load vendor's Stripe customer + payment method ───────────────────────
    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single()

    if (!vendorProfile?.stripe_customer_id) {
      return NextResponse.json({
        error: 'You need to add a payment method before paying affiliates.',
        code: 'NO_PAYMENT_METHOD',
      }, { status: 400 })
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: vendorProfile.stripe_customer_id,
      type: 'card',
    })

    if (!paymentMethods.data.length) {
      return NextResponse.json({
        error: 'No payment method on file. Please add a card in your settings.',
        code: 'NO_PAYMENT_METHOD',
      }, { status: 400 })
    }

    const pm = paymentMethods.data[0]

    // ── Amounts in cents ─────────────────────────────────────────────────────
    const commissionCents   = Math.round(conversion.commission_amount * 100)
    const platformFeeCents  = Math.round(conversion.platform_fee * 100)
    const totalChargeCents  = commissionCents + platformFeeCents

    // ── Charge vendor for commission + platform fee ──────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount:               totalChargeCents,
      currency:             'usd',
      customer:             vendorProfile.stripe_customer_id,
      payment_method:       pm.id,
      confirm:              true,
      off_session:          true,
      description:          `UGCA: Commission + fee for ${product?.title ?? 'product'} (Order ${conversion.order_id})`,
      metadata: {
        conversion_id: conversion.id,
        order_id:      conversion.order_id,
        vendor_id:     user.id,
        affiliate_id:  conversion.affiliate_id,
      },
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        error: `Payment failed with status: ${paymentIntent.status}`,
        code: 'PAYMENT_FAILED',
      }, { status: 400 })
    }

    // ── Transfer commission to affiliate's Connect account ───────────────────
    const transfer = await stripe.transfers.create({
      amount:      commissionCents,
      currency:    'usd',
      destination: affiliate.stripe_connect_id,
      description: `Commission for ${product?.title ?? 'product'} (Order ${conversion.order_id})`,
      metadata: {
        conversion_id:   conversion.id,
        payment_intent:  paymentIntent.id,
      },
    })

    // ── Mark conversion as paid ──────────────────────────────────────────────
    await supabase
      .from('conversions')
      .update({
        status:                  'paid',
        paid_at:                 new Date().toISOString(),
        stripe_payment_intent:   paymentIntent.id,
      })
      .eq('id', conversion_id)

    // ── Email admin ──────────────────────────────────────────────────────────
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    try {
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to:   ADMIN_EMAIL,
        subject: `[Payout Complete] ${fmt(conversion.platform_fee)} platform fee collected`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h2 style="font-size: 18px; margin-bottom: 16px;">Automatic payout complete</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Vendor</td><td style="padding: 8px 0; font-weight: 600;">${vendorProfile.full_name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Affiliate</td><td style="padding: 8px 0;">${affiliate.full_name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Product</td><td style="padding: 8px 0;">${product?.title}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Commission paid</td><td style="padding: 8px 0; color: #16a34a; font-weight: 600;">${fmt(conversion.commission_amount)}</td></tr>
              <tr style="background: #f0fdf4;"><td style="padding: 10px; color: #16a34a; font-weight: 600;">Platform fee collected</td><td style="padding: 10px; color: #16a34a; font-size: 18px; font-weight: 700;">${fmt(conversion.platform_fee)}</td></tr>
            </table>
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">Stripe Payment Intent: ${paymentIntent.id}</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[charge-and-pay] email error:', emailErr)
    }

    return NextResponse.json({
      ok:                true,
      payment_intent_id: paymentIntent.id,
      transfer_id:       transfer.id,
      commission_paid:   conversion.commission_amount,
      platform_fee:      conversion.platform_fee,
    })

  } catch (err: any) {
    console.error('[charge-and-pay] error:', err)
    // Handle specific Stripe errors
    if (err.code === 'authentication_required') {
      return NextResponse.json({ error: 'Card requires authentication. Please update your payment method.', code: 'AUTH_REQUIRED' }, { status: 400 })
    }
    if (err.code === 'card_declined') {
      return NextResponse.json({ error: 'Card was declined. Please update your payment method.', code: 'CARD_DECLINED' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message ?? 'Payment failed' }, { status: 500 })
  }
}