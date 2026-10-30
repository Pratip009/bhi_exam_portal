"use client";

import { PageHeader } from "@/components/ui";
import StudentPerformance from "@/components/StudentPerformance";

export default function TeacherStudents() {
  return (
    <>
      <PageHeader title="My students" subtitle="Students in your courses. Report cards include only the courses you teach." />
      <StudentPerformance />
    </>
  );
}
