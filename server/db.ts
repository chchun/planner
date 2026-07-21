// DB 어댑터 — 개발: PGlite(임베디드 PostgreSQL, ./data/pg 파일 저장)
//            운영: DATABASE_URL 설정 시 node-postgres(pg)로 실제 PostgreSQL 접속. SQL은 동일.
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

let db: Queryable | undefined;
let connecting: Promise<Queryable> | undefined;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','parent')),
  grade_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS subjects (
  name TEXT PRIMARY KEY,
  color TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prio TEXT NOT NULL DEFAULT 'mid' CHECK (prio IN ('high','mid','low')),
  source TEXT NOT NULL DEFAULT '',
  done BOOLEAN NOT NULL DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS todo_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id),
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  sort INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  goal_min INT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  done BOOLEAN NOT NULL DEFAULT FALSE,
  sort INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS timetable_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  start_h NUMERIC NOT NULL,
  end_h NUMERIC NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sched','hw')),
  start_at TIMESTAMPTZ NOT NULL,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder TEXT NOT NULL,
  color TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  image TEXT,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_sync_status TEXT;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_sync_error TEXT;
-- spec 006: 계획은 날짜별, 시간표는 요일(dow 0=월…6=일) 템플릿
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS plan_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE timetable_blocks ADD COLUMN IF NOT EXISTS dow INT;
-- spec 007: 일정 종료 시각 (nullable — 마감형 이벤트는 시점만 가진다)
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

/** 연결만 수립 (DDL 없음) — 서버리스는 q()가 이걸 통해 지연 연결한다. 모듈 스코프라 웜 인스턴스에서 재사용 */
async function getDb(): Promise<Queryable> {
  if (db) return db;
  if (!connecting) {
    connecting = (async () => {
      const url = process.env.DATABASE_URL;
      if (url) {
        const pg = await import("pg");
        db = new pg.default.Pool({ connectionString: url });
      } else {
        mkdirSync("./data/pg", { recursive: true });
        db = new PGlite("./data/pg");
      }
      return db;
    })();
  }
  return connecting;
}

/** 스키마 생성 포함 부팅 — 로컬(index.ts)과 db:setup 스크립트에서만 호출. 서버리스 진입점에선 호출 금지 (R-43) */
export async function initDb(): Promise<void> {
  const d = await getDb();
  for (const stmt of SCHEMA.split(";")) {
    if (stmt.trim()) await d.query(stmt);
  }
}

/** 파라미터 바인딩 쿼리 ($1, $2 …) */
export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const r = await (await getDb()).query(sql, params);
  return r.rows as T[];
}
