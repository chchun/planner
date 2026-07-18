# 디자인 토큰 (TOKENS)

> 시각 스타일의 단일 출처. Tailwind `theme.extend`로 매핑하거나 CSS 변수로 사용.
> 세부 수치가 애매하면 `prototype.html`의 인라인 스타일을 정답으로 본다.

## 폰트
- Pretendard (`"Pretendard Variable", Pretendard, -apple-system, sans-serif`)
- 웨이트: 본문 600, 강조 700, 타이틀 800
- 숫자(타이머): `font-variant-numeric: tabular-nums`

## 컬러

### 브랜드 / 뉴트럴
| 용도 | 값 | Tailwind |
|---|---|---|
| Brand / Main | `#4f46e5` | indigo-600 |
| Brand hover | `#4338ca` | indigo-700 |
| Brand soft bg | `#eef2ff` | indigo-50 |
| 텍스트 강조 | `#0f172a` | slate-900 |
| 본문 | `#1e293b` / `#334155` | slate-800/700 |
| 보조 텍스트 | `#64748b` / `#94a3b8` | slate-500/400 |
| 배경(앱) | `#f8fafc` / `#f1f5f9` | slate-50/100 |
| 카드 테두리 | `#f1f5f9` / `#e2e8f0` | slate-100/200 |

### 상태 컬러
| 용도 | 배경 | 테두리/텍스트 |
|---|---|---|
| Warning(이월/마감임박) | `#fef2f2` (red-50) | `#ef4444` border / `#dc2626` text |
| Caution(D-1~2) | `#fffbeb` (amber-50) | `#f59e0b` / `#d97706` |
| Success(여유/완료) | `#ecfdf5` (emerald-50) | `#10b981` / `#059669` |

### 과목 색상 (플래너·타이머·그래프 공유)
| 과목 | 색 |
|---|---|
| 수학 | `#4f46e5` |
| 영어 | `#0ea5e9` |
| 국어 | `#f97316` |
| 과학 | `#10b981` |
| 사회 | `#a855f7` |

### 캘린더 점
- 학교/학원 일정: `#3b82f6` (파랑)
- 숙제 마감: `#f97316` (주황)
- 일요일 텍스트 red / 토요일 텍스트 blue

## 형태 / 간격
- 라운드: 카드 `16px`(rounded-2xl 계열), 칩/버튼 `10~12px`, 큰 컨테이너 `18~20px`, pill `999px`
- 그림자: 카드 `0 1px 3px rgba(15,23,42,0.06)` (shadow-sm), 플로팅/모달은 더 강하게
- 카드 패딩: 16~22px
- 리스트 간격: `gap` 8~18px (flex/grid gap 사용)
- 아이콘: 라인 아이콘(stroke) 스타일, stroke-width 2.2~2.6

## 인터랙션 / 모션
- 바텀시트: `translateY(100%)→0`, cubic-bezier(0.22,1,0.36,1), ~0.28s
- 모달(iPad): scale pop-in ~0.24s
- 오버레이 fade-in, 아코디언 slide/opacity ~0.22s
- 타이머 진행 버튼: ring 펄스(box-shadow) 1.6s 무한
- 체크 완료: line-through + opacity 0.5
