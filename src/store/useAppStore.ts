import { create } from "zustand";
import { AuthError } from "../data/api";
import { repo } from "../data/repository";
import type {
  CalendarEvent, Memo, PlanItem, Subject, Tab, TimerState, TimetableBlock, Todo, User,
} from "../data/types";

type AppStatus = "loading" | "login" | "ready";

interface AppState {
  status: AppStatus;
  user: User | null;
  loginError: string | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  activeTab: Tab;
  setTab: (tab: Tab) => void;

  subjects: Subject[];
  todos: Todo[];
  plan: PlanItem[];
  timetable: TimetableBlock[];
  events: CalendarEvent[];
  weekStats: number[];

  timer: TimerState;
  toggleTimer: (name: string) => void;

  toggleTodo: (id: string) => void;
  toggleTodoOpen: (id: string) => void;
  toggleSubtask: (todoId: string, subId: string) => void;
  createTodo: (input: { title: string; source: string; dueAt: string | null; subs: string[] }) => Promise<void>;
  togglePlan: (id: string) => void;

  calMode: "month" | "week";
  setCalMode: (m: "month" | "week") => void;
  filterSched: boolean;
  filterHw: boolean;
  toggleFilterSched: () => void;
  toggleFilterHw: () => void;
  selectedDate: number | null;
  setSelectedDate: (d: number | null) => void;

  memos: Memo[];
  memoView: "card" | "list";
  setMemoView: (v: "card" | "list") => void;
  currentFolder: string;
  setCurrentFolder: (f: string) => void;
  createMemo: (input: { folder: string; color: string; text: string; image: string | null }) => Promise<void>;
  toggleMemoDone: (id: string) => void;
  deleteMemo: (id: string) => void;

  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export function runningElapsedSec(timer: TimerState, now: number = Date.now()): number {
  if (!timer.runningSubject || timer.startedAt == null) return 0;
  return Math.max(0, Math.floor((now - timer.startedAt) / 1000));
}

/** 서버 오류는 콘솔에만 — 온라인 전용(spec 002 비기능), 낙관적 업데이트 유지 */
const logErr = (err: unknown) => console.error("[api]", err);

export const useAppStore = create<AppState>((set, get) => {
  const loadBootstrap = async () => {
    const data = await repo.bootstrap();
    set({
      status: "ready",
      user: data.user,
      subjects: data.subjects,
      todos: data.todos,
      plan: data.plan,
      timetable: data.timetable,
      events: data.events,
      memos: data.memos,
      weekStats: data.weekStats,
    });
  };

  return {
    status: "loading",
    user: null,
    loginError: null,

    initialize: async () => {
      try {
        await loadBootstrap();
      } catch (err) {
        if (err instanceof AuthError) set({ status: "login" });
        else {
          logErr(err);
          set({ status: "login", loginError: "서버에 연결할 수 없습니다" });
        }
      }
    },

    login: async (username, password) => {
      try {
        set({ loginError: null });
        await repo.login(username, password);
        await loadBootstrap();
      } catch (err) {
        set({ loginError: err instanceof Error ? err.message : "로그인 실패" });
      }
    },

    logout: async () => {
      await repo.logout().catch(logErr);
      set({ status: "login", user: null, timer: { runningSubject: null, startedAt: null } });
    },

    activeTab: "dashboard",
    setTab: (tab) => set({ activeTab: tab }),

    subjects: [],
    todos: [],
    plan: [],
    timetable: [],
    events: [],
    weekStats: [0, 0, 0, 0, 0, 0, 0],

    timer: { runningSubject: null, startedAt: null },
    toggleTimer: (name) => {
      const { timer, subjects } = get();
      const elapsed = runningElapsedSec(timer);
      // 실행 중이던 세션을 서버에 확정 저장 (append-only, spec 002 R-14)
      if (timer.runningSubject && timer.startedAt != null && elapsed > 0) {
        repo
          .postTimerSession(
            timer.runningSubject,
            new Date(timer.startedAt).toISOString(),
            new Date().toISOString(),
          )
          .catch(logErr);
      }
      const committed = timer.runningSubject
        ? subjects.map((s) =>
            s.name === timer.runningSubject
              ? { ...s, todaySec: s.todaySec + elapsed, weekSec: s.weekSec + elapsed }
              : s,
          )
        : subjects;
      if (timer.runningSubject === name) {
        set({ subjects: committed, timer: { runningSubject: null, startedAt: null } });
      } else {
        set({ subjects: committed, timer: { runningSubject: name, startedAt: Date.now() } });
      }
    },

    toggleTodo: (id) => {
      const t = get().todos.find((x) => x.id === id);
      if (!t) return;
      set((s) => ({ todos: s.todos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
      repo.setTodoDone(id, !t.done).catch(logErr);
    },
    toggleTodoOpen: (id) =>
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, subOpen: !t.subOpen } : t)) })),
    toggleSubtask: (todoId, subId) => {
      const t = get().todos.find((x) => x.id === todoId);
      const sub = t?.subs.find((x) => x.id === subId);
      if (!t || !sub) return;
      set((s) => ({
        todos: s.todos.map((x) =>
          x.id === todoId
            ? { ...x, subs: x.subs.map((y) => (y.id === subId ? { ...y, done: !y.done } : y)) }
            : x,
        ),
      }));
      repo.setSubtaskDone(todoId, subId, !sub.done).catch(logErr);
    },
    createTodo: async (input) => {
      const created = await repo.createTodo(input);
      const todo: Todo = {
        id: created.id,
        title: input.title,
        prio: "mid",
        source: input.source,
        done: false,
        dueAt: input.dueAt,
        subOpen: false,
        subs: created.subs,
      };
      set((s) => ({ todos: [todo, ...s.todos] }));
    },
    togglePlan: (id) => {
      const p = get().plan.find((x) => x.id === id);
      if (!p) return;
      set((s) => ({ plan: s.plan.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
      repo.setPlanDone(id, !p.done).catch(logErr);
    },

    calMode: "month",
    setCalMode: (m) => set({ calMode: m }),
    filterSched: true,
    filterHw: true,
    toggleFilterSched: () => set((s) => ({ filterSched: !s.filterSched })),
    toggleFilterHw: () => set((s) => ({ filterHw: !s.filterHw })),
    selectedDate: null,
    setSelectedDate: (d) => set({ selectedDate: d }),

    memos: [],
    memoView: "card",
    setMemoView: (v) => set({ memoView: v }),
    currentFolder: "전체",
    setCurrentFolder: (f) => set({ currentFolder: f }),
    createMemo: async (input) => {
      const { id } = await repo.createMemo(input);
      set((s) => ({ memos: [{ id, ...input, done: false }, ...s.memos] }));
    },
    toggleMemoDone: (id) => {
      const m = get().memos.find((x) => x.id === id);
      if (!m) return;
      set((s) => ({ memos: s.memos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
      repo.setMemoDone(id, !m.done).catch(logErr);
    },
    deleteMemo: (id) => {
      set((s) => ({ memos: s.memos.filter((m) => m.id !== id) }));
      repo.deleteMemo(id).catch(logErr);
    },

    modalOpen: false,
    openModal: () => set({ modalOpen: true }),
    closeModal: () => set({ modalOpen: false }),
  };
});

export function subjectColor(subjects: Subject[], name: string): string {
  return subjects.find((s) => s.name === name)?.color ?? "#94a3b8";
}
