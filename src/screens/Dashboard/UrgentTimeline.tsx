import type { TimelineItem, UrgencyKind } from "../../data/types";

const URGENCY_STYLE: Record<UrgencyKind, { bar: string; text: string; bg: string }> = {
  red: { bar: "#ef4444", text: "#dc2626", bg: "#fef2f2" },
  amber: { bar: "#f59e0b", text: "#d97706", bg: "#fffbeb" },
  green: { bar: "#10b981", text: "#059669", bg: "#ecfdf5" },
};

export function UrgentTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="rounded-card border border-slate-100 bg-white p-5 shadow-card">
      <div className="mb-3.5 text-base font-extrabold text-slate-900">⏰ 마감 임박</div>
      <div className="flex flex-col gap-2.5">
        {items.map((t) => {
          const u = URGENCY_STYLE[t.kind];
          return (
            <div
              key={t.title}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-[13px]"
            >
              <div className="w-1 self-stretch rounded-full" style={{ background: u.bar }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800">{t.title}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-400">
                  {t.source} · {t.time}
                </div>
              </div>
              <div
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold"
                style={{ color: u.text, background: u.bg }}
              >
                {t.badge}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
