import Course from "@/models/Course";
import { HttpError, assertId } from "./api";

export async function courseForTeacher(courseId, session) {
  assertId(courseId, "Course");
  const course = await Course.findOne({ _id: courseId, teachers: session.sub });
  if (!course) throw new HttpError(404, "Course not found or not assigned to you");
  return course;
}

const LETTERS = ["A", "B", "C", "D"];

export function normalizeAnswer(v) {
  const a = String(v ?? "").trim().toUpperCase().replace(/^OPTION\s*/, "");
  return LETTERS.includes(a) ? a : null;
}

// Validates { text, options:{A..D}, answer } and returns a clean object or throws a message
export function cleanQuestion(q) {
  const text = String(q.text ?? "").trim();
  const options = {};
  for (const L of LETTERS) options[L] = String(q.options?.[L] ?? "").trim();
  const answer = normalizeAnswer(q.answer);
  if (!text) throw new Error("question text is empty");
  const missing = LETTERS.filter((L) => !options[L]);
  if (missing.length) throw new Error(`option ${missing.join(", ")} is empty`);
  if (!answer) throw new Error(`answer must be A, B, C or D (got "${q.answer ?? ""}")`);
  return { text, options, answer };
}
