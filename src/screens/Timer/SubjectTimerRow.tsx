import { PauseIcon, PlayIcon } from "../../components/icons";
import { fmtHM, fmtHMS } from "../../lib/time";
import type { Subject } from "../../data/types";
import { useAppStore } from "../../store/useAppStore";

function SubjectTimerRow({
  subject,
  active,
  disabled,
}: {
  subject: Subject;
  active: boolean;
  disabled?: boolean;
}) {
  const toggleTimer = useAppStore((s) => s.toggleTimer);
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] border-[1.5px] p-3.5 lg:gap-3.5 lg:p-4"
      style={{
        background: active ? `${subject.color}12` : "#f8fafc",
        borderColor: active ? `${subject.color}55` : "transparent",
      }}
    >
      <div
        className="h-[34px] w-2 rounded-full lg:h-10 lg:w-2.5"
        style={{ background: subject.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold text-slate-900 lg:text-[15px]">{subject.name}</div>
        <div className="mt-0.5 text-[11px] font-semibold text-slate-400 lg:text-xs">
          이번 주 {fmtHM(subject.weekSec)}
        </div>
      </div>
      <div
        className="tabular-nums text-base font-extrabold lg:text-xl"
        style={{ color: active ? subject.color : "#334155" }}
      >
        {fmtHMS(subject.todaySec)}
      </div>
      <button
        onClick={() => toggleTimer(subject.name)}
        disabled={disabled}
        aria-label={active ? `${subject.name} 타이머 정지` : `${subject.name} 타이머 시작`}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40 lg:h-[46px] lg:w-[46px] ${
          active ? "animate-ringPulse" : ""
        }`}
        style={{ background: active ? subject.color : "#e2e8f0" }}
      >
        {active ? <PauseIcon size={19} /> : <PlayIcon size={19} fill="#64748b" />}
      </button>
    </div>
  );
}

export function SubjectTimerList({
  subjects,
  runningSubject,
  disabled,
}: {
  subjects: Subject[];
  runningSubject: string | null;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-card lg:p-5">
      <div className="mb-3 flex items-center justify-between lg:mb-4">
        <div className="text-[15px] font-extrabold text-slate-900 lg:text-base">과목별 타이머</div>
        {disabled && (
          <div className="text-[11px] font-bold text-slate-400">학생 계정만 기록할 수 있어요</div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 lg:gap-3">
        {subjects.map((s) => (
          <SubjectTimerRow
            key={s.name}
            subject={s}
            active={runningSubject === s.name}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}
