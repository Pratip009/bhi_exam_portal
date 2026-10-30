"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading } from "@/components/ui";

function Picker({ title, people, selected, onToggle, onAll, emptyHint }) {
  const [q, setQ] = useState("");
  const shown = people.filter((p) => !q || [p.name, p.username, p.rollNo].some((v) => v?.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="panel flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-ink/60">{selected.size} selected</span>
      </div>
      {!people.length ? <p className="text-sm text-ink/60">{emptyHint}</p> : (
        <>
          <div className="mb-2 flex gap-2">
            <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => onAll(shown, true)}>Select all</button>
            <button type="button" className="btn-ghost" onClick={() => onAll(shown, false)}>Clear</button>
          </div>
          <ul className="max-h-96 divide-y divide-ink/5 overflow-y-auto rounded-lg border border-ink/10">
            {shown.map((p) => (
              <li key={p._id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-sky">
                  <input type="checkbox" className="h-4 w-4 accent-ink" checked={selected.has(p._id)} onChange={() => onToggle(p._id)} />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-ink/50">{p.rollNo || p.username}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function CourseAssign({ params }) {
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selT, setSelT] = useState(new Set());
  const [selS, setSelS] = useState(new Set());
  const [details, setDetails] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api(`/api/admin/courses/${params.id}`), api("/api/admin/users?role=teacher"), api("/api/admin/users?role=student")])
      .then(([c, t, s]) => {
        setCourse(c); setTeachers(t); setStudents(s);
        setSelT(new Set(c.teachers.map(String))); setSelS(new Set(c.students.map(String)));
        setDetails({ title: c.title, description: c.description || "" });
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  const toggler = (setter) => (id) => setter((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulk = (setter) => (list, on) => setter((prev) => { const n = new Set(prev); list.forEach((p) => (on ? n.add(p._id) : n.delete(p._id))); return n; });

  async function save() {
    setBusy(true); setError(""); setMsg("");
    try {
      await api(`/api/admin/courses/${params.id}`, { method: "PUT", body: { ...details, teachers: [...selT], students: [...selS] } });
      setMsg("Course saved.");
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  if (!course) return error ? <Notice>{error}</Notice> : <Loading />;

  return (
    <>
      <Link href="/admin/courses" className="text-sm text-ink/60 hover:text-ink">← All courses</Link>
      <PageHeader
        title={course.title}
        subtitle={`Course code ${course.code}`}
        action={<button className="btn-accent" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save course"}</button>}
      />
      <Notice onClose={() => setError("")}>{error}</Notice>
      <Notice kind="success" onClose={() => setMsg("")}>{msg}</Notice>

      <div className="panel mb-6 grid gap-4 p-5 md:grid-cols-2">
        <div><label className="label">Course title</label><input className="input" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} /></div>
        <div><label className="label">Description</label><input className="input" value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Picker title="Teachers" people={teachers} selected={selT} onToggle={toggler(setSelT)} onAll={bulk(setSelT)} emptyHint="Create teacher accounts first, on the Teachers page." />
        <Picker title="Students" people={students} selected={selS} onToggle={toggler(setSelS)} onAll={bulk(setSelS)} emptyHint="Create student accounts first, on the Students page." />
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-accent" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save course"}</button>
      </div>
    </>
  );
}
