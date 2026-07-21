# Plan 007 — 캘린더 뷰 확장 기술 설계

## 데이터 흐름
```
DB calendar_events(start_at, end_at?) ─┐
Google Calendar(start/end.dateTime) ───┤→ bootstrap events[{id,title,type,startAt,endAt?,source}]
                                       └→ store.events → Calendar/index.tsx에서 일(day)별 DayEvent 맵 구성
```

## 서버 변경
1. **db.ts** — `ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;`
   (spec 006과 같은 멱등 ALTER 패턴, `db:setup`으로 적용)
2. **google.ts** — `GcalEvent`에 `endAt: string | null` 추가. `end.dateTime ?? end.date` 파싱.
3. **routes.ts** — bootstrap 이벤트 SELECT에 `end_at` 포함, 응답에 `endAt` 매핑.
4. **seed.ts** — `ev()`에 종료 시각 파라미터 추가, 수업형 이벤트에 종료 시각 부여
   (마감형 `hw`는 NULL 유지 = 시점성 이벤트).

## 클라이언트 변경

### 타입 (`data/types.ts`)
- `CalendarEvent.endAt?: string | null`
- `DayEvent`를 확장: `{ time, endTime: string | null, startMin, endMin: number | null, title, type, color, source }`
  — 캘린더 화면 전용 파생 타입이므로 여기서 미리 계산해 하위 컴포넌트는 그리기만 한다.

### 스토어 (`store/useAppStore.ts`)
- `calMode: "month" | "week" | "agenda"` 로 확장. 그 외 변경 없음.

### 색 규칙 (R-74)
`Calendar/index.tsx`에 `eventColor(type, source)` 헬퍼:
hw→#f97316, google-family→#10b981, google-student→#8b5cf6, 그 외 sched→#3b82f6.
DayEvent 생성 시 color를 심어 하위 컴포넌트(주간/일정/상세)가 공유한다.

### 주간 타임그리드 (`Calendar/WeekGrid.tsx` 재작성)
- 레이아웃: 좌측 시간 거터(44px) + 7일 열. 헤더(요일+날짜)와 본문 그리드.
  본문은 `position: relative` 열에 이벤트 블록을 `position: absolute`로 배치.
- 상수 `HOUR_PX = 48`. `top = (startMin - gridStartMin) / 60 * HOUR_PX`,
  `height = max(28, (endMin - startMin) / 60 * HOUR_PX)`. endMin 없으면 start+60분.
- 시간 범위: `startHour = min(8, floor(주 최소 시작시)ed)`, `endHour = max(22, ceil(주 최대 종료시))`.
- 겹침 분할: 시작시각 정렬 → 겹침 클러스터 내 lane 배정(각 이벤트는 끝난 lane 재사용).
  블록 폭 = `100%/laneCount`, left = `lane * 폭`.
- 현재 시각 선: `useNow(calMode==="week")` 사용, 오늘 열에만 빨간 선 + 좌측 점.
- 반응형: 그리드 min-width 640px, 바깥 `overflow-x-auto` (모바일 가로 스크롤, R-72).
  기존 모바일 카드 스택 마크업은 제거(타임그리드로 대체).

### 일정 뷰 (`Calendar/AgendaList.tsx` 신규)
- 입력: `events: Record<number, DayEvent[]>` (필터 적용 후).
- 일정 있는 날짜 오름차순으로 행 렌더. 행 = 날짜 캡슐(오늘=파란 원) + `M월, 요일` +
  일정 줄들(색 점 / `HH:MM~HH:MM` / 제목).
- `day < today.day` → 행 전체 `opacity` 낮춰 흐리게. 오늘 행 위에 빨간 상단 보더.

### Calendar/index.tsx
- DayEvent 맵 구성 시 endAt·color·startMin·endMin 계산 (기존 정렬 유지).
- 토글 `["month","week","agenda"]`, 라벨 월/주/일정.
- rangeLabel: agenda는 `Y년 M월`(월간과 동일).
- 상세 패널/바텀시트는 기존대로 월간 전용.

### DayDetail.tsx
- `detailItems`의 type 기반 색 계산을 `e.color` 사용으로 교체, 시간에 endTime 있으면 `~HH:MM` 병기.

## 검증
- `npm run typecheck` + `npm run build` (커밋 전 필수, CLAUDE.md)
- 수용 기준 1~6은 dev 서버 수동 확인
