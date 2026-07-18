# Plan 002 — Phase 2 기술 설계

## 스택 결정
- **API 서버**: Node + **Hono**(+@hono/node-server), 포트 3001. Vite dev 프록시 `/api` → 3001 (같은 오리진 → 쿠키 단순)
- **DB**: **PGlite**(임베디드 PostgreSQL, WASM) — 로컬에 PostgreSQL/Docker 데몬이 없어 npm 설치만으로 실행되는 진짜 Postgres를 사용.
  파일 저장(`./data/pg`). **`DATABASE_URL` 환경변수가 있으면 node-postgres(pg)로 실제 PostgreSQL 접속** — SQL 동일(Postgres 문법), 운영 전환 시 드라이버만 바뀜
- ORM 없이 raw SQL + 파라미터 바인딩(`q(sql, params)` 헬퍼). 스키마는 `server/schema.sql` 성격의 상수로 부팅 시 `CREATE TABLE IF NOT EXISTS`
- 비밀번호: bcryptjs(순수 JS — Windows 네이티브 빌드 회피). 세션: 랜덤 토큰 → `sessions` 테이블, httpOnly 쿠키 30일

## 스키마 (ROADMAP 반영: TIMESTAMPTZ · deleted_at · version 예약)
users(id, username uniq, password_hash, display_name, role, grade_label) / sessions(token, user_id, expires_at)
subjects(name uniq, color, sort) / todos(id, title, prio, source, done, due_at, version, deleted_at, …)
todo_subtasks(id, todo_id, title, done, sort) / plan_items(id, subject, goal_min, memo, done)
timetable_blocks(id, subject, start_h, end_h) / calendar_events(id, title, type, start_at, version, deleted_at)
memos(id, folder, color, text, image, done, deleted_at) / timer_sessions(id, user_id, subject, started_at, ended_at)

## API
- `POST /api/auth/login` `POST /api/auth/logout` `GET /api/auth/me`
- **`GET /api/bootstrap`** — 로그인 후 1회 호출로 전체 초기 데이터: user, subjects(+오늘/주 누적), todos(+subs),
  plan, timetable, 이번 달 events, memos, 주간 타이머 통계(월~일 초). 클라이언트 초기화 단순화
- 변경: `POST/PATCH/DELETE /api/todos[/:id]`, `PATCH /api/todos/:id/subtasks/:sid`, `PATCH /api/plan/:id`,
  `POST/PATCH/DELETE /api/memos[/:id]`, `POST /api/timer/sessions`(학생만)
- DELETE는 소프트 삭제(deleted_at). 시간 집계 기준일 경계는 서버 로컬 TZ(KST) 사용

## 클라이언트 변경
- `data/api.ts`: fetch 래퍼(JSON, 401 → 로그인 화면 전환). `data/repository.ts`: async API 구현체로 교체(시그니처 유지)
- 스토어: `initialize()`가 me → bootstrap 로드. `user`, `status(loading|login|ready)` 추가.
  변경 액션은 낙관적 업데이트 + API 호출(실패 시 콘솔 에러)
- 타이머: 정지/전환 시 `POST /api/timer/sessions`. 표시 로직(startedAt 계산)은 그대로. 부모는 버튼 비활성
- 실날짜: `lib/date.ts` 실제 오늘 기준으로 재작성, `lib/dday.ts`(D-Day 배지·이월 라벨 파생) 신설.
  대시보드 타임라인·이월 위젯은 todos의 due_at에서 파생 — mock의 timeline/overdue 상수 제거
- 시드: Phase 1 mock을 실날짜 기준으로 이식(오늘 납기 할일, 이번 주 타이머 세션 분포, 이번 달 일정)

## 실행
- `npm run server`(tsx watch) + `npm run dev`(Vite). 시드는 서버 부팅 시 테이블이 비어 있으면 자동 실행
- 데모 계정: minjun / mom / dad, 비밀번호 공통 `planner123` (가족용 — 운영 전 변경)

## 리스크
- PGlite는 단일 프로세스 전용(동시 접속 1) — 개발용으로 충분, 운영은 DATABASE_URL로 실제 PG
- 집계는 서버 TZ 의존 — 운영 배포 시 서버 TZ를 Asia/Seoul로 고정하거나 쿼리에 TZ 명시 필요
