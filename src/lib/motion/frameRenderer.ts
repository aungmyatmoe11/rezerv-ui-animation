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
 * 1. NEAREST FRAME. We paint one still at a time. Adjacent-frame cross-dissolve
 *    made sparse JPEG sets look continuous, but on a rotating product (especially
 *    a thin edge-on phone) it stacked two poses and read as a coloured ghost.
 *    Every scrub section uses the same rule so Display, Colors, Camera, Fold,
 *    and the rest stay consistent.
 *
 * 2. REPAINT GATING. The canvas is only touched when the nearest frame actually
 *    changes. Scroll events fire far more often than the image changes, and an
 *    ungated drawImage per event is the usual reason these scrubs drop frames
 *    on a trackpad fling.
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

  // Frames are native resolution (often 2560–2880px) while the canvas backing
  // store is CSS width times DPR, so every draw is a downscale. 'medium' is
  // the sharpness/cost midpoint: 'high' cost 14.5ms per paint on the
  // camera-sensor scrub; 'low' read soft on retina after the 2560 sequences.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  const count = frames.images.length;
  const lastIndex = Math.max(1, count - 1);

  let lastFrame = -1;
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
    const i = Math.min(count - 1, Math.max(0, Math.round(p * lastIndex)));
    if (!force && i === lastFrame) return;
    lastFrame = i;

    // Under 'cover' the opaque first draw always repaints the whole canvas, so no
    // clear is needed - that saves a full-surface fill on every repaint. Under
    // 'contain' the letterbox bars fall outside the image, so the previous frame
    // would smear there; the context is alpha:false, so clearRect paints black.
    if (fit === 'contain') ctx!.clearRect(0, 0, cssW, cssH);
    const img = frames.images[i];
    if (img) paintCover(img, 1);
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
     * Older sequences were 1600px wide. On a 1440px stage at DPR 2 the old cap
     * gave a 2880px backing store, into which `cover`/`contain` then drew the
     * frame at roughly 3600px — a 2.25x upscale of a 1600px JPEG. Capping the
     * ratio at 1:1 removes that upscale. The floor of 1 keeps a genuinely
     * oversized stage from dropping below CSS resolution.
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

    const previous = lastFrame;
    lastFrame = -1;
    draw(previous <= 0 ? 0 : previous / lastIndex, true);
  }

  function destroy() {
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize();
  return { draw, resize, destroy };
}
