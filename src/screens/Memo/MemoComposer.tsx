import { useState, type ChangeEvent } from "react";
import { ImageIcon } from "../../components/icons";
import { memoSwatches } from "../../data/constants";
import { useAppStore } from "../../store/useAppStore";

export function MemoComposer({ folders }: { folders: string[] }) {
  const createMemo = useAppStore((s) => s.createMemo);
  const online = useAppStore((s) => s.online);
  const [text, setText] = useState("");
  const [color, setColor] = useState(memoSwatches[0]);
  const [folder, setFolder] = useState("아이디어");
  const [image, setImage] = useState<string | null>(null);

  const foldersNoAll = folders.filter((f) => f !== "전체");

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submit = async () => {
    if (!text.trim() && !image) return;
    await createMemo({ folder, color, text: text.trim(), image });
    setText("");
    setImage(null);
  };

  return (
    <section className="rounded-[14px] border border-slate-100 bg-white p-3.5 shadow-card lg:rounded-2xl lg:p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메모를 입력하세요…  (스크린샷 이미지도 첨부할 수 있어요)"
        className="min-h-[54px] w-full resize-none rounded-[11px] border-[1.5px] border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-brand focus:outline-none lg:min-h-[62px] lg:rounded-xl lg:px-3.5 lg:py-3"
      />
      {image && (
        <div className="relative mt-2.5 inline-block">
          <img
            src={image}
            alt="첨부 미리보기"
            className="block max-h-[130px] rounded-[10px] border border-slate-200"
          />
          <button
            onClick={() => setImage(null)}
            aria-label="이미지 제거"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-extrabold text-white"
          >
            ✕
          </button>
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 lg:mt-3">
        <div className="flex gap-1.5">
          {memoSwatches.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="메모 색상 선택"
              className="h-6 w-6 rounded-[7px] border-2 lg:h-[26px] lg:w-[26px] lg:rounded-lg"
              style={{ background: c, borderColor: color === c ? "#0f172a" : "#ffffff" }}
            />
          ))}
        </div>
        <div className="hidden h-6 w-px bg-slate-200 lg:block" />
        <div className="flex gap-1.5 overflow-x-auto">
          {foldersNoAll.map((f) => {
            const on = folder === f;
            return (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`shrink-0 rounded-full border-[1.5px] px-[11px] py-[5px] text-xs font-bold ${
                  on ? "border-brand bg-brand-soft text-indigo-700" : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div className="hidden flex-1 lg:block" />
        <div className="flex w-full gap-2 lg:w-auto">
          <label className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-chip bg-slate-100 px-3.5 py-2 text-[13px] font-bold text-slate-600 lg:flex-none">
            <ImageIcon size={16} />
            이미지
            <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
          </label>
          <button
            onClick={() => void submit()}
            disabled={!online}
            title={online ? undefined : "오프라인 — 연결 후 등록할 수 있어요"}
            className="min-h-[40px] flex-1 rounded-chip bg-brand px-5 py-2 text-[13px] font-extrabold text-white hover:bg-brand-hover disabled:opacity-50 lg:flex-none"
          >
            {online ? "추가" : "오프라인"}
          </button>
        </div>
      </div>
    </section>
  );
}
