import { defineConfig } from 'vitest/config';
export default defineConfig({ css: { postcss: { plugins: [] } }, test: { environment: 'jsdom', api: false, ui: false, include: ['tests/**/*.test.ts'], pool: 'forks', poolOptions: { forks: { singleFork: true } } } });
