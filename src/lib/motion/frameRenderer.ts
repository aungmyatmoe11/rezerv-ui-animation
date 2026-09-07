'use client';

import type { FrameSet } from './frameLoader';

export interface FrameRenderer {
  /** Paint at a normalised 0..1 position. No-ops when nothing visibly changed. */
  draw(progress: number, force?: boolean): void;
  resize(): void;
  destroy(): void;
}

const MAX_DPR = 2;

/**
 * Paints a frame sequence onto a canvas.
 *
 * Two decisions carry the performance of this whole page:
 *
 * 1. ADJACENT-FRAME BLENDING. We cross-dissolve frame N and N+1 by the
 *    fractional part of the position. That makes a sparse sequence read as
 *    continuous motion, which is what lets the hero work at all — only 1.25s of
 *    that clip is usable before a baked-in wordmark fades in, so there are just
 *    38 frames to play with. It also let every sequence drop ~35% of its frames
 *    (and bytes) with no visible stepping.
 *
 * 2. REPAINT GATING. The canvas is only touched when the quantised position
 *    actually moves. Scroll events fire far more often than the image changes,
 *    and an ungated drawImage per event is the usual reason these scrubs drop
 *    frames on a trackpad fling.
 */
export interface FrameRendererOptions {
  /**
   * 'cover' crops to fill the box; 'contain' shows the whole frame.
   *
   * Use 'contain' whenever the subject must not be clipped - a wide product shot
   * in a tall viewport gets its top and bottom sliced off under 'cover'.
   */
  fit?: 'cover' | 'contain';
}

export function createFrameRenderer(
  canvas: HTMLCanvasElement,
  frames: FrameSet,
  { fit = 'cover' }: FrameRendererOptions = {},
): FrameRenderer {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D context unavailable');

  // Frames are native resolution (2880px) while the canvas backing store is the
  // CSS width times DPR, so every draw is a 2x downscale or more. High-quality
  // resampling of an image that large, twice per paint, was costing 14.5ms per
  // frame in the camera-sensor scrub. 'low' uses a cheaper filter that is
  // indistinguishable when minifying, which is the only thing we ever do here.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';

  const count = frames.images.length;
  // Sub-steps per frame for the blend. 16 is far beyond perceptual need and
  // still skips the vast majority of repaints.
  const QUANT = count * 16;

  let lastQuant = -1;
  let cssW = 0;
  let cssH = 0;

  function paintCover(img: HTMLImageElement, alpha: number) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;

    const scale = fit === 'contain'
      ? Math.min(cssW / iw, cssH / ih)
      : Math.max(cssW / iw, cssH / ih);
    const w = iw * scale;
    const h = ih * scale;

    ctx!.globalAlpha = alpha;
    ctx!.drawImage(img, (cssW - w) / 2, (cssH - h) / 2, w, h);
  }

  function draw(progress: number, force = false) {
    if (count === 0 || cssW === 0) return;

    const p = Math.min(1, Math.max(0, progress));
    const quant = Math.round(p * QUANT);
    if (!force && quant === lastQuant) return;
    lastQuant = quant;

    const exact = (quant / QUANT) * (count - 1);
    const i = Math.min(count - 1, Math.floor(exact));
    const frac = exact - i;

    const a = frames.images[i];
    const b = frames.images[i + 1];

    // Under 'cover' the opaque first draw always repaints the whole canvas, so no
    // clear is needed - that saves a full-surface fill on every repaint. Under
    // 'contain' the letterbox bars fall outside the image, so the previous frame
    // would smear there; the context is alpha:false, so clearRect paints black.
    if (fit === 'contain') ctx!.clearRect(0, 0, cssW, cssH);
    if (a) paintCover(a, 1);
    // The blend threshold is the difference between drawing one native-resolution
    // image per paint and drawing two. At ~17fps sequences the sequence is dense
    // enough that skipping a barely-visible 6% cross-dissolve is invisible, and
    // it removes the second full-frame downscale from most paints.
    if (b && frac > 0.06) paintCover(b, frac);
    ctx!.globalAlpha = 1;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    cssW = rect.width;
    cssH = rect.height;

    /**
     * Never build a backing store the source cannot fill.
     *
     * The frames are 1600px wide. On a 1440px stage at DPR 2 the old cap gave a
     * 2880px backing store, into which `cover`/`contain` then drew the frame at
     * roughly 3600px — a 2.25x upscale of a 1600px JPEG, twice per painted frame
     * for the cross-dissolve. That is ~13 megapixels of fill per frame spent
     * inventing detail that is not in the source, and it was the largest single
     * cost on the page: measured median frame time through the pinned run was
     * 50ms, i.e. 20fps.
     *
     * Capping the ratio at the point where the frame lands 1:1 removes the
     * upscale entirely. Nothing is lost — there is no detail above native
     * resolution to lose — and the fill drops by about 3x. The floor of 1 keeps
     * a genuinely oversized stage from dropping below CSS resolution.
     */
    const fitScale =
      fit === 'contain'
        ? Math.min(cssW / frames.width, cssH / frames.height)
        : Math.max(cssW / frames.width, cssH / frames.height);
    const nativeCap = fitScale > 0 ? 1 / fitScale : MAX_DPR;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR, nativeCap));

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    /**
     * Publish where the picture actually lands inside the canvas.
     *
     * Under `contain` the frame does not fill its element — it is letterboxed,
     * and only this function knows by how much. The stylesheet feathers the
     * picture's edges into the page (see ScrubStage.module.scss), and it can
     * only align that fade to the real edge if it is told where the real edge
     * is. Masking the element instead put the fade out in the letterbox, which
     * is why the seam survived the first attempt.
     */
    const drawnW = Math.min(cssW, frames.width * fitScale);
    const drawnH = Math.min(cssH, frames.height * fitScale);
    const style = canvas.style;
    style.setProperty('--pic-w', `${drawnW}px`);
    style.setProperty('--pic-h', `${drawnH}px`);
    style.setProperty('--pic-x', `${Math.max(0, (cssW - drawnW) / 2)}px`);
    style.setProperty('--pic-y', `${Math.max(0, (cssH - drawnH) / 2)}px`);

    const previous = lastQuant;
    lastQuant = -1;
    draw(previous <= 0 ? 0 : previous / QUANT, true);
  }

  function destroy() {
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize();
  return { draw, resize, destroy };
}
