// src/app/api/stripe/affiliate-connect/route.ts
// Creates a Stripe Connect account for the affiliate and returns onboarding URL

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ugcaffiliates.com'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_connect_id, stripe_connect_onboarded, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let connectId = profile.stripe_connect_id

    if (!connectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { ugca_user_id: user.id, role: profile.role ?? 'affiliate' },
      })
      connectId = account.id
      await supabase.from('profiles').update({ stripe_connect_id: connectId }).eq('id', user.id)
    }

    const accountLink = await stripe.accountLinks.create({
      account:     connectId,
      refresh_url: `${APP_URL}/affiliate/settings?connect=refresh`,
      return_url:  `${APP_URL}/affiliate/settings?connect=success`,
      type:        'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error('[affiliate-connect POST] error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create Connect account' }, { status: 500 })
  }
}

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
      .select('stripe_connect_id, stripe_connect_onboarded')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_connect_id) {
      return NextResponse.json({ connected: false, onboarded: false })
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_id)
    const onboarded = !!(account.details_submitted && !account.requirements?.currently_due?.length)

    if (onboarded && !profile.stripe_connect_onboarded) {
      await supabase.from('profiles').update({ stripe_connect_onboarded: true }).eq('id', user.id)
    }

    return NextResponse.json({
      connected:       true,
      onboarded,
      connect_id:      profile.stripe_connect_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    })
  } catch (err: any) {
    console.error('[affiliate-connect GET] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}