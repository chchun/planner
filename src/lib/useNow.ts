import { useEffect, useState } from "react";

/**
 * 1초 간격으로 현재 시각을 갱신하는 훅 — 화면 표시용.
 * 시간 누적은 절대 이 훅으로 하지 않는다(스토어의 startedAt 기준 계산 사용).
 * active가 false면 interval을 걸지 않아 불필요한 리렌더를 막는다.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active]);
  return now;
}
