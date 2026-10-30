# Bright Horizon Institute — Exam Portal

An MCQ examination system built with Next.js 14 (App Router) and MongoDB.

**Admin** creates teacher and student accounts (with passwords) and courses, then assigns teachers and students to each course.
**Teachers** add four-option (A–D) questions one by one or upload a CSV with the answer key, set the number of questions per student, open or close the exam, and see every student's score.
**Students** sign in, take the exam for each course they are enrolled in, then see their score with every question marked: their choice, the correct answer, and "You chose B, the correct answer is A" where they got it wrong. They can download the question paper and their result as PDFs.

The Bright Horizon Institute logo appears in the header and footer of every page, the login screen, the exam screen, the result page, the browser tab icon, and every page of both PDFs.

## Requirements

- Node.js 20 or newer
- MongoDB 6+ (local, Docker, or a free MongoDB Atlas cluster)

## Setup

```bash
npm install
cp .env.example .env.local      # then edit the values
npm run seed                    # creates the first admin account from .env.local
npm run dev                     # http://localhost:3000
```

`.env.local`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | e.g. `mongodb://127.0.0.1:27017/bright-horizon` or your Atlas connection string |
| `JWT_SECRET` | any long random string (generate one with `openssl rand -base64 32`) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME` | used once by `npm run seed` |

No MongoDB installed? `docker run -d -p 27017:27017 --name bhi-mongo mongo:7`

## Typical flow

1. Sign in as admin → **Teachers** / **Students**: create accounts and give each person their username and password.
2. **Courses**: create a course → **Assign people**: tick its teachers and students → **Save course**.
3. Sign in as the teacher → open the course → add questions or **Upload CSV** → **Exam settings**: set questions per student → **Open exam**.
4. Sign in as the student → **Start exam** → answer → **Submit exam** → review the result and download the PDFs.

## CSV format

```csv
question,optionA,optionB,optionC,optionD,answer
What is the capital of France?,Berlin,Madrid,Paris,Rome,C
"Text with a comma, in quotes",1,2,3,4,A
```

A sample is at `public/sample-questions.csv` (also downloadable from the Upload CSV tab). Headers are flexible (`Option A`, `option_a` or `A` all work), the answer can be `A`/`a`/`Option A`, and invalid rows are skipped with a row-by-row report while the valid rows are still imported. Save from Excel as **CSV UTF-8**.

## How the exam works

- Each student gets `questionsPerExam` questions (default 25), picked at random from the course's bank. If the bank is smaller, they get all of it.
- One attempt per student per course, with no time limit. The student submits when they are done.
- Each answer is saved as soon as it is picked, so a refresh or dropped connection resumes the exam where it was.
- The answer key is never sent to the browser until the exam is submitted.
- Questions are copied into the attempt, so later edits to the bank never change a submitted paper or result.

## Project structure

```
app/
  login/                      sign-in page
  admin/                      overview, teachers, students, courses, course assignment
  teacher/                    my courses, course workspace (bank, add, CSV, settings, results)
  student/                    my exams, exam screen, result review
  api/                        route handlers for auth, admin, teacher and student
components/                   Logo, AppShell (header/footer), UserManager, shared UI
lib/                          db, auth/JWT, API wrapper, grading, PDF generation, logo paths
models/                       User, Course, Question, Attempt (Mongoose)
middleware.js                 role-based route protection
scripts/seed-admin.mjs        creates the first admin
```

## Reports and downloads for admin and teachers

| What | Admin | Teacher | Where |
|---|---|---|---|
| Course results (every enrolled student, status, score, grade) | All courses | Own courses | Admin → Results → View results; Teacher → course → Results tab |
| Performance stats (average, highest, lowest, pass rate) | All courses | Own courses | Same pages |
| Submissions spreadsheet (CSV) | Yes | Yes | Course results → Submissions (CSV) |
| A student's result PDF (their answers vs correct answers) | Yes | Yes | Course results → Result |
| The question paper a student received | Yes | Yes | Course results → Paper |
| Full question paper of a course | Yes | Yes | Course results, or Teacher → Question bank |
| Answer key of a course | Yes | Yes | Same as above |
| Student report card (one page, all courses, grades) | All courses | Only courses they teach | Admin → Results → By student; Teacher → My students; or Course results → Report card |

Grades: A+ 90%+, A 80%+, B 70%+, C 60%+, D 50%+, F below 50%. Pass rate counts scores of 50% or more.

## PDF downloads

Both PDFs fit on **one A4 page**: one page for the question paper, one page for the result.

- Questions flow into one or two balanced columns, and the text size is chosen automatically: the largest size that still fits on the page.
- Short options sit side by side (A B C D on one line). Long options wrap, and for very wordy exams the options run on inline to save space.
- In the result, the correct answer has a green highlight, a wrong choice has a red highlight, and a note says "You chose C, the correct answer is A." A coloured bar beside each question shows correct (green), wrong (red) or not answered (grey).
- A typical 25-question exam prints at a comfortable size. Only very large exams (roughly 50+ long questions) can't fit and continue onto a second page, so they stay readable.

## Logo

The official Bright Horizon Institute logo is used throughout:
- `public/logo.png`: the blue logo, used on light backgrounds and in every PDF
- `public/logo-white.png`: a white version for the navy header, login screen and result banner
- `app/icon.png`: the browser tab icon

To update the logo, replace these three files with new PNGs of the same names (square, transparent background).

## Notes

- PDFs use the built-in Helvetica font, which supports basic Latin characters only. Accents and other scripts are simplified (é → e). For Hindi, Arabic and similar scripts, embed a Unicode TTF font with `@pdf-lib/fontkit`.
- Sessions last 8 hours and are stored in an httpOnly cookie.
- Admins can reset any teacher or student password from the Teachers / Students pages.
