// src/app/api/vendor/reapply/route.ts
// Allows a rejected vendor to reapply once.
// Increments reapply_count, sets vendor_status back to pending_approval,
// clears rejection note, and emails admin.

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, vendor_status, reapply_count')
      .eq('id', user.id)
      .single()

    if (!profile) return json({ error: 'Profile not found' }, 404)
    if (profile.vendor_status !== 'rejected') return json({ error: 'Can only reapply if rejected' }, 400)
    if ((profile.reapply_count ?? 0) >= 1) return json({ error: 'Reapplication limit reached' }, 400)

    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user.id)
    const vendorEmail = authUser?.email
    const firstName = profile.full_name?.split(' ')[0] ?? 'there'

    await supabase
      .from('profiles')
      .update({
        vendor_status: 'pending_approval',
        rejection_note: null,
        reapply_count: (profile.reapply_count ?? 0) + 1,
      })
      .eq('id', user.id)

    // Email admin
    await resend.emails.send({
      from: 'UGCA <hello@ugcaffiliates.com>',
      to: ADMIN_EMAIL,
      subject: `Vendor reapplication: ${profile.full_name}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Vendor reapplication</h1>
          <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
            <strong>${profile.full_name}</strong> (${vendorEmail ?? 'no email'}) has reapplied for vendor access.
            This is their reapplication (1 of 1 allowed).
          </p>
          <a href="https://ugcaffiliates.com/admin/users" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px;">
            Review in Admin →
          </a>
          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
        </div>
      `,
    })

    return json({ ok: true })

  } catch (err) {
    console.error('[vendor/reapply] error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}