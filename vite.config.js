import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  esbuild: { jsx: "automatic" },
  build: { outDir: "../dist", emptyOutDir: true },
  server: { host: "127.0.0.1", proxy: { "/api": "http://127.0.0.1:3000" } },
});
