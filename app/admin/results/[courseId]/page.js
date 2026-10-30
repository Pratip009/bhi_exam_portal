"use client";

import Link from "next/link";
import CourseResults from "@/components/CourseResults";

export default function AdminCourseResults({ params }) {
  return (
    <>
      <Link href="/admin/results" className="mb-3 inline-block text-sm text-ink/60 hover:text-ink">← All results</Link>
      <CourseResults courseId={params.courseId} showTitle />
    </>
  );
}
