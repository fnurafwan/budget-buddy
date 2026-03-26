import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig({
  base: "/", 
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/antam': {
        target: 'https://www.logammulia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/antam/, '')
      },
      '/api/ubs': {
        target: 'https://ubslifestyle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ubs/, '')
      }
    }
  },
  plugins: [
    react(),
    process.env.NODE_ENV === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});