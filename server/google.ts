// Google Calendar 연동 — 서비스 계정 JWT 인증 (외부 라이브러리 없음, spec 004)
// 키/캘린더 ID 미설정이면 모든 함수가 no-op (R-31)
import { createSign } from "node:crypto";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface GcalEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  source: "google-family" | "google-student";
}

function loadKey(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString();
    const json = JSON.parse(text) as ServiceAccountKey;
    return json.client_email && json.private_key ? json : null;
  } catch {
    console.error("[gcal] GOOGLE_SERVICE_ACCOUNT_JSON 파싱 실패");
    return null;
  }
}

const KEY = loadKey();
const FAMILY_ID = process.env.GCAL_FAMILY_ID ?? "";
const STUDENT_ID = process.env.GCAL_STUDENT_ID ?? "";
const FAMILY_LABEL = process.env.GCAL_FAMILY_LABEL ?? "가족";

export const gcalEnabled = (): boolean => KEY != null && STUDENT_ID !== "";

// ---- access token (만료 5분 전까지 캐시) ----
let cachedToken: { token: string; expiresAt: number } | null = null;

const b64url = (input: string | Buffer): string =>
  Buffer.from(input).toString("base64url");

async function accessToken(): Promise<string> {
  if (!KEY) throw new Error("gcal disabled");
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: KEY.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = b64url(signer.sign(KEY.private_key));
  const assertion = `${header}.${claim}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function gapi(path: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken();
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/** 숙제 push — 시윤학원 캘린더에 이벤트 생성, eventId 반환 (R-32) */
export async function insertHomeworkEvent(title: string, dueAt: Date): Promise<string> {
  const start = new Date(dueAt.getTime() - 30 * 60_000);
  const res = await gapi(`/calendars/${encodeURIComponent(STUDENT_ID)}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: `[숙제] ${title}`,
      start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
      end: { dateTime: dueAt.toISOString(), timeZone: "Asia/Seoul" },
    }),
  });
  if (!res.ok) throw new Error(`insert ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}

/** 이벤트 삭제 — 404/410은 이미 없는 것이므로 성공 취급 (R-32) */
export async function deleteEvent(eventId: string): Promise<void> {
  const res = await gapi(
    `/calendars/${encodeURIComponent(STUDENT_ID)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`delete ${res.status}: ${await res.text()}`);
  }
}

// ---- 조회: 가족일정 + 시윤학원 (5분 캐시, R-33) ----
let listCache: { at: number; events: GcalEvent[] } | null = null;

async function listCalendar(
  calendarId: string,
  source: GcalEvent["source"],
  timeMin: Date,
  timeMax: Date,
): Promise<GcalEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await gapi(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  if (!res.ok) throw new Error(`list ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string };
    }>;
  };
  return (json.items ?? []).map((it) => ({
    id: `g-${it.id}`,
    title: (source === "google-family" ? `[${FAMILY_LABEL}] ` : "") + (it.summary ?? "(제목 없음)"),
    startAt: it.start?.dateTime ?? (it.start?.date ? `${it.start.date}T00:00:00+09:00` : ""),
    // 종일 이벤트(end.date)는 종료 시각 없음 취급 — UI에서 시점성 이벤트로 표시 (spec 007)
    endAt: it.end?.dateTime ?? null,
    source,
  }));
}

/** 이번 달 구글 일정 — 실패 시 빈 배열(로컬만으로 동작, R-33) */
export async function listGoogleEvents(timeMin: Date, timeMax: Date): Promise<GcalEvent[]> {
  if (!gcalEnabled()) return [];
  if (listCache && Date.now() - listCache.at < 5 * 60_000) return listCache.events;
  try {
    const [student, family] = await Promise.all([
      listCalendar(STUDENT_ID, "google-student", timeMin, timeMax),
      FAMILY_ID ? listCalendar(FAMILY_ID, "google-family", timeMin, timeMax) : Promise.resolve([]),
    ]);
    const events = [...student, ...family].filter((e) => e.startAt);
    listCache = { at: Date.now(), events };
    return events;
  } catch (err) {
    console.error("[gcal] list 실패:", err);
    return listCache?.events ?? [];
  }
}

/** push 성공/실패 후 조회 캐시 무효화 */
export function invalidateListCache(): void {
  listCache = null;
}
