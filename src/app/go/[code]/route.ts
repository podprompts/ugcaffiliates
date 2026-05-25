// src/app/go/[code]/route.ts
//
// Affiliate click tracker + redirect
//
// Flow:
//   1. Affiliate shares: ugcaffiliates.com/go/abc123
//   2. This route looks up the tracking_code in affiliate_links
//   3. Logs the click (ip_hash, referrer, user_agent)
//   4. Sets cookie: ugca_ref=abc123 (30-day window)
//   5. Redirects to vendor's product_url
//
// The cookie is what track.js reads on the vendor's confirmation page
// to attribute the sale back to the correct affiliate.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

const COOKIE_NAME = 'ugca_ref'
const FALLBACK_URL = 'https://ugcaffiliates.com/marketplace'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code || code.length > 32) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  const supabase = createServiceClient()

  // ── Resolve tracking code → link + product ──────────────────────────────
  const { data: link, error } = await supabase
    .from('affiliate_links')
    .select(`
      id,
      affiliate_id,
      product_id,
      commission_rate,
      is_active,
      products (
        id,
        title,
        product_url,
        cookie_days,
        status
      )
    `)
    .eq('tracking_code', code)
    .maybeSingle()

  if (error || !link || !link.is_active || !link.products) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  const product = link.products as unknown as {
    id: string
    title: string
    product_url: string
    cookie_days: number
    status: string
  }

  if (product.status !== 'active' || !product.product_url) {
    return NextResponse.redirect(FALLBACK_URL)
  }

  // ── Log the click (fire-and-forget) ─────────────────────────────────────
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const referrer = req.headers.get('referer') || null
  const userAgent = req.headers.get('user-agent') || null

  supabase
    .from('clicks')
    .insert({
      link_id:      link.id,
      affiliate_id: link.affiliate_id,
      product_id:   link.product_id,
      ip_hash:      ipHash,
      referrer,
      user_agent:   userAgent,
    })
    .then(({ error: clickError }) => {
      if (clickError) console.error('[go] click insert error:', clickError)
    })

  // Increment total_clicks via RPC to avoid race conditions
  supabase.rpc('increment_link_clicks', { link_id: link.id }).then(() => {})

  // ── Set cookie + redirect ────────────────────────────────────────────────
  const cookieDays = product.cookie_days ?? 30
  const expires = new Date(Date.now() + cookieDays * 86_400_000)

  // Append ugca_ref param so vendor's server-side postback can also read it
  const destination = new URL(product.product_url)
  destination.searchParams.set('ugca_ref', code)

  const response = NextResponse.redirect(destination.toString(), { status: 302 })

  response.cookies.set(COOKIE_NAME, code, {
    expires,
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // Must be false — track.js reads it client-side
    secure: true,
  })

  return response
}