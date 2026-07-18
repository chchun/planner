# 학습 관리 앱 — 개발 핸드오프 패키지 (Codex CLI)

OpenAI **Codex CLI**로 개발하기 위한 자료 묶음입니다.

## 포함 파일
| 파일 | 배치 위치 | 용도 |
|---|---|---|
| `AGENTS.md` | 리포 **루트** | Codex CLI가 세션마다 자동으로 읽는 프로젝트 규칙 (핵심) |
| `CODEX_GUIDE.md` | (참고용) | Codex CLI 설치·실행·리포 구성 가이드 |
| `CODEX_PROMPTS.md` | (참고용) | Codex 실행 후 붙여넣을 단계별 작업 요청 프롬프트 |
| `SPEC.md` | `docs/` | 화면별 컴포넌트 구조·상태·인터랙션·mock 규격 |
| `TOKENS.md` | `docs/` | 컬러/폰트/간격/모션 디자인 토큰 |
| `prototype.html` | `docs/` | 실행 가능한 목업 (한 파일, 오프라인). 시각·인터랙션의 최종 기준 |

## 빠른 시작
1. `CODEX_GUIDE.md`의 리포 구조대로 파일 배치 (AGENTS.md는 루트, 나머지는 docs/)
2. 리포 루트에서 `codex` 실행
3. Codex가 AGENTS.md를 자동 인식 → SPEC/TOKENS/prototype 기준으로 구현
4. 화면 하나씩(대시보드→플래너→타이머→캘린더→메모→등록모달) 나눠 진행

## 화면 목록
대시보드 · 플래너(스터디 플래너) · 타이머(열품타 스타일) · 캘린더(월간/주간) · 메모 보드 · 숙제 등록 모달
