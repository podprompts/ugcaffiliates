// src/app/privacy/page.tsx
import Link from 'next/link'

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Who We Are',
      body: `UGCAffiliates is operated by HONNYDO LLC d/b/a AI Digital Products ("UGCA," "we," "us," or "our"), based in Tempe, Arizona. We operate the affiliate marketing marketplace at ugcaffiliates.com.\n\nThis Privacy Policy explains how we collect, use, store, and protect your personal information when you use our Platform. By using UGCAffiliates, you agree to the practices described here.`
    },
    {
      title: '2. Information We Collect',
      body: `We collect the following categories of information:\n\n**Account Information:** When you register, we collect your name, email address, and role (vendor or affiliate). Vendors additionally provide business information and payment method details via Stripe.\n\n**Profile Data:** Full name, business name, website URL, and bio information you choose to provide.\n\n**Payment & Financial Data:** We do not store full credit card numbers. Payment information is collected and stored by Stripe, Inc. We store Stripe customer IDs, Connect account IDs, and payout status. See Stripe's Privacy Policy at stripe.com/privacy.\n\n**Conversion & Tracking Data:** When a sale is attributed to an affiliate, we record the order ID, sale amount, commission amount, platform fee, affiliate tracking code, and the referring page URL. IP addresses are stored as irreversible SHA-256 hashes for fraud detection — we never store raw IP addresses.\n\n**Usage Data:** Pages visited, clicks, time on page, and interactions with the Platform.\n\n**Communications:** Messages you send us via the contact form, and emails we send you.`
    },
    {
      title: '3. Affiliate Tracking & Cookies',
      body: `When a buyer clicks an affiliate link (e.g., ugcaffiliates.com/go/XXXX), our system:\n\n1. Records the click against the affiliate's tracking link\n2. Redirects the buyer to the vendor's product page with a "?ugca_ref=XXXX" URL parameter\n3. The vendor's tracking pixel or postback reads this parameter and records it\n\nThe tracking code may be stored as a cookie on the vendor's website (not ours) for the duration of the vendor's specified cookie window (typically 30 days). UGCA itself sets no persistent tracking cookies on visitors to ugcaffiliates.com beyond what is necessary for session authentication.\n\nBuyers who wish to opt out of affiliate tracking may do so by deleting cookies or using browser privacy settings. This will not affect their ability to browse or purchase but will prevent commission attribution to affiliates.`
    },
    {
      title: '4. How We Use Your Information',
      body: `We use the information we collect to:\n\n• Create and manage your account\n• Process and facilitate affiliate commission payouts via Stripe Connect\n• Charge vendors for platform fees via their saved payment method\n• Track and attribute affiliate conversions accurately\n• Send transactional emails (account confirmations, payout notifications, application approvals, platform fee invoices)\n• Notify vendors of new affiliate applications\n• Notify affiliates when they are approved or paid\n• Detect and prevent fraud, fake conversions, and platform abuse\n• Operate the daily payout cron job that advances approved commissions\n• Respond to support requests submitted via our contact form\n• Improve the Platform based on usage patterns\n• Comply with legal obligations`
    },
    {
      title: '5. Information Sharing',
      body: `We do not sell, rent, or trade your personal information. We share information only in the following circumstances:\n\n**Stripe:** We share payment information with Stripe, Inc. to process vendor charges and affiliate payouts. Stripe is a PCI-DSS Level 1 certified payment processor. See stripe.com/privacy.\n\n**Resend:** We use Resend to send transactional emails. Resend receives email addresses and email content necessary to deliver messages.\n\n**Vercel:** Our Platform is hosted on Vercel. Server logs and request data may pass through Vercel's infrastructure.\n\n**Supabase:** Our database is hosted on Supabase (PostgreSQL). All user data is stored in Supabase with row-level security policies.\n\n**Cloudflare R2:** Product images and promotional videos uploaded by vendors are stored in Cloudflare R2 object storage and served via our CDN at cdn.ugcaffiliates.com.\n\n**Between Vendors and Affiliates:** When an affiliate applies to promote a product, the vendor is notified. When a conversion is paid, the affiliate receives a payout notification. We do not share full contact details between vendors and affiliates without consent.\n\n**Legal Requirements:** We may disclose information if required by law, court order, or to protect the rights, property, or safety of UGCA, our users, or the public.`
    },
    {
      title: '6. Data Storage & Security',
      body: `Your data is stored on servers located in the United States (Supabase West US region, Vercel, Cloudflare).\n\nWe implement the following security measures:\n\n• All connections use TLS/HTTPS encryption\n• Database access is protected by row-level security (RLS) policies — users can only access their own data\n• Passwords are hashed using bcrypt via Supabase Auth\n• IP addresses are stored as SHA-256 hashes — they cannot be reversed\n• API endpoints require authentication tokens for all sensitive operations\n• Per-vendor postback secrets are unique and randomly generated\n• Stripe handles all payment card data — we never see or store full card numbers\n\nDespite these measures, no system is 100% secure. If you believe your account has been compromised, contact us immediately at hello@ugcaffiliates.com.`
    },
    {
      title: '7. Vendor-Uploaded Content',
      body: `Vendors may upload product images (JPG, PNG, WebP up to 50MB) and promotional videos (MP4, MOV, WebM up to 2GB) to our Cloudflare R2 storage. This content is:\n\n• Stored at cdn.ugcaffiliates.com\n• Made available to approved affiliates for promotional purposes\n• Product images are publicly accessible (used for marketplace display)\n• Promo videos and AI-generated affiliate assets are restricted to approved affiliates only\n\nVendors may remove their uploaded content at any time by deleting or replacing it in their product settings. Removed content will no longer be accessible to affiliates.`
    },
    {
      title: '8. Email Communications',
      body: `We send the following types of emails via Resend:\n\n• Welcome emails when you create an account\n• Vendor application approval or rejection notifications\n• New affiliate application notifications to vendors\n• Commission payout confirmations to affiliates\n• Platform fee invoices to vendors\n• Failed payment alerts to vendors\n• Contact form auto-replies and admin notifications\n• Daily payout cron summary emails to admin\n\nThese are transactional emails required to operate the Platform. You cannot opt out of transactional emails while maintaining an active account. We do not send marketing or promotional emails without explicit consent.`
    },
    {
      title: '9. Data Retention',
      body: `We retain data for the following periods:\n\n• Account information: retained while your account is active, plus 90 days after deletion request\n• Conversion and commission records: retained for 7 years for tax and accounting compliance\n• Uploaded product images and videos: retained until you delete or replace them\n• Contact form submissions: retained for 2 years\n• Hashed IP addresses: retained for 90 days for fraud detection\n• Stripe payment records: subject to Stripe's data retention policies\n\nYou may request deletion of your account and personal data at any time. Some data (e.g., financial transaction records) may be retained longer as required by law.`
    },
    {
      title: '10. Your Rights',
      body: `Depending on your location, you may have the following rights regarding your personal data:\n\n• **Access:** Request a copy of the personal information we hold about you\n• **Correction:** Request that we correct inaccurate or incomplete information\n• **Deletion:** Request deletion of your personal data, subject to legal retention requirements\n• **Portability:** Request your data in a machine-readable format\n• **Objection:** Object to certain types of processing\n• **Withdrawal of consent:** Where processing is based on consent, withdraw it at any time\n\nTo exercise any of these rights, contact us at privacy@ugcaffiliates.com or via our Contact page. We will respond within 30 days. California residents may have additional rights under the CCPA. EU/UK residents may have rights under GDPR.`
    },
    {
      title: '11. Children\'s Privacy',
      body: `UGCAffiliates is intended for users 18 years of age and older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has created an account, please contact us at hello@ugcaffiliates.com and we will promptly delete the account and any associated data.`
    },
    {
      title: '12. Third-Party Links',
      body: `The Platform contains links to vendor product pages and external websites. These sites have their own privacy policies and we are not responsible for their practices. Clicking an affiliate link will take you to a third-party vendor's website — that site's privacy policy governs data collected there.`
    },
    {
      title: '13. Changes to This Policy',
      body: `We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify registered users of material changes via email at least 14 days before they take effect. The "Last updated" date at the top of this page will always reflect the most recent revision. Continued use of the Platform after changes take effect constitutes acceptance of the updated policy.`
    },
    {
      title: '14. Contact Us',
      body: `For privacy-related questions, requests, or concerns:\n\nHONNYDO LLC d/b/a AI Digital Products\nTempe, Arizona, United States\nEmail: privacy@ugcaffiliates.com\nContact form: ugcaffiliates.com/contact\n\nFor general support, visit our Contact page.`
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e8e6e2', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', color: '#0d0d0d' }}>U G C A</Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Contact</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '1rem' }}>Legal</div>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '0.5rem' }}>Last updated: May 2026</p>
        <p style={{ fontSize: '13px', color: '#3a3a3a', marginBottom: '3rem', lineHeight: 1.7 }}>
          Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, and how we protect it. We do not sell your data. Ever.
        </p>

        {sections.map(section => (
          <div key={section.title} style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid #f2f0ec' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0d0d0d', marginBottom: '0.75rem' }}>{section.title}</h2>
            {section.body.split('\n').map((para, i) => (
              para.trim() ? (
                <p key={i} style={{ fontSize: '14px', color: '#3a3a3a', lineHeight: 1.8, marginBottom: '0.75rem' }}>{para}</p>
              ) : <div key={i} style={{ height: '0.25rem' }} />
            ))}
          </div>
        ))}
      </div>

      <footer style={{ borderTop: '1px solid #e8e6e2', padding: '2rem 2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/terms" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Terms of Service</Link>
        <Link href="/contact" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Contact</Link>
        <Link href="/" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>Home</Link>
      </footer>
    </div>
  )
}