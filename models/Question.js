import mongoose from "mongoose";

const opt = { type: String, required: true, trim: true };

const QuestionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    text: { type: String, required: [true, "Question text is required"], trim: true },
    options: { A: opt, B: opt, C: opt, D: opt },
    answer: { type: String, enum: ["A", "B", "C", "D"], required: [true, "Correct answer is required"] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema);
