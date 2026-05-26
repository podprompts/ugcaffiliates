// src/app/api/invite/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_ATTEMPTS = 10      // max attempts per IP
const WINDOW_MINUTES = 60    // within this rolling window

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' })

  // ── Rate limiting ────────────────────────────────────────────────────────
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  // Count recent attempts from this IP
  const { count } = await supabase
    .from('invite_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('attempted_at', windowStart)

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { valid: false, error: 'Too many attempts. Please try again in an hour.' },
      { status: 429 }
    )
  }

  // Log this attempt
  await supabase.from('invite_attempts').insert({ ip_hash: ipHash })

  // Clean up old attempts older than the window (fire and forget)
  supabase
    .from('invite_attempts')
    .delete()
    .lt('attempted_at', windowStart)
    .then(() => {})

  // ── Validate code ────────────────────────────────────────────────────────
  const { data } = await supabase
    .from('invite_codes')
    .select('id, used')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!data) return NextResponse.json({ valid: false, error: 'Invalid invite code' })
  if (data.used) return NextResponse.json({ valid: false, error: 'This code has already been used' })

  return NextResponse.json({ valid: true })
}