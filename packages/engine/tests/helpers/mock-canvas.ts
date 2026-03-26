import { vi } from 'vitest';

export function createMockCanvas(w = 390, h = 844): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getBoundingClientRect = () => ({
    x: 0, y: 0, width: w, height: h,
    top: 0, left: 0, right: w, bottom: h,
    toJSON: () => {},
  });
  const gradient = { addColorStop: vi.fn() };
  const mockCtx = {
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
    scale: vi.fn(), rotate: vi.fn(),
    clearRect: vi.fn(), setTransform: vi.fn(),
    fillRect: vi.fn(), fillText: vi.fn(),
    strokeRect: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(),
    arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    measureText: vi.fn(() => ({ width: 0 })),
    globalAlpha: 1, fillStyle: '', strokeStyle: '',
    font: '', textAlign: '', textBaseline: '',
    lineWidth: 1, setLineDash: vi.fn(), getLineDash: vi.fn(() => []),
    shadowBlur: 0, shadowColor: '',
  };
  (canvas as any).getContext = () => mockCtx;
  return canvas;
}
