"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading } from "@/components/ui";

const CARDS = [
  { key: "teachers", label: "Teachers", href: "/admin/teachers" },
  { key: "students", label: "Students", href: "/admin/students" },
  { key: "courses", label: "Courses", href: "/admin/courses" },
  { key: "questions", label: "Questions in the bank" },
  { key: "exams", label: "Exams submitted", href: "/admin/results" },
];

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/admin/stats").then(setStats).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <PageHeader title="Overview" subtitle="Create accounts and courses, then assign people to each course." />
      <Notice>{error}</Notice>
      {!stats && !error ? <Loading /> : stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {CARDS.map((c) => {
            const body = (
              <>
                <div className="font-display text-4xl font-semibold">{stats[c.key]}</div>
                <div className="mt-1 text-sm text-ink/60">{c.label}</div>
              </>
            );
            return c.href ? (
              <Link key={c.key} href={c.href} className="panel p-5 hover:border-ink/30">{body}</Link>
            ) : (
              <div key={c.key} className="panel p-5">{body}</div>
            );
          })}
        </div>
      )}
      <div className="panel mt-8 p-6">
        <h2 className="text-xl font-semibold">Getting a course ready</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/80">
          <li>Add teacher and student accounts, and share each username and password with its owner.</li>
          <li>Create the course.</li>
          <li>Open the course and tick the teachers and students who belong to it.</li>
          <li>The teacher adds questions, sets how many each student gets, and opens the exam.</li>
        </ol>
      </div>
    </>
  );
}
