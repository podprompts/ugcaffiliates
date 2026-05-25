// src/app/api/vendor/notify-paid/route.ts
// Called when vendor marks a conversion as paid.
// Emails admin so they can invoice the platform fee.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

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

    const {
      conversion_id,
      order_id,
      sale_amount,
      commission_amount,
      platform_fee,
      affiliate_name,
      product_title,
      vendor_name,
    } = await req.json()

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

    await resend.emails.send({
      from: 'UGCA <hello@ugcaffiliates.com>',
      to: ADMIN_EMAIL,
      subject: `[Invoice Due] ${vendor_name} paid affiliate — ${fmt(platform_fee)} platform fee owed`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Platform fee due</h2>
          <p style="font-size: 14px; color: #888; margin-bottom: 24px;">A vendor has marked an affiliate commission as paid. Invoice them for the platform fee.</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr style="background: #f9f8f6;"><td style="padding: 10px 16px; font-size: 13px; color: #888; width: 160px;">Vendor</td><td style="padding: 10px 16px; font-size: 14px; font-weight: 600;">${vendor_name}</td></tr>
            <tr><td style="padding: 10px 16px; font-size: 13px; color: #888; border-top: 1px solid #e8e6e2;">Product</td><td style="padding: 10px 16px; font-size: 14px; border-top: 1px solid #e8e6e2;">${product_title ?? '—'}</td></tr>
            <tr style="background: #f9f8f6;"><td style="padding: 10px 16px; font-size: 13px; color: #888; border-top: 1px solid #e8e6e2;">Affiliate</td><td style="padding: 10px 16px; font-size: 14px; border-top: 1px solid #e8e6e2;">${affiliate_name ?? '—'}</td></tr>
            <tr><td style="padding: 10px 16px; font-size: 13px; color: #888; border-top: 1px solid #e8e6e2;">Order ID</td><td style="padding: 10px 16px; font-size: 14px; font-family: monospace; border-top: 1px solid #e8e6e2;">${order_id}</td></tr>
            <tr style="background: #f9f8f6;"><td style="padding: 10px 16px; font-size: 13px; color: #888; border-top: 1px solid #e8e6e2;">Sale amount</td><td style="padding: 10px 16px; font-size: 14px; font-weight: 600; border-top: 1px solid #e8e6e2;">${fmt(sale_amount)}</td></tr>
            <tr><td style="padding: 10px 16px; font-size: 13px; color: #888; border-top: 1px solid #e8e6e2;">Commission paid to affiliate</td><td style="padding: 10px 16px; font-size: 14px; color: #16a34a; font-weight: 600; border-top: 1px solid #e8e6e2;">${fmt(commission_amount)}</td></tr>
            <tr style="background: #fef9ec;"><td style="padding: 12px 16px; font-size: 13px; color: #92400e; border-top: 2px solid #fde68a; font-weight: 600;">Platform fee owed to UGCA</td><td style="padding: 12px 16px; font-size: 18px; color: #92400e; font-weight: 700; border-top: 2px solid #fde68a;">${fmt(platform_fee)}</td></tr>
          </table>

          <a href="https://ugcaffiliates.com/admin/conversions" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px; margin-bottom: 24px;">
            View in Admin →
          </a>

          <p style="font-size: 13px; color: #888; line-height: 1.65;">
            Invoice ${vendor_name} for <strong>${fmt(platform_fee)}</strong> (10% of ${fmt(sale_amount)} sale).
          </p>
          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · Automated notification</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify-paid] error:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}