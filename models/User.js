import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    username: { type: String, required: [true, "Username is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    role: { type: String, enum: ["admin", "teacher", "student"], required: true },
    rollNo: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
