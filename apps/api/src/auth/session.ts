import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "@terramind/shared";
import type { AppConfig } from "../config";

export interface SessionPayload {
  sub: string;
  uid: number;
  name: string;
  role: string;
}

export async function signSession(
  payload: SessionPayload,
  config: AppConfig,
): Promise<string> {
  const secret = new TextEncoder().encode(config.jwtSecret);
  return new SignJWT({ uid: payload.uid, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setExpirationTime(new Date(Date.now() + SESSION_COOKIE_MAX_AGE))
    .sign(secret);
}

export async function verifySession(
  token: string,
  config: AppConfig,
): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.uid !== "number") return null;
    return {
      sub: payload.sub,
      uid: payload.uid,
      name: typeof payload.name === "string" ? payload.name : "",
      role: typeof payload.role === "string" ? payload.role : "user",
    };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, config: AppConfig): string {
  const maxAge = Math.floor(SESSION_COOKIE_MAX_AGE / 1000);
  const secure = config.isProd ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    }
  }
  return out;
}