// src/app/privacy/page.tsx

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '1rem' }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '3rem' }}>Last updated: May 2026</p>

        {[
          { title: '1. Information We Collect', body: 'We collect information you provide directly, including your name, email address, and payment information when you create an account or subscribe. We also collect usage data including pages visited, clicks, and conversions through our tracking system. We collect technical data including IP addresses (stored as hashed values), browser type, and device information.' },
          { title: '2. How We Use Your Information', body: 'We use your information to: provide and improve the Platform; process payments and subscriptions; track affiliate conversions and commissions; send transactional emails including receipts and notifications; communicate platform updates; and prevent fraud and abuse.' },
          { title: '3. Affiliate Tracking & Cookies', body: 'UGCAffiliates uses first-party cookies to track affiliate referrals. When a buyer clicks an affiliate link, we set a cookie named "ugca_ref" that persists for the vendor\'s specified cookie window (default 30 days). This cookie is used to attribute sales to the correct affiliate. Users can disable cookies in their browser settings, which will prevent affiliate attribution.' },
          { title: '4. Information Sharing', body: 'We do not sell your personal information. We share information with: payment processors (Stripe) to handle subscriptions; email service providers (Resend) to send transactional emails; and hosting providers (Vercel, Supabase) to operate the Platform. We may disclose information if required by law or to protect the rights of UGCAffiliates and its users.' },
          { title: '5. Data Retention', body: 'We retain your account information for as long as your account is active. Conversion and commission data is retained for 7 years for accounting purposes. You may request deletion of your personal data by contacting us, subject to our legal obligations to retain certain records.' },
          { title: '6. Security', body: 'We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and row-level security on our database. IP addresses are stored as SHA-256 hashes and never in plain text. Despite these measures, no system is completely secure and we cannot guarantee absolute security.' },
          { title: '7. Your Rights', body: 'You have the right to: access the personal information we hold about you; correct inaccurate information; request deletion of your data; object to processing of your data; and withdraw consent where processing is based on consent. To exercise these rights, contact us at privacy@ugcaffiliates.com.' },
          { title: '8. Children\'s Privacy', body: 'UGCAffiliates is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.' },
          { title: '9. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by email. Continued use of the Platform after changes constitutes acceptance of the updated policy.' },
          { title: '10. Contact', body: 'For privacy-related questions or requests, contact us at privacy@ugcaffiliates.com.' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.6rem' }}>{section.title}</h2>
            <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.75 }}>{section.body}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #e8e6e2', padding: '2rem 2.5rem', display: 'flex', gap: '1.5rem' }}>
        <Link href="/terms" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Terms of Service</Link>
        <Link href="/" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Home</Link>
      </div>
    </div>
  )
}