import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import './IntroExperience.css';

export type IntroArtwork = { background: string; receipt: string; frame: string };
const defaultArtwork: IntroArtwork = {
  background: '/art/intro-background.webp',
  receipt: '/art/intro-receipt.webp',
  frame: '/art/intro-frame.webp'
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** A short illustrative entry. All audit data and actions live in the workspace. */
export function IntroExperience({ artwork = defaultArtwork }: { artwork?: IntroArtwork }) {
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    const stage = scene.current;
    if (!element || !stage) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let visible = true;
    let desiredX = 0;
    let desiredY = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const compact = window.innerWidth < 800;
      const rect = element.getBoundingClientRect();
      const travel = compact ? Math.max(rect.height * .65, 1) : Math.max(element.offsetHeight - stage.offsetHeight, 1);
      const progress = reduced.matches ? 1 : clamp(-rect.top / travel);
      x += (desiredX - x) * .12;
      y += (desiredY - y) * .12;
      if (reduced.matches || compact) { x = 0; y = 0; }
      const scale = compact ? .42 : 1;
      stage.style.setProperty('--intro-p', String(progress));
      stage.style.setProperty('--intro-far-y', `${reduced.matches ? 0 : progress * 32 * scale}px`);
      stage.style.setProperty('--intro-paper-x', `${reduced.matches ? 0 : (-24 * progress + x * 9) * scale}px`);
      stage.style.setProperty('--intro-paper-y', `${reduced.matches ? 0 : (-64 * progress + y * 10) * scale}px`);
      stage.style.setProperty('--intro-paper-angle', `${reduced.matches ? -5 : -12 + progress * 7 + x}deg`);
      stage.style.setProperty('--intro-frame-x', `${reduced.matches ? -44 * scale : (-94 * progress + x * 21) * scale}px`);
      stage.style.setProperty('--intro-frame-y', `${reduced.matches ? 0 : (24 * progress + y * 18) * scale}px`);
      stage.style.setProperty('--intro-frame-angle', `${reduced.matches ? 0 : 5 - progress * 5 + x * 1.6}deg`);
      // This signature describes painted positions, not raw scroll progress.
      stage.dataset.scVerifyState = reduced.matches ? 'static-alignment' : `paper:${Math.round((-24 * progress + x * 9) * scale)},${Math.round((-64 * progress + y * 10) * scale)};frame:${Math.round((-94 * progress + x * 21) * scale)},${Math.round((24 * progress + y * 18) * scale)}`;
      if (Math.abs(desiredX - x) + Math.abs(desiredY - y) > .005 && !reduced.matches && !compact) schedule();
    };
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(paint); };
    const onPointer = (event: PointerEvent) => {
      if (!finePointer.matches || reduced.matches) return;
      const rect = stage.getBoundingClientRect();
      desiredX = clamp((event.clientX - rect.left) / rect.width) * 2 - 1;
      desiredY = clamp((event.clientY - rect.top) / rect.height) * 2 - 1;
      schedule();
    };
    const resetPointer = () => { desiredX = 0; desiredY = 0; schedule(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else if (frame) { cancelAnimationFrame(frame); frame = 0; } });
    observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', resetPointer);
    reduced.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      stage.removeEventListener('pointermove', onPointer);
      stage.removeEventListener('pointerleave', resetPointer);
      reduced.removeEventListener('change', schedule);
    };
  }, []);

  return <section className="intro-experience" ref={root} aria-labelledby="intro-title">
    <div className="intro-stage" ref={scene} data-sc-verify-state="opening">
      <div className="intro-art" aria-hidden="true">
        <img className="intro-environment" src={artwork.background} alt="" fetchPriority="high" decoding="async" />
        <img className="intro-paper" src={artwork.receipt} alt="" fetchPriority="high" decoding="async" />
        <img className="intro-frame" src={artwork.frame} alt="" fetchPriority="high" decoding="async" />
      </div>
      <div className="intro-scrim" aria-hidden="true" />
      <div className="intro-copy">
        <h1 id="intro-title">See what you’re<br />agreeing to.</h1>
        <p>A second look at fees, add-ons, and page barriers. Before you continue.</p>
        <a className="intro-enter" href="#live-audit" onClick={() => { document.getElementById('live-audit')?.focus({ preventScroll: true }); }}>Try the live audit <ArrowUpRight size={21} aria-hidden="true" /></a>
        <span className="intro-entry-note">Three working samples. Nothing to buy.</span>
      </div>
      <div className="intro-handoff">
        <div className="intro-handoff-rule" aria-hidden="true" />
        <p>Follow the source.<br /><strong>Keep the control.</strong></p>
        <span>Every finding links to the page.<br />Every repair has a way back.</span>
      </div>
      <a className="intro-continue" href="#live-audit" aria-label="Continue to the live audit"><ArrowDown size={19} aria-hidden="true" /></a>
    </div>
  </section>;
}
