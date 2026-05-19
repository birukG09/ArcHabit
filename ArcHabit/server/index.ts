import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import habitRoutes from "./routes/habits.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? "3000");
const isDev = process.env.NODE_ENV === "development";

async function main() {
  const app = express();
  app.use(express.json());

  app.get("/api/healthz", (_req, res) => res.json({ ok: true }));
  app.use("/api", habitRoutes);

  if (isDev) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, hmr: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "../../dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Circular running on port ${PORT} [${isDev ? "dev" : "prod"}]`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
