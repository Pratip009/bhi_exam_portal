const LETTERS = ["A", "B", "C", "D"];

export function gradeAttempt(attempt, answers) {
  let score = 0;
  for (const q of attempt.questions) {
    const pick = answers?.[String(q.question)];
    if (LETTERS.includes(pick)) q.selected = pick;
    if (q.selected && q.selected === q.answer) score++;
  }
  attempt.score = score;
  attempt.total = attempt.questions.length;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
}

// What a student may see while the exam is running (no answer key).
export function publicQuestions(attempt) {
  return attempt.questions.map((q) => ({ id: String(q.question), text: q.text, options: q.options, selected: q.selected }));
}
