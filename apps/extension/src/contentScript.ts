import { applySafeMode, highlightElement, revertSafeMode, scanDocument } from '@clearview/analyzer';
import type { AuditReport, FinancialCommitment, RepairSnapshot } from '@clearview/analyzer';
import { isGuardRequest } from './protocol';
import type { GuardResponse, OperationResult } from './protocol';

// Compare the evidence the user reviewed, not volatile countdown copy or scores.
// This preflight never becomes the report used for mutation.
function reviewSignature(report: AuditReport): string {
  return JSON.stringify({
    repairs: report.findings.filter(item => item.isAutoRepairable).map(item => [item.id, item.clearviewId, item.ruleId, item.evidenceText]).sort(),
    prices: report.financialCommitments.map(item => [item.clearviewId, item.label, item.amountText, item.cadence, item.isPreselected, item.includedInTotals, item.exclusionReason]).sort(),
  });
}

type OptionEvidence = { findingId: string; item: FinancialCommitment; source: HTMLElement; checkbox: HTMLInputElement; sourceText: string };
function uniqueSource(id: string): HTMLElement | undefined {
  const matches = [...document.querySelectorAll<HTMLElement>('[data-clearview-id]')].filter(element => element.dataset.clearviewId === id);
  return matches.length === 1 ? matches[0] : undefined;
}
function sourceText(element: HTMLElement): string {
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[data-clearview-badge]').forEach(badge => badge.remove());
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}
function optionCandidates(report: AuditReport, findingIds: readonly string[]): OptionEvidence[] {
  const selected = new Set(findingIds);
  const candidates: OptionEvidence[] = [];
  for (const finding of report.findings.filter(item => item.ruleId === 'DP-001' && item.isAutoRepairable && selected.has(item.id))) {
    const target = uniqueSource(finding.clearviewId);
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox' || !target.checked) continue;
    for (const item of report.financialCommitments.filter(price => price.includedInTotals && price.currency === 'USD' && price.amountKind === 'charge' && price.cadence === 'monthly')) {
      const source = uniqueSource(item.clearviewId);
      if (!source) continue;
      const row = source.closest<HTMLElement>('label, [data-charge], [data-price-row], tr, li') ?? (['SPAN', 'STRONG', 'B', 'EM', 'SMALL'].includes(source.tagName) ? source.parentElement : source);
      const boxes = row?.querySelectorAll('input[type="checkbox"]');
      if (boxes?.length === 1 && boxes[0] === target || row instanceof HTMLLabelElement && row.control === target) candidates.push({ findingId: finding.id, item, source, checkbox: target, sourceText: sourceText(source) });
    }
  }
  return candidates;
}
function verifiedRemovedIds(report: AuditReport, snapshot: RepairSnapshot | null, candidates: OptionEvidence[]): string[] {
  if (report.repairState !== 'active' || !snapshot || snapshot.outcomes.some(item => item.status !== 'applied')) return [];
  const applied = new Set(snapshot.outcomes.filter(item => item.status === 'applied').map(item => item.findingId));
  return [...new Set(candidates.filter(candidate => {
    if (!applied.has(candidate.findingId) || !document.contains(candidate.checkbox) || candidate.checkbox.checked || uniqueSource(candidate.item.clearviewId) !== candidate.source || sourceText(candidate.source) !== candidate.sourceText) return false;
    const current = report.financialCommitments.find(item => item.id === candidate.item.id);
    return current && !current.includedInTotals && !current.isPreselected && current.exclusionReason === 'Option is not selected or is only suggested.'
      && current.label === candidate.item.label && current.amountText === candidate.item.amountText && current.numericValue === candidate.item.numericValue
      && current.cadence === candidate.item.cadence && current.currency === candidate.item.currency && current.amountKind === candidate.item.amountKind;
  }).map(candidate => candidate.item.id))];
}

// This property exists in Chrome's isolated world, not in the site's JavaScript world.
const guardWindow = window as Window & { __clearviewGuardInstalled?: boolean };
if (!guardWindow.__clearviewGuardInstalled) {
  guardWindow.__clearviewGuardInstalled = true;
  let snapshot: RepairSnapshot | null = null;
  let removalEvidence: OptionEvidence[] = [];
  const documentToken = crypto.randomUUID();
  let lastReport: AuditReport | null = null;
  let reportId = '';
  let reportUrl = '';
  let operationPending = false;

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse: (response: GuardResponse) => void) => {
    if (sender.id !== chrome.runtime.id || !isGuardRequest(message)) return false;
    if (message.action !== 'scan' && message.documentToken !== documentToken) {
      sendResponse({ ok: false, code: 'PAGE_CHANGED', error: 'This page changed. Scan the active tab again before applying changes.' });
      return false;
    }
    if (operationPending) {
      sendResponse({ ok: false, error: 'The current page operation is still finishing. Try again.' });
      return false;
    }
    operationPending = true;
    void (async () => {
      try {
        let operation: OperationResult | undefined;
        if (message.action === 'apply') {
          if (!lastReport || message.reportId !== reportId || location.href !== reportUrl || reviewSignature(scanDocument(document)) !== reviewSignature(lastReport)) {
            sendResponse({ ok: false, code: 'STALE_REPORT', error: 'The page changed after this review. Scan page again, review the updated choices, then apply selected changes.' });
            return;
          }
          removalEvidence = optionCandidates(lastReport, message.findingIds ?? []);
          snapshot = applySafeMode(document, lastReport, { findingIds: message.findingIds });
          operation = { action: 'apply', applied: snapshot.outcomes.filter(item => item.status === 'applied').length, appliedNodes: new Set(snapshot.outcomes.filter(item => item.status === 'applied').map(item => item.clearviewId)).size, skipped: snapshot.outcomes.filter(item => item.status === 'skipped').length, conflicted: snapshot.outcomes.filter(item => item.status === 'conflict').length };
        }
        if (message.action === 'revert' && snapshot) {
          revertSafeMode(document, snapshot);
          operation = { action: 'revert', restored: snapshot.revertOutcomes?.filter(item => item.status === 'restored').length ?? 0, conflicted: snapshot.revertOutcomes?.filter(item => item.status === 'conflict').length ?? 0, detached: snapshot.revertOutcomes?.filter(item => item.status === 'detached').length ?? 0 };
          snapshot = null;
          removalEvidence = [];
        }
        if (message.action === 'locate') {
          if (!lastReport?.findings.some(item => item.clearviewId === message.clearviewId) && !lastReport?.financialCommitments.some(item => item.clearviewId === message.clearviewId)) {
            throw new Error('That finding is no longer in this page report. Scan again.');
          }
          if (!highlightElement(document, message.clearviewId!)) throw new Error('That source element was removed from the page. Scan again.');
        }
        // Let host framework state settle after native input/change events.
        if (message.action === 'apply' || message.action === 'revert') await new Promise<void>(resolve => setTimeout(resolve, 80));
        // Locate does not silently refresh the receipt or the selected change set.
        if (message.action !== 'locate' || !lastReport) {
          lastReport = scanDocument(document);
          reportId = crypto.randomUUID();
          reportUrl = location.href;
        }
        if (operation?.action === 'apply') operation.appliedNodes = lastReport.repairSummary.nodes;
        const selectedMonthlyOptionIds = [...new Set(optionCandidates(lastReport, lastReport.findings.map(item => item.id)).map(candidate => candidate.item.id))];
        const removedMonthlyOptionIds = verifiedRemovedIds(lastReport, snapshot, removalEvidence);
        sendResponse({ ok: true, documentToken, reportId, url: location.href, title: document.title, report: lastReport, operation, selectedMonthlyOptionIds, removedMonthlyOptionIds });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : 'The page could not be inspected.' });
      } finally {
        operationPending = false;
      }
    })();
    return true;
  });
}
