import Course from "@/models/Course";
import Attempt from "@/models/Attempt";
import Question from "@/models/Question";
import { handler, json } from "@/lib/api";

export const GET = handler(["student"], async (req, ctx, session) => {
  const courses = await Course.find({ students: session.sub }).populate("teachers", "name").sort({ title: 1 }).lean();
  const attempts = await Attempt.find({ student: session.sub, course: { $in: courses.map((c) => c._id) } });
  const byCourse = Object.fromEntries(attempts.map((a) => [String(a.course), a]));
  const counts = await Question.aggregate([
    { $match: { course: { $in: courses.map((c) => c._id) } } },
    { $group: { _id: "$course", n: { $sum: 1 } } },
  ]);
  const qCount = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

  return json(
    courses.map((c) => {
      const a = byCourse[String(c._id)];
      return {
        _id: c._id, title: c.title, code: c.code, description: c.description,
        teachers: c.teachers.map((t) => t.name),
        isExamOpen: c.isExamOpen,
        questionCount: Math.min(c.questionsPerExam, qCount[String(c._id)] || 0),
        attempt: a ? { _id: a._id, status: a.status, score: a.score, total: a.total || a.questions.length } : null,
      };
    })
  );
});

export const dynamic = "force-dynamic";
