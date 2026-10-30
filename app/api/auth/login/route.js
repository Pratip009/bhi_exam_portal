import bcrypt from "bcryptjs";
import User from "@/models/User";
import { handler, json } from "@/lib/api";
import { COOKIE, signToken } from "@/lib/jwt";

export const POST = handler(null, async (req) => {
  const { username, password } = await req.json();
  const user = await User.findOne({ username: String(username || "").toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return json({ error: "Username or password is incorrect." }, 401);
  }
  const token = await signToken({ sub: String(user._id), role: user.role, name: user.name });
  const res = json({ role: user.role });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
});

export const dynamic = "force-dynamic";
