// Vercel 서버리스 진입점 (spec 005 R-42) — buildApp()만 서빙한다.
// 부팅 로직(initDb/seed/retry)은 실행하지 않는다: 스키마·시드는 npm run db:setup, 재시도는 크론(R-43).
// pg·node:crypto·bcrypt 의존 → edge 불가, Node 런타임 고정.
import { handle } from "hono/vercel";
import { buildApp } from "../server/app";

export const runtime = "nodejs";

const app = buildApp();

export default handle(app);
