// Creates the first admin account. Run: npm run seed
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { MONGODB_URI, ADMIN_NAME = "System Admin", ADMIN_USERNAME = "admin", ADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !ADMIN_PASSWORD) {
  console.error("Set MONGODB_URI and ADMIN_PASSWORD in .env.local first.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const users = mongoose.connection.collection("users");
const username = ADMIN_USERNAME.toLowerCase().trim();
const existing = await users.findOne({ username });
if (existing) {
  console.log(`User "${username}" already exists. Nothing to do.`);
} else {
  await users.insertOne({
    name: ADMIN_NAME,
    username,
    password: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Admin "${username}" created. Sign in at http://localhost:3000/login`);
}
await mongoose.disconnect();
