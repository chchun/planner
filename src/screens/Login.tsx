import { useState, type FormEvent } from "react";
import { LogoIcon } from "../components/icons";
import { useAppStore } from "../store/useAppStore";

export function Login() {
  const login = useAppStore((s) => s.login);
  const loginError = useAppStore((s) => s.loginError);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await login(username, password);
    setBusy(false);
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border-[1.5px] border-slate-200 px-3.5 py-3 text-sm text-slate-800 focus:border-brand focus:outline-none"
          />
        </label>

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
