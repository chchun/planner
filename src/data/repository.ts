// 데이터 접근 계층 (constitution §3) — Phase 2: 백엔드 API 구현체.
// UI는 스토어를 통해 이 함수들만 사용한다. 서버 스키마는 server/db.ts 참조.
import { del, get, patch, post } from "./api";
import type { BootstrapData, User } from "./types";

export const repo = {
  login: (username: string, password: string) =>
    post<{ user: User }>("/api/auth/login", { username, password }).then((r) => r.user),
  logout: () => post<{ ok: true }>("/api/auth/logout"),
  me: () => get<{ user: User }>("/api/auth/me").then((r) => r.user),

  bootstrap: () => get<BootstrapData>("/api/bootstrap"),

  createTodo: (input: { title: string; source: string; dueAt: string | null; subs: string[] }) =>
    post<{ id: string; subs: Array<{ id: string; title: string; done: boolean }> }>("/api/todos", input),
  setTodoDone: (id: string, done: boolean) => patch(`/api/todos/${id}`, { done }),
  setSubtaskDone: (todoId: string, subId: string, done: boolean) =>
    patch(`/api/todos/${todoId}/subtasks/${subId}`, { done }),
  setPlanDone: (id: string, done: boolean) => patch(`/api/plan/${id}`, { done }),

  createMemo: (input: { folder: string; color: string; text: string; image: string | null }) =>
    post<{ id: string }>("/api/memos", input),
  setMemoDone: (id: string, done: boolean) => patch(`/api/memos/${id}`, { done }),
  deleteMemo: (id: string) => del(`/api/memos/${id}`),

  postTimerSession: (subject: string, startedAt: string, endedAt: string) =>
    post("/api/timer/sessions", { subject, startedAt, endedAt }),
};
