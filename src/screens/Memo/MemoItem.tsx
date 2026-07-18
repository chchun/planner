import { CheckIcon, TrashIcon } from "../../components/icons";
import { memoAccentMap } from "../../data/constants";
import type { Memo } from "../../data/types";
import { useAppStore } from "../../store/useAppStore";

function accentOf(memo: Memo): string {
  return memoAccentMap[memo.color] ?? "#64748b";
}

export function MemoCard({ memo }: { memo: Memo }) {
  const toggleDone = useAppStore((s) => s.toggleMemoDone);
  const deleteMemo = useAppStore((s) => s.deleteMemo);
  const accent = accentOf(memo);

  return (
    <div
      className="flex flex-col gap-2 rounded-[13px] p-3 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.18)] lg:gap-2.5 lg:rounded-[14px] lg:p-3.5"
      style={{ background: memo.color, opacity: memo.done ? 0.5 : 1 }}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-[5px] bg-white/60 px-1.5 py-0.5 text-[10px] font-extrabold lg:rounded-md lg:px-2 lg:text-[11px]"
          style={{ color: accent }}
        >
          {memo.folder}
        </span>
        <div className="flex gap-1 lg:gap-1.5">
          <button
            onClick={() => toggleDone(memo.id)}
            aria-label="확인 완료"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-white/75 lg:h-6 lg:w-6 lg:rounded-[7px]"
            style={{ color: memo.done ? accent : "#94a3b8" }}
          >
            <CheckIcon size={13} strokeWidth={3} />
          </button>
          <button
            onClick={() => deleteMemo(memo.id)}
            aria-label="메모 삭제"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-white/75 text-red-500 lg:h-6 lg:w-6 lg:rounded-[7px]"
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>
      {memo.image && <img src={memo.image} alt="" className="block w-full rounded-[10px]" />}
      <div
        className="whitespace-pre-wrap text-[13px] font-semibold leading-[1.45] text-slate-800 lg:text-sm lg:leading-normal"
        style={{ textDecoration: memo.done ? "line-through" : "none" }}
      >
        {memo.text}
      </div>
    </div>
  );
}

export function MemoRow({ memo }: { memo: Memo }) {
  const toggleDone = useAppStore((s) => s.toggleMemoDone);
  const deleteMemo = useAppStore((s) => s.deleteMemo);
  const accent = accentOf(memo);

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-[13px] py-[11px] lg:gap-3 lg:px-3.5 lg:py-3"
      style={{ borderLeft: `4px solid ${accent}`, opacity: memo.done ? 0.5 : 1 }}
    >
      {memo.image && (
        <img
          src={memo.image}
          alt=""
          className="h-10 w-10 shrink-0 rounded-[7px] object-cover lg:h-[46px] lg:w-[46px] lg:rounded-lg"
        />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-extrabold lg:text-[11px]" style={{ color: accent }}>
          {memo.folder}
        </span>
        <div
          className="whitespace-pre-wrap text-[13px] font-semibold text-slate-800 lg:text-sm"
          style={{ textDecoration: memo.done ? "line-through" : "none" }}
        >
          {memo.text}
        </div>
      </div>
      <button
        onClick={() => toggleDone(memo.id)}
        aria-label="확인 완료"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 lg:h-[30px] lg:w-[30px]"
        style={{ color: memo.done ? accent : "#94a3b8" }}
      >
        <CheckIcon size={14} strokeWidth={3} />
      </button>
      <button
        onClick={() => deleteMemo(memo.id)}
        aria-label="메모 삭제"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 lg:h-[30px] lg:w-[30px]"
      >
        <TrashIcon size={13} />
      </button>
    </div>
  );
}
