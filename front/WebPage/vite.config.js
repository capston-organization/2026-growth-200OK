// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth/google": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/auth/me": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/games": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/analysis": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/classroom": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/nlp": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});