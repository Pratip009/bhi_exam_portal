import User from "@/models/User";
import Course from "@/models/Course";
import Attempt from "@/models/Attempt";
import { handler, json } from "@/lib/api";
import { visibleStudentIds } from "@/lib/reports";
import { percent, gradeFor } from "@/lib/grade";

// Students with an overall performance summary (teacher: only their courses count)
export const GET = handler(["admin", "teacher"], async (req, ctx, session) => {
  const ids = await visibleStudentIds(session);
  const students = await User.find(ids ? { _id: { $in: ids }, role: "student" } : { role: "student" })
    .select("name username rollNo").sort({ name: 1 }).lean();
  const courseFilter = session.role === "admin" ? {} : { teachers: session.sub };
  const courses = await Course.find(courseFilter).select("students").lean();
  const attempts = await Attempt.find({ course: { $in: courses.map((c) => c._id) }, status: "submitted" }).select("student score total").lean();

  return json(
    students.map((s) => {
      const sid = String(s._id);
      const enrolled = courses.filter((c) => c.students.some((x) => String(x) === sid)).length;
      const mine = attempts.filter((a) => String(a.student) === sid);
      const avg = mine.length ? Math.round(mine.reduce((t, a) => t + percent(a.score, a.total), 0) / mine.length) : null;
      return { ...s, enrolled, completed: mine.length, average: avg, grade: avg === null ? null : gradeFor(avg) };
    })
  );
});

export const dynamic = "force-dynamic";
