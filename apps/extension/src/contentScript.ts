import { applySafeMode, highlightElement, revertSafeMode, scanDocument } from '@clearview/analyzer';
import type { AuditReport, RepairSnapshot } from '@clearview/analyzer';
import { isGuardRequest } from './protocol';
import type { GuardResponse } from './protocol';

// This property exists in Chrome's isolated world, not in the site's JavaScript world.
const guardWindow = window as Window & { __clearviewGuardInstalled?: boolean };
if (!guardWindow.__clearviewGuardInstalled) {
  guardWindow.__clearviewGuardInstalled = true;
  let snapshot: RepairSnapshot | null = null;
  const documentToken = crypto.randomUUID();
  let lastReport: AuditReport | null = null;
  let operationPending = false;

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse: (response: GuardResponse) => void) => {
    if (sender.id !== chrome.runtime.id || !isGuardRequest(message)) return false;
    if (message.action !== 'scan' && message.documentToken !== documentToken) {
      sendResponse({ ok: false, error: 'This page changed. Scan the active tab again before applying changes.' });
      return false;
    }
    if (operationPending) {
      sendResponse({ ok: false, error: 'The current page operation is still finishing. Try again.' });
      return false;
    }
    operationPending = true;
    void (async () => {
      try {
        if (message.action === 'apply') snapshot = applySafeMode(document, scanDocument(document));
        if (message.action === 'revert' && snapshot) {
          revertSafeMode(document, snapshot);
          snapshot = null;
        }
        if (message.action === 'locate') {
          if (!lastReport?.findings.some(item => item.clearviewId === message.clearviewId) && !lastReport?.financialCommitments.some(item => item.clearviewId === message.clearviewId)) {
            throw new Error('That finding is no longer in this page report. Scan again.');
          }
          if (!highlightElement(document, message.clearviewId!)) throw new Error('That source element was removed from the page. Scan again.');
        }
        // Let host framework state settle after native input/change events.
        if (message.action === 'apply' || message.action === 'revert') await new Promise<void>(resolve => setTimeout(resolve, 80));
        lastReport = scanDocument(document);
        sendResponse({ ok: true, documentToken, url: location.href, title: document.title, report: lastReport });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : 'The page could not be inspected.' });
      } finally {
        operationPending = false;
      }
    })();
    return true;
  });
}
