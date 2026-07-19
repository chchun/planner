// 실행 환경 어댑터 (spec 005 R-42) — 로컬 node-server와 Vercel 서버리스의 차이를 흡수한다.
import { waitUntil } from "@vercel/functions";

/**
 * fire-and-forget 백그라운드 작업 보정 — Vercel 서버리스는 응답 후 함수가 얼어붙으므로
 * waitUntil로 완료를 보장하고, 로컬(node-server)은 프로세스가 살아있으니 그냥 흘려보낸다.
 */
export function waitUntilCompat(p: Promise<unknown>): void {
  if (process.env.VERCEL) waitUntil(p);
  else void p;
}

/** 프로덕션(HTTPS) 여부 — 세션 쿠키 Secure 적용 기준 */
export function isProd(): boolean {
  return !!process.env.VERCEL || process.env.NODE_ENV === "production";
}
