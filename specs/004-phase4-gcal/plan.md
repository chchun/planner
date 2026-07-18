# Plan 004 — Phase 4 기술 설계

## 인증 (외부 라이브러리 없이)
- `server/google.ts`: 서비스 계정 JWT(RS256, node:crypto `createSign`) →
  `POST https://oauth2.googleapis.com/token` (grant_type=jwt-bearer) → access token, 만료 5분 전까지 메모리 캐시
- scope: `https://www.googleapis.com/auth/calendar` (읽기+쓰기)
- 키 파싱: base64 우선, `{`로 시작하면 원본 JSON으로 처리. env는 `process.loadEnvFile('.env')`(Node 20+)
- `gcalEnabled()` — 키·캘린더 ID 없으면 모든 연동 함수가 no-op (R-31)

## Calendar API 호출 (REST fetch)
- insert: `POST /calendar/v3/calendars/{GCAL_STUDENT_ID}/events` — summary "[숙제] {title}", start=due-30m, end=due, timeZone Asia/Seoul
- delete: `DELETE .../events/{eventId}` (404는 성공 취급)
- list: `GET .../events?timeMin&timeMax&singleEvents=true&orderBy=startTime` — 가족·시윤학원 2개, 이번 달 범위, **서버 메모리 5분 캐시**

## 스키마 확장 (todos)
```sql
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_sync_status TEXT;   -- null|pending|synced|failed
ALTER TABLE todos ADD COLUMN IF NOT EXISTS google_sync_error TEXT;
```
부팅 시 스키마 init에 ALTER 포함(기존 DB 무중단 확장). 시드 데이터는 push 대상 아님(신규 생성만).

## 서버 흐름
- `POST /api/todos`: 저장 후 dueAt 있으면 status=pending → 비동기 push → synced(eventId 저장)/failed(에러 저장).
  push는 응답을 막지 않음(fire-and-forget) — R-32 "실패가 생성을 막지 않는다"
- `DELETE /api/todos/:id`: soft delete 후 google_event_id 있으면 구글 삭제 시도
- 부팅 시: `google_sync_status IN ('pending','failed')` AND deleted_at IS NULL 재시도
- bootstrap: 로컬 events + 구글 2개 캘린더 list(캐시)를 병합해 반환.
  구글 이벤트 shape: `{ id, title, type:'sched', startAt, source:'google-family'|'google-student' }`
  가족일정은 title 앞에 "[가족] " 접두어(서버에서 부여). 구글 조회 실패 시 로컬만 반환(로그)

## 클라이언트
- 변경 거의 없음 — events는 기존 흐름 그대로(캘린더 화면·스냅샷 캐시 자동 적용)
- CalendarEvent 타입에 `source?` 추가만. 동기화 뱃지 UI는 이번 범위에서 제외(다음에 필요하면)

## 검증
1. `node`로 인증 단독 테스트(토큰 발급 OK)
2. curl로 할일 생성(납기 포함) → todos.google_sync_status=synced 확인 → **실제 구글 캘린더에서 이벤트 확인**
3. 할일 삭제 → 구글에서도 사라짐 확인
4. bootstrap 응답에 가족·시윤학원 일정 포함 확인, 캘린더 화면 표시 확인
5. 키 제거 상태로 서버 기동 → 전 기능 정상(연동만 무동작) 확인

## 리스크
- 서비스 계정 quota는 넉넉(개인용). list 5분 캐시로 호출 최소화
- 시간대: 이벤트 생성 시 timeZone 명시(Asia/Seoul). 서버 TZ 의존 최소화
