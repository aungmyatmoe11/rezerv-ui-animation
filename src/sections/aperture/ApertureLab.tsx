'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';
import styles from './ApertureLab.module.scss';

/** Reported mechanical range: f/1.4 to f/4 is three full stops. */
const MIN_STOP = 1.4;
const STOPS = 3;
const BLADES = 9;

const fNumber = (t: number) => MIN_STOP * 2 ** ((STOPS * t) / 2);
const formatStop = (n: number) => n.toFixed(1);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Opening radius as a fraction of the ring. Diameter scales with 1/N; the
 * exponent is compressed so f/4 still reads as an opening, not a pinprick.
 */
const opening = (n: number) => 0.84 * (MIN_STOP / n) ** 0.55;

const PRESETS = [
  { t: 0, stop: '1.4' },
  { t: 1 / 3, stop: '2.0' },
  { t: 2 / 3, stop: '2.8' },
  { t: 1, stop: '4.0' },
] as const;

interface Scene {
  id: 'interior' | 'city';
  label: string;
  file: string;
  alt: string;
  /** Focus ellipse, as percentages of the frame. */
  focus: { x: number; y: number; rx: number; ry: number };
}

/**
 * Two Unsplash plates, chosen for receding depth rather than existing bokeh.
 * Wide-open is simulated by blurring the plate and masking a sharp copy over
 * the subject; stopping down grows that mask and lifts the blur.
 */
const SCENES: readonly Scene[] = [
  {
    id: 'interior',
    label: 'Low light',
    file: 'low-light.jpg',
    alt: 'A dim restaurant interior with tables receding into warm lights.',
    focus: { x: 38, y: 70, rx: 24, ry: 20 },
  },
  {
    id: 'city',
    label: 'City',
    file: 'city.jpg',
    alt: 'A river, a crowded stone bridge, and a castle on a far hill.',
    focus: { x: 50, y: 46, rx: 16, ry: 18 },
  },
];

const SIZES = '(max-width: 767px) 92vw, (max-width: 1023px) 86vw, 920px';

/**
 * Slider-driven aperture demo: a nine-blade iris, the rumoured f/1.4–f/4
 * range, and a photograph whose background defocuses as the iris opens.
 *
 * The visitor can drag the photograph, drag the slider, or tap a stop — three
 * ways into the same number. Everything that number touches is transform,
 * opacity, mask size, or a filter on the plate. No layout.
 *
 * It is labelled as a simulation on the frame itself, not just in the copy.
 */
export function ApertureLab() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [t, setT] = useState(0);
  const [sceneId, setSceneId] = useState<Scene['id']>('interior');
  const [used, setUsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const tRef = useRef(t);
  tRef.current = t;
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startT: number;
    locked: boolean;
  } | null>(null);

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]!;
  const n = fNumber(t);
  const label = formatStop(n);
  const open = opening(n);
  const blur = 22 * (1 - t) ** 1.35;
  const veil = 0.38 * t;
  const depth =
    t < 0.34 ? 'Shallow depth, more light' : t < 0.72 ? 'Balanced' : 'Deep focus, less light';

  const setAperture = (next: number) => {
    setT(clamp01(next));
    setUsed(true);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startT: tRef.current,
      locked: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.locked) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      g.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      setUsed(true);
    }
    const width = e.currentTarget.clientWidth || 1;
    setT(clamp01(g.startT + dx / width));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.locked && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    gesture.current = null;
    setDragging(false);
  };

  return (
    <div className={styles.lab} data-reveal data-used={used}>
      <div
        className={styles.viewfinder}
        data-dragging={dragging}
        style={
          {
            '--blur': `${blur.toFixed(2)}px`,
            '--veil': veil.toFixed(3),
            '--mask-x': `${scene.focus.x}%`,
            '--mask-y': `${scene.focus.y}%`,
            '--mask-rx': `${(scene.focus.rx + 30 * t).toFixed(1)}%`,
            '--mask-ry': `${(scene.focus.ry + 34 * t).toFixed(1)}%`,
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {SCENES.map((plate) => (
          <div
            key={plate.id}
            className={styles.plates}
            data-active={plate.id === scene.id}
            aria-hidden="true"
          >
            <div className={styles.plateWrap}>
              <Image
                className={styles.photo}
                src={`/img/aperture/${plate.file}`}
                alt=""
                fill
                sizes={SIZES}
                quality={82}
                priority={plate.id === 'interior'}
                draggable={false}
              />
            </div>
            <div className={styles.subjectWrap}>
              <Image
                className={styles.photo}
                src={`/img/aperture/${plate.file}`}
                alt={plate.id === scene.id ? plate.alt : ''}
                fill
                sizes={SIZES}
                quality={82}
                priority={plate.id === 'interior'}
                draggable={false}
              />
            </div>
          </div>
        ))}
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.focus} aria-hidden="true" />
        <p className={styles.hud} aria-hidden="true">
          <span>f/{label}</span>
          <span>{depth}</span>
        </p>
        <p className={styles.hint} aria-hidden="true">
          Drag across the photograph
        </p>
        <p className={styles.sim}>Illustrative simulation. Not captured on iPhone 18 Pro.</p>
      </div>

      <div className={styles.meta}>
        <div className={styles.iris}>
          <Iris id={id} open={open} />
          <p className={styles.readout} aria-hidden="true">
            <span className={styles.readoutF}>f/</span>
            <span className={styles.readoutN}>{label}</span>
          </p>
        </div>

        <div className={styles.controls}>
          <p className={styles.labEyebrow}>Try the rumoured range</p>
          <h3 className={styles.labTitle}>Open the iris. Watch the photograph.</h3>
          <label className={styles.sliderLabel}>
            <span className="visually-hidden">Aperture, as an f-number</span>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(t * 100)}
              onChange={(e) => setAperture(Number(e.currentTarget.value) / 100)}
              aria-valuetext={`f/${label}`}
            />
          </label>
          <div className={styles.stops}>
            {PRESETS.map((preset) => (
              <button
                key={preset.stop}
                type="button"
                className={styles.stop}
                data-active={Math.abs(t - preset.t) < 0.08}
                onClick={() => setAperture(preset.t)}
                aria-pressed={Math.abs(t - preset.t) < 0.08}
              >
                f/{preset.stop}
              </button>
            ))}
          </div>
          <div className={styles.ends} aria-hidden="true">
            <span>Wide open</span>
            <span>Stopped down</span>
          </div>
          <div className={styles.scenes} role="group" aria-label="Sample scene">
            {SCENES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.sceneBtn}
                data-active={option.id === scene.id}
                onClick={() => {
                  setSceneId(option.id);
                  setUsed(true);
                }}
                aria-pressed={option.id === scene.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className={styles.depth} aria-live="polite">
            f/{label}. {depth}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Iris({ id, open }: { id: string; open: number }) {
  const C = 120;
  const RING = 104;
  const BLADE = 240;
  const distance = BLADE + open * 92;

  return (
    <svg viewBox="0 0 240 240" className={styles.irisSvg} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={C} cy={C} r={RING} />
        </clipPath>
        <radialGradient id={`${id}-glass`} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor="#6b8fc2" />
          <stop offset="0.42" stopColor="#1d2b47" />
          <stop offset="1" stopColor="#05070c" />
        </radialGradient>
        <linearGradient id={`${id}-blade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2d2d33" />
          <stop offset="1" stopColor="#0e0e11" />
        </linearGradient>
      </defs>

      <circle cx={C} cy={C} r={114} fill="#0a0a0c" stroke="rgba(237, 234, 228, 0.16)" />
      <circle cx={C} cy={C} r={RING} fill={`url(#${id}-glass)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {Array.from({ length: BLADES }, (_, i) => (
          <circle
            key={i}
            r={BLADE}
            fill={`url(#${id}-blade)`}
            stroke="rgba(0, 0, 0, 0.8)"
            strokeWidth={1.5}
            transform={`rotate(${(i * 360) / BLADES} ${C} ${C}) translate(${C + distance} ${C})`}
          />
        ))}
      </g>
      <circle cx={C} cy={C} r={RING} fill="none" stroke="rgba(237, 234, 228, 0.22)" />
    </svg>
  );
}
