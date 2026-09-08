import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './terms.module.scss';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for the iPhone 18 Pro & Ultra concept site.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className={styles.container}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          ← Back to concept
        </Link>

        <h1 className={styles.heading}>Terms of Use</h1>
        <p className={styles.updated}>Effective: September 4, 2026</p>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Overview</h2>
          <p className={styles.body}>
            This is an <strong>unofficial concept project</strong>. By accessing this site, you
            acknowledge and agree to these terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Disclaimer</h2>
          <p className={styles.body}>
            <strong>Not affiliated with Apple Inc.</strong> This project is not sponsored by,
            endorsed by, or officially connected to Apple Inc. All product names, trademarks, and
            registered trademarks are property of their respective owners.
          </p>
          <p className={styles.body}>
            All specifications, features, and device renders shown are:
          </p>
          <ul className={styles.list}>
            <li>Unofficial concept reconstructions</li>
            <li>Based on unconfirmed pre-release reporting</li>
            <li>Not announcements or official product information</li>
            <li>Graded by confidence level (official / high / developing / uncertain / concept)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>No Warranty</h2>
          <p className={styles.body}>
            This site and its content are provided <strong>&ldquo;as is&rdquo;</strong> without warranty of any
            kind, express or implied. We make no guarantees about:
          </p>
          <ul className={styles.list}>
            <li>Accuracy or reliability of information presented</li>
            <li>Availability or uptime of the site</li>
            <li>Fitness for any particular purpose</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Intellectual Property</h2>
          <p className={styles.body}>
            Original design, animation, and code work are the property of the project creator.
            Device renders and product concepts shown are original concept work for this recap.
          </p>
          <p className={styles.body}>
            Apple, iPhone, and related trademarks are the property of Apple Inc. Their use here is
            descriptive only — this is not an official product page.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Acceptable Use</h2>
          <p className={styles.body}>
            This site is intended for personal, non-commercial viewing. You may not:
          </p>
          <ul className={styles.list}>
            <li>Misrepresent this content as official Apple material</li>
            <li>Use automated tools to scrape or overload the site</li>
            <li>Attempt to circumvent security measures</li>
            <li>Redistribute assets without attribution</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>External Links</h2>
          <p className={styles.body}>
            This site links to third-party sources (MacRumors, reporting sites). We are not
            responsible for the content, accuracy, or practices of external sites.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Limitation of Liability</h2>
          <p className={styles.body}>
            To the fullest extent permitted by law, we are not liable for any damages arising from
            use of this site, including but not limited to direct, indirect, incidental, or
            consequential damages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Changes to Terms</h2>
          <p className={styles.body}>
            We reserve the right to update these terms at any time. Changes will be reflected here
            with a new effective date.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subheading}>Contact</h2>
          <p className={styles.body}>
            Questions or concerns about these terms? Contact:{' '}
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
          <Link href="/cookies" className={styles.footerLink}>
            Cookie Notice
          </Link>
        </footer>
      </div>
    </main>
  );
}
