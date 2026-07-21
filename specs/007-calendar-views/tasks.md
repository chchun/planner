# Tasks 007 — 캘린더 뷰 확장

- [x] T71. 서버: `end_at` 컬럼 추가(db.ts) + 구글 end 파싱(google.ts) + bootstrap `endAt` 응답(routes.ts) + 시드 종료 시각(seed.ts) — R-75
- [x] T72. 타입·스토어: `CalendarEvent.endAt`, `DayEvent` 확장, `calMode`에 `agenda` 추가 — R-71/74 기반
- [x] T73. Calendar/index.tsx: DayEvent 맵에 endAt·색·분(min) 계산, 뷰 토글 월/주/일정 — R-71, R-74
- [x] T74. WeekGrid.tsx 재작성: 시간축 타임그리드(블록 배치, 겹침 분할, 현재 시각 선, 가로 스크롤) — R-72
- [x] T75. AgendaList.tsx 신규: 아젠다 리스트(색 점/시간 범위/제목, 지난 날짜 흐림, 오늘 강조) — R-73
- [x] T76. DayDetail 색 공유 + 타입체크·빌드 통과 확인, 문서 갱신(CLAUDE.md 진행 상태, CHANGELOG) — R-74, AC-7
