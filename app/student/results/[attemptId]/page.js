"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { LogoMark } from "@/components/Logo";
import { Notice, Loading } from "@/components/ui";

const LETTERS = ["A", "B", "C", "D"];

export default function ResultPage({ params }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => { api(`/api/student/attempts/${params.attemptId}`).then(setR).catch((e) => setError(e.message)); }, [params.attemptId]);

  if (!r) return error ? <Notice>{error}</Notice> : <Loading />;

  const unanswered = r.questions.filter((q) => !q.selected).length;
  const wrong = r.total - r.score - unanswered;
  const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
  const pdf = (type) => `/api/student/attempts/${r._id}/pdf?type=${type}`;
  const shown = r.questions.map((q, i) => ({ ...q, n: i + 1 })).filter((q) =>
    filter === "all" ? true : filter === "wrong" ? q.selected && q.selected !== q.answer : filter === "right" ? q.selected === q.answer : !q.selected);

  return (
    <>
      <Link href="/student" className="text-sm text-ink/60 hover:text-ink">← My exams</Link>

      <section className="panel mt-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-ink p-6 text-white">
          <div className="flex items-center gap-4">
            <LogoMark size={64} light />
            <div>
              <p className="text-sm text-white/60">Bright Horizon Institute · Exam result</p>
              <h1 className="font-display text-2xl font-semibold text-white">{r.course?.title}</h1>
              <p className="text-sm text-white/60">{r.course?.code} · submitted {new Date(r.submittedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-5xl font-semibold text-dawn">{r.score}<span className="text-2xl text-white/60"> / {r.total}</span></p>
            <p className="text-sm text-white/70">{pct}% correct</p>
          </div>
        </div>
        <div className="h-1 bg-dawn" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <dl className="flex gap-8 text-sm">
            <div><dt className="text-ink/50">Correct</dt><dd className="font-display text-2xl text-right">{r.score}</dd></div>
            <div><dt className="text-ink/50">Wrong</dt><dd className="font-display text-2xl text-wrong">{wrong}</dd></div>
            <div><dt className="text-ink/50">Not answered</dt><dd className="font-display text-2xl text-ink/60">{unanswered}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <a href={pdf("paper")} download className="btn-ghost">Download question paper (PDF)</a>
            <a href={pdf("result")} download className="btn-primary">Download result (PDF)</a>
          </div>
        </div>
      </section>

      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Answer review</h2>
        <div className="flex gap-1 rounded-lg bg-paper p-1 text-sm">
          {[["all", "All"], ["wrong", "Wrong"], ["right", "Correct"], ["skipped", "Not answered"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1.5 ${filter === k ? "bg-ink text-white" : "text-ink/70 hover:bg-sky"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {shown.map((q) => {
          const ok = q.selected === q.answer;
          return (
            <article key={q.id} className={`panel border-l-4 p-5 ${!q.selected ? "border-l-ink/20" : ok ? "border-l-right" : "border-l-wrong"}`}>
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium">{q.n}. {q.text}</p>
                <span className={`tag shrink-0 ${!q.selected ? "bg-sky text-ink/60" : ok ? "bg-right/10 text-right" : "bg-wrong/10 text-wrong"}`}>
                  {!q.selected ? "Not answered" : ok ? "Correct" : "Wrong"}
                </span>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {LETTERS.map((L) => {
                  const isAns = L === q.answer, isPick = L === q.selected;
                  const style = isAns ? "bg-right/10 text-right font-medium ring-1 ring-right/40" : isPick ? "bg-wrong/10 text-wrong font-medium ring-1 ring-wrong/40" : "bg-sky/60";
                  return (
                    <li key={L} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${style}`}>
                      <span className="font-display font-semibold">{L}</span>
                      <span className="flex-1">{q.options[L]}</span>
                      {isPick && <span className="text-xs">Your answer</span>}
                      {isAns && !isPick && <span className="text-xs">Correct answer</span>}
                    </li>
                  );
                })}
              </ul>
              {q.selected && !ok && <p className="mt-3 text-sm text-wrong">You chose {q.selected}. The correct answer is {q.answer}.</p>}
              {!q.selected && <p className="mt-3 text-sm text-ink/60">The correct answer is {q.answer}.</p>}
            </article>
          );
        })}
        {!shown.length && <p className="py-6 text-center text-ink/50">No questions in this group.</p>}
      </div>
    </>
  );
}
