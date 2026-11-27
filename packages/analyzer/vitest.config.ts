import { defineConfig } from 'vitest/config';
export default defineConfig({test:{environment:'jsdom', api:false, ui:false, include:['tests/**/*.test.ts'], restoreMocks:true,
  coverage:{provider:'v8',include:['src/**/*.ts'],exclude:['src/types.ts'],reporter:['text','json-summary','html'],thresholds:{lines:80,branches:80,functions:80,statements:80}},
}});
