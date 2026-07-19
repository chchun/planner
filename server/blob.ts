// Vercel Blob 어댑터 (spec 005 R-41) — 메모 이미지 저장.
// 토큰 미설정(로컬 기본)이면 blobEnabled()=false, 업로드는 라우트에서 501 처리.
import { del, put } from "@vercel/blob";

/** 이 스토어는 이름 프리픽스가 붙어 PLAN_BLOB_*로 발급될 수 있다 (plan R-41) */
function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN ?? process.env.PLAN_BLOB_READ_WRITE_TOKEN;
}

export function blobEnabled(): boolean {
  return !!blobToken();
}

/** 파일을 공개 Blob으로 업로드하고 URL을 반환 */
export async function putMemoImage(key: string, file: File): Promise<string> {
  const token = blobToken();
  if (!token) throw new Error("Blob 토큰이 설정되지 않았습니다");
  const { url } = await put(key, file, { access: "public", token });
  return url;
}

/** Blob 공개 URL 여부 — DB의 image 값이 dataURL(구버전)일 수도 있으므로 구분 */
export function isBlobUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(value);
}

/** 메모 삭제 시 Blob 파일 정리 — 실패해도 앱 삭제는 진행 (R-41) */
export async function deleteBlobUrl(url: string): Promise<void> {
  const token = blobToken();
  if (!token) return;
  try {
    await del(url, { token });
  } catch (err) {
    console.error("[blob] 삭제 실패 (무시):", err);
  }
}
