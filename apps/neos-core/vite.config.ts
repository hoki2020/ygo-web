import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import ydkLoader from "vite-ydk-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import sassDts from "vite-plugin-sass-dts";
import path from "path";
import fs from "fs";
import arraybuffer from "vite-plugin-arraybuffer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "local-data-middleware",
      configureServer(server) {
        const localDataRoot = path.resolve(__dirname, "../../server/local-data");
        server.middlewares.use("/local-data", (req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const pureUrl = decodeURIComponent(req.url.split("?")[0] || "/");
          const rel = pureUrl.replace(/^\/+/, "");
          const filePath = path.resolve(localDataRoot, rel);

          if (!filePath.startsWith(localDataRoot)) {
            res.statusCode = 403;
            res.end("Forbidden");
            return;
          }

          if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            next();
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const typeByExt: Record<string, string> = {
            ".json": "application/json; charset=utf-8",
            ".conf": "text/plain; charset=utf-8",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".cdb": "application/octet-stream",
          };

          res.setHeader("Content-Type", typeByExt[ext] || "application/octet-stream");
          fs.createReadStream(filePath).pipe(res);
        });
      },
    },
    react(),
    svgr(),
    ydkLoader(),
    arraybuffer(),
    tsconfigPaths(),
    sassDts({
      enabledMode: ["development"],
      sourceDir: path.resolve(__dirname, "./src"),
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".ydk"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
});
