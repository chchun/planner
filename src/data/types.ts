export type Tab = "dashboard" | "planner" | "timer" | "calendar" | "memo";

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
  title: string;
  done: boolean;
}

export interface Todo {
  id: number;
  title: string;
  prio: Priority;
  source: string;
  done: boolean;
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
  time: string;
  title: string;
  type: EventType;
}

export interface Memo {
  id: number;
  folder: string;
  color: string;
  text: string;
  /** dataURL — 이미지가 있을 때만 */
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
  /** Date.now() 기준 시작 시각 — 실행 중일 때만 존재 */
  startedAt: number | null;
}
