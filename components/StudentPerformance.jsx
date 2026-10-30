"use client";

import { Fragment, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { gradeFor, percent } from "@/lib/grade";
import { Notice, Loading, Empty } from "./ui";
import DownloadButton from "./DownloadButton";

function Detail({ studentId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(`/api/reports/students/${studentId}`).then(setData).catch((e) => setError(e.message)); }, [studentId]);
  if (error) return <p className="text-sm text-wrong">{error}</p>;
  if (!data) return <p className="text-sm text-ink/50">Loading…</p>;
  if (!data.rows.length) return <p className="text-sm text-ink/50">Not enrolled in any course.</p>;
  return (
    <table className="table">
      <thead><tr><th>Course</th><th>Status</th><th>Score</th><th>Grade</th><th className="text-right">Downloads</th></tr></thead>
      <tbody>
        {data.rows.map((r) => {
          const done = r.status === "submitted";
          const pct = done ? percent(r.score, r.total) : null;
          return (
            <tr key={r.courseId}>
              <td><span className="font-medium">{r.title}</span> <span className="text-ink/50">{r.code}</span></td>
              <td>{done ? "Submitted" : r.status === "in_progress" ? "In progress" : "Not started"}</td>
              <td>{done ? `${r.score} / ${r.total} (${pct}%)` : "—"}</td>
              <td className={`font-semibold ${pct === null ? "" : pct >= 50 ? "text-right" : "text-wrong"}`}>{done ? gradeFor(pct) : "—"}</td>
              <td>
                {done && (
                  <div className="flex justify-end gap-2">
                    <DownloadButton href={`/api/reports/attempts/${r.attemptId}/pdf?type=result`} className="btn-ghost px-3 py-1">Result</DownloadButton>
                    <DownloadButton href={`/api/reports/attempts/${r.attemptId}/pdf?type=paper`} className="btn-ghost px-3 py-1">Paper</DownloadButton>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Every visible student with an overall summary, report card download and per-course detail.
export default function StudentPerformance() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [sort, setSort] = useState("name");

  useEffect(() => { api("/api/reports/students").then(setStudents).catch((e) => setError(e.message)); }, []);
  if (error) return <Notice>{error}</Notice>;
  if (!students) return <Loading />;
  if (!students.length) return <Empty title="No students yet">Students appear here once they are enrolled in a course.</Empty>;

  const q = query.toLowerCase();
  const shown = students
    .filter((s) => !q || [s.name, s.username, s.rollNo].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (b.average ?? -1) - (a.average ?? -1)));

  return (
    <div className="panel p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input className="input max-w-xs" placeholder="Search by name, username or roll no." value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          Sort by
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Name</option>
            <option value="average">Average score</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Student</th><th>Roll no.</th><th>Exams taken</th><th>Average</th><th>Grade</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {shown.map((s) => (
              <Fragment key={s._id}>
                <tr>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.rollNo || s.username}</td>
                  <td>{s.completed} of {s.enrolled}</td>
                  <td>{s.average === null ? "—" : `${s.average}%`}</td>
                  <td className={`font-semibold ${s.average === null ? "" : s.average >= 50 ? "text-right" : "text-wrong"}`}>{s.grade || "—"}</td>
                  <td>
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button className="btn-ghost px-3 py-1" onClick={() => setOpen(open === s._id ? null : s._id)} aria-expanded={open === s._id}>
                        {open === s._id ? "Hide courses" : "Courses"}
                      </button>
                      <DownloadButton href={`/api/reports/students/${s._id}/report-card`} className="btn-primary px-3 py-1">Report card</DownloadButton>
                    </div>
                  </td>
                </tr>
                {open === s._id && (
                  <tr><td colSpan={6} className="bg-sky/50"><Detail studentId={s._id} /></td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="py-6 text-center text-sm text-ink/50">No students match.</p>}
      </div>
    </div>
  );
}
