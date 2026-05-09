// src/app/api/postback/route.ts
//
// Conversion Postback — vendors fire this after a confirmed purchase
// Supports both GET and POST for easier vendor integration

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

function json(data: object, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET(req: NextRequest) {
  return handlePostback(req)
}

export async function POST(req: NextRequest) {
  return handlePostback(req)
}

async function handlePostback(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const ref       = searchParams.get('ref')
  const orderId   = searchParams.get('order_id')
  const amountRaw = searchParams.get('amount')
  const secret    = searchParams.get('secret')

  // 1. Validate required params
  if (!ref || !orderId || !amountRaw || !secret) {
    return json({ error: 'Missing required params: ref, order_id, amount, secret' }, 400)
  }

  const saleAmount = parseFloat(amountRaw)
  if (isNaN(saleAmount) || saleAmount <= 0) {
    return json({ error: 'Invalid amount' }, 400)
  }

  const supabase = createServiceClient()

  // 2. Validate secret against platform_rules
  const { data: rules } = await supabase
    .from('platform_rules')
    .select('rule_key, value')
    .in('rule_key', ['postback_secret', 'platform_fee_rate'])

  const rulesMap: Record<string, string> = Object.fromEntries(
    (rules ?? []).map((r: { rule_key: string; value: string }) => [r.rule_key, r.value])
  )

  const validSecret = rulesMap['postback_secret']
  if (!validSecret || secret !== validSecret) {
    return json({ error: 'Invalid secret' }, 401)
  }

  const platformFeeRate = parseFloat(rulesMap['platform_fee_rate'] ?? '0.04')

  // 3. Resolve tracking code → link + product
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
    return json({ error: 'Tracking code not found' }, 404)
  }

  const product = link.products as unknown as {
    vendor_id: string
    commission_rate: number
    status: string
    title: string
  }

  if (product.status !== 'active') {
    return json({ error: 'Product is no longer active' }, 410)
  }

  // 4. Calculate commission (frozen at conversion time)
  const commissionRate   = product.commission_rate
  const commissionAmount = Math.round(saleAmount * commissionRate * 100) / 100
  const platformFee      = Math.round(saleAmount * platformFeeRate * 100) / 100

  // 5. Hash IP for fraud detection
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')

  // 6. Insert conversion (unique constraint handles dedup)
  const { data: conversion, error: insertError } = await supabase
    .from('conversions')
    .insert({
      link_id:           link.id,
      affiliate_id:      link.affiliate_id,
      vendor_id:         product.vendor_id,
      product_id:        link.product_id,
      order_id:          orderId,
      sale_amount:       saleAmount,
      commission_rate:   commissionRate,
      commission_amount: commissionAmount,
      platform_fee:      platformFee,
      status:            'pending',
      ip_hash:           ipHash,
    })
    .select('id')
    .single()

  // Duplicate order — idempotent
  if ((insertError as { code?: string } | null)?.code === '23505') {
    return json({ ok: true, duplicate: true })
  }

  if (insertError || !conversion) {
    console.error('[postback] insert error:', insertError)
    return json({ error: 'Failed to record conversion' }, 500)
  }

  return json({
    ok:                true,
    conversion_id:     conversion.id,
    sale_amount:       saleAmount,
    commission_amount: commissionAmount,
    platform_fee:      platformFee,
    status:            'pending',
  })
}