# 학습 플래너 (Study Planner)

고등학생 학습 관리 웹앱. **Spec-Driven Development(SDD)** 방식으로 구현했다.
iPad(학생 주 단말)를 1순위로, PC 웹(부모)·안드로이드 폰(부모 보조)을 지원하며,
iPad가 오프라인일 때도 조회·타이머·완료 체크가 동작하고, 학습 일정을 Google Calendar와 단방향 연동한다.

> **iPhone은 타깃이 아니다.** 문서·코드의 "모바일"은 안드로이드 Chrome 세로 기준이다.

---

## 목차
1. [주요 기능](#주요-기능)
2. [시스템 구조](#시스템-구조)
3. [기술 스택](#기술-스택)
4. [사전 준비](#사전-준비)
5. [빠른 시작](#빠른-시작)
6. [환경 변수](#환경-변수)
7. [Google Calendar 연동 설정](#google-calendar-연동-설정)
8. [디렉토리 구조](#디렉토리-구조)
9. [데이터 모델 / API](#데이터-모델--api)
10. [오프라인 동작](#오프라인-동작)
11. [빌드 · 배포](#빌드--배포)
12. [개발 방식(SDD)과 문서 지도](#개발-방식sdd과-문서-지도)
13. [자주 겪는 문제](#자주-겪는-문제)

---

## 주요 기능

| 화면 | 내용 |
|---|---|
| **대시보드** | 이월 숙제, 마감 임박 타임라인(D-Day 배지), 오늘의 할 일(서브태스크 아코디언) |
| **플래너** | 06~24시 세로 시간표(과목색), 과목별 계획 체크, 오늘 목표 vs 실제 공부시간 |
| **타이머** | 과목별 공부시간 측정(동시 1과목), 주간 막대 그래프. 세션 단위 서버 기록 |
| **캘린더** | 월간(상세 패널/바텀시트) + 주간(풀스크린). 로컬 일정 + Google Calendar(가족일정·시윤학원) 병합 표시 |
| **메모 보드** | 카드/리스트 뷰, 폴더 필터, 이미지 업로드, 완료·삭제 |
| **등록 모달** | 숙제 등록(납기 필수 검증). 납기 있는 숙제는 Google Calendar로 자동 push |

- **역할**: 학생(타이머 기록 가능) / 부모(조회 + 메모 등 등록, 타이머 기록 불가)
- **오프라인(iPad)**: 조회 캐시 + 완료 체크·타이머 큐잉 → 네트워크 복구 시 자동 동기화

---

## 시스템 구조

```
   ┌─────────────────────┐        ┌─────────────────────┐        ┌──────────────────────┐
   │  iPad PWA (학생)     │        │  PC 웹 (부모)        │        │ 안드로이드 폰 (부모)  │
   │  오프라인 캐시+큐    │        │  온라인 전용         │        │  온라인 전용          │
   │  (IndexedDB)         │        │                     │        │                      │
   └──────────┬──────────┘        └──────────┬──────────┘        └──────────┬───────────┘
              │                              │                              │
              └──────────────┬───────────────┴──────────────┬──────────────┘
                             │  HTTPS / 세션 쿠키 (httpOnly) │
                             ▼                              
                   ┌──────────────────────────────┐
                   │   백엔드 API 서버 (Hono, :3001)│
                   │   인증 · 권한 · 데이터 · 집계   │
                   └───────┬───────────────┬───────┘
                           │               │
                           ▼               ▼
              ┌────────────────────┐   ┌─────────────────────────┐
              │  PostgreSQL (원본)  │   │  Google Calendar         │
              │  개발: PGlite 파일  │   │  가족일정 / 시윤학원      │
              │  운영: DATABASE_URL │   │  (서비스 계정, 단방향)    │
              └────────────────────┘   └─────────────────────────┘
```

**원칙**
- PostgreSQL이 항상 **원본 데이터**. Google Calendar는 연동 대상, IndexedDB는 오프라인 임시 저장소.
- 브라우저는 DB에 직접 접속하지 않는다 — 반드시 API 경유.
- 데이터 접근은 `src/data/repository.ts` 한 곳으로 격리 → 저장소를 바꿔도 화면 코드는 그대로.

---

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프론트엔드 | React 18 · TypeScript(strict) · Vite · Tailwind CSS · Zustand |
| 백엔드 | Node.js · Hono · raw SQL(파라미터 바인딩) |
| DB | **PGlite**(개발, 설치 불필요) / **PostgreSQL**(운영, `DATABASE_URL`) |
| 인증 | bcryptjs 해시 · 랜덤 토큰 세션(httpOnly 쿠키 30일) |
| 오프라인 | IndexedDB 스냅샷 + 쓰기 큐 · vite-plugin-pwa(Service Worker) |
| 외부 연동 | Google Calendar API(서비스 계정 JWT, 외부 라이브러리 없음) |
| 폰트 | Pretendard |

---

## 사전 준비

- **Node.js 20 이상** (`process.loadEnvFile` 사용). 확인: `node --version`
- **npm** (Node에 포함)
- (선택) **Google 서비스 계정 키** — 캘린더 연동을 쓸 경우에만. 없어도 앱은 정상 동작(연동만 비활성)
- (운영 시) **PostgreSQL** 인스턴스 — 개발은 PGlite라 불필요

> PostgreSQL이나 Docker를 로컬에 설치할 필요가 **없다.** 개발용 DB(PGlite)는 npm 설치만으로 동작한다.

---

## 빠른 시작

```bash
# 1) 클론 & 의존성 설치
git clone https://github.com/chchun/planner.git
cd planner
npm install

# 2) (선택) 환경 변수 — 캘린더 연동을 쓸 때만
cp .env.example .env
#   .env 의 GOOGLE_SERVICE_ACCOUNT_JSON 등을 채운다 (아래 "환경 변수" 참조)

# 3) 백엔드 API 서버 (터미널 1) — 첫 실행 시 테이블 생성 + 시드 자동
npm run server
#   → [server] listening on http://localhost:3001
#   → [gcal] 연동 활성  (또는 "비활성 (키 미설정)")

# 4) 프론트엔드 개발 서버 (터미널 2)
npm run dev
#   → http://localhost:5173  (/api 요청은 자동으로 :3001 로 프록시)
```

브라우저에서 **http://localhost:5173** 접속.

### 데모 계정 (비밀번호 공통 `planner123`)

| 아이디 | 역할 | 비고 |
|---|---|---|
| `siyoon` | 학생 전시윤 | 타이머 기록 가능 |
| `mom` | 학부모(엄마) | 조회·등록, 타이머 기록 불가 |
| `dad` | 학부모(아빠) | 조회·등록, 타이머 기록 불가 |

> ⚠️ 데모 비밀번호는 **운영 전 반드시 변경**한다. 계정 정의는 `server/seed.ts`.

---

## 환경 변수

`.env`(git 커밋 금지)에 설정한다. `.env.example`을 복사해서 쓴다.

| 변수 | 필수 | 설명 |
|---|---|---|
| `DATABASE_URL` | 아니오 | 설정하면 실제 PostgreSQL 사용, 미설정이면 PGlite(`./data/pg`) |
| `PORT` | 아니오 | API 서버 포트(기본 3001) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 아니오 | 서비스 계정 키 JSON을 **base64 인코딩**한 값(원본 JSON 문자열도 허용) |
| `GCAL_FAMILY_ID` / `GCAL_FAMILY_LABEL` | 아니오 | 가족일정 캘린더 ID / 표시 라벨 |
| `GCAL_STUDENT_ID` / `GCAL_STUDENT_LABEL` | 아니오 | 시윤학원 캘린더 ID / 표시 라벨 |

키 관련 변수가 없으면 캘린더 연동만 꺼지고 나머지 기능은 모두 동작한다.

---

## Google Calendar 연동 설정

**인증은 서비스 계정 방식**이다(사용자 OAuth 동의·refresh token 7일 만료 문제 없음).

1. Google Cloud Console → 프로젝트에서 **Google Calendar API** 사용 설정
2. **서비스 계정** 생성 → 키(JSON) 발급
3. 연동할 캘린더(가족일정, 시윤학원) 각각을 **서비스 계정 이메일(`client_email`)에 "일정 변경" 권한으로 공유**
   - (조회만 할 캘린더라면 "모든 일정 세부정보 보기"로 충분)
4. 키 JSON을 base64로 인코딩해 `.env`의 `GOOGLE_SERVICE_ACCOUNT_JSON`에 넣는다
   - 예: `node -e "console.log(Buffer.from(require('fs').readFileSync('key.json')).toString('base64'))"`
5. 캘린더 ID(`...@group.calendar.google.com`)를 `GCAL_*_ID`에 설정
6. `npm run server` 재시작 → 로그에 `[gcal] 연동 활성` 확인

**동작**
- 납기 있는 숙제를 등록하면 시윤학원 캘린더에 `[숙제] 제목` 이벤트가 생성된다(마감 30분 전~마감).
- 할일 삭제 시 구글 이벤트도 삭제된다.
- 가족일정·시윤학원의 이번 달 일정이 앱 캘린더 화면에 병합 표시된다(읽기 전용, 서버 5분 캐시).
- push 실패해도 앱 동작은 막지 않으며, 서버 재기동 시 `pending`/`failed` 항목을 자동 재시도한다.

---

## 디렉토리 구조

```
planner/
├─ index.html                Vite 진입, PWA 메타
├─ vite.config.ts            React + PWA 플러그인, /api → :3001 프록시
├─ tailwind.config.js        디자인 토큰(docs/TOKENS.md 매핑)
├─ .env.example              환경 변수 템플릿
│
├─ server/                   백엔드 (Hono)
│  ├─ index.ts               부팅: env 로드 → DB init → seed → 서버 → 캘린더 재시도
│  ├─ db.ts                  PGlite/pg 어댑터, 스키마(CREATE TABLE)
│  ├─ seed.ts                초기 데이터(실행일 기준 상대 날짜)
│  ├─ auth.ts                로그인/세션/인증 미들웨어
│  ├─ routes.ts              API 라우트(bootstrap, todos, plan, memos, timer)
│  ├─ google.ts              서비스 계정 JWT 인증 + Calendar API 호출
│  └─ gsync.ts               숙제 push / 삭제 / 부팅 재시도
│
├─ src/                      프론트엔드 (React)
│  ├─ app/                   App, AppShell(사이드바/탭바/헤더)
│  ├─ screens/               Dashboard · Planner · Timer · Calendar · Memo · Login
│  ├─ components/            RegisterModal · SyncStatus · icons
│  ├─ store/                 useAppStore.ts (Zustand — 상태 + 서버 연동 + 오프라인)
│  ├─ data/                  types · repository(API) · api(fetch) · offline(큐) · constants
│  └─ lib/                   time · date · dday(D-Day 파생) · useNow · idb(IndexedDB)
│
├─ public/icons/             PWA 아이콘
├─ docs/                     ROADMAP · SPEC · TOKENS · prototype.html(UI 정본)
└─ specs/                    SDD 문서 (constitution + Phase 1~4 spec/plan/tasks)
```

---

## 데이터 모델 / API

### 주요 테이블 (`server/db.ts`)
- `users`, `sessions` — 계정, 세션
- `subjects` — 과목(이름·색)
- `todos`(+`todo_subtasks`) — 할일. `due_at`, 소프트삭제 `deleted_at`, `version`(예약), `google_event_id`/`google_sync_status`
- `plan_items` — 과목별 학습 계획
- `timetable_blocks` — 시간표 블록
- `calendar_events` — 로컬 일정
- `memos` — 메모
- `timer_sessions` — 타이머 세션(started_at~ended_at, **append-only**)

> 시간은 전부 `TIMESTAMPTZ`(UTC 저장). 삭제는 소프트삭제. `version`은 향후 충돌 감지용 예약 컬럼.

### API 개요 (`/api`, 로그인 제외 전부 인증 필요)
| 메서드 · 경로 | 설명 |
|---|---|
| `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | 인증 |
| `GET /bootstrap` | 로그인 후 초기 데이터 일괄(과목+집계, 할일, 계획, 시간표, 이번달 일정+구글, 메모, 주간 통계) |
| `POST/PATCH/DELETE /todos[/:id]` | 할일 생성/완료/삭제 |
| `PATCH /todos/:id/subtasks/:sid` | 서브태스크 체크 |
| `PATCH /plan/:id` | 계획 완료 |
| `POST/PATCH/DELETE /memos[/:id]` | 메모 |
| `POST /timer/sessions` | 타이머 세션 기록(**학생만**) |

**타이머 시간 계산 원칙**: 경과 시간을 `setInterval` 카운트로 누적하지 않는다. 시작 시각(`startedAt`) 타임스탬프 기준으로 `현재시각 − startedAt + 누적`을 계산한다(iPad Safari 백그라운드 정지 대응). `setInterval`은 화면 갱신용으로만 사용한다.

---

## 오프라인 동작

iPad는 온라인 우선 + 제한적 오프라인을 지원한다(범용 동기화 엔진은 만들지 않음).

| 동작 | 오프라인 |
|---|---|
| 전 화면 조회 | ✅ IndexedDB 스냅샷 캐시 |
| 할일·서브태스크·계획 **완료 체크** | ✅ 큐잉 → 복구 시 전송(같은 항목은 마지막 상태만) |
| 타이머 세션 기록 | ✅ 큐잉(append-only, 모두 전송) |
| 메모 이미지 표시 | ✅ SW 런타임 캐시(CacheFirst `blob-images`, 30일 — 한 번 본 이미지) |
| 신규 생성(숙제 등록·메모 추가·이미지 업로드), 삭제, 로그인 | ❌ 온라인 전용(UI 비활성 + 안내) |

- 충돌 정책: last-write-wins(충돌 UI 없음)
- 네트워크 복구(또는 수동 "지금 동기화") 시 큐를 FIFO 전송 후 서버 최신 데이터 재로드
- **PWA 설치 필수**: iOS는 미설치 Safari의 IndexedDB를 7일 미사용 시 삭제할 수 있음. 홈 화면 추가 + `navigator.storage.persist()` 사용
- 개발 모드(`npm run dev`)에서는 Service Worker가 비활성이라 "앱 셸 오프라인 로드"는 빌드 배포본에서 확인

---

## 빌드 · 배포

```bash
npm run typecheck   # 타입 검사
npm run build       # tsc + vite build → dist/ (PWA sw.js + manifest 포함)
npm run preview     # 빌드 결과 로컬 미리보기
```

### Vercel 배포 (Phase 5)

프로덕션은 **정적 프론트(dist) + `/api` 서버리스 함수(Node) + Neon Postgres + Vercel Blob** 구성이다.
로컬 개발 흐름(PGlite + `npm run server`/`npm run dev`)은 배포와 무관하게 그대로 동작한다.

1. **Vercel 프로젝트 생성** — 이 GitHub repo를 연결(framework: Vite 자동 감지, `vercel.json` 포함됨)
2. **스토리지 준비** — [Neon](https://neon.tech) 프로젝트(풀드/언풀드 연결 문자열), Vercel Storage → Blob 스토어 생성
3. **환경변수 등록** (Vercel 프로젝트 Settings → Environment Variables)
   - `DATABASE_URL` = Neon **풀드**(-pooler) 연결 문자열
   - `BLOB_READ_WRITE_TOKEN` (스토어 프리픽스로 발급되면 `PLAN_BLOB_READ_WRITE_TOKEN`도 인식)
   - `GOOGLE_SERVICE_ACCOUNT_JSON`(base64), `GCAL_FAMILY_ID/LABEL`, `GCAL_STUDENT_ID/LABEL`
   - `CRON_SECRET` = 랜덤 문자열 (크론 엔드포인트 보호 — Vercel Cron이 Bearer로 자동 첨부)
   - 시간대: `TZ`는 Vercel 예약 변수라 설정 불가 — 집계 경계(오늘/주/월)는 코드에서 KST로 계산한다
4. **스키마·시드 1회 적용** — 로컬에서 `.env`에 `NEON_DATABASE_URL_UNPOOLED`(언풀드) 넣고 `npm run db:setup`
5. **배포** — `git push`(연결된 repo면 자동) 또는 `npx vercel deploy --prod`
6. **배포 후 확인** — 로그인 → 메모 이미지 업로드·새로고침 유지 → 숙제(납기) 등록 → 구글 캘린더 반영
   - 캘린더 재시도 크론: `vercel.json`의 `0 18 * * *`(UTC) = KST 새벽 3시, Hobby 플랜은 1일 1회·실행 시각 ±1시간 오차 허용

**운영 전 체크리스트**
- [ ] 데모 비밀번호 변경
- [ ] 배포 후 공부시간 집계(오늘/주간)가 KST 기준으로 맞는지 확인
- [ ] iPad에서 홈 화면 설치 → 오프라인 동작·타이머·동기화 실기기 확인

---

## 개발 방식(SDD)과 문서 지도

모든 기능은 **Spec → Plan → Tasks → Implement** 순서로 진행하고, 각 단계 산출물을 승인받은 뒤 다음으로 넘어간다.

| 문서 | 역할 |
|---|---|
| `specs/constitution.md` | 프로젝트 헌장 — 모든 spec보다 우선하는 불변 원칙 |
| `specs/00N-*/{spec,plan,tasks}.md` | Phase별 요구사항 / 기술 설계 / 작업 목록 |
| `docs/ROADMAP.md` | Phase 2~4 아키텍처 방향 |
| `docs/SPEC.md` · `docs/TOKENS.md` | 화면 상세 명세 · 디자인 토큰 |
| `docs/prototype.html` | 실행 가능한 목업 — **시각 기준의 원본** |
| `CLAUDE.md` | 코드 작성 규칙(세션 자동 로드) |

**구현 이력**

| Phase | 내용 | 커밋 |
|---|---|---|
| 1 | 프론트엔드 UI (mock 데이터) | `a2605f4` |
| 2 | 백엔드 + 전 기능 서버 연동 | `e482207` |
| 3 | iPad 오프라인 + PWA | `4511e20` |
| 4 | Google Calendar 단방향 연동 | `9628e2e` |

---

## 자주 겪는 문제

- **로그인 후 화면이 안 뜬다** → API 서버(`npm run server`)가 떠 있는지 확인. `/api` 프록시는 Vite dev 서버가 처리.
- **DB를 초기 상태로 되돌리고 싶다** → API 서버 중지 후 `data/` 폴더 삭제 → 재기동하면 재시드.
- **캘린더 연동이 안 된다** → 서버 로그에 `[gcal] 연동 활성`인지, 캘린더가 서비스 계정 이메일에 공유됐는지 확인.
- **`process.loadEnvFile is not a function`** → Node 20 미만. Node 20+로 업그레이드.
- **타이머가 백그라운드에서 시간이 안 맞는다** → 정상 설계상 발생하지 않아야 함(타임스탬프 기준). 재현되면 버그.

---

_이 프로젝트는 Claude Code와 함께 SDD 방식으로 개발되었습니다._
