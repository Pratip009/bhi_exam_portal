import Papa from "papaparse";
import Question from "@/models/Question";
import { handler, json, HttpError } from "@/lib/api";
import { courseForTeacher, cleanQuestion } from "@/lib/teacher";

// CSV columns: question, optionA, optionB, optionC, optionD, answer
// Header names are flexible: "Option A", "option_a", "A" all work.
const pick = (row, ...keys) => keys.map((k) => row[k]).find((v) => v !== undefined && v !== "");

export const POST = handler(["teacher"], async (req, { params }, session) => {
  const course = await courseForTeacher(params.id, session);
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "Choose a CSV file to upload.");
  if (file.size > 2 * 1024 * 1024) throw new HttpError(400, "The CSV file must be smaller than 2 MB.");

  const text = (await file.text()).replace(/^\uFEFF/, "");
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_\-]/g, ""),
  });
  if (!data.length) throw new HttpError(400, "The CSV file has no question rows.");

  const docs = [];
  const errors = [];
  data.forEach((row, i) => {
    try {
      const clean = cleanQuestion({
        text: pick(row, "question", "questiontext", "text"),
        options: {
          A: pick(row, "optiona", "a"),
          B: pick(row, "optionb", "b"),
          C: pick(row, "optionc", "c"),
          D: pick(row, "optiond", "d"),
        },
        answer: pick(row, "answer", "correct", "correctanswer", "key", "answerkey"),
      });
      docs.push({ ...clean, course: course._id, createdBy: session.sub });
    } catch (e) {
      errors.push({ row: i + 2, message: e.message }); // +2: header row and 1-based lines
    }
  });

  if (docs.length) await Question.insertMany(docs);
  return json({ inserted: docs.length, skipped: errors.length, errors: errors.slice(0, 50) });
});

export const dynamic = "force-dynamic";
