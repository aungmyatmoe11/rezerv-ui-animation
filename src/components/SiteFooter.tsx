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
        {/* `prefetch={false}` on all three: the default prefetch fires as soon
            as the footer scrolls into view and pulls each legal route's CSS
            chunk with `rel="preload"`. Nobody reaches the bottom of a 40,000px
            page to read the cookie notice, so those three requests went unused
            and the console said so — one "preloaded but not used within a few
            seconds" per link, every load. The pages are a few KB; they can be
            fetched when someone actually clicks. */}
        <ul className={styles.legalLinks}>
          <li>
            <Link href="/privacy" className={styles.legalLink} prefetch={false}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className={styles.legalLink} prefetch={false}>
              Cookie Notice
            </Link>
          </li>
          <li>
            <Link href="/terms" className={styles.legalLink} prefetch={false}>
              Terms of Use
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
