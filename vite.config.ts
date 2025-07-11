import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const useProxy = process.env.VITE_USE_PROXY === "true";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings", "@xmtp/browser-sdk"],
    include: ["@xmtp/proto"],
  },
  server: {
    ...(useProxy && {
      proxy: {
        '/api/namestone': 'http://localhost:3001',
        // (keep '/api/ens' if you still use it)
      },
    }),
  },
});
