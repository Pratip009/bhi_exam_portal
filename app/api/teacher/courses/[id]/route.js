import Question from "@/models/Question";
import { handler, json, HttpError } from "@/lib/api";
import { courseForTeacher } from "@/lib/teacher";

export const GET = handler(["teacher"], async (req, { params }, session) => {
  const course = await courseForTeacher(params.id, session);
  const questions = await Question.find({ course: course._id }).sort({ createdAt: 1 }).lean();
  return json({ course, questions });
});

// Exam settings: { questionsPerExam, isExamOpen }
export const PATCH = handler(["teacher"], async (req, { params }, session) => {
  const course = await courseForTeacher(params.id, session);
  const { questionsPerExam, isExamOpen } = await req.json();
  if (questionsPerExam !== undefined) course.questionsPerExam = Number(questionsPerExam);
  if (isExamOpen !== undefined) {
    if (isExamOpen && !(await Question.exists({ course: course._id }))) {
      throw new HttpError(400, "Add at least one question before opening the exam.");
    }
    course.isExamOpen = Boolean(isExamOpen);
  }
  await course.save();
  return json(course);
});

export const dynamic = "force-dynamic";
