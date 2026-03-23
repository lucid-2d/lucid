/**
 * timeSlice — Split heavy computation across frames to avoid blocking rendering.
 *
 * ```typescript
 * import { timeSlice } from '@lucid-2d/engine';
 *
 * // Pre-render 192 planet texture frames without blocking the UI
 * await timeSlice({
 *   total: 192,
 *   batch: 4,
 *   work: (index) => renderPlanetFrame(index),
 *   onProgress: (pct) => loadingBar.value = pct,
 * });
 * ```
 */

export interface TimeSliceOptions {
  /** Total number of work items */
  total: number;
  /** Items per batch before yielding (default: 4) */
  batch?: number;
  /** Work function called for each item */
  work: (index: number) => void;
  /** Progress callback (0..1) */
  onProgress?: (progress: number) => void;
}

/**
 * Execute heavy work in batches, yielding to the event loop between batches
 * so animations and UI remain responsive.
 */
export async function timeSlice(opts: TimeSliceOptions): Promise<void> {
  const { total, work, onProgress } = opts;
  const batch = opts.batch ?? 4;

  for (let i = 0; i < total; i++) {
    work(i);

    // Yield after each batch
    if ((i + 1) % batch === 0 && i + 1 < total) {
      onProgress?.((i + 1) / total);
      await _nextFrame();
    }
  }

  onProgress?.(1);
}

function _nextFrame(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
