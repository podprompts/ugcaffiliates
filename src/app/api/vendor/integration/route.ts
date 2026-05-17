// src/app/api/vendor/integration/route.ts
// Returns integration details for the vendor — postback secret from platform_rules.
// Auth-gated to vendor role only.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['vendor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rules } = await supabase
      .from('platform_rules')
      .select('rule_key, value')
      .in('rule_key', ['postback_secret', 'platform_fee_rate'])

    const rulesMap: Record<string, string> = Object.fromEntries(
      (rules ?? []).map((r: any) => [r.rule_key, r.value])
    )

    return NextResponse.json({
      postback_secret: rulesMap['postback_secret'] ?? '',
      platform_fee_rate: rulesMap['platform_fee_rate'] ?? '0.10',
    })
  } catch (err) {
    console.error('[vendor/integration] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}