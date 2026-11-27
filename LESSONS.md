# Verified lessons

- React checkbox onChange follows its click/change plugin path. Programmatic input/change events alone are insufficient for controlled checkbox integration. The sandbox needs a native event adapter and a browser regression test.
- The event rules state age-of-majority eligibility. They do not state a parental-consent exception. See docs/SUBMISSION.md for dated links and discrepancies.
- Windows symbolic-link creation is unavailable under this process token. CLAUDE.md uses the supported @AGENTS.md import fallback.
- Chromium's automatic side-panel action path did not grant activeTab in the tested build. An explicit action.onClicked handler that calls sidePanel.open granted temporary access. The actual extension test verifies denial before the action and successful injection after it without broad host permissions.
- In Chromium 159's isolated world, deferred CSSOM serialization could recreate an empty style attribute after removal. Reading the style attribute immediately before removing an originally absent attribute produced exact rollback on the public W3C demonstration. Keep this real-browser regression separate from JSDOM tests.
- Host-controlled data-clearview-id attributes cannot establish element identity. An internal WeakMap prevents copied attributes from redirecting repairs to replacement nodes.
- Raw outerHTML is unsafe evidence for form controls because it can contain value attributes. Reports use safe element descriptions and exclude input, textarea, and editable-field values.
- A root Vite 6 override keeps the React Vite plugin and workspace config on the same type definitions. This also removes the nested Vite 5 development-server dependency from Vitest 2.
