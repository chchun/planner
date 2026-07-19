import { useState } from "react";
import { isoLabel, isoToDate, shiftISO, todayISO } from "../../lib/date";
import { pad2 } from "../../lib/time";
import { useAppStore } from "../../store/useAppStore";

/** 플래너 날짜 네비게이션 — ◀ 날짜 ▶ + 오늘 + 년/월/일 선택 팝업 (spec 006 R-61) */
export function DateNav() {
  const plannerDate = useAppStore((s) => s.plannerDate);
  const loadPlannerDate = useAppStore((s) => s.loadPlannerDate);
  const online = useAppStore((s) => s.online);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isToday = plannerDate === todayISO();
  const d = isoToDate(plannerDate);
  const [year, month, dayN] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
  const nowYear = new Date().getFullYear();
  const years = [nowYear - 1, nowYear, nowYear + 1];
  const daysInMonth = new Date(year, month, 0).getDate();

  const go = (date: string) => void loadPlannerDate(date);
  const pick = (y: number, m: number, day: number) => {
    const max = new Date(y, m, 0).getDate();
    go(`${y}-${pad2(m)}-${pad2(Math.min(day, max))}`);
  };

  const navBtn = "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 font-extrabold disabled:opacity-40 lg:h-10 lg:w-10";
  const selCls = "rounded-lg border-[1.5px] border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-700 focus:border-brand focus:outline-none";

  return (
    <section className="relative rounded-card border border-slate-100 bg-white p-3 shadow-card lg:p-3.5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => go(shiftISO(plannerDate, -1))}
          disabled={!online}
          aria-label="이전 날짜"
          title={online ? "이전 날짜" : "오프라인 — 날짜 이동은 온라인에서"}
          className={navBtn}
        >
          ◀
        </button>
        <button
          onClick={() => online && setPickerOpen((v) => !v)}
          disabled={!online}
          className="min-h-[36px] flex-1 rounded-lg px-2 text-center text-[15px] font-extrabold text-slate-900 hover:bg-slate-50 disabled:opacity-60 lg:text-base"
          title={online ? "날짜 선택" : "오프라인 — 날짜 이동은 온라인에서"}
        >
          {isoLabel(plannerDate)}
          {isToday && <span className="ml-1.5 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-extrabold text-brand">오늘</span>}
        </button>
        <button
          onClick={() => go(shiftISO(plannerDate, 1))}
          disabled={!online}
          aria-label="다음 날짜"
          title={online ? "다음 날짜" : "오프라인 — 날짜 이동은 온라인에서"}
          className={navBtn}
        >
          ▶
        </button>
        {!isToday && (
          <button
            onClick={() => go(todayISO())}
            className="min-h-[36px] shrink-0 rounded-lg bg-brand px-3 text-[13px] font-extrabold text-white hover:bg-brand-hover"
          >
            오늘
          </button>
        )}
      </div>

      {pickerOpen && (
        <div className="absolute left-1/2 top-full z-20 mt-1.5 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <select value={year} onChange={(e) => pick(Number(e.target.value), month, dayN)} className={selCls} aria-label="년">
            {years.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month} onChange={(e) => pick(year, Number(e.target.value), dayN)} className={selCls} aria-label="월">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
          <select value={dayN} onChange={(e) => pick(year, month, Number(e.target.value))} className={selCls} aria-label="일">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}일</option>)}
          </select>
          <button
            onClick={() => setPickerOpen(false)}
            className="ml-1 min-h-[36px] rounded-lg bg-slate-100 px-3 text-[13px] font-bold text-slate-600"
          >
            닫기
          </button>
        </div>
      )}
    </section>
  );
}
