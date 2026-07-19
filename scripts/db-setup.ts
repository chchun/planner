// Neon 스키마·시드 1회 셋업 (spec 005 R-43) — npm run db:setup
// DDL은 언풀드(직접) 연결 권장: NEON_DATABASE_URL_UNPOOLED || DATABASE_URL 을
// db.ts가 읽는 DATABASE_URL로 주입한 뒤 initDb(CREATE TABLE) + seedIfEmpty를 1회 실행하고 종료한다.
try {
  process.loadEnvFile(".env");
} catch {
  /* .env 없음 — 환경변수로 직접 지정한 경우 */
}

const target = process.env.NEON_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!target) {
  console.error("[db:setup] NEON_DATABASE_URL_UNPOOLED 또는 DATABASE_URL을 설정하세요 (.env 또는 환경변수)");
  process.exit(1);
}
process.env.DATABASE_URL = target;

const { initDb } = await import("../server/db");
const { seedIfEmpty } = await import("../server/seed");

console.log(`[db:setup] 대상: ${new URL(target).host}`);
await initDb();
console.log("[db:setup] 스키마 적용 완료");
await seedIfEmpty();
console.log("[db:setup] 완료");
process.exit(0); // pg 풀이 프로세스를 붙잡으므로 명시 종료
