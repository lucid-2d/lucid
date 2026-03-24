/**
 * @lucid-2d/engine/testing — Test utilities (separate entry to avoid native deps in production builds)
 *
 * ```typescript
 * import { createTestApp, tap, touch, assertTree } from '@lucid-2d/engine/testing';
 * ```
 */

export { createTestApp, tap, touch, assertTree, generateTestCode, imageDiff, assertImageChanged, type TestApp, type TestAppOptions, type FontConfig, type ImageDiffResult } from './test-utils.js';
export { auditUX, defineRule, type AuditOptions, type AuditResult, type AuditIssue, type AuditRule, type LayoutData } from './audit.js';
