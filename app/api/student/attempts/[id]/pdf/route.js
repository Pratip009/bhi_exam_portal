import Attempt from "@/models/Attempt";
import User from "@/models/User";
import { handler, HttpError, assertId } from "@/lib/api";
import { buildPaperPdf, buildResultPdf } from "@/lib/pdf";

// GET ?type=paper  -> question paper
// GET ?type=result -> result with the student's answers and the correct answers
export const GET = handler(["student"], async (req, { params }, session) => {
  assertId(params.id, "Exam");
  const type = new URL(req.url).searchParams.get("type") === "result" ? "result" : "paper";
  const attempt = await Attempt.findOne({ _id: params.id, student: session.sub }).populate("course", "title code");
  if (!attempt) throw new HttpError(404, "Exam not found");
  if (attempt.status !== "submitted") throw new HttpError(403, "Downloads are available after you submit the exam.");

  const student = await User.findById(session.sub).select("name username rollNo").lean();
  const bytes = type === "result" ? await buildResultPdf(attempt, student) : await buildPaperPdf(attempt, student);
  const safeCode = String(attempt.course?.code || "exam").replace(/[^A-Za-z0-9_-]/g, "");
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BHI-${safeCode}-${type === "result" ? "Result" : "Question-Paper"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});

export const dynamic = "force-dynamic";
