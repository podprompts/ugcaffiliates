// src/app/api/email/welcome/route.ts
// Sends welcome emails to new vendors and affiliates via Resend

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, full_name } = await req.json()
    const firstName = full_name?.split(' ')[0] ?? 'there'

    if (role === 'vendor') {
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: user.email!,
        subject: 'Welcome to UGCAffiliates — your account is ready',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px; line-height: 1.2;">Welcome, ${firstName}.</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Your UGCAffiliates vendor account is ready. Start your 7-day free trial and list your first product — thousands of motivated creators are waiting to promote it.
            </p>
            <div style="margin-bottom: 32px;">
              <a href="https://ugcaffiliates.com/pricing" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px;">
                Start your free trial →
              </a>
            </div>
            <div style="border-top: 1px solid #e8e6e2; padding-top: 24px;">
              <p style="font-size: 13px; color: #888; line-height: 1.65; margin-bottom: 8px;"><strong style="color: #0d0d0d;">What happens next:</strong></p>
              <p style="font-size: 13px; color: #888; line-height: 1.65; margin: 0;">1. Choose a plan and start your 7-day free trial<br>2. List your first product (takes 5 minutes)<br>3. Affiliates apply to promote — you approve them<br>4. Sales get tracked automatically. You pay affiliates directly.</p>
            </div>
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
          </div>
        `,
      })
    } else {
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: user.email!,
        subject: 'Welcome to UGCAffiliates — start earning',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px; line-height: 1.2;">Welcome, ${firstName}.</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Your affiliate account is ready. Browse hundreds of products, grab your unique tracked link, and start earning commissions on every sale you drive — paid directly to you.
            </p>
            <div style="margin-bottom: 32px;">
              <a href="https://ugcaffiliates.com/marketplace" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px;">
                Browse products →
              </a>
            </div>
            <div style="border-top: 1px solid #e8e6e2; padding-top: 24px;">
              <p style="font-size: 13px; color: #888; line-height: 1.65; margin-bottom: 8px;"><strong style="color: #0d0d0d;">How it works:</strong></p>
              <p style="font-size: 13px; color: #888; line-height: 1.65; margin: 0;">1. Browse the marketplace and apply to promote products<br>2. Get your unique tracked link once approved<br>3. Post on TikTok, Instagram, YouTube — wherever your audience is<br>4. Earn commissions on every confirmed sale. No minimums.</p>
            </div>
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[welcome email] error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}