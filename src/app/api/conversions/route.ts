// src/app/api/conversions/route.ts
// Low-trust pixel endpoint — called by track.js from vendor's confirmation page.
// No shared secret needed (runs server-side). Lower trust than /api/postback
// but safe because no secret is exposed to the browser.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json()
    const { ref, order_id, amount, page_url } = body

    if (!ref || !order_id || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // ── Deduplicate ────────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('conversions')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    // ── Resolve tracking code → link + product (matches postback pattern) ──
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        affiliate_id,
        product_id,
        products (
          vendor_id,
          commission_rate,
          status,
          title
        )
      `)
      .eq('tracking_code', ref)
      .single()

    if (linkError || !link || !link.products) {
      return NextResponse.json({ error: 'Unknown tracking code' }, { status: 404 })
    }

    const product = link.products as unknown as {
      vendor_id: string
      commission_rate: number
      status: string
      title: string
    }

    if (product.status !== 'active') {
      return NextResponse.json({ error: 'Product no longer active' }, { status: 410 })
    }

    // ── Calculate commission ───────────────────────────────────────────────
    const commissionRate   = product.commission_rate
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100
    const platformFee      = Math.round(amount * 0.04 * 100) / 100

    // ── Hash IP for fraud detection ────────────────────────────────────────
    const forwarded = req.headers.get('x-forwarded-for')
    const ip        = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const ipHash    = createHash('sha256').update(ip).digest('hex')

    // ── Insert conversion ──────────────────────────────────────────────────
    const { data: conversion, error: insertError } = await supabase
      .from('conversions')
      .insert({
        link_id:           link.id,
        affiliate_id:      link.affiliate_id,
        vendor_id:         product.vendor_id,
        product_id:        link.product_id,
        order_id,
        sale_amount:       amount,
        commission_rate:   commissionRate,
        commission_amount: commissionAmount,
        platform_fee:      platformFee,
        status:            'pending',
        source:            'pixel',
        page_url:          page_url || null,
        ip_hash:           ipHash,
        converted_at:      new Date().toISOString(),
      })
      .select('id')
      .single()

    if ((insertError as any)?.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    if (insertError || !conversion) {
      console.error('[conversions pixel] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record conversion' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, conversion_id: conversion.id })
  } catch (err) {
    console.error('[conversions pixel] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// CORS — vendor sites need to POST from their browser
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}