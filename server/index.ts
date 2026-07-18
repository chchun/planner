import { serve } from "@hono/node-server";
import { Hono } from "hono";

// .env 로드 (없으면 무시) — google.ts가 env를 읽기 전에 실행되어야 하므로 최상단
try {
  process.loadEnvFile(".env");
} catch {
  /* .env 없음 — 연동 기능만 비활성 */
}

const { initDb } = await import("./db");
const { seedIfEmpty } = await import("./seed");
const { login, logout, requireAuth } = await import("./auth");
const { api } = await import("./routes");
const { retryPendingSyncs } = await import("./gsync");
const { gcalEnabled } = await import("./google");
type AuthUser = import("./auth").AuthUser;

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
    console.log(`[gcal] 연동 ${gcalEnabled() ? "활성" : "비활성 (키 미설정)"}`);
    void retryPendingSyncs().catch((err) => console.error("[gcal] 재시도 실패:", err));
  })
  .catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
  });
