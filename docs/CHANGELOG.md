# CHANGELOG

> 날짜별 변경 이력. 새 변경은 맨 위에 추가한다. 커밋 해시는 `git show <해시>`로 상세 확인.

## 2026-07-21

### 캘린더 뷰 확장 (spec 007)
- **뷰 토글 3종**: 월 / 주 / **일정(아젠다)** 추가 — 필터 칩은 세 뷰 공통 적용
- **주간 뷰 재작성**: 구글 캘린더식 시간축 타임그리드 — 시간 길이에 비례한 색 블록,
  겹침 좌우 분할, 오늘 열 현재 시각 빨간 선, 모바일 가로 스크롤
- **일정 뷰 신설**: 날짜별 리스트(색 점 + 시간 범위 + 제목), 지난 날짜 흐림, 오늘 파란 원 강조
- **일정 색상 구분**: 숙제 주황 / 로컬 일정 파랑 / 구글 학생 보라 / 구글 가족 초록 (월간 상세 패널 공유)
- **종료 시각 도입**: `calendar_events.end_at`(nullable) + 구글 `end.dateTime` 수집 + bootstrap `endAt` 응답

## 2026-07-19

### 플래너 날짜별 관리 (spec 006)
- **날짜 네비게이션**: 플래너 상단 `◀ 날짜 ▶` 이동 + "오늘" 복귀 + 년/월/일 선택 팝업 (`c432a8c`)
- **날짜별 계획**: 계획이 날짜에 종속(`plan_items.plan_date`) — 추가(과목·목표분·내용)/삭제/체크 UI (`47ffb7c`, `c432a8c`)
- **요일별 시간표**: 시간표를 요일 템플릿(`timetable_blocks.dow`)으로 — 같은 요일은 매주 동일 (`bc19acf`)
- API: `GET /api/planner?date=`, `POST /api/plan`, `DELETE /api/plan/:id`. 오프라인 시 날짜 이동 비활성(오늘 스냅샷만)

### 화면 개선
- **로그인**: 비밀번호 보기/숨기기 토글, 아이디·비밀번호 저장(localStorage 평문 — 개인 단말 전제),
  저장 시 자동 로그인 후 메모 화면 직행 (`fab5c11`)
- **메모**: 이미지 클릭 시 원본 크기 확대 팝업(라이트박스) (`3d19111`)
- **타이머 주간 공부량**: 그래프(과목별 색상 누적 막대)/표 전환 —
  표는 행=과목+집계, 열=월~일+집계, 소수점 1자리 시간(예: 7.5) (`3d19111`)

### Phase 5 — Vercel 배포 (spec 005)
- **메모 이미지 → Vercel Blob**: DB엔 공개 URL만 저장(dataURL 폐기), 삭제 시 Blob 정리, bootstrap 경량화 (`fc950b1`)
- **서버리스 전환**: `server/app.ts`(buildApp) 공유, Vercel 진입점 `api/index.ts`, `waitUntil` 보정,
  프로덕션 Secure 쿠키 (`0ed6dbd`, `e003860`)
- **Neon PostgreSQL**: `npm run db:setup`(로컬) / `GET /api/admin/db-setup`(원격, CRON_SECRET 보호) 스키마·시드,
  캘린더 재시도 Vercel Cron(`/api/cron/retry-gcal`, 매일 KST 03시) (`b5c79ca`, `5f288d0`)
- **오프라인 이미지 캐싱**: SW CacheFirst(`blob-images`, 30일) (`6a275ca`)
- **집계 KST 고정**: 서버리스 UTC 환경에서도 오늘/주/월 경계를 KST로 계산 (`e003860`)
- **프로덕션 이전**: chchun88 계정 planner 프로젝트(planner-zeta-nine.vercel.app)로 확정,
  jeon28 계정 중복 프로젝트는 폐기 예정 (`5f288d0`) — 경위는 `docs/TROUBLESHOOTING.md`
- 문서: `docs/vercel_deploy.md`(배포 구조), `docs/TROUBLESHOOTING.md`(트러블슈팅) 신설 (`7a55540`, `5f288d0`)
- 태그 **`v1.0_standalone`**: 서버리스 전환 직전(PGlite/Node 단독 실행, Phase 1~4) 스냅샷

### Phase 2~4 (당일 오전)
- **Phase 2 백엔드**: Hono API + PGlite/pg 이중 어댑터, 세션 인증(학생/부모), bootstrap 일괄 조회, 시드 (`e482207`)
- **Phase 3 오프라인**: IndexedDB 스냅샷 조회, 완료 체크·타이머 큐잉, 동기화 상태 표시, PWA (`4511e20`)
- **Phase 4 Google Calendar**: 서비스 계정 JWT 단방향 연동 — 숙제 push/삭제, 가족일정·시윤학원 병합 조회,
  실패 재시도(`google_sync_status`) (`9628e2e`, `6897f0a`)
- 상세 README 작성 (`7c54ab6`)

## 2026-07-18

- **SDD 체계 수립**: constitution + spec/plan/tasks 구조, Phase 2~4 로드맵 (`68d9c68`)
- **Phase 1 프론트엔드**: React 18 + TS + Tailwind + Vite — 대시보드·플래너·타이머·캘린더·메모 5화면(mock),
  iPad 가로 우선 + PC/안드로이드 반응형, 등록 모달(납기 필수 검증), 타임스탬프 기반 타이머 (`a2605f4`)
