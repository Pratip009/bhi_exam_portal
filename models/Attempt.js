import mongoose from "mongoose";

// Questions are copied into the attempt so the paper and result stay
// exactly as the student saw them, even if the teacher edits questions later.
const AttemptQuestionSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    text: String,
    options: { A: String, B: String, C: String, D: String },
    answer: { type: String, enum: ["A", "B", "C", "D"] },
    selected: { type: String, enum: ["A", "B", "C", "D", null], default: null },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    questions: [AttemptQuestionSchema],
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AttemptSchema.index({ student: 1, course: 1 }, { unique: true }); // one attempt per course

export default mongoose.models.Attempt || mongoose.model("Attempt", AttemptSchema);
