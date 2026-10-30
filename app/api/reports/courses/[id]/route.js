import Question from "@/models/Question";
import { handler, json } from "@/lib/api";
import { courseForStaff, courseResults } from "@/lib/reports";

// Every enrolled student in the course with their status and score
export const GET = handler(["admin", "teacher"], async (req, { params }, session) => {
  const course = await courseForStaff(params.id, session);
  const rows = await courseResults(course);
  const done = rows.filter((r) => r.status === "submitted");
  const pcts = done.map((r) => r.percent);
  return json({
    course: { _id: course._id, title: course.title, code: course.code, isExamOpen: course.isExamOpen, questionCount: await Question.countDocuments({ course: course._id }) },
    stats: {
      enrolled: rows.length,
      submitted: done.length,
      inProgress: rows.filter((r) => r.status === "in_progress").length,
      notStarted: rows.filter((r) => r.status === "not_started").length,
      average: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
      highest: pcts.length ? Math.max(...pcts) : null,
      lowest: pcts.length ? Math.min(...pcts) : null,
      passRate: pcts.length ? Math.round((pcts.filter((p) => p >= 50).length / pcts.length) * 100) : null,
    },
    rows,
  });
});

export const dynamic = "force-dynamic";
