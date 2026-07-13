import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

export interface AxeScanOptions {
  /**
   * Axe tags to run. Default matches WCAG 2.0/2.1 A and AA + best practices.
   */
  tags?: string[];
  /**
   * Element selectors to exclude from the scan.
   */
  exclude?: string[];
  /**
   * Element selectors to include (scope the scan to).
   */
  include?: string[];
}

export class A11yReport {
  constructor(public readonly rawResults: AxeResults) {}

  get allViolations(): Result[] {
    return this.rawResults.violations;
  }

  get criticalViolations(): Result[] {
    return this.rawResults.violations.filter((v) => v.impact === 'critical');
  }

  get seriousViolations(): Result[] {
    return this.rawResults.violations.filter((v) => v.impact === 'serious');
  }

  get moderateViolations(): Result[] {
    return this.rawResults.violations.filter((v) => v.impact === 'moderate');
  }

  get minorViolations(): Result[] {
    return this.rawResults.violations.filter((v) => v.impact === 'minor');
  }

  hasViolations(): boolean {
    return this.allViolations.length > 0;
  }

  format(): string {
    if (!this.hasViolations()) {
      return 'No accessibility violations found.';
    }

    const violationSummary = this.allViolations
      .map((violation, index) => {
        const nodes = violation.nodes
          .map((n) => `      - Target: ${n.target.join(', ')}\n        HTML: ${n.html}`)
          .join('\n');
        return `${index + 1}. [Impact: ${violation.impact}] ${violation.id} - ${violation.help}\n    Help URL: ${violation.helpUrl}\n    Violating Nodes:\n${nodes}`;
      })
      .join('\n\n');

    return `Accessibility scan failed with ${this.allViolations.length} violations:\n\n${violationSummary}`;
  }
}

/**
 * Performs an Axe accessibility scan on the given page context using the provided options.
 * Returns an A11yReport instance containing the results and formatting utilities.
 */
export const analyzeAccessibility = async (
  page: Page,
  options: AxeScanOptions,
): Promise<A11yReport> => {
  let builder = new AxeBuilder({ page });

  if (options.tags && options.tags.length > 0) {
    builder = builder.withTags(options.tags);
  }

  if (options.include && options.include.length > 0) {
    builder = builder.include(options.include);
  }

  if (options.exclude && options.exclude.length > 0) {
    builder = builder.exclude(options.exclude);
  }

  const results = await builder.analyze();
  return new A11yReport(results);
};
