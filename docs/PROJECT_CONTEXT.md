# Project context

ClearView is a local-first browser inspector for visible financial disclosures, selected add-ons, and selected accessibility problems. See PRODUCT.md for product facts and DESIGN.md for the current visual system.

Stack: TypeScript strict mode, npm workspaces, framework-free DOM analyzer, React19, Vite6, Tailwind3, Vitest2, JSDOM25, Chrome ManifestV3.

The final refinement passes39unit/integration tests, lint, types, builds,13browser tests locally and on Vercel, and real-extension repair/rollback checks. Runtime `86676fa7176cdeec8f03d8505e1c1f2f929f4b6a` is deployed at https://clearview-brown.vercel.app. All17static files match the build. Brand/intro checks pass16/16. The runtime is frozen for video production.

The owner approved public GitHub and Vercel publication and adding the GitHub CLI workflow scope. GitHub authorization and source publication are complete. The public main branch contains the verified runtime.

The final demo video is still in production. Prior footage was superseded by the UI redesign. No final video review or Devpost submission is complete.
