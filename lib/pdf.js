// One-page PDFs for the question paper and the result.
// Questions flow into one or two columns, and the text size is reduced step by
// step until everything fits on a single A4 page. Only very large exams (where
// even the smallest readable size is not enough) continue onto a second page.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { gradeFor } from "./grade";

const INK = rgb(0.184, 0.192, 0.439); // #2F3170, the logo blue
const DAWN = rgb(0.949, 0.663, 0.231);
const MUTED = rgb(0.38, 0.42, 0.49);
const RIGHT = rgb(0.122, 0.478, 0.322);
const WRONG = rgb(0.722, 0.227, 0.149);
const BLACK = rgb(0.1, 0.1, 0.12);
const RIGHT_BG = rgb(0.87, 0.95, 0.9);
const WRONG_BG = rgb(0.99, 0.89, 0.86);
const PANEL_BG = rgb(0.918, 0.941, 0.969);
const W = 595.28, H = 841.89, M = 32, GUTTER = 16, BOTTOM = M + 14;
const LETTERS = ["A", "B", "C", "D"];
const MAX_SIZE = 10.5, MIN_SIZE = 5.5;

// Standard PDF fonts only support basic Latin; simplify anything else.
function clean(s) {
  return String(s ?? "")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-")
    .normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}

function wrap(text, font, size, maxWidth) {
  const words = clean(text).split(" ");
  const lines = [];
  let line = "";
  for (let word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) { line = test; continue; }
    if (line) lines.push(line);
    while (word.length > 1 && font.widthOfTextAtSize(word, size) > maxWidth) {
      let i = word.length;
      while (i > 1 && font.widthOfTextAtSize(word.slice(0, i), size) > maxWidth) i--;
      lines.push(word.slice(0, i));
      word = word.slice(i);
    }
    line = word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function fit(text, font, size, maxWidth) {
  let t = clean(text);
  if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 1 && font.widthOfTextAtSize(t + "...", size) > maxWidth) t = t.slice(0, -1);
  return t + "...";
}

let logoBytes;
async function loadLogo() {
  if (!logoBytes) logoBytes = await readFile(path.join(process.cwd(), "public", "logo.png"));
  return logoBytes;
}

const fmt = (d) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-");

// ---------- header, summary, footer ----------

// ctx.head = { title, right, meta: [[label, value], ...] }
function drawHeader(page, ctx) {
  const { fonts, logo, subtitle, head } = ctx;
  const top = H - M;
  page.drawImage(logo, { x: M, y: top - 46, width: 46, height: 46 });
  page.drawText("Bright Horizon Institute", { x: M + 56, y: top - 19, size: 15, font: fonts.bold, color: INK });
  page.drawText(subtitle, { x: M + 56, y: top - 33, size: 9.5, font: fonts.regular, color: MUTED });

  const right = W - M;
  const maxRight = W - 2 * M - 250;
  if (head.title) {
    const t = fit(head.title, fonts.bold, 11, maxRight);
    page.drawText(t, { x: right - fonts.bold.widthOfTextAtSize(t, 11), y: top - 19, size: 11, font: fonts.bold, color: INK });
  }
  if (head.right) {
    const r = fit(head.right, fonts.regular, 8.5, maxRight);
    page.drawText(r, { x: right - fonts.regular.widthOfTextAtSize(r, 8.5), y: top - 33, size: 8.5, font: fonts.regular, color: MUTED });
  }

  // one meta line: label value   label value ...
  let x = M;
  const y = top - 62;
  for (const [k, v] of head.meta || []) {
    const label = `${k}: `;
    page.drawText(label, { x, y, size: 8.5, font: fonts.bold, color: MUTED });
    x += fonts.bold.widthOfTextAtSize(label, 8.5);
    const val = fit(v, fonts.regular, 8.5, 150);
    page.drawText(val, { x, y, size: 8.5, font: fonts.regular, color: BLACK });
    x += fonts.regular.widthOfTextAtSize(val, 8.5) + 18;
  }
  page.drawRectangle({ x: M, y: top - 72, width: W - 2 * M, height: 1.5, color: DAWN });
  return top - 82;
}

function drawSummary(page, ctx, top) {
  const { fonts, attempt } = ctx;
  const correct = attempt.score;
  const unanswered = attempt.questions.filter((q) => !q.selected).length;
  const wrong = attempt.total - correct - unanswered;
  const pct = attempt.total ? Math.round((correct / attempt.total) * 100) : 0;
  const h = 34;
  page.drawRectangle({ x: M, y: top - h, width: W - 2 * M, height: h, color: PANEL_BG });
  const base = top - 22;
  const score = `${correct} / ${attempt.total}`;
  page.drawText(score, { x: M + 10, y: base, size: 16, font: fonts.bold, color: INK });
  let x = M + 16 + fonts.bold.widthOfTextAtSize(score, 16);
  page.drawText(`${pct}%`, { x, y: base, size: 10, font: fonts.regular, color: MUTED });
  x += 46;
  for (const [k, v, c] of [["Correct", correct, RIGHT], ["Wrong", wrong, WRONG], ["Not answered", unanswered, MUTED]]) {
    page.drawText(String(v), { x, y: base, size: 12, font: fonts.bold, color: c });
    const vw = fonts.bold.widthOfTextAtSize(String(v), 12);
    page.drawText(k, { x: x + vw + 4, y: base, size: 8.5, font: fonts.regular, color: MUTED });
    x += vw + 4 + fonts.regular.widthOfTextAtSize(k, 8.5) + 18;
  }
  // legend
  let lx = W - M - 10;
  for (const [label, bg, fg] of [["Your wrong answer", WRONG_BG, WRONG], ["Correct answer", RIGHT_BG, RIGHT]]) {
    const tw = fonts.regular.widthOfTextAtSize(label, 8);
    lx -= tw;
    page.drawText(label, { x: lx, y: base + 1, size: 8, font: fonts.regular, color: fg });
    lx -= 13;
    page.drawRectangle({ x: lx, y: base, width: 9, height: 8, color: bg, borderColor: fg, borderWidth: 0.6 });
    lx -= 12;
  }
  return top - h - 10;
}

function drawFooter(doc, fonts) {
  const pages = doc.getPages();
  const stamp = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  pages.forEach((p, i) => {
    p.drawText(`Bright Horizon Institute  |  Generated ${stamp}`, { x: M, y: M - 8, size: 7, font: fonts.regular, color: MUTED });
    if (pages.length > 1) {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, { x: W - M - fonts.regular.widthOfTextAtSize(label, 7), y: M - 8, size: 7, font: fonts.regular, color: MUTED });
    }
  });
}

// ---------- question blocks ----------

function buildBlock(q, i, size, colW, fonts, mode, flow = false) {
  const isResult = mode === "result";
  const showAns = mode !== "paper"; // result and answer key highlight the correct option
  const lineH = size * 1.28;
  const bar = isResult ? 6 : 0; // room for the status bar on the left
  const innerW = colW - bar;
  const head = wrap(`${i + 1}. ${q.text}`, fonts.bold, size, innerW);
  const labelW = (L) => fonts.bold.widthOfTextAtSize(L, size) + size * 0.5;
  const padX = 2.5, cellGap = 4;

  let note = null;
  if (isResult && q.selected !== q.answer) {
    note = q.selected ? `You chose ${q.selected}, the correct answer is ${q.answer}.` : `Not answered. The correct answer is ${q.answer}.`;
  }
  // Grid mode: 4 across, then 2 across, then one per line (wrapped).
  // Flow mode: options run on inline like a sentence, wrapping as needed (most compact).
  let perRow = 1, cellW = innerW, cells, rows = [], flowLines = null;
  if (flow) {
    const optGap = size * 1.1;
    flowLines = [[]]; // each line: [{L, text, x, w}]
    let x = 0;
    for (const L of LETTERS) {
      const words = clean(q.options[L]).split(" ");
      // highlighted options are drawn in bold, so measure them in bold
      const f = (showAns && L === q.answer) || (isResult && L === q.selected) ? fonts.bold : fonts.regular;
      const sp = f.widthOfTextAtSize(" ", size);
      let seg = null;
      const startSeg = (first) => {
        seg = { L, label: first, text: "", x, w: 0 };
        flowLines[flowLines.length - 1].push(seg);
        if (first) { seg.w = labelW(L) + padX; x += seg.w; }
      };
      if (x > 0 && x + labelW(L) + f.widthOfTextAtSize(words[0] || "", size) + padX * 2 > innerW) { flowLines.push([]); x = 0; }
      startSeg(true);
      for (const w of words) {
        const add = (seg.text ? sp : 0) + f.widthOfTextAtSize(w, size);
        if (x + add + padX > innerW && seg.text) {
          flowLines.push([]); x = 0; startSeg(false);
          seg.text = w; seg.w = f.widthOfTextAtSize(w, size); x += seg.w;
        } else {
          seg.text += (seg.text ? " " : "") + w; seg.w += add; x += add;
        }
      }
      seg.w += padX; x += padX + optGap;
    }
    if (note) {
      // in the compact layout the note runs on after the options
      const short = q.selected ? `(You chose ${q.selected}, answer is ${q.answer})` : `(Not answered, answer is ${q.answer})`;
      const nw = fonts.regular.widthOfTextAtSize(short, size);
      if (x + nw > innerW) { flowLines.push([]); x = 0; }
      flowLines[flowLines.length - 1].push({ L: "note", label: false, text: short, x, w: nw });
      note = null;
    }
    rows = flowLines.map(() => ({ h: lineH }));
  } else {
    for (const n of [4, 2]) {
      const w = (innerW - cellGap * (n - 1)) / n;
      if (LETTERS.every((L) => labelW(L) + fonts.regular.widthOfTextAtSize(clean(q.options[L]), size) + padX * 2 <= w)) {
        perRow = n; cellW = w; break;
      }
    }
    cells = LETTERS.map((L) => ({
      L,
      lines: perRow > 1 ? [clean(q.options[L])] : wrap(q.options[L], fonts.regular, size, innerW - labelW(L) - padX * 2),
    }));
    for (let r = 0; r < 4; r += perRow) {
      const rc = cells.slice(r, r + perRow);
      rows.push({ cells: rc, h: Math.max(...rc.map((c) => c.lines.length)) * lineH + size * 0.2 });
    }
  }

  const noteSize = size * 0.88;
  const contentH = head.length * lineH + size * 0.15 + rows.reduce((s, r) => s + r.h, 0) + (note ? noteSize * 1.3 : 0);
  const height = contentH + size * 0.85;

  function draw(page, x, top) {
    if (isResult) {
      const c = !q.selected ? MUTED : q.selected === q.answer ? RIGHT : WRONG;
      page.drawRectangle({ x, y: top - contentH, width: 2, height: contentH, color: c });
    }
    const cx = x + bar;
    let y = top;
    for (const line of head) {
      page.drawText(line, { x: cx, y: y - size, size, font: fonts.bold, color: BLACK });
      y -= lineH;
    }
    y -= size * 0.15;
    const styleFor = (L) => {
      const isAns = showAns && L === q.answer;
      const isWrongPick = isResult && L === q.selected && q.selected !== q.answer;
      return { hi: isAns || isWrongPick, bg: isAns ? RIGHT_BG : WRONG_BG, color: isAns ? RIGHT : isWrongPick ? WRONG : BLACK };
    };
    if (flowLines) {
      for (const line of flowLines) {
        for (const seg of line) {
          if (seg.L === "note") {
            page.drawText(seg.text, { x: cx + seg.x, y: y - size * 1.02, size, font: fonts.regular, color: q.selected ? WRONG : MUTED });
            continue;
          }
          const st = styleFor(seg.L);
          const ox = cx + seg.x;
          if (st.hi) page.drawRectangle({ x: ox, y: y - lineH + size * 0.05, width: seg.w, height: lineH - size * 0.1, color: st.bg });
          let tx = ox + padX;
          if (seg.label) {
            page.drawText(seg.L, { x: tx, y: y - size * 1.02, size, font: fonts.bold, color: st.hi ? st.color : MUTED });
            tx = ox + labelW(seg.L) + padX;
          }
          if (seg.text) page.drawText(seg.text, { x: seg.label ? tx : ox, y: y - size * 1.02, size, font: st.hi ? fonts.bold : fonts.regular, color: st.color });
        }
        y -= lineH;
      }
    }
    for (const row of flowLines ? [] : rows) {
      row.cells.forEach((cell, j) => {
        const ox = cx + j * (cellW + cellGap);
        const isAns = showAns && cell.L === q.answer;
        const isWrongPick = isResult && cell.L === q.selected && q.selected !== q.answer;
        if (isAns || isWrongPick) {
          page.drawRectangle({ x: ox, y: y - row.h, width: cellW, height: row.h, color: isAns ? RIGHT_BG : WRONG_BG });
        }
        const color = isAns ? RIGHT : isWrongPick ? WRONG : BLACK;
        const font = isAns || isWrongPick ? fonts.bold : fonts.regular;
        const ty = y - size * 1.02;
        page.drawText(cell.L, { x: ox + padX, y: ty, size, font: fonts.bold, color: isAns || isWrongPick ? color : MUTED });
        cell.lines.forEach((ln, k) => {
          page.drawText(ln, { x: ox + padX + labelW(cell.L), y: ty - k * lineH, size, font, color });
        });
      });
      y -= row.h;
    }
    if (note) {
      page.drawText(note, { x: cx, y: y - noteSize * 1.05, size: noteSize, font: fonts.regular, color: q.selected ? WRONG : MUTED });
    }
  }
  return { height, draw };
}

// Places blocks top-to-bottom, column by column. Returns pages of placements, or null if it doesn't fit.
function place(blocks, cols, firstTop, nextTop, allowPages, bottom = BOTTOM) {
  const colW = (W - 2 * M - GUTTER * (cols - 1)) / cols;
  const pages = [[]];
  let col = 0, top = firstTop, y = top;
  for (const b of blocks) {
    if (y - b.height < bottom && y !== top) {
      col++;
      y = top;
      if (col >= cols) {
        if (!allowPages) return null;
        pages.push([]);
        col = 0; top = nextTop; y = top;
      }
    }
    if (y - b.height < bottom && !allowPages) return null;
    pages[pages.length - 1].push({ b, x: M + col * (colW + GUTTER), y });
    y -= b.height;
  }
  return pages;
}

function layout(questions, fonts, firstTop, nextTop, mode) {
  const build = (size, cols, flow) => {
    const colW = (W - 2 * M - GUTTER * (cols - 1)) / cols;
    return questions.map((q, i) => buildBlock(q, i, size, colW, fonts, mode, flow));
  };
  // Largest text size that fits on one page wins; at equal size prefer the roomier layouts.
  for (let size = MAX_SIZE; size >= MIN_SIZE; size -= 0.25) {
    for (const [cols, flow] of [[1, false], [2, false], [2, true]]) {
      const blocks = build(size, cols, flow);
      const pages = place(blocks, cols, firstTop, nextTop, false);
      if (!pages) continue;
      if (cols === 1) return pages;
      // balance the two columns: raise the column bottom as far as it still fits
      const total = blocks.reduce((sum, b) => sum + b.height, 0);
      for (let bottom = Math.max(BOTTOM, firstTop - total / 2); bottom > BOTTOM; bottom -= 2) {
        const balanced = place(blocks, cols, firstTop, nextTop, false, bottom);
        if (balanced) return balanced;
      }
      return pages;
    }
  }
  // Too many questions for one page even at the smallest size
  return place(build(6.5, 2, true), 2, firstTop, nextTop, true);
}

async function newDoc(subtitle) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Bright Horizon Institute - ${subtitle}`);
  doc.setAuthor("Bright Horizon Institute");
  const fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const logo = await doc.embedPng(await loadLogo());
  return { doc, fonts, logo };
}

// Renders a set of questions. summary(ctx, page, top) is drawn on the first page only.
async function renderQuestions({ subtitle, head, questions, mode, summary }) {
  const { doc, fonts, logo } = await newDoc(subtitle);
  const ctx = { fonts, logo, subtitle, head };
  const firstTop = (H - M - 82) - (summary ? 44 : 0);
  const nextTop = H - M - 82;
  const pages = layout(questions, fonts, firstTop, nextTop, mode);
  pages.forEach((placements, idx) => {
    const page = doc.addPage([W, H]);
    let top = drawHeader(page, ctx);
    if (idx === 0 && summary) top = summary(page, ctx, top);
    for (const { b, x, y } of placements) b.draw(page, x, y);
  });
  drawFooter(doc, fonts);
  return doc.save();
}

function attemptHead(attempt, student) {
  return {
    title: `${attempt.course.title} (${attempt.course.code})`,
    right: `Submitted ${fmt(attempt.submittedAt)}`,
    meta: [["Student", student.name], ["Roll no.", student.rollNo || "-"], ["Username", student.username], ["Questions", String(attempt.questions.length)]],
  };
}

export { gradeFor };

// The paper exactly as this student received it (no answers)
export function buildPaperPdf(attempt, student) {
  return renderQuestions({ subtitle: "Question Paper", head: attemptHead(attempt, student), questions: attempt.questions, mode: "paper" });
}

// This student's submission: their choices against the correct answers
export function buildResultPdf(attempt, student) {
  return renderQuestions({
    subtitle: "Exam Result",
    head: attemptHead(attempt, student),
    questions: attempt.questions,
    mode: "result",
    summary: (page, ctx, top) => drawSummary(page, { ...ctx, attempt }, top),
  });
}

// The whole question bank of a course, as a blank paper or as an answer key
export function buildCoursePaperPdf(course, questions, { answerKey = false } = {}) {
  return renderQuestions({
    subtitle: answerKey ? "Answer Key" : "Question Paper",
    head: {
      title: `${course.title} (${course.code})`,
      right: answerKey ? "For teachers only" : `Question bank, ${questions.length} questions`,
      meta: [["Course", course.title], ["Code", course.code], ["Questions", String(questions.length)], ["Printed", fmt(new Date())]],
    },
    questions,
    mode: answerKey ? "key" : "paper",
  });
}

// ---------- report card ----------

// rows: [{ title, code, status: "submitted" | "in_progress" | "not_started", score, total, submittedAt }]
export async function buildReportCardPdf(student, rows, { scope } = {}) {
  const subtitle = "Report Card";
  const { doc, fonts, logo } = await newDoc(subtitle);
  const page = doc.addPage([W, H]);
  const head = {
    title: student.name,
    right: scope || "All courses",
    meta: [["Student", student.name], ["Roll no.", student.rollNo || "-"], ["Username", student.username], ["Issued", fmt(new Date())]],
  };
  let y = drawHeader(page, { fonts, logo, subtitle, head });

  const done = rows.filter((r) => r.status === "submitted");
  const sumScore = done.reduce((s, r) => s + r.score, 0);
  const sumTotal = done.reduce((s, r) => s + r.total, 0);
  const avgPct = done.length ? Math.round(done.reduce((s, r) => s + (r.total ? r.score / r.total : 0), 0) / done.length * 100) : null;

  // summary band
  const bandH = 52;
  page.drawRectangle({ x: M, y: y - bandH, width: W - 2 * M, height: bandH, color: PANEL_BG });
  const stats = [
    ["Overall grade", avgPct === null ? "-" : gradeFor(avgPct), INK],
    ["Average score", avgPct === null ? "-" : `${avgPct}%`, INK],
    ["Marks", done.length ? `${sumScore} / ${sumTotal}` : "-", INK],
    ["Exams taken", `${done.length} of ${rows.length}`, INK],
  ];
  const cw = (W - 2 * M) / stats.length;
  stats.forEach(([k, v, c], i) => {
    const x = M + 14 + i * cw;
    page.drawText(v, { x, y: y - 28, size: i === 0 ? 22 : 16, font: fonts.bold, color: c });
    page.drawText(k, { x, y: y - 42, size: 8.5, font: fonts.regular, color: MUTED });
  });
  y -= bandH + 22;

  // table
  const cols = [
    { k: "Course", w: 0.34 }, { k: "Code", w: 0.12 }, { k: "Status", w: 0.14 },
    { k: "Marks", w: 0.1, right: true }, { k: "Percent", w: 0.1, right: true }, { k: "Grade", w: 0.08, right: true }, { k: "Submitted", w: 0.12, right: true },
  ];
  const tw = W - 2 * M;
  const xs = [];
  let acc = M;
  for (const c of cols) { xs.push(acc); acc += c.w * tw; }
  const rowH = rows.length > 24 ? 15 : 20;
  const size = rows.length > 24 ? 8 : 9.5;
  const cell = (text, i, yy, font, color) => {
    const c = cols[i];
    const t = fit(text, font, size, c.w * tw - 10);
    const tx = c.right ? xs[i] + c.w * tw - 6 - font.widthOfTextAtSize(t, size) : xs[i] + 6;
    page.drawText(t, { x: tx, y: yy, size, font, color });
  };
  page.drawRectangle({ x: M, y: y - rowH + 6, width: tw, height: rowH, color: INK });
  cols.forEach((c, i) => cell(c.k, i, y - rowH + 6 + (rowH - size) / 2 + 1, fonts.bold, rgb(1, 1, 1)));
  y -= rowH;

  if (!rows.length) {
    page.drawText("This student is not enrolled in any course yet.", { x: M + 6, y: y - 14, size: 10, font: fonts.regular, color: MUTED });
    y -= rowH;
  }
  rows.forEach((r, idx) => {
    const ty = y - rowH + 6 + (rowH - size) / 2 + 1;
    if (idx % 2 === 1) page.drawRectangle({ x: M, y: y - rowH + 6, width: tw, height: rowH, color: rgb(0.965, 0.973, 0.984) });
    const pct = r.status === "submitted" && r.total ? Math.round((r.score / r.total) * 100) : null;
    const statusText = { submitted: "Completed", in_progress: "In progress", not_started: "Not taken" }[r.status];
    const gradeColor = pct === null ? MUTED : pct >= 50 ? RIGHT : WRONG;
    cell(r.title, 0, ty, fonts.bold, BLACK);
    cell(r.code, 1, ty, fonts.regular, MUTED);
    cell(statusText, 2, ty, fonts.regular, r.status === "submitted" ? BLACK : MUTED);
    cell(pct === null ? "-" : `${r.score} / ${r.total}`, 3, ty, fonts.regular, BLACK);
    cell(pct === null ? "-" : `${pct}%`, 4, ty, fonts.regular, BLACK);
    cell(pct === null ? "-" : gradeFor(pct), 5, ty, fonts.bold, gradeColor);
    cell(r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-GB") : "-", 6, ty, fonts.regular, MUTED);
    y -= rowH;
  });
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.8, color: INK });

  // grading scale
  y -= 14;
  page.drawText("Grading scale:  A+ 90-100%   A 80-89%   B 70-79%   C 60-69%   D 50-59%   F below 50%", { x: M, y, size: 8, font: fonts.regular, color: MUTED });
  y -= 12;
  page.drawText("Overall grade is based on the average percentage of completed exams.", { x: M, y, size: 8, font: fonts.regular, color: MUTED });

  // signatures
  const sy = BOTTOM + 40;
  [["Class teacher", M], ["Principal", W - M - 160]].forEach(([label, x]) => {
    page.drawLine({ start: { x, y: sy }, end: { x: x + 160, y: sy }, thickness: 0.6, color: MUTED });
    page.drawText(label, { x, y: sy - 12, size: 8.5, font: fonts.regular, color: MUTED });
  });

  drawFooter(doc, fonts);
  return doc.save();
}
