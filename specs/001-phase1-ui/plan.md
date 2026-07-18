# Plan 001 — Phase 1 기술 설계

> `spec.md`의 요구사항을 구현하는 방법(How). 구현 전 사용자 승인 필요.

## 스택
- **Vite** + React 18 + TypeScript(strict)
- Tailwind CSS — `docs/TOKENS.md`를 `tailwind.config` `theme.extend`로 매핑
- 상태: **Zustand 스토어 1개** (과목·타이머·할일·메모 등 공유 상태) + 화면 로컬 `useState`
  - Context 대신 Zustand를 쓰는 이유: 타이머 1초 갱신이 전역 리렌더를 유발하지 않도록 selector 구독이 필요
- 라우팅: 탭 5개뿐이므로 라우터 라이브러리 없이 스토어의 `activeTab` 상태로 전환 (URL 필요해지면 Phase 2에서 도입)
- 폰트: Pretendard (CDN), 타이머 숫자 `tabular-nums`

## 디렉토리 구조
```
src/
├─ app/            App.tsx, AppShell(사이드바/탭바/헤더)
├─ screens/        Dashboard/ Planner/ Timer/ Calendar/ Memo/  (SPEC.md §9 분해안대로 하위 컴포넌트)
├─ components/     RegisterModal(공용 RegisterForm + Dialog/BottomSheet 래퍼), 공용 UI(Chip, Card, Checkbox…)
├─ store/          useAppStore.ts (Zustand)
├─ data/
│   ├─ types.ts    도메인 타입 (Subject, Todo, PlanBlock, CalendarEvent, Memo, TimerSession…)
│   ├─ repository.ts  데이터 접근 인터페이스 — Phase 1은 mock 반환, Phase 2에서 API 구현체로 교체
│   └─ mock.ts     docs/SPEC.md §8 + prototype.html state 기준 mock 데이터
└─ lib/            time.ts(fmtHMS/fmtHM/fmtMin, 타이머 계산), date.ts(달력 그리드 생성)
```

## 핵심 설계 결정

### 1. 타이머 — 타임스탬프 기반 (spec R-04, constitution §4)
```ts
type TimerState = {
  runningSubject: string | null;
  startedAt: number | null;        // Date.now() — 시작 시각
  accumulated: Record<string, { todaySec: number; weekSec: number }>; // 정지 시점까지 확정된 누적
};
// 표시값 = accumulated + (running ? (Date.now() - startedAt) / 1000 : 0)
```
- `setInterval(1s)`은 **표시 리렌더 트리거로만** 사용. 언마운트/정지 시 clear
- `visibilitychange` 복귀 시에도 위 식으로 자동 복구됨 (iPad Safari 백그라운드 정지 대응)
- 과목 전환 = 이전 과목 정지(경과분을 accumulated에 확정) → 새 과목 startedAt 기록

### 2. Repository 격리 (constitution §3)
```ts
// data/repository.ts — UI는 이 함수들만 호출
export const repo = {
  getTodos: (): Todo[] => mock.todos,          // Phase 2: fetch('/api/todos')
  getCalendarEvents: (): CalendarEvent[] => …,
  …
};
```
Phase 1은 동기 mock 반환이지만 시그니처는 Phase 2 교체를 고려해 함수 경유로 통일.

### 3. 플래너 타임라인 배치
06:00~24:00 = 18h. 컨테이너 높이 기준 `top = (start - 6h) / 18h * 100%`, `height = duration / 18h * 100%`.
prototype.html의 블록 스타일을 그대로 따른다.

### 4. 반응형 전략 — iPad 우선
- **각 화면은 iPad(가로) 레이아웃을 먼저 완성·검증한 뒤 PC → 모바일 순으로 맞춘다.** 하위 순위 대응이 iPad 레이아웃을 훼손하면 안 됨
- 분기점: Tailwind `lg`(1024px) — 이상=사이드바 레이아웃(iPad·PC 공유), 미만=모바일(탭바+FAB)
- PC(1280px+): 사이드바 레이아웃에 콘텐츠 최대폭(`max-w-*`) 컨테이너를 적용해 초광폭에서도 목업 비율 유지
- 모바일 기준 단말은 **안드로이드 Chrome**(부모 폰). iOS Safari 특유 이슈는 iPad에서만 고려하면 됨
- RegisterModal: `useMediaQuery` 없이 CSS로 두 래퍼 중 하나 표시(폼 상태는 공용 컴포넌트에 유지)
- 바텀시트/모달 모션은 TOKENS.md 수치 그대로 (translateY 0.28s / scale pop 0.24s)

### 5. 메모 이미지
`FileReader.readAsDataURL` → 스토어에 dataURL 문자열 저장. Phase 1은 새로고침 시 소실 허용(mock 단계).
영속화는 Phase 2(서버 업로드)에서 처리.

## 검증 방법
- 각 화면 완성 시 dev 서버로 prototype.html과 나란히 비교 — 뷰포트 우선순위:
  ① **iPad 1024×768 가로(기준)** ② PC 1280×800~1920×1080 ③ 안드로이드 세로 412×915(Chrome)
- 타이머 R-04 백그라운드 기준: 시작 → 탭 전환 30초 → 복귀 시 표시값이 실제 경과와 일치하는지 확인
- 커밋 전 `tsc --noEmit` + `vite build` 통과

## 리스크 / 미결
- prototype.html의 모바일 메모 진입 방식이 애매하면 구현 전 목업 재확인 후 사용자에게 질문
- 주간 캘린더 풀스크린의 모바일 표현(가로 스크롤 vs 세로 스택)은 목업 기준 확정
- PC 전용 뷰포트(1280px+)는 목업에 없음 — 사이드바 레이아웃 확장으로 처리하되 어색한 화면은 사용자 확인
