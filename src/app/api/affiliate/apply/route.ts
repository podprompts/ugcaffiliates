// src/app/api/affiliate/apply/route.ts
// Affiliate applies to promote a product.
// auto_approve=true  → immediately approves + creates affiliate_links row
// auto_approve=false → inserts pending application + notifies vendor

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { customAlphabet } from 'nanoid'

export const runtime = 'nodejs'

const nanoid = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 8)

function json(data: object, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { product_id } = await req.json()
    if (!product_id) return json({ error: 'product_id required' }, 400)

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, vendor_id, auto_approve, status, commission_rate, profiles!vendor_id(id, full_name)')
      .eq('id', product_id)
      .single()

    if (productError || !product) return json({ error: 'Product not found' }, 404)
    if (product.status !== 'active') return json({ error: 'Product is not active' }, 410)

    // Check for existing application
    const { data: existing } = await supabase
      .from('affiliate_applications')
      .select('id, status')
      .eq('affiliate_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existing) {
      return json({ ok: true, already_applied: true, status: existing.status })
    }

    const vendor = (product as any).profiles as any

    // Normalize commission to decimal (0.20 not 20)
    const commissionDecimal = product.commission_rate > 1
      ? product.commission_rate / 100
      : product.commission_rate

    // ── AUTO-APPROVE ──────────────────────────────────────────────────────────
    if (product.auto_approve) {
      await supabase.from('affiliate_applications').insert({
        affiliate_id: user.id,
        product_id,
        status:       'approved',
        reviewed_at:  new Date().toISOString(),
      })

      // Generate unique tracking code
      let trackingCode = nanoid()
      let attempts = 0
      while (attempts < 5) {
        const { data: clash } = await supabase
          .from('affiliate_links')
          .select('id')
          .eq('tracking_code', trackingCode)
          .maybeSingle()
        if (!clash) break
        trackingCode = nanoid()
        attempts++
      }

      const shortUrl = `https://ugcaffiliates.com/go/${trackingCode}`

      const { error: linkError } = await supabase
        .from('affiliate_links')
        .insert({
          tracking_code:     trackingCode,
          code:              trackingCode, // keep both in sync
          short_url:         shortUrl,
          affiliate_id:      user.id,
          product_id,
          vendor_id:         product.vendor_id,
          commission_rate:   commissionDecimal,
          total_clicks:      0,
          total_conversions: 0,
          total_earned:      0,
          is_active:         true,
        })

      if (linkError) {
        console.error('[apply] link insert error:', linkError)
        return json({ error: 'Failed to create affiliate link' }, 500)
      }

      await supabase.from('notifications').insert({
        user_id:    user.id,
        type:       'application_approved',
        title:      "You're approved — link ready!",
        message:    `Your link to promote "${product.title}" is live. Copy it from My Links.`,
        product_id,
        read:       false,
      })

      console.log(`[apply] auto-approved — tracking_code: ${trackingCode}`)
      return json({ ok: true, auto_approved: true, tracking_code: trackingCode, short_url: shortUrl })
    }

    // ── MANUAL APPROVAL ───────────────────────────────────────────────────────
    await supabase.from('affiliate_applications').insert({
      affiliate_id: user.id,
      product_id,
      status:       'pending',
    })

    if (vendor?.id) {
      await supabase.from('notifications').insert({
        user_id:    vendor.id,
        type:       'affiliate_application',
        title:      'New affiliate application',
        message:    `Someone applied to promote "${product.title}". Review them in your Affiliates dashboard.`,
        product_id,
        read:       false,
      })
    }

    return json({ ok: true, auto_approved: false, status: 'pending' })

  } catch (err) {
    console.error('[affiliate/apply] error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}