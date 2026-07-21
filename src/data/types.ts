export type Tab = "dashboard" | "planner" | "timer" | "calendar" | "memo";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: "student" | "parent";
  gradeLabel: string;
}

export interface Subject {
  name: string;
  color: string;
  /** 확정된 오늘 누적 공부시간(초) — 실행 중 타이머의 경과분은 포함하지 않는다 */
  todaySec: number;
  /** 확정된 이번 주 누적 공부시간(초) */
  weekSec: number;
}

export type Priority = "high" | "mid" | "low";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Todo {
  id: string;
  title: string;
  prio: Priority;
  source: string;
  done: boolean;
  /** ISO — 납기. 마감 임박/이월 위젯이 여기서 파생된다 (spec 002 R-13) */
  dueAt: string | null;
  subOpen: boolean;
  subs: Subtask[];
}

export interface OverdueItem {
  title: string;
  ago: string;
}

export type UrgencyKind = "red" | "amber" | "green";

export interface TimelineItem {
  title: string;
  source: string;
  time: string;
  badge: string;
  kind: UrgencyKind;
}

export interface PlanItem {
  id: string;
  subject: string;
  /** 목표 시간(분) */
  goal: number;
  done: boolean;
  memo: string;
}

export interface TimetableBlock {
  subject: string;
  /** 시(24h), 소수는 분 (예: 14.5 = 14:30) */
  start: number;
  end: number;
}

export type EventType = "sched" | "hw";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  /** ISO */
  startAt: string;
  /** ISO — 종료. 마감형 이벤트는 null (spec 007) */
  endAt?: string | null;
  /** 출처 — local | google-family | google-student (spec 004) */
  source?: string;
}

/** 캘린더 화면용 — 일(day) 기준으로 정리된 이벤트. 색·분(min) 값은 index에서 미리 계산 (spec 007) */
export interface DayEvent {
  time: string;
  /** "HH:MM" — 종료 없으면 null */
  endTime: string | null;
  /** 자정 기준 시작 분 — 주간 타임그리드 배치용 */
  startMin: number;
  /** 자정 기준 종료 분 — 없으면 null(기본 1시간 블록) */
  endMin: number | null;
  title: string;
  type: EventType;
  /** 출처·종류별 표시 색 (R-74) */
  color: string;
}

export interface Memo {
  id: string;
  folder: string;
  color: string;
  text: string;
  image: string | null;
  done: boolean;
}

export interface NotifSettings {
  prev: boolean;
  morning: boolean;
  twoHr: boolean;
}

export interface RegisterFormValues {
  title: string;
  tag: string | null;
  due: string;
  notif: NotifSettings;
  subs: string[];
}

/** 타이머는 interval 카운트가 아니라 시작 시각 기반으로 계산한다 (constitution §4) */
export interface TimerState {
  runningSubject: string | null;
  startedAt: number | null;
}

export interface BootstrapData {
  user: User;
  subjects: Subject[];
  todos: Todo[];
  plan: PlanItem[];
  timetable: TimetableBlock[];
  events: CalendarEvent[];
  memos: Memo[];
  /** 월~일 초 단위 타이머 집계 */
  weekStats: number[];
  /** 과목명 → 월~일(길이 7) 초 단위 집계 — 주간 그래프 과목별 표시·테이블 */
  weekBySubject: Record<string, number[]>;
  /** 서버에 Blob 저장소가 설정됐는지 — false면 이미지 첨부 비활성 (spec 005 R-41) */
  blobEnabled: boolean;
}
