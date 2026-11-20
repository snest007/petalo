import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { aliases } from "./vite.aliases"

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  root: "docs",
  publicDir: r("public"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: aliases },
  build: {
    outDir: r("dist"),
    emptyOutDir: true,
    rollupOptions: { input: { main: r("docs/index.html"), ui5: r("docs/ui5.html"), wcr: r("docs/wcr.html"), block: r("docs/block.html") } },
  },
  server: { port: 5173 },
})
