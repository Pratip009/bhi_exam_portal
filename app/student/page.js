"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PageHeader, Notice, Loading, Empty } from "@/components/ui";

function Action({ c }) {
  const a = c.attempt;
  if (a?.status === "submitted") return <Link href={`/student/results/${a._id}`} className="btn-primary">View result</Link>;
  if (a?.status === "in_progress") return <Link href={`/student/exam/${c._id}`} className="btn-accent">Resume exam</Link>;
  if (c.isExamOpen && c.questionCount) return <Link href={`/student/exam/${c._id}`} className="btn-accent">Start exam</Link>;
  return <span className="text-sm text-ink/50">Not open yet</span>;
}

export default function StudentHome() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/student/courses").then(setCourses).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <PageHeader title="My exams" subtitle="Each exam can be taken once. There is no time limit, and your answers are saved as you go." />
      <Notice>{error}</Notice>
      {!courses ? (!error && <Loading />) : !courses.length ? (
        <Empty title="You are not enrolled in any course yet">Ask the institute office to add you to your courses.</Empty>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c._id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{c.title}</h2>
                  <span className="tag bg-sky text-ink/70">{c.code}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  {c.attempt?.status === "submitted"
                    ? `You scored ${c.attempt.score} out of ${c.attempt.total}`
                    : `${c.questionCount} questions${c.teachers.length ? ` · ${c.teachers.join(", ")}` : ""}`}
                </p>
              </div>
              <Action c={c} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
