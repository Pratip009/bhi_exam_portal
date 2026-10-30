import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Course title is required"], trim: true },
    code: { type: String, required: [true, "Course code is required"], unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Exam settings (managed by the course teacher)
    questionsPerExam: { type: Number, default: 25, min: 1, max: 500 },
    isExamOpen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
