// 숙제 push 상태 관리 (spec 004 R-32) — push 실패가 앱 동작을 막지 않는다
import { q } from "./db";
import { deleteEvent, gcalEnabled, insertHomeworkEvent, invalidateListCache } from "./google";

/** 할일을 시윤학원 캘린더로 push하고 상태를 기록 (비동기 — 호출측은 기다리지 않아도 됨) */
export async function pushTodoEvent(todoId: string, title: string, dueAt: Date): Promise<void> {
  if (!gcalEnabled()) return;
  try {
    const eventId = await insertHomeworkEvent(title, dueAt);
    await q(
      "UPDATE todos SET google_event_id=$1, google_sync_status='synced', google_sync_error=NULL WHERE id=$2",
      [eventId, todoId],
    );
    invalidateListCache();
  } catch (err) {
    console.error("[gcal] push 실패:", todoId, err);
    await q("UPDATE todos SET google_sync_status='failed', google_sync_error=$1 WHERE id=$2", [
      String(err).slice(0, 500),
      todoId,
    ]);
  }
}

/** 할일 삭제 시 구글 이벤트도 삭제 — 실패해도 앱 삭제는 유지 */
export async function deleteTodoEvent(todoId: string): Promise<void> {
  if (!gcalEnabled()) return;
  const [row] = await q<{ google_event_id: string | null }>(
    "SELECT google_event_id FROM todos WHERE id=$1",
    [todoId],
  );
  if (!row?.google_event_id) return;
  try {
    await deleteEvent(row.google_event_id);
    invalidateListCache();
  } catch (err) {
    console.error("[gcal] 이벤트 삭제 실패:", todoId, err);
  }
}

/** 부팅(로컬)·크론(R-43) 시 pending/failed 재시도 (R-32) — 재시도한 건수 반환 */
export async function retryPendingSyncs(): Promise<number> {
  if (!gcalEnabled()) return 0;
  const rows = await q<{ id: string; title: string; due_at: string }>(
    `SELECT id, title, due_at FROM todos
     WHERE google_sync_status IN ('pending','failed') AND deleted_at IS NULL AND due_at IS NOT NULL`,
  );
  if (rows.length === 0) return 0;
  console.log(`[gcal] 재시도 대상 ${rows.length}건`);
  for (const r of rows) {
    await pushTodoEvent(r.id, r.title, new Date(r.due_at));
  }
  return rows.length;
}
