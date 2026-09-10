'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { APPLE_EVENT } from '@/data/duo';
import { EventTheatre } from './EventTheatre';
import styles from './EventStage.module.scss';

type EventStatus = 'upcoming' | 'live' | 'ended';

interface Countdown {
  status: EventStatus;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const START_MS = Date.parse(APPLE_EVENT.startsAt);
/** A keynote runs well under this. Generous, so a long stream is never called over. */
const LIVE_WINDOW_MS = 150 * 60 * 1000;

const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: 'Scheduled',
  live: 'Live now',
  ended: 'Replay available',
};

function read(now: number): Countdown {
  const delta = START_MS - now;
  const total = Math.max(0, Math.floor(delta / 1000));

  return {
    status: delta > 0 ? 'upcoming' : now < START_MS + LIVE_WINDOW_MS ? 'live' : 'ended',
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Null until the first client tick, on purpose.
 *
 * The countdown and the local start time are both functions of the reader's
 * clock and timezone, which the server does not have. Rendering them during SSR
 * would be a hydration mismatch, so the markup ships with placeholders that
 * occupy the same space and fill in a frame later.
 */
function useCountdown(intervalMs: number): Countdown | null {
  const [state, setState] = useState<Countdown | null>(null);

  useEffect(() => {
    const tick = () => setState(read(Date.now()));
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return state;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The marquee for the one genuinely official thing on the page.
 *
 * The section used to end on a text link that threw the reader out to
 * apple.com. It ends on the event itself now: state, a live countdown, and the
 * stream in a modal theatre rather than a fourth tab.
 *
 * Reduced motion still gets the countdown — it is information, not decoration —
 * but it ticks once a minute and drops the seconds column, so the page holds
 * still for a reader who asked it to.
 */
export function EventStage() {
  const policy = useMotionPolicy();
  const showSeconds = policy.tier !== 'static';
  const countdown = useCountdown(showSeconds ? 1000 : 60_000);
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<string>(APPLE_EVENT.whenFallback);

  useEffect(() => {
    const local = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(APPLE_EVENT.startsAt));
    setWhen(`${local} — your local time`);
  }, []);

  const status = countdown?.status ?? 'upcoming';
  const statusLabel = STATUS_LABEL[status];

  const openTheatre = useCallback(() => setOpen(true), []);
  const closeTheatre = useCallback(() => setOpen(false), []);

  const cells: readonly { label: string; value: string }[] = [
    { label: 'Days', value: countdown ? String(countdown.days) : '––' },
    { label: 'Hrs', value: countdown ? pad(countdown.hours) : '––' },
    { label: 'Min', value: countdown ? pad(countdown.minutes) : '––' },
    ...(showSeconds ? [{ label: 'Sec', value: countdown ? pad(countdown.seconds) : '––' }] : []),
  ];

  return (
    <div className={styles.stage} data-status={status} data-reveal>
      <button type="button" className={styles.poster} onClick={openTheatre}>
        <span className={styles.posterGlow} aria-hidden="true" />
        <span className={styles.marquee} aria-hidden="true">
          {APPLE_EVENT.channel} &middot; YouTube Live
        </span>

        <span className={styles.play} aria-hidden="true">
          <span className={styles.playRing} />
          <span className={styles.playGlyph} />
        </span>

        <span className={styles.posterCopy}>
          <span className={styles.tagline}>{APPLE_EVENT.tagline}</span>
          <span className={styles.posterCta}>
            {status === 'ended' ? 'Watch the replay' : 'Watch the event'}
          </span>
        </span>
      </button>

      <div className={styles.info}>
        <p className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {statusLabel}
        </p>

        <h3 className={styles.title}>{APPLE_EVENT.title}</h3>
        <p className={styles.when}>{when}</p>

        {status === 'upcoming' ? (
          <ol
            className={styles.countdown}
            aria-label={
              countdown
                ? `Starts in ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes`
                : 'Countdown to the event'
            }
          >
            {cells.map((cell) => (
              <li key={cell.label} className={styles.cell}>
                <span className={styles.value}>{cell.value}</span>
                <span className={styles.unit}>{cell.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.note}>
            {status === 'live'
              ? 'The stream is running. Everything below was written before it started.'
              : 'The event has aired. Everything on this page was written before it did.'}
          </p>
        )}

        <a
          className={styles.out}
          href={APPLE_EVENT.watchHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on YouTube <span aria-hidden="true">↗</span>
        </a>
      </div>

      <EventTheatre open={open} onClose={closeTheatre} status={statusLabel} when={when} />
    </div>
  );
}
