import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "학습 플래너",
        short_name: "플래너",
        description: "고등학생 학습 관리 플래너",
        lang: "ko",
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#f8fafc",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // 앱 셸만 프리캐시. API는 절대 캐시하지 않는다 (spec 003 R-24) —
        // 데이터 캐시는 앱 레벨 IndexedDB 스냅샷이 담당.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // 메모 이미지(Vercel Blob) — 오프라인에서도 표시 (spec 005 R-45). 캐시는 표시 전용
            urlPattern: ({ url }) => url.hostname.endsWith(".public.blob.vercel-storage.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "blob-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
