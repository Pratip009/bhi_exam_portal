import User from "@/models/User";
import { handler, json, HttpError, assertId } from "@/lib/api";
import { reportRows, visibleStudentIds } from "@/lib/reports";

export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  assertId(params.id, "Student");
  const ids = await visibleStudentIds(session);
  if (ids && !ids.includes(params.id)) throw new HttpError(404, "Student not found in your courses");
  const student = await User.findOne({ _id: params.id, role: "student" }).select("name username rollNo").lean();
  if (!student) throw new HttpError(404, "Student not found");
  return json({ student, rows: await reportRows(student._id, session) });
});

export const dynamic = "force-dynamic";
