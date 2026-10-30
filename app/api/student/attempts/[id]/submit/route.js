import Attempt from "@/models/Attempt";
import { handler, json, HttpError, assertId } from "@/lib/api";
import { gradeAttempt } from "@/lib/exam";

// Body: { answers: { [questionId]: "A" | "B" | "C" | "D" } }
export const POST = handler(["student"], async (req, { params }, session) => {
  assertId(params.id, "Exam");
  const attempt = await Attempt.findOne({ _id: params.id, student: session.sub });
  if (!attempt) throw new HttpError(404, "Exam not found");
  if (attempt.status === "submitted") return json({ attemptId: attempt._id, score: attempt.score, total: attempt.total });

  const { answers } = await req.json().catch(() => ({}));
  gradeAttempt(attempt, answers);
  await attempt.save();
  return json({ attemptId: attempt._id, score: attempt.score, total: attempt.total });
});

export const dynamic = "force-dynamic";
