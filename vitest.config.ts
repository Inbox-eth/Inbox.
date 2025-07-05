import { defineConfig } from "vitest/config";
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    ...viteConfig.test,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
});