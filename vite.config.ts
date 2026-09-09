import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // "prompt" (not "autoUpdate") so we can surface an in-app "new version
      // available" banner via useRegisterSW instead of silently swapping
      // the app out from under a user who kept it open for days.
      registerType: "prompt",
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png", "pwa-maskable-512x512.png"],
      // injectManifest (not generateSW) so src/sw.ts can add a real `push`
      // event handler — generateSW only supports declarative runtime
      // caching, it can't run custom event-listener code.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        // recharts (added for the TFC Lab page charts) pushed the main
        // bundle past the 2 MiB default — raise the precache cap rather
        // than silently dropping the app shell from the offline cache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: "Two4Coaching",
        short_name: "2C",
        description: "Réserve tes séances de coaching, suis tes crédits et progresse avec Two4Coaching.",
        lang: "fr",
        theme_color: "#0066cc",
        background_color: "#1a1f2e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        // "any" and "maskable" are kept as separate icon entries on purpose:
        // an "any" icon is shown as-is, while a "maskable" one is expected
        // to have its outer ~20% cropped by the OS mask shape. Combining
        // both purposes on one image (as before) means whichever platform
        // applies the maskable crop chops into the actual logo/wordmark.
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Réserver une séance",
            short_name: "Réserver",
            url: "/planning",
          },
          {
            name: "Mon espace",
            short_name: "Mon espace",
            url: "/mon-espace",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Stamped at build time so the footer can show which build is actually
    // live — the simplest way to confirm a deploy landed after a push.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}));
