import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  define: {
    "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(process.env.FIREBASE_API_KEY || ""),
    "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || ""),
    "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(process.env.FIREBASE_PROJECT_ID || ""),
    "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID || ""),
    "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify(process.env.FIREBASE_APP_ID || ""),
    "import.meta.env.VITE_FIREBASE_VAPID_KEY": JSON.stringify(process.env.FIREBASE_VAPID_KEY || ""),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
