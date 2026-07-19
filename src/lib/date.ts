// 실제 오늘 기준 날짜 유틸 (Phase 2 — 고정 mock 날짜 제거, spec 002 R-13)
export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function getToday(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function headerDateLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_LABELS[d.getDay()]}요일`;
}

function firstDayOfWeek(): number {
  const t = getToday();
  return new Date(t.year, t.month - 1, 1).getDay();
}

function daysInMonth(): number {
  const t = getToday();
  return new Date(t.year, t.month, 0).getDate();
}

/** 이번 달 n일의 요일 (0=일) */
export function dayOfWeek(n: number): number {
  return (firstDayOfWeek() + n - 1) % 7;
}

/** 월간 그리드 셀 목록 — 앞쪽 빈 칸 포함 */
export function monthGridCells(): Array<number | null> {
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfWeek(); i++) cells.push(null);
  for (let n = 1; n <= daysInMonth(); n++) cells.push(n);
  return cells;
}

/** 이번 주(일~토) 날짜들 — 이번 달 기준 일 번호 (월 경계 밖은 제외될 수 있음) */
export function currentWeekDays(): number[] {
  const t = getToday();
  const start = t.day - dayOfWeek(t.day);
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    const n = start + i;
    if (n >= 1 && n <= daysInMonth()) days.push(n);
  }
  return days;
}

/** 월요일 기준 오늘 인덱스 (월=0 … 일=6) — 주간 그래프용 */
export function mondayIndexOfToday(): number {
  return (new Date().getDay() + 6) % 7;
}

// ---- ISO(YYYY-MM-DD) 날짜 유틸 — 플래너 날짜 네비게이션 (spec 006) ----
const pad = (n: number) => String(n).padStart(2, "0");

/** 오늘 (단말 로컬 = KST 전제) */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** iso 날짜에서 days만큼 이동 */
export function shiftISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026년 7월 19일 (일)" */
export function isoLabel(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABELS[d.getDay()]})`;
}
