// Access rules and data for reports shared by admin and teachers.
// Admin: every course and student. Teacher: only courses they are assigned to.
import Course from "@/models/Course";
import Attempt from "@/models/Attempt";
import User from "@/models/User";
import { HttpError, assertId } from "./api";
import { percent, gradeFor } from "./grade";

export async function courseForStaff(courseId, session) {
  assertId(courseId, "Course");
  const filter = session.role === "admin" ? { _id: courseId } : { _id: courseId, teachers: session.sub };
  const course = await Course.findOne(filter);
  if (!course) throw new HttpError(404, "Course not found or not assigned to you");
  return course;
}

// A submitted attempt the current admin/teacher may see
export async function attemptForStaff(attemptId, session) {
  assertId(attemptId, "Submission");
  const attempt = await Attempt.findById(attemptId).populate("course", "title code teachers").populate("student", "name username rollNo");
  if (!attempt || !attempt.course) throw new HttpError(404, "Submission not found");
  if (session.role === "teacher" && !attempt.course.teachers.some((t) => String(t) === session.sub)) {
    throw new HttpError(404, "Submission not found");
  }
  if (attempt.status !== "submitted") throw new HttpError(409, "This student has not submitted the exam yet.");
  if (!attempt.student) throw new HttpError(404, "This student's account was deleted.");
  return attempt;
}

// Every enrolled student in a course with their attempt status
export async function courseResults(course) {
  const students = await User.find({ _id: { $in: course.students }, role: "student" }).select("name username rollNo").sort({ name: 1 }).lean();
  const attempts = await Attempt.find({ course: course._id }).select("student status score total questions.selected startedAt submittedAt").lean();
  const byStudent = Object.fromEntries(attempts.map((a) => [String(a.student), a]));
  return students.map((s) => {
    const a = byStudent[String(s._id)];
    const submitted = a?.status === "submitted";
    const total = a ? a.total || a.questions.length : 0;
    const unanswered = a ? a.questions.filter((q) => !q.selected).length : 0;
    return {
      student: s,
      attemptId: a?._id || null,
      status: a ? a.status : "not_started",
      score: submitted ? a.score : null,
      total: submitted ? total : null,
      wrong: submitted ? total - a.score - unanswered : null,
      unanswered: submitted ? unanswered : null,
      percent: submitted ? percent(a.score, total) : null,
      grade: submitted ? gradeFor(percent(a.score, total)) : null,
      startedAt: a?.startedAt || null,
      submittedAt: a?.submittedAt || null,
    };
  });
}

// Courses this staff member can see for a student, with that student's results
export async function reportRows(studentId, session) {
  const filter = { students: studentId };
  if (session.role === "teacher") filter.teachers = session.sub;
  const courses = await Course.find(filter).select("title code").sort({ title: 1 }).lean();
  const attempts = await Attempt.find({ student: studentId, course: { $in: courses.map((c) => c._id) } }).select("course status score total questions.selected submittedAt").lean();
  const byCourse = Object.fromEntries(attempts.map((a) => [String(a.course), a]));
  return courses.map((c) => {
    const a = byCourse[String(c._id)];
    const submitted = a?.status === "submitted";
    return {
      courseId: c._id, title: c.title, code: c.code,
      status: a ? a.status : "not_started",
      score: submitted ? a.score : 0,
      total: submitted ? a.total || a.questions.length : 0,
      submittedAt: submitted ? a.submittedAt : null,
      attemptId: submitted ? a._id : null,
    };
  });
}

// Students this staff member can see (admin: all; teacher: students in their courses)
export async function visibleStudentIds(session) {
  if (session.role === "admin") return null; // no filter
  const courses = await Course.find({ teachers: session.sub }).select("students").lean();
  return [...new Set(courses.flatMap((c) => c.students.map(String)))];
}

export function pdfResponse(bytes, filename) {
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^A-Za-z0-9._-]/g, "-")}"`,
      "Cache-Control": "no-store",
    },
  });
}
