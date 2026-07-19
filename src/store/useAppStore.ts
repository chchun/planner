import { create } from "zustand";
import { AuthError, NetworkError } from "../data/api";
import {
  clearSnapshot, enqueue, flushQueue, loadQueue, loadSnapshot, saveSnapshot,
  type SyncQueueItem,
} from "../data/offline";
import { hasSavedPassword } from "../data/rememberedAuth";
import { repo } from "../data/repository";
import type {
  BootstrapData, CalendarEvent, Memo, PlanItem, Subject, Tab, TimerState, TimetableBlock, Todo, User,
} from "../data/types";

type AppStatus = "loading" | "login" | "ready";

interface AppState {
  status: AppStatus;
  user: User | null;
  loginError: string | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  /** 오프라인 지원 (spec 003) */
  online: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  syncing: boolean;
  syncNow: () => Promise<void>;

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
  /** 서버 Blob 저장소 설정 여부 — false면 이미지 첨부 비활성 (spec 005 R-41) */
  blobEnabled: boolean;
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

const logErr = (err: unknown) => console.error("[api]", err);

export const useAppStore = create<AppState>((set, get) => {
  /** 현재 스토어 데이터를 스냅샷으로 저장 (디바운스) */
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const persistSnapshot = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const s = get();
      if (s.status !== "ready" || !s.user) return;
      const data: BootstrapData = {
        user: s.user,
        subjects: s.subjects,
        todos: s.todos,
        plan: s.plan,
        timetable: s.timetable,
        events: s.events,
        memos: s.memos,
        weekStats: s.weekStats,
        blobEnabled: s.blobEnabled,
      };
      void saveSnapshot(data).catch(logErr);
    }, 500);
  };

  const applyBootstrap = (data: BootstrapData) => {
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
      blobEnabled: data.blobEnabled ?? false,
      online: true,
      lastSyncAt: Date.now(),
    });
    persistSnapshot();
  };

  /** 큐 flush → 성공 시 서버 최신으로 재로드 */
  const sync = async () => {
    if (get().syncing) return;
    set({ syncing: true });
    try {
      const rest = await flushQueue();
      set({ pendingCount: rest.length });
      if (rest.length === 0) {
        applyBootstrap(await repo.bootstrap());
      }
    } catch (err) {
      if (err instanceof NetworkError) set({ online: false });
      else logErr(err);
    } finally {
      set({ syncing: false });
    }
  };

  /** 온라인이면 즉시 전송, 실패·오프라인이면 큐 저장 (plan 003 sendOrQueue) */
  const sendOrQueue = (
    directSend: () => Promise<unknown>,
    item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">,
  ) => {
    const doQueue = () =>
      enqueue(item)
        .then((q) => set({ pendingCount: q.length, online: false }))
        .catch(logErr);
    if (!get().online) {
      void doQueue();
      return;
    }
    directSend().catch((err) => {
      if (err instanceof NetworkError) void doQueue();
      else logErr(err);
    });
  };

  return {
    status: "loading",
    user: null,
    loginError: null,

    online: navigator.onLine,
    pendingCount: 0,
    lastSyncAt: null,
    syncing: false,
    syncNow: sync,

    initialize: async () => {
      window.addEventListener("online", () => {
        set({ online: true });
        void sync();
      });
      window.addEventListener("offline", () => set({ online: false }));
      if (navigator.storage?.persist) void navigator.storage.persist().catch(() => {});

      set({ pendingCount: (await loadQueue().catch(() => [])).length });
      try {
        const rest = await flushQueue();
        set({ pendingCount: rest.length });
        applyBootstrap(await repo.bootstrap());
      } catch (err) {
        if (err instanceof AuthError) {
          // 세션 만료 — 캐시 폐기 후 로그인 화면 (spec R-21)
          await clearSnapshot().catch(logErr);
          set({ status: "login" });
        } else if (err instanceof NetworkError) {
          const snap = await loadSnapshot().catch(() => undefined);
          if (snap) {
            set({
              status: "ready",
              user: snap.data.user,
              subjects: snap.data.subjects,
              todos: snap.data.todos,
              plan: snap.data.plan,
              timetable: snap.data.timetable,
              events: snap.data.events,
              memos: snap.data.memos,
              weekStats: snap.data.weekStats,
              blobEnabled: snap.data.blobEnabled ?? false,
              online: false,
              lastSyncAt: snap.savedAt,
            });
          } else {
            set({ status: "login", online: false, loginError: "오프라인 상태입니다 — 네트워크 연결 후 이용할 수 있어요" });
          }
        } else {
          logErr(err);
          set({ status: "login", loginError: "서버에 연결할 수 없습니다" });
        }
      }
    },

    login: async (username, password) => {
      try {
        set({ loginError: null });
        await repo.login(username, password);
        applyBootstrap(await repo.bootstrap());
      } catch (err) {
        if (err instanceof NetworkError) set({ loginError: "오프라인 상태입니다 — 네트워크 연결 후 로그인할 수 있어요", online: false });
        else set({ loginError: err instanceof Error ? err.message : "로그인 실패" });
      }
    },

    logout: async () => {
      await repo.logout().catch(logErr);
      await clearSnapshot().catch(logErr);
      set({ status: "login", user: null, timer: { runningSubject: null, startedAt: null } });
    },

    // 자격증명 저장 사용자는 앱 진입 시 메모 화면부터 (세션 자동복원·자동 로그인 양쪽 일관)
    activeTab: hasSavedPassword() ? "memo" : "dashboard",
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
      // 세션 확정 저장 — 오프라인이면 큐에 보관 (append-only, spec R-22)
      if (timer.runningSubject && timer.startedAt != null && elapsed > 0) {
        const payload = {
          subject: timer.runningSubject,
          startedAt: new Date(timer.startedAt).toISOString(),
          endedAt: new Date().toISOString(),
        };
        sendOrQueue(
          () => repo.postTimerSession(payload.subject, payload.startedAt, payload.endedAt),
          { entityType: "timer", entityId: payload.startedAt, operation: "create", payload },
        );
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
      persistSnapshot();
    },

    toggleTodo: (id) => {
      const t = get().todos.find((x) => x.id === id);
      if (!t) return;
      const done = !t.done;
      set((s) => ({ todos: s.todos.map((x) => (x.id === id ? { ...x, done } : x)) }));
      persistSnapshot();
      sendOrQueue(() => repo.setTodoDone(id, done), {
        entityType: "todo", entityId: id, operation: "toggle", payload: { done },
      });
    },
    toggleTodoOpen: (id) =>
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, subOpen: !t.subOpen } : t)) })),
    toggleSubtask: (todoId, subId) => {
      const t = get().todos.find((x) => x.id === todoId);
      const sub = t?.subs.find((x) => x.id === subId);
      if (!t || !sub) return;
      const done = !sub.done;
      set((s) => ({
        todos: s.todos.map((x) =>
          x.id === todoId
            ? { ...x, subs: x.subs.map((y) => (y.id === subId ? { ...y, done } : y)) }
            : x,
        ),
      }));
      persistSnapshot();
      sendOrQueue(() => repo.setSubtaskDone(todoId, subId, done), {
        entityType: "subtask", entityId: subId, operation: "toggle", payload: { todoId, done },
      });
    },
    createTodo: async (input) => {
      // 신규 생성은 온라인 전용 (spec 003 범위) — 오프라인이면 호출측에서 비활성
      const created = await repo.createTodo(input);
      const todo: Todo = {
        id: created.id, title: input.title, prio: "mid", source: input.source,
        done: false, dueAt: input.dueAt, subOpen: false, subs: created.subs,
      };
      set((s) => ({ todos: [todo, ...s.todos] }));
      persistSnapshot();
    },
    togglePlan: (id) => {
      const p = get().plan.find((x) => x.id === id);
      if (!p) return;
      const done = !p.done;
      set((s) => ({ plan: s.plan.map((x) => (x.id === id ? { ...x, done } : x)) }));
      persistSnapshot();
      sendOrQueue(() => repo.setPlanDone(id, done), {
        entityType: "plan", entityId: id, operation: "toggle", payload: { done },
      });
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
    blobEnabled: false,
    memoView: "card",
    setMemoView: (v) => set({ memoView: v }),
    currentFolder: "전체",
    setCurrentFolder: (f) => set({ currentFolder: f }),
    createMemo: async (input) => {
      // 신규 생성은 온라인 전용 (spec 003 범위)
      const { id } = await repo.createMemo(input);
      set((s) => ({ memos: [{ id, ...input, done: false }, ...s.memos] }));
      persistSnapshot();
    },
    toggleMemoDone: (id) => {
      const m = get().memos.find((x) => x.id === id);
      if (!m) return;
      set((s) => ({ memos: s.memos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
      persistSnapshot();
      repo.setMemoDone(id, !m.done).catch(logErr);
    },
    deleteMemo: (id) => {
      set((s) => ({ memos: s.memos.filter((m) => m.id !== id) }));
      persistSnapshot();
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
