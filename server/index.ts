import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { initDb } from "./db";
import { seedIfEmpty } from "./seed";
import { login, logout, requireAuth, type AuthUser } from "./auth";
import { api } from "./routes";

const app = new Hono<{ Variables: { user: AuthUser } }>();

app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);
app.get("/api/auth/me", requireAuth, (c) => c.json({ user: c.get("user") }));

app.use("/api/*", requireAuth);
app.route("/api", api);

const PORT = Number(process.env.PORT ?? 3001);

initDb()
  .then(seedIfEmpty)
  .then(() => {
    serve({ fetch: app.fetch, port: PORT });
    console.log(`[server] listening on http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
  });
