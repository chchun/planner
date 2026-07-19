import { useState } from "react";
import { mondayIndexOfToday } from "../../lib/date";
import { fmtHM } from "../../lib/time";
import type { Subject } from "../../data/types";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MAX_BAR_PX = 120;

/** 초 → 소수점 1자리 시간 문자열 (예: 27000 → "7.5") */
const h1 = (sec: number) => (sec / 3600).toFixed(1);

export function WeeklyBarChart({
  subjects,
  weekBySubject,
}: {
  subjects: Subject[];
  weekBySubject: Record<string, number[]>;
}) {
  const [view, setView] = useState<"graph" | "table">("graph");
  const todayIdx = mondayIndexOfToday();

  // 과목×요일 매트릭스(초). 오늘 열은 실행 중 경과를 포함한 라이브 값(subjects.todaySec)으로 대체
  const rows = subjects.map((s) => {
    const days = (weekBySubject[s.name] ?? []).slice(0, 7);
    while (days.length < 7) days.push(0);
    days[todayIdx] = s.todaySec;
    return { name: s.name, color: s.color, days, total: days.reduce((a, b) => a + b, 0) };
  });
  const dayTotals = DAY_LABELS.map((_, d) => rows.reduce((a, r) => a + r.days[d], 0));
  const weekTotalSec = rows.reduce((a, r) => a + r.total, 0);
  const maxDayTotal = Math.max(1, ...dayTotals);

  const toggleBtn = (v: "graph" | "table", label: string) => (
    <button
      onClick={() => setView(v)}
      className={`min-h-[28px] rounded-md px-2.5 text-[11px] font-bold lg:text-xs ${
        view === v ? "bg-brand-soft text-brand" : "text-slate-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-2 lg:mb-[18px]">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">📊 주간 공부량</div>
        <div className="flex items-center gap-2">
          <div className="hidden text-xs font-bold text-brand sm:block lg:text-[13px]">
            주 합계 {fmtHM(weekTotalSec)}
          </div>
          <div className="flex rounded-chip border border-slate-200 bg-white p-[3px]">
            {toggleBtn("graph", "그래프")}
            {toggleBtn("table", "표")}
          </div>
        </div>
      </div>

      {view === "graph" ? (
        <>
          <div className="flex h-[120px] items-end justify-between gap-1.5 lg:h-[150px] lg:gap-2.5">
            {DAY_LABELS.map((label, d) => {
              const isToday = d === todayIdx;
              const total = dayTotals[d];
              const labelColor = isToday ? "#4f46e5" : "#94a3b8";
              return (
                <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5 lg:gap-2">
                  <div className="text-[10px] font-extrabold lg:text-[11px]" style={{ color: labelColor }}>
                    {total > 0 ? `${h1(total)}h` : ""}
                  </div>
                  <div
                    className="flex w-full max-w-[22px] flex-col-reverse overflow-hidden rounded-t-lg rounded-b-[3px] lg:max-w-[30px]"
                    style={{ height: Math.max(4, (total / maxDayTotal) * MAX_BAR_PX), background: total > 0 ? undefined : "#e2e8f0" }}
                  >
                    {rows.map((r) =>
                      r.days[d] > 0 ? (
                        <div key={r.name} style={{ height: `${(r.days[d] / total) * 100}%`, background: r.color }} />
                      ) : null,
                    )}
                  </div>
                  <div className="text-[11px] font-bold lg:text-xs" style={{ color: labelColor }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {rows.map((r) => (
              <div key={r.name} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                {r.name}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse whitespace-nowrap text-center text-[12px] lg:text-[13px]">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-bold">과목</th>
                {DAY_LABELS.map((l, d) => (
                  <th key={l} className="px-1.5 py-1.5 font-bold" style={{ color: d === todayIdx ? "#4f46e5" : undefined }}>
                    {l}
                  </th>
                ))}
                <th className="px-2 py-1.5 font-extrabold text-slate-600">집계</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 text-left">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                      {r.name}
                    </span>
                  </td>
                  {r.days.map((sec, d) => (
                    <td key={d} className={sec > 0 ? "px-1.5 py-1.5 font-semibold text-slate-700" : "px-1.5 py-1.5 text-slate-300"}>
                      {sec > 0 ? h1(sec) : "-"}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 font-extrabold text-brand">{h1(r.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-2 py-1.5 text-left font-extrabold text-slate-600">집계</td>
                {dayTotals.map((sec, d) => (
                  <td key={d} className="px-1.5 py-1.5 font-extrabold text-slate-700">
                    {sec > 0 ? h1(sec) : "-"}
                  </td>
                ))}
                <td className="px-2 py-1.5 font-extrabold text-brand">{h1(weekTotalSec)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-right text-[11px] font-semibold text-slate-400">단위: 시간(h)</div>
        </div>
      )}
    </section>
  );
}
