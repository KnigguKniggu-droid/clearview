import { useEffect, useRef } from 'react';
import type { AuditReport } from '@clearview/analyzer';

/** Feedback lives outside the audited portal. The analyzer owns all page repairs. */
export function useAuditMotion(report: AuditReport | null) {
  const previousAmounts = useRef<string | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let selected: HTMLElement | null = null;
    let flight: HTMLElement | null = null;
    const clearFlight = () => { flight?.remove(); flight = null; };
    const onSource = (event: MouseEvent) => {
      const source = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cv-source]') : null;
      if (!source || source.matches(':disabled')) return;
      const id = source.dataset.cvSource;
      if (!id || !/^cv-\d+$/.test(id)) return;
      selected?.removeAttribute('data-cv-selected');
      selected = source;
      source.dataset.cvSelected = 'true';
      clearFlight();
      // A source marker is sufficient on phones and for reduced motion.
      if (reduced.matches || window.innerWidth < 900 || event.detail === 0) return;
      const target = document.querySelector<HTMLElement>(`[data-testid="portal-root"] [data-clearview-id="${id}"]`);
      if (!target) return;
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const onScreen = (rect: DOMRect) => rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
      if (!onScreen(from) || !onScreen(to)) return;
      const dot = document.createElement('span');
      dot.className = 'cv-evidence-trace';
      const citation = source.dataset.cvCitation;
      if (citation && /^\d{1,2}$/.test(citation)) {
        dot.textContent = citation.padStart(2, '0');
        dot.classList.add('cv-evidence-reference');
      }
      dot.setAttribute('aria-hidden', 'true');
      dot.setAttribute('data-clearview-ignore', '');
      dot.style.left = `${from.left + from.width / 2}px`;
      dot.style.top = `${from.top + from.height / 2}px`;
      document.body.append(dot);
      flight = dot;
      const animation = dot.animate([
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: `translate(calc(-50% + ${to.left + to.width / 2 - from.left - from.width / 2}px), calc(-50% + ${to.top + to.height / 2 - from.top - from.height / 2}px)) scale(.5)` }
      ], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
      animation.onfinish = () => { dot.remove(); if (flight === dot) flight = null; };
    };
    document.addEventListener('click', onSource);
    return () => { document.removeEventListener('click', onSource); selected?.removeAttribute('data-cv-selected'); clearFlight(); };
  }, []);

  useEffect(() => {
    const amounts = report ? `${report.summary.totalImmediateDue}/${report.summary.totalRecurringMonthly}` : null;
    const changed = previousAmounts.current !== null && previousAmounts.current !== amounts;
    previousAmounts.current = amounts;
    if (!changed || !report || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The real amount appears immediately. No number tween or text transparency.
    const animations = Array.from(document.querySelectorAll<HTMLElement>('[data-cv-amount]'))
      .map(element => element.animate([{ transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' }));
    return () => { animations.forEach(animation => animation.cancel()); };
  }, [report]);
}
