import Question from "@/models/Question";
import { handler, json, HttpError, assertId } from "@/lib/api";
import { courseForTeacher, cleanQuestion } from "@/lib/teacher";

async function load(id, session) {
  assertId(id, "Question");
  const q = await Question.findById(id);
  if (!q) throw new HttpError(404, "Question not found");
  await courseForTeacher(q.course, session);
  return q;
}

export const PUT = handler(["teacher"], async (req, { params }, session) => {
  const q = await load(params.id, session);
  try {
    Object.assign(q, cleanQuestion(await req.json()));
  } catch (e) {
    throw new HttpError(400, e.message.charAt(0).toUpperCase() + e.message.slice(1) + ".");
  }
  await q.save();
  return json(q);
});

export const DELETE = handler(["teacher"], async (req, { params }, session) => {
  const q = await load(params.id, session);
  await q.deleteOne();
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
