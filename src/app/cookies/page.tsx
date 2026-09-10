import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './cookies.module.scss';

export const metadata: Metadata = {
  title: 'Cookie Notice',
  description: 'Cookie policy for the iPhone 18 Pro & Duo concept site.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <main className={styles.container}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          ← Back to concept
        </Link>

        <h1 className={styles.heading}>Cookie Notice</h1>
        <p className={styles.updated}>Effective: September 4, 2026</p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>What Are Cookies</h2>
          <p className={styles.body}>
            Cookies are small text files stored by your browser. They can be used for tracking,
            personalization, or essential site functionality.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Our Cookie Policy</h2>
          <p className={styles.body}>
            <strong>This site does not set any tracking or analytics cookies.</strong>
          </p>
          <p className={styles.body}>
            We do not use cookies for:
          </p>
          <ul className={styles.list}>
            <li>Analytics or usage tracking</li>
            <li>Marketing or advertising</li>
            <li>User profiling or behavioral targeting</li>
            <li>Social media integration</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Platform Cookies</h2>
          <p className={styles.body}>
            The hosting platform (Vercel) may set <strong>essential cookies</strong> required for
            infrastructure operation, such as load balancing or security. These are not used for
            tracking.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Session Storage</h2>
          <p className={styles.body}>
            The site uses browser <code>sessionStorage</code> (not cookies) to remember whether
            you&rsquo;ve seen the loading screen during your current visit. This data:
          </p>
          <ul className={styles.list}>
            <li>Stays in your browser (never sent to a server)</li>
            <li>Is automatically cleared when you close the tab</li>
            <li>Contains no personal information</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>No Consent Banner Required</h2>
          <p className={styles.body}>
            Because we do not track visitors or use marketing cookies, this site does not require a
            cookie consent banner under GDPR or similar regulations.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Questions</h2>
          <p className={styles.body}>
            For questions about cookies or privacy, contact:{' '}
            <a href="mailto:aungmyatmoe.dev11@gmail.com" className={styles.externalLink}>
              aungmyatmoe.dev11@gmail.com
            </a>
          </p>
        </section>

        <footer className={styles.footer}>
          <Link href="/" className={styles.footerLink}>
            ← Return to concept
          </Link>
          <span className={styles.divider}>•</span>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
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
