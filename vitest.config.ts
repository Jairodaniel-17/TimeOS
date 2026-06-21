import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests unitarios en la carpeta `test/`. Los e2e de Playwright viven en
    // `e2e/` y se corren aparte con `npx playwright test`.
    include: ['test/**/*.test.ts'],
  },
});
