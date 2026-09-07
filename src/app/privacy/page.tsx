import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './privacy.module.scss';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for the iPhone 18 Pro & Ultra concept site.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className={styles.container}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          ← Back to concept
        </Link>

        <h1 className={styles.heading}>Privacy Policy</h1>
        <p className={styles.updated}>Effective: September 4, 2026</p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Overview</h2>
          <p className={styles.body}>
            This is an <strong>unofficial concept project</strong> showcasing animation and design
            work. It does not collect, store, or process any personal data.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Data Collection</h2>
          <p className={styles.body}>
            We do <strong>not</strong> collect any personal information. This site:
          </p>
          <ul className={styles.list}>
            <li>Does not use analytics or tracking services</li>
            <li>Does not require user accounts or authentication</li>
            <li>Does not store cookies for tracking purposes</li>
            <li>Does not collect email addresses or contact information</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Hosting &amp; Infrastructure</h2>
          <p className={styles.body}>
            This site is hosted on <strong>Vercel</strong>. Vercel may collect standard server
            logs (IP addresses, browser types, timestamps) for infrastructure and security
            purposes. See{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              Vercel&rsquo;s Privacy Policy
            </a>{' '}
            for details on their data handling practices.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Cookies</h2>
          <p className={styles.body}>
            This site does not set any tracking or marketing cookies. Any cookies that may be set
            are strictly essential for the platform&rsquo;s operation (hosting infrastructure). See our{' '}
            <Link href="/cookies" className={styles.internalLink}>
              Cookie Notice
            </Link>{' '}
            for more information.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Third-Party Content</h2>
          <p className={styles.body}>
            The site may link to external resources (MacRumors, Apple reporting sources). We are
            not responsible for the privacy practices of external sites.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Your Rights</h2>
          <p className={styles.body}>
            Since we do not collect personal data, there is no personal information to access,
            correct, or delete. If you have questions or concerns, contact:{' '}
            <a href="mailto:aungmyatmoe.dev11@gmail.com" className={styles.externalLink}>
              aungmyatmoe.dev11@gmail.com
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Changes to This Policy</h2>
          <p className={styles.body}>
            Any updates to this policy will be reflected here with a new effective date.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Disclaimer</h2>
          <p className={styles.body}>
            <strong>Unofficial concept project.</strong> Not affiliated with, sponsored by, or
            endorsed by Apple Inc. All specifications shown are unconfirmed pre-release reporting.
          </p>
        </section>

        <footer className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            ← Return to concept
          </Link>
          <span className={styles.divider}>•</span>
          <Link href="/cookies" className={styles.footerLink}>
            Cookie Notice
          </Link>
          <span className={styles.divider}>•</span>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Use
          </Link>
        </footer>
      </div>
    </main>
  );
}
