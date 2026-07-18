// 오프라인 스냅샷 + 쓰기 큐 (spec 003 R-21·22). 범용 동기화 엔진이 아니라
// 허용된 3종(완료 체크·서브태스크·계획) 토글과 타이머 세션만 다룬다.
import { idbDel, idbGet, idbSet } from "../lib/idb";
import { repo } from "./repository";
import type { BootstrapData } from "./types";

const SNAPSHOT_KEY = "snapshot";
const QUEUE_KEY = "syncQueue";

export interface Snapshot {
  data: BootstrapData;
  savedAt: number;
}

/** ROADMAP의 SyncQueueItem 구조 */
export interface SyncQueueItem {
  id: string;
  entityType: "todo" | "subtask" | "plan" | "timer";
  entityId: string;
  operation: "toggle" | "create";
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

export const loadSnapshot = (): Promise<Snapshot | undefined> => idbGet<Snapshot>(SNAPSHOT_KEY);
export const saveSnapshot = (data: BootstrapData): Promise<unknown> =>
  idbSet(SNAPSHOT_KEY, { data, savedAt: Date.now() } satisfies Snapshot);
export const clearSnapshot = (): Promise<unknown> => idbDel(SNAPSHOT_KEY);

export const loadQueue = async (): Promise<SyncQueueItem[]> =>
  (await idbGet<SyncQueueItem[]>(QUEUE_KEY)) ?? [];
const saveQueue = (queue: SyncQueueItem[]): Promise<unknown> => idbSet(QUEUE_KEY, queue);

/**
 * 큐에 추가. 토글류는 같은 엔티티의 기존 항목을 교체(마지막 상태만 전송 — ROADMAP 합치기 규칙),
 * 타이머 세션(create)은 append-only로 항상 추가.
 */
export async function enqueue(
  item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">,
): Promise<SyncQueueItem[]> {
  let queue = await loadQueue();
  if (item.operation === "toggle") {
    queue = queue.filter(
      (x) => !(x.entityType === item.entityType && x.entityId === item.entityId),
    );
  }
  queue.push({ ...item, id: crypto.randomUUID(), createdAt: Date.now(), retryCount: 0 });
  await saveQueue(queue);
  return queue;
}

async function sendItem(item: SyncQueueItem): Promise<void> {
  switch (item.entityType) {
    case "todo":
      await repo.setTodoDone(item.entityId, item.payload.done as boolean);
      return;
    case "subtask":
      await repo.setSubtaskDone(
        item.payload.todoId as string,
        item.entityId,
        item.payload.done as boolean,
      );
      return;
    case "plan":
      await repo.setPlanDone(item.entityId, item.payload.done as boolean);
      return;
    case "timer":
      await repo.postTimerSession(
        item.payload.subject as string,
        item.payload.startedAt as string,
        item.payload.endedAt as string,
      );
      return;
  }
}

/**
 * 큐 FIFO 전송. 실패한 항목부터 뒤는 남긴다(순서 보존).
 * 반환: 남은 큐 (빈 배열 = 전부 성공)
 */
export async function flushQueue(): Promise<SyncQueueItem[]> {
  const queue = await loadQueue();
  let i = 0;
  for (; i < queue.length; i++) {
    try {
      await sendItem(queue[i]);
    } catch {
      queue[i].retryCount++;
      break;
    }
  }
  const rest = queue.slice(i);
  await saveQueue(rest);
  return rest;
}
