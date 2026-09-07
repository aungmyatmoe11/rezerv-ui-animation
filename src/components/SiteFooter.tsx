import Link from 'next/link';
import { DISCLAIMER } from '@/data/sections';
import styles from './SiteFooter.module.scss';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <p className={styles.heading}>Unofficial concept project</p>
        <p className={styles.body}>{DISCLAIMER}</p>
        <ul className={styles.links}>
          <li>
            <a
              className={styles.link}
              href="https://www.macrumors.com/roundup/iphone-18-pro/"
              target="_blank"
              rel="noopener noreferrer"
            >
              MacRumors &mdash; iPhone 18 Pro roundup
            </a>
          </li>
          <li>
            <a
              className={styles.link}
              href="https://www.macrumors.com/roundup/iphone-fold/"
              target="_blank"
              rel="noopener noreferrer"
            >
              MacRumors &mdash; iPhone Fold roundup
            </a>
          </li>
        </ul>
        <ul className={styles.legalLinks}>
          <li>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className={styles.legalLink}>
              Cookie Notice
            </Link>
          </li>
          <li>
            <Link href="/terms" className={styles.legalLink}>
              Terms of Use
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
