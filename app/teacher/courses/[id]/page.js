"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "@/components/ui";
import CourseResults from "@/components/CourseResults";
import DownloadButton from "@/components/DownloadButton";

const LETTERS = ["A", "B", "C", "D"];
const TABS = [
  { id: "bank", label: "Question bank" },
  { id: "add", label: "Add a question" },
  { id: "upload", label: "Upload CSV" },
  { id: "settings", label: "Exam settings" },
  { id: "results", label: "Results" },
];
const blankQ = { text: "", options: { A: "", B: "", C: "", D: "" }, answer: "" };

function QuestionForm({ courseId, editing, onDone, onCancel }) {
  const [q, setQ] = useState(editing || blankQ);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setQ(editing || blankQ), [editing]);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (editing) await api(`/api/teacher/questions/${editing._id}`, { method: "PUT", body: q });
      else await api(`/api/teacher/courses/${courseId}/questions`, { method: "POST", body: q });
      setQ(blankQ);
      onDone(editing ? "Question updated." : "Question added. Add another or switch to the question bank.");
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="panel max-w-3xl space-y-4 p-5">
      <h2 className="text-lg font-semibold">{editing ? "Edit question" : "New question"}</h2>
      <Notice>{error}</Notice>
      <div>
        <label className="label">Question</label>
        <textarea className="input" rows={3} value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} required />
      </div>
      <fieldset>
        <legend className="label">Options — select the correct one</legend>
        <div className="space-y-2">
          {LETTERS.map((L) => (
            <div key={L} className={`flex items-center gap-3 rounded-lg border p-2 ${q.answer === L ? "border-right bg-right/5" : "border-ink/10"}`}>
              <input type="radio" name="answer" aria-label={`Option ${L} is correct`} className="h-4 w-4 accent-right" checked={q.answer === L} onChange={() => setQ({ ...q, answer: L })} required />
              <span className="w-6 text-center font-display text-lg font-semibold">{L}</span>
              <input className="input" placeholder={`Option ${L}`} value={q.options[L]} onChange={(e) => setQ({ ...q, options: { ...q.options, [L]: e.target.value } })} required />
            </div>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add question"}</button>
        {editing && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function UploadCsv({ courseId, onDone }) {
  const fileRef = useRef(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a CSV file to upload.");
    setBusy(true); setError(""); setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api(`/api/teacher/courses/${courseId}/questions/upload`, { method: "POST", form });
      setReport(r);
      fileRef.current.value = "";
      if (r.inserted) onDone();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={upload} className="panel space-y-4 p-5">
        <h2 className="text-lg font-semibold">Upload questions in bulk</h2>
        <Notice>{error}</Notice>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky file:px-4 file:py-2 file:text-ink" />
        <button className="btn-primary" disabled={busy}>{busy ? "Uploading…" : "Upload questions"}</button>
        {report && (
          <div className="rounded-lg border border-ink/10 p-4 text-sm">
            <p><strong className="text-right">{report.inserted}</strong> questions added{report.skipped ? <>, <strong className="text-wrong">{report.skipped}</strong> rows skipped</> : "."}</p>
            {!!report.errors?.length && (
              <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-wrong">
                {report.errors.map((er) => <li key={er.row}>Row {er.row}: {er.message}</li>)}
              </ul>
            )}
          </div>
        )}
      </form>
      <div className="panel p-5 text-sm">
        <h2 className="text-lg font-semibold">CSV format</h2>
        <p className="mt-2 text-ink/70">The first row must be the header. The answer column holds the letter of the correct option.</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-sky p-3 text-xs">{`question,optionA,optionB,optionC,optionD,answer
What is 2 + 2?,3,4,5,6,B
"Capital of Japan, in English?",Kyoto,Osaka,Tokyo,Nara,C`}</pre>
        <p className="mt-3 text-ink/70">Wrap any text that contains a comma in double quotes. Save from Excel as “CSV UTF-8”.</p>
        <a href="/sample-questions.csv" download className="btn-ghost mt-4">Download sample CSV</a>
      </div>
    </div>
  );
}

function Settings({ course, onSaved }) {
  const [s, setS] = useState({ questionsPerExam: course.questionsPerExam });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body, okMsg) {
    setBusy(true); setError(""); setMsg("");
    try { await api(`/api/teacher/courses/${course._id}`, { method: "PATCH", body }); setMsg(okMsg); onSaved(); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Notice onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setMsg("")}>{msg}</Notice>
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">{course.isExamOpen ? "The exam is open" : "The exam is closed"}</h2>
          <p className="text-sm text-ink/60">{course.isExamOpen ? "Enrolled students can start the exam now." : "Students cannot start the exam until you open it."}</p>
        </div>
        <button className={course.isExamOpen ? "btn-danger" : "btn-accent"} disabled={busy}
          onClick={() => patch({ isExamOpen: !course.isExamOpen }, course.isExamOpen ? "Exam closed." : "Exam opened.")}>
          {course.isExamOpen ? "Close exam" : "Open exam"}
        </button>
      </div>
      <form className="panel space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); patch({ questionsPerExam: s.questionsPerExam }, "Settings saved."); }}>
        <h2 className="text-lg font-semibold">Exam format</h2>
        <div className="max-w-xs">
          <div>
            <label className="label">Questions per student</label>
            <input type="number" min={1} max={500} className="input" value={s.questionsPerExam} onChange={(e) => setS({ ...s, questionsPerExam: e.target.value })} required />
          </div>
        </div>
        <p className="text-sm text-ink/60">Each student gets this many questions, picked at random from the question bank. If the bank has fewer, they get all of them. There is no time limit.</p>
        <button className="btn-primary" disabled={busy}>Save settings</button>
      </form>
    </div>
  );
}

export default function TeacherCourse({ params }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("bank");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(() => api(`/api/teacher/courses/${params.id}`).then(setData).catch((e) => setError(e.message)), [params.id]);
  useEffect(() => { load(); }, [load]);

  async function remove(q) {
    if (!confirm("Delete this question?")) return;
    try { await api(`/api/teacher/questions/${q._id}`, { method: "DELETE" }); load(); } catch (e) { setError(e.message); }
  }

  if (!data) return error ? <Notice>{error}</Notice> : <Loading />;
  const { course, questions } = data;
  const shown = questions.filter((q) => !query || q.text.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Link href="/teacher" className="text-sm text-ink/60 hover:text-ink">← My courses</Link>
      <PageHeader title={course.title} subtitle={`${course.code} · ${questions.length} questions · ${course.isExamOpen ? "exam open" : "exam closed"}`} />
      <Notice onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setMsg("")}>{msg}</Notice>

      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-ink/10">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setMsg(""); if (t.id !== "add") setEditing(null); }}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm ${tab === t.id ? "border-dawn font-medium" : "border-transparent text-ink/60 hover:text-ink"}`}>
            {t.id === "add" && editing ? "Edit question" : t.label}
          </button>
        ))}
      </div>

      {tab === "bank" && (
        !questions.length ? (
          <Empty title="The question bank is empty">Add questions one at a time, or upload a CSV file with many at once.</Empty>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input className="input max-w-sm" placeholder="Search questions" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="flex gap-2">
                <DownloadButton href={`/api/reports/courses/${course._id}/paper`}>Question paper (PDF)</DownloadButton>
                <DownloadButton href={`/api/reports/courses/${course._id}/paper?key=1`}>Answer key (PDF)</DownloadButton>
              </div>
            </div>
            {shown.map((q) => (
              <article key={q._id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">{questions.indexOf(q) + 1}. {q.text}</p>
                  <div className="flex shrink-0 gap-2">
                    <button className="btn-ghost px-3 py-1" onClick={() => { setEditing(q); setTab("add"); }}>Edit</button>
                    <button className="btn-danger px-3 py-1" onClick={() => remove(q)}>Delete</button>
                  </div>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {LETTERS.map((L) => (
                    <li key={L} className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${q.answer === L ? "bg-right/10 text-right font-medium" : "bg-sky/60"}`}>
                      <span className="font-display font-semibold">{L}</span>{q.options[L]}
                      {q.answer === L && <span className="ml-auto text-xs">Correct</span>}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )
      )}
      {tab === "add" && (
        <QuestionForm courseId={course._id} editing={editing}
          onCancel={() => { setEditing(null); setTab("bank"); }}
          onDone={(m) => { setMsg(m); load(); if (editing) { setEditing(null); setTab("bank"); } }} />
      )}
      {tab === "upload" && <UploadCsv courseId={course._id} onDone={load} />}
      {tab === "settings" && <Settings course={course} onSaved={load} />}
      {tab === "results" && <CourseResults courseId={course._id} />}
    </>
  );
}
