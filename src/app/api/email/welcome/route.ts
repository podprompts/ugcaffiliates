// src/app/api/email/welcome/route.ts
// Sends welcome emails to new vendors and affiliates via Resend
// Vendor welcome now reflects pending approval state

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'

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
      // Email vendor — pending approval
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: user.email!,
        subject: 'Your UGCAffiliates vendor application is under review',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px; line-height: 1.2;">Application received, ${firstName}.</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Thank you for applying to list your products on UGCAffiliates. Our team will review your application and get back to you shortly — usually within 24 hours.
            </p>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Once approved, you'll be able to list your products and start reaching thousands of motivated creators. We'll send you an email as soon as a decision is made.
            </p>
            <div style="background: #f9f8f6; border-radius: 4px; padding: 20px 24px; margin-bottom: 32px;">
              <p style="font-size: 13px; color: #888; line-height: 1.65; margin: 0;">
                Free to list · 10% platform fee on confirmed affiliate sales only. You pay nothing until you make money.
              </p>
            </div>
            <a href="https://ugcaffiliates.com/vendor" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px;">
              View your account →
            </a>
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
          </div>
        `,
      })

      // Email admin — new vendor application
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: ADMIN_EMAIL,
        subject: `New vendor application: ${full_name}`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">New vendor application</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              <strong>${full_name}</strong> (${user.email}) has applied to become a vendor on UGCAffiliates.
            </p>
            <a href="https://ugcaffiliates.com/admin/users" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px;">
              Review application →
            </a>
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
          </div>
        `,
      })

    } else {
      // Affiliate welcome — unchanged
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: user.email!,
        subject: 'Welcome to UGCAffiliates — start earning',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px; line-height: 1.2;">Welcome, ${firstName}.</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Your affiliate account is ready. Browse products, grab your unique tracked link, and start earning commissions on every sale you drive — paid directly to you.
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