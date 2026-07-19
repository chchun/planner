import { useEffect, useRef, useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon, LogoIcon } from "../components/icons";
import { LS_ID, LS_PW } from "../data/rememberedAuth";
import { useAppStore } from "../store/useAppStore";

export function Login() {
  const login = useAppStore((s) => s.login);
  const setTab = useAppStore((s) => s.setTab);
  const loginError = useAppStore((s) => s.loginError);

  const [username, setUsername] = useState(() => localStorage.getItem(LS_ID) ?? "");
  const [password, setPassword] = useState(() => localStorage.getItem(LS_PW) ?? "");
  const [showPw, setShowPw] = useState(false);
  const [rememberId, setRememberId] = useState(() => localStorage.getItem(LS_ID) != null);
  const [rememberPw, setRememberPw] = useState(() => localStorage.getItem(LS_PW) != null);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  /** 로그인 성공 시 체크 상태대로 저장/삭제 */
  const persist = (id: string, pw: string, keepId: boolean, keepPw: boolean) => {
    if (keepId || keepPw) localStorage.setItem(LS_ID, id);
    else localStorage.removeItem(LS_ID);
    if (keepPw) localStorage.setItem(LS_PW, pw);
    else localStorage.removeItem(LS_PW);
  };

  const attempt = async (id: string, pw: string, auto: boolean) => {
    if (!id || !pw) return;
    setBusy(true);
    await login(id, pw);
    const ok = useAppStore.getState().status === "ready";
    setBusy(false);
    if (ok) {
      persist(id, pw, rememberId || rememberPw, rememberPw);
      // 자동 로그인(저장된 자격증명)으로 진입하면 곧바로 메모 화면으로
      if (auto) setTab("memo");
    } else if (auto && useAppStore.getState().online) {
      // 온라인인데 실패 = 저장된 비밀번호가 무효 → 비번만 지우고 수동 입력 대기.
      // (오프라인 실패면 자격증명은 유지 — 복귀 후 다시 자동 로그인)
      localStorage.removeItem(LS_PW);
      setPassword("");
      setRememberPw(false);
    }
  };

  // 아이디·비밀번호가 저장돼 있으면 화면 진입 즉시 1회 자동 로그인
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const id = localStorage.getItem(LS_ID);
    const pw = localStorage.getItem(LS_PW);
    if (id && pw) void attempt(id, pw, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToggleId = (v: boolean) => {
    setRememberId(v);
    if (!v) setRememberPw(false); // 아이디를 저장하지 않으면 비밀번호 저장도 불가
  };
  const onTogglePw = (v: boolean) => {
    setRememberPw(v);
    if (v) setRememberId(true); // 비밀번호를 저장하려면 아이디도 저장
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void attempt(username, password, false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] rounded-3xl border border-slate-100 bg-white p-8 shadow-card"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-brand">
            <LogoIcon size={22} />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">학습 플래너</div>
            <div className="text-xs font-semibold text-slate-400">로그인하고 시작하세요</div>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-[7px] block text-[13px] font-bold text-slate-600">아이디</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-xl border-[1.5px] border-slate-200 px-3.5 py-3 text-sm text-slate-800 focus:border-brand focus:outline-none"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-[7px] block text-[13px] font-bold text-slate-600">비밀번호</span>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border-[1.5px] border-slate-200 px-3.5 py-3 pr-12 text-sm text-slate-800 focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
              aria-pressed={showPw}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          </div>
        </label>

        <div className="mb-4 flex items-center gap-4">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => onToggleId(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            아이디 저장
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={rememberPw}
              onChange={(e) => onTogglePw(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            비밀번호 저장
          </label>
        </div>

        {loginError && (
          <div className="mb-3 text-[13px] font-semibold text-red-500">{loginError}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-[14px] bg-brand p-[14px] text-[15px] font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(79,70,229,0.5)] hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>

        <div className="mt-4 text-center text-xs font-semibold text-slate-400">
          학생: siyoon · 부모: mom, dad
        </div>
      </form>
    </div>
  );
}
