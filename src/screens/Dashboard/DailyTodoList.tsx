import { CheckIcon, ChevronDownIcon } from "../../components/icons";
import type { Priority, Todo } from "../../data/types";
import { useAppStore } from "../../store/useAppStore";

const PRIO_STYLE: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "우선순위 상", color: "#dc2626", bg: "#fef2f2" },
  mid: { label: "우선순위 중", color: "#d97706", bg: "#fffbeb" },
  low: { label: "우선순위 하", color: "#059669", bg: "#ecfdf5" },
};

function Checkbox({ done, onToggle, small }: { done: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <button
      onClick={onToggle}
      aria-label={done ? "완료 해제" : "완료 처리"}
      className={`flex shrink-0 items-center justify-center rounded-[7px] border-2 ${
        small ? "h-[17px] w-[17px] rounded-[5px]" : "mt-px h-[22px] w-[22px]"
      } ${done ? "border-brand bg-brand" : "border-slate-300 bg-white"}`}
    >
      <CheckIcon size={small ? 10 : 13} className={done ? "opacity-100" : "opacity-0"} style={{ color: "#fff" }} />
    </button>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const toggleTodoOpen = useAppStore((s) => s.toggleTodoOpen);
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const prio = PRIO_STYLE[todo.prio];

  return (
    <div
      className="overflow-hidden rounded-xl bg-slate-50"
      style={{ opacity: todo.done ? 0.5 : 1 }}
    >
      <div className="flex items-start gap-3 px-3.5 py-[13px]">
        <Checkbox done={todo.done} onToggle={() => toggleTodo(todo.id)} />
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-bold text-slate-800"
            style={{ textDecoration: todo.done ? "line-through" : "none" }}
          >
            {todo.title}
          </div>
          <div className="mt-[7px] flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-md px-[7px] py-0.5 text-[11px] font-extrabold"
              style={{ color: prio.color, background: prio.bg }}
            >
              {prio.label}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {todo.source}
            </span>
          </div>
        </div>
        {todo.subs.length > 0 && (
          <button
            onClick={() => toggleTodoOpen(todo.id)}
            aria-label="하위 항목 펼치기"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
          >
            <ChevronDownIcon
              size={16}
              className="transition-transform"
              style={{ transform: todo.subOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
        )}
      </div>
      {todo.subOpen && todo.subs.length > 0 && (
        <div className="flex animate-acc flex-col gap-2 px-3.5 pb-3 pl-12 pt-0.5">
          {todo.subs.map((s, i) => (
            <button
              key={i}
              onClick={() => toggleSubtask(todo.id, i)}
              className="flex min-h-[28px] items-center gap-[9px] text-left"
            >
              <Checkbox small done={s.done} onToggle={() => toggleSubtask(todo.id, i)} />
              <span
                className="text-[13px] text-slate-600"
                style={{
                  textDecoration: s.done ? "line-through" : "none",
                  opacity: s.done ? 0.5 : 1,
                }}
              >
                {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DailyTodoList({ todos }: { todos: Todo[] }) {
  const doneCount = todos.filter((t) => t.done).length;
  return (
    <section className="rounded-card border border-slate-100 bg-white p-5 shadow-card">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-base font-extrabold text-slate-900">✅ 오늘의 할 일</div>
        <div className="text-[13px] font-bold text-brand">
          {doneCount}/{todos.length} 완료
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {todos.map((t) => (
          <TodoItem key={t.id} todo={t} />
        ))}
      </div>
    </section>
  );
}
