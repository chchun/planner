import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { q } from "./db.js";
import { isProd } from "./runtime.js";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: "student" | "parent";
  gradeLabel: string;
}

const SESSION_DAYS = 30;
const COOKIE = "planner_session";

export async function login(c: Context) {
  const { username, password } = await c.req.json<{ username?: string; password?: string }>();
  if (!username || !password) return c.json({ error: "아이디와 비밀번호를 입력하세요" }, 400);
  const [user] = await q<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE username = $1",
    [username],
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return c.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" }, 401);
  }
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)", [token, user.id, expires]);
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
    secure: isProd(), // 프로덕션(HTTPS)에서만 — 로컬 http 개발은 유지 (R-42)
  });
  return c.json({ user: await userById(user.id) });
}

export async function logout(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) await q("DELETE FROM sessions WHERE token = $1", [token]);
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
}

async function userById(id: string): Promise<AuthUser | null> {
  const [u] = await q<{ id: string; username: string; display_name: string; role: string; grade_label: string }>(
    "SELECT id, username, display_name, role, grade_label FROM users WHERE id = $1",
    [id],
  );
  if (!u) return null;
  return { id: u.id, username: u.username, displayName: u.display_name, role: u.role as AuthUser["role"], gradeLabel: u.grade_label };
}

/** 인증 미들웨어 — 유효 세션이면 c.set('user'), 아니면 401 */
export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, COOKIE);
  if (token) {
    const [s] = await q<{ user_id: string }>(
      "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()",
      [token],
    );
    if (s) {
      const user = await userById(s.user_id);
      if (user) {
        c.set("user", user);
        return next();
      }
    }
  }
  return c.json({ error: "unauthorized" }, 401);
}
