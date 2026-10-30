import Question from "@/models/Question";
import { handler, json, HttpError } from "@/lib/api";
import { courseForTeacher, cleanQuestion } from "@/lib/teacher";

export const POST = handler(["teacher"], async (req, { params }, session) => {
  const course = await courseForTeacher(params.id, session);
  let clean;
  try {
    clean = cleanQuestion(await req.json());
  } catch (e) {
    throw new HttpError(400, e.message.charAt(0).toUpperCase() + e.message.slice(1) + ".");
  }
  const q = await Question.create({ ...clean, course: course._id, createdBy: session.sub });
  return json(q, 201);
});

export const dynamic = "force-dynamic";
