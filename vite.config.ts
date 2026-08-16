/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    target: 'es2022',
    lib: {
      name: 'TxtFSM',
      entry: 'src/index.ts',
      formats: ['es', 'umd'],
    },
    sourcemap: true,
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/*.{test,spec}.ts'],
        },
      },
    ],
  },
});
