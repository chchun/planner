// Mock 데이터 — docs/SPEC.md §8 + docs/prototype.html의 Component state를 그대로 따른다.
// 기준일은 목업과 동일하게 2026-07-14(화) 고정.
import type {
  CalendarEvent,
  Memo,
  OverdueItem,
  PlanItem,
  Subject,
  TimelineItem,
  TimetableBlock,
  Todo,
} from "./types";

export const MOCK_TODAY = { year: 2026, month: 7, day: 14, weekday: "화요일" };
export const HEADER_DATE = "2026년 7월 14일 화요일";

export const subjects: Subject[] = [
  { name: "수학", color: "#4f46e5", todaySec: 4800, weekSec: 28800 },
  { name: "영어", color: "#0ea5e9", todaySec: 2700, weekSec: 18000 },
  { name: "국어", color: "#f97316", todaySec: 1800, weekSec: 12600 },
  { name: "과학", color: "#10b981", todaySec: 3900, weekSec: 21600 },
  { name: "사회", color: "#a855f7", todaySec: 0, weekSec: 7200 },
];

export const todos: Todo[] = [
  {
    id: 1,
    title: "수학 학원 숙제 (미적분 p.45-50)",
    prio: "high",
    source: "수학 학원",
    done: false,
    subOpen: true,
    subs: [
      { title: "45-47p 필수 문제", done: true },
      { title: "48-50p 심화 문제", done: false },
      { title: "오답 노트 정리", done: false },
    ],
  },
  {
    id: 2,
    title: "통합과학 수행평가 자료 조사",
    prio: "mid",
    source: "학교",
    done: false,
    subOpen: false,
    subs: [
      { title: "주제 3개 선정", done: false },
      { title: "참고문헌 정리", done: false },
    ],
  },
  { id: 3, title: "영어 단어 100개 암기", prio: "low", source: "영어 학원", done: true, subOpen: false, subs: [] },
  { id: 4, title: "국어 비문학 지문 2개 풀이", prio: "mid", source: "인강", done: false, subOpen: false, subs: [] },
];

export const overdueItems: OverdueItem[] = [
  { title: "화학 실험 보고서 작성", ago: "어제 마감" },
  { title: "수학 문제집 30문항", ago: "2일 전 마감" },
];

export const timelineItems: TimelineItem[] = [
  { title: "통합과학 수행평가 자료 제출", source: "학교", time: "1시간 남음", badge: "D-DAY", kind: "red" },
  { title: "영어 단어 시험", source: "영어 학원", time: "오늘 오후", badge: "3시간", kind: "red" },
  { title: "국어 독서록", source: "인강", time: "내일 자정", badge: "D-1", kind: "amber" },
  { title: "물리 개념 정리 노트", source: "물리 학원", time: "7/18", badge: "D-3", kind: "green" },
];

export const plan: PlanItem[] = [
  { subject: "수학", goal: 120, done: false, memo: "미적분 문제집 p.45-50" },
  { subject: "영어", goal: 60, done: true, memo: "단어 100개 + 독해 2지문" },
  { subject: "국어", goal: 45, done: false, memo: "비문학 지문 2개 풀이" },
  { subject: "과학", goal: 90, done: false, memo: "통합과학 수행평가 자료" },
];

export const timetable: TimetableBlock[] = [
  { subject: "국어", start: 7, end: 8 },
  { subject: "수학", start: 9, end: 11 },
  { subject: "영어", start: 13, end: 14.5 },
  { subject: "과학", start: 16, end: 18 },
  { subject: "수학", start: 20, end: 22 },
];

/** 일(day of month) → 그날의 일정 목록 (2026년 7월) */
export const events: Record<number, CalendarEvent[]> = {
  12: [{ time: "11:00", title: "독서실 자습", type: "sched" }],
  13: [{ time: "23:59", title: "수학 학원 과제 마감", type: "hw" }],
  14: [
    { time: "16:00", title: "수학 학원 수업", type: "sched" },
    { time: "18:00", title: "수학 학원 숙제 제출", type: "hw" },
  ],
  15: [{ time: "09:00", title: "통합과학 수행평가", type: "hw" }],
  16: [{ time: "15:30", title: "학교 방과후 수업", type: "sched" }],
  18: [
    { time: "14:00", title: "영어 학원", type: "sched" },
    { time: "23:59", title: "국어 독서록 마감", type: "hw" },
  ],
  22: [{ time: "23:59", title: "영어 단어 시험 범위", type: "hw" }],
  25: [{ time: "10:00", title: "전국 모의고사", type: "sched" }],
};

export const memoFolders = ["전체", "국어", "수학", "영어", "과학", "시험", "아이디어"];

export const memos: Memo[] = [
  { id: 1, folder: "수학", color: "#fef9c3", text: "미적분 극한 공식 정리\n좌극한 / 우극한 반드시 확인!", image: null, done: false },
  { id: 2, folder: "시험", color: "#fce7f3", text: "통합과학 수행평가 3주차 제출\n실험 결과 사진 첨부 필수", image: null, done: false },
  { id: 3, folder: "영어", color: "#dbeafe", text: "관계대명사 계속적 용법 예문 5개 암기하기", image: null, done: false },
  { id: 4, folder: "아이디어", color: "#dcfce7", text: "주말 공부 계획\n오전 수학 / 오후 영어 인강", image: null, done: false },
  { id: 5, folder: "국어", color: "#ede9fe", text: "비문학 오답 노트 — 지문 사진 캡처해서 붙여두기", image: null, done: true },
];

export const memoSwatches = ["#fef9c3", "#fce7f3", "#dbeafe", "#dcfce7", "#ede9fe"];

/** 포스트잇 색 → 강조 텍스트 색 */
export const memoAccentMap: Record<string, string> = {
  "#fef9c3": "#ca8a04",
  "#fce7f3": "#db2777",
  "#dbeafe": "#2563eb",
  "#dcfce7": "#16a34a",
  "#ede9fe": "#7c3aed",
};

export const registerTags = ["수학 학원", "통합과학", "영어 학원", "국어", "기타"];

/** 주간 그래프 mock — 오늘(index 2) 이전 요일의 공부시간(시간 단위) */
export const weekPastHours = [2.0, 3.5];
export const WEEK_TODAY_INDEX = 2;
