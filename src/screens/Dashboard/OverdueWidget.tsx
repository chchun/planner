import { AlertIcon } from "../../components/icons";
import type { OverdueItem } from "../../data/types";

export function OverdueWidget({ items }: { items: OverdueItem[] }) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border-l-4 border-red-500 bg-red-50 px-4 py-3.5 lg:px-[22px] lg:py-[18px]">
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-extrabold text-red-600">이월된 숙제</span>
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
            {items.length}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 lg:flex-row lg:flex-wrap lg:gap-6">
          {items.map((o) => (
            <div key={o.title} className="text-[15px] font-semibold text-red-900">
              {o.title}
              <span className="text-[13px] font-medium text-red-700"> · {o.ago}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertIcon size={20} />
      </div>
    </section>
  );
}
