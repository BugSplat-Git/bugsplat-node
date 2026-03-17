import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['spec/e2e/**/*.spec.ts'],
        setupFiles: ['spec/e2e/setup.ts'],
    },
});
