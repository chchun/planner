import { useState } from "react";
import { BellIcon, CloseIcon, ErrorCircleIcon, PlusIcon, TrashIcon } from "./icons";
import { registerTags } from "../data/constants";
import type { NotifSettings, RegisterFormValues } from "../data/types";
import { useAppStore } from "../store/useAppStore";

const NOTIF_DEFS: Array<{ key: keyof NotifSettings; label: string }> = [
  { key: "prev", label: "전날 21:00 알림" },
  { key: "morning", label: "당일 아침 알림" },
  { key: "twoHr", label: "마감 2시간 전 알림" },
];

const INITIAL_FORM: RegisterFormValues = {
  title: "",
  tag: null,
  due: "",
  notif: { prev: true, morning: false, twoHr: true },
  subs: [],
};

/** 공용 등록 폼 — iPad·PC 다이얼로그와 모바일 바텀시트가 같은 폼을 감싼다 */
function RegisterForm({ onClose }: { onClose: () => void }) {
  const createTodo = useAppStore((s) => s.createTodo);
  const [form, setForm] = useState<RegisterFormValues>(INITIAL_FORM);
  const [dueError, setDueError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.due) {
      setDueError(true);
      return;
    }
    setSaving(true);
    try {
      await createTodo({
        title: form.title.trim() || "새 숙제",
        source: form.tag ?? "기타",
        dueAt: new Date(form.due).toISOString(),
        subs: form.subs.filter((t) => t.trim()).map((t) => t.trim()),
      });
      onClose();
    } catch (err) {
      console.error("[api]", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-[22px] pb-3 pt-3.5">
        <div className="text-lg font-extrabold text-slate-900">숙제 등록</div>
        <button onClick={onClose} aria-label="닫기" className="p-1 text-slate-400">
          <CloseIcon size={22} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-[22px] pb-2 pt-[18px]">
        <div>
          <div className="mb-[7px] text-[13px] font-bold text-slate-600">제목</div>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="예: 미적분 문제집 p.45-50"
            className="w-full rounded-xl border-[1.5px] border-slate-200 px-3.5 py-3 text-sm text-slate-800 focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-[7px] text-[13px] font-bold text-slate-600">태그 선택</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {registerTags.map((tag) => {
              const on = form.tag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setForm((f) => ({ ...f, tag }))}
                  className={`min-h-[36px] shrink-0 rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-bold ${
                    on ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-[7px] text-[13px] font-bold text-slate-600">
            납기 일시 <span className="text-red-500">*</span>
          </div>
          <input
            type="datetime-local"
            value={form.due}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, due: v }));
              if (v) setDueError(false);
            }}
            className="w-full rounded-xl border-[1.5px] px-3.5 py-3 text-sm text-slate-800 focus:outline-none"
            style={{ borderColor: dueError ? "#ef4444" : "#e2e8f0" }}
          />
          {dueError && (
            <div className="mt-1.5 flex items-center gap-1 text-[13px] font-semibold text-red-500">
              <ErrorCircleIcon size={14} />
              납기 일시를 입력해 주세요.
            </div>
          )}
        </div>

        <div>
          <div className="mb-[9px] text-[13px] font-bold text-slate-600">알림 설정</div>
          <div className="flex flex-col gap-2">
            {NOTIF_DEFS.map(({ key, label }) => {
              const on = form.notif[key];
              return (
                <button
                  key={key}
                  onClick={() =>
                    setForm((f) => ({ ...f, notif: { ...f.notif, [key]: !f.notif[key] } }))
                  }
                  className="flex min-h-[46px] items-center justify-between rounded-xl bg-slate-50 px-3.5 py-[11px]"
                >
                  <span className="flex items-center gap-[9px] text-[13px] font-semibold text-slate-700">
                    <BellIcon size={16} className="text-slate-500" />
                    {label}
                  </span>
                  <span
                    className="relative h-6 w-[42px] rounded-full transition-colors"
                    style={{ background: on ? "#4f46e5" : "#cbd5e1" }}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]"
                      style={{ left: on ? 20 : 2 }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-[9px] flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-600">하위 항목</div>
            <button
              onClick={() => setForm((f) => ({ ...f, subs: [...f.subs, ""] }))}
              className="flex items-center gap-[3px] text-xs font-bold text-brand"
            >
              <PlusIcon size={14} />
              추가
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {form.subs.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={v}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({ ...f, subs: f.subs.map((x, j) => (j === i ? val : x)) }));
                  }}
                  placeholder="하위 항목 입력"
                  className="flex-1 rounded-chip border-[1.5px] border-slate-200 px-3 py-2.5 text-[13px] text-slate-800 focus:border-brand focus:outline-none"
                />
                <button
                  onClick={() =>
                    setForm((f) => ({ ...f, subs: f.subs.filter((_, j) => j !== i) }))
                  }
                  aria-label="하위 항목 삭제"
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-slate-100 text-slate-400"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
            {form.subs.length === 0 && (
              <div className="px-0.5 py-1 text-xs font-semibold text-slate-300">
                '추가'를 눌러 세부 단계를 나눠 보세요
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 px-[22px] pb-[22px] pt-3">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full rounded-[14px] bg-brand p-[15px] text-[15px] font-extrabold text-white shadow-[0_8px_18px_-6px_rgba(79,70,229,0.5)] hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? "저장 중…" : "저장하기"}
        </button>
      </div>
    </div>
  );
}

export function RegisterModal() {
  const modalOpen = useAppStore((s) => s.modalOpen);
  const closeModal = useAppStore((s) => s.closeModal);
  if (!modalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 animate-fadeIn bg-slate-900/50" onClick={closeModal} />
      {/* iPad·PC: 중앙 다이얼로그 */}
      <div className="fixed left-1/2 top-1/2 z-[51] hidden h-[680px] max-h-[90vh] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-pop overflow-hidden rounded-3xl bg-white shadow-modal lg:block">
        <RegisterForm onClose={closeModal} />
      </div>
      {/* 모바일: 바텀 시트 */}
      <div className="fixed inset-x-0 bottom-0 z-[51] h-[92%] animate-sheetUp overflow-hidden rounded-t-3xl bg-white shadow-sheet lg:hidden">
        <RegisterForm onClose={closeModal} />
      </div>
    </>
  );
}
