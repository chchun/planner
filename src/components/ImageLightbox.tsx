import { useEffect } from "react";
import { CloseIcon } from "./icons";

/** 이미지 원본 크기로 확대해 보여주는 오버레이. 뷰포트를 넘으면 맞춰 축소(작으면 원본 크기 유지) */
export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <CloseIcon size={22} />
      </button>
      <img
        src={src}
        alt="메모 이미지 원본"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
