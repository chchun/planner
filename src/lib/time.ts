const pad2 = (n: number) => String(n).padStart(2, "0");

/** 타이머 표시용 H:MM:SS */
export function fmtHMS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${pad2(m)}:${pad2(s % 60)}`;
}

/** 누적 요약용 "N시간 M분" */
export function fmtHM(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 계획 목표용(분 단위 입력) "N시간 M분" */
export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 시간표 블록 라벨: 9 → "09:00", 14.5 → "14:30" */
export function fmtHourFloat(h: number): string {
  return `${pad2(Math.floor(h))}:${pad2(Math.round((h % 1) * 60))}`;
}

export { pad2 };
