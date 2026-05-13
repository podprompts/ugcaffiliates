// src/app/api/affiliate/approve/route.ts
//
// Approves or rejects an affiliate application.
// On approval: creates affiliate_links row, generates tracking code, notifies affiliate.
// Schema: affiliate_links uses `code`, `click_count`, `conversion_count`, `total_sales`
//         commission_rate stored as integer percent (e.g. 20 = 20%)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { customAlphabet } from 'nanoid'

export const runtime = 'nodejs'

// 8-char URL-safe codes, no lookalike characters
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

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !['vendor', 'admin'].includes(callerProfile.role)) {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { application_id, action } = body // action: 'approved' | 'rejected'

    if (!application_id || !['approved', 'rejected'].includes(action)) {
      return json({ error: 'application_id and action (approved|rejected) required' }, 400)
    }

    // Fetch application with product + affiliate info
    const { data: application, error: appError } = await supabase
      .from('affiliate_applications')
      .select(`
        id,
        status,
        affiliate_id,
        product_id,
        products (
          id,
          vendor_id,
          title,
          commission_rate,
          cookie_days,
          status
        ),
        profiles!affiliate_id (
          id,
          full_name
        )
      `)
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return json({ error: 'Application not found' }, 404)
    }

    const product = application.products as any

    // Vendor can only action their own products
    if (callerProfile.role === 'vendor' && product.vendor_id !== user.id) {
      return json({ error: 'Forbidden' }, 403)
    }

    if (application.status === action) {
      return json({ ok: true, already: true, status: action })
    }

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if (action === 'approved') {
      // Check if link already exists (idempotent)
      const { data: existingLink } = await supabase
        .from('affiliate_links')
        .select('id, code')
        .eq('affiliate_id', application.affiliate_id)
        .eq('product_id', application.product_id)
        .single()

      let code: string

      if (existingLink) {
        code = existingLink.code
      } else {
        // Generate unique code
        code = nanoid()
        let attempts = 0
        while (attempts < 5) {
          const { data: clash } = await supabase
            .from('affiliate_links')
            .select('id')
            .eq('tracking_code', code)
            .single()
          if (!clash) break
          code = nanoid()
          attempts++
        }

        // commission_rate stored as integer percent in affiliate_links
        // product.commission_rate may be decimal (0.20) — convert to percent
        const commissionPct = product.commission_rate > 1
          ? product.commission_rate           // already a percent integer
          : Math.round(product.commission_rate * 100) // convert 0.20 → 20

        const { error: linkError } = await supabase
          .from('affiliate_links')
          .insert({
            code,
            affiliate_id:     application.affiliate_id,
            product_id:       application.product_id,
            vendor_id:        product.vendor_id,
            commission_rate:  commissionPct,
            click_count:      0,
            conversion_count: 0,
            total_sales:      0,
            is_active:        true,
          })

        if (linkError) {
          console.error('[approve] link insert error:', linkError)
          return json({ error: 'Failed to create affiliate link' }, 500)
        }
      }

      const shortUrl = `https://ugcaffiliates.com/go/${code}`

      // Update application status
      await supabase
        .from('affiliate_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', application_id)

      // Notify affiliate
      await supabase.from('notifications').insert({
        user_id:    application.affiliate_id,
        type:       'application_approved',
        title:      'Application approved!',
        message:    `You've been approved to promote "${product.title}". Your tracked link is ready in My Links.`,
        product_id: application.product_id,
        read:       false,
      })

      return json({ ok: true, status: 'approved', code, short_url: shortUrl })
    }

    // ── REJECT ───────────────────────────────────────────────────────────────
    await supabase
      .from('affiliate_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', application_id)

    await supabase.from('notifications').insert({
      user_id:    application.affiliate_id,
      type:       'application_rejected',
      title:      'Application update',
      message:    `Your application to promote "${product.title}" was not approved at this time.`,
      product_id: application.product_id,
      read:       false,
    })

    return json({ ok: true, status: 'rejected' })

  } catch (err) {
    console.error('[affiliate/approve] error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
