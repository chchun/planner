# Codex CLI 핸드오프 가이드

이 폴더를 **Git 리포지토리 루트**에 넣고 Codex CLI로 개발을 진행합니다.
Antigravity와 달리 Codex CLI는 터미널 기반 에이전트라 아래 흐름을 따릅니다.

## 0. 준비물
- OpenAI Codex CLI 설치: `npm i -g @openai/codex` (또는 `brew install codex`)
- 로그인: `codex login` (ChatGPT 계정 또는 `OPENAI_API_KEY`)
- Node 18+ / 프로젝트용 패키지 매니저(npm·pnpm 등)

## 1. 리포 구성
Codex는 리포 안의 파일을 직접 읽습니다. 아래처럼 배치하세요.

```
my-study-app/                ← git init 한 리포 루트에서 codex 실행
├─ AGENTS.md                 ← Codex가 자동으로 읽는 규칙 파일 (핵심)
├─ docs/
│   ├─ SPEC.md               ← 화면·상태·인터랙션 명세
│   ├─ TOKENS.md             ← 디자인 토큰
│   └─ prototype.html        ← 실행 가능한 목업 (시각 기준)
└─ (Codex가 생성할 소스)
```

이 `handoff/` 폴더의 파일을 위 구조로 복사하면 됩니다:
- `AGENTS.md` → 리포 루트
- `SPEC.md`, `TOKENS.md`, `prototype.html` → `docs/`

> **AGENTS.md가 핵심입니다.** Codex CLI는 세션 시작 시 리포 루트(및 상위/하위)의 `AGENTS.md`를
> 자동으로 읽어 항상 지침으로 삼습니다. 매번 프롬프트에 규칙을 붙일 필요가 없습니다.

## 2. 실행
리포 루트에서:

```bash
codex          # 대화형 TUI 시작
```

첫 지시 예시(그대로 붙여넣기):

```
docs/SPEC.md 와 docs/TOKENS.md 를 읽고, docs/prototype.html 을 브라우저로 열었을 때의
화면을 기준으로 React + TypeScript + Tailwind 앱을 세팅해줘.
먼저 프로젝트 구조 · tailwind.config · 공유 Context 설계를 제안하고 내 승인을 받은 뒤 시작해.
화면은 대시보드부터 하나씩 완성하고 각 단계마다 멈춰서 확인받아.
```

이후 화면 단위로 이어서 지시:
```
다음은 플래너 화면(SCR-04)을 SPEC.md 5장 기준으로 구현해줘. 시각은 prototype.html의 플래너 탭을 따라.
```

## 3. 유용한 플래그
- `codex --model gpt-5-codex` : 모델 지정
- `codex "..."` : 한 줄 작업을 비대화형으로 실행
- `/approvals` (TUI 내) : 파일 쓰기·명령 실행 승인 모드 조정
- 승인 모드는 처음엔 **수동 승인**으로 두고, 신뢰되면 자동 적용으로 올리는 걸 권장

## 4. 팁
- `prototype.html`은 **파일 자체**를 리포에 두세요. Codex가 열어 마크업·인라인 스타일을 직접 참조합니다(스크린샷보다 정확).
- 한 번에 전체를 시키지 말고 **화면 단위**로 나눠 커밋하면 품질이 올라갑니다.
- 색·간격이 어긋나면 "docs/prototype.html 과 docs/TOKENS.md 를 그대로 따르라"고 재지시.
- 각 화면 완성 후 `git commit` 하도록 시키면 롤백이 쉽습니다.
