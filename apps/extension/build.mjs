import { build } from 'vite';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = name => fileURLToPath(new URL(name, import.meta.url));
await build({ configFile: path('./vite.config.ts') });
for (const [entry, name] of [['background', 'ClearViewBackground'], ['contentScript', 'ClearViewContent']]) {
  await build({
    configFile: false,
    build: {
      outDir: path('./dist'), emptyOutDir: false,
      lib: { entry: path(`./src/${entry}.ts`), name, formats: ['iife'], fileName: () => `${entry}.js` },
      sourcemap: false
    }
  });
}
copyFileSync(path('./manifest.json'), path('./dist/manifest.json'));
