/**
 * County Finance — Vite Configuration
 * Clean from all Manus plugins and domain restrictions
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // REMOVED: vitePluginManusRuntime() — Manus-specific
    // REMOVED: vitePluginManusDebugCollector() — Manus debug logging
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@server": path.resolve(__dirname, "server"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },

  // REMOVED: allowedHosts with Manus domains
  // Now only our own domains are served
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          charts: ["recharts"],
        },
      },
    },
  },
});
