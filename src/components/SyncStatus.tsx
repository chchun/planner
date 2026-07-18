import { useAppStore } from "../store/useAppStore";

function timeLabel(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 동기화 상태 표시 (spec 003 R-23) — 클릭 시 수동 동기화 */
export function SyncStatus({ compact }: { compact?: boolean }) {
  const online = useAppStore((s) => s.online);
  const pendingCount = useAppStore((s) => s.pendingCount);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const syncing = useAppStore((s) => s.syncing);
  const syncNow = useAppStore((s) => s.syncNow);

  if (compact) {
    // 모바일 헤더용 점 표시
    return (
      <button
        onClick={() => void syncNow()}
        aria-label={online ? "온라인" : "오프라인"}
        className="flex min-h-[44px] items-center gap-1.5 px-1"
      >
        <span
          className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"} ${syncing ? "animate-pulse" : ""}`}
        />
        {pendingCount > 0 && (
          <span className="text-[10px] font-extrabold text-amber-600">{pendingCount}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => void syncNow()}
      className="mb-2 flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-slate-100"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"} ${syncing ? "animate-pulse" : ""}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-600">
          {syncing ? "동기화 중…" : online ? "온라인" : "오프라인"}
          {pendingCount > 0 && (
            <span className="ml-1.5 font-extrabold text-amber-600">대기 {pendingCount}건</span>
          )}
        </span>
        <span className="block text-[10px] font-semibold text-slate-400">
          마지막 동기화 {timeLabel(lastSyncAt)}
        </span>
      </span>
    </button>
  );
}

/** 모바일 오프라인 배너 — 탭바 위 (오프라인이거나 대기 건이 있을 때만) */
export function OfflineBanner() {
  const online = useAppStore((s) => s.online);
  const pendingCount = useAppStore((s) => s.pendingCount);
  if (online && pendingCount === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-[78px] z-20 flex justify-center px-4 pb-1.5 lg:hidden">
      <div className="rounded-full bg-slate-800/90 px-4 py-1.5 text-[11px] font-bold text-white backdrop-blur">
        {online
          ? `동기화 대기 ${pendingCount}건 — 전송 중`
          : `오프라인 — 변경 내용은 연결 후 반영됩니다${pendingCount > 0 ? ` (대기 ${pendingCount}건)` : ""}`}
      </div>
    </div>
  );
}
