'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import styles from './ApertureLab.module.scss';

/** Reported mechanical range: f/1.4 to f/4 is three full stops. */
const MIN_STOP = 1.4;
const STOPS = 3;
const BLADES = 9;

/** Iris geometry. Module scope so the imperative drag path can reuse it. */
const IRIS_C = 120;
const IRIS_RING = 104;
const IRIS_BLADE = 240;

/**
 * Wide-open blur, in pixels.
 *
 * 22px ဖြစ်ခဲ့သည်။ Transition/gesture အတွင်း blur သည် 20px အောက်တွင်ရှိရမည် —
 * အထူးသဖြင့် Safari တွင် စျေးကြီးသည်။ ဤသည်မှာ drag တစ်ခုလုံး၏ frame တိုင်းတွင်
 * full-bleed ဓာတ်ပုံပေါ်တွင် ပြန်တွက်နေရသော တစ်ခုတည်းသော filter ဖြစ်သည်။
 */
const MAX_BLUR = 18;

const fNumber = (t: number) => MIN_STOP * 2 ** ((STOPS * t) / 2);
const formatStop = (n: number) => n.toFixed(1);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const depthLabel = (t: number) =>
  t < 0.34 ? 'Shallow depth, more light' : t < 0.72 ? 'Balanced' : 'Deep focus, less light';

/**
 * Opening radius as a fraction of the ring. Diameter scales with 1/N; the
 * exponent is compressed so f/4 still reads as an opening, not a pinprick.
 */
const opening = (n: number) => 0.84 * (MIN_STOP / n) ** 0.55;

const bladeTransform = (i: number, distance: number) =>
  `rotate(${(i * 360) / BLADES} ${IRIS_C} ${IRIS_C}) translate(${IRIS_C + distance} ${IRIS_C})`;

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

/** The nodes the drag writes to, cached once so no frame runs a querySelector. */
interface LiveNodes {
  plates: HTMLElement[];
  subjects: HTMLElement[];
  veil: HTMLElement | null;
  focus: HTMLElement | null;
}

const EMPTY_NODES: LiveNodes = { plates: [], subjects: [], veil: null, focus: null };

/**
 * Slider-driven aperture demo: a nine-blade iris, the rumoured f/1.4–f/4
 * range, and a photograph whose background defocuses as the iris opens.
 *
 * The visitor can drag the photograph, drag the slider, or tap a stop — three
 * ways into the same number. Everything that number touches is transform,
 * opacity, mask size, or a filter on the plate. No layout.
 *
 * WHY THE DRAG DOES NOT GO THROUGH REACT
 *
 * ယခင်က `onPointerMove` တိုင်းတွင် `setT()` ခေါ်ခဲ့သည်။ ၎င်းသည် pointer event
 * တိုင်းအတွက် React render အပြည့်တစ်ခုစီဖြစ်စေပြီး၊ 9-circle iris SVG ကို
 * ပြန်တည်ဆောက်ကာ၊ `.viewfinder` ပေါ်တွင် CSS variable ခြောက်ခုရေးသဖြင့်
 * descendant တစ်ဒါဇင်နီးပါး၏ style ကို recalculate လုပ်စေခဲ့သည် — အားလုံးသည်
 * 18px blur တစ်ခုအောက်တွင်ဖြစ်သည်။ ဤ page ၏ တစ်ခုတည်းသော continuous gesture
 * ဖြစ်၍ frame budget အရေးအကြီးဆုံးနေရာလည်းဖြစ်သည်။
 *
 * ယခု drag သည် DOM သို့တိုက်ရိုက်ရေးပြီး (scrollState နှင့် DuoTransition တို့
 * လုပ်သည့်နည်းအတိုင်း)၊ pointer တင်လိုက်မှသာ React state သို့ commit လုပ်သည်။
 * React state သည် slider value, preset ၏ pressed state နှင့် screen reader
 * ဖတ်သော live region တို့အတွက် ကျန်ရှိနေဆဲဖြစ်သည် — ၎င်းတို့သည် အတည်ပြုပြီးသား
 * တန်ဖိုးကိုသာ လိုအပ်သည်။
 *
 * It is labelled as a simulation on the frame itself, not just in the copy.
 */
export function ApertureLab() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const policy = useMotionPolicy();
  const [t, setT] = useState(0);
  const [sceneId, setSceneId] = useState<Scene['id']>('interior');
  const [used, setUsed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]!;
  const n = fNumber(t);
  const label = formatStop(n);
  const open = opening(n);
  const depth = depthLabel(t);

  const tRef = useRef(t);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const sceneHydrated = useRef(false);

  const viewRef = useRef<HTMLDivElement | null>(null);
  const irisRef = useRef<SVGGElement | null>(null);
  const hudStopRef = useRef<HTMLSpanElement | null>(null);
  const hudDepthRef = useRef<HTMLSpanElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const nodes = useRef<LiveNodes>(EMPTY_NODES);
  const frame = useRef(0);

  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startT: number;
    locked: boolean;
  } | null>(null);

  /**
   * Paint one aperture value. Never allocates a render.
   *
   * Variable တိုင်းကို ၎င်းကိုတကယ်သုံးသော element ပေါ်တွင်သာရေးသည် — parent
   * ပေါ်တွင်မဟုတ်။ Parent ပေါ်တွင်ရေးလျှင် subtree တစ်ခုလုံး style recalculate
   * ဖြစ်သည်၊ ယခုမူ ရေးလိုက်သည့် node များသာဖြစ်သည်။
   */
  const applyAperture = useCallback((value: number) => {
    const { plates, subjects, veil, focus } = nodes.current;
    const { focus: area } = sceneRef.current;

    const stop = formatStop(fNumber(value));
    const blur = MAX_BLUR * (1 - value) ** 1.35;
    const x = `${area.x}%`;
    const y = `${area.y}%`;
    const rx = `${(area.rx + 30 * value).toFixed(1)}%`;
    const ry = `${(area.ry + 34 * value).toFixed(1)}%`;

    for (const plate of plates) plate.style.setProperty('--blur', `${blur.toFixed(2)}px`);
    veil?.style.setProperty('--veil', (0.38 * value).toFixed(3));

    for (const subject of subjects) {
      subject.style.setProperty('--mask-x', x);
      subject.style.setProperty('--mask-y', y);
      subject.style.setProperty('--mask-rx', rx);
      subject.style.setProperty('--mask-ry', ry);
    }

    if (focus) {
      focus.style.setProperty('--mask-x', x);
      focus.style.setProperty('--mask-y', y);
    }

    const blades = irisRef.current?.children;
    if (blades) {
      const distance = IRIS_BLADE + opening(fNumber(value)) * 92;
      for (let i = 0; i < blades.length; i += 1) {
        blades[i]!.setAttribute('transform', bladeTransform(i, distance));
      }
    }

    if (hudStopRef.current) hudStopRef.current.textContent = `f/${stop}`;
    if (hudDepthRef.current) hudDepthRef.current.textContent = depthLabel(value);
    if (readoutRef.current) readoutRef.current.textContent = stop;
  }, []);

  // Cache the write targets once. The two scenes are always both in the DOM,
  // so this structure never changes.
  useLayoutEffect(() => {
    const root = viewRef.current;
    if (!root) return;
    nodes.current = {
      plates: Array.from(root.querySelectorAll<HTMLElement>(`.${styles.plateWrap}`)),
      subjects: Array.from(root.querySelectorAll<HTMLElement>(`.${styles.subjectWrap}`)),
      veil: root.querySelector<HTMLElement>(`.${styles.veil}`),
      focus: root.querySelector<HTMLElement>(`.${styles.focus}`),
    };
    applyAperture(tRef.current);
  }, [applyAperture]);

  /**
   * Slider, preset taps and scene changes still come through React; this is
   * where they reach the DOM. A drag never lands here — `t` does not move
   * until the pointer is released.
   *
   * React သည် render နှစ်ခုကြားတွင် prop ပြောင်းသွားသည့် attribute ကိုသာ
   * ရေးသဖြင့်၊ drag အတွင်း `setDragging` ကြောင့် render ဖြစ်လျှင်လည်း
   * `t` မပြောင်းသည့်အတွက် iris နှင့် HUD ၏ imperative တန်ဖိုးများ ကျန်ရှိသည်။
   */
  useLayoutEffect(() => {
    tRef.current = t;
    applyAperture(t);
  }, [t, sceneId, applyAperture]);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const plateNodes = () =>
    Array.from(viewRef.current?.querySelectorAll<HTMLElement>(`.${styles.plates}`) ?? []);

  /**
   * Scene change is a GSAP timeline, not a CSS opacity transition.
   *
   * The two plates share the viewfinder, so a 420ms CSS crossfade held both
   * photographs on screen together — a double-exposure. GSAP lets the outgoing
   * plate yield, then the incoming one arrive, with a 2px blur mask on the
   * overlap that desktop/tablet can afford. Mobile (lite) drops the blur and
   * shortens the beat: same story, cheaper paint. Rapid taps kill and retarget
   * from the current values, so the dissolve never restarts from zero.
   */
  useGSAP(
    () => {
      const incoming = plateNodes().find((el) => el.dataset.scene === sceneId);
      const outgoing = plateNodes().find((el) => el.dataset.scene !== sceneId);
      if (!incoming) return;

      if (!sceneHydrated.current) {
        sceneHydrated.current = true;
        gsap.set(incoming, { opacity: 1, scale: 1, filter: 'none' });
        if (outgoing) gsap.set(outgoing, { opacity: 0, scale: 1, filter: 'none' });
        return;
      }

      if (!outgoing) return;

      const incomingShown = Number(gsap.getProperty(incoming, 'opacity')) > 0.95;
      const outgoingHidden = Number(gsap.getProperty(outgoing, 'opacity')) < 0.05;
      if (incomingShown && outgoingHidden) return;

      if (policy.tier === 'static') {
        gsap.set(outgoing, { opacity: 0, scale: 1, filter: 'none' });
        gsap.set(incoming, { opacity: 1, scale: 1, filter: 'none' });
        return;
      }

      // Lite = phone: opacity + scale only. Pinning viewports get the blur mask.
      const lite = !policy.canPin;
      const dur = lite ? 0.28 : 0.42;
      const incomingAtRest = Number(gsap.getProperty(incoming, 'opacity')) < 0.08;

      if (incomingAtRest) {
        gsap.set(incoming, lite ? { scale: 1.03 } : { scale: 1.03, filter: 'blur(2px)' });
      }

      const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => gsap.set([incoming, outgoing], { clearProps: 'filter,willChange' }),
      });

      const leave: gsap.TweenVars = {
        opacity: 0,
        scale: 0.985,
        duration: dur * 0.62,
        ease: 'power2.inOut',
      };
      const arrive: gsap.TweenVars = {
        opacity: 1,
        scale: 1,
        duration: dur,
        ease: 'power3.out',
      };
      if (!lite) {
        leave.filter = 'blur(2px)';
        arrive.filter = 'blur(0px)';
      }

      tl.set([incoming, outgoing], { willChange: 'opacity, transform' })
        .to(outgoing, leave, 0)
        .to(incoming, arrive, dur * 0.28);

      return () => tl.kill();
    },
    { scope: viewRef, dependencies: [sceneId, policy.tier, policy.canPin] },
  );

  const lockPlateStyles = () => {
    for (const plate of plateNodes()) {
      gsap.set(plate, {
        opacity: gsap.getProperty(plate, 'opacity'),
        scale: gsap.getProperty(plate, 'scale'),
      });
    }
  };

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
    tRef.current = clamp01(g.startT + dx / width);

    // Pointer events out-fire the display on a trackpad; one paint per frame
    // is the most the screen can show.
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        applyAperture(tRef.current);
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.locked && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    gesture.current = null;

    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }

    if (g.locked) {
      // Paint the final position before committing: if the value happens to
      // match `t` React bails out of the update and the effect never runs.
      applyAperture(tRef.current);
      setT(tRef.current);
    }
    setDragging(false);
  };

  return (
    <div className={styles.lab} data-reveal data-used={used}>
      <div
        ref={viewRef}
        className={styles.viewfinder}
        data-dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {SCENES.map((plate) => (
          <div
            key={plate.id}
            className={styles.plates}
            data-scene={plate.id}
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
                quality={90}
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
                quality={90}
                priority={plate.id === 'interior'}
                draggable={false}
              />
            </div>
          </div>
        ))}
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.focus} aria-hidden="true" />
        <p className={styles.hud} aria-hidden="true">
          <span ref={hudStopRef}>f/{label}</span>
          <span ref={hudDepthRef}>{depth}</span>
        </p>
        <p className={styles.hint} aria-hidden="true">
          Drag across the photograph
        </p>
        <p className={styles.sim}>Illustrative simulation. Not captured on iPhone 18 Pro.</p>
      </div>

      <div className={styles.meta}>
        <div className={styles.iris}>
          <Iris id={id} open={open} gRef={irisRef} />
          <p className={styles.readout} aria-hidden="true">
            <span className={styles.readoutF}>f/</span>
            <span className={styles.readoutN} ref={readoutRef}>
              {label}
            </span>
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
                  if (option.id === scene.id) return;
                  // Inline the current opacities before React flips `data-active`,
                  // otherwise CSS would snap both plates and GSAP would tween
                  // from the snapped values.
                  lockPlateStyles();
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

function Iris({
  id,
  open,
  gRef,
}: {
  id: string;
  open: number;
  gRef: React.RefObject<SVGGElement | null>;
}) {
  const distance = IRIS_BLADE + open * 92;

  return (
    <svg viewBox="0 0 240 240" className={styles.irisSvg} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={IRIS_C} cy={IRIS_C} r={IRIS_RING} />
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

      <circle cx={IRIS_C} cy={IRIS_C} r={114} fill="#0a0a0c" stroke="rgba(237, 234, 228, 0.16)" />
      <circle cx={IRIS_C} cy={IRIS_C} r={IRIS_RING} fill={`url(#${id}-glass)`} />
      {/* The drag writes each blade's transform straight onto these nodes. */}
      <g clipPath={`url(#${id}-clip)`} ref={gRef}>
        {Array.from({ length: BLADES }, (_, i) => (
          <circle
            key={i}
            r={IRIS_BLADE}
            fill={`url(#${id}-blade)`}
            stroke="rgba(0, 0, 0, 0.8)"
            strokeWidth={1.5}
            transform={bladeTransform(i, distance)}
          />
        ))}
      </g>
      <circle
        cx={IRIS_C}
        cy={IRIS_C}
        r={IRIS_RING}
        fill="none"
        stroke="rgba(237, 234, 228, 0.22)"
      />
    </svg>
  );
}
