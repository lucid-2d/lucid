/**
 * Text utilities tests — wrapping, measuring, drawing
 */
import { describe, it, expect, vi } from 'vitest';
import { wrapText, measureWrappedText, drawText } from '../src/text';

// Mock ctx with realistic measureText
function createTextCtx(charWidth = 8): CanvasRenderingContext2D {
  return {
    measureText: (text: string) => ({ width: text.length * charWidth }),
    fillText: vi.fn(),
    textAlign: 'left',
    textBaseline: 'alphabetic',
  } as unknown as CanvasRenderingContext2D;
}

describe('wrapText', () => {
  it('returns single line if text fits', () => {
    const ctx = createTextCtx(8);
    const lines = wrapText(ctx, 'Hello', 100);
    expect(lines).toEqual(['Hello']);
  });

  it('preserves explicit \\n line breaks', () => {
    const ctx = createTextCtx(8);
    const lines = wrapText(ctx, 'Line 1\nLine 2\nLine 3', 1000);
    expect(lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
  });

  it('wraps at word boundaries for Latin text', () => {
    const ctx = createTextCtx(8);
    // 'Hello World Test' = 16 chars × 8 = 128px
    // maxWidth = 100, so 12 chars fit
    const lines = wrapText(ctx, 'Hello World Test', 100);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toContain('Hello');
    expect(lines.join(' ')).toContain('Test');
  });

  it('wraps CJK characters at character boundaries', () => {
    const ctx = createTextCtx(16); // CJK chars typically wider
    // 6 CJK chars × 16 = 96px, maxWidth = 50 → should wrap
    const lines = wrapText(ctx, '你好世界测试', 50);
    expect(lines.length).toBeGreaterThan(1);
    // All chars should be present
    const joined = lines.join('');
    expect(joined).toBe('你好世界测试');
  });

  it('handles empty string', () => {
    const ctx = createTextCtx(8);
    const lines = wrapText(ctx, '', 100);
    expect(lines).toEqual(['']);
  });

  it('handles empty lines from \\n', () => {
    const ctx = createTextCtx(8);
    const lines = wrapText(ctx, 'A\n\nB', 100);
    expect(lines).toEqual(['A', '', 'B']);
  });

  it('returns original text if maxWidth is 0', () => {
    const ctx = createTextCtx(8);
    const lines = wrapText(ctx, 'Hello', 0);
    expect(lines).toEqual(['Hello']);
  });
});

describe('measureWrappedText', () => {
  it('measures single line', () => {
    const ctx = createTextCtx(8);
    const m = measureWrappedText(ctx, 'Hello', 200, 20);
    expect(m.lines).toEqual(['Hello']);
    expect(m.width).toBe(40); // 5 × 8
    expect(m.height).toBe(20); // 1 line × 20
  });

  it('measures wrapped text', () => {
    const ctx = createTextCtx(8);
    // 'Hello World' = 11 × 8 = 88, maxWidth = 50 → wraps
    const m = measureWrappedText(ctx, 'Hello World', 50, 20);
    expect(m.lines.length).toBe(2);
    expect(m.height).toBe(40); // 2 lines × 20
  });
});

describe('drawText', () => {
  it('draws single line centered', () => {
    const ctx = createTextCtx(8);
    const result = drawText(ctx, 'Hello', {
      maxWidth: 200, height: 40, fontSize: 16,
      align: 'center',
    });
    expect(ctx.fillText).toHaveBeenCalledOnce();
    expect(result.width).toBe(40); // 5 × 8
  });

  it('draws multiple lines when wrapped', () => {
    const ctx = createTextCtx(8);
    drawText(ctx, 'Hello World Test Case', {
      maxWidth: 80, height: 200, fontSize: 16,
    });
    // Should have multiple fillText calls
    expect((ctx.fillText as any).mock.calls.length).toBeGreaterThan(1);
  });

  it('truncates with ellipsis at maxLines', () => {
    const ctx = createTextCtx(8);
    // Create text that wraps into 4+ lines
    const longText = 'A B C D E F G H I J K L M N';
    drawText(ctx, longText, {
      maxWidth: 40, height: 200, fontSize: 16,
      maxLines: 2,
    });
    // Should only draw 2 lines
    expect((ctx.fillText as any).mock.calls.length).toBe(2);
    // Last line should end with ellipsis
    const lastLine = (ctx.fillText as any).mock.calls[1][0];
    expect(lastLine).toContain('...');
  });

  it('returns dimensions', () => {
    const ctx = createTextCtx(8);
    const result = drawText(ctx, 'Hi', {
      maxWidth: 200, height: 40, fontSize: 16,
    });
    expect(result.width).toBe(16); // 2 × 8
    expect(result.height).toBeCloseTo(22.4); // 1 line × 16 × 1.4
  });

  it('respects vertical alignment top', () => {
    const ctx = createTextCtx(8);
    drawText(ctx, 'A', {
      maxWidth: 200, height: 100, fontSize: 16,
      verticalAlign: 'top',
    });
    // First line y should be near top: lineH/2 = 11.2
    const y = (ctx.fillText as any).mock.calls[0][2];
    expect(y).toBeCloseTo(11.2);
  });

  it('respects vertical alignment bottom', () => {
    const ctx = createTextCtx(8);
    drawText(ctx, 'A', {
      maxWidth: 200, height: 100, fontSize: 16,
      verticalAlign: 'bottom',
    });
    // Single line at bottom: height - totalH + lineH/2 = 100 - 22.4 + 11.2 = 88.8
    const y = (ctx.fillText as any).mock.calls[0][2];
    expect(y).toBeCloseTo(88.8);
  });
});
