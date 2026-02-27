// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 🚨 기존 '/auth' 에서 아래처럼 더 구체적으로 바꿔주세요!
      "/auth/google": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/auth/me": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/games": {
        target: "http://localhost:8080", // 실제 백엔드 주소
        changeOrigin: true,
      },
    },
  },
});
