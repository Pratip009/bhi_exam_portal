import Course from "@/models/Course";
import Question from "@/models/Question";
import { handler, json } from "@/lib/api";

export const GET = handler(["admin"], async () => {
  const courses = await Course.find().populate("teachers", "name").sort({ createdAt: -1 }).lean();
  const counts = await Question.aggregate([{ $group: { _id: "$course", n: { $sum: 1 } } }]);
  const byCourse = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  return json(courses.map((c) => ({ ...c, studentCount: c.students.length, questionCount: byCourse[String(c._id)] || 0 })));
});

export const POST = handler(["admin"], async (req) => {
  const { title, code, description } = await req.json();
  const course = await Course.create({ title, code, description });
  return json(course, 201);
});

export const dynamic = "force-dynamic";
