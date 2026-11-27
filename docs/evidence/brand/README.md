# Original mark and motion review

Checked on Chromium 159.0.8154.6 against the local production build on 2026-11-27. The [receipt](motion-panel-receipt.json) records source SHA-256 hashes, viewport observations, and 16 passing checks. Browser automation used one isolated browser and closed it after the run. These results do not measure physical-device frame rate.

## Brand

The agent selected Open View under the user's delegated build instruction. The [three concepts](original-concepts.webp) are original constructions. The [refinement sheet](small-size-refinement.webp) shows the round source point becoming a 32-unit square, which renders as 2×2px at the 16px icon size. Black, reversed, and production icon versions were rendered and visually inspected. The [SVG structural audit](svg-audit.json) returned no findings. Trademark clearance is UNKNOWN.

The final product uses the same original symbol in its shared Manrope brand component, favicon, and extension icons. Extension icon files exist at 16/32/48/128px and the running manifest references all four. Geometry and usage notes are in [packages/brand](../../../packages/brand/README.md).

## Motion changes and observed results

| Before | After | Evidence |
| --- | --- | --- |
| Pointer easing measured intro layout on every animation frame | Geometry is cached on ResizeObserver, resize, and font readiness; painting updates transforms | Source hashes in receipt; resize check matched independently calculated progress |
| Handoff rail had one static color | Rail fills with the same progress that aligns the paper and frame; travel stays 220px | [Midpoint](after-scroll-midpoint.png), [resolve](after-scroll-resolve.png), receipt progress0.5→1 |
| Pointer preference changes could retain the previous desired offset | Preference changes reset the target; reduced motion uses a static alignment | [Reduced motion](after-reduced-motion.png), receipt live-switch check |
| Mobile continue arrow measured40px | Arrow now measures44px | Source CSS; immediate main CTA is50px high in390px touch viewport |
| App and extension used separate generic marks | Both display the original Open View symbol | [Before app](before-desktop-opening.webp), [after app](after-desktop.png), [before panel](before-extension-panel-320.png), [after panel](after-extension-initial-320.png) |

Rapid pointer direction changes in both directions settled to the latest requested target within0.5px. Keyboard Enter focused the actual live-audit section. A touch-emulated390px viewport retained the CTA in the first screen and navigated through its real anchor. The1024px resize check found no stale progress. Failed decorative media left the copy and CTA usable; no extra fallback code was required. Extension initial screens at320px and420px had no horizontal overflow. The160px Spotkit composition retained its page-to-receipt relationship and readable surrounding instructions.

## Motion rubric

The installed Motion Director / Web Motion Auditor rubric informed this review. Scores describe this observed implementation, not a benchmark certification.

| Category | Score | Basis |
| --- | --- | --- |
| Purpose | 3/3 | Alignment and the cited-source relationship support the product metaphor |
| Timing | 2/3 | Both interruption directions settled; frame pacing was not measured |
| Hierarchy | 3/3 | Copy and immediate CTA stay stationary while decorative planes align |
| Brand fit | 3/3 | Existing Limora paper, cobalt glass, navy, and lime connect to the actual inspection tool |
| Accessibility | 3/3 | Static reduced-motion alignment; native scroll; direct keyboard/touch entry |
| Implementation | 3/3 | Bounded native effect with cached layout, observer cleanup, and captured states |
| Performance | UNKNOWN | No compositor trace, frame-rate benchmark, or physical phone profiling in this pass |

No overall rubric pass is claimed while performance is unscored. The build, lint, and type checks passed separately. JavaScript-disabled operation is not supported by this React SPA; this pass tested failed decorative media, not a no-JavaScript application. Native screen-reader and physical-phone checks remain unmeasured.

Reference use: [21st's scroll guide](https://dev.21st.dev/blog/react-scroll-animation-components) informed the native-scroll, short-pin, cached-measurement, and reduced-motion decisions. [MotionSites Jellyfish Scroll](https://motionsites.ai/?prompt=driftlab-hero) informed only the layered-object and restrained progress pattern reviewed by the lead agent. No reference code or artwork was copied. The existing Scrollcraft layer contracts and Emil Apple interaction rules remain in use. All displayed audit values still come from the shared analyzer.
