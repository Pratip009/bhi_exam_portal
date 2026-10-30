import { handler } from "@/lib/api";
import { attemptForStaff, pdfResponse } from "@/lib/reports";
import { buildPaperPdf, buildResultPdf } from "@/lib/pdf";

// A student's submission: ?type=result (their answers) or ?type=paper (the paper they received)
export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  const attempt = await attemptForStaff(params.id, session);
  const type = new URL(req.url).searchParams.get("type") === "paper" ? "paper" : "result";
  const student = attempt.student;
  const bytes = type === "paper" ? await buildPaperPdf(attempt, student) : await buildResultPdf(attempt, student);
  const who = student.rollNo || student.username;
  return pdfResponse(bytes, `BHI-${attempt.course.code}-${who}-${type === "paper" ? "Question-Paper" : "Result"}.pdf`);
});

export const dynamic = "force-dynamic";
