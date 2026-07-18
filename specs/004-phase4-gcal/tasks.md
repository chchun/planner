# Tasks 004 — Phase 4 작업 목록

- [x] **T31. 인증 모듈** — env 로딩(base64 키), JWT→access token(캐시), gcalEnabled 가드 (R-31)
  *DoD: 단독 실행으로 토큰 발급 성공*
- [x] **T32. 숙제 push** — 스키마 ALTER, 생성/삭제 훅, 부팅 재시도 (R-32)
  *DoD: curl 생성 → 구글 캘린더에 이벤트, 삭제 → 구글에서 제거*
- [x] **T33. 조회 병합** — 2개 캘린더 list(5분 캐시) → bootstrap 병합, [가족] 접두어 (R-33)
  *DoD: bootstrap에 구글 일정 포함, 캘린더 화면 표시*
- [x] **T34. 검증 + 커밋** — plan §검증 1~5, 키 미설정 무동작 확인, 타입체크·빌드
  *DoD: spec 004 수용 기준 전부 체크*
