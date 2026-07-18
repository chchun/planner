import { deriveOverdue, deriveTimeline } from "../../lib/dday";
import { useAppStore } from "../../store/useAppStore";
import { OverdueWidget } from "./OverdueWidget";
import { UrgentTimeline } from "./UrgentTimeline";
import { DailyTodoList } from "./DailyTodoList";

export function Dashboard() {
  const todos = useAppStore((s) => s.todos);
  // 마감 임박·이월은 할일의 납기(due_at)에서 파생 (spec 002 R-13)
  const overdue = deriveOverdue(todos);
  const timeline = deriveTimeline(todos);

  return (
    <div className="flex flex-col gap-4 lg:gap-[18px]">
      {overdue.length > 0 && <OverdueWidget items={overdue} />}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.15fr] lg:gap-[18px]">
        <UrgentTimeline items={timeline} />
        <DailyTodoList todos={todos} />
      </div>
    </div>
  );
}
