import { create } from "zustand";
import { repo } from "../data/repository";
import type { Memo, PlanItem, Subject, Tab, TimerState, Todo } from "../data/types";

interface AppState {
  activeTab: Tab;
  setTab: (tab: Tab) => void;

  subjects: Subject[];
  todos: Todo[];
  plan: PlanItem[];

  timer: TimerState;
  /** 같은 과목이면 정지, 다른 과목이면 이전 과목 정지 후 시작 (동시 1과목) */
  toggleTimer: (name: string) => void;

  toggleTodo: (id: number) => void;
  toggleTodoOpen: (id: number) => void;
  toggleSubtask: (id: number, index: number) => void;
  addTodo: (todo: Todo) => void;
  togglePlan: (index: number) => void;

  // 캘린더 화면 상태 (탭 전환 후에도 유지)
  calMode: "month" | "week";
  setCalMode: (m: "month" | "week") => void;
  filterSched: boolean;
  filterHw: boolean;
  toggleFilterSched: () => void;
  toggleFilterHw: () => void;
  selectedDate: number | null;
  setSelectedDate: (d: number | null) => void;

  // 메모 보드
  memos: Memo[];
  memoView: "card" | "list";
  setMemoView: (v: "card" | "list") => void;
  currentFolder: string;
  setCurrentFolder: (f: string) => void;
  addMemo: (memo: Memo) => void;
  toggleMemoDone: (id: number) => void;
  deleteMemo: (id: number) => void;

  // 등록 모달
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

/** 실행 중 타이머의 경과 초 — 시각 차이로 계산한다. interval 카운트 누적 금지 (constitution §4) */
export function runningElapsedSec(timer: TimerState, now: number = Date.now()): number {
  if (!timer.runningSubject || timer.startedAt == null) return 0;
  return Math.max(0, Math.floor((now - timer.startedAt) / 1000));
}

/** 실행 중 경과를 과목 누적에 확정 반영한 목록 */
function commitElapsed(subjects: Subject[], timer: TimerState): Subject[] {
  const elapsed = runningElapsedSec(timer);
  if (!timer.runningSubject || elapsed === 0) return subjects;
  return subjects.map((s) =>
    s.name === timer.runningSubject
      ? { ...s, todaySec: s.todaySec + elapsed, weekSec: s.weekSec + elapsed }
      : s,
  );
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "dashboard",
  setTab: (tab) => set({ activeTab: tab }),

  subjects: repo.getSubjects(),
  todos: repo.getTodos(),
  plan: repo.getPlan(),

  timer: { runningSubject: null, startedAt: null },
  toggleTimer: (name) =>
    set((s) => {
      const committed = commitElapsed(s.subjects, s.timer);
      if (s.timer.runningSubject === name) {
        return { subjects: committed, timer: { runningSubject: null, startedAt: null } };
      }
      return { subjects: committed, timer: { runningSubject: name, startedAt: Date.now() } };
    }),

  toggleTodo: (id) =>
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
  toggleTodoOpen: (id) =>
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, subOpen: !t.subOpen } : t)) })),
  toggleSubtask: (id, index) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id
          ? { ...t, subs: t.subs.map((x, j) => (j === index ? { ...x, done: !x.done } : x)) }
          : t,
      ),
    })),
  addTodo: (todo) => set((s) => ({ todos: [todo, ...s.todos] })),
  togglePlan: (index) =>
    set((s) => ({ plan: s.plan.map((p, j) => (j === index ? { ...p, done: !p.done } : p)) })),

  calMode: "month",
  setCalMode: (m) => set({ calMode: m }),
  filterSched: true,
  filterHw: true,
  toggleFilterSched: () => set((s) => ({ filterSched: !s.filterSched })),
  toggleFilterHw: () => set((s) => ({ filterHw: !s.filterHw })),
  selectedDate: null,
  setSelectedDate: (d) => set({ selectedDate: d }),

  memos: repo.getMemos(),
  memoView: "card",
  setMemoView: (v) => set({ memoView: v }),
  currentFolder: "전체",
  setCurrentFolder: (f) => set({ currentFolder: f }),
  addMemo: (memo) => set((s) => ({ memos: [memo, ...s.memos] })),
  toggleMemoDone: (id) =>
    set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, done: !m.done } : m)) })),
  deleteMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),

  modalOpen: false,
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}));

/** 과목명 → 색상 */
export function subjectColor(subjects: Subject[], name: string): string {
  return subjects.find((s) => s.name === name)?.color ?? "#94a3b8";
}
