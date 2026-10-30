import Question from "@/models/Question";
import { handler, HttpError } from "@/lib/api";
import { courseForStaff, pdfResponse } from "@/lib/reports";
import { buildCoursePaperPdf } from "@/lib/pdf";

// The course's full question bank: ?key=1 for the answer key
export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  const course = await courseForStaff(params.id, session);
  const answerKey = new URL(req.url).searchParams.get("key") === "1";
  const questions = await Question.find({ course: course._id }).sort({ createdAt: 1 }).lean();
  if (!questions.length) throw new HttpError(400, "This course has no questions yet.");
  const bytes = await buildCoursePaperPdf(course, questions, { answerKey });
  return pdfResponse(bytes, `BHI-${course.code}-${answerKey ? "Answer-Key" : "Question-Paper"}.pdf`);
});

export const dynamic = "force-dynamic";
