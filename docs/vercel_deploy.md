# Vercel 배포 구조 (운영 문서)

> Phase 5(specs/005-deploy-vercel) 완료 시점(2026-07-19) 기준의 **현재 배포 상태** 기록.
> 배포 절차(따라하기)는 README "빌드 · 배포" 절, 설계 배경은 `specs/005-deploy-vercel/plan.md` 참조.

## 계정 · 프로젝트

| 항목 | 값 |
|---|---|
| Vercel 계정 | **chchun88@gmail.com** (CLI 사용자명 `jeon28`, 팀 슬러그 `dalbus-projects`) |
| Vercel 프로젝트 | **planner** (`prj_TaHQIGEArNoo5KPI4k6CVI9Tud6w`) |
| 프로덕션 URL | **https://planner-three-livid.vercel.app** (별칭: `planner-dalbus-projects.vercel.app`) |
| GitHub 저장소 | https://github.com/chchun/planner (푸시 시 자동 배포) |
| standalone 태그 | `v1.0_standalone` — 서버리스 전환 직전(PGlite/Node 단독) 스냅샷 |
| 함수 리전 | iad1 (기본값) / Node.js 런타임 |

## 배포 아키텍처

```
브라우저 (iPad PWA / PC / 안드로이드)
   │ HTTPS · 세션 쿠키(HttpOnly + Secure + SameSite=Lax)
   ▼
Vercel Edge (vercel.json rewrites)
   ├─ /api/(.*)  ──▶  서버리스 함수 api/index.ts (Hono buildApp, 전 API 단일 함수)
   ├─ 정적 파일   ──▶  dist/ (Vite 빌드: 앱 셸 + sw.js + manifest)
   └─ 그 외      ──▶  /index.html (SPA fallback)
                        │
        ┌───────────────┼──────────────────────┐
        ▼               ▼                      ▼
  Neon PostgreSQL   Vercel Blob          Google Calendar API
  (원본 데이터)      (메모 이미지 파일)     (서비스 계정 JWT, 단방향)
```

- **로컬 개발은 이 구조와 무관** — PGlite + `npm run server`(3001) + `npm run dev`(5173) 그대로.
- 서버리스 함수는 부팅 로직이 없다. 스키마·시드는 `npm run db:setup`(로컬에서 1회), 재시도는 크론.
- 응답 후 백그라운드 작업(캘린더 push/삭제, Blob 삭제)은 `waitUntil`로 완료를 보장한다.
- 시간대: 서버리스는 UTC — 오늘/주/월 집계 경계는 코드에서 KST로 계산(`TZ` env는 Vercel 예약어라 사용 불가).

## 저장소별 저장 내용 · 시점

### Neon PostgreSQL — 원본 데이터 (전부 여기)
- **연결**: `DATABASE_URL`(풀드, `-pooler` 포함) — 서버리스 커넥션 폭주 방지. 모듈 스코프 풀을 웜 인스턴스가 재사용
- **테이블**: users, sessions, subjects, todos, todo_subtasks, plan_items, timetable_blocks, calendar_events, memos, timer_sessions
- **언제 쓰는가**:
  - 로그인 → sessions에 토큰(30일) 생성 / 로그아웃 → 삭제
  - 숙제·서브태스크 등록/체크/삭제, 계획 체크, 메모 등록/완료/삭제(soft delete), 타이머 세션 기록 — 각 API 호출 즉시
  - 숙제 push 결과(`google_event_id`, `google_sync_status`) 갱신
  - 매 요청 조회: bootstrap(전 화면 데이터 일괄), 인증 미들웨어의 세션 확인
- **주의**: 이미지 바이너리는 저장하지 않는다 — `memos.image`엔 Blob **URL 문자열만**

### Vercel Blob — 메모 이미지 파일
- **스토어**: 프로젝트 연결 Blob 스토어(발급 토큰이 `PLAN_BLOB_*` 프리픽스일 수 있음 — 코드가 폴백 인식)
- **경로/접근**: `memos/<uuid>`, `access: public` (공개 URL `https://<store>.public.blob.vercel-storage.com/memos/…`)
- **언제 쓰는가**:
  - **업로드**: 메모 작성 중 이미지 선택 즉시 `POST /api/memos/image` → `put()` → URL 반환(메모 저장 전)
  - **삭제**: 메모 삭제 시 image가 Blob URL이면 `del()` (waitUntil, 실패해도 앱 삭제는 진행)
- **오프라인**: SW가 CacheFirst(`blob-images`, 30일/200개)로 캐시 — 한 번 본 이미지는 오프라인에서도 표시

### Google Calendar — 단방향 연동 대상 (chchun88@gmail.com 소유 캘린더)
- **인증**: 서비스 계정 JWT(`GOOGLE_SERVICE_ACCOUNT_JSON`). 대상 캘린더가 서비스 계정 이메일에 "일정 변경" 권한으로 공유되어 있어야 함
- **언제 쓰는가**:
  - 납기 있는 숙제 등록 → **시윤학원** 캘린더에 `[숙제] 제목` 이벤트 생성(waitUntil) / 숙제 삭제 → 이벤트 삭제
  - bootstrap 조회 시 **가족일정 + 시윤학원**의 당월 일정 병합(읽기, 인스턴스별 5분 캐시)
  - push 실패분은 크론이 재시도

## 환경 변수 (Vercel 프로젝트 Production — 값은 대시보드에서만 확인)

| 변수 | 용도 · 사용 시점 |
|---|---|
| `DATABASE_URL` | Neon **풀드** 연결 문자열 — 모든 API 요청의 DB 접근 |
| `BLOB_READ_WRITE_TOKEN` | Blob put/del — 이미지 업로드·메모 삭제 시 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스 계정 키(base64) — 캘린더 push/조회 시 JWT 서명 |
| `GCAL_FAMILY_ID` / `GCAL_FAMILY_LABEL` | 가족일정 캘린더 ID·표시 라벨 — 조회 병합 |
| `GCAL_STUDENT_ID` / `GCAL_STUDENT_LABEL` | 시윤학원 캘린더 ID·표시 라벨 — 숙제 push + 조회 병합 |
| `CRON_SECRET` | `/api/cron/retry-gcal` 인증 — Vercel Cron이 `Authorization: Bearer`로 자동 첨부, 수동 호출은 `x-cron-secret` 헤더 |

로컬 `.env`에만 있는 값: `NEON_DATABASE_URL`(풀드, 로컬에서 Neon 붙여볼 때), `NEON_DATABASE_URL_UNPOOLED`(`db:setup` 전용), `PLAN_BLOB_*`(동일 토큰의 프리픽스 발급본).

## 크론

| 항목 | 값 |
|---|---|
| 경로 | `GET /api/cron/retry-gcal` |
| 스케줄 | `0 18 * * *` (UTC) = **매일 KST 03:00** — Hobby 플랜 1일 1회 제한 내, 실행 시각 ±1시간 오차 허용 |
| 동작 | `google_sync_status`가 pending/failed인 숙제를 캘린더로 재push, `{ ok, retried }` 반환 |

## 운영 작업 모음

```bash
npx vercel deploy --prod        # 수동 프로덕션 배포 (git push 시엔 자동)
npx vercel logs <deployment>    # 함수 런타임 로그
npx vercel env ls production    # 환경변수 목록 확인
npm run db:setup                # Neon 스키마·시드 (로컬에서, NEON_DATABASE_URL_UNPOOLED 사용)
```

- 스키마 변경 시: `server/db.ts`의 SCHEMA 수정 → `npm run db:setup` 재실행(CREATE TABLE IF NOT EXISTS / ALTER … IF NOT EXISTS 멱등)
- 시드 초기화: Neon 콘솔에서 테이블 비우고 `db:setup` (seedIfEmpty는 users가 비어있을 때만 시드)
- 무료 tier 확인 포인트: Neon 저장/컴퓨트 한도, Blob 용량 — 이미지가 커지면 Blob부터 참
