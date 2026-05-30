// src/app/layout.tsx

import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ugcaffiliates.com'),
  title: {
    default: 'UGCAffiliates.com',
    template: '%s | UGCAffiliates.com',
  },
  description:
    'Connect with top brands, create authentic content, and earn commissions on every sale. Invite-only affiliate platform for creators & vendors.',
  keywords: 'affiliate marketing, ugc, creator economy, affiliate network',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'UGCAffiliates.com — Promote Products. Earn Commissions.',
    description:
      'Connect with top brands, create authentic content, and earn commissions on every sale. Invite-only affiliate platform for creators & vendors.',
    url: 'https://ugcaffiliates.com',
    siteName: 'UGCAffiliates.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UGCAffiliates.com — Promote products. Earn a commission on sales.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UGCAffiliates.com — Promote Products. Earn Commissions.',
    description:
      'Connect with top brands, create authentic content, and earn commissions on every sale. Invite-only affiliate platform for creators & vendors.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-white text-black">
        {children}
      </body>
    </html>
  )
}