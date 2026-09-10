'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { scrollToTop } from '@/lib/motion/scrollTo';
import { ENDING, SOURCE_TIMELINE, SOURCES } from '@/data/duo';
import { EventStage } from './EventStage';
import styles from './Ending.module.scss';

/**
 * Section 20 — the close: how the reconstruction was assembled, then where it
 * came from.
 *
 * The event date is the only genuinely Official item on the whole page, so it
 * is the one node that gets that badge — and the one thing the page can hand
 * over live, which is why the section now ends on the stream itself rather than
 * on a link out to it. Every timeline node links to the reporting behind it
 * rather than asserting a month on its own authority.
 */
export function Ending() {
  return (
    <Section id="sources" rhythm="loose">
      <SectionHead
        eyebrow="From rumour to reconstruction"
        title={ENDING.title}
        lede={ENDING.body}
        badge={
          <ConfidenceBadge level="official" size="sm">
            September 9 — confirmed
          </ConfidenceBadge>
        }
      />

      <ol className={styles.timeline} aria-label="How the reporting accumulated">
        {SOURCE_TIMELINE.map((node, i) => (
          <li
            key={node.month}
            className={styles.node}
            data-reveal
            data-final={i === SOURCE_TIMELINE.length - 1}
          >
            <a
              className={styles.nodeLink}
              href={node.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.month}>{node.month}</span>
              <span className={styles.what}>{node.what}</span>
            </a>
          </li>
        ))}
      </ol>

      <div className={styles.event}>
        <EventStage />
      </div>

      <div className={styles.close}>
        <div className={styles.sources} data-reveal>
          <p className={styles.sourcesLead}>Every claim on this page traces back here</p>
          <ul className={styles.sourceList}>
            {SOURCES.map((source) => (
              <li key={source.href + source.label}>
                <a
                  className={styles.source}
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.sourceKind}>{source.kind}</span>
                  <span className={styles.sourceLabel}>{source.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.provenance}>
            Moving images are original concept renders produced for this project, not third-party
            footage. The links above are the written reporting the content is built from.
          </p>
        </div>

        <div className={styles.actions} data-reveal>
          <a
            className={styles.ctaGhost}
            href="#top"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              scrollToTop();
            }}
          >
            Back to the top
          </a>
        </div>
      </div>
    </Section>
  );
}
