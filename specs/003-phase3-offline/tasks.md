# Tasks 003 — Phase 3 작업 목록

- [x] **T21. 저장 기반** — lib/idb.ts, NetworkError, 스냅샷 저장/로드 (R-21)
  *DoD: 새로고침 시 IndexedDB에 스냅샷 존재*
- [x] **T22. 오프라인 초기화** — 스토어 online 상태, 캐시 폴백 초기화, 401 시 캐시 삭제 (R-21)
  *DoD: 서버 중지 상태에서 캐시로 전 화면 조회*
- [x] **T23. 쓰기 큐** — sendOrQueue, 합치기 규칙, flush + bootstrap 재로드 (R-22)
  *DoD: 오프라인 체크→복구→서버 반영·대기 0건*
- [x] **T24. 상태 UI + 생성 비활성** — SyncStatus, 등록/메모 오프라인 비활성 (R-22·23)
  *DoD: 상태 표시·수동 동기화·비활성 문구 확인*
- [x] **T25. PWA** — vite-plugin-pwa, manifest, 아이콘, storage.persist (R-24)
  *DoD: build 후 SW 등록·manifest 유효*
- [x] **T26. 검증** — plan §검증 방법 1~4 수행, 타입체크·빌드, 커밋
  *DoD: spec 003 수용 기준 전부 체크*
