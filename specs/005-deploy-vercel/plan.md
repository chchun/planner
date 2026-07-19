# Plan 005 — Phase 5 기술 설계

## 전략: 로컬은 그대로, 프로덕션만 서버리스
- **로컬 개발**: PGlite + `npm run server`(node-server) + `npm run dev`(Vite) — 변경 없음. 인터넷·계정 없이 동작
- **프로덕션(Vercel)**: 정적 프론트(dist) + `/api` 서버리스 함수(Node 런타임) + Neon Postgres + Vercel Blob
- 두 진입점이 **같은 Hono 앱**을 공유하도록 앱 구성을 `server/app.ts`로 추출

## 앱 구조 리팩터링
```
server/
  app.ts      ← Hono 앱 조립(라우트·미들웨어) — 신규, 순수 함수 buildApp()
  index.ts    ← 로컬 전용: buildApp() + @hono/node-server + initDb/seed/retry (기존 부팅 로직)
api/
  [[...route]].ts  ← Vercel 전용: buildApp() + hono/vercel handle(), export runtime='nodejs'
```
- `api/[[...route]].ts`는 부팅 로직을 실행하지 않는다(서버리스엔 부팅이 없음). 스키마/시드는 별도 스크립트, 재시도는 크론.

## R-41 메모 이미지 → Vercel Blob
- 의존성: `@vercel/blob`. 토큰: `BLOB_READ_WRITE_TOKEN`(Vercel 자동 주입, 로컬은 .env)
- 업로드 흐름 변경:
  - 클라이언트: 파일 선택 → `POST /api/memos/image`(multipart 또는 base64 body)로 **파일 전송**(dataURL을 memo에 넣지 않음)
  - 서버: `put(`memos/${uuid}`, file, { access: 'public' })` → `{ url }` 반환
  - 클라이언트: 받은 url로 미리보기 표시, 메모 생성 시 `image = url`
- `memos.image`는 그대로 TEXT(이제 dataURL 대신 URL). 스키마 변경 없음
- 삭제: 메모 soft delete 시 `image`가 blob URL이면 `del(url)`(실패 무시)
- 가드: `blobEnabled()` — 토큰 없으면 업로드 엔드포인트가 501/명확한 에러, UI는 이미지 버튼 비활성 + 안내

## R-42 서버리스 · waitUntil · 쿠키
- `hono/vercel`의 `handle(app)`, `export const runtime = "nodejs"`(pg·node:crypto·bcrypt 필요 → edge 불가)
- **waitUntil**: `@vercel/functions`의 `waitUntil()`로 `pushTodoEvent`/`deleteTodoEvent`/blob del을 감싼다.
  로컬(node-server)에는 waitUntil이 없으므로 `waitUntilCompat(p)` 헬퍼: Vercel이면 waitUntil, 아니면 그냥 `void p`
- 쿠키: `Secure`를 프로덕션에서만 켠다(`process.env.VERCEL` 또는 `NODE_ENV==='production'`). SameSite=Lax 유지(같은 오리진)

## R-43 Neon · 스키마 셋업 · 크론
- DB 드라이버: 기존 `pg` 유지, **Neon 풀드 연결 문자열**(`...-pooler...`) 사용 → 서버리스 커넥션 폭주 방지
  - `db.ts`는 `DATABASE_URL` 있으면 `pg.Pool` — 이미 구현됨. 서버리스에선 모듈 스코프 풀 1개 재사용(웜 인스턴스 공유)
- 스키마·시드: `scripts/db-setup.ts` 신규 → `npm run db:setup`으로 로컬에서 Neon에 1회 실행(CREATE TABLE + seedIfEmpty)
- 재시도 크론: `GET /api/cron/retry-gcal` — `x-cron-secret` 헤더 검증 후 `retryPendingSyncs()`.
  `vercel.json` crons에 등록(Hobby는 1일 1회). 추가로 bootstrap에서 기회적 재시도는 선택

## R-45 오프라인 이미지 캐싱
- `vite.config.ts`의 workbox `runtimeCaching`에 CacheFirst 규칙 추가:
  `urlPattern: ({url}) => url.hostname.endsWith('.public.blob.vercel-storage.com')`, cacheName `blob-images`, 만료 30일
- 오프라인 메모 생성/이미지 업로드는 비활성 유지(Phase 3). 캐시는 표시 전용

## R-44 배포 설정
- `vercel.json`: 빌드는 Vite 프레임워크 프리셋(output `dist`), `/api`는 함수. crons 등록. 필요 시 rewrite로 SPA fallback
- 환경변수(Vercel 프로젝트): `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GCAL_*`, `CRON_SECRET`
- `.env.example`에 위 항목 반영

## 검증
1. 로컬: `.env`에 Blob 토큰만 넣고 이미지 업로드 → Blob URL 저장·표시 확인(Neon 없이 PGlite로도 가능)
2. `npm run db:setup`으로 Neon 스키마·시드 → `DATABASE_URL`로 로컬 서버 붙여 동작 확인
3. Vercel 프리뷰 배포 → 로그인/메모이미지/숙제 push/캘린더 조회 E2E
4. 오프라인: 이미지 있는 메모 로드 후 오프라인 전환 → 이미지 표시 유지(SW 캐시)
5. 크론 엔드포인트 수동 호출로 재시도 동작 확인

## 리스크 / 메모
- 인메모리 캐시(구글 토큰·5분 list)는 서버리스 콜드스타트마다 소멸 → 구글 호출 소폭 증가(가족용 규모라 무방)
- Neon 무료: 저장 0.5GB·컴퓨트 한도. 이미지가 Blob로 빠지므로 DB는 가벼움. Blob 무료 tier 용량도 확인
- 로컬 PGlite ↔ Neon 미세 차이 가능성 → db:setup + 프리뷰에서 조기 검증
- 서버리스 함수 첫 콜드스타트 지연은 PC/안드로이드가 체감(iPad는 오프라인 캐시가 완충)
