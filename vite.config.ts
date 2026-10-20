import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base:
    process.env.GITHUB_ACTIONS === 'true'
      ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'cisco-iiot-product-selector'}/`
      : '/',
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
