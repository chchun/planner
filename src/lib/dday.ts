// 납기(due_at) → D-Day 배지·이월 라벨 파생 (spec 002 R-13, 배지 규칙은 docs/SPEC.md §2)
import type { TimelineItem, Todo, OverdueItem, UrgencyKind } from "../data/types";

const DAY_MS = 86400_000;
const pad2 = (n: number) => String(n).padStart(2, "0");

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 마감 임박 항목 — 미완료 + 납기 미래, 임박순 */
export function deriveTimeline(todos: Todo[], now: Date = new Date()): TimelineItem[] {
  return todos
    .filter((t) => !t.done && t.dueAt && new Date(t.dueAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .map((t) => {
      const due = new Date(t.dueAt!);
      const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS);
      const hoursLeft = (due.getTime() - now.getTime()) / 3600_000;
      let badge: string;
      let kind: UrgencyKind;
      let time: string;
      if (dayDiff <= 0) {
        badge = hoursLeft <= 6 ? `${Math.max(1, Math.floor(hoursLeft))}시간` : "D-DAY";
        kind = "red";
        time = hoursLeft <= 6 ? `${Math.max(1, Math.floor(hoursLeft))}시간 남음` : `오늘 ${pad2(due.getHours())}:${pad2(due.getMinutes())}`;
      } else if (dayDiff <= 2) {
        badge = `D-${dayDiff}`;
        kind = "amber";
        time = dayDiff === 1 ? "내일" : `${due.getMonth() + 1}/${due.getDate()}`;
      } else {
        badge = `D-${dayDiff}`;
        kind = "green";
        time = `${due.getMonth() + 1}/${due.getDate()}`;
      }
      return { title: t.title, source: t.source, time, badge, kind };
    });
}

/** 이월 숙제 — 미완료 + 납기 과거 */
export function deriveOverdue(todos: Todo[], now: Date = new Date()): OverdueItem[] {
  return todos
    .filter((t) => !t.done && t.dueAt && new Date(t.dueAt).getTime() < now.getTime())
    .sort((a, b) => new Date(b.dueAt!).getTime() - new Date(a.dueAt!).getTime())
    .map((t) => {
      const due = new Date(t.dueAt!);
      const dayDiff = Math.round((startOfDay(now) - startOfDay(due)) / DAY_MS);
      const ago =
        dayDiff === 0
          ? `${Math.max(1, Math.floor((now.getTime() - due.getTime()) / 3600_000))}시간 전 마감`
          : dayDiff === 1
            ? "어제 마감"
            : `${dayDiff}일 전 마감`;
      return { title: t.title, ago };
    });
}
