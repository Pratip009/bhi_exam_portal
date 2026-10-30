import User from "@/models/User";
import { handler, HttpError, assertId } from "@/lib/api";
import { reportRows, visibleStudentIds, pdfResponse } from "@/lib/reports";
import { buildReportCardPdf } from "@/lib/pdf";

// One-page report card. Admin: all courses. Teacher: the courses they teach.
export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  assertId(params.id, "Student");
  const ids = await visibleStudentIds(session);
  if (ids && !ids.includes(params.id)) throw new HttpError(404, "Student not found in your courses");
  const student = await User.findOne({ _id: params.id, role: "student" }).select("name username rollNo").lean();
  if (!student) throw new HttpError(404, "Student not found");
  const rows = await reportRows(student._id, session);
  const bytes = await buildReportCardPdf(student, rows, { scope: session.role === "admin" ? "All courses" : `Courses taught by ${session.name}` });
  return pdfResponse(bytes, `BHI-Report-Card-${student.rollNo || student.username}.pdf`);
});

export const dynamic = "force-dynamic";
