# Tasks 001 — Phase 1 작업 목록

> plan.md 승인 후 이 순서대로 구현한다. 작업 1개 완료 = 체크 + 커밋.
> 각 작업의 완료 조건(DoD)을 만족해야 다음으로 넘어간다.
> **모든 화면 작업은 iPad(가로) 레이아웃 완성·검증이 먼저다. 그 다음 PC → 모바일(안드로이드) 순.**

- [x] **T01. 프로젝트 셋업**
  Vite + React + TS(strict) + Tailwind 초기화, Pretendard 폰트, `TOKENS.md` → tailwind.config 매핑
  *DoD: dev 서버 기동, 토큰 색상/폰트가 샘플 페이지에서 확인됨*

- [x] **T02. 데이터 계층**
  `data/types.ts` 도메인 타입, `data/mock.ts`(SPEC.md §8 + prototype.html state), `data/repository.ts`, `lib/time.ts` · `lib/date.ts` 유틸
  *DoD: 타입체크 통과, mock이 SPEC §8 항목을 모두 포함*

- [x] **T03. 스토어 + 앱 셸** (R-01)
  Zustand 스토어(activeTab, subjects, todos, timer…), AppShell — iPad·PC 사이드바 / 모바일 탭바+FAB, 헤더
  *DoD: 5개 탭 전환 동작, 세 뷰포트(iPad/PC/모바일)에서 레이아웃 확인*

- [x] **T04. 대시보드** (R-02)
  OverdueWidget / UrgentTimeline / DailyTodoList(+서브태스크 아코디언)
  *DoD: R-02 수용 기준 전부 체크, prototype.html과 시각 비교 통과*

- [x] **T05. 플래너** (R-03)
  TimetableColumn(절대 위치 블록) / PlanChecklist / StudySummaryCard
  *DoD: R-03 수용 기준 체크. 요약 카드는 타이머 스토어 값과 연동(T06 전엔 mock 누적값)*

- [x] **T06. 타이머** (R-04)
  타임스탬프 기반 타이머 로직(plan §핵심설계 1), TotalTimer / SubjectTimerRow / WeeklyBarChart
  *DoD: R-04 수용 기준 전부 체크 — **백그라운드 30초 테스트 포함***

- [x] **T07. 캘린더** (R-05)
  MonthGrid + 필터 칩 + iPad·PC 상세 패널 / 모바일 바텀시트, WeekGrid 풀스크린
  *DoD: R-05 수용 기준 전부 체크*

- [x] **T08. 등록 모달** (R-06)
  공용 RegisterForm + iPad·PC Dialog / 모바일 BottomSheet 래퍼, 납기 필수 검증, 서브태스크 동적 필드
  *DoD: R-06 수용 기준 전부 체크, 저장 → 대시보드 반영 확인*

- [x] **T09. 메모 보드** (R-07)
  MemoComposer(이미지 업로드) / FolderTabs / ViewToggle / MemoCard·MemoRow
  *DoD: R-07 수용 기준 전부 체크*

- [x] **T10. 반응형 정리 + 최종 QA** (R-08)
  iPad 전 화면 최종 점검(1순위) → PC(2순위) → 안드로이드 모바일(3순위), 히트영역 44px, 키보드 포커스, 모션 수치 확인, 최종 빌드
  *DoD: spec.md의 모든 수용 기준 체크 완료, `vite build` 통과*
