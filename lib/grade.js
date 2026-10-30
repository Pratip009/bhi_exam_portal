// Shared by the PDFs and the screens so grades always match.
export function gradeFor(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export const percent = (score, total) => (total ? Math.round((score / total) * 100) : 0);
