import { chromium } from '@playwright/test';
import axe from 'axe-core';
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
const contrastResultExpression = `axe.run(document,{runOnly:{type:'rule',values:['color-contrast']}}).then(result=>({
  violations:result.violations.map(rule=>({id:rule.id,nodes:rule.nodes.map(node=>({target:node.target,summary:node.failureSummary,data:node.any.map(check=>check.data)}))})),
  incomplete:result.incomplete.map(rule=>({id:rule.id,nodes:rule.nodes.map(node=>({target:node.target,data:node.any.map(check=>check.data)}))})),
  thresholds:[...new Set(result.passes.flatMap(rule=>rule.nodes.flatMap(node=>node.any.map(check=>check.data?.expectedContrastRatio))).filter(Boolean))],
  measuredPasses:result.passes.flatMap(rule=>rule.nodes.flatMap(node=>node.any.map(check=>check.data?.contrastRatio))).filter(value=>typeof value==='number').length
}))`;
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
  await panel.evaluate('document.fonts.ready');
  await panel.evaluate(axe.source);
  // The product requires 7:1 for all panel text, including large headings.
  await panel.evaluate(`axe.configure({checks:[{id:'color-contrast',options:{ignoreUnicode:true,ignoreLength:false,ignorePseudo:false,boldValue:700,boldTextPt:14,largeTextPt:18,contrastRatio:{normal:{expected:7},large:{expected:7}},pseudoSizeThreshold:.25,shadowOutlineEmMax:.1,textStrokeEmMin:.03}}]})`);
  const thresholdControls = await panel.evaluate(`(async()=>{
    const controls=[];
    for(const sample of [{label:'normal below7',color:'#666666',size:16,bold:false},{label:'large below7',color:'#666666',size:28,bold:true},{label:'high contrast',color:'#111827',size:16,bold:false}]){
      const node=document.createElement('div');
      node.style.cssText='position:relative;padding:12px;background:#fff;color:'+sample.color+';font-size:'+sample.size+'px;font-weight:'+(sample.bold?700:400);
      node.textContent='Contrast threshold verification sample';document.body.append(node);
      try{
        const result=await axe.run(node,{runOnly:{type:'rule',values:['color-contrast']}});
        controls.push({label:sample.label,violations:result.violations.length,incomplete:result.incomplete.length,data:[...result.violations,...result.passes].flatMap(rule=>rule.nodes.flatMap(item=>item.any.map(check=>check.data))).filter(Boolean)});
      }finally{node.remove()}
    }
    return controls;
  })()`);
  if(thresholdControls.some((control,index)=>control.incomplete || control.violations !== (index<2?1:0) || !control.data.some(data=>data.expectedContrastRatio==='7:1'))) throw new Error(`7:1 threshold controls failed: ${JSON.stringify(thresholdControls)}`);
  receipt.checks.push({name:'Contrast threshold validated by normal/large 5.74:1 failures and a high-contrast control',controls:thresholdControls,passed:true});
  const initialContrast = await panel.evaluate(contrastResultExpression);
  receipt.checks.push({ name: 'Initial instructions text contrast at 7:1 threshold', ...initialContrast });
  if (initialContrast.violations.length || initialContrast.incomplete.length || initialContrast.thresholds.join() !== '7:1') throw new Error('Initial instructions need contrast review.');
  for (const width of [320, 420]) {
    await panel.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await panel.screenshot(resolve(evidence, `extension-panel-initial-${width}.png`));
  }
  await click(panel, '.scan-button');
  await until(() => panel.evaluate(`Boolean(document.querySelector('.safe-button'))`), 'local report');
  const localBefore = await panel.evaluate(`({totals:Array.from(document.querySelectorAll('.totals strong')).map(e=>e.textContent), findings:document.querySelector('.count')?.textContent,error:document.querySelector('.error')?.textContent})`);
  receipt.checks.push({ name: 'Local medical report through real sidepanel', ...localBefore });
  if (localBefore.totals.join('|') !== '$334.00|$29.99') throw new Error(`Unexpected local receipt: ${JSON.stringify(localBefore)}`);
  for (const width of [320, 420]) {
    await panel.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await panel.evaluate('window.scrollTo(0,0)');
    await panel.screenshot(resolve(evidence, `extension-panel-${width}.png`));
    const layout = await panel.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})');
    receipt.checks.push({ name: `Sidepanel ${width}px has no horizontal overflow`, ...layout });
    if (layout.content > layout.viewport) throw new Error(`Sidepanel overflows at ${width}px.`);
    await panel.evaluate(`document.querySelector('.repair-preview').scrollIntoView({block:'start'})`);
    await panel.screenshot(resolve(evidence, `extension-panel-preview-${width}.png`));
  }

  await panel.evaluate(`document.querySelectorAll('details').forEach(element=>{element.open=true})`);
  const contrast = await panel.evaluate(contrastResultExpression);
  receipt.checks.push({ name: 'Warm review and all expanded disclosures text contrast at 7:1 threshold', ...contrast });
  if (contrast.violations.length || contrast.incomplete.length || contrast.thresholds.join() !== '7:1') throw new Error(`Sidepanel contrast failure: ${JSON.stringify(contrast)}`);
  await panel.evaluate(`document.querySelectorAll('details').forEach(element=>{element.open=false})`);
  const fonts = await panel.evaluate(`document.fonts.ready.then(()=>({ui:document.fonts.check('16px "Inter"'),data:document.fonts.check('700 16px "Inter"'),faces:Array.from(document.fonts).map(face=>({family:face.family,status:face.status,weight:face.weight})),computed:getComputedStyle(document.body).fontFamily}))`);
  receipt.checks.push({ name: 'Self-hosted Inter font loaded', ...fonts });
  if (!fonts.ui || !fonts.data) throw new Error('Inter panel font did not load.');
  await panel.evaluate("document.querySelector('.scan-button').focus()");
  for (let key = 0; key < 2; key++) {
    await panel.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await panel.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  }
  const reviewFocused = await panel.evaluate("document.activeElement?.classList.contains('review-link')");
  if (!reviewFocused) throw new Error('Keyboard traversal did not reach the review action.');
  await panel.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
  await panel.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  const keyboardReview = await panel.evaluate("({id:document.activeElement?.id,outline:getComputedStyle(document.activeElement).outlineWidth})");
  if (keyboardReview.id !== 'change-review' || keyboardReview.outline !== '3px') throw new Error(`Review did not receive visible keyboard focus: ${JSON.stringify(keyboardReview)}`);
  receipt.checks.push({ name: 'Native Tab and Enter reach the review with 3px focus', ...keyboardReview, passed: true });
  const selectedExtra = await panel.evaluate("document.querySelector('.extra-summary')?.textContent");
  if (!selectedExtra?.includes('$29.99/month in currently selected extras')) throw new Error('Selected extra lacks exact DOM-linked amount.');
  receipt.checks.push({ name: 'Current monthly extra is linked to its real option source', text: selectedExtra, passed: true });
  await panel.send('Emulation.setDeviceMetricsOverride', { width: 380, height: 900, deviceScaleFactor: 1, mobile: false });
  await panel.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await panel.screenshot(resolve(evidence, 'extension-panel-reduced-motion.png'));
  const reduced = await panel.evaluate("({reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,animation:getComputedStyle(document.querySelector('.totals strong')).animationName})");
  receipt.checks.push({ name: 'Reduced motion disables amount settlement', ...reduced });
  if (!reduced.reduced || reduced.animation !== 'none') throw new Error('Reduced motion still animates totals.');
  await panel.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await panel.screenshot(resolve(evidence, 'extension-medical-panel-before.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-medical-page-before.png') });
  // A changed page must not expand the reviewed repair selection.
  await page.evaluate(() => {
    const row = document.createElement('label'); row.id = 'late-subscription';
    row.innerHTML = '<input type="checkbox" checked> Late monthly membership $99/mo';
    document.body.append(row);
  });
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`Boolean(document.querySelector('.error'))`), 'stale review rejection');
  const staleChoicePreserved = await page.locator('#late-subscription input').isChecked();
  const staleDisabled = await panel.evaluate(`document.querySelector('.safe-button').disabled`);
  if (!staleChoicePreserved || !staleDisabled) throw new Error('A stale review changed an unreviewed selection.');
  receipt.checks.push({ name: 'Changed page blocks Apply before any unreviewed selection changes', passed: true });
  await page.locator('#late-subscription').evaluate(element => element.remove());
  await click(panel, '.scan-button');
  await until(() => panel.evaluate(`!document.querySelector('.error') && !document.querySelector('.safe-button').disabled`), 'fresh review');
  const addonDefault = await panel.evaluate(`document.querySelector('[data-rule="DP-001"] input').checked`);
  if (addonDefault) throw new Error('Optional financial change was selected by default.');
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='true'`), 'selected readability repairs');
  const keptChoice = await page.locator('input[type=checkbox]').isChecked();
  if (!keptChoice || !await page.locator('input[placeholder]').first().getAttribute('aria-label')) throw new Error('Readability repair did not preserve the intended add-on.');
  receipt.checks.push({ name: 'Default selection repairs access while preserving chosen subscription', passed: true });
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='false'`), 'selected repairs reverted');
  await click(panel, '[data-rule="DP-001"] input');
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='true'`), 'explicit financial change');
  const scoresDuring = await panel.evaluate(`Array.from(document.querySelectorAll('.score-number strong')).map(element=>Number(element.textContent))`);
  await sleep(400);
  const scoreSettlement = await panel.evaluate(`Array.from(document.querySelectorAll('.score')).map(element=>({label:element.getAttribute('aria-label'),displayed:Number(element.querySelector('strong').textContent)}))`);
  if (scoreSettlement.some(item => !item.label.includes(': ' + item.displayed + ' out of 100'))) throw new Error('Animated scores did not settle to actual report values.');
  receipt.checks.push({ name: 'Score count-up settles to actual report values', during: scoresDuring, settled: scoreSettlement });
  const activeContrast = await panel.evaluate(contrastResultExpression);
  receipt.checks.push({ name: 'Active repair panel text contrast at 7:1 threshold', ...activeContrast });
  if (activeContrast.violations.length || activeContrast.incomplete.length || activeContrast.thresholds.join() !== '7:1') throw new Error('Active repair panel has a text contrast violation.');
  const localAfter = await panel.evaluate(`({totals:Array.from(document.querySelectorAll('.totals strong')).map(e=>e.textContent),findings:document.querySelector('.count')?.textContent})`);
  const localCheckbox = await page.locator('input[type=checkbox]').isChecked();
  receipt.checks.push({ name: 'Explicitly selected local repair and live receipt', ...localAfter, checkboxChecked: localCheckbox });
  const repairTypography = await page.locator('[data-clearview-badge]').evaluateAll(badges => badges.map(badge => {
    const badgeStyle = getComputedStyle(badge);
    const target = badge.previousElementSibling;
    return { symbol: badge.textContent, title: badge.getAttribute('title'), badgeSize: badgeStyle.fontSize, badgeColor: badgeStyle.color, badgeBackground: badgeStyle.backgroundColor, targetSize: target instanceof HTMLElement && target.style.fontSize ? getComputedStyle(target).fontSize : null };
  }));
  if (!repairTypography.length || repairTypography.some(item => item.symbol !== '✓' || !['ClearView · adjusted','ClearView · option cleared'].includes(item.title) || item.badgeSize !== '14px' || item.badgeColor !== 'rgb(6, 95, 70)' || item.badgeBackground !== 'rgb(236, 253, 245)' || item.targetSize && parseFloat(item.targetSize) < 16)) throw new Error(`Injected repair typography mismatch: ${JSON.stringify(repairTypography)}`);
  if (!repairTypography.some(item => item.targetSize !== null)) throw new Error('No repaired text target was measured.');
  receipt.checks.push({ name: 'Real page badges use 14px civic colors and repaired text is at least16px', measurements: repairTypography, passed: true });
  const progressFit = await page.locator('.portal-progress').evaluate(element => {
    const bounds=element.getBoundingClientRect();
    const parts=[...element.querySelectorAll('span,b')].map(part=>part.getBoundingClientRect());
    return {left:bounds.left,right:bounds.right,minimumChildLeft:Math.min(...parts.map(part=>part.left)),maximumChildRight:Math.max(...parts.map(part=>part.right))};
  });
  if(progressFit.minimumChildLeft<progressFit.left-1 || progressFit.maximumChildRight>progressFit.right+1) throw new Error(`Repair badges overflow the progress row: ${JSON.stringify(progressFit)}`);
  receipt.checks.push({name:'Compact repair badges preserve the medical progress row bounds',...progressFit,passed:true});


  if (localAfter.totals.join('|') !== '$334.00|$0.00' || localCheckbox) throw new Error('Explicit local repair failed.');
  const removedExtra = await panel.evaluate("({summary:document.querySelector('.extra-summary')?.textContent,strike:document.querySelector('.removed-extras s')?.textContent,collapsed:!!document.querySelector('.removed-extras')?.closest('details')})");
  if (!removedExtra.summary?.includes('$29.99/month') || !removedExtra.strike?.includes('29.99') || removedExtra.collapsed) throw new Error('Verified removal is not clearly shown in the actual receipt.');
  receipt.checks.push({ name: 'Only the verified selected monthly extra is struck from the receipt', ...removedExtra, passed: true });
  for (const width of [320, 420]) {
    await panel.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await panel.evaluate("document.querySelector('.summary-card').scrollIntoView({block:'start'})");
    await panel.screenshot(resolve(evidence, `extension-panel-active-${width}.png`));
    const layout = await panel.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})');
    if (layout.content > layout.viewport) throw new Error(`Active sidepanel overflows at ${width}px.`);
  }
  await panel.evaluate("document.querySelector('.removed-extras').scrollIntoView({block:'center'})");
  await panel.screenshot(resolve(evidence, 'extension-panel-verified-removal.png'));
  await panel.screenshot(resolve(evidence, 'extension-medical-panel-after.png'));
  await page.screenshot({ path: resolve(evidence, 'extension-medical-page-after.png') });
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='false'`), 'local revert');
  if (!await page.locator('input[type=checkbox]').isChecked()) throw new Error('Local revert did not restore checkbox.');
  receipt.checks.push({ name: 'Local revert restores the explicitly changed checkbox', passed: true });

  receipt.medicalFindingEvidence = await panel.evaluate(`(async()=>{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const response=await chrome.tabs.sendMessage(tab.id,{source:'clearview-panel',action:'scan'});
    if(!response.ok)throw Error(response.error);
    return response.report.findings.map(item=>({rule:item.ruleId,evidence:item.evidenceText,explanation:item.plainLanguageExplanation}));
  })()`);
  await writeFile(resolve(evidence, 'medical-finding-evidence.json'), JSON.stringify(receipt.medicalFindingEvidence, null, 2));
  await page.evaluate(() => { document.body.innerHTML = '<main style="background:#fff;color:#111827;font-size:16px"><input placeholder="Initial field"></main>'; });
  await click(panel, '.scan-button');
  await until(() => panel.evaluate(`document.querySelector('.repair-option')?.textContent.includes('Initial field')`), 'replacement fixture report');
  await click(panel, '.safe-button');
  await until(() => panel.evaluate(`document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='true'`), 'fixture apply');
  await page.evaluate(() => { document.body.innerHTML = '<main style="background:#fff;color:#111827;font-size:16px"><input placeholder="Replacement field"></main>'; });
  await click(panel, '.scan-button');
  await until(() => panel.evaluate(`Boolean(document.querySelector('.session-warning')) && document.querySelector('.safe-button')?.getAttribute('aria-pressed')==='false'`), 'expired repair recovery');
  await click(panel, '.safe-button');
  await until(() => page.locator('input').getAttribute('aria-label').then(value => value === 'Replacement field'), 'fresh reviewed replacement repair');
  receipt.checks.push({ name: 'Detached repair session expires and a newly reviewed set can be applied', passed: true });
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
