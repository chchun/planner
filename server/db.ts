// DB 어댑터 — 개발: PGlite(임베디드 PostgreSQL, ./data/pg 파일 저장)
//            운영: DATABASE_URL 설정 시 node-postgres(pg)로 실제 PostgreSQL 접속. SQL은 동일.
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

let db: Queryable;

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
CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function initDb(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pg = await import("pg");
    const pool = new pg.default.Pool({ connectionString: url });
    db = pool;
  } else {
    mkdirSync("./data/pg", { recursive: true });
    db = new PGlite("./data/pg");
  }
  for (const stmt of SCHEMA.split(";")) {
    if (stmt.trim()) await db.query(stmt);
  }
}

/** 파라미터 바인딩 쿼리 ($1, $2 …) */
export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const r = await db.query(sql, params);
  return r.rows as T[];
}
