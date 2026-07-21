import type { DayEvent } from "../../data/types";
import { dayOfWeek, getToday, WEEKDAY_LABELS } from "../../lib/date";

/**
 * 일정(아젠다) 뷰 — 구글 캘린더식 리스트 (spec 007 R-73).
 * 이번 달 일정이 있는 날짜를 위→아래로 나열. 지난 날짜는 흐리게, 오늘은 파란 원 + 구분선.
 */
export function AgendaList({
  events,
  filterSched,
  filterHw,
}: {
  events: Record<number, DayEvent[]>;
  filterSched: boolean;
  filterHw: boolean;
}) {
  const today = getToday();

  const days = Object.keys(events)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => ({
      n,
      items: (events[n] ?? []).filter(
        (e) => (e.type === "sched" && filterSched) || (e.type === "hw" && filterHw),
      ),
    }))
    .filter((d) => d.items.length > 0);

  if (days.length === 0) {
    return (
      <div className="py-14 text-center text-[13px] font-semibold text-slate-400">
        이번 달에 표시할 일정이 없어요
      </div>
    );
  }

  return (
    <div>
      {days.map(({ n, items }) => {
        const isToday = n === today.day;
        const isPast = n < today.day;
        return (
          <div
            key={n}
            className={`flex gap-3 border-t py-3 first:border-t-0 lg:gap-5 ${
              isToday ? "border-t-2 border-red-400" : "border-slate-100"
            }`}
            style={{ opacity: isPast ? 0.45 : 1 }}
          >
            {/* 날짜 캡슐 */}
            <div className="flex w-[72px] shrink-0 items-start gap-2 pt-0.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold ${
                  isToday ? "bg-brand text-white" : "text-slate-900"
                }`}
              >
                {n}
              </span>
              <span className="pt-1.5 text-[11px] font-bold text-slate-400">
                {today.month}월, {WEEKDAY_LABELS[dayOfWeek(n)]}
              </span>
            </div>

            {/* 그 날의 일정들 */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
              {items.map((e, i) => (
                <div key={i} className="flex items-center gap-3 lg:gap-4">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: e.color }}
                  />
                  <span className="w-[100px] shrink-0 text-xs font-bold text-slate-500 lg:w-[120px] lg:text-[13px]">
                    {e.time}
                    {e.endTime ? `~${e.endTime}` : ""}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-slate-800 lg:text-sm">
                    {e.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
