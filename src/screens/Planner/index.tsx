import { useAppStore } from "../../store/useAppStore";
import { TimetableColumn } from "./TimetableColumn";
import { PlanChecklist } from "./PlanChecklist";
import { StudySummaryCard } from "./StudySummaryCard";
import { DateNav } from "./DateNav";

export function Planner() {
  const subjects = useAppStore((s) => s.subjects);
  const timetable = useAppStore((s) => s.timetable);

  return (
    <div className="flex flex-col gap-4 lg:gap-[18px]">
      <DateNav />
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-[18px]">
        {/* 모바일에서는 요약 카드가 맨 위 (목업 기준) */}
        <div className="lg:hidden">
          <StudySummaryCard />
        </div>
        <TimetableColumn blocks={timetable} subjects={subjects} />
        <div className="flex flex-col gap-4 lg:gap-[18px]">
          <PlanChecklist />
          <div className="hidden lg:block">
            <StudySummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
