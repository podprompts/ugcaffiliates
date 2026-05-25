// src/app/api/vendor/integration/route.ts
// Returns per-vendor postback secret from profiles table.
// Auth-gated to vendor + admin roles.

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
      .select('role, postback_secret')
      .eq('id', user.id)
      .single()

    if (!profile || !['vendor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate secret if missing (new vendors)
    let secret = profile.postback_secret
    if (!secret) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ postback_secret: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '') })
        .eq('id', user.id)
        .select('postback_secret')
        .single()
      secret = updated?.postback_secret ?? ''
    }

    return NextResponse.json({
      postback_secret:   secret,
      platform_fee_rate: '0.10',
    })
  } catch (err) {
    console.error('[vendor/integration] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}