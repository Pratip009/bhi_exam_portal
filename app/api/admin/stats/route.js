import User from "@/models/User";
import Course from "@/models/Course";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import { handler, json } from "@/lib/api";

export const GET = handler(["admin"], async () => {
  const [teachers, students, courses, questions, exams] = await Promise.all([
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "student" }),
    Course.countDocuments(),
    Question.countDocuments(),
    Attempt.countDocuments({ status: "submitted" }),
  ]);
  return json({ teachers, students, courses, questions, exams });
});

export const dynamic = "force-dynamic";
