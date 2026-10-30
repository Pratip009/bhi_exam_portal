import bcrypt from "bcryptjs";
import User from "@/models/User";
import Course from "@/models/Course";
import Attempt from "@/models/Attempt";
import { handler, json, HttpError, assertId } from "@/lib/api";

// Update name / roll number / reset password
export const PATCH = handler(["admin"], async (req, { params }) => {
  assertId(params.id, "User");
  const { name, rollNo, password } = await req.json();
  const user = await User.findOne({ _id: params.id, role: { $ne: "admin" } });
  if (!user) throw new HttpError(404, "User not found");
  if (name) user.name = name;
  if (rollNo !== undefined && user.role === "student") user.rollNo = rollNo;
  if (password) {
    if (String(password).length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
    user.password = await bcrypt.hash(String(password), 10);
  }
  await user.save();
  return json({ ok: true });
});

export const DELETE = handler(["admin"], async (req, { params }) => {
  assertId(params.id, "User");
  const user = await User.findOneAndDelete({ _id: params.id, role: { $ne: "admin" } });
  if (!user) throw new HttpError(404, "User not found");
  await Course.updateMany({}, { $pull: { teachers: user._id, students: user._id } });
  if (user.role === "student") await Attempt.deleteMany({ student: user._id });
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
