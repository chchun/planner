import { GridIcon, ListIcon } from "../../components/icons";
import { repo } from "../../data/repository";
import { useAppStore } from "../../store/useAppStore";
import { MemoComposer } from "./MemoComposer";
import { MemoCard, MemoRow } from "./MemoItem";

export function MemoBoard() {
  const memos = useAppStore((s) => s.memos);
  const memoView = useAppStore((s) => s.memoView);
  const setMemoView = useAppStore((s) => s.setMemoView);
  const currentFolder = useAppStore((s) => s.currentFolder);
  const setCurrentFolder = useAppStore((s) => s.setCurrentFolder);
  const folders = repo.getMemoFolders();

  const filtered = memos.filter((m) => currentFolder === "전체" || m.folder === currentFolder);

  return (
    <div className="flex flex-col gap-3.5 lg:gap-4">
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="flex flex-1 gap-1.5 overflow-x-auto lg:gap-2">
          {folders.map((f) => {
            const count = f === "전체" ? memos.length : memos.filter((m) => m.folder === f).length;
            const on = currentFolder === f;
            return (
              <button
                key={f}
                onClick={() => setCurrentFolder(f)}
                className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-2 text-xs font-bold lg:px-3.5 lg:text-[13px] ${
                  on ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {f}
                <span className="text-[10px] opacity-70 lg:text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 rounded-chip border border-slate-200 bg-white p-[3px]">
          <button
            onClick={() => setMemoView("card")}
            aria-label="카드뷰"
            className={`flex h-7 w-[30px] items-center justify-center rounded-md lg:h-[30px] lg:w-[34px] lg:rounded-[7px] ${
              memoView === "card" ? "bg-brand-soft text-brand" : "text-slate-400"
            }`}
          >
            <GridIcon size={15} />
          </button>
          <button
            onClick={() => setMemoView("list")}
            aria-label="리스트뷰"
            className={`flex h-7 w-[30px] items-center justify-center rounded-md lg:h-[30px] lg:w-[34px] lg:rounded-[7px] ${
              memoView === "list" ? "bg-brand-soft text-brand" : "text-slate-400"
            }`}
          >
            <ListIcon size={15} />
          </button>
        </div>
      </div>

      <MemoComposer folders={folders} />

      {memoView === "card" ? (
        <div className="grid grid-cols-2 items-start gap-2.5 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:gap-3.5">
          {filtered.map((m) => (
            <MemoCard key={m.id} memo={m} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((m) => (
            <MemoRow key={m.id} memo={m} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-10 text-center text-sm font-semibold text-slate-300">
          이 폴더에 메모가 없어요
        </div>
      )}
    </div>
  );
}
