import Course from "@/models/Course";
import Question from "@/models/Question";
import { handler, json } from "@/lib/api";

export const GET = handler(["teacher"], async (req, ctx, session) => {
  const courses = await Course.find({ teachers: session.sub }).sort({ title: 1 }).lean();
  const counts = await Question.aggregate([
    { $match: { course: { $in: courses.map((c) => c._id) } } },
    { $group: { _id: "$course", n: { $sum: 1 } } },
  ]);
  const byCourse = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  return json(
    courses.map((c) => ({
      _id: c._id, title: c.title, code: c.code, description: c.description,
      isExamOpen: c.isExamOpen, questionsPerExam: c.questionsPerExam,
      studentCount: c.students.length, questionCount: byCourse[String(c._id)] || 0,
    }))
  );
});

export const dynamic = "force-dynamic";
