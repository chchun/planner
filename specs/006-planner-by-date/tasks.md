# Tasks 006 — 플래너 날짜별 관리

> 순서: 스키마 → 백엔드 → 프론트. 각 작업 = 체크 + 커밋(타입체크·빌드 통과 후).

- [x] **T61. 스키마 + 마이그레이션 + 시드** (R-64)
  `server/db.ts`에 `plan_items.plan_date`·`timetable_blocks.dow` 추가(ALTER … IF NOT EXISTS),
  `server/seed.ts`를 요일별 시간표 + 오늘 계획으로 갱신
  *DoD: `npm run db:setup`으로 로컬 PGlite/Neon에 컬럼 생성, 기존 데이터 보존, 시드 정상*

- [x] **T62. 백엔드 날짜별 조회 + 계획 CRUD** (R-62, R-63)
  `GET /api/planner?date=`, `POST /api/plan`, `DELETE /api/plan/:id`,
  `bootstrap`의 plan을 오늘·timetable을 오늘 요일로 필터
  *DoD: curl로 날짜별 timetable/plan 조회, 계획 추가·삭제 확인. 회귀 없음*

- [ ] **T63. 프론트 날짜 네비게이션 + 연동** (R-61, R-62, R-63)
  `Planner/DateNav.tsx`(◀ 날짜 ▶ + 오늘 + 년월일 팝업), store `plannerDate`·`loadPlannerDate`·`addPlan`·`deletePlan`,
  `PlanChecklist` 추가/삭제 UI, repository 함수
  *DoD: 날짜 이동 시 요일 시간표·날짜 계획 갱신, 계획 추가/삭제, 오늘 복귀. 오프라인 시 이동 비활성*

## 착수 전 결정 사항 (사용자 승인 완료 2026-07-19)
- [x] 시간표 = 요일 템플릿 / 계획 = 날짜별 (plan.md 핵심 설계 결정)
- [x] 계획 추가 UI 포함(과목·목표시간·메모)
- [x] 배포 시 `/api/admin/db-setup` 재실행으로 Neon 스키마 반영
