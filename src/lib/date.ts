import { MOCK_TODAY } from "../data/mock";

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 이번 달 1일의 요일 (0=일) */
export function firstDayOfWeek(): number {
  return new Date(MOCK_TODAY.year, MOCK_TODAY.month - 1, 1).getDay();
}

export function daysInMonth(): number {
  return new Date(MOCK_TODAY.year, MOCK_TODAY.month, 0).getDate();
}

/** n일의 요일 (0=일) */
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

/** 이번 주(일~토) 날짜들 — 목업 기준 7/12~7/18 */
export function currentWeekDays(): number[] {
  const start = MOCK_TODAY.day - dayOfWeek(MOCK_TODAY.day);
  return Array.from({ length: 7 }, (_, i) => start + i);
}
