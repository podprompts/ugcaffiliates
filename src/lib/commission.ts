// src/lib/commission.ts
//
// Commission and platform fee calculations.
// Always use these helpers — never calculate inline — so the
// math is consistent across postback, payout cron, and dashboards.

export interface CommissionBreakdown {
  saleAmount:        number
  commissionRate:    number
  commissionAmount:  number // What the affiliate earns
  platformFeeRate:   number
  platformFee:       number // What UGCA keeps
  vendorNet:         number // What the vendor keeps after both
}

export function calculateCommission(
  saleAmount: number,
  commissionRate: number,        // e.g. 0.28
  platformFeeRate: number = 0.04 // e.g. 0.04
): CommissionBreakdown {
  const commissionAmount = round2(saleAmount * commissionRate)
  const platformFee      = round2(saleAmount * platformFeeRate)
  const vendorNet        = round2(saleAmount - commissionAmount - platformFee)

  return {
    saleAmount,
    commissionRate,
    commissionAmount,
    platformFeeRate,
    platformFee,
    vendorNet,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ----------------------------------------------------------
// src/lib/tracking.ts
//
// Tracking code generation and short URL helpers.
// ----------------------------------------------------------

import { randomBytes } from 'crypto'

/**
 * Generates a URL-safe base64 tracking code.
 * Default 8 bytes = ~11 chars, collision-safe for millions of links.
 */
export function generateTrackingCode(bytes = 8): string {
  return randomBytes(bytes)
    .toString('base64')
    .replace(/[+/=]/g, '')      // strip non-URL-safe chars
    .substring(0, 10)           // trim to 10 chars
}

/**
 * Builds the full short URL for an affiliate link.
 */
export function buildShortUrl(trackingCode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ugcaffiliates.com'
  return `${base}/go/${trackingCode}`
}

/**
 * Builds the vendor postback snippet to paste on their
 * checkout confirmation / thank-you page.
 */
export function buildVendorPostbackSnippet(secret: string): string {
  return `<!-- UGCAffiliates Conversion Tracking -->
<script>
(function() {
  var ref = document.cookie.split('; ').find(function(r){ return r.startsWith('ugca_ref=') })
  if (!ref) return
  var code = ref.split('=')[1]
  var orderId = '{{ORDER_ID}}'   // Replace with your order ID variable
  var amount  = '{{ORDER_TOTAL}}' // Replace with your order total variable
  fetch('https://ugcaffiliates.com/api/postback'
    + '?ref='      + encodeURIComponent(code)
    + '&order_id=' + encodeURIComponent(orderId)
    + '&amount='   + encodeURIComponent(amount)
    + '&secret=${secret}',
    { method: 'POST', keepalive: true }
  )
})()
</script>`
}