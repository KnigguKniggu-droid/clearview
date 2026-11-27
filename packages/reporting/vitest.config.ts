import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'jsdom', api: false, ui: false, include: ['tests/**/*.test.ts'], restoreMocks: true }
});
