// 데이터 접근 계층 (constitution §3) — UI는 이 함수들만 호출한다.
// Phase 1: 동기 mock 반환. Phase 2: 같은 시그니처로 백엔드 API 구현체로 교체한다.
import * as mock from "./mock";
import type { CalendarEvent, Memo, PlanItem, Subject, TimetableBlock, Todo } from "./types";

export const repo = {
  getSubjects: (): Subject[] => mock.subjects,
  getTodos: (): Todo[] => mock.todos,
  getOverdueItems: () => mock.overdueItems,
  getTimelineItems: () => mock.timelineItems,
  getPlan: (): PlanItem[] => mock.plan,
  getTimetable: (): TimetableBlock[] => mock.timetable,
  getEvents: (): Record<number, CalendarEvent[]> => mock.events,
  getMemos: (): Memo[] => mock.memos,
  getMemoFolders: (): string[] => mock.memoFolders,
};
