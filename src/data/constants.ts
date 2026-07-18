// UI 상수 — 서버 데이터가 아닌 화면 고정값 (docs/TOKENS.md · SPEC.md 기준)
export const memoFolders = ["전체", "국어", "수학", "영어", "과학", "시험", "아이디어"];

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
