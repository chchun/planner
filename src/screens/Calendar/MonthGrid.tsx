import { MOCK_TODAY } from "../../data/mock";
import type { CalendarEvent } from "../../data/types";
import { dayOfWeek, monthGridCells, WEEKDAY_LABELS } from "../../lib/date";
import { useAppStore } from "../../store/useAppStore";

export function MonthGrid({
  events,
  filterSched,
  filterHw,
}: {
  events: Record<number, CalendarEvent[]>;
  filterSched: boolean;
  filterHw: boolean;
}) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const cells = monthGridCells();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7">
        {WEEKDAY_LABELS.map((l, i) => (
          <div
            key={l}
            className="text-center text-[11px] font-bold lg:text-xs"
            style={{ color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#94a3b8" }}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 lg:gap-1">
        {cells.map((n, idx) => {
          if (n == null) return <div key={`e${idx}`} />;
          const evs = events[n] ?? [];
          const hasSched = filterSched && evs.some((e) => e.type === "sched");
          const hasHw = filterHw && evs.some((e) => e.type === "hw");
          const isToday = n === MOCK_TODAY.day;
          const isSel = selectedDate === n;
          const dow = dayOfWeek(n);
          let color = "#334155";
          if (dow === 0) color = "#ef4444";
          else if (dow === 6) color = "#3b82f6";
          if (isSel || isToday) color = "#4f46e5";

          return (
            <button
              key={n}
              onClick={() => setSelectedDate(n)}
              className="flex aspect-square flex-col items-center justify-center gap-[3px] rounded-[10px] lg:aspect-auto lg:min-h-[74px] lg:items-start lg:justify-start lg:rounded-xl lg:border-[1.5px] lg:p-2"
              style={{
                background: isSel ? "#eef2ff" : isToday ? "#f8fafc" : undefined,
                borderColor: isSel ? "#4f46e5" : "#f1f5f9",
              }}
            >
              <span
                className="text-[13px] lg:text-sm"
                style={{ color, fontWeight: isToday || isSel ? 800 : 500 }}
              >
                {n}
              </span>
              <span className="flex h-[5px] gap-[3px] lg:mt-auto lg:h-auto lg:gap-1">
                {hasSched && (
                  <span className="h-[5px] w-[5px] rounded-full bg-dot-sched lg:h-[7px] lg:w-[7px]" />
                )}
                {hasHw && (
                  <span className="h-[5px] w-[5px] rounded-full bg-dot-hw lg:h-[7px] lg:w-[7px]" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
