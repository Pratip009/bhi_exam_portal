import Attempt from "@/models/Attempt";
import { handler, json, HttpError, assertId } from "@/lib/api";

async function load(id, session) {
  assertId(id, "Exam");
  const attempt = await Attempt.findOne({ _id: id, student: session.sub }).populate("course", "title code");
  if (!attempt) throw new HttpError(404, "Exam not found");
  return attempt;
}

// Full result (only after submission)
export const GET = handler(["student"], async (req, { params }, session) => {
  const a = await load(params.id, session);
  if (a.status !== "submitted") throw new HttpError(403, "Results are available after you submit the exam.");
  return json({
    _id: a._id, course: a.course, score: a.score, total: a.total,
    startedAt: a.startedAt, submittedAt: a.submittedAt,
    questions: a.questions.map((q) => ({ id: String(q.question), text: q.text, options: q.options, answer: q.answer, selected: q.selected })),
  });
});

// Save progress while the exam is running: { questionId, selected }
export const PATCH = handler(["student"], async (req, { params }, session) => {
  const a = await load(params.id, session);
  if (a.status !== "in_progress") throw new HttpError(409, "This exam has ended.");
  const { questionId, selected } = await req.json();
  const q = a.questions.find((x) => String(x.question) === String(questionId));
  if (!q) throw new HttpError(404, "Question not found in this exam.");
  q.selected = ["A", "B", "C", "D"].includes(selected) ? selected : null;
  await a.save();
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
