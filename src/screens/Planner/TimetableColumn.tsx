import { fmtHourFloat, pad2 } from "../../lib/time";
import type { Subject, TimetableBlock } from "../../data/types";
import { subjectColor } from "../../store/useAppStore";

/** 06:00~24:00 타임라인 — 1시간 = 34px (목업 기준) */
const HOUR_PX = 34;
const START_HOUR = 6;
const END_HOUR = 24;

export function TimetableColumn({
  blocks,
  subjects,
}: {
  blocks: TimetableBlock[];
  subjects: Subject[];
}) {
  const hourMarks = [];
  for (let h = START_HOUR; h <= END_HOUR; h += 2) hourMarks.push(h);

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">🕒 오늘의 시간표</div>
        <div className="hidden text-xs font-bold text-slate-400 lg:block">계획된 공부 블록</div>
      </div>
      <div
        className="relative pl-11"
        style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}
      >
        {hourMarks.map((h) => (
          <div
            key={h}
            className="absolute left-0 w-full border-t border-slate-100"
            style={{ top: (h - START_HOUR) * HOUR_PX }}
          >
            <span className="absolute left-0 top-[-8px] text-[11px] font-bold text-slate-300">
              {pad2(h % 24)}:00
            </span>
          </div>
        ))}
        <div className="absolute inset-y-0 left-11 right-0">
          {blocks.map((b, i) => {
            const color = subjectColor(subjects, b.subject);
            return (
              <div
                key={i}
                className="absolute left-1 right-1 overflow-hidden rounded-lg px-2.5 py-1.5"
                style={{
                  top: (b.start - START_HOUR) * HOUR_PX,
                  height: (b.end - b.start) * HOUR_PX - 4,
                  background: `${color}1a`,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="text-xs font-extrabold" style={{ color }}>
                  {b.subject}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {fmtHourFloat(b.start)} - {fmtHourFloat(b.end)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
