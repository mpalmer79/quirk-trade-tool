import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],  // <— add this line
    globals: true
  }
});
