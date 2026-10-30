import mongoose from "mongoose";

let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false });
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
