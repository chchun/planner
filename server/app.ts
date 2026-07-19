// Hono 앱 조립 (spec 005 R-42) — 로컬(index.ts)과 Vercel(api/[[...route]].ts)이 공유하는 순수 조립 함수.
// 부팅 로직(initDb/seed/retry)은 여기 두지 않는다: 로컬은 index.ts, 프로덕션은 db:setup 스크립트·크론이 담당.
import { Hono } from "hono";
import { login, logout, requireAuth, type AuthUser } from "./auth";
import { api } from "./routes";

export type AppEnv = { Variables: { user: AuthUser } };

export function buildApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, (c) => c.json({ user: c.get("user") }));

  app.use("/api/*", requireAuth);
  app.route("/api", api);

  return app;
}
