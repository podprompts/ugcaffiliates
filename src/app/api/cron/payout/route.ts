// src/app/api/cron/payout/route.ts
//
// Payout cron — runs daily via cron-job.org
// Advances conversions from 'pending' → 'approved' after the hold period (7 days)
// Vendors are invoiced the platform fee separately.
//
// Trigger: GET https://ugcaffiliates.com/api/cron/payout
// Header: x-cron-secret: <CRON_SECRET>

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'Adrien1@gmail.com'
const HOLD_DAYS = 7 // days before pending → approved

export async function GET(req: NextRequest) {
  // Validate cron secret
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const cutoff = new Date(Date.now() - HOLD_DAYS * 86_400_000).toISOString()

  // ── Find pending conversions older than hold period ──────────────────────
  const { data: pending, error: fetchError } = await supabase
    .from('conversions')
    .select(`
      id,
      sale_amount,
      commission_amount,
      platform_fee,
      converted_at,
      affiliate_id,
      vendor_id,
      product_id,
      profiles!affiliate_id ( full_name ),
      products ( title )
    `)
    .eq('status', 'pending')
    .lt('converted_at', cutoff)

  if (fetchError) {
    console.error('[payout cron] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch conversions' }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    console.log('[payout cron] no conversions to advance')
    return NextResponse.json({ ok: true, advanced: 0 })
  }

  // ── Advance to 'approved' ────────────────────────────────────────────────
  const ids = pending.map((c: any) => c.id)
  const { error: updateError } = await supabase
    .from('conversions')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    console.error('[payout cron] update error:', updateError)
    return NextResponse.json({ error: 'Failed to update conversions' }, { status: 500 })
  }

  // ── Summarise by vendor for admin email ──────────────────────────────────
  const vendorSummary: Record<string, { conversions: number; totalSales: number; platformFee: number }> = {}
  for (const c of pending as any[]) {
    const vid = c.vendor_id
    if (!vendorSummary[vid]) vendorSummary[vid] = { conversions: 0, totalSales: 0, platformFee: 0 }
    vendorSummary[vid].conversions++
    vendorSummary[vid].totalSales += c.sale_amount ?? 0
    vendorSummary[vid].platformFee += c.platform_fee ?? 0
  }

  const totalCommissions = (pending as any[]).reduce((s, c) => s + (c.commission_amount ?? 0), 0)
  const totalPlatformFees = (pending as any[]).reduce((s, c) => s + (c.platform_fee ?? 0), 0)

  // ── Email admin summary ──────────────────────────────────────────────────
  try {
    await resend.emails.send({
      from: 'UGCA Cron <hello@ugcaffiliates.com>',
      to: ADMIN_EMAIL,
      subject: `[Payout] ${pending.length} conversion${pending.length !== 1 ? 's' : ''} approved — $${totalPlatformFees.toFixed(2)} platform fees due`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0d0d0d;">
          <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 32px;">U G C A</div>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Daily payout run complete</h2>
          <p style="font-size: 14px; color: #888; margin-bottom: 24px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f9f8f6; border-radius: 4px; overflow: hidden;">
            <tr style="background: #0d0d0d; color: #ffffff;">
              <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">Metric</td>
              <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; text-align: right;">Amount</td>
            </tr>
            <tr><td style="padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e8e6e2;">Conversions approved</td><td style="padding: 10px 16px; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e8e6e2;">${pending.length}</td></tr>
            <tr><td style="padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e8e6e2;">Total affiliate commissions</td><td style="padding: 10px 16px; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e8e6e2;">$${totalCommissions.toFixed(2)}</td></tr>
            <tr><td style="padding: 10px 16px; font-size: 14px; color: #16a34a; font-weight: 600;">Platform fees owed to UGCA</td><td style="padding: 10px 16px; font-size: 14px; font-weight: 700; text-align: right; color: #16a34a;">$${totalPlatformFees.toFixed(2)}</td></tr>
          </table>

          <a href="https://ugcaffiliates.com/admin/conversions" style="display: inline-block; background: #0d0d0d; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 3px; margin-bottom: 32px;">
            View in Admin →
          </a>

          <p style="font-size: 12px; color: #bbb; margin-top: 32px;">UGCAffiliates · Automated payout cron</p>
        </div>
      `,
    })
  } catch (emailErr) {
    console.error('[payout cron] email error:', emailErr)
    // Don't fail the cron — email is non-critical
  }

  console.log(`[payout cron] advanced ${pending.length} conversions to approved`)
  return NextResponse.json({
    ok: true,
    advanced: pending.length,
    total_commissions: totalCommissions,
    total_platform_fees: totalPlatformFees,
  })
}