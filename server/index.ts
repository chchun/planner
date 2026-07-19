// 로컬 전용 진입점 — node-server + 부팅 로직(initDb/seed/재시도). Vercel 진입점은 api/[[...route]].ts
import { serve } from "@hono/node-server";

// .env 로드 (없으면 무시) — google.ts가 env를 읽기 전에 실행되어야 하므로 최상단
try {
  process.loadEnvFile(".env");
} catch {
  /* .env 없음 — 연동 기능만 비활성 */
}

const { initDb } = await import("./db");
const { seedIfEmpty, migrateTimetableWeekly } = await import("./seed");
const { buildApp } = await import("./app");
const { retryPendingSyncs } = await import("./gsync");
const { gcalEnabled } = await import("./google");

const app = buildApp();
const PORT = Number(process.env.PORT ?? 3001);

initDb()
  .then(migrateTimetableWeekly)
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
