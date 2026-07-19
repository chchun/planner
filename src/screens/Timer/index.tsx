import { useNow } from "../../lib/useNow";
import { runningElapsedSec, useAppStore } from "../../store/useAppStore";
import { TotalTimer } from "./TotalTimer";
import { SubjectTimerList } from "./SubjectTimerRow";
import { WeeklyBarChart } from "./WeeklyBarChart";

export function Timer() {
  const subjects = useAppStore((s) => s.subjects);
  const timer = useAppStore((s) => s.timer);
  const weekBySubject = useAppStore((s) => s.weekBySubject);
  const isParent = useAppStore((s) => s.user?.role === "parent");
  const now = useNow(timer.runningSubject != null);
  const elapsed = runningElapsedSec(timer, now);

  /** 표시용: 확정 누적 + 실행 중 경과 (타임스탬프 기반) */
  const liveSubjects = subjects.map((s) =>
    s.name === timer.runningSubject
      ? { ...s, todaySec: s.todaySec + elapsed, weekSec: s.weekSec + elapsed }
      : s,
  );
  const totalTodaySec = liveSubjects.reduce((a, s) => a + s.todaySec, 0);

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-[18px]">
      <div className="flex flex-col gap-4 lg:gap-[18px]">
        <TotalTimer
          totalSec={totalTodaySec}
          activeSubject={liveSubjects.find((s) => s.name === timer.runningSubject) ?? null}
        />
        <WeeklyBarChart subjects={liveSubjects} weekBySubject={weekBySubject} />
      </div>
      <SubjectTimerList
        subjects={liveSubjects}
        runningSubject={timer.runningSubject}
        disabled={isParent}
      />
    </div>
  );
}
