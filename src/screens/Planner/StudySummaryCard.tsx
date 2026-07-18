import { fmtHM, fmtMin } from "../../lib/time";
import { useNow } from "../../lib/useNow";
import { runningElapsedSec, useAppStore } from "../../store/useAppStore";

/** 오늘 목표 vs 실제 공부시간 — 실제는 타이머 누적과 실시간 연동 */
export function StudySummaryCard() {
  const plan = useAppStore((s) => s.plan);
  const subjects = useAppStore((s) => s.subjects);
  const timer = useAppStore((s) => s.timer);
  const now = useNow(timer.runningSubject != null);

  const goalMin = plan.reduce((a, p) => a + p.goal, 0);
  const studiedSec =
    subjects.reduce((a, s) => a + s.todaySec, 0) + runningElapsedSec(timer, now);

  return (
    <section className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand to-indigo-500 p-[18px] text-white lg:rounded-card lg:p-[22px]">
      <div>
        <div className="text-xs font-bold opacity-85 lg:text-[13px]">오늘 목표 공부시간</div>
        <div className="mt-1 text-[22px] font-extrabold tracking-tight lg:text-[28px]">
          {fmtMin(goalMin)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold opacity-85 lg:text-[13px]">실제 공부시간</div>
        <div className="mt-1 text-[22px] font-extrabold tracking-tight lg:text-[28px]">
          {fmtHM(studiedSec)}
        </div>
      </div>
    </section>
  );
}
