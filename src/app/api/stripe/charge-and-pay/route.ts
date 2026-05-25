// src/app/api/stripe/charge-and-pay/route.ts
// Charges vendor's card, transfers commission to affiliate, keeps platform fee

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend  = new Resend(process.env.RESEND_API_KEY!)
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

    // Check profile role — admin can approve any conversion
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = callerProfile?.role === 'admin'
    if (!isAdmin && conversion.vendor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For admin approving, use the actual vendor's customer ID
    const effectiveVendorId = isAdmin ? conversion.vendor_id : user.id

    const affiliate = conversion.profiles as any
    const product   = conversion.products as any

    if (!affiliate?.stripe_connect_id || !affiliate?.stripe_connect_onboarded) {
      return NextResponse.json({ error: 'Affiliate has not connected their Stripe account yet.', code: 'AFFILIATE_NOT_CONNECTED' }, { status: 400 })
    }

    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', effectiveVendorId)
      .single()

    if (!vendorProfile?.stripe_customer_id) {
      return NextResponse.json({ error: 'You need to add a payment method before paying affiliates.', code: 'NO_PAYMENT_METHOD' }, { status: 400 })
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: vendorProfile.stripe_customer_id,
      type:     'card',
    })

    if (!paymentMethods.data.length) {
      return NextResponse.json({ error: 'No payment method on file. Please add a card in your settings.', code: 'NO_PAYMENT_METHOD' }, { status: 400 })
    }

    const pm = paymentMethods.data[0]
    const commissionCents  = Math.round(conversion.commission_amount * 100)
    const platformFeeCents = Math.round(conversion.platform_fee * 100)
    const totalChargeCents = commissionCents + platformFeeCents

    const paymentIntent = await stripe.paymentIntents.create({
      amount:         totalChargeCents,
      currency:       'usd',
      customer:       vendorProfile.stripe_customer_id,
      payment_method: pm.id,
      confirm:        true,
      off_session:    true,
      description:    `UGCA commission + fee for ${product?.title ?? 'product'} (Order ${conversion.order_id})`,
      metadata: {
        conversion_id: conversion.id,
        order_id:      conversion.order_id,
        vendor_id:     effectiveVendorId,
        affiliate_id:  conversion.affiliate_id,
      },
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: `Payment failed: ${paymentIntent.status}`, code: 'PAYMENT_FAILED' }, { status: 400 })
    }

    const transfer = await stripe.transfers.create({
      amount:      commissionCents,
      currency:    'usd',
      destination: affiliate.stripe_connect_id,
      description: `Commission for ${product?.title ?? 'product'} (Order ${conversion.order_id})`,
      metadata:    { conversion_id: conversion.id, payment_intent: paymentIntent.id },
    })

    await supabase.from('conversions').update({
      status:                'paid',
      paid_at:               new Date().toISOString(),
      stripe_payment_intent: paymentIntent.id,
    }).eq('id', conversion_id)

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    // ── Email affiliate about their payout ──────────────────────────────────
    try {
      const { data: affiliateUser } = await supabase.auth.admin.getUserById(conversion.affiliate_id)
      if (affiliateUser?.user?.email) {
        await resend.emails.send({
          from:    'UGCA <hello@ugcaffiliates.com>',
          to:      affiliateUser.user.email,
          subject: `💸 You've been paid — ${fmt(conversion.commission_amount)}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
            <div style="font-size:20px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">U G C A</div>
            <h1 style="font-size:24px;font-weight:600;margin-bottom:8px;">You've been paid!</h1>
            <p style="font-size:14px;color:#888;margin-bottom:24px;">Your commission for promoting <strong>${product?.title ?? 'a product'}</strong> has been transferred to your Stripe account.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:24px;margin-bottom:24px;text-align:center;">
              <div style="font-size:14px;color:#888;margin-bottom:8px;">Commission paid</div>
              <div style="font-size:36px;font-weight:700;color:#16a34a;">${fmt(conversion.commission_amount)}</div>
              <div style="font-size:13px;color:#888;margin-top:8px;">Arrives in your bank account within 2-7 business days</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Product</td><td style="padding:8px 0;font-size:14px;">${product?.title ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Sale amount</td><td style="padding:8px 0;font-size:14px;">${fmt(conversion.sale_amount)}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px;">Your commission rate</td><td style="padding:8px 0;font-size:14px;">${(conversion.commission_amount / conversion.sale_amount * 100).toFixed(0)}%</td></tr>
            </table>
            <a href="https://ugcaffiliates.com/affiliate/earnings" style="display:inline-block;background:#0d0d0d;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;border-radius:3px;margin-bottom:24px;">View your earnings →</a>
            <p style="font-size:12px;color:#bbb;margin-top:32px;">UGCAffiliates · You're receiving this because you're an approved affiliate.</p>
          </div>`,
        })
      }
    } catch (e) { console.error('[charge-and-pay] affiliate email error:', e) }

    // ── Email admin about platform fee ───────────────────────────────────────
    try {
      await resend.emails.send({
        from:    'UGCA <hello@ugcaffiliates.com>',
        to:      ADMIN_EMAIL,
        subject: `[Payout] ${fmt(conversion.platform_fee)} platform fee collected`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;">
          <h2>Automatic payout complete</h2>
          <p>Vendor: <strong>${vendorProfile.full_name}</strong></p>
          <p>Affiliate: <strong>${affiliate.full_name}</strong></p>
          <p>Commission paid: <strong>${fmt(conversion.commission_amount)}</strong></p>
          <p style="color:#16a34a;font-size:18px;">Platform fee collected: <strong>${fmt(conversion.platform_fee)}</strong></p>
          <p style="font-size:12px;color:#bbb;">Payment Intent: ${paymentIntent.id}</p>
        </div>`,
      })
    } catch (e) { console.error('[charge-and-pay] email error:', e) }

    return NextResponse.json({
      ok:                true,
      payment_intent_id: paymentIntent.id,
      transfer_id:       transfer.id,
      commission_paid:   conversion.commission_amount,
      platform_fee:      conversion.platform_fee,
    })

  } catch (err: any) {
    console.error('[charge-and-pay] error:', err)
    if (err.code === 'authentication_required') return NextResponse.json({ error: 'Card requires authentication. Please update your payment method.', code: 'AUTH_REQUIRED' }, { status: 400 })
    if (err.code === 'card_declined') return NextResponse.json({ error: 'Card was declined. Please update your payment method.', code: 'CARD_DECLINED' }, { status: 400 })
    return NextResponse.json({ error: err.message ?? 'Payment failed' }, { status: 500 })
  }
}