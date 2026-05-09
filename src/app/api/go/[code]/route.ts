// src/app/api/go/[code]/route.ts
//
// Click Tracker + Redirect
// Resolves tracking code → logs click → sets cookie → redirects to vendor URL

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code || code.length > 20) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const supabase = createServiceClient()

  // 1. Resolve tracking code → link + product
  const { data: link, error } = await supabase
    .from('affiliate_links')
    .select(`
      id,
      affiliate_id,
      product_id,
      tracking_code,
      products (
        product_url,
        cookie_days,
        status
      )
    `)
    .eq('tracking_code', code)
    .single()

  if (error || !link || !link.products) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const product = link.products as unknown as {
    product_url: string
    cookie_days: number
    status: string
  }

  if (product.status !== 'active') {
    return NextResponse.redirect(new URL('/marketplace', req.url))
  }

  // 2. Log the click (non-blocking)
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ipHash    = createHash('sha256').update(ip).digest('hex')
  const referrer  = req.headers.get('referer') ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  supabase
    .from('clicks')
    .insert({
      link_id:    link.id,
      ip_hash:    ipHash,
      referrer:   referrer,
      user_agent: userAgent,
    })
    .then(() => {})

  // 3. Build redirect with tracking cookie
  const cookieDays = product.cookie_days ?? 30
  const maxAge     = cookieDays * 24 * 60 * 60

  const destination = new URL(product.product_url)
  destination.searchParams.set('ugca_ref', code)

  const response = NextResponse.redirect(destination.toString(), { status: 302 })

  response.cookies.set('ugca_ref', code, {
    maxAge,
    path:     '/',
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: false,
  })

  return response
}