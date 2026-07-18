import { CheckIcon } from "../../components/icons";
import { fmtMin } from "../../lib/time";
import { subjectColor, useAppStore } from "../../store/useAppStore";

export function PlanChecklist() {
  const plan = useAppStore((s) => s.plan);
  const subjects = useAppStore((s) => s.subjects);
  const togglePlan = useAppStore((s) => s.togglePlan);
  const doneCount = plan.filter((p) => p.done).length;

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-3 flex items-center justify-between lg:mb-4">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">
          📋 과목별 학습 계획
        </div>
        <div className="text-xs font-bold text-brand lg:text-[13px]">
          {doneCount}/{plan.length} 완료
        </div>
      </div>
      <div className="flex flex-col gap-2 lg:gap-2.5">
        {plan.map((p, i) => {
          const color = subjectColor(subjects, p.subject);
          return (
            <button
              key={i}
              onClick={() => togglePlan(i)}
              className="flex min-h-[52px] items-center gap-3 rounded-xl bg-slate-50 p-3 text-left lg:gap-[13px] lg:p-3.5"
              style={{ opacity: p.done ? 0.55 : 1 }}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 ${
                  p.done ? "border-brand bg-brand" : "border-slate-300 bg-white"
                }`}
              >
                <CheckIcon
                  size={13}
                  className={p.done ? "opacity-100" : "opacity-0"}
                  style={{ color: "#fff" }}
                />
              </span>
              <span className="h-[30px] w-1.5 rounded-full" style={{ background: color }} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-sm font-bold text-slate-800"
                  style={{ textDecoration: p.done ? "line-through" : "none" }}
                >
                  {p.subject} · {p.memo}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                  목표 {fmtMin(p.goal)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
