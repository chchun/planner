import { weekPastHours, WEEK_TODAY_INDEX } from "../../data/mock";
import { fmtHM } from "../../lib/time";
import type { Subject } from "../../data/types";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MAX_BAR_PX = 120;

export function WeeklyBarChart({
  subjects,
  totalTodaySec,
}: {
  subjects: Subject[];
  totalTodaySec: number;
}) {
  const todayH = totalTodaySec / 3600;
  const hours = DAY_LABELS.map((_, i) => {
    if (i === WEEK_TODAY_INDEX) return todayH;
    return weekPastHours[i] ?? 0;
  });
  const maxH = Math.max(4, ...hours);
  const weekTotalSec = subjects.reduce((a, s) => a + s.weekSec, 0);

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-4 flex items-center justify-between lg:mb-[18px]">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">📊 주간 공부량</div>
        <div className="text-xs font-bold text-brand lg:text-[13px]">
          주 합계 {fmtHM(weekTotalSec)}
        </div>
      </div>
      <div className="flex h-[120px] items-end justify-between gap-1.5 lg:h-[150px] lg:gap-2.5">
        {hours.map((v, i) => {
          const isToday = i === WEEK_TODAY_INDEX;
          const labelColor = isToday ? "#4f46e5" : "#94a3b8";
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5 lg:gap-2">
              <div className="text-[10px] font-extrabold lg:text-[11px]" style={{ color: labelColor }}>
                {v > 0 ? `${Math.round(v * 10) / 10}h` : ""}
              </div>
              <div
                className="w-full max-w-[22px] rounded-t-lg rounded-b-[3px] lg:max-w-[30px]"
                style={{
                  height: Math.max(4, (v / maxH) * MAX_BAR_PX),
                  background: isToday ? "#4f46e5" : "#c7d2fe",
                }}
              />
              <div className="text-[11px] font-bold lg:text-xs" style={{ color: labelColor }}>
                {DAY_LABELS[i]}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
