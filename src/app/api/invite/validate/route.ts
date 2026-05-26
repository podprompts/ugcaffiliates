// src/app/api/invite/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' })

  const { data } = await supabase
    .from('invite_codes')
    .select('id, used')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!data) return NextResponse.json({ valid: false, error: 'Invalid invite code' })
  if (data.used) return NextResponse.json({ valid: false, error: 'This code has already been used' })

  return NextResponse.json({ valid: true })
}