import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "responder-assist";
const isProd = process.env.NODE_ENV === "production" || process.env.DEPLOY === "github";

export default defineConfig(({ mode }) => {
  const useBase = isProd || mode === "github";
  return {
    base: useBase ? `/${repoName}/` : "/",
    plugins: [react()],
    server: {
      port: 3000,
      host: "localhost",
      https: false,
      hmr: {
        port: 3000,
      },
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        ".trycloudflare.com",
        ".ngrok.io",
        ".ngrok-free.app",
        ".loca.lt",
        ".github.io",
        ".githubusercontent.com",
      ],
      cors: true,
    },
    preview: {
      port: 3000,
      allowedHosts: true,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        input: {
          taskpane: "index.html",
          commands: "src/commands/commands.html",
        },
      },
    },
  };
});
