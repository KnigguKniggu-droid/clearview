# Dependency review

Reviewed November 26, 2026, using npm audit and the published advisories.

The project preserves the requested major versions: React 19, TypeScript 5, Vite 6, Tailwind 3, Vitest 2, and JSDOM 25. The lockfile resolves patched releases within these ranges. A root Vite override keeps every workspace and test dependency on the same Vite 6 release. This removes the vulnerable nested Vite 5 development server and prevents incompatible Vite plugin types.

`npm audit --omit=dev` returned zero vulnerabilities. This is a dependency database result, not proof that the application has no security defects.

The full dependency audit still reports seven development dependency entries: four moderate and three critical. They are in Vitest 2, its worker/mocking dependencies, and the coverage toolchain. Several entries propagate the same underlying advisory through parent packages. The release does not ship these packages in the static app or extension bundles.

The Vitest arbitrary-file-read/code-execution advisory concerns its API/UI/browser server. This project runs `vitest run` in JSDOM, explicitly disables API and UI servers, and does not run Vitest browser mode. Browser regression tests use Playwright separately. The Vite preview binds to loopback by default. Do not expose the legacy test toolchain as a service.

Tinypool also has a prototype-pollution gadget advisory. Tests must remain trusted local repository code. No webpage-controlled object reaches its worker configuration.

A clean full audit requires upgrading the requested Vitest 2 major version and compatible coverage packages. That change is not silently included. The remaining development dependency risk is open and must be considered before adopting this toolchain beyond the requested prototype.

Sources:
- https://github.com/advisories/GHSA-5xrq-8626-4rwp
- https://github.com/advisories/GHSA-85c8-ppgw-ccpr

Reproduce: `npm audit --omit=dev` and `npm audit`. A nonzero exit from the full audit is expected until the legacy development dependency risk is resolved.
