/**
 * Layout — Flexbox 子集布局引擎
 *
 * 当 UINode 设置 `layout` 属性后，子节点的 x/y 由引擎自动计算。
 * 参考 Figma Auto Layout + CSS Flexbox 术语。
 */

import type { UINode } from './node.js';

// ── Types ──

export type LayoutDirection = 'row' | 'column';
export type LayoutAlign = 'start' | 'center' | 'end';
export type LayoutJustify = 'start' | 'center' | 'end' | 'space-between';
export type Padding = number | [number, number, number, number];

// ── Helpers ──

function parsePadding(p: Padding | undefined): [number, number, number, number] {
  if (p === undefined || p === 0) return [0, 0, 0, 0];
  if (typeof p === 'number') return [p, p, p, p];
  return p;
}

// ── Main ──

export function computeLayout(node: UINode): void {
  const dir = node.layout;
  if (!dir) return;

  const children = node.$children.filter(c => c.visible);
  if (children.length === 0) return;

  const [pt, pr, pb, pl] = parsePadding(node.padding);
  const gap = node.gap ?? 0;
  const alignItems = node.alignItems ?? 'start';
  const justify = node.justifyContent ?? 'start';
  const isRow = dir === 'row';

  if (node.wrap && isRow) {
    layoutWrapRow(node, children, gap, pt, pr, pb, pl, alignItems, justify);
    return;
  }

  const mainSize = isRow ? node.width - pl - pr : node.height - pt - pb;
  const crossSize = isRow ? node.height - pt - pb : node.width - pl - pr;
  const mainStart = isRow ? pl : pt;
  const crossStart = isRow ? pt : pl;

  // ── 1. Measure fixed + flex ──

  let fixedTotal = 0;
  let flexTotal = 0;

  for (const child of children) {
    if ((child.flex ?? 0) > 0) {
      flexTotal += child.flex!;
    } else {
      fixedTotal += isRow ? child.width : child.height;
    }
  }

  const totalGap = Math.max(0, children.length - 1) * gap;
  const remaining = Math.max(0, mainSize - fixedTotal - totalGap);

  // ── 2. Resolve sizes ──

  const sizes: number[] = children.map(child => {
    if ((child.flex ?? 0) > 0 && flexTotal > 0) {
      let s = (child.flex! / flexTotal) * remaining;
      const minC = isRow ? child.minWidth : child.minHeight;
      const maxC = isRow ? child.maxWidth : child.maxHeight;
      if (minC !== undefined) s = Math.max(s, minC);
      if (maxC !== undefined) s = Math.min(s, maxC);
      // Write back computed size
      if (isRow) child.width = s;
      else child.height = s;
      return s;
    }
    return isRow ? child.width : child.height;
  });

  // ── 3. Main axis position ──

  const usedMain = sizes.reduce((a, b) => a + b, 0) + totalGap;
  let pos: number;
  let spacing = gap;

  switch (justify) {
    case 'center':
      pos = mainStart + (mainSize - usedMain) / 2;
      break;
    case 'end':
      pos = mainStart + mainSize - usedMain;
      break;
    case 'space-between':
      pos = mainStart;
      spacing = children.length > 1
        ? (mainSize - sizes.reduce((a, b) => a + b, 0)) / (children.length - 1)
        : 0;
      break;
    default:
      pos = mainStart;
  }

  // ── 4. Position children ──

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childMain = sizes[i];
    const childCross = isRow ? child.height : child.width;
    const align = child.alignSelf ?? alignItems;

    let crossPos: number;
    switch (align) {
      case 'center':
        crossPos = crossStart + (crossSize - childCross) / 2;
        break;
      case 'end':
        crossPos = crossStart + crossSize - childCross;
        break;
      default:
        crossPos = crossStart;
    }

    if (isRow) {
      child.x = pos;
      child.y = crossPos;
    } else {
      child.x = crossPos;
      child.y = pos;
    }

    pos += childMain + spacing;
  }
}

// ── Wrap Row Layout ──

function layoutWrapRow(
  node: UINode,
  children: UINode[],
  gap: number,
  pt: number, pr: number, pb: number, pl: number,
  alignItems: LayoutAlign,
  justify: LayoutJustify,
): void {
  const availW = node.width - pl - pr;
  const cols = node.columns;

  // If columns set, auto-calculate child width
  if (cols && cols > 0) {
    const childW = (availW - (cols - 1) * gap) / cols;
    for (const child of children) {
      child.width = childW;
    }
  }

  // Split into rows
  const rows: UINode[][] = [];
  let currentRow: UINode[] = [];
  let rowWidth = 0;

  for (const child of children) {
    const needed = currentRow.length > 0 ? child.width + gap : child.width;
    if (currentRow.length > 0 && rowWidth + needed > availW + 0.5) {
      rows.push(currentRow);
      currentRow = [child];
      rowWidth = child.width;
    } else {
      currentRow.push(child);
      rowWidth += needed;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Position each row
  let rowY = pt;

  for (const row of rows) {
    const rowH = Math.max(...row.map(c => c.height));

    // Main axis: justify within row
    const usedW = row.reduce((s, c) => s + c.width, 0) + (row.length - 1) * gap;
    let posX: number;
    let spacing = gap;

    switch (justify) {
      case 'center':
        posX = pl + (availW - usedW) / 2;
        break;
      case 'end':
        posX = pl + availW - usedW;
        break;
      case 'space-between':
        posX = pl;
        spacing = row.length > 1
          ? (availW - row.reduce((s, c) => s + c.width, 0)) / (row.length - 1)
          : 0;
        break;
      default:
        posX = pl;
    }

    for (const child of row) {
      const align = child.alignSelf ?? alignItems;
      let posY: number;
      switch (align) {
        case 'center':
          posY = rowY + (rowH - child.height) / 2;
          break;
        case 'end':
          posY = rowY + rowH - child.height;
          break;
        default:
          posY = rowY;
      }

      child.x = posX;
      child.y = posY;
      posX += child.width + spacing;
    }

    rowY += rowH + gap;
  }
}
