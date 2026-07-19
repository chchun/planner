import { useState } from "react";
import { CheckIcon, PlusIcon, TrashIcon } from "../../components/icons";
import { fmtMin } from "../../lib/time";
import { subjectColor, useAppStore } from "../../store/useAppStore";

export function PlanChecklist() {
  const plan = useAppStore((s) => s.plan);
  const subjects = useAppStore((s) => s.subjects);
  const togglePlan = useAppStore((s) => s.togglePlan);
  const addPlan = useAppStore((s) => s.addPlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const online = useAppStore((s) => s.online);
  const doneCount = plan.filter((p) => p.done).length;

  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("60");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const subj = subject || subjects[0]?.name;
    if (!subj || busy) return;
    setBusy(true);
    try {
      await addPlan({ subject: subj, goal: Math.max(0, Number(goal) || 0), memo: memo.trim() });
      setMemo("");
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-3 flex items-center justify-between lg:mb-4">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">
          📋 과목별 학습 계획
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-brand lg:text-[13px]">
            {doneCount}/{plan.length} 완료
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            disabled={!online}
            aria-label="계획 추가"
            title={online ? "계획 추가" : "오프라인 — 연결 후 추가할 수 있어요"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg lg:h-8 lg:w-8 ${
              formOpen ? "bg-brand text-white" : "bg-brand-soft text-brand"
            } disabled:opacity-40`}
          >
            <PlusIcon size={15} />
          </button>
        </div>
      </div>

      {formOpen && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border-[1.5px] border-brand-soft bg-slate-50 p-2.5">
          <select
            value={subject || subjects[0]?.name || ""}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="과목"
            className="rounded-lg border-[1.5px] border-slate-200 bg-white px-2 py-2 text-[13px] font-bold text-slate-700 focus:border-brand focus:outline-none"
          >
            {subjects.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="5"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              aria-label="목표 시간(분)"
              className="w-[64px] rounded-lg border-[1.5px] border-slate-200 bg-white px-2 py-2 text-[13px] font-bold text-slate-700 focus:border-brand focus:outline-none"
            />
            <span className="text-xs font-bold text-slate-400">분</span>
          </div>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="내용 (예: 문제집 p.10-20)"
            className="min-w-[120px] flex-1 rounded-lg border-[1.5px] border-slate-200 bg-white px-2.5 py-2 text-[13px] font-semibold text-slate-700 focus:border-brand focus:outline-none"
          />
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="min-h-[36px] rounded-lg bg-brand px-3.5 text-[13px] font-extrabold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            추가
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:gap-2.5">
        {plan.map((p) => {
          const color = subjectColor(subjects, p.subject);
          return (
            <div
              key={p.id}
              className="flex min-h-[52px] items-center gap-3 rounded-xl bg-slate-50 p-3 lg:gap-[13px] lg:p-3.5"
              style={{ opacity: p.done ? 0.55 : 1 }}
            >
              <button
                onClick={() => togglePlan(p.id)}
                aria-label={p.done ? "완료 해제" : "완료 체크"}
                className="flex min-h-[44px] flex-1 items-center gap-3 text-left lg:gap-[13px]"
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
                <span className="h-[30px] w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-sm font-bold text-slate-800"
                    style={{ textDecoration: p.done ? "line-through" : "none" }}
                  >
                    {p.subject}{p.memo ? ` · ${p.memo}` : ""}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                    목표 {fmtMin(p.goal)}
                  </span>
                </span>
              </button>
              <button
                onClick={() => deletePlan(p.id)}
                disabled={!online}
                aria-label="계획 삭제"
                title={online ? "삭제" : "오프라인 — 연결 후 삭제할 수 있어요"}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-red-400 hover:text-red-500 disabled:opacity-40"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          );
        })}
        {plan.length === 0 && (
          <div className="py-6 text-center text-sm font-semibold text-slate-300">
            이 날짜에 계획이 없어요 — + 버튼으로 추가하세요
          </div>
        )}
      </div>
    </section>
  );
}
