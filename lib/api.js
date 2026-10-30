import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "./db";
import { getSession } from "./auth";
import "@/models"; // register all models for populate()

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

export function assertId(id, what = "Record") {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, `${what} not found`);
}

// Wraps a route handler with role checking, DB connection and error handling.
export function handler(roles, fn) {
  return async (req, ctx) => {
    try {
      const session = await getSession();
      if (roles && (!session || !roles.includes(session.role))) {
        return json({ error: "You are not allowed to do this. Please sign in again." }, 401);
      }
      await connectDB();
      return await fn(req, ctx || {}, session);
    } catch (e) {
      if (e?.digest === "DYNAMIC_SERVER_USAGE") throw e; // Next.js internal signal, not an app error
      if (e?.code === 11000) {
        const field = Object.keys(e.keyPattern || {})[0] || "value";
        return json({ error: `That ${field} is already in use.` }, 409);
      }
      if (e?.name === "ValidationError") {
        return json({ error: Object.values(e.errors).map((x) => x.message).join(", ") }, 400);
      }
      if (!e.status) console.error(e);
      return json({ error: e.status ? e.message : "Something went wrong on the server." }, e.status || 500);
    }
  };
}
