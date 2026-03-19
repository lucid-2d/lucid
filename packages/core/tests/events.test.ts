/**
 * EventEmitter 单元测试 — TDD 第一步
 */
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/events';

describe('EventEmitter', () => {
  it('$on and $emit', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$on('tap', handler);
    ee.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('$emit passes arguments', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$on('change', handler);
    ee.$emit('change', 42, 'hello');
    expect(handler).toHaveBeenCalledWith(42, 'hello');
  });

  it('$on registers multiple handlers', () => {
    const ee = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    ee.$on('tap', h1);
    ee.$on('tap', h2);
    ee.$emit('tap');
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('$off removes specific handler', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$on('tap', handler);
    ee.$emit('tap');
    ee.$off('tap', handler);
    ee.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('$off without handler removes all handlers for event', () => {
    const ee = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    ee.$on('tap', h1);
    ee.$on('tap', h2);
    ee.$off('tap');
    ee.$emit('tap');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('$once fires only once', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$once('tap', handler);
    ee.$emit('tap');
    ee.$emit('tap');
    ee.$emit('tap');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('$once passes arguments', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$once('reward', handler);
    ee.$emit('reward', 100);
    expect(handler).toHaveBeenCalledWith(100);
  });

  it('$off can remove $once handler before it fires', () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.$once('tap', handler);
    ee.$off('tap', handler);
    ee.$emit('tap');
    expect(handler).not.toHaveBeenCalled();
  });

  it('$emit on non-existent event does nothing', () => {
    const ee = new EventEmitter();
    expect(() => ee.$emit('nope')).not.toThrow();
  });

  it('$on returns this for chaining', () => {
    const ee = new EventEmitter();
    const result = ee.$on('a', () => {});
    expect(result).toBe(ee);
  });

  it('handler added during emit is not called in same emit', () => {
    const ee = new EventEmitter();
    const late = vi.fn();
    ee.$on('tap', () => {
      ee.$on('tap', late);
    });
    ee.$emit('tap');
    expect(late).not.toHaveBeenCalled();
    ee.$emit('tap');
    expect(late).toHaveBeenCalledOnce();
  });
});
