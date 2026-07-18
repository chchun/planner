/** fetch 래퍼 — 같은 오리진(/api 프록시), 401은 AuthError, 네트워크 단절은 NetworkError로 구분 */
export class AuthError extends Error {}
export class NetworkError extends Error {}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new NetworkError("network unreachable");
  }
  if (res.status === 401) throw new AuthError("unauthorized");
  // 5xx = 서버/프록시 도달 불가로 간주 (dev: Vite 프록시가 백엔드 다운 시 500 반환, 운영: 502/503/504)
  if (res.status >= 500) throw new NetworkError(`server unreachable (${res.status})`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
export const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = <T>(path: string) => request<T>(path, { method: "DELETE" });
