"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { LogoMark } from "@/components/Logo";
import { Notice, Loading } from "@/components/ui";

const LETTERS = ["A", "B", "C", "D"];

export default function ExamPage({ params }) {
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef({});
  const submittedRef = useRef(false);

  // Start or resume
  useEffect(() => {
    api(`/api/student/exam/${params.courseId}/start`, { method: "POST" })
      .then((d) => {
        if (d.status === "submitted") return router.replace(`/student/results/${d.attemptId}`);
        const saved = Object.fromEntries(d.questions.filter((q) => q.selected).map((q) => [q.id, q.selected]));
        answersRef.current = saved;
        setAnswers(saved);
        setExam(d);
      })
      .catch((e) => setError(e.message));
  }, [params.courseId, router]);

  const submit = useCallback(async () => {
    if (submittedRef.current || !exam) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await api(`/api/student/attempts/${exam.attemptId}/submit`, { method: "POST", body: { answers: answersRef.current } });
      router.replace(`/student/results/${exam.attemptId}`);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(`${e.message} Check your connection and press Submit again.`);
    }
  }, [exam, router]);

  // Warn before leaving mid-exam
  useEffect(() => {
    const warn = (e) => { if (!submittedRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function choose(qid, letter) {
    const next = { ...answersRef.current, [qid]: letter };
    answersRef.current = next;
    setAnswers(next);
    // save progress so a refresh or lost connection doesn't lose answers
    api(`/api/student/attempts/${exam.attemptId}`, { method: "PATCH", body: { questionId: qid, selected: letter } }).catch(() => {});
  }

  if (error && !exam) return <Notice>{error}</Notice>;
  if (!exam) return <Loading label="Preparing your exam…" />;

  const qs = exam.questions;
  const q = qs[current];
  const answered = qs.filter((x) => answers[x.id]).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <LogoMark size={48} />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{exam.course.title}</h1>
            <p className="text-sm text-ink/60">{exam.course.code} · Bright Horizon Institute</p>
          </div>
        </div>
        <Notice onClose={() => setError("")}>{error}</Notice>

        <article className="panel p-6">
          <p className="text-sm text-ink/50">Question {current + 1} of {qs.length}</p>
          <h2 className="mt-2 font-sans text-lg font-medium leading-relaxed">{q.text}</h2>
          <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-3">
            {LETTERS.map((L) => {
              const on = answers[q.id] === L;
              return (
                <button key={L} role="radio" aria-checked={on} onClick={() => choose(q.id, L)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-3 text-left transition-colors ${on ? "border-ink bg-ink text-white" : "border-ink/10 bg-paper hover:border-ink/40"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-xl font-semibold ${on ? "bg-dawn text-ink" : "bg-sky"}`}>{L}</span>
                  <span>{q.options[L]}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button className="btn-ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</button>
            {current < qs.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent(current + 1)}>Next question</button>
            ) : (
              <button className="btn-accent" onClick={() => setConfirming(true)}>Finish exam</button>
            )}
          </div>
        </article>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="panel p-4">
          <p className="text-sm text-ink/60">{answered} of {qs.length} answered</p>
          <div className="mb-3 mt-2 h-1.5 overflow-hidden rounded-full bg-sky" aria-hidden>
            <div className="h-full bg-dawn transition-all" style={{ width: `${(answered / qs.length) * 100}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {qs.map((x, i) => (
              <button key={x.id} onClick={() => setCurrent(i)} aria-label={`Question ${i + 1}${answers[x.id] ? ", answered" : ""}`}
                className={`h-9 rounded-md text-sm font-medium ${i === current ? "ring-2 ring-dawn ring-offset-1" : ""} ${answers[x.id] ? "bg-ink text-white" : "bg-sky text-ink"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button className="btn-accent mt-4 w-full" onClick={() => setConfirming(true)} disabled={submitting}>Submit exam</button>
        </div>
      </aside>

      {(confirming || submitting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true">
          <div className="panel w-full max-w-sm p-6">
            {submitting ? (
              <p className="text-center">Submitting your answers…</p>
            ) : (
              <>
                <h2 className="text-xl font-semibold">Submit your exam?</h2>
                <p className="mt-2 text-sm text-ink/70">
                  {answered === qs.length ? "You have answered every question." : `${qs.length - answered} question${qs.length - answered === 1 ? " is" : "s are"} not answered. Unanswered questions score zero.`}{" "}
                  You can't change answers after submitting.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setConfirming(false)}>Keep working</button>
                  <button className="btn-accent" onClick={() => { setConfirming(false); submit(); }}>Submit exam</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
