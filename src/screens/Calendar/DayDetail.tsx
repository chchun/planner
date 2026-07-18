import { CalendarIcon } from "../../components/icons";
import { getToday } from "../../lib/date";
import type { DayEvent } from "../../data/types";
import { useAppStore } from "../../store/useAppStore";

function detailItems(events: Record<number, DayEvent[]>, day: number) {
  return (events[day] ?? []).map((e) => ({
    ...e,
    color: e.type === "hw" ? "#f97316" : "#3b82f6",
    typeLabel: e.type === "hw" ? "숙제 마감" : "일정",
  }));
}

function DetailList({ items }: { items: ReturnType<typeof detailItems> }) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-[13px] font-semibold text-slate-400">
        이 날은 등록된 일정이 없어요
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((si, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
          <div
            className="w-11 shrink-0 text-center text-[13px] font-extrabold"
            style={{ color: si.color }}
          >
            {si.time}
          </div>
          <div className="w-[3px] self-stretch rounded-full" style={{ background: si.color }} />
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">{si.title}</div>
            <div className="mt-0.5 text-[11px] font-bold" style={{ color: si.color }}>
              {si.typeLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** iPad·PC 월간 뷰의 우측 상세 패널 */
export function DayDetailPanel({ events }: { events: Record<number, DayEvent[]> }) {
  const selectedDate = useAppStore((s) => s.selectedDate);

  return (
    <section className="min-h-[400px] rounded-card border border-slate-100 bg-white p-[22px] shadow-card">
      {selectedDate == null ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-slate-300">
          <CalendarIcon size={44} strokeWidth={1.8} />
          <div className="text-sm font-semibold">날짜를 선택하면 세부 일정이 표시됩니다</div>
        </div>
      ) : (
        <div>
          <div className="text-lg font-extrabold text-slate-900">
            {getToday().month}월 {selectedDate}일
          </div>
          <div className="mb-[18px] mt-[3px] text-[13px] font-semibold text-slate-400">
            {(events[selectedDate] ?? []).length}개의 일정 · 시간순
          </div>
          <DetailList items={detailItems(events, selectedDate)} />
        </div>
      )}
    </section>
  );
}

/** 모바일 월간 뷰의 날짜 상세 바텀 시트 */
export function DayBottomSheet({ events }: { events: Record<number, DayEvent[]> }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  if (selectedDate == null) return null;

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 animate-fadeIn bg-slate-900/40"
        onClick={() => setSelectedDate(null)}
      />
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[60%] animate-sheetUp overflow-y-auto rounded-t-3xl bg-white px-5 pb-7 pt-2 shadow-sheet">
        <div className="mx-auto mb-4 mt-1.5 h-1 w-10 rounded-full bg-slate-200" />
        <div className="mb-1 text-[17px] font-extrabold text-slate-900">
          {getToday().month}월 {selectedDate}일
        </div>
        <div className="mb-3.5 text-xs font-semibold text-slate-400">
          {(events[selectedDate] ?? []).length}개의 일정 · 시간순
        </div>
        <DetailList items={detailItems(events, selectedDate)} />
      </div>
    </div>
  );
}
