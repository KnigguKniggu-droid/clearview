import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('medical repair updates the host total and receipt, then reverts exactly', async ({ page }) => {
  const portal = page.getByTestId('portal-root');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await expect(portal.locator('input[type=checkbox]')).toBeChecked();
  const beforeStyle = await portal.locator('[data-testid=facility-fee]').getAttribute('style');
  await page.getByTestId('safe-toggle').click();
  await expect(portal.locator('input[type=checkbox]')).not.toBeChecked();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await expect(portal.getByTestId('portal-monthly')).toContainText('$0.00');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect(portal.locator('input[placeholder="MM / DD / YYYY"]')).toHaveAttribute('aria-label', /.+/);
  await page.getByTestId('safe-toggle').click();
  await expect(portal.locator('input[type=checkbox]')).toBeChecked();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  expect(await portal.locator('[data-testid=facility-fee]').getAttribute('style')).toBe(beforeStyle);
  await expect(portal.locator('[data-clearview-badge]')).toHaveCount(0);
});

test('telecom removes both add-ons without counting the future renewal rate', async ({ page }) => {
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$55.00');
  await expect(page.getByTestId('portal-monthly')).toContainText('$55.00');
  for (const box of await page.getByTestId('portal-root').locator('input[type=checkbox]').all()) {
    await expect(box).not.toBeChecked();
  }
  await page.getByTestId('reset-portal').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
});

test('utility separates usage-based rates and restores keyboard order', async ({ page }) => {
  await page.getByTestId('scenario-utility').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$19.50');
  await expect(page.getByTestId('receipt-due')).toHaveText('$0.00');
  await expect(page.getByTestId('portal-root').locator('[tabindex="5"]')).toHaveCount(1);
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await expect(page.getByTestId('portal-root').locator('[tabindex="5"]')).toHaveCount(0);
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('portal-root').locator('[tabindex="5"]')).toHaveCount(1);
});

test('user choices rescan and scenario changes discard stale repairs', async ({ page }) => {
  await page.getByTestId('portal-root').locator('input[type=checkbox]').uncheck();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await page.getByTestId('safe-toggle').click();
  await page.getByTestId('scenario-subscription').click();
  await expect(page.getByTestId('safe-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$84.98');
});

test('findings filters and locate controls work', async ({ page }) => {
  await page.getByRole('button', { name: /^Accessibility/ }).click();
  await expect(page.locator('[data-finding-category="dark-pattern"]')).toHaveCount(0);
  await expect(page.locator('[data-finding-category="accessibility"]').first()).toBeVisible();
  await page.locator('[data-finding-category="accessibility"] button').first().click();
  await expect(page.getByTestId('portal-root').locator('[data-clearview-id]')).not.toHaveCount(0);
  await page.getByRole('button', { name: /^Hidden Fees/ }).click();
  await expect(page.locator('[data-finding-category="hidden-fee"]').first()).toBeVisible();
});

test('safe mode enables Enter and Space on the sample payment control', async ({ page }) => {
  await page.getByTestId('safe-toggle').click();
  const payment = page.getByTestId('portal-root').getByText('Submit Payment & Intake', { exact: true });
  await expect(payment).toHaveAttribute('role', 'button');
  await payment.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('portal-root').getByRole('status')).toContainText('Demo');
});

test('reduced motion keeps receipt changes and source links usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
  await page.locator('.receipt-lines button').first().click();
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  await expect(page.getByTestId('receipt-due')).toHaveText('$334.00');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$29.99');
});

test('mobile receipt jump focuses the review, repairs the page, and returns to a source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.intro-enter').click();
  await expect(page.locator('#live-audit')).toBeFocused();
  await page.getByRole('link', { name: 'Receipt & Safe Mode' }).click();
  await expect(page.getByTestId('guard-panel')).toBeFocused();
  await expect(page.getByTestId('receipt-due')).toBeInViewport();
  await expect(page.getByTestId('safe-toggle')).toBeInViewport();
  await page.getByTestId('safe-toggle').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$0.00');
  const source = page.locator('.receipt-lines button').nth(1);
  const sourceId = await source.getAttribute('data-cv-source');
  expect(sourceId).toBeTruthy();
  await source.click();
  const target = page.getByTestId('portal-root').locator(`[data-clearview-id="${sourceId}"]`);
  await expect(target).toBeInViewport();
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(page.getByTestId('facility-fee')).toContainText('$149.00');
});

for (const width of [375, 768, 1440]) {
  test(`layout fits ${width}px and app chrome has no automated accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByTestId('safe-toggle')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    const audit = await new AxeBuilder({ page })
      .include('.topbar').include('.intro-experience').include('.workspace-heading')
      .include('.scenario-bar').include('.workspace-toolbar').include('[data-testid="guard-panel"]')
      .include('.page-footer').analyze();
    expect(audit.violations).toEqual([]);
    await page.screenshot({ path: `test-results/clearview-${width}.png`, fullPage: true });
  });
}

test('normal interactions produce no uncaught browser errors', async ({ page }) => {
  const expectedOrigin = new URL(page.url()).origin;
  const errors: string[] = [];
  const externalRequests: string[] = [];
  const submissions: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== expectedOrigin) externalRequests.push(request.url());
    if (request.method() !== 'GET') submissions.push(`${request.method()} ${request.url()}`);
  });
  await page.reload();
  await page.getByTestId('safe-toggle').click();
  await page.getByTestId('safe-toggle').click();
  await page.getByTestId('scenario-subscription').click();
  await page.getByTestId('safe-toggle').click();
  await page.getByTestId('scenario-utility').click();
  await page.getByRole('button', { name: 'Review enrollment', exact: true }).click();
  await expect(page.getByTestId('portal-root').getByRole('status')).toContainText('No energy enrollment');
  await page.getByTestId('reset-portal').click();
  await expect(page.getByTestId('receipt-monthly')).toHaveText('$19.50');
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(submissions).toEqual([]);
});
