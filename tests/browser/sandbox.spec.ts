import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import axe from 'axe-core';
import { parseAuditExport } from '@clearview/reporting';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
});

async function review(page: Page, removeAddons = false) {
  await page.getByTestId('safe-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Choose what ClearView changes.' });
  await expect(dialog).toBeVisible();
  for (const choice of await dialog.getByRole('checkbox', { name: /^Remove selected add-on/ }).all()) {
    await expect(choice).not.toBeChecked();
    if (removeAddons) await choice.check();
  }
  return dialog;
}
async function apply(page: Page, removeAddons = false) {
  const dialog = await review(page, removeAddons);
  await dialog.getByRole('button', { name: 'Apply selected changes' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.protection-card>p').first()).toContainText(/[1-9]\d* page elements changed/);
}
async function exportFile(page: Page, format: 'JSON' | 'Markdown' = 'JSON') {
  await page.getByLabel('Export report', { exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp('^' + format + ' ·') }).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).not.toBeNull();
  return { text: await readFile(path!, 'utf8'), filename: download.suggestedFilename() };
}
async function importFile(page: Page, text: string) {
  await page.getByLabel('Open ClearView report file').setInputFiles({ name: 'audit.json', mimeType: 'application/json', buffer: Buffer.from(text) });
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
const sevenToOneSource = axe.source + ';axe.configure(' + JSON.stringify({ checks: [{ id: 'color-contrast', options: { ignoreUnicode: true, ignoreLength: false, ignorePseudo: false, boldValue: 700, boldTextPt: 14, largeTextPt: 18, contrastRatio: { normal: { expected: 7 }, large: { expected: 7 } }, pseudoSizeThreshold: .25, shadowOutlineEmMax: .1, textStrokeEmMin: .03 } }] }) + ');';
async function auditUi(page: Page, view: string, scope?: string) {
  const builder = new AxeBuilder({ page, axeSource: sevenToOneSource });
  if (scope) builder.include(scope);
  else builder.exclude('[data-testid="portal-root"]');
  const result = await builder.analyze();
  await test.info().attach(view + '-axe-7-to-1.json', { body: JSON.stringify({ violations: result.violations, incomplete: result.incomplete }), contentType: 'application/json' });
  expect.soft(result.violations, view + ' accessibility including 7:1 text').toEqual([]);
}
async function checkTextAndTargets(page: Page) {
  const failures = await page.evaluate(() => {
    const metadata = '.rule-details,.technical-summary,.receipt-columns,.safe-control-meta,.eyebrow,.workspace-toolbar p,.session-notice,.pane-heading>.review-state,.privacy-badge,.portal-caption,.source-context,.address,.portal-protection,.page-footer,.money-at-a-glance>span,.charge-status,.audit-heading h3>span,.receipt-change p,.removed-charges b,.repair-choice small,.dialog-actions>span,.local-file-note,.install-copy>small,.install-steps code';
    const failures: string[] = [];
    const visible = (element: Element) => !element.closest('[data-testid="portal-root"],.visually-hidden,svg') && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const walker = document.createTreeWalker(document.querySelector('.app-shell')!, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!node.textContent?.trim() || !parent || !visible(parent)) continue;
      const minimum = parent.closest(metadata) ? 14 : 16;
      const actual = parseFloat(getComputedStyle(parent).fontSize);
      if (actual < minimum) failures.push('Text ' + node.textContent.trim().slice(0, 65) + ': ' + actual + 'px < ' + minimum);
    }
    for (const control of document.querySelectorAll('.app-shell button,.app-shell a,.app-shell summary,.repair-choice>label')) {
      if (!visible(control) || control.matches('.skip-link')) continue;
      const rect = control.getBoundingClientRect();
      if (rect.width < 43.9 || rect.height < 43.9) failures.push('Target ' + (control.textContent?.trim().slice(0, 55) || control.getAttribute('aria-label')) + ': ' + rect.width + 'x' + rect.height);
      if (control.tagName === 'BUTTON' && parseFloat(getComputedStyle(control).fontSize) < 16) failures.push('Button font below16: ' + control.textContent?.trim());
    }
    return failures;
  });
  expect.soft(failures, '16px body/buttons;14px metadata;44px targets').toEqual([]);
}
async function checkDialogFocusVisibility(page: Page) {
  const covered: string[] = [];
  const count = await page.locator('dialog button:not(:disabled),dialog input:not(:disabled),dialog summary').count();
  for (let index = 0; index <= count; index++) {
    await page.keyboard.press('Tab');
    const overlap = await page.evaluate(() => {
      const active = document.activeElement, footer = document.querySelector('.dialog-actions');
      if (!active?.closest('.repair-choices') || !footer) return null;
      const focus = active.getBoundingClientRect(), actionBar = footer.getBoundingClientRect();
      return focus.bottom > actionBar.top && focus.top < actionBar.bottom ? active.tagName + ': ' + (active.textContent?.trim() || active.closest('label')?.textContent?.trim().slice(0, 75)) : null;
    });
    if (overlap) covered.push(overlap);
  }
  expect(covered, 'Native keyboard focus must not be hidden by the action bar').toEqual([]);
}
// Read a real ZIP central directory and inflate its manifest, rather than accepting an HTML fallback.
function zipEntry(zip: Buffer, filename: string) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(end).toBeGreaterThanOrEqual(0);
  let position = zip.readUInt32LE(end + 16);
  for (let index = 0; index < zip.readUInt16LE(end + 10); index++) {
    expect(zip.readUInt32LE(position)).toBe(0x02014b50);
    const method = zip.readUInt16LE(position + 10), size = zip.readUInt32LE(position + 20);
    const nameLength = zip.readUInt16LE(position + 28);
    const name = zip.toString('utf8', position + 46, position + 46 + nameLength).replaceAll('\\', '/');
    if (name === filename) {
      const offset = zip.readUInt32LE(position + 42);
      expect(zip.readUInt32LE(offset)).toBe(0x04034b50);
      const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
      const data = zip.subarray(start, start + size);
      expect([0, 8]).toContain(method);
      return method === 8 ? inflateRawSync(data) : data;
    }
    position += 46 + nameLength + zip.readUInt16LE(position + 30) + zip.readUInt16LE(position + 32);
  }
  throw new Error('Downloaded ZIP is missing ' + filename);
}

test('workspace opens on usable evidence and explains its limits', async ({ page }) => {
  // Calibrate the harness: 5.74:1 must fail for both normal and large text.
  const specimen = await page.context().newPage();
  try {
    await specimen.setContent('<html lang="en"><head><title>Contrast calibration</title></head><body style="background:white"><main><p id="normal" style="font-size:16px;color:#666">Normal text</p><p id="large" style="font-size:32px;color:#666">Large text</p><p id="good" style="color:#111827">High contrast</p></main></body></html>');
    const calibration = await new AxeBuilder({ page: specimen, axeSource: sevenToOneSource }).withRules(['color-contrast']).analyze();
    const failed = calibration.violations.flatMap(item => item.nodes);
    expect(failed.flatMap(node => node.target).sort()).toEqual(['#large', '#normal']);
    for (const node of failed) expect(node.any[0].data.expectedContrastRatio).toBe('7:1');
    expect(calibration.incomplete).toEqual([]);
  } finally { await specimen.close(); }
  await expect(page.getByRole('heading', { name: 'Medical Bill', exact: true })).toBeInViewport();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(page.getByRole('navigation', { name: 'More ClearView tools' })).toBeVisible();
  await expect(page.locator('.source-context')).toContainText('Simulated website. No real transaction.');
  await expect(page.locator('.technical-summary')).not.toHaveAttribute('open');
  await page.locator('.technical-summary summary').click();
  await expect(page.locator('.technical-summary p').first()).toContainText('They are not certification.');
  await page.locator('.technical-summary summary').click();
  await expect(page.locator('.rule-details[open]')).toHaveCount(0);
  const rule = page.locator('.rule-details').first();
  await rule.locator('summary').click();
  await expect(rule).toHaveAttribute('open');
  await expect(rule.locator('code')).toBeVisible();
  await rule.locator('summary').click();
  await expect(page.locator('.receipt-note')).toContainText('current fixed US-dollar charges we can identify');
  await expect(page.getByTestId('safe-toggle')).toHaveText('Protect Me & Fix This Page');
  await expect(page.getByRole('heading', { name: 'What You Are Actually Paying' })).toBeVisible();
  expect((await page.locator('.topbar').boundingBox())!.height).toBe(64);
  const source = (await page.locator('.portal-column').boundingBox())!;
  const assistant = (await page.getByTestId('guard-panel').boundingBox())!;
  expect(source.width / (source.width + assistant.width)).toBeCloseTo(.55, 2);
  expect(assistant.x - source.x - source.width).toBeCloseTo(24, 0);
  await page.keyboard.press('Tab');
  await page.getByTestId('safe-toggle').focus();
  await expect(page.getByTestId('safe-toggle')).toHaveCSS('outline-width', '3px');
  await expect(page.getByTestId('safe-toggle')).toHaveCSS('outline-style', 'solid');
  expect((await page.getByTestId('safe-toggle').boundingBox())!.height).toBeGreaterThanOrEqual(52);
  await page.getByRole('button', { name: 'Rescan portal' }).click();
  await expect(page.locator('.session-notice')).toContainText('Scan updated.');
});

test('default repair changes real nodes and preserves the selected medical add-on', async ({ page }) => {
  const portal = page.getByTestId('portal-root'), fee = portal.getByTestId('facility-fee');
  const style = await fee.getAttribute('style');
  const dialog = await review(page);
  await expect(portal.locator('input[type=checkbox]')).toBeChecked();
  await expect(fee).toHaveAttribute('style', style!);
  await dialog.getByRole('button', { name: 'Apply selected changes' }).click();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(portal.locator('input[type=checkbox]')).toBeChecked();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(portal.getByPlaceholder('MM / DD / YYYY')).toHaveAttribute('aria-label', /.+/);
  await expect(fee).not.toHaveAttribute('style', style!);
  const data = parseAuditExport((await exportFile(page)).text);
  expect(data.report.repairSummary.nodes).toBeGreaterThan(0);
  await expect(page.locator('.protection-card>p').first()).toContainText(data.report.repairSummary.nodes + ' page elements changed');
  for (const badge of await portal.locator('[data-clearview-badge]').all()) expect(await badge.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(14);
  await page.getByTestId('safe-toggle').click();
  await expect(fee).toHaveAttribute('style', style!);
  await expect(portal.getByPlaceholder('MM / DD / YYYY')).not.toHaveAttribute('aria-label');
  await expect(portal.locator('[data-clearview-badge]')).toHaveCount(0);
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('explicit add-on consent updates medical host and receipt totals, then restores both', async ({ page }) => {
  const portal = page.getByTestId('portal-root');
  await apply(page, true);
  await expect(portal.locator('input[type=checkbox]')).not.toBeChecked();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await expect(portal.getByTestId('portal-monthly')).toHaveText('$0.00/mo');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(page.locator('.removed-charges')).toContainText('$29.99/mo');
  await page.getByTestId('safe-toggle').click();
  await expect(portal.locator('input[type=checkbox]')).toBeChecked();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(portal.getByTestId('portal-monthly')).toHaveText('$29.99/mo');
  await expect(page.locator('.session-notice')).toContainText('Original page state restored.');
});

test('repair review can be cancelled and cannot apply an empty selection', async ({ page }) => {
  const dialog = await review(page);
  for (const choice of await dialog.getByRole('checkbox').all()) await choice.uncheck();
  await expect(dialog.getByRole('button', { name: 'Apply selected changes' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('safe-toggle')).toBeFocused();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(page.getByTestId('portal-root').locator('[data-clearview-badge]')).toHaveCount(0);
});

test('telecom excludes the future rate and removes only opted-in add-ons', async ({ page }) => {
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
  await expect(page.locator('.other-prices')).toContainText('$89.99');
  await expect(page.locator('.other-prices')).toContainText(/future|renewal|promotional/i);
  await apply(page, true);
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$55.00');
  await expect(page.getByTestId('portal-monthly')).toHaveText('$55.00/mo');
  for (const choice of await page.getByTestId('portal-root').locator('input[type=checkbox]').all()) await expect(choice).not.toBeChecked();
  await expect(page.locator('.other-prices')).toContainText('$89.99');
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
});

test('senior sample exposes 88 due and 14.99 monthly without an eligibility claim', async ({ page }) => {
  await page.getByTestId('scenario-senior').click();
  await expect(page.getByTestId('receipt-due')).toHaveText('$88.00');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$14.99');
  await expect(page.getByTestId('portal-root')).toContainText('does not determine tax benefits or eligibility');
  await expect(page.locator('.receipt-lines')).toContainText('$49.00');
  await apply(page, true);
  await expect(page.getByTestId('receipt-due')).toHaveText('$88.00');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await expect(page.getByTestId('portal-root').locator('[tabindex="4"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Review sample request', exact: true }).click();
  await expect(page.getByTestId('portal-root').getByRole('status')).toHaveText('Demo complete. No application, payment, or tax filing was submitted.');
  await page.getByTestId('reset-portal').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$14.99');
  await expect(page.getByTestId('portal-root').locator('[tabindex="4"]')).toHaveCount(1);
  await expect(page.getByTestId('portal-root').getByRole('status')).toHaveCount(0);
});

test('filters, Locate, return focus, and reset work together', async ({ page }) => {
  await page.getByRole('button', { name: 'Hard to Read', exact: true }).click();
  await expect(page.locator('[data-finding-category="dark-pattern"]')).toHaveCount(0);
  await expect(page.locator('[data-finding-category="accessibility"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Money Traps', exact: true }).click();
  const locate = page.locator('[data-finding-category="hidden-fee"]').first().getByRole('button', { name: /^Show on Page:/ });
  const sourceId = await locate.getAttribute('data-cv-source');
  expect(sourceId).toBeTruthy();
  await locate.click();
  await expect(page.getByTestId('portal-root').locator('[data-clearview-id="' + sourceId + '"]')).toHaveCSS('outline-style', 'solid');
  await expect(page.locator('.session-notice')).toContainText('Source highlighted');
  await page.getByRole('button', { name: 'Return to assistant' }).click();
  await expect(page.getByTestId('guard-panel')).toBeFocused();
  await page.getByTestId('reset-portal').click();
  await expect(page.getByRole('button', { name: 'All Issues', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Return to assistant' })).toHaveCount(0);
  await expect(page.locator('[data-finding-category="dark-pattern"]').first()).toBeVisible();
});

test('native choices rescan and scenario switches clear repairs and filters', async ({ page }) => {
  await page.getByTestId('portal-root').locator('input[type=checkbox]').uncheck();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await apply(page);
  await page.getByRole('button', { name: 'Hard to Read', exact: true }).click();
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
  await expect(page.getByRole('button', { name: 'All Issues', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('portal-root').locator('[data-clearview-badge]')).toHaveCount(0);
});

test('keyboard review traps focus and repaired payment responds to Enter and Space', async ({ page }) => {
  await page.getByTestId('safe-toggle').focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Apply selected changes' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close repair review' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Apply selected changes' })).toBeFocused();
  await page.keyboard.press('Enter');
  const payment = page.getByTestId('portal-root').getByRole('button', { name: 'Submit Payment & Intake' });
  await payment.focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('portal-root').getByRole('status')).toHaveText('Demo complete. No payment was submitted.');
  await page.getByTestId('reset-portal').click();
  await apply(page);
  await payment.focus(); await page.keyboard.press('Space');
  await expect(page.getByTestId('portal-root').getByRole('status')).toHaveText('Demo complete. No payment was submitted.');
});

test('a delayed import cannot override a newer scenario selection', async ({ page }) => {
  const exported = await exportFile(page);
  await page.evaluate(() => {
    File.prototype.text = function () {
      document.documentElement.dataset.importPending = 'true';
      return new Promise<string>(resolve => document.addEventListener('clearview-test-release-import', event => resolve((event as CustomEvent<string>).detail), { once: true }));
    };
  });
  await importFile(page, exported.text);
  await expect(page.locator('html')).toHaveAttribute('data-import-pending', 'true');
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
  await page.evaluate(async text => {
    document.dispatchEvent(new CustomEvent('clearview-test-release-import', { detail: text }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, exported.text);
  await expect(page.getByTestId('scenario-subscription')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('portal-root')).toBeVisible();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
});

test('later host price changes and manual checkbox choices are not attributed to ClearView', async ({ page }) => {
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
  await apply(page);
  // Simulate a host price update while the repaired page remains open.
  await page.getByTestId('portal-root').locator('.charge-row strong').evaluate(node => { node.textContent = '$45.00/mo'; });
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$74.98');
  await expect(page.locator('.removed-charges')).toHaveCount(0);
  await expect(page.locator('.receipt-change')).toHaveCount(0);
  await page.getByTestId('portal-root').locator('input[type=checkbox]').first().uncheck();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$54.99');
  await expect(page.locator('.removed-charges')).toHaveCount(0);
  await expect(page.locator('.receipt-change')).toHaveCount(0);
  // Medical has other owned label/keyboard repairs, so overwriting one style
  // creates partial ownership rather than expiring the only repaired node.
  await page.getByTestId('scenario-medical').click();
  await apply(page);
  await page.getByTestId('facility-fee').evaluate(node => { node.style.fontSize = '18px'; });
  await expect(page.locator('.protection-heading h3')).toHaveText('Some selected changes are applied.');
  await expect(page.locator('.partial-notice')).toContainText('Some changes no longer match the page');
});

test('a resized workspace reviews current evidence and preserves default financial consent', async ({ page }) => {
  const before = parseAuditExport((await exportFile(page)).text).report.timestamp;
  await page.setViewportSize({ width: 375, height: 900 });
  await fits(page);
  await expect.poll(async () => parseAuditExport((await exportFile(page)).text).report.timestamp).not.toBe(before);
  const dialog = await review(page);
  await expect(dialog.getByRole('checkbox', { name: /^Remove selected add-on/ })).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Apply selected changes' }).click();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(page.getByTestId('portal-root').locator('input[type=checkbox]')).toBeChecked();
});

test('JSON export imports locally as read-only evidence and Markdown retains the findings', async ({ page }) => {
  const requests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on('request', request => { if (request.method() !== 'GET' || (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin)) requests.push(request.method() + ' ' + request.url()); });
  await page.getByTestId('portal-root').getByPlaceholder('Member ID').fill('PRIVATE-INPUT-NOT-EXPORTED');
  const exported = await exportFile(page);
  expect(exported.filename).toBe('clearview-audit.json');
  expect(exported.text).not.toContain('PRIVATE-INPUT-NOT-EXPORTED');
  const data = parseAuditExport(exported.text);
  expect(data.source.kind).toBe('sample');
  expect(data.report.summary.totalRecurringMonthly).toBe(29.99);
  await page.getByRole('button', { name: 'Open report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep the evidence in view.' })).toBeVisible();
  await importFile(page, exported.text);
  await expect(page.locator('.review-state')).toHaveText('Saved report');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(page.getByTestId('portal-root')).toHaveCount(0);
  await expect(page.getByTestId('safe-toggle')).toHaveCount(0);
  await expect(page.locator('[data-cv-source]')).toHaveCount(0);
  await expect(page.locator('.snapshot-context')).toContainText(data.report.limitations[0]);
  const markdown = await exportFile(page, 'Markdown');
  expect(markdown.filename).toBe('clearview-audit.md');
  expect(markdown.text).toContain('334'); expect(markdown.text).toContain('29.99');
  expect(markdown.text).toMatch(/read.only/i);
  expect(requests).toEqual([]);
  await page.getByRole('button', { name: 'Live workspace', exact: true }).click();
  await expect(page.getByTestId('portal-root')).toBeVisible();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('invalid and oversized reports show an error without replacing evidence', async ({ page }) => {
  await importFile(page, '{broken');
  await expect(page.getByRole('alert')).toContainText(/JSON/i);
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(page.getByTestId('safe-toggle')).toBeDisabled();
  await page.getByRole('button', { name: 'Rescan portal' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('safe-toggle')).toBeEnabled();
  await importFile(page, ' '.repeat(1_048_577));
  await expect(page.getByRole('alert')).toContainText('too large');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await page.getByRole('button', { name: 'Dismiss error' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('large imported totals remain exact and separate at 375px with doubled text', async ({ page }) => {
  const data = parseAuditExport((await exportFile(page)).text);
  data.source.label = 'Large amount layout fixture';
  let immediate = 0, monthly = 0;
  for (const amount of data.report.financialCommitments.filter(item => item.includedInTotals)) {
    const oldText = amount.amountText;
    amount.numericValue = 9_999_999.99;
    amount.amountText = '$9,999,999.99' + (amount.cadence === 'monthly' ? '/mo' : '');
    amount.label = amount.label.replace(oldText, amount.amountText);
    if (amount.cadence === 'monthly') monthly += 999_999_999;
    else immediate += 999_999_999;
  }
  data.report.summary.totalImmediateDue = immediate / 100;
  data.report.summary.totalRecurringMonthly = monthly / 100;
  await page.setViewportSize({ width: 375, height: 900 });
  await importFile(page, JSON.stringify(data));
  await expect(page.locator('.review-state')).toHaveText('Saved report');
  const due = page.getByTestId('receipt-due'), recurring = page.getByTestId('receipt-monthly');
  await expect(due).toHaveText('$19,999,999.98');
  await expect(recurring).toHaveText('$9,999,999.99');
  // Diagnostic text scaling. This is not a claim of OS/browser zoom coverage.
  for (const amount of [due, recurring]) await amount.evaluate(node => { node.style.fontSize = parseFloat(getComputedStyle(node).fontSize) * 2 + 'px'; });
  await fits(page);
  const boxes = await Promise.all([due, recurring].map(amount => amount.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    const { left, right, top, bottom } = range.getBoundingClientRect(); return { left, right, top, bottom };
  })));
  for (const box of boxes) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(375); }
  const [a, b] = boxes;
  expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
});

test('installation downloads a usable Manifest V3 extension archive', async ({ page }) => {
  await page.getByRole('button', { name: /Get extension/ }).click();
  await expect(page.getByRole('heading', { name: /Bring the inspector/ })).toBeVisible();
  await expect(page.locator('.install-steps')).toContainText('chrome://extensions');
  await expect(page.locator('.install-note')).toContainText('not a Chrome Web Store listing');
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download extension ZIP' }).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe('clearview-extension.zip');
  const path = await download.path(); expect(path).not.toBeNull();
  const zip = await readFile(path!);
  const manifest = JSON.parse(zipEntry(zip, 'manifest.json').toString('utf8'));
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions).toEqual(expect.arrayContaining(['activeTab', 'sidePanel', 'scripting']));
  expect(zipEntry(zip, manifest.background.service_worker).length).toBeGreaterThan(0);
  expect(zipEntry(zip, manifest.side_panel.default_path).length).toBeGreaterThan(0);
});

test('reduced motion preserves receipt navigation, repair, and undo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await apply(page, true);
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await page.locator('.receipt-lines button').first().click();
  await page.getByRole('button', { name: 'Return to assistant' }).click();
  await expect(page.getByTestId('guard-panel')).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(item => item.playState === 'running').length)).toBe(0);
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
});

for (const width of [375, 768, 1440]) {
  test(`workspace, dialog, saved report, and installation are accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await fits(page);
    // Only the deliberately faulty sample is excluded. HUD, nav, source chrome, and footer remain tested.
    await auditUi(page, 'Workspace');
    await checkTextAndTargets(page);
    for (const button of await page.locator('.filter-tabs button').all()) {
      const box = await button.boundingBox();
      expect.soft(box!.width, 'Filter target width').toBeGreaterThanOrEqual(44); expect.soft(box!.height, 'Filter target height').toBeGreaterThanOrEqual(44);
    }
    const exported = await exportFile(page);
    const dialog = await review(page); await fits(page);
    await auditUi(page, 'Repair dialog', '.repair-dialog');
    await checkTextAndTargets(page);
    await checkDialogFocusVisibility(page);
    await dialog.getByRole('button', { name: 'Close repair review' }).click();
    await importFile(page, exported.text);
    await expect(page.locator('.review-state')).toHaveText('Saved report'); await fits(page);
    await auditUi(page, 'Saved report');
    await checkTextAndTargets(page);
    await page.getByRole('button', { name: /Get extension/ }).click();
    await expect(page.locator('.install-page')).toBeVisible(); await fits(page);
    await auditUi(page, 'Installation');
    await checkTextAndTargets(page);
    await page.screenshot({ path: `test-results/clearview-install-${width}.png`, fullPage: true });
  });
}

test('normal interactions create no browser errors, remote requests, or submissions', async ({ page }) => {
  const origin = new URL(page.url()).origin;
  const errors: string[] = [], external: string[] = [], submissions: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.push(request.url());
    if (request.method() !== 'GET') submissions.push(request.method() + ' ' + request.url());
  });
  await page.reload(); await apply(page); await page.getByTestId('safe-toggle').click();
  await page.getByTestId('scenario-subscription').click(); await apply(page, true);
  await page.getByRole('button', { name: 'Confirm my plan', exact: true }).click();
  await expect(page.getByTestId('portal-root').getByRole('status')).toHaveText('Demo complete. No subscription was created.');
  await page.getByTestId('scenario-senior').click();
  await page.getByRole('button', { name: 'Review sample request', exact: true }).click();
  await expect(page.getByTestId('portal-root').getByRole('status')).toContainText('No application, payment, or tax filing');
  expect(errors).toEqual([]); expect(external).toEqual([]); expect(submissions).toEqual([]);
});
