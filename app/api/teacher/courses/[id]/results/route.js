import Attempt from "@/models/Attempt";
import { handler, json } from "@/lib/api";
import { courseForTeacher } from "@/lib/teacher";

export const GET = handler(["teacher"], async (req, { params }, session) => {
  const course = await courseForTeacher(params.id, session);
  const attempts = await Attempt.find({ course: course._id }).populate("student", "name username rollNo").sort({ submittedAt: -1 });
  return json(
    attempts.map((a) => ({
      _id: a._id, student: a.student, status: a.status, score: a.score,
      total: a.total || a.questions.length, startedAt: a.startedAt, submittedAt: a.submittedAt,
    }))
  );
});

export const dynamic = "force-dynamic";
