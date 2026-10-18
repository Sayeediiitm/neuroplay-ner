import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png"],
      manifest: {
        name: "NeuroPlay NER",
        short_name: "NeuroPlay",
        description: "Cognitive games and memory assistance for elderly patients — NE India",
        theme_color: "#1a56db",
        background_color: "#f0f4ff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "en",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Cache all Vite build artifacts (hashed filenames) cache-first
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        // Navigate fallback — SPA must load offline
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // API calls: network-first, fallback to cache
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        // Enable SW in dev so we can test offline
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});
