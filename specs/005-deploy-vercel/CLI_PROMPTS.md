# Phase 5 — Claude Code CLI 실행 프롬프트

> 이 파일은 **다른 Claude Code CLI 세션**에 그대로 붙여넣어 Phase 5를 진행하기 위한 프롬프트 모음이다.
> 세션이 바뀌어도 이 저장소의 `specs/005-deploy-vercel/{spec,plan,tasks}.md`와 `CLAUDE.md`를 읽으면
> 전체 맥락을 복구할 수 있다. **작업은 T41 → T45 순서.** 각 작업 후 커밋한다.
> 각 프롬프트는 독립 실행 가능하며, 시작할 때 관련 문서를 먼저 읽도록 지시한다.

---

## 0. 세션 시작 시 (매 새 세션 공통, 한 번)

```
이 저장소는 SDD 방식으로 개발 중이야. 먼저 CLAUDE.md, specs/constitution.md,
specs/005-deploy-vercel/spec.md, plan.md, tasks.md 를 읽고 현재 상태를 파악해줘.
Phase 1~4는 완료됐고 지금은 Phase 5(Vercel 배포)를 tasks.md 순서대로 진행할 거야.
로컬 개발 흐름(PGlite + npm run server / npm run dev)은 절대 깨지 않게 유지해줘.
읽고 나서 T41부터 시작하자.
```

---

## T41 — 메모 이미지를 Vercel Blob으로 (로컬에서 검증 가능)

**선행**: 로컬 `.env`에 `BLOB_READ_WRITE_TOKEN=...` 넣어두면 로컬에서 바로 검증돼.
(토큰은 Vercel 대시보드 → Storage → Blob 생성 후 발급. 없으면 코드만 작성하고 검증은 배포 때.)

```
specs/005-deploy-vercel/tasks.md 의 T41을 구현해줘. 요구사항은 spec.md R-41, 설계는 plan.md R-41 참조.

핵심:
- @vercel/blob 설치
- server/blob.ts 신규: put/del 래퍼 + blobEnabled()(BLOB_READ_WRITE_TOKEN 유무). 토큰 없으면 업로드는 501/명확한 에러
- 서버에 POST /api/memos/image 추가: 파일 받아 put(`memos/${uuid}`, file, {access:'public'}) → { url } 반환
- 클라이언트 src/screens/Memo/MemoComposer.tsx: 파일을 dataURL로 memo에 넣던 걸,
  선택 즉시 /api/memos/image 로 업로드해서 받은 URL을 미리보기·저장에 쓰도록 변경
- memos.image 컬럼은 그대로 TEXT(이제 URL 저장). 스키마 변경 없음
- 메모 삭제 시 image가 blob URL이면 del() 시도(실패 무시)
- 토큰 없을 때 이미지 첨부 버튼은 비활성 + "온라인/설정 필요" 안내

검증(DoD): 로컬 .env에 BLOB_READ_WRITE_TOKEN 넣고 npm run server + npm run dev 로 띄운 뒤
브라우저에서 로그인(siyoon/planner123) → 메모에 이미지 첨부 → 추가 → memos.image에 https URL 저장,
bootstrap 응답에 dataURL(base64) 없음, 새로고침해도 이미지 표시 확인.
타입체크·빌드 통과 후 "feat: T41 메모 이미지 Vercel Blob 저장" 으로 커밋해줘.
```

---

## T42 — 서버리스 어댑터 + waitUntil + 프로덕션 쿠키

```
specs/005-deploy-vercel/tasks.md 의 T42를 구현해줘. spec.md R-42, plan.md R-42 참조.

핵심:
- server/app.ts 신규: Hono 앱 조립(라우트·미들웨어)을 buildApp()으로 추출
- server/index.ts: buildApp()을 쓰도록 리팩터(로컬 부팅 로직 initDb/seed/retry는 여기 유지)
- api/[[...route]].ts 신규: import { handle } from 'hono/vercel'; buildApp()을 handle로 export;
  export const runtime = 'nodejs' (pg·node:crypto·bcrypt 필요, edge 불가). 부팅 로직은 실행하지 않음
- @vercel/functions 설치. waitUntilCompat(p) 헬퍼: Vercel 환경이면 waitUntil(p), 아니면 void p.
  server/gsync.ts의 pushTodoEvent/deleteTodoEvent 호출부(routes.ts)와 blob del을 이 헬퍼로 감싸기
- 세션 쿠키에 Secure 추가(프로덕션에서만: process.env.VERCEL 또는 NODE_ENV==='production'), SameSite Lax 유지

검증(DoD): npm run server + npm run dev 로 기존과 동일 동작(로그인, 할일 체크, 타이머,
메모 이미지, 캘린더 조회 회귀 없음) 확인. 타입체크·빌드 통과 후
"feat: T42 Hono 서버리스 어댑터 + waitUntil + Secure 쿠키" 로 커밋해줘.
```

---

## T43 — Neon 셋업 스크립트 + 크론 재시도

**선행**: Neon 프로젝트의 풀드 `DATABASE_URL`(`-pooler` 포함)을 로컬 `.env`에 넣어두면 검증돼.

```
specs/005-deploy-vercel/tasks.md 의 T43을 구현해줘. spec.md R-43, plan.md R-43 참조.

핵심:
- scripts/db-setup.ts 신규 + package.json "db:setup": "tsx scripts/db-setup.ts".
  DATABASE_URL 대상으로 initDb()(CREATE TABLE) + seedIfEmpty() 1회 실행하고 종료
- GET /api/cron/retry-gcal: 헤더 x-cron-secret === process.env.CRON_SECRET 검증 후 retryPendingSyncs() 실행,
  결과 JSON 반환. 인증 미들웨어 예외로 둠(크론은 세션 없음)
- api/[[...route]].ts 진입점이 부팅 로직(initDb/seed/retry)을 실행하지 않는지 재확인

검증(DoD): 로컬 .env에 Neon DATABASE_URL 넣고 npm run db:setup 실행 → Neon에 테이블·시드 생성 확인
(psql 또는 Neon 콘솔). DATABASE_URL 준 상태로 npm run server 붙여서 로그인 동작 확인.
curl로 x-cron-secret 헤더 주고 /api/cron/retry-gcal 호출 → 200, 잘못된 헤더 → 401 확인.
타입체크·빌드 통과 후 "feat: T43 Neon 셋업 스크립트 + 크론 재시도" 로 커밋해줘.
```

---

## T44 — Vercel 배포 설정 + 배포 E2E

**선행**: Vercel 프로젝트를 이 GitHub repo에 연결하고, 프로젝트 환경변수에
`DATABASE_URL`(Neon 풀드), `BLOB_READ_WRITE_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_JSON`(base64),
`GCAL_FAMILY_ID/LABEL`, `GCAL_STUDENT_ID/LABEL`, `CRON_SECRET` 등록.

```
specs/005-deploy-vercel/tasks.md 의 T44를 구현해줘. spec.md R-44, plan.md R-44 참조.

핵심:
- vercel.json 신규: 빌드는 Vite 프레임워크 프리셋(output dist), /api 는 서버리스 함수,
  crons에 { "path": "/api/cron/retry-gcal", "schedule": "0 18 * * *" } 등록,
  필요 시 SPA fallback rewrite(단, /api/* 는 제외)
- .env.example 갱신: DATABASE_URL, BLOB_READ_WRITE_TOKEN, CRON_SECRET 포함 전체 항목 정리
- 배포 방법을 README 배포 절에 반영(vercel 연결 → env 등록 → db:setup → 배포)

검증(DoD): Vercel 프리뷰(또는 프로덕션) 배포 후 그 URL에서:
로그인 → 메모 이미지 업로드·표시 → 새로고침 유지 → 숙제(납기 포함) 등록 → 구글 캘린더(시윤학원)에 반영 →
캘린더 화면에 가족일정/시윤학원 조회 표시 확인.
"feat: T44 Vercel 배포 설정 + 배포 검증" 으로 커밋해줘.
(주의: 크론 스케줄은 Vercel Hobby가 1일 1회 제한일 수 있음 — 배포 시 경고 나오면 알려줘.)
```

---

## T45 — 오프라인 이미지 캐싱 + 문서 마무리

```
specs/005-deploy-vercel/tasks.md 의 T45를 구현해줘. spec.md R-45, plan.md R-45 참조.

핵심:
- vite.config.ts VitePWA workbox.runtimeCaching 에 Blob 이미지 CacheFirst 규칙 추가:
  urlPattern이 *.public.blob.vercel-storage.com 호스트 매칭, cacheName 'blob-images',
  expiration maxAgeSeconds 30일, cacheableResponse statuses [0,200]
- README.md / docs/ROADMAP.md 의 배포·오프라인 절 최신화(Phase 5 완료 반영)

검증(DoD): npm run build 후 npm run preview 로 띄워서 이미지 있는 메모 로드 →
DevTools에서 오프라인 전환 → 이미지가 계속 표시되는지 확인(Cache Storage에 blob-images 존재).
"feat: T45 오프라인 이미지 캐싱 + 배포 문서 마무리" 로 커밋하고,
specs/005-deploy-vercel/tasks.md 의 T41~T45 체크박스를 모두 [x]로 갱신해줘.
```

---

## 완료 후

```
Phase 5 전체가 끝났으면 specs/005-deploy-vercel/tasks.md 체크 상태를 확인하고,
git push origin main 해줘. 그리고 배포 URL과 남은 수동 확인 항목(iPad 홈 화면 설치 등)을 정리해줘.
```

---

## 참고: 사용자(운영자)가 미리 만들어둘 것
| 항목 | 발급처 | 환경변수 |
|---|---|---|
| Neon Postgres(풀드) | neon.tech → 프로젝트 → Connection string(Pooled) | `DATABASE_URL` |
| Vercel Blob | Vercel → Storage → Blob | `BLOB_READ_WRITE_TOKEN` |
| Google 서비스계정 키(base64) | 이미 보유 | `GOOGLE_SERVICE_ACCOUNT_JSON` |
| 캘린더 ID/라벨 | 이미 보유 | `GCAL_FAMILY_*`, `GCAL_STUDENT_*` |
| 크론 비밀 | 아무 랜덤 문자열 | `CRON_SECRET` |
