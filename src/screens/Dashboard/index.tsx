import { repo } from "../../data/repository";
import { useAppStore } from "../../store/useAppStore";
import { OverdueWidget } from "./OverdueWidget";
import { UrgentTimeline } from "./UrgentTimeline";
import { DailyTodoList } from "./DailyTodoList";

export function Dashboard() {
  const todos = useAppStore((s) => s.todos);
  const overdue = repo.getOverdueItems();

  return (
    <div className="flex flex-col gap-4 lg:gap-[18px]">
      {overdue.length > 0 && <OverdueWidget items={overdue} />}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.15fr] lg:gap-[18px]">
        <UrgentTimeline items={repo.getTimelineItems()} />
        <DailyTodoList todos={todos} />
      </div>
    </div>
  );
}
