// src/app/terms/page.tsx

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#888', marginBottom: '1rem' }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '3rem' }}>Last updated: May 2026</p>

        {[
          { title: '1. Acceptance of Terms', body: 'By accessing or using UGCAffiliates ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. These terms apply to all users, including vendors, affiliates, and visitors.' },
          { title: '2. Platform Description', body: 'UGCAffiliates is an affiliate marketing platform that connects vendors with affiliate marketers. Vendors list products and set commission rates. Affiliates promote products and earn commissions on confirmed sales. UGCAffiliates facilitates this relationship but is not party to any transaction between vendors and buyers.' },
          { title: '3. Vendor Terms', body: 'Vendors must subscribe to an active paid plan to list products. Vendors are responsible for the accuracy of product listings, setting commission rates within platform limits (5%–70%), and paying affiliates directly for confirmed sales. Vendors must implement the conversion tracking snippet correctly. UGCAffiliates charges a 4% platform fee on confirmed sales in addition to the monthly subscription.' },
          { title: '4. Affiliate Terms', body: 'Affiliates may join the platform free of charge. Affiliates agree to promote products honestly and in accordance with each vendor\'s brand guidelines. Affiliates may not use prohibited promotion methods including spam, false claims, or misleading advertising. Affiliates are paid directly by vendors and UGCAffiliates is not responsible for payment disputes between vendors and affiliates.' },
          { title: '5. Prohibited Conduct', body: 'Users may not: use the platform for fraudulent purposes; generate fake clicks or conversions; violate any applicable laws; infringe on intellectual property rights; harass other users; attempt to circumvent platform tracking or payment systems; or use the platform in any way that could damage UGCAffiliates or its users.' },
          { title: '6. Commission Tracking', body: 'UGCAffiliates uses cookie-based tracking with a default 30-day window. Commission amounts are calculated and frozen at the time of conversion. UGCAffiliates does not guarantee the accuracy of tracking in all circumstances and is not responsible for lost commissions due to cookie deletion, ad blockers, or other technical factors.' },
          { title: '7. Payments', body: 'Vendors pay affiliates directly via mutually agreed payment methods. UGCAffiliates is not responsible for payment disputes, late payments, or non-payment by vendors. Subscription fees are charged monthly and are non-refundable except as required by law. UGCAffiliates reserves the right to change pricing with 30 days notice.' },
          { title: '8. Intellectual Property', body: 'All content on the Platform, including but not limited to text, graphics, logos, and software, is the property of UGCAffiliates or its licensors. Users retain ownership of content they submit but grant UGCAffiliates a license to use such content to operate the Platform.' },
          { title: '9. Termination', body: 'UGCAffiliates may terminate or suspend any account at any time for violation of these terms. Vendors may cancel their subscription at any time; access continues until the end of the billing period. Upon termination, your right to use the Platform ceases immediately.' },
          { title: '10. Limitation of Liability', body: 'UGCAffiliates is provided "as is" without warranties of any kind. To the maximum extent permitted by law, UGCAffiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.' },
          { title: '11. Changes to Terms', body: 'UGCAffiliates reserves the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. Material changes will be communicated via email.' },
          { title: '12. Contact', body: 'For questions about these terms, contact us at legal@ugcaffiliates.com.' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.6rem' }}>{section.title}</h2>
            <p style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.75 }}>{section.body}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #e8e6e2', padding: '2rem 2.5rem', display: 'flex', gap: '1.5rem' }}>
        <Link href="/privacy" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Home</Link>
      </div>
    </div>
  )
}