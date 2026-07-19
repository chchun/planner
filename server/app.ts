// Hono 앱 조립 (spec 005 R-42) — 로컬(index.ts)과 Vercel(api/[[...route]].ts)이 공유하는 순수 조립 함수.
// 부팅 로직(initDb/seed/retry)은 여기 두지 않는다: 로컬은 index.ts, 프로덕션은 db:setup 스크립트·크론이 담당.
import { Hono } from "hono";
import { login, logout, requireAuth, type AuthUser } from "./auth.js";
import { retryPendingSyncs } from "./gsync.js";
import { api } from "./routes.js";

export type AppEnv = { Variables: { user: AuthUser } };

export function buildApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, (c) => c.json({ user: c.get("user") }));

  // 캘린더 재시도 크론 (R-43) — 세션 없이 비밀값으로 보호. requireAuth보다 먼저 등록해 예외 처리
  // Vercel Cron은 커스텀 헤더를 못 보내고 Authorization: Bearer <CRON_SECRET>를 자동 첨부하므로 둘 다 허용
  app.get("/api/cron/retry-gcal", async (c) => {
    const secret = process.env.CRON_SECRET;
    const given = c.req.header("x-cron-secret") ?? c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!secret || given !== secret) return c.json({ error: "unauthorized" }, 401);
    const retried = await retryPendingSyncs();
    return c.json({ ok: true, retried });
  });

  app.use("/api/*", requireAuth);
  app.route("/api", api);

  return app;
}
