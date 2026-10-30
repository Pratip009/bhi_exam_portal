import Course from "@/models/Course";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import User from "@/models/User";
import { handler, json, HttpError, assertId } from "@/lib/api";

export const GET = handler(["admin"], async (req, { params }) => {
  assertId(params.id, "Course");
  const course = await Course.findById(params.id).lean();
  if (!course) throw new HttpError(404, "Course not found");
  return json(course);
});

// Update details and assignments: { title, description, teachers: [ids], students: [ids] }
export const PUT = handler(["admin"], async (req, { params }) => {
  assertId(params.id, "Course");
  const body = await req.json();
  const course = await Course.findById(params.id);
  if (!course) throw new HttpError(404, "Course not found");
  if (body.title !== undefined) course.title = body.title;
  if (body.description !== undefined) course.description = body.description;
  if (Array.isArray(body.teachers)) {
    course.teachers = (await User.find({ _id: { $in: body.teachers }, role: "teacher" }).select("_id")).map((u) => u._id);
  }
  if (Array.isArray(body.students)) {
    course.students = (await User.find({ _id: { $in: body.students }, role: "student" }).select("_id")).map((u) => u._id);
  }
  await course.save();
  return json(course);
});

export const DELETE = handler(["admin"], async (req, { params }) => {
  assertId(params.id, "Course");
  const course = await Course.findByIdAndDelete(params.id);
  if (!course) throw new HttpError(404, "Course not found");
  await Promise.all([Question.deleteMany({ course: course._id }), Attempt.deleteMany({ course: course._id })]);
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
