import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import type { AuthUser } from "./auth.js";
import { blobEnabled, deleteBlobUrl, isBlobUrl, putMemoImage } from "./blob.js";
import { q } from "./db.js";
import { listGoogleEvents } from "./google.js";
import { deleteTodoEvent, pushTodoEvent } from "./gsync.js";
import { waitUntilCompat } from "./runtime.js";

type Env = { Variables: { user: AuthUser } };

export const api = new Hono<Env>();

// 집계 경계는 서버 TZ와 무관하게 KST로 계산한다 — Vercel 서버리스는 UTC이고 TZ env는 예약어라 설정 불가 (R-44)
const KST_OFFSET_MS = 9 * 3_600_000;
const DAY_MS = 86_400_000;

/** 오늘 00:00 KST (UTC 시각으로 반환) */
function todayStart(): Date {
  return new Date(Math.floor((Date.now() + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS);
}
/** 이번 주 월요일 00:00 KST */
function mondayStart(): Date {
  const today = todayStart();
  const dowKst = (new Date(today.getTime() + KST_OFFSET_MS).getUTCDay() + 6) % 7;
  return new Date(today.getTime() - dowKst * DAY_MS);
}

// ---- bootstrap: 로그인 후 초기 데이터 일괄 조회 ----
api.get("/bootstrap", async (c) => {
  const monday = mondayStart();
  const today = todayStart();
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const monthStart = new Date(Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), 1) - KST_OFFSET_MS);
  const nextMonth = new Date(Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth() + 1, 1) - KST_OFFSET_MS);

  const subjects = await q<{ name: string; color: string; today_sec: number; week_sec: number }>(
    `SELECT s.name, s.color,
       COALESCE(SUM(EXTRACT(EPOCH FROM (t.ended_at - t.started_at))) FILTER (WHERE t.started_at >= $1), 0)::float AS today_sec,
       COALESCE(SUM(EXTRACT(EPOCH FROM (t.ended_at - t.started_at))) FILTER (WHERE t.started_at >= $2), 0)::float AS week_sec
     FROM subjects s LEFT JOIN timer_sessions t ON t.subject = s.name
     GROUP BY s.name, s.color, s.sort ORDER BY s.sort`,
    [today, monday],
  );

  const todos = await q<Record<string, unknown>>(
    `SELECT id, title, prio, source, done, due_at FROM todos
     WHERE deleted_at IS NULL ORDER BY created_at DESC`,
  );
  const subs = await q<{ id: string; todo_id: string; title: string; done: boolean }>(
    `SELECT st.id, st.todo_id, st.title, st.done FROM todo_subtasks st
     JOIN todos t ON t.id = st.todo_id WHERE t.deleted_at IS NULL ORDER BY st.sort`,
  );

  const plan = await q(
    "SELECT id, subject, goal_min, memo, done FROM plan_items ORDER BY sort",
  );
  const timetable = await q(
    "SELECT subject, start_h::float AS start, end_h::float AS \"end\" FROM timetable_blocks ORDER BY start_h",
  );
  const events = await q(
    `SELECT id, title, type, start_at FROM calendar_events
     WHERE deleted_at IS NULL AND start_at >= $1 AND start_at < $2 ORDER BY start_at`,
    [monthStart, nextMonth],
  );
  // 구글 캘린더(가족일정·시윤학원) 병합 — 실패 시 빈 배열 (spec 004 R-33)
  const googleEvents = await listGoogleEvents(monthStart, nextMonth);
  const memos = await q(
    "SELECT id, folder, color, text, image, done FROM memos WHERE deleted_at IS NULL ORDER BY created_at DESC",
  );
  const weekRows = await q<{ dow: number; sec: number }>(
    `SELECT EXTRACT(ISODOW FROM started_at AT TIME ZONE 'Asia/Seoul')::int - 1 AS dow,
            SUM(EXTRACT(EPOCH FROM (ended_at - started_at)))::float AS sec
     FROM timer_sessions WHERE started_at >= $1 GROUP BY 1`,
    [monday],
  );
  const weekStats = [0, 0, 0, 0, 0, 0, 0];
  for (const r of weekRows) weekStats[r.dow] = r.sec;

  return c.json({
    user: c.get("user"),
    subjects: subjects.map((s) => ({ name: s.name, color: s.color, todaySec: Math.round(s.today_sec), weekSec: Math.round(s.week_sec) })),
    todos: todos.map((t) => ({
      id: t.id, title: t.title, prio: t.prio, source: t.source, done: t.done,
      dueAt: t.due_at, subOpen: false,
      subs: subs.filter((s) => s.todo_id === t.id).map((s) => ({ id: s.id, title: s.title, done: s.done })),
    })),
    plan: plan.map((p) => ({ id: p.id, subject: p.subject, goal: p.goal_min, memo: p.memo, done: p.done })),
    timetable,
    events: [
      ...events.map((e) => ({ id: e.id, title: e.title, type: e.type, startAt: e.start_at, source: "local" })),
      ...googleEvents.map((e) => ({ id: e.id, title: e.title, type: "sched", startAt: e.startAt, source: e.source })),
    ],
    memos,
    weekStats: weekStats.map(Math.round),
    blobEnabled: blobEnabled(),
  });
});

// ---- todos ----
api.post("/todos", async (c) => {
  const b = await c.req.json();
  const title: string = b.title ?? "새 숙제";
  const dueAt: string | null = b.dueAt ?? null;
  const [t] = await q<{ id: string }>(
    "INSERT INTO todos (title, prio, source, done, due_at, google_sync_status) VALUES ($1,$2,$3,false,$4,$5) RETURNING id",
    [title, b.prio ?? "mid", b.source ?? "기타", dueAt, dueAt ? "pending" : null],
  );
  // 시윤학원 캘린더 push — 응답을 막지 않되 서버리스에선 완료 보장 (R-32, R-42)
  if (dueAt) waitUntilCompat(pushTodoEvent(t.id, title, new Date(dueAt)));
  const subs: Array<{ id: string; title: string; done: boolean }> = [];
  const titles: string[] = Array.isArray(b.subs) ? b.subs : [];
  for (let i = 0; i < titles.length; i++) {
    const [s] = await q<{ id: string }>(
      "INSERT INTO todo_subtasks (todo_id, title, sort) VALUES ($1,$2,$3) RETURNING id",
      [t.id, titles[i], i],
    );
    subs.push({ id: s.id, title: titles[i], done: false });
  }
  return c.json({ id: t.id, subs });
});

api.patch("/todos/:id", async (c) => {
  const b = await c.req.json();
  if (typeof b.done === "boolean") {
    await q("UPDATE todos SET done=$1, version=version+1, updated_at=NOW() WHERE id=$2", [b.done, c.req.param("id")]);
  }
  return c.json({ ok: true });
});

api.patch("/todos/:id/subtasks/:sid", async (c) => {
  const b = await c.req.json();
  await q("UPDATE todo_subtasks SET done=$1 WHERE id=$2 AND todo_id=$3", [
    !!b.done, c.req.param("sid"), c.req.param("id"),
  ]);
  return c.json({ ok: true });
});

api.delete("/todos/:id", async (c) => {
  const id = c.req.param("id");
  waitUntilCompat(deleteTodoEvent(id)); // 구글 이벤트도 삭제 (실패해도 앱 삭제 진행)
  await q("UPDATE todos SET deleted_at=NOW() WHERE id=$1", [id]);
  return c.json({ ok: true });
});

// ---- plan ----
api.patch("/plan/:id", async (c) => {
  const b = await c.req.json();
  await q("UPDATE plan_items SET done=$1 WHERE id=$2", [!!b.done, c.req.param("id")]);
  return c.json({ ok: true });
});

// ---- memos ----
// 이미지 업로드 → Vercel Blob 공개 URL 반환 (R-41). dataURL은 더 이상 DB에 저장하지 않는다
api.post("/memos/image", async (c) => {
  if (!blobEnabled()) {
    return c.json({ error: "이미지 저장소(Blob)가 설정되지 않았습니다" }, 501);
  }
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File) || file.size === 0) {
    return c.json({ error: "이미지 파일이 필요합니다" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "이미지 파일만 업로드할 수 있습니다" }, 400);
  }
  try {
    const url = await putMemoImage(`memos/${randomUUID()}`, file);
    return c.json({ url });
  } catch (err) {
    console.error("[blob] 업로드 실패:", err);
    return c.json({ error: "이미지 업로드에 실패했습니다" }, 502);
  }
});

api.post("/memos", async (c) => {
  const b = await c.req.json();
  const [m] = await q<{ id: string }>(
    "INSERT INTO memos (folder, color, text, image) VALUES ($1,$2,$3,$4) RETURNING id",
    [b.folder ?? "아이디어", b.color ?? "#fef9c3", b.text ?? "", b.image ?? null],
  );
  return c.json({ id: m.id });
});

api.patch("/memos/:id", async (c) => {
  const b = await c.req.json();
  await q("UPDATE memos SET done=$1 WHERE id=$2", [!!b.done, c.req.param("id")]);
  return c.json({ ok: true });
});

api.delete("/memos/:id", async (c) => {
  const [m] = await q<{ image: string | null }>(
    "UPDATE memos SET deleted_at=NOW() WHERE id=$1 RETURNING image",
    [c.req.param("id")],
  );
  // Blob 파일 정리 — 실패해도 삭제는 완료된 상태, 응답을 막지 않음 (R-41, R-42)
  const image = m?.image ?? null;
  if (isBlobUrl(image)) waitUntilCompat(deleteBlobUrl(image));
  return c.json({ ok: true });
});

// ---- timer (학생만 — spec R-15) ----
api.post("/timer/sessions", async (c) => {
  const user = c.get("user");
  if (user.role !== "student") return c.json({ error: "학생 계정만 타이머를 기록할 수 있습니다" }, 403);
  const b = await c.req.json();
  const started = new Date(b.startedAt);
  const ended = new Date(b.endedAt);
  if (!(started.getTime() < ended.getTime())) return c.json({ error: "invalid range" }, 400);
  await q("INSERT INTO timer_sessions (user_id, subject, started_at, ended_at) VALUES ($1,$2,$3,$4)", [
    user.id, b.subject, started, ended,
  ]);
  return c.json({ ok: true });
});
