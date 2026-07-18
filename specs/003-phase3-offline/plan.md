# Plan 003 — Phase 3 기술 설계

## 저장소
- **IndexedDB** 최소 keyval 래퍼 직접 구현(`lib/idb.ts`, get/set/del — 의존성 없음, ~30줄)
- 키 2개: `snapshot`(bootstrap 전체 + 저장 시각), `syncQueue`(SyncQueueItem[])
- 스냅샷 저장: 스토어 subscribe → 데이터 키 변경 시 500ms 디바운스로 저장 (별도 저장 호출 불필요)

## 온라인 감지 / 오류 구분
- `api.ts`에 **NetworkError**(fetch 거부 = 네트워크 단절) 추가 — AuthError(401)·일반 오류와 구분
- `navigator.onLine` + `online`/`offline` 이벤트 + 요청 실패 시 오프라인 전환. online 이벤트 → 자동 flush

## 쓰기 경로 (스토어)
- 헬퍼 `sendOrQueue(item)`: 온라인이면 즉시 API 호출, NetworkError면 오프라인 전환+큐 저장, 오프라인이면 바로 큐 저장
- 큐 항목: ROADMAP SyncQueueItem — `{id, entityType: 'todo'|'subtask'|'plan'|'timer', entityId, operation, payload, createdAt, retryCount}`
- **합치기**: todo/subtask/plan 토글은 같은 entityId 기존 항목을 교체(마지막 상태만). timer는 항상 append
- flush: FIFO 전송(재시도 1회) → 전부 성공 시 bootstrap 재로드 + lastSyncAt 갱신. 부분 실패 시 남은 큐 유지
- 초기화: 캐시 스냅샷 로드 → 온라인이면 flush→bootstrap. 오프라인이면 스냅샷으로 status ready(offline)

## UI
- `SyncStatus` 컴포넌트: ● 온라인/오프라인 · 대기 N건 · 마지막 동기화 HH:MM · 클릭 = 지금 동기화
  배치: iPad·PC 사이드바 하단(프로필 위), 모바일 헤더 날짜 옆 점 표시 + 탭바 위 배너(오프라인일 때만)
- 등록 모달 저장 버튼·메모 추가 버튼: 오프라인이면 disabled + "오프라인 — 연결 후 등록 가능"

## PWA
- **vite-plugin-pwa**(workbox precache, registerType autoUpdate). `/api/*`는 NetworkOnly(캐시 금지)
- manifest: name 학습 플래너, display standalone, theme #4f46e5, 아이콘 192/512 PNG + apple-touch-icon(180)
  (아이콘은 브랜드색 단색 PNG를 스크립트로 생성해 `public/icons/`에 커밋)
- index.html: `apple-mobile-web-app-capable`, `theme-color` 메타. main.tsx: `navigator.storage.persist()`
- 개발 모드에서는 SW 비활성(vite 기본) — 앱 레벨 캐시·큐는 dev에서도 동작. SW 오프라인 로드는 build+preview로 확인

## 검증 방법
1. 온라인 로드 → API 서버 중지 → 새로고침(dev: vite가 살아있으므로 앱은 뜨고 bootstrap 실패) → 캐시로 표시 확인
2. 서버 중지 상태에서 할일 체크·타이머 기록 → 대기 건수 표시 확인
3. 서버 재기동 → 자동/수동 동기화 → 서버 DB에 반영 + 대기 0건 확인
4. `vite build` + preview로 SW 등록·manifest 확인

## 리스크
- iPad 실기기 홈 화면 설치·백그라운드 동작은 배포 후 실기기에서 최종 확인 필요(시뮬레이션 한계)
- 세션 쿠키 30일 만료 시 오프라인 로그인 불가는 스펙대로 허용(R-21 안내 문구)
