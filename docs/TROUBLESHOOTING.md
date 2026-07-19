# 트러블슈팅

> 운영 중 발생한 문제의 **현상 → 원인 → 해결 → 예방**을 기록한다. 새 문제가 생기면 여기에 항목을 추가한다.
> 배포 구조는 `docs/vercel_deploy.md`, 자주 겪는 로컬 개발 문제는 README "자주 겪는 문제" 참조.

---

## 1. 배포 URL 접속 시 "서버에 연결할 수 없습니다" (2026-07-19, 해결)

**현상**
- https://planner-zeta-nine.vercel.app 접속 시 로그인 화면 대신 "서버에 연결할 수 없습니다" 표시
- 프론트(정적 페이지)는 뜨지만 모든 `/api/*` 요청이 404 (`X-Vercel-Error: NOT_FOUND`)

**원인** — 두 가지가 겹침
1. **Vercel 프로젝트가 2개 존재** (계정 혼동):
   - `chchun88@gmail.com` 계정(팀 chchuns-projects)의 planner → planner-zeta-nine (Neon 통합·Blob 스토어가 여기 연결)
   - `jeon28` 계정(팀 dalbus-projects)의 planner → planner-three-livid (CLI가 이 계정으로 로그인돼 있어 Phase 5가 여기로 배포됐었음)
2. zeta-nine에는 **Phase 5 이전(standalone) 코드**가 배포돼 있었음 — `api/` 서버리스 함수가 없는 프론트만 있는 빌드
   → 모든 API 호출이 404 → 앱 initialize가 예외 처리로 "서버에 연결할 수 없습니다" 표시

**해결**
1. CLI를 chchun88 계정으로 재로그인 — 새 로그인은 **디바이스 코드 승인** 방식이라, 승인 링크를 여는 브라우저 세션의 계정으로 로그인됨.
   대상 계정으로 로그인된 브라우저(또는 시크릿 창)에서 승인해야 함
2. `.vercel` 폴더 삭제 후 `vercel link --yes --project planner` — **이전 계정 링크가 남아 있으면 CLI가 "Not authorized"** 를 냄
3. 부족한 환경변수 등록(`GOOGLE_SERVICE_ACCOUNT_JSON`, `GCAL_*`, `CRON_SECRET`) — DB(Neon 통합)·Blob(`PLAN_BLOB_*`)은 이미 연결돼 있었음
4. `vercel deploy --prod` 로 Phase 5 코드 배포
5. Neon 통합 env는 **Sensitive라 로컬로 값을 가져올 수 없어** `npm run db:setup` 불가
   → `GET /api/admin/db-setup`(CRON_SECRET 보호, 멱등) 엔드포인트를 추가해 배포 후 원격으로 스키마·시드 1회 실행
6. E2E 확인: 로그인(Secure 쿠키) → bootstrap → 이미지 업로드(Blob) → 캘린더 병합 → 크론 200/401

**예방**
- 배포·env 작업 전 `npx vercel whoami` + `npx vercel projects ls`로 계정·프로젝트 확인
- 계정을 바꾸면 반드시 `.vercel` 삭제 후 재링크
- jeon28 계정의 planner(three-livid)는 폐기 대상 — 삭제 전까지 혼동 주의

---

## 2. Vercel 서버리스 함수 라우팅·런타임 이슈 모음 (2026-07-19, 해결 — T44에서 발견)

**현상** → **원인/해결** 요약 (자세한 경위는 커밋 `e003860`)

| 현상 | 원인 | 해결 |
|---|---|---|
| `/api/*` 전부 404 (`NOT_FOUND`) | bare `api/` 함수는 `[[...route]]`/`[...route]` 캐치올 파일명 미지원(Next.js 전용) | `api/index.ts` 단일 함수 + `vercel.json` rewrite `/api/(.*) → /api` |
| POST만 404, GET은 동작 | `[...route].ts`가 단일 세그먼트 동적 라우트로 취급됨 | 위와 동일 |
| 함수 500 `ERR_MODULE_NOT_FOUND: /var/task/server/app` | Node ESM 런타임은 확장자 없는 상대 import를 못 찾음 | `server/*`·`api/`의 상대 import에 `.js` 확장자 부여 |
| 응답이 안 오고 타임아웃 | 런타임이 default export를 `(req,res)` 시그니처로 취급, 반환된 web `Response` 무시 | `handle(app)`을 GET/POST/… **메서드별 named export**로 노출 |
| 집계(오늘/주간)가 9시간 어긋날 위험 | 서버리스는 UTC, `TZ` env는 Vercel 예약어라 설정 불가 | 코드에서 KST 경계 계산 + SQL `AT TIME ZONE 'Asia/Seoul'` |

---

## 템플릿 (새 항목 추가용)

```markdown
## N. <제목> (YYYY-MM-DD, 상태)

**현상**
- 사용자/시스템에서 관찰된 것

**원인**
- 근본 원인

**해결**
1. 조치 순서

**예방**
- 재발 방지 방법
```
