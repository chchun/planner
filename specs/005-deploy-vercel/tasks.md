# Tasks 005 — Phase 5 작업 목록

> 순서 주의: T41(Blob 이미지)은 로컬에서 단독 검증 가능 → 먼저. 이후 서버리스·Neon·배포.
> 각 작업 = 체크 + 커밋. Claude Code CLI 세션이 바뀌어도 이 문서만 보고 이어갈 수 있게 DoD 명확히.

- [x] **T41. 메모 이미지 → Vercel Blob** (R-41)
  `@vercel/blob` 설치, `server/blob.ts`(put/del + blobEnabled), `POST /api/memos/image`,
  MemoComposer 업로드를 dataURL→파일 전송으로 변경, 메모 삭제 시 blob del(waitUntil 준비 전이면 그냥 await)
  *DoD: 로컬 .env에 BLOB_READ_WRITE_TOKEN 넣고 이미지 업로드 → memos.image에 URL 저장, bootstrap에 dataURL 없음, 새로고침 유지. 토큰 없으면 이미지 버튼 비활성*

- [x] **T42. 서버리스 어댑터 + waitUntil + 쿠키** (R-42)
  `server/app.ts`로 앱 조립 추출, `server/index.ts`는 이를 사용, `api/[[...route]].ts`(hono/vercel, runtime nodejs),
  `waitUntilCompat` 헬퍼로 gcal push/삭제·blob del 감싸기, 프로덕션 Secure 쿠키
  *DoD: 로컬 `npm run server` 기존과 동일 동작(회귀 없음), 타입체크·빌드 통과*

- [x] **T43. Neon 셋업 스크립트 + 크론 재시도** (R-43)
  `scripts/db-setup.ts` + `npm run db:setup`(CREATE TABLE + seedIfEmpty), `GET /api/cron/retry-gcal`(CRON_SECRET),
  `api` 진입점에서 부팅 로직 제거 확인
  *DoD: DATABASE_URL로 Neon에 스키마·시드 성공, 크론 엔드포인트가 비밀 헤더 검증 후 재시도*

- [x] **T44. Vercel 배포 설정 + 배포 E2E** (R-44)
  `vercel.json`(빌드·crons·rewrite), `.env.example` 갱신, Vercel 프로젝트 env 등록, 프리뷰 배포
  *DoD: 배포본에서 로그인→메모 이미지 업로드/표시→새로고침 유지, 숙제 등록→구글 캘린더 반영, 캘린더 조회 표시*

- [x] **T45. 오프라인 이미지 캐싱 + 문서 마무리** (R-45)
  workbox runtimeCaching(blob 호스트 CacheFirst), README/ROADMAP 배포 절차 갱신
  *DoD: 이미지 메모 로드 후 오프라인 전환 시 이미지 유지, 문서에 배포 따라하기 반영*

## 착수 전 사용자 준비물 (제공/생성 필요)
- [ ] Neon 프로젝트 생성 → **풀드 `DATABASE_URL`**(`-pooler` 포함)
- [ ] Vercel 프로젝트 생성(이 GitHub repo 연결) + **Vercel Blob 스토어** → `BLOB_READ_WRITE_TOKEN`
- [ ] Vercel 프로젝트 환경변수에 `GOOGLE_SERVICE_ACCOUNT_JSON`·`GCAL_*`·`CRON_SECRET` 등록
- [ ] (T41만 먼저 로컬 검증하려면) 로컬 `.env`에 `BLOB_READ_WRITE_TOKEN`만 있어도 됨
