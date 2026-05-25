// src/app/api/vendor/approve/route.ts
// Admin approves or rejects a vendor application.
// On approval: sets vendor_status = 'approved', sends approval email
// On rejection: sets vendor_status = 'rejected', stores note, sends rejection email
// Vendor can reapply once (reapply_count tracks this)

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'

function json(data: object, status = 200) {
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Forbidden' }, 403)
    }

    const { vendor_id, action, note } = await req.json()

    if (!vendor_id || !['approved', 'rejected'].includes(action)) {
      return json({ error: 'vendor_id and action (approved|rejected) required' }, 400)
    }

    // Get vendor profile + email from auth.users
    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('id, full_name, vendor_status, reapply_count')
      .eq('id', vendor_id)
      .single()

    if (!vendorProfile) return json({ error: 'Vendor not found' }, 404)

    // Get email from auth admin API
    const { data: { user: vendorUser } } = await supabase.auth.admin.getUserById(vendor_id)
    const vendorEmail = vendorUser?.email
    const firstName = vendorProfile.full_name?.split(' ')[0] ?? 'there'

    if (action === 'approved') {
      await supabase
        .from('profiles')
        .update({ vendor_status: 'approved', rejection_note: null })
        .eq('id', vendor_id)

      // Send approval email to vendor
      if (vendorEmail) {
        await resend.emails.send({
          from: 'UGCA <hello@ugcaffiliates.com>',
          to: vendorEmail,
          subject: 'Your vendor application has been approved!',
          html: `
            <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
              <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
              <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px;">You're approved, ${firstName}!</h1>
              <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
                Your vendor account has been approved. You can now list your products and start reaching thousands of motivated creators.
              </p>
              <a href="https://ugcaffiliates.com/vendor/products/new" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px; margin-bottom: 32px;">
                List your first product →
              </a>
              <div style="border-top: 1px solid #e8e6e2; padding-top: 24px;">
                <p style="font-size: 13px; color: #888; line-height: 1.65; margin: 0;">
                  Free to list · 10% platform fee on confirmed affiliate sales only. You pay nothing until you make money.
                </p>
              </div>
              <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
            </div>
          `,
        })
      }

      return json({ ok: true, status: 'approved' })
    }

    // ── REJECT ──────────────────────────────────────────────────────────────
    const newReapplyCount = vendorProfile.reapply_count ?? 0

    await supabase
      .from('profiles')
      .update({
        vendor_status: 'rejected',
        rejection_note: note ?? null,
      })
      .eq('id', vendor_id)

    // Send rejection email to vendor
    if (vendorEmail) {
      await resend.emails.send({
        from: 'UGCA <hello@ugcaffiliates.com>',
        to: vendorEmail,
        subject: 'Your UGCAffiliates vendor application',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px;">Application update</h1>
            <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              Hi ${firstName}, after reviewing your application we're unable to approve your vendor account at this time.
            </p>
            ${note ? `
            <div style="background: #f9f8f6; border-left: 3px solid #e8e6e2; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
              <p style="font-size: 13px; font-weight: 600; color: #0d0d0d; margin: 0 0 8px;">Note from our team:</p>
              <p style="font-size: 14px; color: #3a3a3a; line-height: 1.65; margin: 0;">${note}</p>
            </div>
            ` : ''}
            ${newReapplyCount < 1 ? `
            <p style="font-size: 14px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              You may reapply one time. Log in to your account to submit a new application.
            </p>
            <a href="https://ugcaffiliates.com/vendor" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px; margin-bottom: 32px;">
              Reapply →
            </a>
            ` : `
            <p style="font-size: 14px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
              You have already used your one reapplication opportunity. If you believe this is an error, please contact us.
            </p>
            `}
            <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
          </div>
        `,
      })
    }

    return json({ ok: true, status: 'rejected' })

  } catch (err) {
    console.error('[vendor/approve] error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}