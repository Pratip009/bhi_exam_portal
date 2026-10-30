"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Notice, Loading, Empty } from "./ui";
import DownloadButton from "./DownloadButton";

const STATUS = {
  submitted: { label: "Submitted", cls: "bg-right/10 text-right" },
  in_progress: { label: "In progress", cls: "bg-dawn/20 text-ink" },
  not_started: { label: "Not started", cls: "bg-sky text-ink/60" },
};

function Stat({ label, value, tone = "" }) {
  return (
    <div>
      <div className={`font-display text-2xl font-semibold ${tone}`}>{value ?? "—"}</div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}

// Results for one course: summary, course downloads, and every enrolled student.
export default function CourseResults({ courseId, showTitle = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => { api(`/api/reports/courses/${courseId}`).then(setData).catch((e) => setError(e.message)); }, [courseId]);

  if (error) return <Notice>{error}</Notice>;
  if (!data) return <Loading />;
  const { course, stats, rows } = data;
  const base = `/api/reports/courses/${courseId}`;
  const q = query.toLowerCase();
  const shown = rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (!q || [r.student.name, r.student.username, r.student.rollNo].some((v) => v?.toLowerCase().includes(q))));

  return (
    <div className="space-y-5">
      {showTitle && (
        <div>
          <h1 className="text-3xl font-semibold">{course.title}</h1>
          <p className="text-ink/60">{course.code} · {course.questionCount} questions in the bank · exam {course.isExamOpen ? "open" : "closed"}</p>
        </div>
      )}

      <div className="panel grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Enrolled" value={stats.enrolled} />
        <Stat label="Submitted" value={stats.submitted} />
        <Stat label="Not started" value={stats.notStarted} />
        <Stat label="Average" value={stats.average === null ? null : `${stats.average}%`} />
        <Stat label="Highest" value={stats.highest === null ? null : `${stats.highest}%`} tone="text-right" />
        <Stat label="Lowest" value={stats.lowest === null ? null : `${stats.lowest}%`} tone="text-wrong" />
        <Stat label="Pass rate (50%+)" value={stats.passRate === null ? null : `${stats.passRate}%`} />
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-ink/70">Course downloads</p>
        <div className="flex flex-wrap gap-2">
          <DownloadButton href={`${base}/csv`} className="btn-primary">Submissions (CSV)</DownloadButton>
          <DownloadButton href={`${base}/paper`}>Question paper (PDF)</DownloadButton>
          <DownloadButton href={`${base}/paper?key=1`}>Answer key (PDF)</DownloadButton>
        </div>
      </div>

      {!rows.length ? (
        <Empty title="No students are enrolled in this course">The administrator assigns students to courses.</Empty>
      ) : (
        <div className="panel p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg bg-sky p-1 text-sm">
              {[["all", "All"], ["submitted", "Submitted"], ["in_progress", "In progress"], ["not_started", "Not started"]].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1.5 ${filter === k ? "bg-ink text-white" : "text-ink/70 hover:bg-paper"}`}>{l}</button>
              ))}
            </div>
            <input className="input max-w-xs" placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Roll no.</th><th>Status</th><th>Score</th><th>Grade</th><th>Submitted</th><th className="text-right">Downloads</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.student._id}>
                    <td className="font-medium">{r.student.name}</td>
                    <td>{r.student.rollNo || r.student.username}</td>
                    <td><span className={`tag ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
                    <td>{r.status === "submitted" ? <>{r.score} / {r.total} <span className="text-ink/50">({r.percent}%)</span></> : "—"}</td>
                    <td className={`font-semibold ${r.percent === null ? "" : r.percent >= 50 ? "text-right" : "text-wrong"}`}>{r.grade || "—"}</td>
                    <td className="whitespace-nowrap">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
                    <td>
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        {r.status === "submitted" && (
                          <>
                            <DownloadButton href={`/api/reports/attempts/${r.attemptId}/pdf?type=result`} className="btn-ghost px-3 py-1" title="The student's answers marked against the correct answers">Result</DownloadButton>
                            <DownloadButton href={`/api/reports/attempts/${r.attemptId}/pdf?type=paper`} className="btn-ghost px-3 py-1" title="The question paper this student received">Paper</DownloadButton>
                          </>
                        )}
                        <DownloadButton href={`/api/reports/students/${r.student._id}/report-card`} className="btn-ghost px-3 py-1">Report card</DownloadButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <p className="py-6 text-center text-sm text-ink/50">No students match.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
