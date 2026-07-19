# Plan 006 — 플래너 날짜별 관리 기술 설계

## DB 스키마 (server/db.ts SCHEMA + 멱등 마이그레이션)
- `plan_items`: `plan_date DATE NOT NULL DEFAULT CURRENT_DATE` 추가
- `timetable_blocks`: `dow INT` 추가 (0=월 … 6=일)
- 마이그레이션(ALTER … ADD COLUMN IF NOT EXISTS): 기존 행 보존
  - 기존 `plan_items` → `plan_date = CURRENT_DATE`
  - 기존 `timetable_blocks` → `dow`는 시드에서 요일 부여(기존 무요일 블록은 평일 기본값으로 backfill 불필요 — 시드 재작성)
- 적용: 로컬 `npm run db:setup`, Neon `GET /api/admin/db-setup`(멱등)

## API (server/routes.ts)
- `GET /api/planner?date=YYYY-MM-DD` → `{ timetable, plan }`
  - timetable: 해당 날짜 요일(dow)의 블록
  - plan: `plan_date = date`인 계획
- `POST /api/plan` `{ date, subject, goal, memo }` → 계획 추가, `{ id }` 반환
- `DELETE /api/plan/:id` → 삭제(하드 또는 soft — plan은 이력 불필요하므로 하드 삭제)
- `PATCH /api/plan/:id` → 기존 done 토글 유지
- `bootstrap`: plan = 오늘(`CURRENT_DATE`), timetable = 오늘 요일. (기존 응답 형태 유지 + plan에 date 필터)
- 날짜 파싱: `date` 쿼리는 `YYYY-MM-DD`, KST 기준 그대로 DATE 비교

## 프론트 (src)
- store:
  - `plannerDate: string`(YYYY-MM-DD, 기본 오늘 KST), `setPlannerDate(date)`, `loadPlannerDate(date)`
  - `loadPlannerDate`가 `repo.planner(date)` 호출 → `timetable`/`plan` 교체(오프라인이면 무시)
  - 계획 CRUD: `addPlan(input)` / `deletePlan(id)` (기존 `togglePlan` 유지)
- repository: `planner(date)`, `createPlan(input)`, `deletePlan(id)` 추가
- 컴포넌트:
  - `Planner/DateNav.tsx` — ◀ 날짜 ▶ + 오늘 버튼 + 날짜선택 팝업(년/월/일 `<select>` 또는 `<input type=date>`)
  - `PlanChecklist` — 계획 추가 폼(과목 선택 + 목표분 + 메모) + 삭제 버튼
  - `StudySummaryCard` — store의 plan(선택 날짜) 사용(이미 그러함)
- 날짜 유틸: `lib/date.ts`에 `todayISO()`, `shiftISO(date, days)`, `isoToLabel(date)` 추가

## 오프라인 (Phase 3 범위 유지)
- 스냅샷은 오늘 데이터만. 날짜 이동은 온라인 전용 — 오프라인이면 이동 비활성 또는 "온라인 필요" 안내
- 계획 추가/삭제도 온라인 전용(신규 생성은 이미 온라인 전용 정책)

## 검증
1. 로컬: `npm run db:setup` 후 날짜 이동 → 요일별 시간표·날짜별 계획 표시, 계획 추가/삭제
2. bootstrap 회귀 없음(오늘 계획·시간표 정상)
3. 배포: `/api/admin/db-setup` 재실행 → 프로덕션 날짜 이동 E2E
