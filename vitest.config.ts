import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['spec/**/*.spec.ts'],
        exclude: ['spec/e2e/**'],
    },
});
