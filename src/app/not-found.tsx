import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './not-found.module.scss';

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={styles.container}>
      <div className={styles.shell}>
        <p className={styles.code}>404</p>
        <h1 className={styles.heading}>Page Not Found</h1>
        <p className={styles.body}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className={styles.link}>
          Return to iPhone 18 Pro concept
        </Link>
      </div>
    </main>
  );
}
