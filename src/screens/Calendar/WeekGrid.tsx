import type { DayEvent } from "../../data/types";
import { currentWeekDays, dayOfWeek, getToday, WEEKDAY_LABELS } from "../../lib/date";

const EVENT_COLOR: Record<DayEvent["type"], string> = {
  sched: "#3b82f6",
  hw: "#f97316",
};

/**
 * 주간 뷰 — 풀스크린. 각 날짜 칸에 일정 세부(제목·시간)를 직접 표시한다.
 * iPad·PC: 7열 그리드 / 모바일: 세로 스택 카드 (목업 기준)
 */
export function WeekGrid({
  events,
  filterSched,
  filterHw,
}: {
  events: Record<number, DayEvent[]>;
  filterSched: boolean;
  filterHw: boolean;
}) {
  const days = currentWeekDays().map((n) => {
    const dow = dayOfWeek(n);
    const items = (events[n] ?? []).filter(
      (e) => (e.type === "sched" && filterSched) || (e.type === "hw" && filterHw),
    );
    return { n, dow, items, isToday: n === getToday().day };
  });

  return (
    <>
      {/* iPad·PC: 7열 그리드 */}
      <div className="hidden grid-cols-7 gap-1.5 lg:grid">
        {days.map(({ n, dow, items, isToday }) => (
          <div
            key={n}
            className="min-h-[420px] rounded-xl border-[1.5px] p-2"
            style={{
              background: isToday ? "#eef2ff" : "#f8fafc",
              borderColor: isToday ? "#c7d2fe" : "#f1f5f9",
            }}
          >
            <div className="mb-2.5 text-center">
              <div
                className="text-[11px] font-bold"
                style={{ color: dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#94a3b8" }}
              >
                {WEEKDAY_LABELS[dow]}
              </div>
              <div
                className="text-[17px] font-extrabold"
                style={{ color: isToday ? "#4f46e5" : "#0f172a" }}
              >
                {n}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((it, i) => {
                const c = EVENT_COLOR[it.type];
                return (
                  <div
                    key={i}
                    className="rounded-[7px] px-[7px] py-1.5"
                    style={{ background: `${c}1a`, borderLeft: `3px solid ${c}` }}
                  >
                    <div className="text-[10px] font-extrabold" style={{ color: c }}>
                      {it.time}
                    </div>
                    <div className="text-[11px] font-semibold leading-tight text-slate-700">
                      {it.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 모바일: 세로 스택 카드 */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        {days.map(({ n, dow, items, isToday }) => (
          <div
            key={n}
            className="rounded-[14px] border border-slate-100 bg-white px-3.5 py-3 shadow-card"
            style={{ borderLeft: `4px solid ${isToday ? "#4f46e5" : "#e2e8f0"}` }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="text-[15px] font-extrabold"
                style={{ color: isToday ? "#4f46e5" : "#0f172a" }}
              >
                {n}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#94a3b8" }}
              >
                {WEEKDAY_LABELS[dow]}요일
              </span>
              <span className="ml-auto text-[11px] font-bold text-slate-400">{items.length}건</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((it, i) => {
                const c = EVENT_COLOR[it.type];
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-[42px] shrink-0 text-xs font-extrabold" style={{ color: c }}>
                      {it.time}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-700">{it.title}</span>
                    <span className="ml-auto text-[11px] font-bold" style={{ color: c }}>
                      {it.type === "hw" ? "숙제 마감" : "일정"}
                    </span>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="text-xs font-semibold text-slate-300">일정 없음</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
