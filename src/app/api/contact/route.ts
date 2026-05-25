// src/app/api/contact/route.ts
// Forwards contact form submissions to admin email via Resend

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'UGCA Contact <hello@ugcaffiliates.com>',
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject} — ${name}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">New contact form submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; font-size: 13px; color: #888; width: 100px;">Name</td><td style="padding: 8px 0; font-size: 14px; color: #0d0d0d;">${name}</td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #888;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #0d0d0d;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-size: 13px; color: #888;">Subject</td><td style="padding: 8px 0; font-size: 14px; color: #0d0d0d;">${subject}</td></tr>
          </table>
          <div style="background: #f9f8f6; border-left: 3px solid #e8e6e2; padding: 16px 20px; border-radius: 0 4px 4px 0;">
            <div style="font-size: 12px; color: #888; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px;">Message</div>
            <div style="font-size: 14px; color: #3a3a3a; line-height: 1.7; white-space: pre-wrap;">${message}</div>
          </div>
          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    })

    // Auto-reply to sender
    await resend.emails.send({
      from: 'UGCA <hello@ugcaffiliates.com>',
      to: email,
      subject: 'We received your message — UGCAffiliates',
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Got your message, ${name.split(' ')[0]}.</h1>
          <p style="font-size: 15px; color: #3a3a3a; line-height: 1.7; margin-bottom: 24px;">
            Thanks for reaching out. We've received your message about <strong>${subject}</strong> and will get back to you within 24 hours.
          </p>
          <div style="background: #f9f8f6; border-radius: 4px; padding: 16px 20px; margin-bottom: 32px;">
            <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Your message:</div>
            <div style="font-size: 14px; color: #3a3a3a; line-height: 1.65; white-space: pre-wrap;">${message}</div>
          </div>
          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · ugcaffiliates.com</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}