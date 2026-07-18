import { fmtHMS } from "../../lib/time";
import type { Subject } from "../../data/types";

export function TotalTimer({
  totalSec,
  activeSubject,
}: {
  totalSec: number;
  activeSubject: Subject | null;
}) {
  return (
    <section className="rounded-card bg-slate-900 p-[26px] text-center text-white lg:rounded-[20px] lg:p-8">
      <div className="text-xs font-bold text-slate-400 lg:text-[13px]">오늘 총 공부시간</div>
      <div className="tabular-nums my-1 text-[42px] font-extrabold lg:mb-1 lg:mt-2 lg:text-[52px]">
        {fmtHMS(totalSec)}
      </div>
      <div
        className="text-[13px] font-bold lg:text-sm"
        style={{ color: activeSubject ? activeSubject.color : "#64748b" }}
      >
        {activeSubject ? `${activeSubject.name} 공부 중…` : "정지됨 · 과목을 눌러 시작"}
      </div>
    </section>
  );
}
