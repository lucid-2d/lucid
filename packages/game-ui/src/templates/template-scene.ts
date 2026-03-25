/**
 * TemplateScene — base class for all template-created scenes.
 * Marked with __template for router validation.
 */

import { UINode } from '@lucid-2d/core';
import type { TemplateConfig, TemplateName } from './types.js';

export class TemplateScene extends UINode {
  static readonly __template = true;

  readonly templateType: TemplateName;
  readonly templateConfig: TemplateConfig;

  constructor(templateType: TemplateName, config: TemplateConfig, width: number, height: number) {
    const id = config.id ?? templateType;
    super({ id, width, height });
    this.templateType = templateType;
    this.templateConfig = config;
  }

  /** Called by engine as scene lifecycle */
  onEnter(): void {}
  onExit(): void {}
  onPause(): void {}
  onResume(): void {}
  preload(): void | Promise<void> {}

  get $text(): string {
    return `[${this.templateType}] ${this.id}`;
  }

  protected $inspectInfo(): string {
    return `template=${this.templateType}`;
  }
}

/** Check if a node is a TemplateScene */
export function isTemplateScene(node: unknown): node is TemplateScene {
  if (!node || typeof node !== 'object') return false;
  return (node.constructor as any).__template === true;
}
