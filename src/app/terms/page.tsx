// src/app/terms/page.tsx
import Link from 'next/link'

export default function TermsPage() {
  const sections = [
    {
      id: '',
      title: '1. Acceptance of Terms',
      body: `By creating an account or using UGCAffiliates.com ("the Platform," "we," "us," or "UGCA"), you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, do not use the Platform. These terms apply to all users — vendors, affiliates, and visitors.`
    },
    {
      id: '',
      title: '2. What UGCAffiliates Is',
      body: `UGCAffiliates is an affiliate marketing marketplace that connects product vendors with content creators and affiliate marketers ("affiliates"). Vendors list their products and set commission rates. Affiliates promote those products using unique tracking links and earn commissions on confirmed sales.\n\nUGCAffiliates is a technology platform and marketplace intermediary. We are not a party to any transaction between vendors and their customers. We facilitate the relationship between vendors and affiliates, process commission payouts via Stripe Connect, and collect a 10% platform fee on each confirmed sale.`
    },
    {
      id: '',
      title: '3. Account Registration',
      body: `You must be at least 18 years old to create an account. You agree to provide accurate, complete, and current information and to keep it updated. You are responsible for maintaining the security of your password and account. You may not share your account credentials with others. UGCA reserves the right to suspend or terminate accounts that violate these terms.`
    },
    {
      id: 'vendors',
      title: '4. Vendor Terms',
      body: `Vendors may list products on the Platform free of charge. By listing a product, you agree to:\n\n• Provide accurate product descriptions, pricing, and commission rates (minimum 5%, maximum 70%)\n• Implement the UGCA conversion tracking pixel or server-side postback on your order confirmation page\n• Connect a valid payment method via Stripe to enable automatic affiliate payouts\n• Review and approve or dispute conversions within a reasonable timeframe\n• Pay affiliates their earned commissions promptly upon approving a conversion\n• Pay UGCA a 10% platform fee on each confirmed sale, automatically charged to your card on file\n\nVendors are responsible for the accuracy of their product listings and compliance with all applicable laws, including consumer protection and advertising regulations. UGCA reserves the right to remove any product listing that violates these terms or is otherwise inappropriate for the marketplace.`
    },
    {
      id: 'affiliates',
      title: '5. Affiliate Terms',
      body: `Affiliates may join the Platform free of charge. Approved affiliates receive unique tracking links and access to vendor-supplied marketing assets including product images, promo videos, and AI-generated content. By participating as an affiliate, you agree to:\n\n• Promote products honestly and in accordance with each vendor's brand guidelines and prohibited terms\n• Clearly disclose your affiliate relationship in accordance with FTC guidelines and applicable law\n• Not use spam, misleading advertising, false claims, or deceptive tactics\n• Not generate fake clicks, bot traffic, or fraudulent conversions\n• Connect a valid Stripe account to receive automatic commission payouts\n• Only promote products you have been approved to promote\n\nAffiliates are independent contractors, not employees or agents of UGCA or any vendor.`
    },
    {
      id: 'payments',
      title: '6. Stripe Connect & Payments',
      body: `UGCA uses Stripe Connect to facilitate automatic payments between vendors and affiliates. By using the payment features of this Platform:\n\n• Vendors agree to Stripe's Terms of Service and authorize UGCA to charge their saved payment method for approved commissions plus the 10% platform fee\n• Affiliates agree to Stripe's Connected Account Agreement and authorize UGCA to transfer earned commissions to their connected Stripe account\n• Commission transfers are initiated automatically when a vendor clicks "Approve & Pay" on a conversion\n• Payouts typically arrive in the affiliate's bank account within 2–7 business days depending on Stripe's payout schedule\n• UGCA retains the 10% platform fee from each transaction automatically\n• Payment disputes, chargebacks, or failed payments are handled in accordance with Stripe's policies\n\nUGCA is not responsible for delays or failures caused by Stripe, banking institutions, or incorrect account information provided by users.`
    },
    {
      id: 'tracking',
      title: '7. Conversion Tracking',
      body: `UGCA tracks affiliate referrals using first-party cookies and/or server-side postback requests. When a buyer clicks an affiliate link, a tracking code ("ugca_ref") is set as a URL parameter and cookie on the vendor's site. This cookie persists for the vendor's specified cookie window (default 30 days).\n\nVendors are responsible for correctly implementing the UGCA tracking pixel or postback URL on their order confirmation page. UGCA is not responsible for lost conversions due to:\n\n• Cookie deletion or browser privacy settings\n• Ad blockers or tracking prevention software\n• Incorrect pixel or postback implementation by the vendor\n• Cross-device purchases where the original cookie is not present\n\nIP addresses associated with conversions are stored as irreversible SHA-256 hashes for fraud detection purposes only.`
    },
    {
      id: '',
      title: '8. Commission Disputes',
      body: `Vendors may dispute conversions they believe are fraudulent or invalid. Disputed conversions are flagged for review. UGCA may assist in resolving disputes but is not obligated to adjudicate payment disputes between vendors and affiliates. Vendors who repeatedly fail to pay valid commissions may have their account suspended. Affiliates who generate fraudulent conversions will be permanently banned.`
    },
    {
      id: 'assets',
      title: '9. Marketing Assets & Content',
      body: `Vendors may upload product images, promotional videos (MP4), and provide brand guidelines for affiliate use. These assets are made available exclusively to approved affiliates for the purpose of promoting the vendor's products. Affiliates may not:\n\n• Use vendor assets for any purpose other than promoting the approved product\n• Modify vendor assets in ways that misrepresent the product or brand\n• Share access to gated assets with unapproved third parties\n\nVendors retain all intellectual property rights to their uploaded assets. By uploading content to the Platform, vendors grant UGCA a limited license to store, display, and deliver that content to approved affiliates.`
    },
    {
      id: 'installation',
      title: '10. Installation Services',
      body: `UGCA offers optional installation assistance to help vendors set up conversion tracking on their Shopify, WooCommerce, or custom stores. This is a paid service offered separately from Platform access. To inquire about installation services, please contact us via our Contact page. Installation services are subject to separate service agreements.`
    },
    {
      id: '',
      title: '11. Prohibited Conduct',
      body: `Users may not:\n\n• Use the Platform for any fraudulent, illegal, or deceptive purpose\n• Generate fake clicks, bot traffic, or artificial conversions\n• Attempt to circumvent or manipulate the tracking or payment systems\n• Violate any applicable laws including FTC disclosure requirements, GDPR, CCPA, or CAN-SPAM\n• Infringe on the intellectual property rights of vendors, affiliates, or third parties\n• Harass, threaten, or abuse other users\n• Upload malicious code or attempt to compromise Platform security\n• Create multiple accounts to circumvent bans or restrictions\n\nViolation of these prohibitions may result in immediate account termination and potential legal action.`
    },
    {
      id: 'fees',
      title: '12. Platform Fees',
      body: `UGCA charges vendors a 10% platform fee on each confirmed and paid affiliate sale. This fee is automatically deducted at the time of payout — vendors are charged the commission amount plus the platform fee, and the commission is transferred directly to the affiliate. There are no monthly subscription fees. Vendors only pay when affiliates generate confirmed sales.`
    },
    {
      id: '',
      title: '13. Intellectual Property',
      body: `The UGCAffiliates Platform, including its design, software, trademarks, and content, is owned by HONNYDO LLC d/b/a. Users may not copy, reproduce, or create derivative works from the Platform without written permission. Users retain ownership of content they submit but grant UGCA a worldwide, royalty-free license to use that content to operate the Platform.`
    },
    {
      id: '',
      title: '14. Termination',
      body: `Either party may terminate their account at any time. UGCA may suspend or terminate any account immediately for violations of these terms. Upon termination, your access to the Platform ceases. Any pending commissions at the time of termination will be handled in accordance with Stripe's policies. UGCA is not liable for any losses resulting from account termination.`
    },
    {
      id: '',
      title: '15. Disclaimers & Limitation of Liability',
      body: `The Platform is provided "as is" without warranties of any kind, express or implied. UGCA does not warrant that the Platform will be error-free, uninterrupted, or free of viruses. To the maximum extent permitted by law, UGCA's total liability for any claims arising from your use of the Platform shall not exceed the greater of (a) $100 or (b) the amount you paid to UGCA in the 3 months preceding the claim. UGCA is not liable for indirect, incidental, punitive, or consequential damages.`
    },
    {
      id: 'legal',
      title: '16. Governing Law',
      body: `These Terms are governed by the laws of the State of Arizona, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Maricopa County, Arizona. You waive any objection to jurisdiction or venue in such courts.`
    },
    {
      id: '',
      title: '17. Changes to These Terms',
      body: `UGCA reserves the right to update these Terms at any time. Material changes will be communicated via email to registered users. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms. The "Last updated" date at the top of this page reflects the most recent revision.`
    },
    {
      id: '',
      title: '18. Contact',
      body: `For questions about these Terms, please contact us via our Contact page at ugcaffiliates.com/contact or email legal@ugcaffiliates.com. For installation service inquiries, visit our Contact page.`
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Contact</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '1rem' }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '0.5rem' }}>Last updated: May 2026</p>
        <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '3rem', lineHeight: 1.7 }}>
          These Terms govern your use of UGCAffiliates, operated by HONNYDO LLC d/b/a. Please read them carefully before creating an account.
        </p>

        {/* Quick nav */}
        <div style={{ background: '#f9f8f6', border: '1px solid #e8e6e2', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '3rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.75rem' }}>Jump to section</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { label: 'Vendors',      href: '#vendors' },
              { label: 'Affiliates',   href: '#affiliates' },
              { label: 'Payments',     href: '#payments' },
              { label: 'Tracking',     href: '#tracking' },
              { label: 'Assets',       href: '#assets' },
              { label: 'Installation', href: '#installation' },
              { label: 'Fees',         href: '#fees' },
              { label: 'Legal',        href: '#legal' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: '12px', background: '#ffffff', border: '1px solid #e8e6e2', borderRadius: '3px', padding: '0.25rem 0.6rem', color: '#3a3a3a', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        {sections.map(section => (
          <div
            key={section.title}
            id={section.id || undefined}
            style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid #f2f0ec', scrollMarginTop: '88px' }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0d0d0d', marginBottom: '0.75rem' }}>{section.title}</h2>
            {section.body.split('\n').map((para, i) => (
              para.trim() ? (
                <p key={i} style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.8, marginBottom: '0.75rem' }}>{para}</p>
              ) : <div key={i} style={{ height: '0.25rem' }} />
            ))}
          </div>
        ))}

        {/* Installation CTA */}
        <div style={{ background: '#0d0d0d', borderRadius: '6px', padding: '1.75rem', textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>Need help setting up tracking?</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '1.25rem' }}>We offer professional installation services for Shopify, WooCommerce, and custom stores.</div>
          <Link href="/contact" style={{ fontSize: '13px', fontWeight: 600, color: '#0d0d0d', background: '#ffffff', padding: '0.65rem 1.5rem', borderRadius: '3px', textDecoration: 'none', display: 'inline-block' }}>
            Contact us →
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '2rem 2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/privacy" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link href="/contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Contact</Link>
        <Link href="/" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Home</Link>
      </footer>
    </div>
  )
}