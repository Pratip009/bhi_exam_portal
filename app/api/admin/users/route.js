import bcrypt from "bcryptjs";
import User from "@/models/User";
import { handler, json, HttpError } from "@/lib/api";

export const GET = handler(["admin"], async (req) => {
  const role = new URL(req.url).searchParams.get("role");
  const filter = ["teacher", "student"].includes(role) ? { role } : { role: { $in: ["teacher", "student"] } };
  const users = await User.find(filter).select("-password").sort({ name: 1 }).lean();
  return json(users);
});

export const POST = handler(["admin"], async (req) => {
  const { name, username, password, role, rollNo } = await req.json();
  if (!["teacher", "student"].includes(role)) throw new HttpError(400, "Role must be teacher or student.");
  if (!password || String(password).length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  const user = await User.create({
    name,
    username,
    role,
    rollNo: role === "student" ? rollNo : undefined,
    password: await bcrypt.hash(String(password), 10),
  });
  const { password: _p, ...safe } = user.toObject();
  return json(safe, 201);
});

export const dynamic = "force-dynamic";
