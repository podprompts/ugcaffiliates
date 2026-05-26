// src/app/api/email/request-access/route.ts
// Sends an access request notification to admin when someone fills out the request form

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json()

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'UGCA <hello@ugcaffiliates.com>',
      to: ADMIN_EMAIL,
      subject: `Access request: ${firstName} ${lastName}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">New access request</h1>
          <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 8px;">
            Someone wants to join UGCAffiliates:
          </p>
          <div style="background: #f9f8f6; border: 1px solid #e8e6e2; border-radius: 4px; padding: 20px 24px; margin-bottom: 32px;">
            <p style="font-size: 14px; color: #0d0d0d; margin: 0 0 8px;"><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p style="font-size: 14px; color: #0d0d0d; margin: 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0d0d0d;">${email}</a></p>
          </div>
          <p style="font-size: 13px; color: #888; line-height: 1.65;">
            Generate an invite code from your admin panel and send it to them directly.
          </p>
          <a href="https://ugcaffiliates.com/admin" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px; margin-top: 16px;">
            Go to admin panel →
          </a>
          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[request-access email] error:', err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}