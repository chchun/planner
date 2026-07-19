// 로그인 자격증명 저장(아이디/비밀번호) — 브라우저 localStorage(평문).
// 가족용 개인 단말 전제. Login 화면과 스토어의 초기 탭 결정이 이 키를 공유한다.
export const LS_ID = "planner.savedId";
export const LS_PW = "planner.savedPw";

/** 비밀번호까지 저장돼 있으면 = 자동 로그인 대상 사용자 → 진입 탭을 메모로 */
export const hasSavedPassword = (): boolean => {
  try {
    return localStorage.getItem(LS_PW) != null;
  } catch {
    return false;
  }
};
