// src/app/api/invite/consume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const { code, userId } = await req.json()
  if (!code || !userId) return NextResponse.json({ ok: false })

  // Find the code
  const { data: invite } = await supabase
    .from('invite_codes')
    .select('id, used')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!invite || invite.used) return NextResponse.json({ ok: false, error: 'Code invalid or already used' })

  // Mark code as used
  await supabase
    .from('invite_codes')
    .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Generate 5 new codes for the new user
  const newCodes = Array.from({ length: 5 }, () => ({
    code: generateCode(),
    created_by: userId,
    used: false,
  }))

  await supabase.from('invite_codes').insert(newCodes)
  await supabase.from('profiles').update({ invite_codes_remaining: 5 }).eq('id', userId)

  return NextResponse.json({ ok: true })
}