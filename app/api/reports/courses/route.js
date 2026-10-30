import Course from "@/models/Course";
import Attempt from "@/models/Attempt";
import Question from "@/models/Question";
import { handler, json } from "@/lib/api";
import { percent } from "@/lib/grade";

// Courses with a performance summary (admin: all, teacher: their own)
export const GET = handler(["admin", "teacher"], async (req, ctx, session) => {
  const filter = session.role === "admin" ? {} : { teachers: session.sub };
  const courses = await Course.find(filter).populate("teachers", "name").sort({ title: 1 }).lean();
  const ids = courses.map((c) => c._id);
  const [attempts, qCounts] = await Promise.all([
    Attempt.find({ course: { $in: ids }, status: "submitted" }).select("course score total").lean(),
    Question.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
  ]);
  const qc = Object.fromEntries(qCounts.map((x) => [String(x._id), x.n]));
  return json(
    courses.map((c) => {
      const done = attempts.filter((a) => String(a.course) === String(c._id));
      const avg = done.length ? Math.round(done.reduce((s, a) => s + percent(a.score, a.total), 0) / done.length) : null;
      const pass = done.filter((a) => percent(a.score, a.total) >= 50).length;
      return {
        _id: c._id, title: c.title, code: c.code, isExamOpen: c.isExamOpen,
        teachers: c.teachers.map((t) => t.name), enrolled: c.students.length,
        submitted: done.length, average: avg, passRate: done.length ? Math.round((pass / done.length) * 100) : null,
        questionCount: qc[String(c._id)] || 0,
      };
    })
  );
});

export const dynamic = "force-dynamic";
