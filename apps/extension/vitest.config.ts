import { defineConfig } from 'vitest/config';
export default defineConfig({ esbuild: { jsx: 'automatic' }, css: { postcss: { plugins: [] } }, test: { environment: 'jsdom', api: false, ui: false, include: ['tests/**/*.test.ts'], pool: 'forks', poolOptions: { forks: { singleFork: true } } } });
