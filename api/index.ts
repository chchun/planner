// Vercel 서버리스 진입점 (spec 005 R-42) — buildApp()만 서빙한다.
// 부팅 로직(initDb/seed/retry)은 실행하지 않는다: 스키마·시드는 npm run db:setup, 재시도는 크론(R-43).
// pg·node:crypto·bcrypt 의존 → edge 불가, Node 런타임 고정.
// 모든 /api/* 요청은 vercel.json rewrite로 이 함수에 도달하고, Hono가 원래 경로로 라우팅한다.
import { handle } from "hono/vercel";
import { buildApp } from "../server/app.js";

export const runtime = "nodejs";

const handler = handle(buildApp());

// Vercel Node 런타임은 web-표준 핸들러를 HTTP 메서드별 named export로 받는다
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
