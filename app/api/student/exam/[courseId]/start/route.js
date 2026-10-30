import Course from "@/models/Course";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import { handler, json, HttpError, assertId } from "@/lib/api";
import { publicQuestions } from "@/lib/exam";

function examPayload(attempt, course) {
  return {
    attemptId: attempt._id,
    status: attempt.status,
    course: { title: course.title, code: course.code },
    questions: publicQuestions(attempt),
  };
}

// Starts the exam, or resumes it if already started.
export const POST = handler(["student"], async (req, { params }, session) => {
  assertId(params.courseId, "Course");
  const course = await Course.findOne({ _id: params.courseId, students: session.sub });
  if (!course) throw new HttpError(404, "Course not found or you are not enrolled in it.");

  let attempt = await Attempt.findOne({ student: session.sub, course: course._id });
  if (attempt?.status === "submitted") return json({ attemptId: attempt._id, status: "submitted" });
  if (attempt) return json(examPayload(attempt, course));

  if (!course.isExamOpen) throw new HttpError(403, "This exam is not open yet. Your teacher will open it.");
  const picked = await Question.aggregate([{ $match: { course: course._id } }, { $sample: { size: course.questionsPerExam } }]);
  if (!picked.length) throw new HttpError(400, "This exam has no questions yet.");

  try {
    attempt = await Attempt.create({
      student: session.sub,
      course: course._id,
      questions: picked.map((q) => ({ question: q._id, text: q.text, options: q.options, answer: q.answer })),
    });
  } catch (e) {
    if (e?.code !== 11000) throw e; // started twice at once: use the one that won
    attempt = await Attempt.findOne({ student: session.sub, course: course._id });
  }
  return json(examPayload(attempt, course), 201);
});

export const dynamic = "force-dynamic";
