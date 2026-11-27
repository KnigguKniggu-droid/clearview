import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const evidence = resolve(root, 'docs/evidence');
const work = resolve(root, 'work/extension');
await mkdir(evidence, { recursive: true });
await mkdir(work, { recursive: true });
const extensionPath = resolve(root, 'apps/extension/dist');
const context = await chromium.launchPersistentContext(resolve(work, `browser-profile-${Date.now()}`), {
  channel: 'chromium', headless: true, viewport: { width: 1440, height: 1000 },
  args: ['--enable-unsafe-extension-debugging', '--remote-debugging-port=9551', `--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});
const receipt = { method: 'Real unpacked Chromium extension; CDP Extensions.triggerAction invokes the toolbar action. No host permission changes.', checks: [], screenshots: [] };
async function saveReceipt() {
  const checkedAt = new Date().toISOString();
  await writeFile(resolve(work, `runtime-${checkedAt.replaceAll(':', '-')}.json`), JSON.stringify({ checkedAt, ...receipt }, null, 2));
  await writeFile(resolve(evidence, 'extension-browser-receipt.json'), JSON.stringify({
    checkedAt, status: receipt.status, browser: receipt.browser, method: receipt.method,
    checks: receipt.checks, error: receipt.error,
    screenshots: receipt.screenshots.filter(path => !path.includes('failure')).map(path => relative(root, path).replaceAll('\\', '/'))
  }, null, 2));
}
let currentPanel;
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function attach(session, targetId) {
  const { sessionId } = await session.send('Target.attachToTarget', { targetId, flatten: false });
  let id = 0;
  const pending = new Map();
  session.on('Target.receivedMessageFromTarget', event => {
    if (event.sessionId !== sessionId) return;
    const message = JSON.parse(event.message);
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') receipt.checks.push({ name: 'Panel runtime exception', error: message.params.exceptionDetails.text });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const current = ++id;
    const timer = setTimeout(() => { pending.delete(current); reject(new Error(`Timed out: ${method}`)); }, 20000);
    pending.set(current, { resolve, reject, timer });
    void session.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: current, method, params }) }).catch(reject);
  });
  await send('Runtime.enable');
  await send('Page.enable');
  return {
    send,
    async evaluate(expression) { const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value; },
    async screenshot(path) { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(path, Buffer.from(result.data, 'base64')); receipt.screenshots.push(path); }
  };
}
async function until(callback, label) { for (let count = 0; count < 100; count++) { if (await callback()) return; await sleep(100); } throw new Error(`Timed out waiting for ${label}`); }
async function click(panel, selector) {
  const point = await panel.evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)throw Error('Missing button');element.scrollIntoView({block:'center'});const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await panel.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await panel.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
}
try {
  const browser = context.browser();
  const browserSession = await browser.newBrowserCDPSession();
  const info = await browserSession.send('Browser.getVersion');
  receipt.browser = info.product;
  const extensions = await browserSession.send('Extensions.getExtensions');
  receipt.extensions = extensions.extensions;
  const extension = extensions.extensions.find(item => item.path.toLowerCase() === extensionPath.toLowerCase());
  if (!extension) throw new Error('The unpacked extension was not loaded.');
  const worker = context.serviceWorkers().find(item => item.url().includes(extension.id)) ?? await context.waitForEvent('serviceworker');
  await worker.evaluate(() => chrome.action.onClicked.addListener(tab => { globalThis.clearviewTestActionTab = tab; }));
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('http://127.0.0.1:4173/?standalone=medical');
  await page.locator('input[type=checkbox]').waitFor();
  const pageSession = await context.newCDPSession(page);
  const { targetInfo } = await pageSession.send('Target.getTargetInfo');
  const beforeAccess = await worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] }); return { denied: false }; }
    catch (error) { return { denied: true, error: error.message }; }
  });
  receipt.checks.push({ name: 'No page access before toolbar action', ...beforeAccess });
  if (!beforeAccess.denied) throw new Error('Unexpected page access before toolbar action.');
  const tabTargets = await browserSession.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }, { exclude: true }] });
  const tabTarget = tabTargets.targetInfos.find(item => item.url === page.url()) ?? tabTargets.targetInfos[0];
  await browserSession.send('Extensions.triggerAction', { id: extension.id, targetId: tabTarget?.targetId ?? targetInfo.targetId });
  await new Promise(resolve => setTimeout(resolve, 700));
  const targets = await browserSession.send('Target.getTargets');
  receipt.targetsAfterAction = targets.targetInfos.map(item => ({ id: item.targetId, type: item.type, url: item.url }));
  receipt.pagesAfterAction = context.pages().map(item => item.url());
  const panelTarget = targets.targetInfos.find(item => item.url === `chrome-extension://${extension.id}/index.html`);
  if (!panelTarget) throw new Error('Toolbar action did not create the sidepanel.');
  const panel = await attach(browserSession, panelTarget.targetId);
  currentPanel = panel;
  receipt.afterActionAccess = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    try { await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['contentScript.js'] }); return { tabs, permitted: true, actionTab: globalThis.clearviewTestActionTab }; }
    catch (error) { return { tabs, permitted: false, error: error.message, actionTab: globalThis.clearviewTestActionTab }; }
  });
  receipt.panelTabs = await panel.evaluate('chrome.tabs.query({active:true,currentWindow:true})');
  await until(() => panel.evaluate(`Boolean(document.querySelector('.scan-button:not(:disabled)'))`), 'panel ready');
  await click(panel, '.scan-button');
  await until(() => panel.evaluate(`Boolean(document.querySelector('.safe-button'))`), 'local report');
  const localBefore = await panel.evaluate(`({totals:Array.from(document.querySelectorAll('.totals strong')).map(e=>e.textContent), findings:document.querySelector('.count')?.textContent,error:document.querySelector('.error')?.textContent})`);
  receipt.checks.push({ name: 'Local medical report through real sidepanel', ...localBefore });
  if (localBefore.totals.join('|') !== '$334.00|$29.99') throw new Error(`Unexpected local receipt: ${JSON.stringify(localBefore)}`);
  await panel.screenshot(resolve(evidence, 'extension-medical-panel-before.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-medical-page-before.png') });
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='true'`), 'local safe mode');
  const localAfter = await panel.evaluate(`({totals:Array.from(document.querySelectorAll('.totals strong')).map(e=>e.textContent),findings:document.querySelector('.count')?.textContent})`);
  const localCheckbox = await page.locator('input[type=checkbox]').isChecked();
  receipt.checks.push({ name: 'Local safe repair and live receipt', ...localAfter, checkboxChecked: localCheckbox });
  if (localAfter.totals.join('|') !== '$334.00|$0.00' || localCheckbox) throw new Error('Local safe repair failed.');
  await panel.screenshot(resolve(evidence, 'extension-medical-panel-after.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-medical-page-after.png') });
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='false'`), 'local revert');
  if (!await page.locator('input[type=checkbox]').isChecked()) throw new Error('Local revert did not restore checkbox.');
  receipt.checks.push({ name: 'Local revert restores checkbox', passed: true });

  await page.goto('http://127.0.0.1:4173/');
  await page.locator('[data-testid=portal-root]').waitFor();
  receipt.medicalFindingEvidence = await page.evaluate(async source => {
    const analyzer = await import(source);
    return analyzer.scanDocument(document.querySelector('[data-testid=portal-root]')).findings.map(item => ({ rule: item.ruleId, evidence: item.evidenceText, explanation: item.plainLanguageExplanation }));
  }, `/@fs/${root.replaceAll('\\', '/')}/packages/analyzer/src/index.ts`);
  await writeFile(resolve(evidence, 'medical-finding-evidence.json'), JSON.stringify(receipt.medicalFindingEvidence, null, 2));
  await page.goto('https://www.w3.org/WAI/demos/bad/before/home.html', { waitUntil: 'load' });
  await page.screenshot({ path: resolve(evidence, 'extension-w3c-page-initial.png') });
  await sleep(1000);
  await until(() => panel.evaluate(`!document.querySelector('.safe-button')`), 'navigation clears report');
  receipt.checks.push({ name: 'Navigation clears the old report', passed: true });
  const publicTabs = await browserSession.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }, { exclude: true }] });
  const publicTarget = publicTabs.targetInfos.find(item => item.url === page.url());
  await browserSession.send('Extensions.triggerAction', { id: extension.id, targetId: publicTarget.targetId });
  await sleep(500);
  const refreshedTargets = await browserSession.send('Target.getTargets');
  const publicPanelTarget = refreshedTargets.targetInfos.find(item => item.url === `chrome-extension://${extension.id}/index.html`);
  const publicPanel = publicPanelTarget.targetId === panelTarget.targetId ? panel : await attach(browserSession, publicPanelTarget.targetId);
  currentPanel = publicPanel;
  await until(() => publicPanel.evaluate(`Boolean(document.querySelector('.scan-button:not(:disabled)'))`), 'public panel ready');
  await click(publicPanel, '.scan-button');
  await until(() => publicPanel.evaluate(`Boolean(document.querySelector('.safe-button'))`), 'public report');
  const publicBefore = await publicPanel.evaluate(`({findings:Number(document.querySelector('.count')?.textContent),scores:Array.from(document.querySelectorAll('.score-number strong')).map(e=>Number(e.textContent)),error:document.querySelector('.error')?.textContent})`);
  receipt.checks.push({ name: 'Live W3C educational page audit', url: page.url(), ...publicBefore });
  if (!publicBefore.findings) throw new Error('No findings on intentional W3C BAD page.');
  await publicPanel.screenshot(resolve(evidence, 'extension-w3c-panel-before.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-w3c-page-before.png') });
  await click(publicPanel, '.finding-bottom button');
  await until(() => publicPanel.evaluate(`document.querySelector('.notice')?.textContent.includes('Source highlighted')`), 'public source locate');
  const highlighted = await page.locator('[data-clearview-id]').evaluateAll(elements => elements.filter(element => element.style.outline.includes('3px')).length);
  if (!highlighted) throw new Error('The source locate did not outline a real page element.');
  receipt.checks.push({ name: 'Public source locate highlights a real page element', highlighted, passed: true });
  await page.screenshot({ path: resolve(evidence, 'extension-w3c-page-locate.png') });
  await sleep(2200);
  const originalState = await page.locator('[data-clearview-id]').evaluateAll(elements => elements.map(element => ({ id: element.getAttribute('data-clearview-id'), style: element.getAttribute('style'), ariaLabel: element.getAttribute('aria-label'), role: element.getAttribute('role'), tabIndex: element.getAttribute('tabindex'), checked: element instanceof HTMLInputElement ? element.checked : null })));
  await click(publicPanel, '.safe-button');
  await until(() => publicPanel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='true'`), 'public safe mode');
  const publicAfter = await publicPanel.evaluate(`({findings:Number(document.querySelector('.count')?.textContent),scores:Array.from(document.querySelectorAll('.score-number strong')).map(e=>Number(e.textContent))})`);
  const badges = await page.locator('[data-clearview-badge]').count();
  receipt.checks.push({ name: 'Live W3C local repairs', ...publicAfter, badges });
  if (!badges) throw new Error('No repairs marked on W3C page.');
  await publicPanel.screenshot(resolve(evidence, 'extension-w3c-panel-after.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-w3c-page-after.png') });
  await click(publicPanel, '.safe-button');
  await until(() => publicPanel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='false'`), 'public revert');
  const restoredState = await page.locator('[data-clearview-id]').evaluateAll(elements => elements.map(element => ({ id: element.getAttribute('data-clearview-id'), style: element.getAttribute('style'), ariaLabel: element.getAttribute('aria-label'), role: element.getAttribute('role'), tabIndex: element.getAttribute('tabindex'), checked: element instanceof HTMLInputElement ? element.checked : null })));
  const exactRollback = originalState.every(before => JSON.stringify(restoredState.find(after => after.id === before.id)) === JSON.stringify(before));
  receipt.rollbackDifferences = originalState.filter(before => JSON.stringify(restoredState.find(after => after.id === before.id)) !== JSON.stringify(before)).map(before => ({ before, after: restoredState.find(after => after.id === before.id) }));
  const remainingBadges = await page.locator('[data-clearview-badge]').count();
  receipt.checks.push({ name: 'Live W3C exact captured attributes restored', exactRollback, remainingBadges });
  if (!exactRollback || remainingBadges) throw new Error('W3C rollback mismatch.');
  const secondTab = await context.newPage();
  await secondTab.goto('http://127.0.0.1:4173/?standalone=utility');
  await until(() => publicPanel.evaluate(`!document.querySelector('.safe-button')`), 'new tab clears report');
  await click(publicPanel, '.scan-button');
  await until(() => publicPanel.evaluate(`Boolean(document.querySelector('.error'))`), 'new tab requires access');
  const newTabError = await publicPanel.evaluate(`document.querySelector('.error').textContent`);
  if (!/toolbar icon|Page access/.test(newTabError)) throw new Error('New tab did not require its own access grant.');
  receipt.checks.push({ name: 'Cross-tab change clears report and requires its own toolbar grant', passed: true, message: newTabError });
  await secondTab.close();
  await page.bringToFront();
  await page.goto('chrome://version');
  await sleep(300);
  await click(publicPanel, '.scan-button');
  await until(() => publicPanel.evaluate(`Boolean(document.querySelector('.error'))`), 'restricted page explanation');
  const restrictedError = await publicPanel.evaluate(`document.querySelector('.error').textContent`);
  if (!/Browser pages cannot be audited|Page access/.test(restrictedError)) throw new Error('Restricted browser page did not show an actionable error.');
  receipt.checks.push({ name: 'Restricted chrome:// page reports unsupported access', passed: true, message: restrictedError });
  await publicPanel.screenshot(resolve(evidence, 'extension-restricted-page-message.png'));
  receipt.status = 'PASS';
  console.log(JSON.stringify({ status: receipt.status, checks: receipt.checks, rollbackDifferences: receipt.rollbackDifferences }, null, 2));
  await saveReceipt();
} catch (error) {
  receipt.status = 'FAIL'; receipt.error = error.message;
  if (currentPanel) {
    receipt.failurePanel = await currentPanel.evaluate('document.body.innerText').catch(() => 'Unavailable');
    await currentPanel.screenshot(resolve(work, 'extension-failure.png')).catch(() => {});
  }
  console.log(JSON.stringify({ status: receipt.status, error: receipt.error, checks: receipt.checks, rollbackDifferences: receipt.rollbackDifferences }, null, 2));
  await saveReceipt();
  throw error;
} finally { await context.close(); }
