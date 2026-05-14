import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from "url";
import { dirname } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = dirname(fileURLToPath(new URL(".", import.meta.url)));
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "https://cozy-candles-backend.onrender.com",
          changeOrigin: true,
          secure: true
        }
      }
    }
  };
})
