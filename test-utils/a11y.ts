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
      return '# ♿ Accessibility Audit\n\nNo accessibility violations found. 🎉';
    }

    const lines: string[] = [];
    lines.push(`# ♿ Accessibility Audit Violations (Total Rules Failed: ${this.allViolations.length})`);
    lines.push('');
    lines.push('---');
    lines.push('');

    this.allViolations.forEach((violation) => {
      const severityEmoji = violation.impact === 'critical' || violation.impact === 'serious' ? '🛑' : '⚠️';
      lines.push(`## ${severityEmoji} [${violation.id}] ${violation.help}`);
      lines.push(`- **Severity**: ${violation.impact}`);
      lines.push(`- **Description**: ${violation.description}`);
      if (violation.helpUrl) {
        lines.push(`- **Learn More**: [Deque University Link](${violation.helpUrl})`);
      }
      lines.push('');
      lines.push('### Affected Elements:');
      lines.push('');

      violation.nodes.forEach((node, nodeIndex) => {
        lines.push(`#### Element ${nodeIndex + 1}`);
        lines.push(`- **Selector**: \`${node.target.join(' > ')}\``);
        lines.push('- **HTML Snippet**:');
        lines.push('  ```html');
        lines.push(`  ${node.html}`);
        lines.push('  ```');
        if (node.failureSummary) {
          lines.push('- **How to Fix**:');
          lines.push('  > [!TIP]');
          const formattedSummary = node.failureSummary
            .split('\n')
            .map((line) => `  > ${line}`)
            .join('\n');
          lines.push(formattedSummary);
        }
        lines.push('');
      });

      lines.push('---');
      lines.push('');
    });

    return lines.join('\n');
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
