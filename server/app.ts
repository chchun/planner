// Hono 앱 조립 (spec 005 R-42) — 로컬(index.ts)과 Vercel(api/[[...route]].ts)이 공유하는 순수 조립 함수.
// 부팅 로직(initDb/seed/retry)은 여기 두지 않는다: 로컬은 index.ts, 프로덕션은 db:setup 스크립트·크론이 담당.
import { Hono, type Context } from "hono";
import { login, logout, requireAuth, type AuthUser } from "./auth.js";
import { initDb } from "./db.js";
import { retryPendingSyncs } from "./gsync.js";
import { api } from "./routes.js";
import { seedIfEmpty } from "./seed.js";

export type AppEnv = { Variables: { user: AuthUser } };

/** 크론·관리 엔드포인트 공용 비밀값 검증 — Vercel Cron은 Authorization: Bearer를 자동 첨부, 수동 호출은 x-cron-secret */
function cronAuthorized(c: Context): boolean {
  const secret = process.env.CRON_SECRET;
  const given = c.req.header("x-cron-secret") ?? c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  return !!secret && given === secret;
}

export function buildApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, (c) => c.json({ user: c.get("user") }));

  // 캘린더 재시도 크론 (R-43) — 세션 없이 비밀값으로 보호. requireAuth보다 먼저 등록해 예외 처리
  app.get("/api/cron/retry-gcal", async (c) => {
    if (!cronAuthorized(c)) return c.json({ error: "unauthorized" }, 401);
    const retried = await retryPendingSyncs();
    return c.json({ ok: true, retried });
  });

  // 1회성 DB 셋업 (R-43 보완, 멱등) — Neon 통합 env가 Sensitive라 로컬 db:setup이 불가할 때 원격 실행
  app.get("/api/admin/db-setup", async (c) => {
    if (!cronAuthorized(c)) return c.json({ error: "unauthorized" }, 401);
    await initDb();
    await seedIfEmpty();
    return c.json({ ok: true });
  });

  app.use("/api/*", requireAuth);
  app.route("/api", api);

  return app;
}
