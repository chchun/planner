import type { ReactNode } from "react";
import { headerDateLabel } from "../lib/date";
import type { Tab } from "../data/types";
import { useAppStore } from "../store/useAppStore";
import {
  CalendarIcon,
  HomeIcon,
  LogoIcon,
  MemoIcon,
  PlannerIcon,
  PlusIcon,
  TimerIcon,
} from "../components/icons";

const PAD_TITLES: Record<Tab, string> = {
  dashboard: "오늘의 학습 현황",
  planner: "오늘의 플래너",
  timer: "공부 타이머",
  calendar: "캘린더",
  memo: "메모 보드",
};

const PHONE_TITLES: Record<Tab, string> = {
  dashboard: "안녕, 민준아 👋",
  planner: "스터디 플래너",
  timer: "공부 타이머",
  calendar: "캘린더",
  memo: "메모 보드",
};

interface NavDef {
  tab: Tab;
  label: string;
  icon: (props: { size?: number }) => ReactNode;
}

const NAV_ITEMS: NavDef[] = [
  { tab: "dashboard", label: "대시보드", icon: HomeIcon },
  { tab: "planner", label: "플래너", icon: PlannerIcon },
  { tab: "timer", label: "타이머", icon: TimerIcon },
  { tab: "calendar", label: "캘린더", icon: CalendarIcon },
  { tab: "memo", label: "메모", icon: MemoIcon },
];

/** 모바일 탭바 순서 (목업: 홈 / 캘린더 / 플래너 / 타이머 / 메모) */
const PHONE_NAV_ORDER: Tab[] = ["dashboard", "calendar", "planner", "timer", "memo"];

function Sidebar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setTab);
  const timerRunning = useAppStore((s) => s.timer.runningSubject != null);
  const memoCount = useAppStore((s) => s.memos.length);
  const openModal = useAppStore((s) => s.openModal);

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col bg-white border-r border-slate-100 px-[18px] py-[26px]">
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-indigo-500 to-brand">
          <LogoIcon size={20} />
        </div>
        <div className="text-[17px] font-extrabold tracking-tight text-slate-900">학습 플래너</div>
      </div>

      {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`mb-1 flex min-h-[44px] items-center gap-[11px] rounded-xl px-3.5 py-3 text-[15px] font-bold ${
              active ? "bg-brand-soft text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
            {tab === "timer" && timerRunning && (
              <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-red-500" />
            )}
            {tab === "memo" && (
              <span className="ml-auto text-xs font-extrabold text-slate-400">{memoCount}</span>
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        onClick={openModal}
        className="mb-4 flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-brand p-3.5 text-sm font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(79,70,229,0.6)] hover:bg-brand-hover"
      >
        <PlusIcon size={18} />
        <span>새 숙제 등록</span>
      </button>
      <UserProfileRow />
    </aside>
  );
}

function UserProfileRow() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  if (!user) return null;
  return (
    <div className="flex items-center gap-2.5 p-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-brand text-[15px] font-extrabold text-white">
        {user.displayName.slice(-2, -1) || user.displayName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-800">{user.displayName}</div>
        <div className="truncate text-xs font-semibold text-slate-400">{user.gradeLabel}</div>
      </div>
      <button
        onClick={() => void logout()}
        className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      >
        로그아웃
      </button>
    </div>
  );
}

function MobileTabBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setTab);
  const byTab = new Map(NAV_ITEMS.map((n) => [n.tab, n]));
  const labels: Record<Tab, string> = {
    dashboard: "홈",
    calendar: "캘린더",
    planner: "플래너",
    timer: "타이머",
    memo: "메모",
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[78px] items-start border-t border-slate-100 bg-white/90 px-1 pt-3 backdrop-blur-xl lg:hidden">
      {PHONE_NAV_ORDER.map((tab) => {
        const { icon: Icon } = byTab.get(tab)!;
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`flex min-h-[44px] flex-1 flex-col items-center gap-[3px] ${
              active ? "text-brand" : "text-slate-300"
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold">{labels[tab]}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileHeader() {
  const activeTab = useAppStore((s) => s.activeTab);
  const openModal = useAppStore((s) => s.openModal);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-5 pb-3.5 pt-4 lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400">{headerDateLabel()}</div>
          <div className="mt-0.5 text-[21px] font-extrabold tracking-tight text-slate-900">
            {PHONE_TITLES[activeTab]}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openModal}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-brand-soft text-brand"
            aria-label="새 숙제 등록"
          >
            <PlusIcon size={20} />
          </button>
          <button
            onClick={() => {
              if (window.confirm("로그아웃할까요?")) void logout();
            }}
            aria-label="로그아웃"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-brand text-[15px] font-extrabold text-white"
          >
            {user ? user.displayName.slice(-2, -1) || user.displayName[0] : ""}
          </button>
        </div>
      </div>
    </header>
  );
}

function DesktopHeader() {
  const activeTab = useAppStore((s) => s.activeTab);
  return (
    <header className="hidden items-end justify-between px-8 pb-[18px] pt-[26px] lg:flex">
      <div>
        <div className="text-[13px] font-bold text-slate-400">{headerDateLabel()}</div>
        <div className="mt-[3px] text-[26px] font-extrabold tracking-tight text-slate-900">
          {PAD_TITLES[activeTab]}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <DesktopHeader />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-[100px] pt-4 lg:px-8 lg:pb-8 lg:pt-0">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
