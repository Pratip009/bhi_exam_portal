"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "@/components/ui";

export default function CoursesPage() {
  const blank = { title: "", code: "", description: "" };
  const [courses, setCourses] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api("/api/admin/courses").then(setCourses).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/admin/courses", { method: "POST", body: form });
      setForm(blank);
      load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function remove(c) {
    if (!confirm(`Delete ${c.title}? All its questions and exam results will be deleted too.`)) return;
    try { await api(`/api/admin/courses/${c._id}`, { method: "DELETE" }); load(); } catch (err) { setError(err.message); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Courses" subtitle="Create a course, then open it to assign teachers and students." />
      <Notice onClose={() => setError("")}>{error}</Notice>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={create} className="panel h-fit space-y-3 p-5">
          <h2 className="text-lg font-semibold">Add a course</h2>
          <div><label className="label">Course title</label><input className="input" value={form.title} onChange={set("title")} required placeholder="e.g. General Science" /></div>
          <div><label className="label">Course code</label><input className="input uppercase" value={form.code} onChange={set("code")} required placeholder="e.g. SCI-101" /></div>
          <div><label className="label">Description (optional)</label><textarea className="input" rows={3} value={form.description} onChange={set("description")} /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create course"}</button>
        </form>

        <div className="space-y-3">
          {!courses ? <Loading /> : !courses.length ? (
            <Empty title="No courses yet">Create a course with the form, then assign people to it.</Empty>
          ) : courses.map((c) => (
            <div key={c._id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <span className="tag bg-sky text-ink/70">{c.code}</span>
                  {c.isExamOpen && <span className="tag bg-right/10 text-right">Exam open</span>}
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  {c.teachers.length ? c.teachers.map((t) => t.name).join(", ") : "No teacher assigned"} ·{" "}
                  {c.studentCount} student{c.studentCount === 1 ? "" : "s"} · {c.questionCount} question{c.questionCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/courses/${c._id}`} className="btn-primary">Assign people</Link>
                <button className="btn-danger" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
