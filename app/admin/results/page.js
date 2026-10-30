"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "@/components/ui";
import StudentPerformance from "@/components/StudentPerformance";
import DownloadButton from "@/components/DownloadButton";

function ByCourse() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/reports/courses").then(setCourses).catch((e) => setError(e.message)); }, []);
  if (error) return <Notice>{error}</Notice>;
  if (!courses) return <Loading />;
  if (!courses.length) return <Empty title="No courses yet">Create a course on the Courses page.</Empty>;
  return (
    <div className="panel overflow-x-auto p-5">
      <table className="table">
        <thead>
          <tr><th>Course</th><th>Teachers</th><th>Submitted</th><th>Average</th><th>Pass rate</th><th className="text-right">Actions</th></tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c._id}>
              <td><div className="font-medium">{c.title}</div><div className="text-xs text-ink/50">{c.code} · exam {c.isExamOpen ? "open" : "closed"}</div></td>
              <td>{c.teachers.length ? c.teachers.join(", ") : <span className="text-ink/50">None</span>}</td>
              <td>{c.submitted} of {c.enrolled}</td>
              <td>{c.average === null ? "—" : `${c.average}%`}</td>
              <td>{c.passRate === null ? "—" : `${c.passRate}%`}</td>
              <td>
                <div className="flex justify-end gap-2 whitespace-nowrap">
                  <DownloadButton href={`/api/reports/courses/${c._id}/csv`} className="btn-ghost px-3 py-1">CSV</DownloadButton>
                  <Link href={`/admin/results/${c._id}`} className="btn-primary px-3 py-1">View results</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminResults() {
  const [tab, setTab] = useState("course");
  return (
    <>
      <PageHeader title="Results" subtitle="Monitor performance by course or by student, and download reports." />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-ink/10">
        {[["course", "By course"], ["student", "By student"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`border-b-2 px-4 py-2.5 text-sm ${tab === k ? "border-dawn font-medium" : "border-transparent text-ink/60 hover:text-ink"}`}>{l}</button>
        ))}
      </div>
      {tab === "course" ? <ByCourse /> : <StudentPerformance />}
    </>
  );
}
