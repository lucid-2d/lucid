/**
 * Text utilities — wrapping, measuring, and rendering multi-line text.
 *
 * Canvas 2D has no built-in text wrapping. These utilities provide:
 * - wrapText: break text into lines that fit a maxWidth
 * - measureText: compute wrapped text dimensions
 * - drawText: render multi-line text with alignment and overflow control
 */

// ── CJK detection ──

/** Check if a character is CJK (Chinese/Japanese/Korean) — can break anywhere */
function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||  // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) ||  // CJK Extension A
    (code >= 0x3000 && code <= 0x303f) ||  // CJK Symbols and Punctuation
    (code >= 0x3040 && code <= 0x309f) ||  // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) ||  // Katakana
    (code >= 0xff00 && code <= 0xffef) ||  // Fullwidth Forms
    (code >= 0xfe30 && code <= 0xfe4f)     // CJK Compatibility Forms
  );
}

// ── wrapText ──

/**
 * Break text into lines that fit within maxWidth.
 *
 * - Respects existing `\n` line breaks
 * - Breaks at word boundaries (spaces) for Latin text
 * - Breaks at character boundaries for CJK text
 * - Mixed text handled correctly
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) return [text];

  const paragraphs = text.split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    if (para === '') {
      result.push('');
      continue;
    }

    const measured = ctx.measureText(para).width;
    if (measured <= maxWidth) {
      result.push(para);
      continue;
    }

    // Need to wrap this paragraph
    let line = '';
    let lineWidth = 0;
    let i = 0;

    while (i < para.length) {
      const char = para[i];

      if (char === ' ') {
        // Find the next word
        let wordEnd = i + 1;
        while (wordEnd < para.length && para[wordEnd] !== ' ' && !isCJK(para[wordEnd])) {
          wordEnd++;
        }
        const word = para.slice(i, wordEnd);
        const wordWidth = ctx.measureText(word).width;

        if (lineWidth + wordWidth > maxWidth && line !== '') {
          result.push(line);
          line = word.trimStart();
          lineWidth = ctx.measureText(line).width;
        } else {
          line += word;
          lineWidth += wordWidth;
        }
        i = wordEnd;
      } else if (isCJK(char)) {
        const charWidth = ctx.measureText(char).width;
        if (lineWidth + charWidth > maxWidth && line !== '') {
          result.push(line);
          line = char;
          lineWidth = charWidth;
        } else {
          line += char;
          lineWidth += charWidth;
        }
        i++;
      } else {
        // Latin word — collect until space or CJK
        let wordEnd = i;
        while (wordEnd < para.length && para[wordEnd] !== ' ' && !isCJK(para[wordEnd])) {
          wordEnd++;
        }
        const word = para.slice(i, wordEnd);
        const wordWidth = ctx.measureText(word).width;

        if (lineWidth + wordWidth > maxWidth && line !== '') {
          result.push(line);
          line = word;
          lineWidth = wordWidth;
        } else {
          line += word;
          lineWidth += wordWidth;
        }
        i = wordEnd;
      }
    }

    if (line !== '') {
      result.push(line);
    }
  }

  return result;
}

// ── measureText ──

export interface TextMetrics {
  /** Total width (max line width) */
  width: number;
  /** Total height (lines × lineHeight) */
  height: number;
  /** Wrapped lines */
  lines: string[];
}

/**
 * Measure text dimensions after wrapping.
 *
 * @param lineHeight Line height in pixels (default: fontSize × 1.4)
 */
export function measureWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): TextMetrics {
  const lines = wrapText(ctx, text, maxWidth);
  let maxW = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxW) maxW = w;
  }
  return {
    width: maxW,
    height: lines.length * lineHeight,
    lines,
  };
}

// ── drawText ──

export interface DrawTextOptions {
  /** Maximum width for wrapping */
  maxWidth: number;
  /** Available height (for vertical centering) */
  height: number;
  /** Font size in pixels */
  fontSize: number;
  /** Line height multiplier (default: 1.4) */
  lineHeightMultiplier?: number;
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Maximum number of lines (truncates with ellipsis) */
  maxLines?: number;
  /** Ellipsis string (default: '...') */
  ellipsis?: string;
}

/**
 * Draw multi-line text with wrapping, alignment, and truncation.
 *
 * Returns the actual dimensions used.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: DrawTextOptions,
): { width: number; height: number } {
  const lineHeightMul = opts.lineHeightMultiplier ?? 1.4;
  const lineH = opts.fontSize * lineHeightMul;
  const align = opts.align ?? 'left';
  const vAlign = opts.verticalAlign ?? 'middle';
  const ellipsis = opts.ellipsis ?? '...';

  let lines = wrapText(ctx, text, opts.maxWidth);

  // Truncate with ellipsis
  if (opts.maxLines && lines.length > opts.maxLines) {
    lines = lines.slice(0, opts.maxLines);
    // Add ellipsis to last visible line
    let lastLine = lines[lines.length - 1];
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    while (ctx.measureText(lastLine + ellipsis).width > opts.maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -1);
    }
    lines[lines.length - 1] = lastLine + ellipsis;
  }

  // Calculate positions
  const totalH = lines.length * lineH;
  const x = align === 'center' ? opts.maxWidth / 2 : align === 'right' ? opts.maxWidth : 0;

  let startY: number;
  if (vAlign === 'top') {
    startY = lineH / 2;
  } else if (vAlign === 'bottom') {
    startY = opts.height - totalH + lineH / 2;
  } else {
    startY = (opts.height - totalH) / 2 + lineH / 2;
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineH);
  }

  // Compute actual width
  let maxW = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxW) maxW = w;
  }

  return { width: maxW, height: totalH };
}
