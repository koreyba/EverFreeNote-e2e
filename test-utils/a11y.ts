import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
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
  /**
   * For each violation rule, highlights all affected elements on the page with a
   * red outline and semi-transparent overlay, captures a full-page screenshot,
   * then removes the highlights. Attaches one screenshot per rule to testInfo.
   *
   * Elements inside iframes (compound axe selectors) are skipped since
   * cross-frame style injection requires additional frame traversal.
   */
  async captureViolationScreenshots(page: Page, testInfo: TestInfo): Promise<void> {
    for (const violation of this.allViolations) {
      // axe target is Array<string | string[]>; skip nested (iframe) selectors
      const selectors = violation.nodes
        .map((node) => node.target)
        .filter((target) => target.length === 1 && typeof target[0] === 'string')
        .map((target) => target[0] as string);

      if (selectors.length === 0) continue;

      // Inject highlight overlay on all violating elements for this rule
      await page.evaluate((cssSelectors: string[]) => {
        const MARKER = '__a11y_highlight__';
        cssSelectors.forEach((selector) => {
          try {
            document.querySelectorAll(selector).forEach((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.dataset[MARKER] = [
                htmlEl.style.outline,
                htmlEl.style.backgroundColor,
              ].join('|');
              htmlEl.style.outline = '3px solid #e53e3e';
              htmlEl.style.backgroundColor = 'rgba(229, 62, 62, 0.18)';
            });
          } catch {
            // Invalid or unsupported selector — skip silently
          }
        });
      }, selectors);

      const screenshot = await page.screenshot({ fullPage: true });
      const ruleName = violation.id.replace(/[^a-z0-9-]/gi, '-');
      await testInfo.attach(`a11y-violation-${ruleName}.png`, {
        body: screenshot,
        contentType: 'image/png',
      });

      // Restore original styles
      await page.evaluate((cssSelectors: string[]) => {
        const MARKER = '__a11y_highlight__';
        cssSelectors.forEach((selector) => {
          try {
            document.querySelectorAll(selector).forEach((el) => {
              const htmlEl = el as HTMLElement;
              const saved = htmlEl.dataset[MARKER];
              if (saved !== undefined) {
                const [outline, backgroundColor] = saved.split('|');
                htmlEl.style.outline = outline ?? '';
                htmlEl.style.backgroundColor = backgroundColor ?? '';
                delete htmlEl.dataset[MARKER];
              }
            });
          } catch {
            // Ignore
          }
        });
      }, selectors);
    }
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
