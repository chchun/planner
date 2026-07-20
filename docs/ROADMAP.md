# ROADMAP — Phase 2~5 아키텍처 방향

> 2026-07 설계 논의 결과. 각 Phase 착수 시 이 문서를 기반으로 `specs/00N-*/spec.md`를 작성한다.
> Phase 1(프론트엔드 UI)은 `specs/001-phase1-ui/` 참조.
> **상태: Phase 1~5 모두 구현 완료 (2026-07).** 남은 항목은 맨 아래 백로그 참조.

## 전체 구조 (확정 방향)
```
태블릿 PWA(iPad) ─┐
                  ├─ 백엔드 API ─ PostgreSQL (원본 데이터)
PC 웹 ────────────┘        └─ Google Calendar (단방향 연동 대상)
```
- **PostgreSQL = 원본**, Google Calendar = 연동 대상, IndexedDB = 태블릿 오프라인 임시 저장소
- 브라우저에서 DB 직접 접속 금지 — 항상 백엔드 API 경유
- 단말·사용자: 학생 = iPad(가로) / 부모(엄마·아빠) = PC 웹 + 안드로이드 폰(Chrome). iPhone은 타깃 아님
- PC 웹·부모 안드로이드 폰은 **온라인 전용** (오프라인 지원 없음)
- 태블릿(iPad)은 온라인 우선 + 제한적 오프라인 (오프라인 비율 ~20% 전제)

## Phase 2 — 백엔드 + 온라인 전용 전 기능
- PostgreSQL 스키마: `planner_events`(TIMESTAMPTZ, `deleted_at` 소프트 삭제, `version` 컬럼은 예약만), 반복일정은 **날짜별 실제 행 미리 생성** 방식
- 인증: 자체 로그인. 사용자 `role`(student/parent) 컬럼 — 권한 다대다 테이블은 만들지 않음(사용자 늘면 그때)
- 부모 계정: 학생 데이터 **조회 + 등록 가능**(메모·자료 업로드, 할일/일정 등록 등). 세부 등록 범위는 Phase 2 spec에서 확정
- 토큰 수명은 주 단위 이상 (태블릿 오프라인 중 세션 만료 방지)
- Phase 1의 repository 계층을 API 구현체로 교체
- 타이머는 **세션 단위 저장**(startedAt~endedAt, append-only) — 총 누적값 갱신 방식 금지
- BaaS(Supabase 등) 채택 여부는 Phase 2 spec 작성 시 결정

## Phase 3 — 태블릿 오프라인 (좁은 범위)
지원 범위를 의도적으로 좁힌다. **범용 동기화 엔진을 만들지 않는다.**
- 지원: ① 조회 캐시(플래너/할일/캘린더, 과거 30일~향후 60일) ② 타이머 세션 로컬 기록 후 업로드(append-only라 충돌 없음) ③ 할일·계획 완료 체크 큐
- 미지원(온라인 전용): 일정 신규 생성·수정·삭제, Google 연동, 통계, 권한 변경
- 충돌 정책: **last-write-wins.** 충돌 선택 UI 없음 (version 컬럼 활성화는 필요해질 때)
- **iPad PWA 필수 조건**: 홈 화면 설치 전제(미설치 Safari는 7일 미사용 시 IndexedDB 삭제 가능), `navigator.storage.persist()` 호출, 동기화 상태 표시(마지막 동기화 시각 / 대기 건수)

## Phase 4 — Google Calendar 단방향 연동
- 플래너 → Google Calendar **단방향만**. 양방향(웹훅 감지·충돌 처리)은 이후 별도 검토
- **인증 방식: 서비스 계정(Service Account)** — 사용자가 콘솔에서 키 JSON 발급 완료(`GOOGLE_SERVICE_ACCOUNT_JSON`).
  OAuth 동의 화면·refresh token·7일 만료 문제가 전부 없음. 대신 **대상 캘린더를 서비스 계정 이메일(client_email)에
  '일정 변경' 권한으로 공유**해야 접근 가능
- 대상 캘린더 (chchun88@gmail.com, `.env.example` 참조):
  - 가족일정 `98e2q06atf3dj191l6082akbd8@group.calendar.google.com`
  - 시윤일정 `e8dvccsduienguqdva8ek23e7g@group.calendar.google.com`
- 이벤트 생성 후 `google_event_id`를 자체 DB에 저장 (수정·삭제에 필수), `google_sync_status`(pending/synced/failed)로 재시도 관리
- 키 JSON은 git 커밋 금지(.gitignore 등록됨), 서버 환경변수로 경로 지정

## Phase 5 — Vercel 배포 (Neon + 서버리스 + Blob) ✅ 완료
- 상세: `specs/005-deploy-vercel/`. 로컬 개발(PGlite)은 그대로, 프로덕션만 서버리스로.
- DB: **Neon PostgreSQL**(풀드 연결). PGlite는 로컬 전용 — Vercel은 디스크가 없어 PGlite 불가
- 백엔드: Hono 앱을 `server/app.ts`로 추출 → 로컬 node-server / Vercel `api/index.ts` 두 진입점 공유
  (bare `api/` 함수는 캐치올 파일명을 지원하지 않아 rewrite `/api/(.*) → /api` + 메서드별 named export 방식)
- **메모 이미지: Vercel Blob** — DB엔 URL만 저장(base64 dataURL 폐기), bootstrap 경량화.
  오프라인 표시는 SW 런타임 캐싱(CacheFirst `blob-images`, 30일)
- 서버리스 보정: Google push·blob 삭제를 `waitUntil`로(응답 후 유실 방지), 부팅 재시도를 Vercel Cron으로
  (`/api/cron/retry-gcal`, CRON_SECRET 보호), 프로덕션 Secure 쿠키, 집계 경계는 서버 TZ 무관 KST 계산
- 스키마·시드는 `npm run db:setup` 1회 스크립트로 Neon에 적용(매 요청 실행 금지)
- 배포 절차는 README "Vercel 배포" 절 참조

## 이후 검토 (백로그)
> 2026-07-21부로 `docs/BACKLOG.md`로 이관·통합 관리한다. 아래는 이관된 원본 목록.
- 오프라인 일정 편집 + version 기반 충돌 감지 + 충돌 선택 UI
- Google Calendar 양방향 동기화 (push notification 웹훅)
- 반복일정 recurrence_rule + 예외 테이블 방식 전환
- 학생 다수/선생님 조회 → 권한 테이블(`planner_permissions`) 도입
