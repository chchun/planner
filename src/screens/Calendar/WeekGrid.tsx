import type { DayEvent } from "../../data/types";
import { currentWeekDays, dayOfWeek, getToday, WEEKDAY_LABELS } from "../../lib/date";
import { useNow } from "../../lib/useNow";

const HOUR_PX = 48;
/** 종료 없는(마감형) 이벤트의 기본 블록 길이(분) */
const DEFAULT_DUR_MIN = 60;
/** 블록 최소 높이 — 제목 한 줄은 항상 읽히게 */
const MIN_BLOCK_PX = 28;

interface Positioned {
  ev: DayEvent;
  startMin: number;
  endMin: number;
  lane: number;
  laneCount: number;
}

/**
 * 겹침 분할 — 시작시각 정렬 후 겹치는 클러스터 안에서 lane을 배정하고,
 * 클러스터의 lane 수만큼 폭을 나눈다 (구글 캘린더 방식의 단순화판).
 */
function layoutDay(items: DayEvent[]): Positioned[] {
  const sorted = items
    .map((ev) => ({
      ev,
      startMin: ev.startMin,
      endMin: Math.min(24 * 60, Math.max(ev.endMin ?? ev.startMin + DEFAULT_DUR_MIN, ev.startMin + 30)),
      lane: 0,
      laneCount: 1,
    }))
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  let cluster: Positioned[] = [];
  let laneEnds: number[] = []; // lane별 마지막 종료 분
  let clusterEnd = -1;
  const closeCluster = () => {
    for (const p of cluster) p.laneCount = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };
  for (const p of sorted) {
    if (p.startMin >= clusterEnd) closeCluster();
    const free = laneEnds.findIndex((end) => end <= p.startMin);
    p.lane = free >= 0 ? free : laneEnds.length;
    laneEnds[p.lane] = p.endMin;
    cluster.push(p);
    clusterEnd = Math.max(clusterEnd, p.endMin);
  }
  closeCluster();
  return sorted;
}

/**
 * 주간 뷰 — 구글 캘린더식 시간축 타임그리드 (spec 007 R-72).
 * Y축 시간 눈금 + 7일 열, 일정은 길이에 비례한 색 블록. 모바일은 가로 스크롤.
 */
export function WeekGrid({
  events,
  filterSched,
  filterHw,
}: {
  events: Record<number, DayEvent[]>;
  filterSched: boolean;
  filterHw: boolean;
}) {
  const today = getToday().day;
  const now = useNow(true);

  const days = currentWeekDays().map((n) => {
    const items = (events[n] ?? []).filter(
      (e) => (e.type === "sched" && filterSched) || (e.type === "hw" && filterHw),
    );
    return { n, dow: dayOfWeek(n), blocks: layoutDay(items), isToday: n === today };
  });

  // 시간 범위: 최소 08~22시를 보장하되 이번 주 일정을 모두 포함
  let startHour = 8;
  let endHour = 22;
  for (const d of days) {
    for (const b of d.blocks) {
      startHour = Math.min(startHour, Math.floor(b.startMin / 60));
      endHour = Math.max(endHour, Math.ceil(b.endMin / 60));
    }
  }
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridStartMin = startHour * 60;
  const bodyHeight = hours.length * HOUR_PX;

  const nowDate = new Date(now);
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const nowTop = ((nowMin - gridStartMin) / 60) * HOUR_PX;
  const showNowLine = nowMin >= gridStartMin && nowMin <= endHour * 60;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* 헤더: 요일 + 날짜 */}
        <div className="grid grid-cols-[44px_repeat(7,1fr)]">
          <div />
          {days.map(({ n, dow, isToday }) => (
            <div key={n} className="pb-2 text-center">
              <div
                className="text-[11px] font-bold"
                style={{ color: dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#94a3b8" }}
              >
                {WEEKDAY_LABELS[dow]}
              </div>
              <div
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-extrabold ${
                  isToday ? "bg-brand text-white" : "text-slate-900"
                }`}
              >
                {n}
              </div>
            </div>
          ))}
        </div>

        {/* 본문: 시간 거터 + 7일 열 */}
        <div className="grid grid-cols-[44px_repeat(7,1fr)]" style={{ height: bodyHeight }}>
          {/* 시간 거터 */}
          <div className="relative">
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] font-bold text-slate-400"
                style={{ top: i * HOUR_PX }}
              >
                {i > 0 && `${h}시`}
              </div>
            ))}
          </div>

          {days.map(({ n, blocks, isToday }) => (
            <div
              key={n}
              className="relative border-l border-slate-100"
              style={{ background: isToday ? "#eef2ff66" : undefined }}
            >
              {/* 시간 눈금선 */}
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-slate-100"
                  style={{ top: i * HOUR_PX }}
                />
              ))}

              {/* 이벤트 블록 */}
              {blocks.map((b, i) => {
                const top = ((b.startMin - gridStartMin) / 60) * HOUR_PX;
                const height = Math.max(MIN_BLOCK_PX, ((b.endMin - b.startMin) / 60) * HOUR_PX);
                const widthPct = 100 / b.laneCount;
                return (
                  <div
                    key={i}
                    className="absolute overflow-hidden rounded-md px-1.5 py-1"
                    style={{
                      top,
                      height,
                      left: `${b.lane * widthPct}%`,
                      width: `calc(${widthPct}% - 2px)`,
                      background: b.ev.color,
                      opacity: 0.92,
                    }}
                  >
                    <div className="truncate text-[11px] font-extrabold leading-tight text-white">
                      {b.ev.title}
                    </div>
                    {height >= 40 && (
                      <div className="text-[10px] font-semibold leading-tight text-white/85">
                        {b.ev.time}
                        {b.ev.endTime ? `~${b.ev.endTime}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 현재 시각 선 — 오늘 열에만 (R-72) */}
              {isToday && showNowLine && (
                <div className="absolute inset-x-0 z-10" style={{ top: nowTop }}>
                  <div className="h-[2px] bg-red-500" />
                  <div className="absolute -left-[4px] -top-[3px] h-2 w-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
