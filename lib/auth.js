import { cookies } from "next/headers";
import { COOKIE, verifyToken } from "./jwt";

// Returns { sub, role, name } or null
export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
