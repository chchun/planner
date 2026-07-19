# Spec 005 — Phase 5: Vercel 배포 (Neon + 서버리스 + Blob 이미지)

> 목표: 앱을 Vercel에 무료로 배포한다. 그 과정에서 메모 이미지를 **Vercel Blob**으로 옮기고,
> DB를 **Neon PostgreSQL**로, 백엔드를 **서버리스 함수**로 전환한다.
> **로컬 개발 흐름(PGlite + `npm run server`/`npm run dev`)은 그대로 유지한다.**

## 범위
- 포함: 메모 이미지 Blob 저장, 서버리스 어댑터 전환, Neon 연결, 부팅 로직 대체(스키마 셋업 스크립트·재시도 크론),
  Google push의 `waitUntil` 보정, 프로덕션 쿠키 보안, 오프라인 이미지 캐싱, 배포 설정·문서
- 제외: 양방향 캘린더 동기화, 커스텀 도메인, CI 파이프라인

## 요구사항

### R-41 메모 이미지 → Vercel Blob
- [ ] 이미지 업로드 시 파일을 Vercel Blob에 저장하고, `memos.image`에는 **공개 URL만** 저장(더 이상 base64 dataURL 저장 안 함)
- [ ] `bootstrap`·메모 조회 응답에 dataURL이 실리지 않는다(URL만 — 페이로드 경량화)
- [ ] Blob 토큰 미설정(로컬 등)이면 업로드가 명확히 실패/비활성 처리되고 텍스트 메모는 정상
- [ ] 메모 삭제 시 Blob 파일도 삭제(실패해도 앱 삭제는 진행)

### R-42 서버리스 전환
- [ ] Hono 앱을 Vercel 서버리스 함수(`/api/*`, Node 런타임)로 서빙 — 프론트는 정적 빌드
- [ ] 로컬은 기존대로 `npm run server`(node-server)로 동일 앱 구동(엔트리 2개, 앱 로직 공유)
- [ ] Google push/삭제의 fire-and-forget을 **`waitUntil`**로 보정 — 응답 후 함수 종료로 인한 유실 방지
- [ ] 프로덕션 세션 쿠키에 `Secure` 적용(HTTPS)

### R-43 Neon DB + 부팅 로직 대체
- [ ] `DATABASE_URL`(Neon 풀드 연결)로 프로덕션 동작 — 로컬 PGlite와 동일 SQL
- [ ] 스키마 생성·시드는 **매 요청이 아니라** 1회 셋업 스크립트(`npm run db:setup`)로 Neon에 적용
- [ ] 부팅 시 캘린더 재시도(`retryPendingSyncs`)를 **Vercel Cron** 엔드포인트로 이전(비밀 헤더 보호)

### R-44 배포 · 검증
- [ ] `vercel.json`/프레임워크 설정으로 정적 프론트 + `/api` 함수 동시 서빙
- [ ] 환경변수(Neon·Blob·Google) Vercel 프로젝트 시크릿으로 주입
- [ ] 배포본에서 로그인→메모 이미지 업로드→표시→새로고침 유지, 숙제 등록→구글 캘린더 반영 확인

### R-45 오프라인 이미지 캐싱
- [ ] Service Worker가 Blob 이미지 URL을 캐시(CacheFirst)해 오프라인에서도 이미지 표시
- [ ] 오프라인 메모 생성은 기존대로 비활성(Phase 3 범위 유지 — 이미지 업로드는 온라인 전용)

## 비기능
- 클라이언트 번들·API 응답에 Blob 토큰/서비스계정 키가 포함되지 않을 것
- 로컬 개발은 인터넷·계정 없이도 가능해야 함(PGlite + Blob 미설정 시 텍스트 메모)
- 무료 tier 한도 고려: DB에 이미지 바이너리 저장 금지(URL만), bootstrap 경량 유지
