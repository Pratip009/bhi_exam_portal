"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "@/components/ui";

export default function TeacherHome() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/teacher/courses").then(setCourses).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <PageHeader title="My courses" subtitle="Add questions and open the exam when students are ready." />
      <Notice>{error}</Notice>
      {!courses ? (!error && <Loading />) : !courses.length ? (
        <Empty title="No courses assigned yet">The administrator assigns teachers to courses. Courses appear here once you are assigned.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <Link key={c._id} href={`/teacher/courses/${c._id}`} className="panel block p-5 hover:border-ink/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{c.title}</h2>
                  <p className="text-sm text-ink/60">{c.code}</p>
                </div>
                <span className={`tag ${c.isExamOpen ? "bg-right/10 text-right" : "bg-sky text-ink/60"}`}>{c.isExamOpen ? "Exam open" : "Exam closed"}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-ink/50">Questions</dt><dd className="font-display text-2xl">{c.questionCount}</dd></div>
                <div><dt className="text-ink/50">Students</dt><dd className="font-display text-2xl">{c.studentCount}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
