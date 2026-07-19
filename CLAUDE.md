# CLAUDE.md — 학습 관리 웹앱

> Claude Code가 세션마다 자동으로 읽는 프로젝트 규칙이다. 항상 준수한다.
> (AGENTS.md는 Codex CLI용 구버전 규칙이다. 내용이 충돌하면 이 파일이 우선한다.)

## 프로젝트 목표
고등학생 학습 관리 웹앱을 **Spec-Driven Development(SDD)** 방식으로 구현한다.
Phase 1은 **React + TypeScript + Tailwind CSS** 프론트엔드(mock 데이터)이며,
`docs/prototype.html`이 시각·레이아웃·인터랙션의 최종 기준이다. 애매하면 목업을 그대로 따른다.

## 개발 방식: SDD 워크플로
모든 기능 개발은 아래 순서를 따르고, **각 단계 산출물을 사용자에게 승인받은 뒤** 다음 단계로 넘어간다.

1. **Spec** (`specs/<번호-기능명>/spec.md`) — 요구사항 + 수용 기준(Acceptance Criteria). "무엇을"만 정의
2. **Plan** (`specs/<번호-기능명>/plan.md`) — 기술 설계: 구조, 상태, 데이터, 구현 전략. "어떻게"를 정의
3. **Tasks** (`specs/<번호-기능명>/tasks.md`) — 순서 있는 작업 목록. 각 작업은 독립적으로 완료·검증 가능해야 함
4. **Implement** — tasks.md 순서대로 구현. 작업 하나 완료 = 체크 표시 + 의미 있는 단위로 커밋

- 구현 중 spec/plan과 어긋나는 결정이 필요하면 **코드를 우회하지 말고 문서를 먼저 고친 뒤** 진행한다.
- 현재 진행 중인 spec: `specs/005-deploy-vercel/` (Phase 1~4 완료, 배포 단계)

## 문서 지도
| 문서 | 역할 |
|---|---|
| `specs/constitution.md` | 프로젝트 헌장 — 모든 spec보다 우선하는 불변 원칙 |
| `specs/001-phase1-ui/` | Phase 1 (프론트엔드 UI) spec / plan / tasks |
| `docs/SPEC.md` | 화면별 상세 명세 (컴포넌트, 상태, 인터랙션, mock 규격) — spec.md가 참조 |
| `docs/TOKENS.md` | 디자인 토큰 → `tailwind.config` 매핑 |
| `docs/prototype.html` | 실행 가능한 목업. **시각 기준의 원본** |
| `docs/ROADMAP.md` | Phase 2~4 아키텍처 방향 (백엔드/오프라인/Google Calendar) |

## 기술 규칙
- React 18 + TypeScript(strict), Tailwind CSS, Vite. 폰트는 Pretendard
- 상태: 화면 로컬은 `useState`, 과목/타이머/메모 등 공유 데이터는 Context 1개(또는 Zustand)
- 타깃 단말 우선순위 — **iPhone은 타깃이 아니다**:
  1. **iPad(가로)** — 학생 주 단말. 사이드바 레이아웃. 모든 화면은 iPad를 먼저 구현·검증
  2. **PC 웹(데스크톱 브라우저)** — 부모(엄마·아빠)가 조회 + 데이터 등록(메모 등). 사이드바 레이아웃 공유, 넓은 화면에서 깨지지 않게
  3. **안드로이드 폰(세로, Chrome)** — 부모 보조 단말. 하단 탭바 + FAB 모바일 레이아웃
- 컴포넌트는 `docs/SPEC.md` 9장의 분해안을 따라 파일 단위로 분리
- Phase 1은 mock 데이터로 동작하되, **데이터 접근은 repository 함수로 격리**해 Phase 2 API 교체 지점을 명확히 남긴다
- 접근성: 히트영역 44px 이상, 시맨틱 태그, 키보드 포커스

## 핵심 기능 주의사항
- **타이머: 시간 누적을 `setInterval` 카운트로 하지 않는다.** 시작 시각(`startedAt`) 타임스탬프 기반으로
  `현재시각 - startedAt + 누적`을 계산한다. `setInterval`은 화면 표시 갱신에만 사용하고 언마운트 시 clear.
  (iPad Safari는 백그라운드에서 JS를 정지시키므로 interval 누적은 시간이 유실된다.)
  동시 1과목만 진행, 과목 색상은 플래너/타이머/그래프 공유
- 등록 모달: 납기일시(`datetime-local`) 필수 검증 — 미입력 저장 시 인라인 에러 + 테두리 red + 제출 차단.
  공용 폼을 iPad·PC 다이얼로그 / 모바일 바텀시트로 감쌀 것
- 캘린더: 월간(상세 패널/바텀시트) + 주간(풀스크린, 각 날짜 칸에 세부 일정 직접 표시)
- 메모 보드: 카드뷰/리스트뷰 전환, 폴더 필터, 이미지 업로드(File API dataURL), 삭제. 이미지는 있을 때만 렌더

## 작업 방식
- 한 번에 전체를 만들지 말고 tasks.md의 작업 단위로 완성하고 멈춰서 확인받는다
- 각 작업 완료 후 의미 있는 단위로 커밋한다 (커밋 전 타입체크 + 빌드 통과 확인)
- 파일을 새로 만들거나 명령을 실행하기 전 사용자 승인 흐름을 존중한다
