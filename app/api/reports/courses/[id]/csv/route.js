import { handler } from "@/lib/api";
import { courseForStaff, courseResults } from "@/lib/reports";

const esc = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const when = (d) => (d ? new Date(d).toISOString().replace("T", " ").slice(0, 16) : "");

// All submissions for a course as a spreadsheet (opens in Excel / Google Sheets)
export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  const course = await courseForStaff(params.id, session);
  const rows = await courseResults(course);
  const status = { submitted: "Submitted", in_progress: "In progress", not_started: "Not started" };
  const lines = [
    ["Student", "Username", "Roll no.", "Status", "Score", "Total", "Percent", "Grade", "Correct", "Wrong", "Not answered", "Started (UTC)", "Submitted (UTC)"],
    ...rows.map((r) => [
      r.student.name, r.student.username, r.student.rollNo || "", status[r.status],
      r.score, r.total, r.percent === null ? "" : `${r.percent}%`, r.grade, r.score, r.wrong, r.unanswered,
      when(r.startedAt), when(r.submittedAt),
    ]),
  ];
  const csv = "\uFEFF" + lines.map((l) => l.map(esc).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="BHI-${course.code.replace(/[^A-Za-z0-9_-]/g, "")}-Submissions.csv"`,
      "Cache-Control": "no-store",
    },
  });
});

export const dynamic = "force-dynamic";
