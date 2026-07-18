import { getToday, currentWeekDays } from "../../lib/date";
import { pad2 } from "../../lib/time";
import type { DayEvent } from "../../data/types";
import { useAppStore } from "../../store/useAppStore";
import { MonthGrid } from "./MonthGrid";
import { WeekGrid } from "./WeekGrid";
import { DayDetailPanel, DayBottomSheet } from "./DayDetail";

function FilterChip({
  on,
  dotColor,
  label,
  onClick,
}: {
  on: boolean;
  dotColor: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-chip border-[1.5px] px-3 py-2 text-xs font-bold lg:flex-none ${
        on ? "border-indigo-200 bg-brand-soft text-indigo-700" : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
      {label}
    </button>
  );
}

export function Calendar() {
  const calMode = useAppStore((s) => s.calMode);
  const setCalMode = useAppStore((s) => s.setCalMode);
  const filterSched = useAppStore((s) => s.filterSched);
  const filterHw = useAppStore((s) => s.filterHw);
  const toggleFilterSched = useAppStore((s) => s.toggleFilterSched);
  const toggleFilterHw = useAppStore((s) => s.toggleFilterHw);
  const rawEvents = useAppStore((s) => s.events);

  // 서버 이벤트(TIMESTAMPTZ) → 이번 달 일(day) 기준 맵으로 변환
  const today = getToday();
  const events: Record<number, DayEvent[]> = {};
  for (const e of rawEvents) {
    const d = new Date(e.startAt);
    if (d.getFullYear() !== today.year || d.getMonth() + 1 !== today.month) continue;
    const day = d.getDate();
    (events[day] ??= []).push({
      time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
      title: e.title,
      type: e.type,
    });
  }
  for (const list of Object.values(events)) list.sort((a, b) => a.time.localeCompare(b.time));

  const week = currentWeekDays();
  const rangeLabel =
    calMode === "month"
      ? `${today.year}년 ${today.month}월`
      : `${today.month}월 ${week[0]}일 - ${week[week.length - 1]}일`;

  return (
    <div
      className={`flex flex-col gap-4 lg:grid lg:items-start lg:gap-[18px] ${
        calMode === "month" ? "lg:grid-cols-[1.6fr_1fr]" : "lg:grid-cols-1"
      }`}
    >
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-lg font-extrabold text-slate-900 lg:text-[19px]">{rangeLabel}</div>
            <div className="flex rounded-[9px] bg-slate-100 p-[3px]">
              {(["month", "week"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCalMode(m)}
                  className={`rounded-[7px] px-3.5 py-[5px] text-xs font-bold ${
                    calMode === m ? "bg-white text-brand" : "text-slate-400"
                  }`}
                >
                  {m === "month" ? "월" : "주"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full gap-2 lg:w-auto">
            <FilterChip
              on={filterSched}
              dotColor="#3b82f6"
              label="학교/학원 일정"
              onClick={toggleFilterSched}
            />
            <FilterChip on={filterHw} dotColor="#f97316" label="숙제 마감일" onClick={toggleFilterHw} />
          </div>
        </div>

        {calMode === "month" ? (
          <MonthGrid events={events} filterSched={filterSched} filterHw={filterHw} />
        ) : (
          <WeekGrid events={events} filterSched={filterSched} filterHw={filterHw} />
        )}
      </section>

      {/* 상세 패널/바텀시트는 월간 뷰 전용 — 주간 뷰는 칸에 세부를 직접 표시 (SPEC §3) */}
      {calMode === "month" && (
        <>
          <div className="hidden lg:block">
            <DayDetailPanel events={events} />
          </div>
          <DayBottomSheet events={events} />
        </>
      )}
    </div>
  );
}
