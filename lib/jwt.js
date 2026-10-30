// Edge-safe helpers (used by middleware and by server code)
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "bhi_session";
export const HOME = { admin: "/admin", teacher: "/teacher", student: "/student" };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set. Add it to .env.local");
  return new TextEncoder().encode(s);
}

export async function signToken(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}
